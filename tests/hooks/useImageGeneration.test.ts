/**
 * Tests for useImageGeneration hook
 * 
 * **Feature: scene-editor-refactoring, Property 6: useImageGeneration hook correctness**
 * **Validates: Requirements 6.2, 6.3, 6.4**
 * 
 * This hook manages image generation state and workflow for scenes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useImageGeneration } from '../../src/hooks/useImageGeneration';
import type { Scene, Story } from '../../src/types/Story';
import type { PreviewData } from '../../src/components/ImageGenerationPreviewDialog';

// Mock the services
vi.mock('../../src/services/SceneImageGenerationService', () => ({
  SceneImageGenerationService: {
    generateCompleteSceneImage: vi.fn(),
    buildScenePrompt: vi.fn()
  }
}));

vi.mock('../../src/services/ImageStorageService', () => ({
  ImageStorageService: {
    storeImage: vi.fn(),
    getImage: vi.fn(),
    getCharacterImage: vi.fn()
  }
}));

vi.mock('../../src/services/BookService', () => ({
  BookService: {
    getActiveBookId: vi.fn(),
    getBook: vi.fn(),
    getActiveBookData: vi.fn(),
    saveActiveBookData: vi.fn()
  }
}));

import { SceneImageGenerationService } from '../../src/services/SceneImageGenerationService';
import { ImageStorageService } from '../../src/services/ImageStorageService';
import { BookService } from '../../src/services/BookService';

describe('useImageGeneration', () => {
  const mockScene: Scene = {
    id: 'scene-1',
    title: 'Test Scene',
    description: 'A test scene',
    characters: ['Alice'],
    elements: ['Table'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockStory: Story = {
    id: 'story-1',
    title: 'Test Story',
    backgroundSetup: 'Test background',
    scenes: [mockScene],
    characters: [{ name: 'Alice', description: 'A character' }],
    elements: [{ name: 'Table', description: 'A table' }],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockBook = {
    id: 'book-1',
    title: 'Test Book',
    aspectRatio: '3:4',
    stories: [mockStory],
    characters: []
  };

  const mockOnImageStateChange = vi.fn();
  const mockOnSceneUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(BookService.getActiveBookId).mockResolvedValue('book-1');
    vi.mocked(BookService.getBook).mockResolvedValue(mockBook);
    vi.mocked(BookService.getActiveBookData).mockResolvedValue(mockBook);
    vi.mocked(BookService.saveActiveBookData).mockResolvedValue(undefined);
    vi.mocked(ImageStorageService.storeImage).mockResolvedValue(undefined);
    vi.mocked(ImageStorageService.getImage).mockResolvedValue('blob:test-image-url');
    vi.mocked(SceneImageGenerationService.generateCompleteSceneImage).mockResolvedValue('data:image/png;base64,test');
    vi.mocked(SceneImageGenerationService.buildScenePrompt).mockResolvedValue('Test prompt');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('State initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generationError).toBeNull();
      expect(result.current.previewData).toBeNull();
    });
  });

  describe('Generation workflow', () => {
    it('should start generation and update state', async () => {
      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      expect(SceneImageGenerationService.generateCompleteSceneImage).toHaveBeenCalledWith(
        expect.objectContaining({
          scene: mockScene,
          story: mockStory,
          model: 'gemini-2.0-flash-exp',
          promptStrategy: 'auto'
        })
      );
    });

    it('should call onImageStateChange after successful generation', async () => {
      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
      });

      await waitFor(() => {
        expect(mockOnImageStateChange).toHaveBeenCalled();
      });
    });

    it('should call onSceneUpdate after successful generation', async () => {
      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
      });

      await waitFor(() => {
        expect(mockOnSceneUpdate).toHaveBeenCalled();
      });
    });

    it('should store generated image to filesystem', async () => {
      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
      });

      await waitFor(() => {
        expect(ImageStorageService.storeImage).toHaveBeenCalledWith(
          expect.any(String), // imageId
          mockScene.id,
          'data:image/png;base64,test',
          'gemini-2.0-flash-exp'
        );
      });
    });

    it('should save image to scene history', async () => {
      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
      });

      await waitFor(() => {
        expect(BookService.saveActiveBookData).toHaveBeenCalled();
      });

      const savedData = vi.mocked(BookService.saveActiveBookData).mock.calls[0][0];
      const savedScene = savedData.stories[0].scenes[0];
      expect(savedScene.imageHistory).toBeDefined();
      expect(savedScene.imageHistory.length).toBeGreaterThan(0);
    });
  });

  describe('State transitions', () => {
    it('should set isGenerating to true during generation', async () => {
      let resolveGeneration: (value: string) => void;
      const generationPromise = new Promise<string>((resolve) => {
        resolveGeneration = resolve;
      });
      
      vi.mocked(SceneImageGenerationService.generateCompleteSceneImage).mockReturnValue(generationPromise);

      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      act(() => {
        result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(true);
      });

      await act(async () => {
        resolveGeneration!('data:image/png;base64,test');
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it('should clear error when starting new generation', async () => {
      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      // First, cause an error
      vi.mocked(SceneImageGenerationService.generateCompleteSceneImage).mockRejectedValueOnce(
        new Error('Test error')
      );

      await act(async () => {
        try {
          await result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
        } catch (e) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.generationError).toBeTruthy();
      });

      // Now start a new generation
      vi.mocked(SceneImageGenerationService.generateCompleteSceneImage).mockResolvedValueOnce(
        'data:image/png;base64,test'
      );

      await act(async () => {
        await result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
      });

      await waitFor(() => {
        expect(result.current.generationError).toBeNull();
      });
    });
  });

  describe('Error handling', () => {
    it('should set generationError on failure', async () => {
      const testError = new Error('Generation failed');
      vi.mocked(SceneImageGenerationService.generateCompleteSceneImage).mockRejectedValueOnce(testError);

      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      await act(async () => {
        try {
          await result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
        } catch (e) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.generationError).toBe('Generation failed');
      });
    });

    it('should set isGenerating to false on error', async () => {
      vi.mocked(SceneImageGenerationService.generateCompleteSceneImage).mockRejectedValueOnce(
        new Error('Test error')
      );

      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      await act(async () => {
        try {
          await result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
        } catch (e) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it('should clear error with clearError method', async () => {
      vi.mocked(SceneImageGenerationService.generateCompleteSceneImage).mockRejectedValueOnce(
        new Error('Test error')
      );

      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      await act(async () => {
        try {
          await result.current.startGeneration('gemini-2.0-flash-exp', 'auto');
        } catch (e) {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.generationError).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.generationError).toBeNull();
    });
  });

  describe('Preview management', () => {
    it('should build preview data', async () => {
      vi.mocked(ImageStorageService.getCharacterImage).mockResolvedValue('blob:character-image');

      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      let previewData: PreviewData | null = null;
      await act(async () => {
        previewData = await result.current.buildPreview('gemini-2.0-flash-exp', 'auto');
      });

      expect(previewData).toBeDefined();
      expect(previewData?.sceneTitle).toBe('Test Scene');
      expect(previewData?.sceneDescription).toBe('A test scene');
      expect(previewData?.model).toBe('gemini-2.0-flash-exp');
      expect(previewData?.aspectRatio).toBe('3:4');
    });

    it('should include character images in preview', async () => {
      const mockCharacterImage = 'blob:character-image';
      vi.mocked(ImageStorageService.getCharacterImage).mockResolvedValue(mockCharacterImage);

      // Add image gallery to character
      const storyWithImages: Story = {
        ...mockStory,
        characters: [{
          name: 'Alice',
          description: 'A character',
          imageGallery: [{ id: 'img-1', url: 'test', timestamp: new Date() }],
          selectedImageId: 'img-1'
        }]
      };

      const { result } = renderHook(() =>
        useImageGeneration(mockScene, storyWithImages, mockOnImageStateChange, mockOnSceneUpdate)
      );

      let previewData: PreviewData | null = null;
      await act(async () => {
        previewData = await result.current.buildPreview('gemini-2.0-flash-exp', 'auto');
      });

      expect(previewData?.characterImages).toBeDefined();
      expect(previewData?.characterImages.length).toBeGreaterThan(0);
    });
  });

  describe('Cancellation', () => {
    it('should support cancellation', () => {
      const { result } = renderHook(() =>
        useImageGeneration(mockScene, mockStory, mockOnImageStateChange, mockOnSceneUpdate)
      );

      // The hook should provide a cancelGeneration method
      expect(result.current.cancelGeneration).toBeDefined();
      expect(typeof result.current.cancelGeneration).toBe('function');
    });
  });
});
