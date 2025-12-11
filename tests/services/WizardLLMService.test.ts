/**
 * Unit tests for WizardLLMService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WizardLLMService, type WizardLLMContext } from '../../src/services/WizardLLMService';
import { SettingsService } from '../../src/services/SettingsService';

// Mock SettingsService
vi.mock('../../src/services/SettingsService');

describe('WizardLLMService', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock API key and text LLM model
    vi.mocked(SettingsService.getApiKey).mockResolvedValue('test-api-key');
    vi.mocked(SettingsService.getTextLLMModel).mockResolvedValue('google/gemini-2.0-flash-exp');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateStructuredPrompt', () => {
    it('should generate concept analysis prompt', () => {
      const context: WizardLLMContext = {
        concept: 'A book about learning algorithms through visual stories'
      };

      const prompt = WizardLLMService.generateStructuredPrompt('concept', context);

      expect(prompt).toContain('book concept');
      expect(prompt).toContain(context.concept);
      expect(prompt).toContain('JSON format');
      expect(prompt).toContain('title');
      expect(prompt).toContain('description');
      expect(prompt).toContain('backgroundSetup');
    });

    it('should generate style variations prompt', () => {
      const context: WizardLLMContext = {
        concept: 'Educational CS book',
        bookMetadata: {
          description: 'Learn algorithms visually'
        },
        stylePreferences: 'colorful and engaging'
      };

      const prompt = WizardLLMService.generateStructuredPrompt('style', context);

      expect(prompt).toContain('visual style');
      expect(prompt).toContain(context.concept);
      expect(prompt).toContain(context.stylePreferences);
      expect(prompt).toContain('3-5 distinct');
      expect(prompt).toContain('artStyle');
      expect(prompt).toContain('colorPalette');
    });

    it('should generate style refinement prompt', () => {
      const context: WizardLLMContext = {
        concept: 'Educational book',
        currentStylePrompt: 'A colorful illustration with geometric shapes',
        stylePreferences: 'make it more cartoonish'
      };

      const prompt = WizardLLMService.generateStructuredPrompt('refinement', context);

      expect(prompt).toContain('refining');
      expect(prompt).toContain(context.currentStylePrompt);
      expect(prompt).toContain(context.stylePreferences);
      expect(prompt).toContain('modified prompt');
    });

    it('should generate character creation prompt', () => {
      const context: WizardLLMContext = {
        concept: 'Educational book',
        characterInfo: {
          name: 'Professor Algorithm',
          role: 'Teacher',
          basicDescription: 'A wise computer science professor'
        },
        existingCharacters: [
          { name: 'Student Sam', description: 'An eager learner' }
        ]
      };

      const prompt = WizardLLMService.generateStructuredPrompt('character', context);

      expect(prompt).toContain('character profile');
      expect(prompt).toContain(context.characterInfo.name);
      expect(prompt).toContain(context.characterInfo.role);
      expect(prompt).toContain('Student Sam');
      expect(prompt).toContain('visualDetails');
    });

    it('should generate conversation prompt', () => {
      const context: WizardLLMContext = {
        step: 'concept',
        concept: 'Educational book',
        conversationHistory: [
          {
            id: '1',
            role: 'user',
            content: 'I want to create a book about algorithms',
            timestamp: new Date()
          },
          {
            id: '2',
            role: 'assistant',
            content: 'That sounds great! Tell me more.',
            timestamp: new Date()
          }
        ]
      };

      const prompt = WizardLLMService.generateStructuredPrompt('conversation', context);

      expect(prompt).toContain('wizard step');
      expect(prompt).toContain(context.step);
      expect(prompt).toContain('algorithms');
    });

    it('should throw error for unknown task type', () => {
      const context: WizardLLMContext = {};

      expect(() => {
        WizardLLMService.generateStructuredPrompt('unknown' as any, context);
      }).toThrow('Unknown task type');
    });
  });

  describe('parseConceptResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        title: 'Algorithm Adventures',
        description: 'Learn algorithms through visual stories',
        backgroundSetup: 'A world where algorithms come to life',
        themes: ['education', 'computer science'],
        visualElements: ['diagrams', 'characters']
      });

      const result = WizardLLMService.parseConceptResponse(response);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Algorithm Adventures');
      expect(result.data?.description).toContain('algorithms');
      expect(result.data?.themes).toHaveLength(2);
    });

    it('should parse JSON in markdown code block', () => {
      const response = `\`\`\`json
{
  "title": "Test Book",
  "description": "A test description",
  "backgroundSetup": "Test setup",
  "themes": ["test"]
}
\`\`\``;

      const result = WizardLLMService.parseConceptResponse(response);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test Book');
    });

    it('should handle missing required fields', () => {
      const response = JSON.stringify({
        title: 'Test Book'
        // Missing description and backgroundSetup
      });

      const result = WizardLLMService.parseConceptResponse(response);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should handle invalid JSON', () => {
      const response = 'This is not JSON';

      const result = WizardLLMService.parseConceptResponse(response);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse');
    });
  });

  describe('parseStyleResponse', () => {
    it('should parse array of style variations', () => {
      const response = JSON.stringify([
        {
          name: 'Watercolor Style',
          artStyle: 'watercolor',
          colorPalette: 'soft pastels',
          visualTheme: 'gentle',
          characterStyle: 'rounded',
          environmentStyle: 'flowing',
          prompt: 'A watercolor illustration...'
        },
        {
          name: 'Comic Style',
          artStyle: 'comic book',
          colorPalette: 'bold primary colors',
          visualTheme: 'dynamic',
          characterStyle: 'angular',
          environmentStyle: 'graphic',
          prompt: 'A comic book style illustration...'
        }
      ]);

      const result = WizardLLMService.parseStyleResponse(response);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe('Watercolor Style');
      expect(result.data?.[1].name).toBe('Comic Style');
    });

    it('should parse single style variation as array', () => {
      const response = JSON.stringify({
        name: 'Single Style',
        artStyle: 'digital',
        colorPalette: 'vibrant',
        prompt: 'A digital illustration...'
      });

      const result = WizardLLMService.parseStyleResponse(response);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Single Style');
    });

    it('should filter out invalid variations', () => {
      const response = JSON.stringify([
        {
          name: 'Valid Style',
          artStyle: 'digital',
          colorPalette: 'vibrant',
          prompt: 'A prompt...'
        },
        {
          name: 'Invalid Style'
          // Missing required fields
        }
      ]);

      const result = WizardLLMService.parseStyleResponse(response);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Valid Style');
    });

    it('should handle no valid variations', () => {
      const response = JSON.stringify([
        { name: 'Incomplete' }
      ]);

      const result = WizardLLMService.parseStyleResponse(response);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid style variations');
    });
  });

  describe('parseCharacterResponse', () => {
    it('should parse character profile', () => {
      const response = JSON.stringify({
        name: 'Professor Algorithm',
        description: 'A wise computer science professor',
        visualDetails: {
          appearance: 'Elderly with white hair and glasses',
          clothing: 'Tweed jacket and bow tie',
          distinctiveFeatures: 'Always carries a pointer'
        }
      });

      const result = WizardLLMService.parseCharacterResponse(response);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Professor Algorithm');
      expect(result.data?.visualDetails.appearance).toContain('white hair');
    });

    it('should handle missing visual details', () => {
      const response = JSON.stringify({
        name: 'Simple Character',
        description: 'A character'
      });

      const result = WizardLLMService.parseCharacterResponse(response);

      expect(result.success).toBe(true);
      expect(result.data?.visualDetails.appearance).toBe('');
    });

    it('should handle missing required fields', () => {
      const response = JSON.stringify({
        name: 'Character'
        // Missing description
      });

      const result = WizardLLMService.parseCharacterResponse(response);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });
  });

  describe('parseRefinementResponse', () => {
    it('should parse plain text prompt', () => {
      const response = 'A more cartoonish illustration with exaggerated features';

      const result = WizardLLMService.parseRefinementResponse(response);

      expect(result.success).toBe(true);
      expect(result.data).toBe(response);
    });

    it('should extract from code block', () => {
      const response = '```\nA refined prompt here\n```';

      const result = WizardLLMService.parseRefinementResponse(response);

      expect(result.success).toBe(true);
      expect(result.data).toBe('A refined prompt here');
    });

    it('should remove surrounding quotes', () => {
      const response = '"A quoted prompt"';

      const result = WizardLLMService.parseRefinementResponse(response);

      expect(result.success).toBe(true);
      expect(result.data).toBe('A quoted prompt');
    });

    it('should handle empty response', () => {
      const response = '';

      const result = WizardLLMService.parseRefinementResponse(response);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Empty refinement response');
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      // Mock fetch
      global.fetch = vi.fn();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should send message with conversation context', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a helpful response'
            }
          }
        ]
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const context: WizardLLMContext = {
        step: 'concept',
        concept: 'Educational book',
        conversationHistory: [
          {
            id: '1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date()
          }
        ]
      };

      const result = await WizardLLMService.sendMessage('Tell me more', context);

      expect(result.success).toBe(true);
      expect(result.data).toBe('This is a helpful response');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('openrouter.ai'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('should handle missing API key', async () => {
      vi.mocked(SettingsService.getApiKey).mockResolvedValue(undefined);

      const result = await WizardLLMService.sendMessage('Test', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key not configured');
    });

    it('should handle API errors', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server error'
      } as Response);

      const requestPromise = WizardLLMService.sendMessage('Test', {});
      
      // Fast-forward through retry delays
      await vi.runAllTimersAsync();
      
      const result = await requestPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      const requestPromise = WizardLLMService.sendMessage('Test', {});
      
      // Fast-forward through retry delays
      await vi.runAllTimersAsync();
      
      const result = await requestPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('makeStructuredRequest', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should make structured request for concept analysis', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test Book',
                description: 'Test description',
                backgroundSetup: 'Test setup',
                themes: []
              })
            }
          }
        ]
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const context: WizardLLMContext = {
        concept: 'A test concept'
      };

      const result = await WizardLLMService.makeStructuredRequest('concept', context);

      expect(result.success).toBe(true);
      expect(result.data).toContain('Test Book');
    });

    it('should handle missing API key', async () => {
      vi.mocked(SettingsService.getApiKey).mockResolvedValue(undefined);

      const result = await WizardLLMService.makeStructuredRequest('concept', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('API key not configured');
    });
  });

  describe('retry logic', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should retry on rate limit error', async () => {
      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return {
            ok: false,
            status: 429,
            text: async () => 'Rate limited'
          } as Response;
        }
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' } }]
          })
        } as Response;
      });

      const requestPromise = WizardLLMService.sendMessage('Test', {});
      
      // Fast-forward through retry delays
      await vi.runAllTimersAsync();
      
      const result = await requestPromise;

      expect(result.success).toBe(true);
      expect(callCount).toBe(3);
    });

    it('should retry on server error', async () => {
      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(async () => {
        callCount++;
        if (callCount < 2) {
          return {
            ok: false,
            status: 500,
            text: async () => 'Server error'
          } as Response;
        }
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' } }]
          })
        } as Response;
      });

      const requestPromise = WizardLLMService.sendMessage('Test', {});
      
      await vi.runAllTimersAsync();
      
      const result = await requestPromise;

      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });

    it('should give up after max retries', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limited'
      } as Response);

      const requestPromise = WizardLLMService.sendMessage('Test', {});
      
      await vi.runAllTimersAsync();
      
      const result = await requestPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('429');
    });

    it('should retry on network error', async () => {
      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Network error');
        }
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' } }]
          })
        } as Response;
      });

      const requestPromise = WizardLLMService.sendMessage('Test', {});
      
      await vi.runAllTimersAsync();
      
      const result = await requestPromise;

      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });
  });
});
