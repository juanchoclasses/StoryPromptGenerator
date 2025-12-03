import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  ErrorOutline as ErrorIcon,
  DeleteSweep as ClearImagesIcon,
  GridOn as LayoutIcon
} from '@mui/icons-material';
import type { Scene, Story } from '../types/Story';
import type { SceneLayout } from '../types/Story'; // Layout configuration
import { BookService } from '../services/BookService';
import { FileSystemService } from '../services/FileSystemService';
import { SettingsService } from '../services/SettingsService';
import { ImageStorageService } from '../services/ImageStorageService';
import { DEFAULT_PANEL_CONFIG } from '../types/Book';
import type { PanelConfig } from '../types/Book';
import { measureTextFit } from '../services/TextMeasurementService';
import { PanelConfigDialog } from './PanelConfigDialog';
import { SceneLayoutEditor } from './SceneLayoutEditor';
import type { PreviewData } from './ImageGenerationPreviewDialog';
import { SceneCharacterSelector } from './SceneCharacterSelector';
import { SceneElementSelector } from './SceneElementSelector';
import { SceneImageGenerator } from './SceneImageGenerator';
import { ScenePromptPreview } from './ScenePromptPreview';
import { SceneDiagramPanel } from './SceneDiagramPanel';
import { SceneTextPanel } from './SceneTextPanel';
import { useSceneEditor } from '../hooks/useSceneEditor';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { useLayoutManagement } from '../hooks/useLayoutManagement';

/**
 * Calculate the minimum height needed for a text panel based on content
 */
