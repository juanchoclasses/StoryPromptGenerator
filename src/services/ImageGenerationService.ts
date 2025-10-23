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
      
      // Check if the response contains image data
      const content = result.choices?.[0]?.message?.content;
      
      if (!content) {
        return {
          success: false,
          error: 'No content received from API'
        };
      }

      // Handle different response formats
      // Some models return URLs, some return base64 data
      let imageUrl: string | undefined;

      if (typeof content === 'string') {
        // Check if it's a URL
        if (content.startsWith('http://') || content.startsWith('https://')) {
          imageUrl = content;
        } 
        // Check if it's a data URL
        else if (content.startsWith('data:image/')) {
          imageUrl = content;
        }
        // Check if it contains a URL in markdown or text
        else {
          const urlMatch = content.match(/https?:\/\/[^\s)]+/);
          if (urlMatch) {
            imageUrl = urlMatch[0];
          }
        }
      }

      if (!imageUrl) {
        return {
          success: false,
          error: 'Could not extract image from API response. The model may not support image generation.'
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

