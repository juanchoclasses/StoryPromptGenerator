import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Person as PersonIcon,
  Image as ImageIcon,
  ErrorOutline as ErrorIcon,
  Code as CodeIcon,
  TextFields as TextFieldsIcon,
  DeleteSweep as ClearImagesIcon,
  GridOn as LayoutIcon
} from '@mui/icons-material';
import type { Scene, Story } from '../types/Story';
import type { Character } from '../models/Story'; // v4.1: New Character type with imageGallery
import type { SceneLayout } from '../types/Story'; // Layout configuration
import { BookService } from '../services/BookService';
import { SceneImageGenerationService } from '../services/SceneImageGenerationService';
import { FileSystemService } from '../services/FileSystemService';
import { SettingsService } from '../services/SettingsService';
import { ImageStorageService } from '../services/ImageStorageService';
import { DEFAULT_PANEL_CONFIG } from '../types/Book';
import type { PanelConfig } from '../types/Book';
import { formatBookStyleForPrompt } from '../types/BookStyle';
import { measureTextFit } from '../services/TextMeasurementService';
import { ModelSelectionDialog } from './ModelSelectionDialog';
import { PanelConfigDialog } from './PanelConfigDialog';
import { SceneLayoutEditor } from './SceneLayoutEditor';
import { LayoutResolver } from '../services/LayoutResolver';
import { ImageGenerationPreviewDialog, type PreviewData } from './ImageGenerationPreviewDialog';
import { SceneCharacterSelector } from './SceneCharacterSelector';
import { SceneElementSelector } from './SceneElementSelector';

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
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [sceneTitle, setSceneTitle] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [textPanel, setTextPanel] = useState('');
  const [diagramType, setDiagramType] = useState<'mermaid' | 'math' | 'code' | 'markdown'>('mermaid');
  const [diagramContent, setDiagramContent] = useState('');
  const [diagramLanguage, setDiagramLanguage] = useState('javascript');
  const [diagramPreviewOpen, setDiagramPreviewOpen] = useState(false);
  const [diagramPreviewUrl, setDiagramPreviewUrl] = useState<string | null>(null);
  const [textPanelPreviewOpen, setTextPanelPreviewOpen] = useState(false);
  const [textPanelPreviewUrl, setTextPanelPreviewUrl] = useState<string | null>(null);
  const [layoutTestPreviewOpen, setLayoutTestPreviewOpen] = useState(false);
  const [layoutTestPreviewUrl, setLayoutTestPreviewUrl] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<any>(null); // Book instance for book-level characters

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Compute layout source for the layout editor
  const layoutSourceInfo = useMemo(() => {
    if (!currentScene || !story || !activeBook) {
      return { 
        source: 'default' as const, 
        description: 'System default (overlay)',
        resolvedLayout: undefined,
        inheritedLayout: undefined,
        inheritedLayoutSource: undefined
      };
    }
    
    const source = LayoutResolver.getLayoutSource(currentScene, story, activeBook);
    const description = LayoutResolver.getLayoutSourceDescription(currentScene, story, activeBook);
    
    // Get the resolved layout (what's actually being used)
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
        inheritedLayout = activeBook.defaultLayout;
        inheritedLayoutSource = 'Book';
      }
    }
    
    return { source, description, resolvedLayout, inheritedLayout, inheritedLayoutSource };
  }, [currentScene, story, activeBook]);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState('');
  const [textFitDialogOpen, setTextFitDialogOpen] = useState(false);
  const [textFitInfo, setTextFitInfo] = useState<{
    requiredHeightPercentage: number;
    lineCount: number;
    currentHeightPercentage: number;
  } | null>(null);
  const [modelSelectionOpen, setModelSelectionOpen] = useState(false);
  const [panelConfigDialogOpen, setPanelConfigDialogOpen] = useState(false);
  const [editingPanelConfig, setEditingPanelConfig] = useState<PanelConfig>(DEFAULT_PANEL_CONFIG);
  const [layoutEditorOpen, setLayoutEditorOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [pendingModelForGeneration, setPendingModelForGeneration] = useState<string | null>(null);
  
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
              // v4.0: Use names instead of IDs (with backward compatibility)
              setSelectedCharacters(freshScene.characters || freshScene.characterIds || []);
              setSelectedElements(freshScene.elements || freshScene.elementIds || []);
              setSceneTitle(freshScene.title);
              setSceneDescription(freshScene.description || '');
              setTextPanel(freshScene.textPanel || '');
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
        // v4.0: Use names instead of IDs (with backward compatibility)
        setSelectedCharacters(selectedScene.characters || selectedScene.characterIds || []);
        setSelectedElements(selectedScene.elements || selectedScene.elementIds || []);
        setSceneTitle(selectedScene.title);
        setSceneDescription(selectedScene.description || '');
        setTextPanel(selectedScene.textPanel || '');
        setDiagramType(selectedScene.diagramPanel?.type as any || 'mermaid');
        setDiagramContent(selectedScene.diagramPanel?.content || '');
        setDiagramLanguage(selectedScene.diagramPanel?.language || 'javascript');
        // Load image from filesystem (or null if no images)
        const imageUrl = await loadImageWithFallback(selectedScene);
        setGeneratedImageUrl(imageUrl);
      } else {
        setCurrentScene(null);
        setSelectedCharacters([]);
        setSelectedElements([]);
        setSceneTitle('');
        setSceneDescription('');
        setTextPanel('');
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

  const handleSceneTitleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    setSceneTitle(newTitle);
    
    // Auto-save the scene title
    if (story && currentScene) {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(scene => {
            if (scene.id === currentScene.id) {
              return { ...scene, title: newTitle, updatedAt: new Date() };
            }
            return scene;
          });
          return { ...s, scenes: updatedScenes, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      onStoryUpdate();
    }
  };

  const handleSceneDescriptionChange = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = event.target.value;
    setSceneDescription(newDescription);
    
    // Auto-save the scene description
    if (story && currentScene) {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(scene => {
            if (scene.id === currentScene.id) {
              return { ...scene, description: newDescription, updatedAt: new Date() };
            }
            return scene;
          });
          return { ...s, scenes: updatedScenes, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      onStoryUpdate();
    }
  };

  const handleTextPanelChange = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTextPanel = event.target.value;
    setTextPanel(newTextPanel);
    
    // Auto-save the text panel (but don't trigger full refresh)
    if (story && currentScene) {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(scene => {
            if (scene.id === currentScene.id) {
              return { ...scene, textPanel: newTextPanel, updatedAt: new Date() };
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

  const insertMacroToTextPanel = async (macro: string) => {
    const textarea = textPanelFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textPanel;
    
    const newText = text.substring(0, start) + macro + text.substring(end);
    setTextPanel(newText);
    
    // Trigger auto-save
    if (story && currentScene) {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(scene => {
            if (scene.id === currentScene.id) {
              return { ...scene, textPanel: newText, updatedAt: new Date() };
            }
            return scene;
          });
          return { ...s, scenes: updatedScenes, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      onStoryUpdate();
    }
    
    // Set cursor position after the inserted macro
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + macro.length, start + macro.length);
    }, 0);
  };

  /**
   * Handle character selection from SceneCharacterSelector component
   * This is a simpler handler that receives the character names array directly
   */
  const handleCharacterSelectionChange = async (characterNames: string[]) => {
    if (!story || !currentScene) return;
    
    setSelectedCharacters(characterNames);
    await updateSceneCharacterIds(characterNames);
  };

  /**
   * Handle element selection from SceneElementSelector component
   * This is a simpler handler that receives the element IDs array directly
   */
  const handleElementSelectionChange = async (elementIds: string[]) => {
    if (!story || !currentScene) return;
    
    setSelectedElements(elementIds);
    await updateSceneElementIds(elementIds);
  };



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

  /**
   * Convert blob URL to base64 data URL
   */
  const blobUrlToDataUrl = async (blobUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = blobUrl;
    });
  };

  /**
   * Load character reference images from filesystem for characters with selected images
   * Converts blob URLs to base64 data URLs for API compatibility
   */
  const loadCharacterImages = async (): Promise<string[]> => {
    if (!story || !currentScene) return [];

    const selectedCharacterNames = currentScene.characters || currentScene.characterIds || [];
    const selectedCast = availableCharacters.filter(char => 
      selectedCharacterNames.includes(char.name) || selectedCharacterNames.includes(char.id)
    );

    const imageUrls: string[] = [];
    const { ImageStorageService } = await import('../services/ImageStorageService');

    for (const character of selectedCast) {
      const charWithImages = character as unknown as Character;
      if (charWithImages.selectedImageId) {
        try {
          // Load image from filesystem (returns blob URL)
          const blobUrl = await ImageStorageService.getCharacterImage(
            story.id,
            character.name,
            charWithImages.selectedImageId
          );
          
          if (blobUrl) {
            console.log(`✓ Loaded blob URL for ${character.name}`);
            
            // Convert blob URL to base64 data URL for API
            console.log(`  Converting to base64...`);
            const dataUrl = await blobUrlToDataUrl(blobUrl);
            console.log(`  ✓ Converted to data URL (${Math.round(dataUrl.length / 1024)}KB)`);
            
            imageUrls.push(dataUrl);
          }
        } catch (err) {
          console.warn(`Failed to load/convert image for ${character.name}:`, err);
        }
      }
    }

    return imageUrls;
  };

  const generatePrompt = async (modelName?: string, promptStrategy?: 'auto' | 'legacy' | 'gemini') => {
    if (!story || !currentScene) return '';

    // v4.0: Find characters and elements by name (not ID)
    const selectedCharacterNames = currentScene.characters || currentScene.characterIds || [];
    const selectedElementNames = currentScene.elements || currentScene.elementIds || [];
    
    const selectedCast = availableCharacters.filter(char => 
      selectedCharacterNames.includes(char.name) || selectedCharacterNames.includes(char.id)
    );
    const selectedElements = availableElements.filter(elem => 
      selectedElementNames.includes(elem.name) || selectedElementNames.includes(elem.id)
    );
    
    // Get the active book information with full details
    const activeBookId = await BookService.getActiveBookId();
    const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
    
    // Prepare characters with isBookLevel flag for the service
    const charactersWithLevel = selectedCast.map(char => {
      const charWithImages = char as unknown as Character;
      // Check if this character is from the book level
      const isBookLevel = activeBook?.characters?.some(bookChar => bookChar.name === char.name) || false;
      return {
        ...charWithImages,
        isBookLevel
      };
    });
    
    // Prepare elements array
    const elementsForPrompt = selectedElements.map(elem => ({
      name: elem.name,
      description: elem.description
    }));
    
    // Use the unified service method to build the prompt
    return SceneImageGenerationService.buildScenePrompt(
      currentScene,
      story,
      activeBook,
      charactersWithLevel,
      elementsForPrompt,
      modelName,
      promptStrategy
    );
  };

  const updateSceneCharacterIds = async (newCharacterNames: string[]) => {
    if (story && currentScene) {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(scene => {
            if (scene.id === currentScene.id) {
              return { 
                ...scene, 
                characters: newCharacterNames, // v4.0: Store names
                characterIds: newCharacterNames, // Backward compat
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
      onStoryUpdate();
    }
  };

  const updateSceneElementIds = async (newElementNames: string[]) => {
    if (story && currentScene) {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(scene => {
            if (scene.id === currentScene.id) {
              return { 
                ...scene, 
                elements: newElementNames, // v4.0: Store names
                elementIds: newElementNames, // Backward compat
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
      onStoryUpdate();
    }
  };

  const handleCopyPrompt = async () => {
    const prompt = await generatePrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setSnackbarMessage('Prompt copied to clipboard!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      setSnackbarMessage('Failed to copy prompt');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Show model selection dialog when Generate Image is clicked
  const handleGenerateImage = () => {
    setModelSelectionOpen(true);
  };

  // Open layout editor
  const handleEditLayout = () => {
    setLayoutEditorOpen(true);
  };

  // Clear scene layout (to fall back to story/book layout)
  const handleClearSceneLayout = async () => {
    if (!currentScene || !activeBook || !story) return;

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
    
    setSnackbarMessage('Scene layout cleared - using inherited layout');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  // Save layout configuration
  const handleSaveLayout = async (layout: SceneLayout) => {
    if (!currentScene || !activeBook || !story) return;

    console.log('💾 Saving layout configuration:', layout);
    console.log('  Current scene ID:', currentScene.id);
    console.log('  Story ID:', story.id);
    console.log('  Active book ID:', activeBook.id);

    // Find the actual scene in the book's story array and update it
    const storyInBook = activeBook.stories.find(s => s.id === story.id);
    if (!storyInBook) {
      console.error('❌ Story not found in book');
      return;
    }

    console.log('  ✓ Found story in book, scenes count:', storyInBook.scenes.length);

    const sceneInStory = storyInBook.scenes.find(s => s.id === currentScene.id);
    if (!sceneInStory) {
      console.error('❌ Scene not found in story');
      return;
    }

    console.log('  ✓ Found scene in story');
    console.log('  Scene before update:', { 
      id: sceneInStory.id, 
      title: sceneInStory.title,
      hasLayout: !!sceneInStory.layout 
    });

    // Update the scene in the book's data structure
    sceneInStory.layout = layout;
    sceneInStory.updatedAt = new Date();

    console.log('  ✓ Layout assigned to scene');
    console.log('  Scene after update:', { 
      id: sceneInStory.id, 
      title: sceneInStory.title,
      hasLayout: !!sceneInStory.layout,
      layoutType: sceneInStory.layout?.type 
    });

    // Save book
    await BookService.saveBook(activeBook);
    console.log('✓ Book saved to filesystem');
    
    // Verify the layout was saved by reloading
    const reloadedBook = await BookService.getActiveBookData();
    if (reloadedBook) {
      const reloadedStory = reloadedBook.stories.find(s => s.id === story.id);
      const reloadedScene = reloadedStory?.scenes.find(s => s.id === currentScene.id);
      console.log('  Verification - Scene after reload:', {
        hasLayout: !!reloadedScene?.layout,
        layoutType: reloadedScene?.layout?.type
      });
    }
    
    onStoryUpdate();
    setLayoutEditorOpen(false);

    setSnackbarMessage('Layout saved successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  // Test layout with placeholder image
  const handleTestLayout = async () => {
    if (!currentScene || !activeBook || !story) {
      setSnackbarMessage('Please select a scene first');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIsGeneratingImage(true);
    setSnackbarMessage('Generating layout test preview...');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);

    try {
      console.log('🧪 Testing layout with placeholder image');

      // Use LayoutResolver to get the effective layout
      const { LayoutResolver } = await import('../services/LayoutResolver');
      const resolvedLayout = LayoutResolver.resolveLayout(currentScene, story, activeBook);
      const layoutSource = LayoutResolver.getLayoutSourceDescription(currentScene, story, activeBook);
      
      console.log(`📐 Layout source: ${layoutSource}`);
      
      // If no layout resolved, create a default one
      const defaultAspectRatio = activeBook.aspectRatio || '3:4';
      let layout = resolvedLayout || {
        type: 'overlay',
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
      // Use the aspect ratio from the image element or fall back to book's aspect ratio
      const imageElement = layout.elements.image;
      const imageAspectRatioStr = (imageElement && 'aspectRatio' in imageElement && imageElement.aspectRatio) 
        ? imageElement.aspectRatio 
        : defaultAspectRatio;
      const [ratioWidth, ratioHeight] = imageAspectRatioStr.split(':').map(Number);
      const imageAspectRatio = ratioWidth / ratioHeight;
      
      // Calculate actual image dimensions based on aspect ratio
      // The image will be scaled by LayoutCompositionService, but we need to create it at the right aspect ratio
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

      // Import services
      const { createTextPanel } = await import('../services/OverlayService');
      const { renderDiagramToCanvas } = await import('../services/DiagramRenderService');
      const { composeSceneWithLayout } = await import('../services/LayoutCompositionService');
      const { DEFAULT_PANEL_CONFIG } = await import('../types/Book');

      let textPanelDataUrl: string | null = null;
      let diagramPanelDataUrl: string | null = null;
      let textPanelHeight = 0; // Track for bottom-anchoring

      // Render text panel if present
      if (currentScene.textPanel && layout.elements.textPanel) {
        console.log('  Rendering text panel...');
        const panelConfig = activeBook.style?.panelConfig || DEFAULT_PANEL_CONFIG;
        
        const textPanelWidth = Math.round((layout.elements.textPanel.width / 100) * layout.canvas.width);
        
        // Calculate the actual height needed for the text content
        textPanelHeight = calculateTextPanelHeight(currentScene.textPanel, textPanelWidth, panelConfig);
        console.log(`  Text panel auto-calculated height: ${textPanelHeight}px`);
        
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
        
        const canvas = document.createElement('canvas');
        canvas.width = textPanelBitmap.width;
        canvas.height = textPanelBitmap.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(textPanelBitmap, 0, 0);
          textPanelDataUrl = canvas.toDataURL('image/png');
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
      // Adjust text panel Y position if it's bottom-anchored (use shared logic)
      const { SceneImageGenerationService } = await import('../services/SceneImageGenerationService');
      layout = SceneImageGenerationService.adjustBottomAnchoredTextPanel(layout, textPanelHeight);

      const composedImageUrl = await composeSceneWithLayout(
        placeholderImageUrl,
        textPanelDataUrl,
        diagramPanelDataUrl,
        layout
      );
      console.log('  ✓ Layout test preview created');

      // Set preview URL and open dialog
      setLayoutTestPreviewUrl(composedImageUrl);
      setLayoutTestPreviewOpen(true);
      
      setSnackbarMessage('Layout test preview ready!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

    } catch (error) {
      console.error('Error testing layout:', error);
      setSnackbarMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsGeneratingImage(false);
    }
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
            await ImageStorageService.deleteImage(image.id, currentScene.id);
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
          onImageStateChange(false, () => {});
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

  // Build preview data for the preview dialog
  const buildPreviewData = async (modelName: string, promptStrategy?: 'auto' | 'legacy' | 'gemini'): Promise<PreviewData> => {
    const activeBookId = await BookService.getActiveBookId();
    const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
    
    // Calculate aspect ratio
    let aspectRatio: string;
    if (currentScene?.layout) {
      const canvasWidth = currentScene.layout.canvas.width;
      const canvasHeight = currentScene.layout.canvas.height;
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(canvasWidth, canvasHeight);
      const ratioWidth = canvasWidth / divisor;
      const ratioHeight = canvasHeight / divisor;
      aspectRatio = `${ratioWidth}:${ratioHeight}`;
    } else {
      aspectRatio = activeBook?.aspectRatio || '3:4';
    }
    
    // Generate the full prompt with model and strategy
    const prompt = await generatePrompt(modelName, promptStrategy);
    
    // Load character images
    const characterImages: Array<{ name: string; url: string }> = [];
    for (const charName of selectedCharacters) {
      let character = story?.characters?.find(c => c.name === charName);
      if (!character && activeBook) {
        character = activeBook.characters?.find(c => c.name === charName);
      }
      
      if (character) {
        const charWithImages = character as unknown as Character;
        if (charWithImages.selectedImageId && charWithImages.imageGallery) {
          const selectedImage = charWithImages.imageGallery.find(img => img.id === charWithImages.selectedImageId);
          if (selectedImage) {
            try {
              const imageUrl = await ImageStorageService.getImage(selectedImage.id);
              if (imageUrl) {
                characterImages.push({
                  name: character.name,
                  url: imageUrl
                });
              }
            } catch (error) {
              console.warn(`Failed to load image for character ${character.name}:`, error);
            }
          }
        }
      }
    }
    
    return {
      sceneTitle: currentScene?.title || 'Untitled Scene',
      sceneDescription: currentScene?.description || '',
      prompt,
      characterImages,
      aspectRatio,
      model: modelName
    };
  };

  // Show preview dialog after model selection
  const handleShowPreview = async (modelName: string, promptStrategy?: 'auto' | 'legacy' | 'gemini') => {
    try {
      setPendingModelForGeneration(modelName);
      const preview = await buildPreviewData(modelName, promptStrategy);
      setPreviewData(preview);
      setPreviewDialogOpen(true);
      setModelSelectionOpen(false);
      console.log(`Preview using strategy: ${promptStrategy || 'auto'}`);
    } catch (error) {
      console.error('Failed to build preview:', error);
      setSnackbarMessage(`Failed to build preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Actually perform the image generation with the selected model
  const performImageGeneration = async (modelName: string, promptStrategy?: 'auto' | 'legacy' | 'gemini') => {
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

    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);

    try {
      // Use unified SceneImageGenerationService which handles layout detection
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
      
      const finalImageUrl = await SceneImageGenerationService.generateCompleteSceneImage({
        scene: currentScene!,
        story: story!,
        book: activeBook,
        model: modelName,
        aspectRatio,
        promptStrategy // Pass the selected prompt strategy
      });
      
      // Save generated image to scene in local storage
      if (story && currentScene) {
        const activeBookData = await BookService.getActiveBookData();
        if (activeBookData) {
          // Create new GeneratedImage entry with the model that was used
            // NOTE: We do NOT store the URL in localStorage to avoid quota issues
            // The image is stored on filesystem and loaded on demand
            const imageId = crypto.randomUUID();
            const newGeneratedImage = {
              id: imageId,
              // url is omitted - not stored in localStorage anymore
              modelName: modelName,
              timestamp: new Date()
            };
            
            // Store image to filesystem for persistence
            await ImageStorageService.storeImage(
              imageId,
              currentScene.id,
              finalImageUrl,
              modelName
            ).catch(error => {
              console.error('Failed to store image to filesystem:', error);
              // This is critical - without filesystem storage, image will be lost on refresh
              throw error;
            });
            
            // Load the image back from filesystem to ensure we're displaying the persisted version
            // This prevents issues with blob URLs becoming invalid
            const persistedImageUrl = await ImageStorageService.getImage(imageId);
            if (persistedImageUrl) {
              setGeneratedImageUrl(persistedImageUrl);
            } else {
              console.warn('Failed to load newly stored image from filesystem, using original URL');
              setGeneratedImageUrl(finalImageUrl);
            }
            
            const updatedStories = activeBookData.stories.map(s => {
              if (s.id === story.id) {
                const updatedScenes = s.scenes.map(scene => {
                  if (scene.id === currentScene.id) {
                    // Get existing imageHistory or create new array
                    const existingHistory = scene.imageHistory || [];
                    
                    // Add new image to history (keep last 20 images max)
                    const updatedHistory = [...existingHistory, newGeneratedImage].slice(-20);
                    
                    return { 
                      ...scene, 
                      lastGeneratedImage: finalImageUrl, // Keep for backward compatibility
                      imageHistory: updatedHistory,
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
            onStoryUpdate(); // Notify parent to refresh
          }
        }
        
        // Auto-save to file system if enabled and directory is configured
        const autoSaveEnabled = await SettingsService.isAutoSaveEnabled();
        
        if (autoSaveEnabled && story && currentScene) {
          const activeBookId = await BookService.getActiveBookId();
          const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
          
          if (activeBook) {
            const saveResult = await FileSystemService.saveImage(
              finalImageUrl,
              activeBook.title,
              currentScene.title
            );
            
            if (saveResult.success) {
              setSnackbarMessage(`Image generated and auto-saved to: ${saveResult.path}`);
            } else {
              setSnackbarMessage('Image generated successfully! Use Save button to save to directory.');
            }
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
      setErrorDialogMessage(
        error instanceof Error 
          ? `An unexpected error occurred:\n\n${error.message}\n\n${error.stack || ''}` 
          : 'An unexpected error occurred'
      );
      setErrorDialogOpen(true);
    } finally {
      setIsGeneratingImage(false);
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
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={handleCopyPrompt}
            >
              Get Prompt
            </Button>
            <Button
              variant="contained"
              startIcon={isGeneratingImage ? <CircularProgress size={20} color="inherit" /> : <ImageIcon />}
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
            >
              {isGeneratingImage ? 'Generating...' : 'Generate Image'}
            </Button>
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
                disabled={!currentScene || isGeneratingImage}
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

      {/* Text Panel Section */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <TextFieldsIcon color="primary" />
            <Typography variant="h6">
              Text Panel (for image overlay)
            </Typography>
          </Box>
          <Tooltip title="Insert Scene Description macro">
            <Button
              size="small"
              startIcon={<CodeIcon />}
              onClick={() => insertMacroToTextPanel('{SceneDescription}')}
              variant="outlined"
            >
              {'{SceneDescription}'}
            </Button>
          </Tooltip>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Text to display on the generated image. Use macros like {'{SceneDescription}'} for dynamic content.
        </Typography>

        <TextField
          inputRef={textPanelFieldRef}
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Enter text for image overlay... Use {SceneDescription} to insert scene description."
          value={textPanel}
          onChange={handleTextPanelChange}
          sx={{ 
            bgcolor: 'white',
            '& .MuiInputBase-root': {
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }
          }}
        />
        
        <Button
          variant="outlined"
          color="primary"
          onClick={handlePreviewTextPanel}
          sx={{ mt: 2 }}
        >
          Preview Text Panel
        </Button>
      </Box>

      {/* Diagram Panel Section */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.100' }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <ImageIcon color="secondary" />
          <Typography variant="h6">
            Diagram Panel (optional blackboard/whiteboard overlay)
          </Typography>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Add a diagram, code block, math equation, or markdown text overlay on your image.
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Diagram Type</InputLabel>
          <Select
            value={diagramType}
            label="Diagram Type"
            onChange={(e) => handleDiagramPanelChange(diagramContent, e.target.value, diagramLanguage)}
          >
            <MenuItem value="mermaid">Mermaid Diagram</MenuItem>
            <MenuItem value="math">Math Equation (LaTeX)</MenuItem>
            <MenuItem value="code">Code Block</MenuItem>
            <MenuItem value="markdown">Markdown Text</MenuItem>
          </Select>
        </FormControl>

        {diagramType === 'code' && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Programming Language</InputLabel>
            <Select
              value={diagramLanguage}
              label="Programming Language"
              onChange={(e) => handleDiagramPanelChange(diagramContent, diagramType, e.target.value)}
            >
              <MenuItem value="javascript">JavaScript</MenuItem>
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="java">Java</MenuItem>
              <MenuItem value="typescript">TypeScript</MenuItem>
              <MenuItem value="cpp">C++</MenuItem>
              <MenuItem value="csharp">C#</MenuItem>
            </Select>
          </FormControl>
        )}

        <TextField
          fullWidth
          multiline
          rows={6}
          variant="outlined"
          label={`${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} Content`}
          placeholder={
            diagramType === 'mermaid' ? 'graph TD\n    A[Start] --> B[Process]\n    B --> C[End]' :
            diagramType === 'math' ? 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' :
            diagramType === 'code' ? 'function factorial(n) {\n  return n <= 1 ? 1 : n * factorial(n - 1);\n}' :
            '# Title\n\n- **Bold** text\n- *Italic* text'
          }
          value={diagramContent}
          onChange={(e) => handleDiagramPanelChange(e.target.value, diagramType, diagramLanguage)}
          sx={{ 
            bgcolor: 'white',
            '& .MuiInputBase-root': {
              fontFamily: 'monospace',
              fontSize: '0.85rem'
            }
          }}
        />
        
        <Button
          variant="outlined"
          color="primary"
          onClick={handlePreviewDiagram}
          sx={{ mt: 2 }}
        >
          Preview Diagram
        </Button>
        
        {!story?.diagramStyle && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Note: Diagram style (colors, position, board type) needs to be configured at the story level.
            Click the ⚙️ icon next to the story in the Stories panel to configure it.
          </Alert>
        )}
      </Box>

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
          <Button onClick={() => setErrorDialogOpen(false)}>
            OK
          </Button>
          <Button 
            onClick={() => {
              setErrorDialogOpen(false);
              handleGenerateImage();
            }} 
            variant="contained"
            disabled={isGeneratingImage}
          >
            Retry
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
              performImageGeneration(modelToUse);
            }}
            variant="contained"
            color="warning"
          >
            Generate Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Model Selection Dialog */}
      <ModelSelectionDialog
        open={modelSelectionOpen}
        onClose={() => setModelSelectionOpen(false)}
        onConfirm={performImageGeneration}
        onPreview={handleShowPreview}
      />

      {/* Image Generation Preview Dialog */}
      <ImageGenerationPreviewDialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setPreviewData(null);
          setPendingModelForGeneration(null);
        }}
        onGenerate={() => {
          if (pendingModelForGeneration) {
            performImageGeneration(pendingModelForGeneration);
          }
        }}
        previewData={previewData}
      />

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