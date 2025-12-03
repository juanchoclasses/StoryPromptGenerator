/**
 * Tests for useSceneEditor hook
 * 
 * **Feature: scene-editor-refactoring, Property 5: useSceneEditor hook correctness**
 * **Validates: Requirements 6.1, 6.3, 6.4**
 * 
 * This test suite verifies that the useSceneEditor hook correctly:
 * - Manages scene editing state
 * - Handles field updates without data loss
 * - Saves changes to BookService correctly
 * - Handles save errors gracefully
 * - Provides macro insertion functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSceneEditor } from '../../src/hooks/useSceneEditor';
import type { Scene, Story } from '../../src/types/Story';
import { BookService } from '../../src/services/BookService';

// Mock BookService
vi.mock('../../src/services/BookService', () => ({
  BookService: {
    getActiveBookData: vi.fn(),
    saveActiveBookData: vi.fn(),
  }
}));

describe('useSceneEditor', () => {
  const mockStory: Story = {
    id: 'story-1',
    title: 'Test Story',
    backgroundSetup: 'Test background',
    scenes: [],
    characters: [],
    elements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockScene: Scene = {
    id: 'scene-1',
    title: 'Test Scene',
    description: 'Test description',
    textPanel: 'Test text panel',
    characters: ['Character 1'],
    elements: ['Element 1'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockBookData = {
    id: 'book-1',
    title: 'Test Book',
    stories: [
      {
        ...mockStory,
        scenes: [mockScene]
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockOnSceneUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BookService.getActiveBookData).mockResolvedValue(mockBookData as any);
    vi.mocked(BookService.saveActiveBookData).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('State Initialization', () => {
    it('should initialize with scene data when scene is provided', () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      expect(result.current.sceneTitle).toBe('Test Scene');
      expect(result.current.sceneDescription).toBe('Test description');
      expect(result.current.textPanelContent).toBe('Test text panel');
      expect(result.current.selectedCharacters).toEqual(['Character 1']);
      expect(result.current.selectedElements).toEqual(['Element 1']);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.saveError).toBeNull();
    });

    it('should initialize with empty values when scene is null', () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, null, mockOnSceneUpdate)
      );

      expect(result.current.sceneTitle).toBe('');
      expect(result.current.sceneDescription).toBe('');
      expect(result.current.textPanelContent).toBe('');
      expect(result.current.selectedCharacters).toEqual([]);
      expect(result.current.selectedElements).toEqual([]);
    });

    it('should handle scene with backward compatible characterIds field', () => {
      const sceneWithOldFormat: Scene = {
        ...mockScene,
        characters: undefined as any,
        characterIds: ['Old Character'] as any
      };

      const { result } = renderHook(() => 
        useSceneEditor(mockStory, sceneWithOldFormat, mockOnSceneUpdate)
      );

      expect(result.current.selectedCharacters).toEqual(['Old Character']);
    });

    it('should handle scene with backward compatible elementIds field', () => {
      const sceneWithOldFormat: Scene = {
        ...mockScene,
        elements: undefined as any,
        elementIds: ['Old Element'] as any
      };

      const { result } = renderHook(() => 
        useSceneEditor(mockStory, sceneWithOldFormat, mockOnSceneUpdate)
      );

      expect(result.current.selectedElements).toEqual(['Old Element']);
    });
  });

  describe('Field Updates', () => {
    it('should update scene title and auto-save', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleTitleChange('New Title');
      });

      expect(result.current.sceneTitle).toBe('New Title');
      
      await waitFor(() => {
        expect(BookService.getActiveBookData).toHaveBeenCalled();
        expect(BookService.saveActiveBookData).toHaveBeenCalled();
        expect(mockOnSceneUpdate).toHaveBeenCalled();
      });
    });

    it('should update scene description and auto-save', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleDescriptionChange('New Description');
      });

      expect(result.current.sceneDescription).toBe('New Description');
      
      await waitFor(() => {
        expect(BookService.getActiveBookData).toHaveBeenCalled();
        expect(BookService.saveActiveBookData).toHaveBeenCalled();
        expect(mockOnSceneUpdate).toHaveBeenCalled();
      });
    });

    it('should update text panel content and auto-save', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleTextPanelChange('New Text Panel');
      });

      expect(result.current.textPanelContent).toBe('New Text Panel');
      
      await waitFor(() => {
        expect(BookService.getActiveBookData).toHaveBeenCalled();
        expect(BookService.saveActiveBookData).toHaveBeenCalled();
        // Note: text panel change doesn't call onSceneUpdate to avoid input clearing
      });
    });

    it('should update character selection and auto-save', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleCharacterSelectionChange(['Character 1', 'Character 2']);
      });

      expect(result.current.selectedCharacters).toEqual(['Character 1', 'Character 2']);
      
      await waitFor(() => {
        expect(BookService.getActiveBookData).toHaveBeenCalled();
        expect(BookService.saveActiveBookData).toHaveBeenCalled();
        expect(mockOnSceneUpdate).toHaveBeenCalled();
      });
    });

    it('should update element selection and auto-save', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleElementSelectionChange(['Element 1', 'Element 2']);
      });

      expect(result.current.selectedElements).toEqual(['Element 1', 'Element 2']);
      
      await waitFor(() => {
        expect(BookService.getActiveBookData).toHaveBeenCalled();
        expect(BookService.saveActiveBookData).toHaveBeenCalled();
        expect(mockOnSceneUpdate).toHaveBeenCalled();
      });
    });

    it('should not save when story is null', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(null, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleTitleChange('New Title');
      });

      expect(result.current.sceneTitle).toBe('New Title');
      expect(BookService.saveActiveBookData).not.toHaveBeenCalled();
    });

    it('should not save when scene is null', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, null, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleTitleChange('New Title');
      });

      expect(result.current.sceneTitle).toBe('New Title');
      expect(BookService.saveActiveBookData).not.toHaveBeenCalled();
    });
  });

  describe('Save Operations', () => {
    it('should save all scene changes successfully', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      // Make some changes
      await act(async () => {
        await result.current.handleTitleChange('Updated Title');
        await result.current.handleDescriptionChange('Updated Description');
        await result.current.handleTextPanelChange('Updated Text');
      });

      // Save
      await act(async () => {
        await result.current.saveScene();
      });

      expect(result.current.isSaving).toBe(false);
      expect(result.current.saveError).toBeNull();
      expect(BookService.saveActiveBookData).toHaveBeenCalled();
      expect(mockOnSceneUpdate).toHaveBeenCalled();
    });

    it('should set isSaving to true during save operation', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      // Start the save operation without awaiting
      let savePromise: Promise<void>;
      act(() => {
        savePromise = result.current.saveScene();
      });

      // Check that isSaving is true immediately after starting
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      // Wait for save to complete
      await act(async () => {
        await savePromise!;
      });

      // After completion, isSaving should be false
      expect(result.current.isSaving).toBe(false);
    });

    it('should handle save errors gracefully', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      const errorMessage = 'Failed to save';
      vi.mocked(BookService.saveActiveBookData).mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await result.current.saveScene();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isSaving).toBe(false);
      expect(result.current.saveError).toBe(errorMessage);
    });

    it('should set error when saving with no scene selected', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, null, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.saveScene();
      });

      expect(result.current.saveError).toBe('No scene selected');
      expect(BookService.saveActiveBookData).not.toHaveBeenCalled();
    });

    it('should set error when saving with no story selected', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(null, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.saveScene();
      });

      expect(result.current.saveError).toBe('No scene selected');
      expect(BookService.saveActiveBookData).not.toHaveBeenCalled();
    });
  });

  describe('Macro Insertion', () => {
    it('should insert macro at cursor position', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      // Set initial text
      await act(async () => {
        await result.current.handleTextPanelChange('Hello World');
      });

      // Insert macro at position 6 (after "Hello ")
      let newText: string = '';
      await act(async () => {
        newText = result.current.handleInsertMacro('{SceneDescription}', 6);
      });

      expect(newText).toBe('Hello {SceneDescription}World');
      expect(result.current.textPanelContent).toBe('Hello {SceneDescription}World');
    });

    it('should insert macro at beginning of text', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleTextPanelChange('World');
      });

      let newText: string = '';
      await act(async () => {
        newText = result.current.handleInsertMacro('Hello ', 0);
      });

      expect(newText).toBe('Hello World');
    });

    it('should insert macro at end of text', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleTextPanelChange('Hello');
      });

      let newText: string = '';
      await act(async () => {
        newText = result.current.handleInsertMacro(' World', 5);
      });

      expect(newText).toBe('Hello World');
    });

    it('should auto-save after macro insertion', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleTextPanelChange('Test');
      });

      vi.clearAllMocks();

      await act(async () => {
        result.current.handleInsertMacro('{Macro}', 4);
      });

      await waitFor(() => {
        expect(BookService.getActiveBookData).toHaveBeenCalled();
        expect(BookService.saveActiveBookData).toHaveBeenCalled();
        expect(mockOnSceneUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle BookService.getActiveBookData failure in title change', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      vi.mocked(BookService.getActiveBookData).mockRejectedValue(new Error('Failed to get data'));

      await act(async () => {
        await result.current.handleTitleChange('New Title');
      });

      expect(result.current.sceneTitle).toBe('New Title');
      expect(result.current.saveError).toBe('Failed to get data');
    });

    it('should handle BookService.saveActiveBookData failure in description change', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      vi.mocked(BookService.saveActiveBookData).mockRejectedValue(new Error('Save failed'));

      await act(async () => {
        await result.current.handleDescriptionChange('New Description');
      });

      expect(result.current.sceneDescription).toBe('New Description');
      expect(result.current.saveError).toBe('Save failed');
    });

    it('should handle null activeBookData gracefully', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      vi.mocked(BookService.getActiveBookData).mockResolvedValue(null);

      await act(async () => {
        await result.current.handleTitleChange('New Title');
      });

      expect(result.current.sceneTitle).toBe('New Title');
      // Should not crash, just not save
      expect(BookService.saveActiveBookData).not.toHaveBeenCalled();
    });
  });

  describe('Data Persistence', () => {
    it('should save both new and backward compatible field names', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      await act(async () => {
        await result.current.handleCharacterSelectionChange(['Char1', 'Char2']);
      });

      await waitFor(() => {
        const saveCall = vi.mocked(BookService.saveActiveBookData).mock.calls[0][0];
        const updatedScene = saveCall.stories[0].scenes[0];
        
        expect(updatedScene.characters).toEqual(['Char1', 'Char2']);
        expect(updatedScene.characterIds).toEqual(['Char1', 'Char2']);
      });
    });

    it('should update updatedAt timestamp on save', async () => {
      const { result } = renderHook(() => 
        useSceneEditor(mockStory, mockScene, mockOnSceneUpdate)
      );

      const beforeTime = new Date();

      await act(async () => {
        await result.current.saveScene();
      });

      await waitFor(() => {
        const saveCall = vi.mocked(BookService.saveActiveBookData).mock.calls[0][0];
        const updatedScene = saveCall.stories[0].scenes[0];
        
        expect(updatedScene.updatedAt).toBeInstanceOf(Date);
        expect(updatedScene.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      });
    });
  });
});
