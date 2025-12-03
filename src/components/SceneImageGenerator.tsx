import React, { useState } from 'react';
import { Button, CircularProgress, Box } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';
import { ModelSelectionDialog } from './ModelSelectionDialog';
import { ImageGenerationPreviewDialog, type PreviewData } from './ImageGenerationPreviewDialog';
import type { Scene, Story } from '../types/Story';

export interface SceneImageGeneratorProps {
  /** Current scene being edited */
  scene: Scene;
  /** Parent story for context */
  story: Story;
  /** Callback when image generation starts */
  onGenerationStart: () => void;
  /** Callback when image generation completes successfully */
  onGenerationComplete: (imageUrl: string) => void;
  /** Callback when image generation fails */
  onGenerationError: (error: Error) => void;
  /** Callback to build preview data */
  onBuildPreview: (modelName: string, promptStrategy?: 'auto' | 'legacy' | 'gemini') => Promise<PreviewData>;
  /** Callback to perform actual image generation */
  onPerformGeneration: (modelName: string, promptStrategy?: 'auto' | 'legacy' | 'gemini') => Promise<void>;
  /** Whether generation is currently in progress */
  isGenerating?: boolean;
}

/**
 * SceneImageGenerator Component
 * 
 * Handles all image generation UI and workflow for a scene.
 * Manages model selection, preview display, and generation coordination.
 * 
 * Features:
 * - Generate Image button with loading state
 * - Model selection dialog integration
 * - Image generation preview dialog
 * - Error handling and display
 * - Progress tracking
 */
export const SceneImageGenerator: React.FC<SceneImageGeneratorProps> = ({
  scene,
  story,
  onGenerationStart,
  onGenerationComplete,
  onGenerationError,
  onBuildPreview,
  onPerformGeneration,
  isGenerating = false
}) => {
  const [modelSelectionOpen, setModelSelectionOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [pendingModelForGeneration, setPendingModelForGeneration] = useState<string | null>(null);
  const [pendingPromptStrategy, setPendingPromptStrategy] = useState<'auto' | 'legacy' | 'gemini' | undefined>(undefined);

  /**
   * Handle Generate Image button click
   * Opens the model selection dialog
   */
  const handleGenerateClick = () => {
    setModelSelectionOpen(true);
  };

  /**
   * Handle preview request from model selection dialog
   * Builds preview data and opens preview dialog
   */
  const handleShowPreview = async (modelName: string, promptStrategy?: 'auto' | 'legacy' | 'gemini') => {
    try {
      setPendingModelForGeneration(modelName);
      setPendingPromptStrategy(promptStrategy);
      const preview = await onBuildPreview(modelName, promptStrategy);
      setPreviewData(preview);
      setPreviewDialogOpen(true);
      setModelSelectionOpen(false);
    } catch (error) {
      console.error('Failed to build preview:', error);
      onGenerationError(error instanceof Error ? error : new Error('Failed to build preview'));
    }
  };

  /**
   * Handle direct generation from model selection dialog
   * Bypasses preview and starts generation immediately
   */
  const handleDirectGeneration = async (modelName: string, promptStrategy?: 'auto' | 'legacy' | 'gemini') => {
    try {
      onGenerationStart();
      await onPerformGeneration(modelName, promptStrategy);
      setModelSelectionOpen(false);
    } catch (error) {
      console.error('Image generation failed:', error);
      onGenerationError(error instanceof Error ? error : new Error('Image generation failed'));
    }
  };

  /**
   * Handle generation from preview dialog
   * Uses the pending model and strategy from preview
   */
  const handleGenerateFromPreview = async () => {
    if (!pendingModelForGeneration) return;

    try {
      onGenerationStart();
      await onPerformGeneration(pendingModelForGeneration, pendingPromptStrategy);
      setPreviewDialogOpen(false);
      setPreviewData(null);
      setPendingModelForGeneration(null);
      setPendingPromptStrategy(undefined);
    } catch (error) {
      console.error('Image generation failed:', error);
      onGenerationError(error instanceof Error ? error : new Error('Image generation failed'));
    }
  };

  /**
   * Handle preview dialog close
   * Clears preview state
   */
  const handlePreviewClose = () => {
    setPreviewDialogOpen(false);
    setPreviewData(null);
    setPendingModelForGeneration(null);
    setPendingPromptStrategy(undefined);
  };

  return (
    <Box>
      {/* Generate Image Button */}
      <Button
        variant="contained"
        startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <ImageIcon />}
        onClick={handleGenerateClick}
        disabled={isGenerating}
        data-testid="generate-image-button"
      >
        {isGenerating ? 'Generating...' : 'Generate Image'}
      </Button>

      {/* Model Selection Dialog */}
      <ModelSelectionDialog
        open={modelSelectionOpen}
        onClose={() => setModelSelectionOpen(false)}
        onConfirm={handleDirectGeneration}
        onPreview={handleShowPreview}
      />

      {/* Image Generation Preview Dialog */}
      <ImageGenerationPreviewDialog
        open={previewDialogOpen}
        onClose={handlePreviewClose}
        onGenerate={handleGenerateFromPreview}
        previewData={previewData}
      />
    </Box>
  );
};
