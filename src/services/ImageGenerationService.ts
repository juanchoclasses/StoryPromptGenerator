import { SettingsService } from './SettingsService';

export interface ImageGenerationOptions {
  prompt: string;
  model?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class ImageGenerationService {
  private static readonly OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

  static async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    try {
      const apiKey = SettingsService.getApiKey();
      
      if (!apiKey) {
        return {
          success: false,
          error: 'OpenRouter API key not configured. Please set your API key in settings.'
        };
      }

      const model = options.model || SettingsService.getImageGenerationModel();

      console.log('Generating image with model:', model);

      const response = await fetch(`${this.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Story Prompter - Image Generator'
        },
        body: JSON.stringify({
          model: model,
          modalities: ['image', 'text'], // Enable image generation
          messages: [
            {
              role: 'user',
              content: options.prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        return {
          success: false,
          error: `API error (${response.status}): ${errorText}`
        };
      }

      const result = await response.json();
      
      console.log('OpenRouter response:', JSON.stringify(result, null, 2));
      
      // Check if the response contains image data
      const message = result.choices?.[0]?.message;
      
      if (!message) {
        return {
          success: false,
          error: 'No message received from API'
        };
      }

      // Per OpenRouter docs, images are in message.images array
      let imageUrl: string | undefined;

      // Primary format: message.images array (official OpenRouter format)
      if (message.images && Array.isArray(message.images) && message.images.length > 0) {
        const firstImage = message.images[0];
        if (firstImage.image_url?.url) {
          imageUrl = firstImage.image_url.url;
        }
      }
      // Fallback: Check for content array (alternative multimodal response format)
      else if (Array.isArray(message.content)) {
        for (const item of message.content) {
          if (item.type === 'image_url' && item.image_url?.url) {
            imageUrl = item.image_url.url;
            break;
          }
        }
      }
      // Fallback: Check string content for URLs
      else if (typeof message.content === 'string') {
        const content = message.content;
        
        // Check if it's a data URL (base64 image)
        if (content.startsWith('data:image/')) {
          imageUrl = content;
        }
        // Check if it's a URL
        else if (content.startsWith('http://') || content.startsWith('https://')) {
          imageUrl = content;
        } 
        // Check if it contains a URL in markdown or text
        else {
          const urlMatch = content.match(/https?:\/\/[^\s)]+\.(png|jpg|jpeg|gif|webp)/i);
          if (urlMatch) {
            imageUrl = urlMatch[0];
          }
        }
      }

      if (!imageUrl) {
        return {
          success: false,
          error: `Could not extract image from API response. The model may not support image generation.\n\nResponse received:\n${JSON.stringify(message, null, 2)}\n\nTip: Make sure you're using an image-capable model like 'google/gemini-2.5-flash-image-preview'`
        };
      }

      return {
        success: true,
        imageUrl
      };

    } catch (error) {
      console.error('Error generating image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

