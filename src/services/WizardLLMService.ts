/**
 * WizardLLMService - LLM integration for the Book Creation Wizard
 * 
 * This service handles all LLM interactions for the wizard, including:
 * - Concept analysis and book metadata generation
 * - Style variation generation
 * - Style refinement based on user feedback
 * - Character profile generation
 * - Conversational interactions
 * 
 * Uses OpenRouter API with Gemini models for text generation.
 */

import { SettingsService } from './SettingsService';
import type {
  Message,
  ConceptAnalysis,
  BookMetadata,
  StyleVariation,
  CharacterProfile
} from '../types/Wizard';

/**
 * Task types for structured prompt generation
 */
export type WizardTaskType = 'concept' | 'style' | 'character' | 'refinement' | 'conversation';

/**
 * Context for LLM requests
 */
export interface WizardLLMContext {
  /** Current wizard step */
  step?: string;
  
  /** Book concept */
  concept?: string;
  
  /** Book metadata */
  bookMetadata?: {
    title?: string;
    description?: string;
    backgroundSetup?: string;
  };
  
  /** Style preferences */
  stylePreferences?: string;
  
  /** Current style prompt */
  currentStylePrompt?: string;
  
  /** Character information */
  characterInfo?: {
    name?: string;
    role?: string;
    basicDescription?: string;
  };
  
  /** Existing characters */
  existingCharacters?: Array<{ name: string; description: string }>;
  
  /** Conversation history */
  conversationHistory?: Message[];
}

/**
 * Result of an LLM request
 */
export interface LLMResult<T = any> {
  /** Whether the request succeeded */
  success: boolean;
  
  /** Parsed data if successful */
  data?: T;
  
  /** Error message if failed */
  error?: string;
  
  /** Raw response text */
  rawResponse?: string;
}

export class WizardLLMService {
  private static readonly OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
  private static readonly DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000;

  /**
   * Generate a structured prompt for different wizard tasks
   */
  static generateStructuredPrompt(task: WizardTaskType, context: WizardLLMContext): string {
    switch (task) {
      case 'concept':
        return this.generateConceptPrompt(context);
      case 'style':
        return this.generateStylePrompt(context);
      case 'character':
        return this.generateCharacterPrompt(context);
      case 'refinement':
        return this.generateRefinementPrompt(context);
      case 'conversation':
        return this.generateConversationPrompt(context);
      default:
        throw new Error(`Unknown task type: ${task}`);
    }
  }

  /**
   * Generate concept analysis prompt
   */
  private static generateConceptPrompt(context: WizardLLMContext): string {
    return `You are an expert book creator helping a user develop their book concept for visual storytelling.

The user has described their book concept as:
"${context.concept}"

Analyze this concept and provide:
1. A compelling, concise title (2-6 words)
2. A detailed description (2-3 sentences) that captures the essence
3. Background setup describing the story world (2-3 sentences)
4. Key themes present in the concept
5. Visual elements that should be emphasized

Respond in JSON format:
{
  "title": "Book Title",
  "description": "Detailed description...",
  "backgroundSetup": "Background setup...",
  "themes": ["theme1", "theme2", "theme3"],
  "visualElements": ["element1", "element2", "element3"]
}

Be creative but stay true to the user's concept. Make the title memorable and the description engaging.`;
  }

  /**
   * Generate style variations prompt
   */
  private static generateStylePrompt(context: WizardLLMContext): string {
    const preferencesText = context.stylePreferences 
      ? `\n\nUser's style preferences: "${context.stylePreferences}"`
      : '';

    return `You are a visual style expert helping create consistent book imagery.

Book concept: "${context.concept}"
${context.bookMetadata?.description ? `Description: "${context.bookMetadata.description}"` : ''}${preferencesText}

Generate 3-5 distinct visual style variations suitable for this book. Each style should be unique and appropriate for the concept.

For each style variation, provide:
- name: A descriptive name for this style (e.g., "Whimsical Watercolor", "Bold Comic Book")
- artStyle: The artistic medium/technique (e.g., "hand-painted watercolor", "digital illustration", "3D rendered")
- colorPalette: Color scheme description (e.g., "warm earth tones with vibrant accents", "cool blues and purples")
- visualTheme: Overall aesthetic (e.g., "whimsical and educational", "dramatic and cinematic")
- characterStyle: How characters should look (e.g., "simplified shapes with expressive faces", "realistic proportions")
- environmentStyle: How environments should look (e.g., "abstract geometric backgrounds", "detailed realistic settings")
- prompt: A complete, detailed image generation prompt that incorporates all the above elements

Respond in JSON format as an array:
[
  {
    "name": "Style Name",
    "artStyle": "...",
    "colorPalette": "...",
    "visualTheme": "...",
    "characterStyle": "...",
    "environmentStyle": "...",
    "prompt": "Complete detailed prompt for image generation..."
  }
]

Make each style distinctly different from the others. The prompts should be detailed and specific enough for AI image generation.`;
  }

