/**
 * Unit tests for BookCreationWizardService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BookCreationWizardService } from '../../src/services/BookCreationWizardService';
import { WizardLLMService } from '../../src/services/WizardLLMService';
import { ImageGenerationService } from '../../src/services/ImageGenerationService';
import { ImageStorageService } from '../../src/services/ImageStorageService';
import type { WizardState } from '../../src/types/Wizard';

// Mock dependencies
vi.mock('../../src/services/WizardLLMService');
vi.mock('../../src/services/ImageGenerationService');
vi.mock('../../src/services/ImageStorageService');

describe('BookCreationWizardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeConcept', () => {
    it('should analyze concept and return metadata', async () => {
      const mockResponse = JSON.stringify({
        title: 'Algorithm Adventures',
        description: 'Learn algorithms through visual stories',
        backgroundSetup: 'A world where algorithms come to life',
        themes: ['education', 'computer science'],
        visualElements: ['diagrams', 'characters']
      });

      vi.mocked(WizardLLMService.makeStructuredRequest).mockResolvedValue({
        success: true,
        data: mockResponse
      });

      vi.mocked(WizardLLMService.parseConceptResponse).mockReturnValue({
        success: true,
        data: {
          title: 'Algorithm Adventures',
          description: 'Learn algorithms through visual stories',
          backgroundSetup: 'A world where algorithms come to life',
          themes: ['education', 'computer science'],
          suggestedGenres: [],
          targetAudience: '',
          visualElements: ['diagrams', 'characters']
        }
      });

      const result = await BookCreationWizardService.analyzeConcept(
        'A book about learning algorithms'
      );

      expect(result.title).toBe('Algorithm Adventures');
      expect(result.description).toContain('algorithms');
      expect(result.themes).toContain('education');
      expect(WizardLLMService.makeStructuredRequest).toHaveBeenCalledWith(
        'concept',
        expect.objectContaining({
          concept: 'A book about learning algorithms'
        })
      );
    });

    it('should handle LLM request failure', async () => {
      vi.mocked(WizardLLMService.makeStructuredRequest).mockResolvedValue({
        success: false,
        error: 'API error'
      });

      await expect(
        BookCreationWizardService.analyzeConcept('Test concept')
      ).rejects.toThrow('API error');
    });

    it('should handle parsing failure', async () => {
      vi.mocked(WizardLLMService.makeStructuredRequest).mockResolvedValue({
        success: true,
        data: 'invalid json'
      });

      vi.mocked(WizardLLMService.parseConceptResponse).mockReturnValue({
        success: false,
        error: 'Parse error'
      });

      await expect(
        BookCreationWizardService.analyzeConcept('Test concept')
      ).rejects.toThrow('Parse error');
    });
  });

  describe('generateBookMetadata', () => {
    it('should extract metadata from concept analysis', async () => {
      const mockResponse = JSON.stringify({
        title: 'Test Book',
        description: 'Test description',
        backgroundSetup: 'Test setup',
        themes: []
      });

      vi.mocked(WizardLLMService.makeStructuredRequest).mockResolvedValue({
        success: true,
        data: mockResponse
      });

      vi.mocked(WizardLLMService.parseConceptResponse).mockReturnValue({
        success: true,
        data: {
          title: 'Test Book',
          description: 'Test description',
          backgroundSetup: 'Test setup',
          themes: [],
          suggestedGenres: [],
          targetAudience: '',
          visualElements: []
        }
      });

      const result = await BookCreationWizardService.generateBookMetadata('Test concept');

      expect(result).toEqual({
        title: 'Test Book',
        description: 'Test description',
        backgroundSetup: 'Test setup'
      });
    });
  });

  describe('generateStyleVariations', () => {
    it('should generate style variations', async () => {
      const mockResponse = JSON.stringify([
        {
          name: 'Watercolor Style',
          artStyle: 'watercolor',
          colorPalette: 'soft pastels',
          visualTheme: 'gentle',
          characterStyle: 'rounded',
          environmentStyle: 'flowing',
          prompt: 'A watercolor illustration...'
        }
      ]);

      vi.mocked(WizardLLMService.makeStructuredRequest).mockResolvedValue({
        success: true,
        data: mockResponse
      });

      vi.mocked(WizardLLMService.parseStyleResponse).mockReturnValue({
        success: true,
        data: [
          {
            name: 'Watercolor Style',
            artStyle: 'watercolor',
            colorPalette: 'soft pastels',
            visualTheme: 'gentle',
            characterStyle: 'rounded',
            environmentStyle: 'flowing',
            prompt: 'A watercolor illustration...'
          }
        ]
      });

      const result = await BookCreationWizardService.generateStyleVariations(
        'Educational book',
        'colorful and engaging'
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Watercolor Style');
      expect(WizardLLMService.makeStructuredRequest).toHaveBeenCalledWith(
        'style',
        expect.objectContaining({
          concept: 'Educational book',
          stylePreferences: 'colorful and engaging'
        })
      );
    });
  });

  describe('generateStyleImages', () => {
    it('should generate images for style variations', async () => {
      const variations = [
        {
          name: 'Style 1',
          artStyle: 'digital',
          colorPalette: 'vibrant',
          visualTheme: 'modern',
          characterStyle: 'simple',
          environmentStyle: 'minimal',
          prompt: 'A digital illustration...'
        }
      ];

      vi.mocked(ImageGenerationService.generateImage).mockResolvedValue({
        success: true,
        imageUrl: 'blob:http://localhost/test-image'
      });

      const result = await BookCreationWizardService.generateStyleImages(variations);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Style 1');
      expect(result[0].imageUrl).toBe('blob:http://localhost/test-image');
      expect(result[0].style.artStyle).toBe('digital');
      expect(ImageGenerationService.generateImage).toHaveBeenCalledWith({
        prompt: 'A digital illustration...',
        aspectRatio: '3:4',
        model: undefined
      });
    });

    it('should handle image generation failures gracefully', async () => {
      const variations = [
        {
          name: 'Style 1',
          artStyle: 'digital',
          colorPalette: 'vibrant',
          visualTheme: 'modern',
          characterStyle: 'simple',
          environmentStyle: 'minimal',
          prompt: 'Prompt 1'
        },
        {
          name: 'Style 2',
          artStyle: 'watercolor',
          colorPalette: 'soft',
          visualTheme: 'gentle',
          characterStyle: 'rounded',
          environmentStyle: 'flowing',
          prompt: 'Prompt 2'
        }
      ];

      vi.mocked(ImageGenerationService.generateImage)
        .mockResolvedValueOnce({
          success: false,
          error: 'Generation failed'
        })
        .mockResolvedValueOnce({
          success: true,
          imageUrl: 'blob:http://localhost/test-image-2'
        });

      const result = await BookCreationWizardService.generateStyleImages(variations);

      // Should only include successful generation
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Style 2');
    });

    it('should throw error if all generations fail', async () => {
      const variations = [
        {
          name: 'Style 1',
          artStyle: 'digital',
          colorPalette: 'vibrant',
          visualTheme: 'modern',
          characterStyle: 'simple',
          environmentStyle: 'minimal',
          prompt: 'Prompt 1'
        }
      ];

      vi.mocked(ImageGenerationService.generateImage).mockResolvedValue({
        success: false,
        error: 'Generation failed'
      });

      await expect(
        BookCreationWizardService.generateStyleImages(variations)
      ).rejects.toThrow('Failed to generate any style sample images');
    });
  });

  describe('refineStylePrompt', () => {
    it('should refine style prompt based on feedback', async () => {
      vi.mocked(WizardLLMService.makeStructuredRequest).mockResolvedValue({
        success: true,
        data: 'A more cartoonish illustration with exaggerated features'
      });

      vi.mocked(WizardLLMService.parseRefinementResponse).mockReturnValue({
        success: true,
        data: 'A more cartoonish illustration with exaggerated features'
      });

      const result = await BookCreationWizardService.refineStylePrompt(
        'A digital illustration',
        'make it more cartoonish',
        'Educational book'
      );

      expect(result).toBe('A more cartoonish illustration with exaggerated features');
      expect(WizardLLMService.makeStructuredRequest).toHaveBeenCalledWith(
        'refinement',
        expect.objectContaining({
          concept: 'Educational book',
          currentStylePrompt: 'A digital illustration',
          stylePreferences: 'make it more cartoonish'
        })
      );
    });
  });

  describe('generateRefinedImage', () => {
    it('should generate image from refined prompt', async () => {
      vi.mocked(ImageGenerationService.generateImage).mockResolvedValue({
        success: true,
        imageUrl: 'blob:http://localhost/refined-image'
      });

      const result = await BookCreationWizardService.generateRefinedImage(
        'Refined prompt',
        '16:9'
      );

      expect(result).toBe('blob:http://localhost/refined-image');
      expect(ImageGenerationService.generateImage).toHaveBeenCalledWith({
        prompt: 'Refined prompt',
        aspectRatio: '16:9',
        model: undefined
      });
    });

    it('should handle generation failure', async () => {
      vi.mocked(ImageGenerationService.generateImage).mockResolvedValue({
        success: false,
        error: 'Generation failed'
      });

      await expect(
        BookCreationWizardService.generateRefinedImage('Prompt')
      ).rejects.toThrow('Generation failed');
    });
  });

  describe('suggestCharacterCount', () => {
    it('should suggest 2 characters for short concept', async () => {
      const result = await BookCreationWizardService.suggestCharacterCount(
        'A simple story'
      );
      expect(result).toBe(2);
    });

    it('should suggest 3 characters for medium concept', async () => {
      // Need 20-49 words for 3 characters
      const mediumConcept = 'A story about learning algorithms through visual examples ' +
        'with interactive elements that help students understand complex concepts ' +
        'in computer science through engaging narratives and memorable characters ' +
        'who guide them through the learning journey with patience and clarity';
      
      const result = await BookCreationWizardService.suggestCharacterCount(mediumConcept);
      expect(result).toBe(3);
    });

    it('should suggest 4 characters for long concept', async () => {
      // Need 50+ words for 4 characters
      const longConcept = 'A comprehensive educational book about computer science algorithms ' +
        'featuring multiple characters who guide students through various topics including ' +
        'sorting, searching, graph algorithms, and dynamic programming with detailed examples ' +
        'and interactive visualizations to enhance understanding of fundamental concepts ' +
        'while maintaining engagement through storytelling and practical applications that ' +
        'demonstrate real-world use cases and problem-solving techniques in modern software development';
      
      const result = await BookCreationWizardService.suggestCharacterCount(longConcept);
      expect(result).toBe(4);
    });
  });

  describe('generateCharacterProfile', () => {
    it('should generate character profile', async () => {
      const mockResponse = JSON.stringify({
        name: 'Professor Algorithm',
        description: 'A wise computer science professor',
        visualDetails: {
          appearance: 'Elderly with white hair',
          clothing: 'Tweed jacket',
          distinctiveFeatures: 'Always carries a pointer'
        }
      });

      vi.mocked(WizardLLMService.makeStructuredRequest).mockResolvedValue({
        success: true,
        data: mockResponse
      });

      vi.mocked(WizardLLMService.parseCharacterResponse).mockReturnValue({
        success: true,
        data: {
          name: 'Professor Algorithm',
          description: 'A wise computer science professor',
          visualDetails: {
            appearance: 'Elderly with white hair',
            clothing: 'Tweed jacket',
            distinctiveFeatures: 'Always carries a pointer'
          }
        }
      });

      const result = await BookCreationWizardService.generateCharacterProfile(
        'Professor Algorithm',
        'Teacher',
        'A wise professor',
        'Educational book',
        { artStyle: 'digital' }
      );

      expect(result.name).toBe('Professor Algorithm');
      expect(result.visualDetails.appearance).toContain('white hair');
    });
  });

  describe('State Persistence', () => {
    const mockState: WizardState = {
      currentStep: 'concept',
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'Test message',
          timestamp: new Date()
        }
      ],
      bookData: {
        concept: 'Test concept',
        characters: []
      },
      styleRefinement: {
        initialOptions: [],
        refinementHistory: [],
        currentImages: [],
        isRefining: false
      },
      isProcessing: false,
      error: null
    };

    it('should save wizard state to localStorage', async () => {
      await BookCreationWizardService.saveWizardState(mockState);

      const stored = localStorage.getItem('bookCreationWizardState');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(1);
      expect(parsed.state.currentStep).toBe('concept');
    });

    it('should load wizard state from localStorage', async () => {
      await BookCreationWizardService.saveWizardState(mockState);
      
      const loaded = await BookCreationWizardService.loadWizardState();
      
      expect(loaded).toBeTruthy();
      expect(loaded?.currentStep).toBe('concept');
      expect(loaded?.messages).toHaveLength(1);
    });

    it('should return null if no state exists', async () => {
      const loaded = await BookCreationWizardService.loadWizardState();
      expect(loaded).toBeNull();
    });

    it('should clear state on version mismatch', async () => {
      const invalidState = {
        version: 999,
        timestamp: new Date(),
        state: mockState,
        temporaryImages: []
      };
      
      localStorage.setItem('bookCreationWizardState', JSON.stringify(invalidState));
      
      const loaded = await BookCreationWizardService.loadWizardState();
      expect(loaded).toBeNull();
      expect(localStorage.getItem('bookCreationWizardState')).toBeNull();
    });

    it('should clear state on corrupted data', async () => {
      localStorage.setItem('bookCreationWizardState', 'invalid json');
      
      const loaded = await BookCreationWizardService.loadWizardState();
      expect(loaded).toBeNull();
      expect(localStorage.getItem('bookCreationWizardState')).toBeNull();
    });

    it('should clear wizard state and cleanup images', async () => {
      const stateWithImages: WizardState = {
        ...mockState,
        styleRefinement: {
          initialOptions: [
            {
              id: 'img-1',
              name: 'Style 1',
              prompt: 'Prompt',
              imageUrl: 'blob:test',
              style: {}
            }
          ],
          refinementHistory: [],
          currentImages: [
            {
              id: 'img-2',
              url: 'blob:test2',
              prompt: 'Prompt',
              timestamp: new Date()
            }
          ],
          isRefining: false
        }
      };

      vi.mocked(ImageStorageService.deleteImage).mockResolvedValue();

      await BookCreationWizardService.saveWizardState(stateWithImages);
      await BookCreationWizardService.clearWizardState();

      expect(localStorage.getItem('bookCreationWizardState')).toBeNull();
      expect(ImageStorageService.deleteImage).toHaveBeenCalled();
    });
  });

  describe('storeTemporaryImage', () => {
    it('should store temporary wizard image', async () => {
      vi.mocked(ImageStorageService.storeImage).mockResolvedValue();

      const result = await BookCreationWizardService.storeTemporaryImage(
        'blob:http://localhost/test',
        'Test prompt'
      );

      expect(result.url).toBe('blob:http://localhost/test');
      expect(result.prompt).toBe('Test prompt');
      expect(result.id).toBeTruthy();
      expect(ImageStorageService.storeImage).toHaveBeenCalledWith(
        expect.any(String),
        'wizard-temp',
        'blob:http://localhost/test',
        'wizard-style-sample'
      );
    });

    it('should return image even if storage fails', async () => {
      vi.mocked(ImageStorageService.storeImage).mockRejectedValue(
        new Error('Storage failed')
      );

      const result = await BookCreationWizardService.storeTemporaryImage(
        'blob:http://localhost/test',
        'Test prompt'
      );

      expect(result.url).toBe('blob:http://localhost/test');
      expect(result.id).toBeTruthy();
    });
  });

  describe('cleanupTemporaryImages', () => {
    it('should cleanup temporary images', async () => {
      vi.mocked(ImageStorageService.deleteImage).mockResolvedValue();

      await BookCreationWizardService.cleanupTemporaryImages(['img-1', 'img-2']);

      expect(ImageStorageService.deleteImage).toHaveBeenCalledTimes(2);
      expect(ImageStorageService.deleteImage).toHaveBeenCalledWith('img-1');
      expect(ImageStorageService.deleteImage).toHaveBeenCalledWith('img-2');
    });

    it('should continue cleanup even if some deletions fail', async () => {
      vi.mocked(ImageStorageService.deleteImage)
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce();

      await BookCreationWizardService.cleanupTemporaryImages(['img-1', 'img-2']);

      expect(ImageStorageService.deleteImage).toHaveBeenCalledTimes(2);
    });
  });
});
