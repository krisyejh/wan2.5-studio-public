# Image Super-Resolution Setup Guide

## Overview

The Image Super-Resolution feature has been successfully implemented using Alibaba Cloud VIAPI. This guide explains how to configure and use the feature.

## Architecture

```
Frontend (React) → Backend Proxy (Express) → Alibaba Cloud VIAPI
```

### Components

1. **Frontend**: `/src/components/SuperResolutionTool.tsx`
   - Image upload with drag & drop
   - Parameter selection (mode, upscale factor)
   - Result display with before/after comparison
   - Download functionality

2. **Backend**: `/server.cjs`
   - Image upload endpoint
   - VIAPI integration
   - Error handling

3. **API Service**: `/src/services/toolsApi.ts`
   - Image validation
   - API communication
   - File handling

## Configuration

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required: Alibaba Cloud Access Credentials
VITE_ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id_here
VITE_ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret_here

# Optional: OSS Configuration (for large images)
VITE_OSS_REGION=oss-cn-shanghai
VITE_OSS_BUCKET=your_bucket_name_here
```

### 2. Get Access Credentials

1. Visit [RAM Console](https://ram.console.aliyun.com/manage/ak)
2. Create or select a RAM user
3. Generate AccessKey ID and AccessKey Secret
4. Grant permissions: `AliyunVIAPIFullAccess`

### 3. Optional: OSS Setup

For better performance with large images:

1. Create an OSS bucket in Shanghai region
2. Set bucket ACL to public-read
3. Add bucket name to `.env`

## Running the Application

### Development Mode

Option 1: Run both servers together
```bash
npm run dev:all
```

Option 2: Run separately
```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev
```

### Access the Application

- Frontend: http://localhost:5173 (or 5174 if 5173 is in use)
- Backend: http://localhost:3001
- Health Check: http://localhost:3001/health

## Features

### Supported Parameters

1. **Mode**
   - `base`: Faster processing, good quality
   - `advanced`: Slower processing, higher quality

2. **Upscale Factor**
   - `2×`: Doubles resolution (width × 2, height × 2)
   - `4×`: Quadruples resolution (width × 4, height × 4)

### File Constraints

- **Formats**: JPG, JPEG, PNG
- **Max Size**: 10MB
- **Recommended**: Images under 2000×2000 pixels for faster processing

## Usage Workflow

1. Navigate to "Tools" section
2. Click on "Image Super-Resolution" card
3. Upload image (drag & drop or click to browse)
4. Select processing mode and upscale factor
5. Click "Enhance Image"
6. Wait for processing (typically 3-10 seconds)
7. Review before/after comparison
8. Download enhanced image

## API Details

### Upload Endpoint

```
POST /api/upload-image
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "url": "https://..."
}
```

### Super-Resolution Endpoint

```
POST /api/super-resolution
Content-Type: application/json

Request:
{
  "imageUrl": "https://...",
  "mode": "base",
  "upscaleFactor": 2
}

Response:
{
  "success": true,
  "imageUrl": "https://...",
  "metadata": {
    "originalSize": { "width": 800, "height": 600 },
    "enhancedSize": { "width": 1600, "height": 1200 },
    "processingTime": 3245,
    "requestId": "..."
  }
}
```

## Troubleshooting

### Server Warnings

**"VIAPI credentials not configured"**
- Add `VITE_ALIBABA_CLOUD_ACCESS_KEY_ID` and `VITE_ALIBABA_CLOUD_ACCESS_KEY_SECRET` to `.env`

**"OSS configuration not complete"**
- Optional: Image upload will use base64 encoding instead
- For production, configure OSS for better performance

### Common Errors

**"Service Unavailable"**
- Check if credentials are set in `.env`
- Verify credentials have VIAPI permissions

**"Processing Failed"**
- Check image file size (< 10MB)
- Verify image format (JPG, PNG only)
- Check internet connection to Alibaba Cloud

**"Upload Failed"**
- Verify file is a valid image
- Check file size limit
- Ensure backend server is running

## Technical Notes

### Image Upload Strategy

1. **Without OSS**: Images are converted to base64 data URLs
   - Pros: Simple setup, no additional configuration
   - Cons: Limited to smaller images due to URL length limits

2. **With OSS**: Images are uploaded to Alibaba Cloud OSS
   - Pros: Supports larger images, better performance
   - Cons: Requires OSS bucket configuration

### Security

- All API credentials are stored in `.env` (not committed to git)
- Credentials are only used in backend server
- Frontend never exposes AccessKey ID/Secret
- CORS is properly configured

### Performance

- Average processing time: 3-10 seconds
- Varies based on:
  - Image size
  - Selected mode (base vs advanced)
  - Network latency
  - VIAPI service load

## Dependencies

```json
{
  "@alicloud/imageenhan20190930": "^2.0.6",
  "@alicloud/openapi-client": "^0.4.11",
  "@alicloud/tea-util": "^1.4.7",
  "ali-oss": "^6.20.0",
  "multer": "^1.4.5-lts.1"
}
```

## Next Steps

1. Configure your credentials in `.env`
2. Start the servers with `npm run dev:all`
3. Navigate to Tools → Image Super-Resolution
4. Upload a test image to verify everything works

## References

- [VIAPI Documentation](https://help.aliyun.com/zh/viapi/use-cases/image-super-points-1)
- [Image Super-Resolution API](https://help.aliyun.com/zh/viapi/developer-reference/api-imageenhan-2019-09-30-makesuperresolutionimage)
- [AccessKey Management](https://ram.console.aliyun.com/manage/ak)