  /**
   * Generate style refinement prompt
   */
  private static generateRefinementPrompt(context: WizardLLMContext): string {
    return `You are refining an image generation prompt based on user feedback.

Current prompt:
"${context.currentStylePrompt}"

User feedback:
"${context.stylePreferences}"

Book context:
${context.concept ? `Concept: "${context.concept}"` : ''}
${context.bookMetadata?.description ? `Description: "${context.bookMetadata.description}"` : ''}

Task: Modify the prompt to incorporate the user's feedback while maintaining consistency with the book's concept and existing style elements.

Respond with ONLY the modified prompt text (no JSON, no explanation, just the refined prompt).

The refined prompt should:
- Incorporate the user's feedback naturally
- Maintain the overall style and tone
- Be detailed and specific for image generation
- Stay consistent with the book concept`;
  }

  /**
   * Generate character creation prompt
   */
  private static generateCharacterPrompt(context: WizardLLMContext): string {
    const existingCharsText = context.existingCharacters && context.existingCharacters.length > 0
      ? `\n\nExisting characters:\n${context.existingCharacters.map(c => `- ${c.name}: ${c.description}`).join('\n')}`
      : '';

    return `You are creating a detailed character profile for visual consistency in a book.

Book context:
${context.concept ? `Concept: "${context.concept}"` : ''}
${context.bookMetadata?.description ? `Description: "${context.bookMetadata.description}"` : ''}
${context.bookMetadata?.backgroundSetup ? `Setting: "${context.bookMetadata.backgroundSetup}"` : ''}${existingCharsText}

Character basics:
- Name: ${context.characterInfo?.name ?? 'Unknown'}
- Role: ${context.characterInfo?.role ?? 'Character'}
- Description: ${context.characterInfo?.basicDescription ?? 'A character in the story'}

Generate a detailed character profile suitable for AI image generation. The profile should:
1. Be consistent with the book's concept and setting
2. Be distinctive from other characters
3. Include specific visual details
4. Be optimized for image generation prompts

Respond in JSON format:
{
  "name": "${context.characterInfo?.name ?? 'Character Name'}",
  "description": "Comprehensive character description...",
  "visualDetails": {
    "appearance": "Physical appearance details (face, body, age, etc.)...",
    "clothing": "Clothing and accessories details...",
    "distinctiveFeatures": "Unique features that make this character recognizable..."
  }
}

Be specific and detailed. Focus on visual characteristics that will help maintain consistency across images.`;
  }

  /**
   * Generate conversational prompt
   */
  private static generateConversationPrompt(context: WizardLLMContext): string {
    const historyText = context.conversationHistory && context.conversationHistory.length > 0
      ? context.conversationHistory
          .slice(-10) // Last 10 messages for context
          .map(m => `${m.role}: ${m.content}`)
          .join('\n')
      : '';

    return `You are a helpful AI assistant guiding a user through creating a book for visual storytelling.

Current wizard step: ${context.step || 'unknown'}

Book context:
${context.concept ? `Concept: "${context.concept}"` : 'Not yet defined'}
${context.bookMetadata?.title ? `Title: "${context.bookMetadata.title}"` : ''}
${context.bookMetadata?.description ? `Description: "${context.bookMetadata.description}"` : ''}

Recent conversation:
${historyText}

Respond naturally and helpfully. Keep responses concise but informative. Guide the user toward the next step when appropriate.`;
  }

  /**
   * Parse concept analysis response
   */
  static parseConceptResponse(response: string): LLMResult<ConceptAnalysis & BookMetadata> {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, response];
      
      const jsonText = jsonMatch[1] || response;
      const parsed = JSON.parse(jsonText.trim());

      // Validate required fields
      if (!parsed.title || !parsed.description || !parsed.backgroundSetup) {
        return {
          success: false,
          error: 'Missing required fields in concept response',
          rawResponse: response
        };
      }

