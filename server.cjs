const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const OSS = require('ali-oss');
const ImageenhanClient = require('@alicloud/imageenhan20190930').default;
const OpenApi = require('@alicloud/openapi-client');
const Util = require('@alicloud/tea-util');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize OSS client (optional - for actual file upload)
function createOSSClient() {
  const ossRegion = process.env.VITE_OSS_REGION || 'oss-cn-shanghai';
  const ossBucket = process.env.VITE_OSS_BUCKET;
  const accessKeyId = process.env.VITE_ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.VITE_ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  
  if (!ossBucket || !accessKeyId || !accessKeySecret) {
    console.warn('⚠️  OSS configuration not complete. Image upload to OSS disabled.');
    return null;
  }
  
  return new OSS({
    region: ossRegion,
    accessKeyId,
    accessKeySecret,
    bucket: ossBucket
  });
}

const ossClient = createOSSClient();

// Initialize VIAPI client for super-resolution
function createImageenhanClient() {
  const accessKeyId = process.env.VITE_ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.VITE_ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  
  if (!accessKeyId || !accessKeySecret) {
    console.warn('⚠️  VIAPI credentials not configured. Super-resolution will not work.');
    return null;
  }
  
  const config = new OpenApi.Config({
    accessKeyId,
    accessKeySecret,
    endpoint: 'imageenhan.cn-shanghai.aliyuncs.com',
    regionId: 'cn-shanghai'
  });
  
  return new ImageenhanClient(config);
}

const imageenhanClient = createImageenhanClient();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'WanStudio Backend Proxy' });
});

// Image upload endpoint
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No image file uploaded' }
      });
    }

    // If OSS is configured, upload to OSS
    if (ossClient) {
      const fileName = `super-resolution/${Date.now()}-${req.file.originalname}`;
      const result = await ossClient.put(fileName, req.file.buffer);
      
      return res.json({
        success: true,
        url: result.url
      });
    }
    
    // Otherwise, convert to base64 data URL
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    return res.json({
      success: true,
      url: dataUrl
    });
  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || 'Failed to upload image'
      }
    });
  }
});

// Super-resolution proxy endpoint
app.post('/api/super-resolution', upload.single('image'), async (req, res) => {
  try {
    // Check if client is initialized
    if (!imageenhanClient) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'VIAPI credentials not configured. Please set VITE_ALIBABA_CLOUD_ACCESS_KEY_ID and VITE_ALIBABA_CLOUD_ACCESS_KEY_SECRET in .env file.'
        }
      });
    }

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'Image file is required' }
      });
    }

    // Get mode and upscaleFactor from form data
    const mode = req.body.mode || 'base';
    const upscaleFactor = parseInt(req.body.upscaleFactor) || 2;

    console.log('📸 Processing super-resolution request:', { mode, upscaleFactor, fileSize: req.file.size });
    const startTime = Date.now();

    // Write buffer to temporary file for VIAPI SDK
    const tempDir = os.tmpdir();
    const tempFileName = `super-res-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    await fs.promises.writeFile(tempFilePath, req.file.buffer);
    console.log('✍️  Wrote temp file:', tempFilePath);

    // Create file stream for VIAPI SDK
    const fileStream = fs.createReadStream(tempFilePath);
    
    // Use MakeSuperResolutionImageAdvanceRequest with local file stream
    const AdvanceRequest = require('@alicloud/imageenhan20190930').MakeSuperResolutionImageAdvanceRequest;
    const request = new AdvanceRequest();
    
    // Set urlObject (not imageUrlObject) as per official documentation
    request.urlObject = fileStream;
    request.upscaleFactor = upscaleFactor;
    request.mode = mode;

    const runtime = new Util.RuntimeOptions({});

    // Call VIAPI super-resolution API with Advance method
    const response = await imageenhanClient.makeSuperResolutionImageAdvance(request, runtime);
    
    // Clean up temporary file
    try {
      await fs.promises.unlink(tempFilePath);
      console.log('🗑️  Deleted temp file:', tempFilePath);
    } catch (unlinkError) {
      console.warn('⚠️  Failed to delete temp file:', unlinkError.message);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Super-resolution completed in ${processingTime}ms`);
    
    // Log full response structure for debugging
    console.log('🔍 Response structure:', JSON.stringify({
      hasBody: !!response.body,
      hasData: !!response.body?.data,
      dataKeys: response.body?.data ? Object.keys(response.body.data) : [],
      requestId: response.body?.requestId
    }, null, 2));

    // Extract result URL from response - try multiple possible field names
    const resultUrl = response.body?.data?.imageURL || 
                      response.body?.data?.ImageURL ||
                      response.body?.data?.url ||
                      response.body?.data?.Url;
    
    if (!resultUrl) {
      console.error('❌ Full response.body.data:', JSON.stringify(response.body?.data, null, 2));
      throw new Error('No result URL returned from API. Check logs for response structure.');
    }
    
    console.log('✅ Result URL:', resultUrl);

    // Return success response with metadata
    return res.json({
      success: true,
      imageUrl: resultUrl,
      metadata: {
        originalSize: {
          width: response.body?.data?.width || 0,
          height: response.body?.data?.height || 0
        },
        enhancedSize: {
          width: (response.body?.data?.width || 0) * upscaleFactor,
          height: (response.body?.data?.height || 0) * upscaleFactor
        },
        processingTime,
        requestId: response.body?.requestId || ''
      }
    });
  } catch (error) {
    console.error('❌ Super-resolution error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Internal server error'
      }
    });
  }
});

