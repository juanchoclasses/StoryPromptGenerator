import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScenePromptPreview } from '../../src/components/ScenePromptPreview';
import type { Scene, Story } from '../../src/types/Story';
import type { Character } from '../../src/models/Story';
import { SceneImageGenerationService } from '../../src/services/SceneImageGenerationService';

// Mock the SceneImageGenerationService
vi.mock('../../src/services/SceneImageGenerationService', () => ({
  SceneImageGenerationService: {
    buildScenePrompt: vi.fn()
  }
}));

describe('ScenePromptPreview', () => {
  // Test data
  const mockScene: Scene = {
    id: 'scene-1',
    title: 'Test Scene',
    description: 'A test scene description',
    textPanel: 'Test text panel',
    characters: ['Alice', 'Bob'],
    elements: ['Tree', 'House'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockStory: Story = {
    id: 'story-1',
    title: 'Test Story',
    backgroundSetup: 'Test background',
    scenes: [mockScene],
    characters: [
      { name: 'Alice', description: 'Protagonist', imageGallery: [] },
      { name: 'Bob', description: 'Sidekick', imageGallery: [] }
    ],
    elements: [
      { name: 'Tree', description: 'A tall oak tree' },
      { name: 'House', description: 'A wooden cottage' }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockActiveBook = {
    id: 'book-1',
    title: 'Test Book',
    aspectRatio: '3:4',
    characters: []
  };

  const mockAvailableCharacters: (Character & { isBookLevel?: boolean })[] = [
    { name: 'Alice', description: 'Protagonist', imageGallery: [], isBookLevel: false },
    { name: 'Bob', description: 'Sidekick', imageGallery: [], isBookLevel: false }
  ];

  const mockAvailableElements = [
    { name: 'Tree', description: 'A tall oak tree', category: 'Nature' },
    { name: 'House', description: 'A wooden cottage', category: 'Building' }
  ];

  let mockOnInsertMacro: ReturnType<typeof vi.fn>;
  let mockBuildScenePrompt: ReturnType<typeof vi.fn>;
  let mockWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnInsertMacro = vi.fn();
    mockBuildScenePrompt = vi.fn().mockReturnValue('Generated prompt text');
    (SceneImageGenerationService.buildScenePrompt as any) = mockBuildScenePrompt;
    
    // Mock clipboard API
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render accordion with correct title', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(screen.getByText('AI Prompt Preview')).toBeInTheDocument();
    });

    it('should display generated prompt text', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(screen.getByText('Generated prompt text')).toBeInTheDocument();
    });

    it('should display "No prompt generated yet" when prompt is empty', () => {
      mockBuildScenePrompt.mockReturnValue('');
      
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={[]}
          selectedElements={[]}
          textPanelContent=""
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(screen.getByText('No prompt generated yet')).toBeInTheDocument();
    });

    it('should render Copy Prompt button', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(screen.getByRole('button', { name: /copy prompt/i })).toBeInTheDocument();
    });

    it('should render macro insertion button', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(screen.getByText('{SceneDescription}')).toBeInTheDocument();
    });

    it('should disable Copy button when prompt is error', () => {
      mockBuildScenePrompt.mockReturnValue('Error generating prompt');
      
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy prompt/i });
      expect(copyButton).toBeDisabled();
    });
  });

  describe('Prompt Generation', () => {
    it('should call buildScenePrompt with correct parameters', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice', 'Bob']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(mockBuildScenePrompt).toHaveBeenCalledWith(
        mockScene,
        mockStory,
        mockActiveBook,
        expect.arrayContaining([
          expect.objectContaining({ name: 'Alice' }),
          expect.objectContaining({ name: 'Bob' })
        ]),
        expect.arrayContaining([
          expect.objectContaining({ name: 'Tree' })
        ])
      );
    });

    it('should filter selected characters correctly', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={[]}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      const callArgs = mockBuildScenePrompt.mock.calls[0];
      const characters = callArgs[3];
      expect(characters).toHaveLength(1);
      expect(characters[0].name).toBe('Alice');
    });

    it('should filter selected elements correctly', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={[]}
          selectedElements={['House']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      const callArgs = mockBuildScenePrompt.mock.calls[0];
      const elements = callArgs[4];
      expect(elements).toHaveLength(1);
      expect(elements[0].name).toBe('House');
    });

    it('should regenerate prompt when scene changes', () => {
      const { rerender } = render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(mockBuildScenePrompt).toHaveBeenCalledTimes(1);

      const updatedScene = { ...mockScene, description: 'Updated description' };
      rerender(
        <ScenePromptPreview
          scene={updatedScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(mockBuildScenePrompt).toHaveBeenCalledTimes(2);
    });

    it('should regenerate prompt when selected characters change', () => {
      const { rerender } = render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(mockBuildScenePrompt).toHaveBeenCalledTimes(1);

      rerender(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice', 'Bob']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(mockBuildScenePrompt).toHaveBeenCalledTimes(2);
    });

    it('should handle prompt generation errors gracefully', () => {
      mockBuildScenePrompt.mockImplementation(() => {
        throw new Error('Prompt generation failed');
      });

      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(screen.getByText('Error generating prompt')).toBeInTheDocument();
    });
  });

  describe('Clipboard Functionality', () => {
    it('should show success message after copying', async () => {
      const user = userEvent.setup();
      
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy prompt/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('Prompt copied to clipboard!')).toBeInTheDocument();
      });
    });
  });

  describe('Macro Insertion', () => {
    it('should call onInsertMacro when macro button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      const macroButton = screen.getByText('{SceneDescription}');
      await user.click(macroButton);

      expect(mockOnInsertMacro).toHaveBeenCalledWith('{SceneDescription}');
    });

    it('should show success message after inserting macro', async () => {
      const user = userEvent.setup();
      
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      const macroButton = screen.getByText('{SceneDescription}');
      await user.click(macroButton);

      await waitFor(() => {
        expect(screen.getByText('Macro {SceneDescription} inserted')).toBeInTheDocument();
      });
    });
  });

  describe('Snackbar Behavior', () => {
    it('should close snackbar automatically after timeout', async () => {
      const user = userEvent.setup();
      
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      const copyButton = screen.getByRole('button', { name: /copy prompt/i });
      await user.click(copyButton);

      // Verify snackbar appears
      await waitFor(() => {
        expect(screen.getByText('Prompt copied to clipboard!')).toBeInTheDocument();
      });

      // Verify snackbar disappears after timeout (MUI default is 3000ms)
      await waitFor(() => {
        expect(screen.queryByText('Prompt copied to clipboard!')).not.toBeInTheDocument();
      }, { timeout: 4000 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selected characters array', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={[]}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      const callArgs = mockBuildScenePrompt.mock.calls[0];
      const characters = callArgs[3];
      expect(characters).toHaveLength(0);
    });

    it('should handle empty selected elements array', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={[]}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      const callArgs = mockBuildScenePrompt.mock.calls[0];
      const elements = callArgs[4];
      expect(elements).toHaveLength(0);
    });

    it('should handle null activeBook', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={null}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent="Test text"
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(mockBuildScenePrompt).toHaveBeenCalledWith(
        mockScene,
        mockStory,
        null,
        expect.any(Array),
        expect.any(Array)
      );
    });

    it('should handle empty text panel content', () => {
      render(
        <ScenePromptPreview
          scene={mockScene}
          story={mockStory}
          activeBook={mockActiveBook}
          availableCharacters={mockAvailableCharacters}
          availableElements={mockAvailableElements}
          selectedCharacters={['Alice']}
          selectedElements={['Tree']}
          textPanelContent=""
          onInsertMacro={mockOnInsertMacro}
        />
      );

      expect(mockBuildScenePrompt).toHaveBeenCalled();
    });
  });
});
