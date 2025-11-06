# Quick Start Guide

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Key**
   - Copy `.env.example` to `.env`
   - Get your API key from: https://help.aliyun.com/zh/model-studio/get-api-key
   - Add it to `.env`:
     ```
     VITE_API_KEY=sk-your-actual-api-key-here
     ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Navigate to: http://localhost:5173/

## Using the Application

### Step 1: Select a Model
Choose from four available models:
- **Text-to-Image**: Generate images from text descriptions
- **Image-to-Image**: Edit or fuse multiple images
- **Image-to-Video**: Create videos from images with audio
- **Keyframe-to-Video**: Generate videos from first/last frames

### Step 2: Configure Parameters
Each model has different required and optional parameters:

**Text-to-Image (T2I)**
- ✅ Prompt (required)
- Size, negative prompt, watermark, etc.

**Image-to-Image (I2I)**
- ✅ Upload 1-2 images (required)
- ✅ Editing instructions (required)
- Number of results, watermark, etc.

**Image-to-Video (I2V)**
- ✅ Upload first frame image (required)
- Prompt, resolution, duration, audio settings, etc.

**Keyframe-to-Video (KF2V)**
- ✅ Upload first frame image (required)
- Last frame image (optional)
- Prompt, resolution, special effects, etc.

### Step 3: Generate Content
- Click "Generate" button
- For T2I: Results appear immediately
- For I2I/I2V/KF2V: Wait 1-5 minutes for async processing
- Progress shown in real-time

### Step 4: Download Results
- View generated images/videos
- Click "Download" button
- ⚠️ Content expires in 24 hours!

## Tips

✅ **Image Requirements**
- Formats: JPEG, PNG, BMP, WEBP
- Max size: 10MB
- Dimensions vary by model (check tooltips)

✅ **Writing Good Prompts**
- Be specific and descriptive
- Include style, mood, and details
- Use negative prompts to exclude unwanted elements

✅ **Cost Management**
- Set number of results to 1 for testing
- Use lower resolutions (480P) for drafts
- Higher resolution/duration = higher cost

## Troubleshooting

**"API_KEY not configured"**
→ Check your `.env` file contains `VITE_API_KEY`

**Image upload fails**
→ Verify image meets size/format requirements

**Task timeout**
→ Async tasks can take up to 5 minutes, be patient

**CORS errors**
→ API calls are made directly from browser, ensure API key is valid

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Need Help?

- API Documentation: https://help.aliyun.com/zh/model-studio/
- Model Pricing: Check Alibaba Cloud Model Studio pricing page
- Issues: Check console logs for detailed error messages
