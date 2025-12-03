import { useState, useMemo } from 'react';
import type { Scene, Story, SceneLayout } from '../types/Story';
import { BookService } from '../services/BookService';
import { LayoutResolver } from '../services/LayoutResolver';

/**
 * Layout source information
 */
export interface LayoutSourceInfo {
  source: 'scene' | 'story' | 'book' | 'default';
  description: string;
  resolvedLayout: SceneLayout | undefined;
  inheritedLayout: SceneLayout | undefined;
  inheritedLayoutSource: string | undefined;
}

/**
 * Return type for useLayoutManagement hook
 */
export interface UseLayoutManagementReturn {
  // Layout source information
  layoutSourceInfo: LayoutSourceInfo;
  
  // Dialog states
  layoutEditorOpen: boolean;
  layoutTestPreviewOpen: boolean;
  layoutTestPreviewUrl: string | null;
  isTestingLayout: boolean;
  
  // Actions
  handleEditLayout: () => void;
  handleSaveLayout: (layout: SceneLayout) => Promise<void>;
  handleClearSceneLayout: () => Promise<void>;
  handleTestLayout: () => Promise<void>;
  
  // State setters
  setLayoutEditorOpen: (open: boolean) => void;
  setLayoutTestPreviewOpen: (open: boolean) => void;
  setLayoutTestPreviewUrl: (url: string | null) => void;
}

/**
 * Custom hook for managing layout operations
 * 
 * Handles:
 * - Layout source calculation (scene/story/book/default)
 * - Layout resolution using LayoutResolver
 * - Layout editor dialog state
 * - Layout save operations
 * - Layout clear operations
 * - Layout test preview generation
 */