// Agent streaming proxy endpoint for Bailian workflow
app.post('/api/agents/storyboard', async (req, res) => {
  try {
    const { appId, input, parameters } = req.body;

    // Validate required parameters
    if (!appId || !input || !input.prompt) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'App ID and input.prompt are required' }
      });
    }

    const apiKey = process.env.VITE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'API_KEY not configured. Please set VITE_API_KEY in .env file.'
        }
      });
    }

    console.log('🎬 Processing storyboard generation request for app:', appId);

    // Call DashScope workflow API
    const dashscopeUrl = `https://dashscope.aliyuncs.com/api/v1/apps/${appId}/completion`;
    
    const response = await fetch(dashscopeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable',
      },
      body: JSON.stringify({
        input: input,
        parameters: parameters || { flow_stream_mode: 'message_format' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DashScope API error:', response.status, errorText);
      return res.status(response.status).json({
        success: false,
        error: {
          code: 'DASHSCOPE_ERROR',
          message: `DashScope API returned ${response.status}: ${errorText}`
        }
      });
    }

    // Set headers for SSE streaming with long timeout support
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Send keepalive comments every 15 seconds to prevent timeout
    const keepaliveInterval = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': keepalive\n\n');
      }
    }, 15000);

    // Convert Web Streams API ReadableStream to Node.js stream and pipe to response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let streamActive = true;
    let lastActivityTime = Date.now();
    const startTime = Date.now();

    // Handle client disconnect
    req.on('close', () => {
      streamActive = false;
      clearInterval(keepaliveInterval);
      reader.cancel().catch(() => {});
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`⚠️  Client disconnected from streaming after ${duration}s`);
    });

    try {
      while (streamActive) {
        const { done, value } = await reader.read();
        
        if (done) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`✅ Stream completed successfully in ${duration}s`);
          clearInterval(keepaliveInterval);
          res.end();
          break;
        }

        // Update activity timestamp
        lastActivityTime = Date.now();

        // Write the chunk to the response
        const chunk = decoder.decode(value, { stream: true });
        
        // Check if client is still connected before writing
        if (streamActive && !res.writableEnded) {
          res.write(chunk);
        } else {
          break;
        }
      }
    } catch (streamError) {
      clearInterval(keepaliveInterval);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`❌ Streaming error after ${duration}s:`, streamError);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: { code: 'STREAMING_ERROR', message: streamError.message }
        });
      } else if (!res.writableEnded) {
        res.end();
      }
    } finally {
      // Ensure cleanup
      clearInterval(keepaliveInterval);
      if (reader) {
        reader.releaseLock();
      }
    }

  } catch (error) {
    console.error('❌ Storyboard generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error'
        }
      });
    }
  }
});