      return {
        success: true,
        data: {
          title: parsed.title,
          description: parsed.description,
          backgroundSetup: parsed.backgroundSetup,
          themes: parsed.themes || [],
          suggestedGenres: parsed.suggestedGenres || [],
          targetAudience: parsed.targetAudience || '',
          visualElements: parsed.visualElements || []
        },
        rawResponse: response
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse concept response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rawResponse: response
      };
    }
  }

  /**
   * Parse style variations response
   */
  static parseStyleResponse(response: string): LLMResult<StyleVariation[]> {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, response];
      
      const jsonText = jsonMatch[1] || response;
      const parsed = JSON.parse(jsonText.trim());

      // Ensure it's an array
      const variations = Array.isArray(parsed) ? parsed : [parsed];

      // Validate each variation
      const validVariations = variations.filter(v => 
        v.name && v.artStyle && v.colorPalette && v.prompt
      );

      if (validVariations.length === 0) {
        return {
          success: false,
          error: 'No valid style variations found in response',
          rawResponse: response
        };
      }

      return {
        success: true,
        data: validVariations.map(v => ({
          name: v.name,
          artStyle: v.artStyle,
          colorPalette: v.colorPalette,
          visualTheme: v.visualTheme || '',
          characterStyle: v.characterStyle || '',
          environmentStyle: v.environmentStyle || '',
          prompt: v.prompt
        })),
        rawResponse: response
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse style response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rawResponse: response
      };
    }
  }

  /**
   * Parse character profile response
   */
  static parseCharacterResponse(response: string): LLMResult<CharacterProfile> {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, response];
      
      const jsonText = jsonMatch[1] || response;
      const parsed = JSON.parse(jsonText.trim());

      // Validate required fields
      if (!parsed.name || !parsed.description) {
        return {
          success: false,
          error: 'Missing required fields in character response',
          rawResponse: response
        };
      }

      return {
        success: true,
        data: {
          name: parsed.name,
          description: parsed.description,
          visualDetails: {
            appearance: parsed.visualDetails?.appearance || '',
            clothing: parsed.visualDetails?.clothing || '',
            distinctiveFeatures: parsed.visualDetails?.distinctiveFeatures || ''
          }
        },
        rawResponse: response
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse character response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rawResponse: response
      };
    }
  }

  /**
   * Parse refinement response (plain text prompt)
   */
  static parseRefinementResponse(response: string): LLMResult<string> {
    try {
      // Remove any markdown formatting
      let refined = response.trim();
      
      // Remove code blocks if present
      const codeBlockMatch = refined.match(/```(?:text|prompt)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        refined = codeBlockMatch[1].trim();
      }

      // Remove quotes if the entire response is quoted
      if (refined.startsWith('"') && refined.endsWith('"')) {
        refined = refined.slice(1, -1);
      }

      if (!refined) {
        return {
          success: false,
          error: 'Empty refinement response',
          rawResponse: response
        };
      }

      return {
        success: true,
        data: refined,
        rawResponse: response
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse refinement response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rawResponse: response
      };
    }
  }

  /**
   * Send a message to the LLM with conversation context
   */
  static async sendMessage(
    userMessage: string,
    context: WizardLLMContext
  ): Promise<LLMResult<string>> {
    try {
      const apiKey = await SettingsService.getApiKey();
      
      if (!apiKey) {
        return {
          success: false,
          error: 'OpenRouter API key not configured. Please set your API key in settings.'
        };
      }

      // Build conversation messages
      const messages: Array<{ role: string; content: string }> = [];

      // Add system message with context
      const systemPrompt = this.generateConversationPrompt(context);
      messages.push({
        role: 'system',
        content: systemPrompt
      });

      // Add conversation history (last 10 messages)
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory.slice(-10);
        recentHistory.forEach(msg => {
          if (msg.role !== 'system') {
            messages.push({
              role: msg.role,
              content: msg.content
            });
          }
        });
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Make API request with retry logic
      const result = await this.makeRequestWithRetry(messages);
      
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: result.data,
        rawResponse: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Make an LLM request with structured prompt
   */
  static async makeStructuredRequest(
    task: WizardTaskType,
    context: WizardLLMContext
  ): Promise<LLMResult<string>> {
    try {
      const apiKey = await SettingsService.getApiKey();
      
      if (!apiKey) {
        return {
          success: false,
          error: 'OpenRouter API key not configured. Please set your API key in settings.'
        };
      }

      const prompt = this.generateStructuredPrompt(task, context);

      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ];

      return await this.makeRequestWithRetry(messages);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Make API request with retry logic
   */
  private static async makeRequestWithRetry(
    messages: Array<{ role: string; content: string }>,
    retryCount = 0
  ): Promise<LLMResult<string>> {
    try {
      const apiKey = await SettingsService.getApiKey();
      
      if (!apiKey) {
        return {
          success: false,
          error: 'OpenRouter API key not configured'
        };
      }

      const response = await fetch(`${this.OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Story Prompter - Book Creation Wizard'
        },
        body: JSON.stringify({
          model: this.DEFAULT_MODEL,
          messages: messages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Retry on rate limit or server errors
        if ((response.status === 429 || response.status >= 500) && retryCount < this.MAX_RETRIES) {
          console.warn(`API request failed (${response.status}), retrying... (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
          await this.delay(this.RETRY_DELAY_MS * Math.pow(2, retryCount)); // Exponential backoff
          return this.makeRequestWithRetry(messages, retryCount + 1);
        }

        return {
          success: false,
          error: `API error (${response.status}): ${errorText}`
        };
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        return {
          success: false,
          error: 'No content received from API'
        };
      }

      return {
        success: true,
        data: content,
        rawResponse: content
      };
    } catch (error) {
      // Retry on network errors
      if (retryCount < this.MAX_RETRIES) {
        console.warn(`Request failed, retrying... (attempt ${retryCount + 1}/${this.MAX_RETRIES})`, error);
        await this.delay(this.RETRY_DELAY_MS * Math.pow(2, retryCount));
        return this.makeRequestWithRetry(messages, retryCount + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delay helper for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