export function useLayoutManagement(
  currentScene: Scene | null,
  story: Story | null,
  activeBook: any | null, // Book instance from BookService
  onStoryUpdate: () => void,
  showSnackbar: (message: string, severity: 'success' | 'error' | 'warning') => void
): UseLayoutManagementReturn {
  // Dialog states
  const [layoutEditorOpen, setLayoutEditorOpen] = useState(false);
  const [layoutTestPreviewOpen, setLayoutTestPreviewOpen] = useState(false);
  const [layoutTestPreviewUrl, setLayoutTestPreviewUrl] = useState<string | null>(null);
  const [isTestingLayout, setIsTestingLayout] = useState(false);

  // Compute layout source information
  const layoutSourceInfo = useMemo((): LayoutSourceInfo => {
    if (!currentScene || !story || !activeBook) {
      return {
        source: 'default',
        description: 'System default (overlay)',
        resolvedLayout: undefined,
        inheritedLayout: undefined,
        inheritedLayoutSource: undefined
      };
    }

    const source = LayoutResolver.getLayoutSource(currentScene, story, activeBook);
    const description = LayoutResolver.getLayoutSourceDescription(currentScene, story, activeBook);
    const resolvedLayout = LayoutResolver.resolveLayout(currentScene, story, activeBook);

    // Calculate inherited layout (what would be used if scene layout is cleared)
    let inheritedLayout: SceneLayout | undefined;
    let inheritedLayoutSource: string | undefined;

    if (source === 'scene') {
      // Scene has its own layout, so inherited would be story or book
      if (story.layout) {
        inheritedLayout = story.layout;
        inheritedLayoutSource = 'Story';
      } else if (activeBook.defaultLayout) {
        inheritedLayout = activeBook.defaultLayout as SceneLayout;
        inheritedLayoutSource = 'Book';
      }
    }

    return {
      source,
      description,
      resolvedLayout,
      inheritedLayout,
      inheritedLayoutSource
    };
  }, [currentScene, story, activeBook]);

  // Open layout editor
  const handleEditLayout = () => {
    setLayoutEditorOpen(true);
  };

  // Save layout to scene
  const handleSaveLayout = async (layout: SceneLayout) => {
    if (!currentScene || !activeBook || !story) return;

    try {
      console.log('💾 Saving layout configuration:', layout);

      // Find the scene in the book's story array and update it
      const storyInBook = activeBook.stories.find((s: any) => s.id === story.id);
      if (!storyInBook) {
        console.error('❌ Story not found in book');
        return;
      }

      const sceneInStory = storyInBook.scenes.find((s: any) => s.id === currentScene.id);
      if (!sceneInStory) {
        console.error('❌ Scene not found in story');
        return;
      }

      // Update the scene
      sceneInStory.layout = layout;
      sceneInStory.updatedAt = new Date();

      // Save book
      await BookService.saveBook(activeBook);
      console.log('✓ Layout saved successfully');

      onStoryUpdate();
      setLayoutEditorOpen(false);

      showSnackbar('Layout saved successfully', 'success');
    } catch (error) {
      console.error('Error saving layout:', error);
      showSnackbar(
        `Failed to save layout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  };

  // Clear scene-specific layout
  const handleClearSceneLayout = async () => {
    if (!currentScene || !activeBook || !story) return;

    try {
      console.log('🗑️ Clearing scene-specific layout');

      const storyInBook = activeBook.stories.find((s: any) => s.id === story.id);
      if (!storyInBook) return;

      const sceneInStory = storyInBook.scenes.find((s: any) => s.id === currentScene.id);
      if (!sceneInStory) return;

      // Remove scene-specific layout
      sceneInStory.layout = undefined;
      sceneInStory.updatedAt = new Date();

      await BookService.saveBook(activeBook);
      console.log('✓ Scene layout cleared - will now use inherited layout');

      onStoryUpdate();
      setLayoutEditorOpen(false);

      showSnackbar('Scene layout cleared - using inherited layout', 'success');
    } catch (error) {
      console.error('Error clearing layout:', error);
      showSnackbar(
        `Failed to clear layout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    }
  };

  // Test layout with placeholder image
  const handleTestLayout = async () => {
    if (!currentScene || !activeBook || !story) {
      showSnackbar('Please select a scene first', 'error');
      return;
    }

    setIsTestingLayout(true);
    showSnackbar('Generating layout test preview...', 'success');

    try {
      console.log('🧪 Testing layout with placeholder image');

      // Use LayoutResolver to get the effective layout
      let resolvedLayout = LayoutResolver.resolveLayout(currentScene, story, activeBook);
      const layoutSource = LayoutResolver.getLayoutSourceDescription(currentScene, story, activeBook);

      console.log(`📐 Layout source: ${layoutSource}`);

      // If no layout resolved, create a default one
      const defaultAspectRatio = activeBook.aspectRatio || '3:4';
      const layout = resolvedLayout || {
        type: 'overlay' as const,
        canvas: {
          width: 1080,
          height: 1440,
          aspectRatio: defaultAspectRatio
        },
        elements: {
          image: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          textPanel: { x: 5, y: 78, width: 90, height: 17, zIndex: 2 },
          diagramPanel: { x: 5, y: 5, width: 60, height: 40, zIndex: 3 }
        }
      };

      // Create placeholder image with correct aspect ratio
      const imageElement = layout.elements.image;
      const imageAspectRatioStr = (imageElement && 'aspectRatio' in imageElement && imageElement.aspectRatio)
        ? imageElement.aspectRatio
        : defaultAspectRatio;
      const [ratioWidth, ratioHeight] = imageAspectRatioStr.split(':').map(Number);
      const imageAspectRatio = ratioWidth / ratioHeight;

      // Calculate actual image dimensions based on aspect ratio
      let imageWidth: number;
      let imageHeight: number;

      if (imageAspectRatio > 1) {
        // Landscape - use a standard width
        imageWidth = 1920;
        imageHeight = Math.round(imageWidth / imageAspectRatio);
      } else {
        // Portrait - use a standard height
        imageHeight = 1920;
        imageWidth = Math.round(imageHeight * imageAspectRatio);
      }

      const placeholderCanvas = document.createElement('canvas');
      placeholderCanvas.width = imageWidth;
      placeholderCanvas.height = imageHeight;
      const ctx = placeholderCanvas.getContext('2d');

      if (ctx) {
        // Fill with a gradient
        const gradient = ctx.createLinearGradient(0, 0, imageWidth, imageHeight);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, imageWidth, imageHeight);

        // Add "PLACEHOLDER" text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const fontSize = Math.min(imageWidth, imageHeight) / 20;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AI IMAGE PLACEHOLDER', imageWidth / 2, imageHeight / 2);

        // Add aspect ratio text
        ctx.font = `${fontSize * 0.6}px Arial`;
        ctx.fillText(imageAspectRatioStr, imageWidth / 2, imageHeight / 2 + fontSize * 1.5);
      }

      const placeholderImageUrl = placeholderCanvas.toDataURL('image/png');

      // Import services dynamically
      const { createTextPanel } = await import('../services/OverlayService');
      const { renderDiagramToCanvas } = await import('../services/DiagramRenderService');
      const { composeSceneWithLayout } = await import('../services/LayoutCompositionService');
      const { SceneImageGenerationService } = await import('../services/SceneImageGenerationService');
      const { DEFAULT_PANEL_CONFIG } = await import('../types/Book');

      let textPanelDataUrl: string | null = null;
      let diagramPanelDataUrl: string | null = null;
      let textPanelHeight = 0;

      // Render text panel if present
      if (currentScene.textPanel && layout.elements.textPanel) {
        console.log('  Rendering text panel...');
        const panelConfig = activeBook.style?.panelConfig || DEFAULT_PANEL_CONFIG;

        const textPanelWidth = Math.round((layout.elements.textPanel.width / 100) * layout.canvas.width);

        // Calculate the actual height needed for the text content
        const canvas = document.createElement('canvas');
        const canvasCtx = canvas.getContext('2d')!;
        const fontSize = panelConfig.fontSize || 24;
        const lineHeight = Math.round(fontSize * 1.3);
        const padding = panelConfig.padding || 20;
        canvasCtx.font = `${fontSize}px ${panelConfig.fontFamily || 'Arial'}`;

        const innerWidth = textPanelWidth - (padding * 2);
        const lines: string[] = [];
        const paragraphs = currentScene.textPanel.split(/\r?\n/);

        for (const paragraph of paragraphs) {
          if (!paragraph.trim()) {
            lines.push("");
            continue;
          }

          const words = paragraph.split(/\s+/);
          let line = "";

          for (const word of words) {
            const test = line ? line + " " + word : word;
            const w = canvasCtx.measureText(test).width;
            if (w <= innerWidth) {
              line = test;
            } else {
              if (line) lines.push(line);
              line = word;
            }
          }
          if (line) lines.push(line);
        }

        const textHeight = lines.length * lineHeight;
        textPanelHeight = textHeight + (padding * 2);

        const textPanelBitmap = await createTextPanel(currentScene.textPanel, {
          width: textPanelWidth,
          height: textPanelHeight,
          bgColor: panelConfig.backgroundColor,
          borderColor: panelConfig.borderColor,
          borderWidth: panelConfig.borderWidth,
          borderRadius: panelConfig.borderRadius,
          padding: panelConfig.padding,
          fontFamily: panelConfig.fontFamily,
          fontSize: panelConfig.fontSize,
          fontColor: panelConfig.fontColor,
          textAlign: panelConfig.textAlign as CanvasTextAlign
        });

        const textCanvas = document.createElement('canvas');
        textCanvas.width = textPanelBitmap.width;
        textCanvas.height = textPanelBitmap.height;
        const textCtx = textCanvas.getContext('2d');
        if (textCtx) {
          textCtx.drawImage(textPanelBitmap, 0, 0);
          textPanelDataUrl = textCanvas.toDataURL('image/png');
        }
      }

      // Render diagram panel if present
      if (currentScene.diagramPanel && layout.elements.diagramPanel) {
        console.log('  Rendering diagram panel...');
        const diagramStyle = story.diagramStyle;

        if (diagramStyle) {
          const diagramPanelWidth = Math.round((layout.elements.diagramPanel.width / 100) * layout.canvas.width);
          const diagramPanelHeight = Math.round((layout.elements.diagramPanel.height / 100) * layout.canvas.height);

          const diagramCanvas = await renderDiagramToCanvas(
            currentScene.diagramPanel,
            diagramStyle,
            diagramPanelWidth,
            diagramPanelHeight
          );

          diagramPanelDataUrl = diagramCanvas.toDataURL('image/png');
        }
      }

      // Compose the final image
      console.log('  Composing layout test image...');
      const adjustedLayout = SceneImageGenerationService.adjustBottomAnchoredTextPanel(layout, textPanelHeight);

      const composedImageUrl = await composeSceneWithLayout(
        placeholderImageUrl,
        textPanelDataUrl,
        diagramPanelDataUrl,
        adjustedLayout
      );
      console.log('  ✓ Layout test preview created');

      // Set preview URL and open dialog
      setLayoutTestPreviewUrl(composedImageUrl);
      setLayoutTestPreviewOpen(true);

      showSnackbar('Layout test preview ready!', 'success');
    } catch (error) {
      console.error('Error testing layout:', error);
      showSnackbar(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setIsTestingLayout(false);
    }
  };

  return {
    layoutSourceInfo,
    layoutEditorOpen,
    layoutTestPreviewOpen,
    layoutTestPreviewUrl,
    isTestingLayout,
    handleEditLayout,
    handleSaveLayout,
    handleClearSceneLayout,
    handleTestLayout,
    setLayoutEditorOpen,
    setLayoutTestPreviewOpen,
    setLayoutTestPreviewUrl
  };
}
