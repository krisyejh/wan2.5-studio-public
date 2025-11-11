# Wanxiang 2.5 Studio

A comprehensive AI-powered studio for image and video generation, featuring multiple Wanxiang AI models, intelligent agents, and enhancement tools.

## Supported Models

### Image Generation
- **wan2.5-t2i-preview** - Text-to-Image Generation with Advanced Text Rendering (Asynchronous)
- **wan2.5-i2i-preview** - Image-to-Image Editing & Multi-image Fusion (Asynchronous)
- **qwen-image-edit-plus** - Advanced Image Editing with Text, Object Modification, Style Transfer & Detail Enhancement (Synchronous)

### Video Generation
- **wan2.5-t2v-preview** - Text-to-Video Generation with Optional Audio Support (Asynchronous)
- **wan2.5-i2v-preview** - Image-to-Video with Audio Support (Asynchronous)
- **wan2.2-kf2v-flash** - Keyframe-to-Video with Smooth Transitions (Asynchronous)

## Features

### Core Capabilities
✨ **Multi-Model Support** - 6 AI models for diverse image and video generation needs

🎨 **Intuitive Interface** - Card-based model selection with dynamic parameter forms

📁 **Image Upload** - Drag-and-drop image upload with validation and preview

⚡ **Real-time Status** - Live task status monitoring for async operations

📥 **Easy Download** - One-click download of generated images and videos

🎬 **Video Playback** - Built-in video player for generated content

### Advanced Features
🤖 **AI Agents** - Intelligent workflow applications:
  - **AI Storyboard Generator** - Generate creative storyboard shots for video production
  - More agents coming soon (Script Analyzer, Video Planner)

🛠️ **Enhancement Tools**:
  - **Image Super-Resolution** - AI-powered image quality enhancement and upscaling
  - More tools coming soon (Caption Eraser, Background Remover)

📊 **Recent Generations** - View and manage your generation history with caching:
  - Quick access to recently generated content
  - Easy re-download of previous results
  - Organized history management

🎯 **Top Navigation Bar** - Easy switching between Models, Agents, Tools, and Recent Generations

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
npm run dev:all
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

### 1. Choose Your Workflow

Select from the top navigation bar:
- **Models** - Direct access to AI generation models
- **Agents** - Intelligent workflow applications
- **Tools** - Image and video enhancement utilities
- **Recent Gens** - View your generation history

### 2. Select a Model (Models Section)

Click on one of the model cards:
- **Text-to-Image** - Generate images from text descriptions
- **Image-to-Image** - Edit or combine images with instructions
- **Qwen Image Edit** - Advanced image editing with style transfer
- **Text-to-Video** - Create videos from text descriptions
- **Image-to-Video** - Animate images with motion
- **Keyframe-to-Video** - Generate smooth transitions between frames

### 3. Configure Parameters

- **Text-to-Image**: Enter a text prompt describing the desired image
- **Image-to-Image**: Upload 1-2 images and describe the editing instructions
- **Qwen Image Edit**: Upload an image and provide editing instructions (text, objects, styles)
- **Text-to-Video**: Enter a text prompt and configure video duration
- **Image-to-Video**: Upload a first frame image and describe the motion
- **Keyframe-to-Video**: Upload first (and optionally last) frame images

Each model has specific parameters like resolution, duration, watermark settings, and more.

### 4. Generate Content

Click "Generate" to submit your request:
- Synchronous models (Qwen Image Edit) return results immediately
- Asynchronous models show progress and poll for completion

### 5. View and Download Results

Once generation is complete:
- View images in the built-in viewer
- Play videos in the video player
- Download content before it expires (24-hour validity)
- Access your generation history in "Recent Gens"

### Using AI Agents

1. Navigate to the **Agents** section
2. Select **AI Storyboard Generator**
3. Upload agents/oss-storyboard.zip to [Bailian Workflow Platform](https://bailian.console.aliyun.com/?tab=app#/app-center) and publish the application
4. Input your application ID and video scripts
5. Let the AI workflow generate storyboard shots automatically

### Using Enhancement Tools

1. Navigate to the **Tools** section
2. Select **Image Super-Resolution**
3. Upload your image
4. Choose enhancement parameters
5. Download the enhanced high-resolution result

## Project Structure

```
src/
├── components/          # React components
│   ├── App.tsx         # Main application
│   ├── TopNavigationBar.tsx  # Navigation bar
│   ├── ModelsSection.tsx     # Models section
│   ├── AgentsSection.tsx     # AI Agents section
│   ├── ToolsSection.tsx      # Enhancement tools section
│   ├── RecentGens.tsx        # Generation history
│   ├── ModelSelection.tsx
│   ├── ParameterForm.tsx
│   ├── ImageUpload.tsx
│   ├── TaskStatus.tsx
│   ├── ResultDisplay.tsx
│   ├── StoryboardGeneratorAgent.tsx  # Storyboard agent
│   └── SuperResolutionTool.tsx       # Super-resolution tool
├── context/            # React Context for state management
│   └── AppContext.tsx
├── services/           # API integration
│   ├── api.ts          # Main API service
│   ├── agentsApi.ts    # Agents API
│   └── toolsApi.ts     # Tools API
├── config/             # Model configurations
│   └── models.ts
├── types/              # TypeScript type definitions
│   ├── models.ts
│   ├── api.ts
│   ├── agents.ts
│   ├── tools.ts
│   ├── cache.ts
│   └── index.ts
├── utils/              # Utility functions
│   ├── imageUtils.ts
│   └── cacheManager.ts  # Generation history cache
└── main.tsx           # Application entry point
```

## API Reference

This application integrates with the following Alibaba Cloud APIs:

### Generation Models
- [Qwen-Image API](https://help.aliyun.com/zh/model-studio/qwen-image-api) - qwen-image-edit-plus
- [Wan2.5 Image Edit API](https://help.aliyun.com/zh/model-studio/wan2-5-image-edit-api-reference) - wan2.5-t2i/i2i-preview
- [Video Generation API](https://help.aliyun.com/zh/model-studio/image-to-video-api-reference) - wan2.5-t2v/i2v-preview
- [Keyframe-to-Video API](https://help.aliyun.com/zh/model-studio/image-to-video-by-first-and-last-frame-api-reference) - wan2.2-kf2v-flash

### Enhancement Tools
- Image Super-Resolution API

### Agents
- AI Storyboard Generator (Multi-step workflow)

## Important Notes

⚠️ **API Key Security**: Never commit your `.env` file with real API keys to version control

⚠️ **Content Expiration**: Generated images and videos expire after 24 hours. Download them immediately or access them from Recent Generations.

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