function calculateTextPanelHeight(
  text: string,
  width: number,
  panelConfig: PanelConfig
): number {
  const fontSize = panelConfig.fontSize || 24;
  const lineHeight = Math.round(fontSize * 1.3);
  const padding = panelConfig.padding || 20;
  
  // Create a temporary canvas to measure text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontSize}px ${panelConfig.fontFamily || 'Arial'}`;
  
  // Calculate available width for text
  const innerWidth = width - (padding * 2);
  
  // Word-wrap text to count lines
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);
  
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    
    const words = paragraph.split(/\s+/);
    let line = "";
    
    for (const word of words) {
      const test = line ? line + " " + word : word;
      const w = ctx.measureText(test).width;
      if (w <= innerWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  
  // Calculate total height needed
  const textHeight = lines.length * lineHeight;
  const totalHeight = textHeight + (padding * 2);
  
  return Math.ceil(totalHeight);
}

interface SceneEditorProps {
  story: Story | null;
  selectedScene: Scene | null;
  onStoryUpdate: () => void;
  onImageStateChange?: (imageUrl: string | null, onSave: () => void, onClear: () => void) => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({ story, selectedScene, onStoryUpdate, onImageStateChange }) => {
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  
  // Use the useSceneEditor hook for scene state management
  const {
    sceneTitle,
    sceneDescription,
    textPanelContent: textPanel,
    selectedCharacters,
    selectedElements,
    handleTitleChange,
    handleDescriptionChange,
    handleTextPanelChange,
    handleCharacterSelectionChange,
    handleElementSelectionChange,
    handleInsertMacro
  } = useSceneEditor(story, currentScene, onStoryUpdate);
  
  const [diagramType, setDiagramType] = useState<'mermaid' | 'math' | 'code' | 'markdown'>('mermaid');
  const [diagramContent, setDiagramContent] = useState('');
  const [diagramLanguage, setDiagramLanguage] = useState('javascript');
  const [diagramPreviewOpen, setDiagramPreviewOpen] = useState(false);
  const [diagramPreviewUrl, setDiagramPreviewUrl] = useState<string | null>(null);
  const [textPanelPreviewOpen, setTextPanelPreviewOpen] = useState(false);
  const [textPanelPreviewUrl, setTextPanelPreviewUrl] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<any>(null); // Book instance for book-level characters

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning'>('success');

  // Snackbar helper function
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Create mock scene and story for hook initialization when null
  const mockScene: Scene = useMemo(() => ({
    id: 'temp',
    title: '',
    description: '',
    characters: [],
    elements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }), []);

  const mockStory: Story = useMemo(() => ({
    id: 'temp',
    title: '',
    backgroundSetup: '',
    scenes: [],
    characters: [],
    elements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }), []);

  // Use the useImageGeneration hook for image generation state management
  const {
    isGenerating: isGeneratingImage,
    buildPreview,
    startGeneration
  } = useImageGeneration(
    currentScene || mockScene,
    story || mockStory,
    onImageStateChange || (() => {}),
    onStoryUpdate
  );

  // Use the useLayoutManagement hook for layout operations
  const {
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
  } = useLayoutManagement(currentScene, story, activeBook, onStoryUpdate, showSnackbar);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState('');
  const [textFitDialogOpen, setTextFitDialogOpen] = useState(false);
  const [textFitInfo, setTextFitInfo] = useState<{
    requiredHeightPercentage: number;
    lineCount: number;
    currentHeightPercentage: number;
  } | null>(null);
  const [panelConfigDialogOpen, setPanelConfigDialogOpen] = useState(false);
  const [editingPanelConfig, setEditingPanelConfig] = useState<PanelConfig>(DEFAULT_PANEL_CONFIG);
  
  const textPanelFieldRef = React.useRef<HTMLTextAreaElement>(null);
  const lastNotifiedImageUrl = useRef<string | null>(null);
  const lastSelectedModel = useRef<string | null>(null);

  /**
   * Load image from filesystem
   * Images are stored on local disk for persistence
   */
  const loadImageWithFallback = async (scene: Scene): Promise<string | null> => {
    // Try most recent image from history first
    const mostRecentImage = scene.imageHistory && scene.imageHistory.length > 0
      ? scene.imageHistory[scene.imageHistory.length - 1]
      : null;
    
    if (!mostRecentImage) {
      // Try legacy lastGeneratedImage (for old data)
      return scene.lastGeneratedImage || null;
    }
    
    const { id, url } = mostRecentImage;
    
    // Load from filesystem
    try {
      const imageUrl = await ImageStorageService.getImage(id);
      if (imageUrl) {
        console.log(`✓ Image loaded from filesystem: ${id}`);
        return imageUrl;
      }
    } catch (error) {
      console.error('Failed to load image from filesystem:', error);
    }
    
    // Fallback: If URL exists and looks valid (legacy data or data URL)
    if (url) {
      if (url.startsWith('data:')) {
        // Data URL is always valid
        return url;
      } else if (url.startsWith('http')) {
        // HTTP URL - return as is
        return url;
      } else if (url.startsWith('blob:')) {
        // Blob URL might still be valid in current session
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            return url;
          }
        } catch {
          // Blob URL invalid
        }
      }
    }
    
    // No valid image found
    console.warn(`No valid image found for scene with image ID: ${id}`);
    return null;
  };

  useEffect(() => {
    const loadScene = async () => {
      if (selectedScene) {
        // Reload scene from local storage to get the latest data including saved image
        const activeBookData = await BookService.getActiveBookData();
        if (activeBookData && story) {
          const currentStory = activeBookData.stories.find(s => s.id === story.id);
          if (currentStory) {
            const freshScene = currentStory.scenes.find(scene => scene.id === selectedScene.id);
            if (freshScene) {
              setCurrentScene(freshScene);
              // Note: The hook will manage scene state (title, description, etc.)
              // We only need to set currentScene and diagram-related state here
              setDiagramType(freshScene.diagramPanel?.type as any || 'mermaid');
              setDiagramContent(freshScene.diagramPanel?.content || '');
              setDiagramLanguage(freshScene.diagramPanel?.language || 'javascript');
              // Load image from filesystem (or null if no images)
              const imageUrl = await loadImageWithFallback(freshScene);
              setGeneratedImageUrl(imageUrl);
              return;
            }
          }
        }
        
        // Fallback to selectedScene prop if we can't reload from storage
        setCurrentScene(selectedScene);
        // Note: The hook will manage scene state (title, description, etc.)
        setDiagramType(selectedScene.diagramPanel?.type as any || 'mermaid');
        setDiagramContent(selectedScene.diagramPanel?.content || '');
        setDiagramLanguage(selectedScene.diagramPanel?.language || 'javascript');
        // Load image from filesystem (or null if no images)
        const imageUrl = await loadImageWithFallback(selectedScene);
        setGeneratedImageUrl(imageUrl);
      } else {
        setCurrentScene(null);
        setGeneratedImageUrl(null);
      }
    };
    loadScene();
  }, [selectedScene, story, onStoryUpdate]);

  // Load active book to access book-level characters
  useEffect(() => {
    const loadBook = async () => {
      const activeBookId = await BookService.getActiveBookId();
      if (activeBookId) {
        const book = await BookService.getBook(activeBookId);
        setActiveBook(book);
      }
    };
    loadBook();
  }, [story]); // Reload when story changes

  // Handler wrappers for event objects (hook expects plain values)
  const handleSceneTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleTitleChange(event.target.value);
  };

  const handleSceneDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleDescriptionChange(event.target.value);
  };



  const handleDiagramPanelChange = async (content: string, type: string, language?: string) => {
    setDiagramContent(content);
    setDiagramType(type as any);
    if (language) setDiagramLanguage(language);
    
    // Auto-save the diagram panel (but don't trigger full refresh)
    if (story && currentScene) {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const diagramPanel = content.trim() ? {
        type: type as any,
        content: content,
        language: type === 'code' ? language : undefined
      } : undefined;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(scene => {
            if (scene.id === currentScene.id) {
              return { ...scene, diagramPanel, updatedAt: new Date() };
            }
            return scene;
          });
          return { ...s, scenes: updatedScenes, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      // Don't call onStoryUpdate() here - it causes the scene to reload and clears the input
    }
  };

  const handlePreviewDiagram = async () => {
    if (!story?.diagramStyle) {
      setSnackbarMessage('Please configure diagram style for this story first (in Stories panel)');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    // Use the current state values (what's in the TextField) for preview
    // This ensures we preview what the user is currently seeing/editing
    if (!diagramContent.trim()) {
      setSnackbarMessage('Please enter diagram content first');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Import DiagramRenderService
      const { overlayDiagramOnImage } = await import('../services/OverlayService');
      
      // Create a blank white canvas as base image
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      const blankImage = canvas.toDataURL('image/png');
      
      // Overlay the diagram using current TextField state
      const diagramPanel = {
        type: diagramType,
        content: diagramContent,
        language: diagramType === 'code' ? diagramLanguage : undefined
      };
      
      console.log('Preview using current state:', diagramPanel);
      
      const resultUrl = await overlayDiagramOnImage(
        blankImage,
        diagramPanel,
        story.diagramStyle
      );
      
      setDiagramPreviewUrl(resultUrl);
      setDiagramPreviewOpen(true);
    } catch (error) {
      console.error('Error previewing diagram:', error);
      setSnackbarMessage('Failed to preview diagram: ' + (error as Error).message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handlePreviewTextPanel = async () => {
    if (!textPanel.trim()) {
      setSnackbarMessage('Please enter text panel content first');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }

    try {
      const { overlayTextOnImage } = await import('../services/OverlayService');
      const { DEFAULT_PANEL_CONFIG } = await import('../types/Book');
      
      // Create a blank gray canvas as base image
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      const blankImage = canvas.toDataURL('image/png');

      // Get panel config from book or use defaults
      const panelConfig = activeBook?.style?.panelConfig || DEFAULT_PANEL_CONFIG;
      
      console.log('🔍 PREVIEW Text Panel Config:', JSON.stringify(panelConfig, null, 2));

      // Replace macros
      const macros = { 'SceneDescription': currentScene?.description || 'Scene description here' };
      let previewText = textPanel;
      Object.entries(macros).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        previewText = previewText.replace(regex, value);
      });

      // Preview with current config
      const resultUrl = await overlayTextOnImage(
        blankImage,
        previewText,
        canvas.width,
        canvas.height,
        panelConfig
      );
      
      setTextPanelPreviewUrl(resultUrl);
      setTextPanelPreviewOpen(true);
    } catch (error) {
      console.error('Error previewing text panel:', error);
      setSnackbarMessage('Failed to preview text panel: ' + (error as Error).message);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const insertMacroToTextPanel = (macro: string) => {
    const textarea = textPanelFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    
    // Use the hook's handleInsertMacro which handles the text insertion and auto-save
    handleInsertMacro(macro, start);
    
    // Set cursor position after the inserted macro
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + macro.length, start + macro.length);
    }, 0);
  };

  // Character and element selection handlers are provided by the useSceneEditor hook



  const replaceMacros = (text: string, macros: { [key: string]: string }): string => {
    let result = text;
    for (const [macro, value] of Object.entries(macros)) {
      result = result.replace(new RegExp(`\\{${macro}\\}`, 'g'), value);
    }
    return result;
  };

  // Convert aspect ratio string to dimensions (ChatGPT/OpenAI standard sizes)
  const getImageDimensionsFromAspectRatio = (aspectRatio: string): { width: number; height: number } => {
    // Standard image dimensions based on aspect ratio
    // Using 1024px as base dimension for consistency
    switch (aspectRatio) {
      case '1:1':
        return { width: 1024, height: 1024 }; // Square
      case '2:3':
        return { width: 1024, height: 1536 }; // Portrait 2:3
      case '3:4':
        return { width: 1024, height: 1365 }; // Portrait 3:4
      case '9:16':
        return { width: 1024, height: 1792 }; // Portrait 9:16
      case '3:2':
        return { width: 1536, height: 1024 }; // Landscape 3:2
      case '4:3':
        return { width: 1365, height: 1024 }; // Landscape 4:3
      case '16:9':
        return { width: 1792, height: 1024 }; // Wide Landscape 16:9
      default:
        // Fallback to 3:4 portrait (common for storybooks)
        return { width: 1024, height: 1365 };
    }
  };

  // updateSceneCharacterIds and updateSceneElementIds are now handled by the useSceneEditor hook



  // Handlers for SceneImageGenerator component
  const handleImageGenerationStart = () => {
    setGeneratedImageUrl(null);
  };

  const handleImageGenerationComplete = (imageUrl: string) => {
    setGeneratedImageUrl(imageUrl);
  };

  const handleImageGenerationError = (error: Error) => {
    setErrorDialogMessage(
      error instanceof Error 
        ? `An unexpected error occurred:\n\n${error.message}\n\n${error.stack || ''}` 
        : 'An unexpected error occurred'
    );
    setErrorDialogOpen(true);
  };



  // Clear all images for the current scene
  const handleClearSceneImages = async () => {
    if (!currentScene) return;
    
    if (!window.confirm(`Clear all images from this scene? This will delete all generated images for "${currentScene.title}".`)) {
      return;
    }

    try {
      let deletedCount = 0;
      
      // Delete images from filesystem
      if (currentScene.imageHistory && currentScene.imageHistory.length > 0) {
        for (const image of currentScene.imageHistory) {
          try {
            await ImageStorageService.deleteImage(image.id);
            deletedCount++;
          } catch (err) {
            console.error(`Failed to delete image ${image.id}:`, err);
          }
        }
      }
      
      // Clear imageHistory from scene
      const activeBookData = await BookService.getActiveBookData();
      if (activeBookData && story) {
        const updatedStories = activeBookData.stories.map(s => {
          if (s.id === story.id) {
            const updatedScenes = s.scenes.map(scene => {
              if (scene.id === currentScene.id) {
                return {
                  ...scene,
                  imageHistory: [],
                  updatedAt: new Date()
                };
              }
              return scene;
            });
            return { ...s, scenes: updatedScenes, updatedAt: new Date() };
          }
          return s;
        });
        
        const updatedData = { ...activeBookData, stories: updatedStories };
        await BookService.saveActiveBookData(updatedData);
        
        setSnackbarMessage(`Cleared ${deletedCount} image(s) from scene`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Clear UI state
        setGeneratedImageUrl(null);
        if (onImageStateChange) {
          onImageStateChange(null, () => {}, () => {});
        }
        
        onStoryUpdate();
      }
    } catch (error) {
      console.error('Failed to clear scene images:', error);
      setSnackbarMessage(`Failed to clear images: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Build preview data for SceneImageGenerator (uses hook)
  const handleBuildPreview = async (modelName: string, promptStrategy?: 'auto' | 'legacy' | 'gemini'): Promise<PreviewData> => {
    return await buildPreview(modelName, promptStrategy);
  };

  // Perform image generation for SceneImageGenerator (uses hook)
  const handlePerformImageGeneration = async (modelName: string, promptStrategy?: 'auto' | 'legacy' | 'gemini') => {
    // Store the selected model for potential retry
    lastSelectedModel.current = modelName;
    
    // Get the active book to retrieve aspect ratio and panel config
    const activeBookId = await BookService.getActiveBookId();
    const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
    
    // Check if scene has custom layout - if so, calculate aspect ratio from canvas dimensions
    let aspectRatio: string;
    if (currentScene?.layout) {
      const canvasWidth = currentScene.layout.canvas.width;
      const canvasHeight = currentScene.layout.canvas.height;
      // Calculate GCD to get simplest ratio
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(canvasWidth, canvasHeight);
      const ratioWidth = canvasWidth / divisor;
      const ratioHeight = canvasHeight / divisor;
      aspectRatio = `${ratioWidth}:${ratioHeight}`;
      console.log(`🎨 Using aspect ratio from layout canvas: ${canvasWidth}x${canvasHeight} = ${aspectRatio}`);
    } else {
      aspectRatio = activeBook?.aspectRatio || '3:4';
      console.log(`📐 Using book's default aspect ratio: ${aspectRatio}`);
    }
    
    const panelConfig = activeBook?.style?.panelConfig || DEFAULT_PANEL_CONFIG;

    // Pre-check text fit if textPanel has content and autoHeight is disabled
    if (textPanel && textPanel.trim() && !panelConfig.autoHeight) {
      const imageDimensions = getImageDimensionsFromAspectRatio(aspectRatio);
      const macros = {
        'SceneDescription': currentScene?.description || ''
      };
      const panelText = replaceMacros(textPanel, macros);
      
      const fitResult = measureTextFit(
        panelText,
        imageDimensions.width,
        imageDimensions.height,
        panelConfig
      );

      if (!fitResult.fits) {
        // Text doesn't fit - show confirmation dialog
        setTextFitInfo({
          requiredHeightPercentage: fitResult.requiredHeightPercentage,
          lineCount: fitResult.lineCount,
          currentHeightPercentage: panelConfig.heightPercentage
        });
        setTextFitDialogOpen(true);
        return; // Don't proceed with generation
      }
    }

    try {
      // Update currentScene with current UI state before generating
      if (currentScene && story) {
        currentScene.textPanel = textPanel;
        if (diagramContent && diagramContent.trim()) {
          currentScene.diagramPanel = {
            type: diagramType,
            content: diagramContent,
            language: diagramType === 'code' ? diagramLanguage : undefined
          };
        } else {
          currentScene.diagramPanel = undefined;
        }
      }
      
      // Use the hook to perform generation
      await startGeneration(modelName, promptStrategy);
      
      // Auto-save to file system if enabled and directory is configured
      const autoSaveEnabled = await SettingsService.isAutoSaveEnabled();
      
      if (autoSaveEnabled && story && currentScene) {
        const activeBookId = await BookService.getActiveBookId();
        const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
        
        if (activeBook) {
          // Note: The actual image URL will be available after generation completes
          // This is handled by the hook's callback
          setSnackbarMessage('Image generated successfully! Auto-save will occur after generation.');
        } else {
          setSnackbarMessage('Image generated successfully!');
        }
      } else {
        setSnackbarMessage('Image generated successfully! Use Save button to save.');
      }
        
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error generating image:', error);
      throw error; // Re-throw to be handled by SceneImageGenerator
    }
  };

  const handleSaveImage = useCallback(async () => {
    if (!generatedImageUrl || !story || !currentScene) return;
    
    // Try to save to configured directory first
    const activeBookId = await BookService.getActiveBookId();
    const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
    
    if (activeBook) {
      const saveResult = await FileSystemService.saveImage(
        generatedImageUrl,
        activeBook.title,
        currentScene.title
      );
      
      if (saveResult.success) {
        setSnackbarMessage(`Image saved to: ${saveResult.path}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        return;
      }
    }
    
    // Fallback to browser download if no directory configured or save failed
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `${currentScene?.title || 'scene'}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbarMessage('Image downloaded to your Downloads folder');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }, [generatedImageUrl, story, currentScene]);

  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(errorDialogMessage);
      setSnackbarMessage('Error message copied to clipboard');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy error:', error);
      setSnackbarMessage('Failed to copy to clipboard');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Notify parent component about image state changes
  useEffect(() => {
    // Only notify if the URL has actually changed to prevent infinite loops
    if (onImageStateChange && generatedImageUrl !== lastNotifiedImageUrl.current) {
      lastNotifiedImageUrl.current = generatedImageUrl;
      onImageStateChange(generatedImageUrl, handleSaveImage, () => setGeneratedImageUrl(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedImageUrl, handleSaveImage]);

  if (!story) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a story to edit scenes
        </Typography>
      </Paper>
    );
  }

  if (!currentScene) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a scene to edit
        </Typography>
      </Paper>
    );
  }

    // Merge book-level and story-level characters
    const bookCharacters = (activeBook?.characters || []).map((c: any) => ({ ...c, isBookLevel: true }));
    const storyCharacters = (story.characters || []).map((c: any) => ({ ...c, isBookLevel: false }));
    const availableCharacters = [...bookCharacters, ...storyCharacters];
    const availableElements = story.elements || [];

  return (
    <Paper elevation={2} sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 200px)', 
      maxHeight: 'calc(100vh - 200px)',
      overflow: 'hidden'
    }}>
      {/* Fixed Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              variant="outlined"
              label="Scene Title"
              placeholder="Enter scene title..."
              value={sceneTitle}
              onChange={handleSceneTitleChange}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }
              }}
            />
          </Box>
          <Box display="flex" gap={1}>
            {currentScene && story && (
              <SceneImageGenerator
                scene={currentScene}
                story={story}
                onGenerationStart={handleImageGenerationStart}
                onGenerationComplete={handleImageGenerationComplete}
                onGenerationError={handleImageGenerationError}
                onBuildPreview={handleBuildPreview}
                onPerformGeneration={handlePerformImageGeneration}
                isGenerating={isGeneratingImage}
              />
            )}
            <Tooltip title="Configure scene layout (comic book style, overlay, etc.)">
              <Button
                variant="outlined"
                startIcon={<LayoutIcon />}
                onClick={handleEditLayout}
                disabled={!currentScene}
              >
                Layout
              </Button>
            </Tooltip>
            <Tooltip title="Test layout with placeholder image (no AI generation)">
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleTestLayout}
                disabled={!currentScene || isGeneratingImage || isTestingLayout}
              >
                Test Layout
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ClearImagesIcon />}
              onClick={handleClearSceneImages}
              disabled={!currentScene?.imageHistory || currentScene.imageHistory.length === 0}
            >
              Clear Scene Images
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          label="Scene Description"
          placeholder="Describe this scene..."
          value={sceneDescription}
          onChange={handleSceneDescriptionChange}
          sx={{ mb: 2 }}
        />

      </Box>

      {/* Text Panel Section - Extracted Component */}
      <SceneTextPanel
        textPanelContent={textPanel}
        onTextPanelChange={handleTextPanelChange}
        onInsertMacro={insertMacroToTextPanel}
        onPreview={handlePreviewTextPanel}
        textPanelFieldRef={textPanelFieldRef}
      />

      {/* Diagram Panel Section - Extracted Component */}
      <SceneDiagramPanel
        scene={currentScene}
        story={story}
        diagramType={diagramType}
        diagramContent={diagramContent}
        diagramLanguage={diagramLanguage}
        onDiagramChange={handleDiagramPanelChange}
        onPreview={handlePreviewDiagram}
      />

      {/* Scrollable Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 3,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#a8a8a8',
        },
      }}>

      {/* Character Selection - Extracted Component */}
      <SceneCharacterSelector
        availableCharacters={availableCharacters}
        selectedCharacters={selectedCharacters}
        onSelectionChange={handleCharacterSelectionChange}
      />

      {/* Element Selection - Extracted Component */}
      <SceneElementSelector
        availableElements={availableElements}
        selectedElements={selectedElements}
        onSelectionChange={handleElementSelectionChange}
      />

      {/* Prompt Preview - Extracted Component */}
      <ScenePromptPreview
        scene={currentScene}
        story={story}
        activeBook={activeBook}
        availableCharacters={availableCharacters}
        availableElements={availableElements}
        selectedCharacters={selectedCharacters}
        selectedElements={selectedElements}
        textPanelContent={textPanel}
        onInsertMacro={insertMacroToTextPanel}
      />

      {/* Diagram Preview Dialog */}
      <Dialog
        open={diagramPreviewOpen}
        onClose={() => setDiagramPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Diagram Preview</DialogTitle>
        <DialogContent>
          {diagramPreviewUrl && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <img 
                src={diagramPreviewUrl} 
                alt="Diagram Preview" 
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiagramPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Error Dialog */}
      <Dialog 
        open={errorDialogOpen} 
        onClose={() => setErrorDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            m: 0
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            bgcolor: 'error.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <ErrorIcon />
          Image Generation Error
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            An error occurred while generating the image
          </Alert>
          
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Error Details:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={errorDialogMessage}
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                bgcolor: 'grey.50'
              }
            }}
            sx={{ mb: 3 }}
          />

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Common solutions:
            </Typography>
            <Typography variant="body2" component="div">
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Check that your OpenRouter API key is valid</li>
                <li>Verify you have sufficient credits in your OpenRouter account</li>
                <li>Try a different model (some models may be unavailable)</li>
                <li>Ensure your scene has a description</li>
                <li>Check the OpenRouter status page for service issues</li>
              </ul>
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCopyError}
            startIcon={<CopyIcon />}
            sx={{ mr: 'auto' }}
          >
            Copy Error
          </Button>
          <Button onClick={() => setErrorDialogOpen(false)} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Text Fit Warning Dialog */}
      <Dialog
        open={textFitDialogOpen}
        onClose={() => setTextFitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          Text Panel Size Warning
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            The text panel content is too large to fit in the current panel size.
          </Alert>
          {textFitInfo && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Current panel height:</strong> {textFitInfo.currentHeightPercentage}%
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Required height:</strong> {textFitInfo.requiredHeightPercentage}%
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Number of text lines:</strong> {textFitInfo.lineCount}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="text.secondary">
            Would you like to proceed anyway? Text may be clipped. 
            Alternatively, you can enable "Auto Height" in the panel configuration, 
            or reduce your text or increase the panel height percentage.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTextFitDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              // Get current book's panel config
              const activeBookId = await BookService.getActiveBookId();
              const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
              
              if (activeBook) {
                setEditingPanelConfig(activeBook.style?.panelConfig || DEFAULT_PANEL_CONFIG);
                setPanelConfigDialogOpen(true);
              }
              setTextFitDialogOpen(false);
            }}
            color="primary"
          >
            Adjust Settings
          </Button>
          <Button
            onClick={async () => {
              setTextFitDialogOpen(false);
              // Force generation with clipped text using last selected model or default
              const modelToUse = lastSelectedModel.current || await SettingsService.getImageGenerationModel();
              handlePerformImageGeneration(modelToUse);
            }}
            variant="contained"
            color="warning"
          >
            Generate Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Panel Config Dialog */}
      <PanelConfigDialog
        open={panelConfigDialogOpen}
        onClose={() => setPanelConfigDialogOpen(false)}
        initialConfig={editingPanelConfig}
        onSave={async (newConfig) => {
          // Save panel config to active book
          const activeBookId = await BookService.getActiveBookId();
          const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
          
          if (activeBook) {
            await BookService.updateBook(activeBook.id, { panelConfig: newConfig });
            setSnackbarMessage('Panel configuration updated successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            onStoryUpdate();
          }
          setPanelConfigDialogOpen(false);
        }}
      />

      {/* Scene Layout Editor Dialog */}
      <SceneLayoutEditor
        open={layoutEditorOpen}
        currentLayout={
          // If scene has its own layout, use it; otherwise show the resolved layout (from story/book)
          currentScene?.layout || layoutSourceInfo.resolvedLayout
        }
        bookAspectRatio={activeBook?.aspectRatio || '3:4'}
        layoutSource={layoutSourceInfo.source}
        layoutSourceDescription={layoutSourceInfo.description}
        inheritedLayout={layoutSourceInfo.inheritedLayout}
        inheritedLayoutSource={layoutSourceInfo.inheritedLayoutSource}
        onSave={handleSaveLayout}
        onCancel={() => setLayoutEditorOpen(false)}
        onClearLayout={layoutSourceInfo.source === 'scene' ? handleClearSceneLayout : undefined}
      />

      {/* Text Panel Preview Dialog */}
      <Dialog
        open={textPanelPreviewOpen}
        onClose={() => setTextPanelPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Text Panel Preview</DialogTitle>
        <DialogContent>
          {textPanelPreviewUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <img
                src={textPanelPreviewUrl}
                alt="Text Panel Preview"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTextPanelPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Diagram Panel Preview Dialog */}
      <Dialog
        open={diagramPreviewOpen}
        onClose={() => setDiagramPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Diagram Panel Preview</DialogTitle>
        <DialogContent>
          {diagramPreviewUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <img
                src={diagramPreviewUrl}
                alt="Diagram Panel Preview"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiagramPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Layout Test Preview Dialog */}
      <Dialog
        open={layoutTestPreviewOpen}
        onClose={() => setLayoutTestPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Layout Test Preview</DialogTitle>
        <DialogContent>
          {layoutTestPreviewUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, backgroundColor: '#f5f5f5' }}>
              <img
                src={layoutTestPreviewUrl}
                alt="Layout Test Preview"
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLayoutTestPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Paper>
  );
}; 