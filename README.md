# Wanxiang Model Experience Frontend

A frontend application for experiencing and interacting with the latest Wanxiang AI models for image and video generation.

## Supported Models

- **wan2.5-t2i-preview** - Text-to-Image Generation (Synchronous)
- **wan2.5-i2i-preview** - Image-to-Image Editing & Multi-image Fusion (Asynchronous)
- **wan2.5-i2v-preview** - Image-to-Video with Audio Support (Asynchronous)
- **wan2.2-kf2v-flash** - Keyframe-to-Video Generation (Asynchronous)

## Features

✨ **Multi-Model Support** - Experience four different AI models in one application

🎨 **Intuitive Interface** - Card-based model selection with dynamic parameter forms

📁 **Image Upload** - Drag-and-drop image upload with validation and preview

⚡ **Real-time Status** - Live task status monitoring for async operations

📥 **Easy Download** - One-click download of generated images and videos

🎬 **Video Playback** - Built-in video player for generated content

## Prerequisites

- Node.js 18+ and npm
- Alibaba Cloud Bailian API Key (get from [Model Studio](https://help.aliyun.com/zh/model-studio/get-api-key))

## Installation

1. Clone or navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your API key:
```
VITE_API_KEY=your_api_key_here
```

## Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage Guide

### 1. Select a Model

Click on one of the four model cards to begin:
- Text-to-Image for generating images from descriptions
- Image-to-Image for editing or combining images
- Image-to-Video for creating videos from images
- Keyframe-to-Video for smooth transitions between frames

### 2. Configure Parameters

- **Text-to-Image**: Enter a text prompt describing the desired image
- **Image-to-Image**: Upload 1-2 images and describe the editing instructions
- **Image-to-Video**: Upload a first frame image and describe the motion
- **Keyframe-to-Video**: Upload first (and optionally last) frame images

Each model has specific parameters like resolution, watermark settings, and more.

### 3. Generate Content

Click "Generate" to submit your request:
- Synchronous models (T2I) return results immediately
- Asynchronous models show progress and poll for completion

### 4. View and Download Results

Once generation is complete:
- View images in the built-in viewer
- Play videos in the video player
- Download content before it expires (24-hour validity)

## Project Structure

```
src/
├── components/          # React components
│   ├── App.tsx         # Main application
│   ├── ModelSelection.tsx
│   ├── ParameterForm.tsx
│   ├── ImageUpload.tsx
│   ├── TaskStatus.tsx
│   └── ResultDisplay.tsx
├── context/            # React Context for state management
│   └── AppContext.tsx
├── services/           # API integration
│   └── api.ts
├── config/             # Model configurations
│   └── models.ts
├── types/              # TypeScript type definitions
│   ├── models.ts
│   ├── api.ts
│   └── index.ts
├── utils/              # Utility functions
│   └── imageUtils.ts
└── main.tsx           # Application entry point
```

## API Reference

This application integrates with the following Alibaba Cloud APIs:

- [Qwen-Image API](https://help.aliyun.com/zh/model-studio/qwen-image-api)
- [Wan2.5 Image Edit API](https://help.aliyun.com/zh/model-studio/wan2-5-image-edit-api-reference)
- [Image-to-Video API](https://help.aliyun.com/zh/model-studio/image-to-video-api-reference)
- [Keyframe-to-Video API](https://help.aliyun.com/zh/model-studio/image-to-video-by-first-and-last-frame-api-reference)

## Important Notes

⚠️ **API Key Security**: Never commit your `.env` file with real API keys to version control

⚠️ **Content Expiration**: Generated images and videos expire after 24 hours. Download them immediately.

⚠️ **Rate Limits**: Be aware of API rate limits based on your Alibaba Cloud account tier

⚠️ **Costs**: Some operations incur costs. Check the [pricing documentation](https://help.aliyun.com/zh/model-studio/) before using.

## Troubleshooting

### API Key Error
If you see "API_KEY not configured", ensure your `.env` file exists and contains a valid `VITE_API_KEY`.

### Image Upload Fails
Check that images meet requirements:
- Format: JPEG, PNG, BMP, or WEBP
- Size: ≤ 10MB
- Dimensions: Within specified ranges per model

### Task Timeout
Async tasks may take 1-5 minutes. If timeout occurs:
- Check your internet connection
- Verify API service status
- Try again with simpler parameters

## License

This project is for demonstration purposes. Please refer to Alibaba Cloud's terms of service for API usage.

## Support

For API-related issues, consult the [Model Studio documentation](https://help.aliyun.com/zh/model-studio/).
