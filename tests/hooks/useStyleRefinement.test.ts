import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStyleRefinement } from '../../src/hooks/useStyleRefinement';
import { BookCreationWizardService } from '../../src/services/BookCreationWizardService';
import type { StyleVariation, StyleOption } from '../../src/types/Wizard';

// Mock the BookCreationWizardService
vi.mock('../../src/services/BookCreationWizardService');

describe('useStyleRefinement', () => {
  const mockStyleVariations: StyleVariation[] = [
    {
      name: 'Watercolor Dreams',
      artStyle: 'hand-painted watercolor',
      colorPalette: 'soft pastels with vibrant accents',
      visualTheme: 'whimsical and educational',
      characterStyle: 'simplified shapes, expressive faces',
      environmentStyle: 'abstract geometric backgrounds',
      prompt: 'watercolor style, soft colors, whimsical characters'
    },
    {
      name: 'Digital Comic',
      artStyle: 'digital illustration',
      colorPalette: 'bold primary colors',
      visualTheme: 'energetic and modern',
      characterStyle: 'cartoon style with clean lines',
      environmentStyle: 'detailed urban backgrounds',
      prompt: 'digital comic style, bold colors, cartoon characters'
    },
    {
      name: 'Vintage Storybook',
      artStyle: 'traditional illustration',
      colorPalette: 'warm earth tones',
      visualTheme: 'nostalgic and cozy',
      characterStyle: 'detailed realistic characters',
      environmentStyle: 'hand-drawn natural settings',
      prompt: 'vintage storybook style, warm tones, detailed illustration'
    }
  ];

  const mockStyleOptions: StyleOption[] = mockStyleVariations.map((variation, index) => ({
    id: `style-${index + 1}`,
    name: variation.name,
    prompt: variation.prompt,
    imageUrl: `https://example.com/image-${index + 1}.jpg`,
    style: {
      artStyle: variation.artStyle,
      colorPalette: variation.colorPalette,
      visualTheme: variation.visualTheme,
      characterStyle: variation.characterStyle,
      environmentStyle: variation.environmentStyle
    }
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty refinement state', () => {
      const { result } = renderHook(() => useStyleRefinement());

      expect(result.current.refinementState.initialOptions).toEqual([]);
      expect(result.current.refinementState.selectedOption).toBeUndefined();
      expect(result.current.refinementState.refinementHistory).toEqual([]);
      expect(result.current.refinementState.currentImages).toEqual([]);
      expect(result.current.refinementState.isRefining).toBe(false);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('generateInitialStyles', () => {
    it('should generate initial style options', async () => {
      vi.mocked(BookCreationWizardService.generateStyleVariations).mockResolvedValue(mockStyleVariations);
      vi.mocked(BookCreationWizardService.generateStyleImages).mockResolvedValue(mockStyleOptions);

      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('A book about algorithms', 'colorful and modern');
      });

      expect(BookCreationWizardService.generateStyleVariations).toHaveBeenCalledWith(
        'A book about algorithms',
        'colorful and modern'
      );
      expect(BookCreationWizardService.generateStyleImages).toHaveBeenCalledWith(
        mockStyleVariations,
        '3:4'
      );
      expect(result.current.refinementState.initialOptions).toEqual(mockStyleOptions);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should use custom aspect ratio', async () => {
      vi.mocked(BookCreationWizardService.generateStyleVariations).mockResolvedValue(mockStyleVariations);
      vi.mocked(BookCreationWizardService.generateStyleImages).mockResolvedValue(mockStyleOptions);

      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept', undefined, '16:9');
      });

      expect(BookCreationWizardService.generateStyleImages).toHaveBeenCalledWith(
        mockStyleVariations,
        '16:9'
      );
    });

    it('should set isGenerating during generation', async () => {
      let resolveGeneration: (value: StyleVariation[]) => void;
      const generationPromise = new Promise<StyleVariation[]>((resolve) => {
        resolveGeneration = resolve;
      });

      vi.mocked(BookCreationWizardService.generateStyleVariations).mockReturnValue(generationPromise);
      vi.mocked(BookCreationWizardService.generateStyleImages).mockResolvedValue(mockStyleOptions);

      const { result } = renderHook(() => useStyleRefinement());

      // Start generation without awaiting
      act(() => {
        result.current.generateInitialStyles('Test concept');
      });

      // Should be generating immediately
      expect(result.current.isGenerating).toBe(true);

      // Resolve the generation
      await act(async () => {
        resolveGeneration!(mockStyleVariations);
        await generationPromise;
      });

      // Should no longer be generating
      expect(result.current.isGenerating).toBe(false);
    });

    it('should handle generation errors', async () => {
      const error = new Error('Failed to generate styles');
      vi.mocked(BookCreationWizardService.generateStyleVariations).mockRejectedValue(error);

      const { result } = renderHook(() => useStyleRefinement());

      let caughtError: unknown = null;
      await act(async () => {
        try {
          await result.current.generateInitialStyles('Test concept');
        } catch (err) {
          caughtError = err;
        }
      });

      expect((caughtError as Error)?.message).toBe('Failed to generate styles');
      expect(result.current.error).toBe('Failed to generate styles');
      expect(result.current.isGenerating).toBe(false);
    });

    it('should reset state when generating new styles', async () => {
      vi.mocked(BookCreationWizardService.generateStyleVariations).mockResolvedValue(mockStyleVariations);
      vi.mocked(BookCreationWizardService.generateStyleImages).mockResolvedValue(mockStyleOptions);

      const { result } = renderHook(() => useStyleRefinement());

      // First generation
      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      // Select a style
      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      // Generate new styles
      await act(async () => {
        await result.current.generateInitialStyles('New concept');
      });

      // Should reset selection and refinement history
      expect(result.current.refinementState.selectedOption).toBeUndefined();
      expect(result.current.refinementState.refinementHistory).toEqual([]);
      expect(result.current.refinementState.currentImages).toEqual([]);
    });
  });

  describe('selectStyle', () => {
    beforeEach(async () => {
      vi.mocked(BookCreationWizardService.generateStyleVariations).mockResolvedValue(mockStyleVariations);
      vi.mocked(BookCreationWizardService.generateStyleImages).mockResolvedValue(mockStyleOptions);
    });

    it('should select a style option', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      expect(result.current.refinementState.selectedOption).toEqual(mockStyleOptions[0]);
      expect(result.current.refinementState.currentImages).toHaveLength(1);
      expect(result.current.refinementState.currentImages[0].url).toBe(mockStyleOptions[0].imageUrl);
      expect(result.current.refinementState.currentImages[0].prompt).toBe(mockStyleOptions[0].prompt);
    });

    it('should reset refinement history when selecting new style', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      // Select first style and refine it
      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      vi.mocked(BookCreationWizardService.refineStylePrompt).mockResolvedValue('refined prompt');
      vi.mocked(BookCreationWizardService.generateRefinedImage).mockResolvedValue('https://example.com/refined.jpg');

      await act(async () => {
        await result.current.refineStyle('make it brighter', 'Test concept');
      });

      expect(result.current.refinementState.refinementHistory).toHaveLength(1);

      // Select different style
      act(() => {
        result.current.selectStyle(mockStyleOptions[1].id);
      });

      // Refinement history should be reset
      expect(result.current.refinementState.refinementHistory).toEqual([]);
      expect(result.current.refinementState.selectedOption).toEqual(mockStyleOptions[1]);
    });

    it('should handle selecting non-existent style', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      const previousState = result.current.refinementState;

      act(() => {
        result.current.selectStyle('non-existent-id');
      });

      // State should remain unchanged
      expect(result.current.refinementState).toEqual(previousState);
    });

    it('should clear error when selecting style', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      // Set an error
      vi.mocked(BookCreationWizardService.refineStylePrompt).mockRejectedValue(new Error('Test error'));
      
      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      await act(async () => {
        try {
          await result.current.refineStyle('test', 'concept');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();

      // Select another style
      act(() => {
        result.current.selectStyle(mockStyleOptions[1].id);
      });

      // Error should be cleared
      expect(result.current.error).toBe(null);
    });
  });

  describe('refineStyle', () => {
    beforeEach(async () => {
      vi.mocked(BookCreationWizardService.generateStyleVariations).mockResolvedValue(mockStyleVariations);
      vi.mocked(BookCreationWizardService.generateStyleImages).mockResolvedValue(mockStyleOptions);
    });

    it('should refine selected style', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      const refinedPrompt = 'watercolor style, bright vibrant colors, whimsical characters';
      const refinedImageUrl = 'https://example.com/refined.jpg';

      vi.mocked(BookCreationWizardService.refineStylePrompt).mockResolvedValue(refinedPrompt);
      vi.mocked(BookCreationWizardService.generateRefinedImage).mockResolvedValue(refinedImageUrl);

      await act(async () => {
        await result.current.refineStyle('make it brighter and more vibrant', 'Test concept');
      });

      expect(BookCreationWizardService.refineStylePrompt).toHaveBeenCalledWith(
        mockStyleOptions[0].prompt,
        'make it brighter and more vibrant',
        'Test concept'
      );
      expect(BookCreationWizardService.generateRefinedImage).toHaveBeenCalledWith(refinedPrompt, '3:4');

      expect(result.current.refinementState.refinementHistory).toHaveLength(1);
      expect(result.current.refinementState.refinementHistory[0].userFeedback).toBe('make it brighter and more vibrant');
      expect(result.current.refinementState.refinementHistory[0].modifiedPrompt).toBe(refinedPrompt);
      expect(result.current.refinementState.currentImages).toHaveLength(1);
      expect(result.current.refinementState.currentImages[0].url).toBe(refinedImageUrl);
    });

    it('should use last refinement prompt for subsequent refinements', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      // First refinement
      const firstRefinedPrompt = 'watercolor style, bright colors';
      vi.mocked(BookCreationWizardService.refineStylePrompt).mockResolvedValue(firstRefinedPrompt);
      vi.mocked(BookCreationWizardService.generateRefinedImage).mockResolvedValue('https://example.com/refined1.jpg');

      await act(async () => {
        await result.current.refineStyle('make it brighter', 'Test concept');
      });

      // Second refinement
      const secondRefinedPrompt = 'watercolor style, bright colors, more contrast';
      vi.mocked(BookCreationWizardService.refineStylePrompt).mockResolvedValue(secondRefinedPrompt);
      vi.mocked(BookCreationWizardService.generateRefinedImage).mockResolvedValue('https://example.com/refined2.jpg');

      await act(async () => {
        await result.current.refineStyle('add more contrast', 'Test concept');
      });

      // Should use the first refined prompt as base for second refinement
      expect(BookCreationWizardService.refineStylePrompt).toHaveBeenLastCalledWith(
        firstRefinedPrompt,
        'add more contrast',
        'Test concept'
      );

      expect(result.current.refinementState.refinementHistory).toHaveLength(2);
    });

    it('should throw error if no style is selected', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      let caughtError: unknown = null;
      await act(async () => {
        try {
          await result.current.refineStyle('make it brighter', 'Test concept');
        } catch (err) {
          caughtError = err;
        }
      });

      expect((caughtError as Error)?.message).toBe('No style selected for refinement');
      expect(result.current.error).toBe('No style selected for refinement');
    });

    it('should set isRefining during refinement', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      let resolveRefinement: (value: string) => void;
      const refinementPromise = new Promise<string>((resolve) => {
        resolveRefinement = resolve;
      });

      vi.mocked(BookCreationWizardService.refineStylePrompt).mockReturnValue(refinementPromise);
      vi.mocked(BookCreationWizardService.generateRefinedImage).mockResolvedValue('https://example.com/refined.jpg');

      // Start refinement without awaiting
      act(() => {
        result.current.refineStyle('test feedback', 'Test concept');
      });

      // Should be refining immediately
      expect(result.current.refinementState.isRefining).toBe(true);

      // Resolve the refinement
      await act(async () => {
        resolveRefinement!('refined prompt');
        await refinementPromise;
      });

      // Should no longer be refining
      expect(result.current.refinementState.isRefining).toBe(false);
    });

    it('should handle refinement errors', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      const error = new Error('Failed to refine style');
      vi.mocked(BookCreationWizardService.refineStylePrompt).mockRejectedValue(error);

      let caughtError: unknown = null;
      await act(async () => {
        try {
          await result.current.refineStyle('test feedback', 'Test concept');
        } catch (err) {
          caughtError = err;
        }
      });

      expect((caughtError as Error)?.message).toBe('Failed to refine style');
      expect(result.current.error).toBe('Failed to refine style');
      expect(result.current.refinementState.isRefining).toBe(false);
    });

    it('should use custom aspect ratio', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      vi.mocked(BookCreationWizardService.refineStylePrompt).mockResolvedValue('refined prompt');
      vi.mocked(BookCreationWizardService.generateRefinedImage).mockResolvedValue('https://example.com/refined.jpg');

      await act(async () => {
        await result.current.refineStyle('test feedback', 'Test concept', '16:9');
      });

      expect(BookCreationWizardService.generateRefinedImage).toHaveBeenCalledWith('refined prompt', '16:9');
    });
  });

  describe('confirmStyle', () => {
    beforeEach(async () => {
      vi.mocked(BookCreationWizardService.generateStyleVariations).mockResolvedValue(mockStyleVariations);
      vi.mocked(BookCreationWizardService.generateStyleImages).mockResolvedValue(mockStyleOptions);
    });

    it('should return null if no style is selected', () => {
      const { result } = renderHook(() => useStyleRefinement());

      let confirmed: StyleOption | null = null;
      act(() => {
        confirmed = result.current.confirmStyle();
      });

      expect(confirmed).toBe(null);
      expect(result.current.error).toBe('No style selected to confirm');
    });

    it('should return original style if no refinements were made', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      const confirmed = result.current.confirmStyle();

      expect(confirmed).toEqual(mockStyleOptions[0]);
    });

    it('should return style with refined prompt if refinements were made', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      const refinedPrompt = 'watercolor style, bright vibrant colors';
      const refinedImageUrl = 'https://example.com/refined.jpg';

      vi.mocked(BookCreationWizardService.refineStylePrompt).mockResolvedValue(refinedPrompt);
      vi.mocked(BookCreationWizardService.generateRefinedImage).mockResolvedValue(refinedImageUrl);

      await act(async () => {
        await result.current.refineStyle('make it brighter', 'Test concept');
      });

      const confirmed = result.current.confirmStyle();

      expect(confirmed).toEqual({
        ...mockStyleOptions[0],
        prompt: refinedPrompt,
        imageUrl: refinedImageUrl
      });
    });

    it('should use the last refinement if multiple refinements were made', async () => {
      const { result } = renderHook(() => useStyleRefinement());

      await act(async () => {
        await result.current.generateInitialStyles('Test concept');
      });

      act(() => {
        result.current.selectStyle(mockStyleOptions[0].id);
      });

      // First refinement
      vi.mocked(BookCreationWizardService.refineStylePrompt).mockResolvedValue('first refined prompt');
      vi.mocked(BookCreationWizardService.generateRefinedImage).mockResolvedValue('https://example.com/refined1.jpg');

      await act(async () => {
        await result.current.refineStyle('make it brighter', 'Test concept');
      });

      // Second refinement
      const finalPrompt = 'second refined prompt';
      const finalImageUrl = 'https://example.com/refined2.jpg';
      vi.mocked(BookCreationWizardService.refineStylePrompt).mockResolvedValue(finalPrompt);
      vi.mocked(BookCreationWizardService.generateRefinedImage).mockResolvedValue(finalImageUrl);

      await act(async () => {
        await result.current.refineStyle('add more contrast', 'Test concept');
      });

      const confirmed = result.current.confirmStyle();

      expect(confirmed).toEqual({
        ...mockStyleOptions[0],
        prompt: finalPrompt,
        imageUrl: finalImageUrl
      });
    });
  });
});
