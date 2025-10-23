# Image Generation Feature Guide

## Overview

The Story Prompter now supports AI-powered image generation through OpenRouter. This allows you to generate images directly from your scene prompts using various image generation models.

## Setup

### 1. Get an OpenRouter API Key

1. Visit [openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign up or log in
3. Create a new API key
4. Copy your API key (starts with `sk-or-v1-...`)

### 2. Configure the App

1. Click the **Settings** icon (⚙️) in the top-right corner of the app
2. Paste your OpenRouter API key in the "OpenRouter API Key" field
3. Select your preferred image generation model (default: Google Gemini Flash 1.5 8B)
4. Click **Save**

Your API key is stored locally in your browser and is never sent to our servers.

## Available Models

The following image generation models are available through OpenRouter:

- **Google Gemini Flash 1.5 8B** - Fast, cost-effective (default)
- **Google Gemini Flash 1.5** - Good balance of speed and quality
- **Google Gemini Pro 1.5** - Higher quality results
- **OpenAI DALL-E 3** - High-quality artistic images
- **Flux 1.1 Pro** - Professional image generation
- **Flux Pro** - High-end professional results
- **Stable Diffusion 3.5 Large** - Open-source, flexible

Different models have different capabilities, costs, and speed. Check [OpenRouter's documentation](https://openrouter.ai/docs) for details.

## Usage

### Generating an Image

1. **Create your scene** with all the details:
   - Add a scene title
   - Write a detailed scene description
   - Add characters from your cast
   - Add story elements
   - Use macros like `{SceneDescription}` in elements for consistency

2. **Generate the prompt:**
   - Click the "Get Prompt" button to see what will be sent to the AI
   - Review the prompt to ensure it has all the details you want

3. **Generate the image:**
   - Click the **"Generate Image"** button
   - Wait for the image to be generated (may take 10-60 seconds depending on the model)
   - The image will appear below the scene editor

4. **Use your image:**
   - Click **"Download Image"** to save it to your computer
   - Click **"Clear"** to remove it and generate a new one

## How It Works

The app automatically constructs a comprehensive prompt from:
- Book description
- Story background setup
- Scene title and description
- Character descriptions (with macro substitution)
- Element descriptions (with macro substitution)

All `{SceneDescription}` macros in your elements are replaced with the actual scene description before sending to the AI, ensuring consistency across your generated images.

## Tips for Better Results

1. **Be detailed** - The more specific your scene descriptions, the better the results
2. **Use macros** - `{SceneDescription}` in elements ensures consistency
3. **Include visual details** - Mention colors, lighting, atmosphere, composition
4. **Character consistency** - Keep character descriptions detailed and consistent across scenes
5. **Try different models** - Some models excel at different styles
6. **Iterate** - Generate multiple times with tweaks to get the perfect image

## Troubleshooting

### "OpenRouter API key not configured"
- Make sure you've entered your API key in Settings
- Verify the key is correct (should start with `sk-or-v1-`)

### "API error" messages
- Check your OpenRouter account has sufficient credits
- Verify the selected model is available
- Some models may have usage limits

### "Could not extract image from API response"
- The selected model may not support image generation
- Try switching to a different model like DALL-E 3 or Flux Pro

### Image doesn't match description
- Try adding more detail to your scene description
- Ensure characters and elements have comprehensive descriptions
- Consider using a different model
- Generate multiple times to get variations

## Privacy & Security

- Your API key is stored only in your browser's localStorage
- API keys are never sent to our servers
- Images are generated directly through OpenRouter
- Generated images are displayed as URLs or data URIs
- Downloaded images are saved locally to your computer

## Cost Considerations

Different models have different pricing on OpenRouter:
- Check current pricing at [openrouter.ai/models](https://openrouter.ai/models)
- Gemini Flash models are typically the most cost-effective
- DALL-E 3 and Flux Pro are premium options
- Monitor your usage on the OpenRouter dashboard

## Example Workflow

1. Create a book with characters and elements
2. Write a story with background setup
3. Create a scene: "A tense confrontation in a dimly lit alley"
4. Add characters: "Detective Sarah" and "The Mysterious Stranger"
5. Add element: "Scene Text Panel" with `{SceneDescription}` macro
6. Click "Generate Image"
7. Download and use in your project!

## Support

For issues or questions:
- Check the [OpenRouter documentation](https://openrouter.ai/docs)
- Review your scene details for completeness
- Try different models for different results
- Clear and regenerate if needed

