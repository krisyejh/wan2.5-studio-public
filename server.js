const express = require('express');
const cors = require('cors');
const multer = require('multer');
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

    // Get mode and upscaleFactor from form data
    const mode = req.body.mode || 'base';
    const upscaleFactor = parseInt(req.body.upscaleFactor) || 2;
    let imageUrl = null;

    // If a file is uploaded, we need to upload it first to get a URL
    if (req.file) {
      // VIAPI requires a publicly accessible URL
      if (ossClient) {
        // Upload to OSS to get public URL
        const fileName = `super-resolution/${Date.now()}-${req.file.originalname}`;
        const result = await ossClient.put(fileName, req.file.buffer);
        imageUrl = result.url;
      } else {
        // Convert to base64 data URL (fallback, may not work with VIAPI)
        const base64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        imageUrl = `data:${mimeType};base64,${base64}`;
      }
    } else if (req.body.imageUrl) {
      // If URL is provided directly
      imageUrl = req.body.imageUrl;
    }

    // Validate required parameters
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAMETER', message: 'Image file or URL is required' }
      });
    }

    console.log('📸 Processing super-resolution request:', { mode, upscaleFactor, hasFile: !!req.file });
    const startTime = Date.now();

    // Prepare request
    const request = new (require('@alicloud/imageenhan20190930').MakeSuperResolutionImageRequest)({
      url: imageUrl,
      mode: mode,
      upscaleFactor: upscaleFactor
    });

    const runtime = new Util.RuntimeOptions({});

    // Call VIAPI super-resolution API
    const response = await imageenhanClient.makeSuperResolutionImageWithOptions(request, runtime);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Super-resolution completed in ${processingTime}ms`);

    // Extract result URL from response
    const resultUrl = response.body?.data?.imageURL;
    
    if (!resultUrl) {
      throw new Error('No result URL returned from API');
    }

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

    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Stream the response from DashScope to client
    response.body.pipe(res);

    // Handle errors during streaming
    response.body.on('error', (error) => {
      console.error('❌ Streaming error:', error);
      res.end();
    });

    // Clean up when response ends
    res.on('close', () => {
      console.log('✅ Storyboard streaming completed');
    });

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

// Generic DashScope API proxy (for synchronous and asynchronous calls)
app.all('/api/v1/*', async (req, res) => {
  try {
    const apiKey = process.env.VITE_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        request_id: '',
        code: 'SERVICE_UNAVAILABLE',
        message: 'API_KEY not configured. Please set VITE_API_KEY in .env file.'
      });
    }

    // Construct the full DashScope URL
    const dashscopeUrl = `https://dashscope.aliyuncs.com${req.originalUrl}`;
    console.log(`🔄 Proxying ${req.method} request to:`, dashscopeUrl);

    // Prepare headers - forward client headers and add auth
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    // Only add X-DashScope-Async header if it's present in the original request
    if (req.headers['x-dashscope-async']) {
      headers['X-DashScope-Async'] = req.headers['x-dashscope-async'];
      console.log('  ⏳ Async mode enabled');
    } else {
      console.log('  ⚡ Sync mode (no async header)');
    }

    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    // Add body for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
      fetchOptions.body = JSON.stringify(req.body);
      console.log('  📦 Request body:', JSON.stringify(req.body, null, 2));
    }

    // Make the request to DashScope
    const response = await fetch(dashscopeUrl, fetchOptions);
    const responseData = await response.json();

    console.log(`  ${response.ok ? '✅' : '❌'} DashScope response:`, response.status, responseData.request_id || '');

    // Forward the response status and data
    res.status(response.status).json(responseData);

  } catch (error) {
    console.error('❌ DashScope proxy error:', error);
    res.status(500).json({
      request_id: '',
      code: 'PROXY_ERROR',
      message: error.message || 'Internal proxy error'
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
  console.log(`🔄 DashScope API proxy: http://localhost:${PORT}/api/v1/*`);
});
