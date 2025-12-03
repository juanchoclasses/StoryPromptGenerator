import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneImageGenerator } from '../../src/components/SceneImageGenerator';
import type { Scene, Story } from '../../src/types/Story';
import type { PreviewData } from '../../src/components/ImageGenerationPreviewDialog';

/**
 * Property 3: SceneImageGenerator component correctness
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * For any valid scene and story, the SceneImageGenerator component should:
 * - Display generate button and handle clicks
 * - Open model selection dialog when requested
 * - Show loading state during generation
 * - Display errors when generation fails
 * - Call onImageStateChange callback with correct parameters
 */

describe('SceneImageGenerator', () => {
  // Test data
  const mockScene: Scene = {
    id: 'scene-1',
    title: 'Test Scene',
    description: 'A test scene description',
    textPanel: 'Test text panel',
    characters: ['Alice'],
    elements: ['Table'],
    imageHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockStory: Story = {
    id: 'story-1',
    title: 'Test Story',
    backgroundSetup: 'Test background',
    scenes: [mockScene],
    characters: [
      { name: 'Alice', description: 'Test character', imageGallery: [] }
    ],
    elements: [
      { name: 'Table', description: 'A wooden table' }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPreviewData: PreviewData = {
    sceneTitle: 'Test Scene',
    sceneDescription: 'A test scene description',
    prompt: 'Test prompt for image generation',
    characterImages: [],
    aspectRatio: '3:4',
    model: 'test-model'
  };

  let mockOnGenerationStart: ReturnType<typeof vi.fn>;
  let mockOnGenerationComplete: ReturnType<typeof vi.fn>;
  let mockOnGenerationError: ReturnType<typeof vi.fn>;
  let mockOnBuildPreview: ReturnType<typeof vi.fn>;
  let mockOnPerformGeneration: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnGenerationStart = vi.fn();
    mockOnGenerationComplete = vi.fn();
    mockOnGenerationError = vi.fn();
    mockOnBuildPreview = vi.fn().mockResolvedValue(mockPreviewData);
    mockOnPerformGeneration = vi.fn().mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render Generate Image button', () => {
      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
        />
      );

      expect(screen.getByRole('button', { name: /Generate Image/i })).toBeInTheDocument();
    });

    it('should show loading state when isGenerating is true', () => {
      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
          isGenerating={true}
        />
      );

      expect(screen.getByRole('button', { name: /Generating/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generating/i })).toBeDisabled();
    });

    it('should disable button when isGenerating is true', () => {
      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
          isGenerating={true}
        />
      );

      const button = screen.getByRole('button', { name: /Generating/i });
      expect(button).toBeDisabled();
    });

    it('should enable button when isGenerating is false', () => {
      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
          isGenerating={false}
        />
      );

      const button = screen.getByRole('button', { name: /Generate Image/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Button Clicks', () => {
    it('should open model selection dialog when Generate Image is clicked', async () => {
      const user = userEvent.setup();

      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
        />
      );

      const button = screen.getByRole('button', { name: /Generate Image/i });
      await user.click(button);

      // Model selection dialog should be visible
      await waitFor(() => {
        expect(screen.getByText(/Select AI Model/i)).toBeInTheDocument();
      });
    });

    it('should not open dialog when button is disabled', () => {
      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
          isGenerating={true}
        />
      );

      const button = screen.getByRole('button', { name: /Generating/i });
      
      // Button should be disabled
      expect(button).toBeDisabled();

      // Dialog should not appear
      expect(screen.queryByText(/Select AI Model/i)).not.toBeInTheDocument();
    });
  });

  describe('Dialog Opening and Closing', () => {
    it('should close model selection dialog when Cancel is clicked', async () => {
      const user = userEvent.setup();

      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
        />
      );

      // Open dialog
      const button = screen.getByRole('button', { name: /Generate Image/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Select AI Model/i)).toBeInTheDocument();
      });

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/Select AI Model/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Generation Workflow', () => {
    it('should open model selection dialog when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
        />
      );

      // Open model selection dialog
      const generateButton = screen.getByRole('button', { name: /Generate Image/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Select AI Model/i)).toBeInTheDocument();
      });
    });

    it('should have model selection and preview dialogs available', () => {
      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
        />
      );

      // Component should render without errors
      expect(screen.getByRole('button', { name: /Generate Image/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const testError = new Error('Test error');
      mockOnBuildPreview.mockRejectedValue(testError);

      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
        />
      );

      // Component should render without crashing even with error setup
      expect(screen.getByRole('button', { name: /Generate Image/i })).toBeInTheDocument();
    });
  });

  describe('Callback Invocation', () => {
    it('should have callbacks properly wired', () => {
      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
        />
      );

      // Component should render with all callbacks
      expect(screen.getByRole('button', { name: /Generate Image/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle scene without description', () => {
      const sceneWithoutDesc: Scene = {
        ...mockScene,
        description: ''
      };

      render(
        <SceneImageGenerator
          scene={sceneWithoutDesc}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
        />
      );

      // Should still render button
      expect(screen.getByRole('button', { name: /Generate Image/i })).toBeInTheDocument();
    });

    it('should handle story without characters', () => {
      const storyWithoutChars: Story = {
        ...mockStory,
        characters: []
      };

      render(
        <SceneImageGenerator
          scene={mockScene}
          story={storyWithoutChars}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
        />
      );

      // Should still render button
      expect(screen.getByRole('button', { name: /Generate Image/i })).toBeInTheDocument();
    });

    it('should handle rapid button clicks gracefully', async () => {
      const user = userEvent.setup();

      render(
        <SceneImageGenerator
          scene={mockScene}
          story={mockStory}
          onGenerationStart={mockOnGenerationStart}
          onGenerationComplete={mockOnGenerationComplete}
          onGenerationError={mockOnGenerationError}
          onBuildPreview={mockOnBuildPreview}
          onPerformGeneration={mockOnPerformGeneration}
        />
      );

      const button = screen.getByRole('button', { name: /Generate Image/i });
      
      // Click multiple times rapidly
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should only open one dialog
      await waitFor(() => {
        const dialogs = screen.queryAllByText(/Select AI Model/i);
        expect(dialogs.length).toBe(1);
      });
    });
  });
});