// DashScope API proxy for model endpoints (T2I, I2I, I2V, KF2V)
app.post('/api/v1/services/aigc/*', async (req, res) => {
  try {
    const apiKey = process.env.VITE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        code: 'SERVICE_UNAVAILABLE',
        message: 'API_KEY not configured. Please set VITE_API_KEY in .env file.'
      });
    }

    // Build the full DashScope URL - keep /api prefix in the DashScope URL
    // req.path is like: /api/v1/services/aigc/text2image/image-synthesis
    const dashscopeUrl = `https://dashscope.aliyuncs.com${req.path}`;
    
    console.log(`🎨 Proxying request to: ${dashscopeUrl}`);

    // Forward the request to DashScope
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization || `Bearer ${apiKey}`,
    };

    // Only add X-DashScope-Async header if it's present in the request
    if (req.headers['x-dashscope-async']) {
      headers['X-DashScope-Async'] = req.headers['x-dashscope-async'];
      console.log('  ⏳ Async mode enabled');
    } else {
      console.log('  ⚡ Sync mode (no async header)');
    }

    const response = await fetch(dashscopeUrl, {
      method: req.method,
      headers: headers,
      body: JSON.stringify(req.body)
    });

    // Get response text first to handle empty responses
    const responseText = await response.text();
    
    // Try to parse as JSON
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error(`❌ Failed to parse response as JSON. Status: ${response.status}, Body:`, responseText.substring(0, 200));
      return res.status(500).json({
        code: 'PARSE_ERROR',
        message: 'Invalid JSON response from DashScope API',
        details: responseText.substring(0, 200)
      });
    }

    // Log the response for debugging
    if (!response.ok) {
      console.error(`❌ DashScope API error (${response.status}):`, data);
    } else {
      console.log(`✅ DashScope API success:`, data.output?.task_id || data.request_id);
    }

    // Forward the response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      code: 'PROXY_ERROR',
      message: error.message || 'Failed to proxy request to DashScope'
    });
  }
});

// DashScope task query proxy
app.get('/api/v1/tasks/:taskId', async (req, res) => {
  try {
    const apiKey = process.env.VITE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        code: 'SERVICE_UNAVAILABLE',
        message: 'API_KEY not configured. Please set VITE_API_KEY in .env file.'
      });
    }

    const { taskId } = req.params;
    const dashscopeUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;
    
    console.log(`🔍 Querying task status: ${taskId}`);

    const response = await fetch(dashscopeUrl, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.authorization || `Bearer ${apiKey}`,
      }
    });

    // Get response text first
    const responseText = await response.text();
    
    // Try to parse as JSON
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error(`❌ Failed to parse task query response. Status: ${response.status}, Body:`, responseText.substring(0, 200));
      return res.status(500).json({
        code: 'PARSE_ERROR',
        message: 'Invalid JSON response from DashScope API'
      });
    }

    // Log task status
    if (data.output?.task_status) {
      console.log(`📊 Task ${taskId} status: ${data.output.task_status}`);
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Task query error:', error);
    res.status(500).json({
      code: 'QUERY_ERROR',
      message: error.message || 'Failed to query task status'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WanStudio Backend Proxy running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Image upload: http://localhost:${PORT}/api/upload-image`);
  console.log(`🛠️  Super-resolution: http://localhost:${PORT}/api/super-resolution`);
  console.log(`🎬 Storyboard generation: http://localhost:${PORT}/api/agents/storyboard`);
});
