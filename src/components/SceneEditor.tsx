import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Person as PersonIcon,
  Image as ImageIcon,
  ErrorOutline as ErrorIcon,
  Code as CodeIcon,
  TextFields as TextFieldsIcon
} from '@mui/icons-material';
import type { Scene, Story } from '../types/Story';
import type { Character } from '../models/Story'; // v4.1: New Character type with imageGallery
import { BookService } from '../services/BookService';
import { ImageGenerationService } from '../services/ImageGenerationService';
import { FileSystemService } from '../services/FileSystemService';
import { SettingsService } from '../services/SettingsService';
import { ImageStorageService } from '../services/ImageStorageService';
import { applyAllOverlays } from '../services/OverlayService';
import { DEFAULT_PANEL_CONFIG } from '../types/Book';
import type { PanelConfig } from '../types/Book';
import { formatBookStyleForPrompt } from '../types/BookStyle';
import { measureTextFit } from '../services/TextMeasurementService';
import { ModelSelectionDialog } from './ModelSelectionDialog';
import { PanelConfigDialog } from './PanelConfigDialog';

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
  const [activeBook, setActiveBook] = useState<any>(null); // Book instance for book-level characters

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

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
  
  const textPanelFieldRef = React.useRef<HTMLTextAreaElement>(null);
  const lastNotifiedImageUrl = useRef<string | null>(null);
  const lastSelectedModel = useRef<string | null>(null);

  /**
   * Load image from IndexedDB
   * URLs are no longer stored in localStorage to avoid quota issues
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
    
    // ALWAYS try to load from IndexedDB first (URLs no longer reliably stored in localStorage)
    try {
      const imageUrl = await ImageStorageService.getImage(id);
      if (imageUrl) {
        console.log(`✓ Image loaded from IndexedDB: ${id}`);
        return imageUrl;
      }
    } catch (error) {
      console.error('Failed to load image from IndexedDB:', error);
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
              // Load image with IndexedDB fallback
              loadImageWithFallback(freshScene).then(imageUrl => {
                setGeneratedImageUrl(imageUrl);
              });
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
        // Load image with IndexedDB fallback
        loadImageWithFallback(selectedScene).then(imageUrl => {
          setGeneratedImageUrl(imageUrl);
        });
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
  }, [selectedScene, story]);

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

  const handleCharacterSelection = async (event: SelectChangeEvent<string[]>) => {
    if (!story || !currentScene) return;
    
    const value = event.target.value;
    const characterNames = typeof value === 'string' ? value.split(',') : value;
    setSelectedCharacters(characterNames);
    
    // v4.0: Store character names instead of IDs
    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData) return;
    
    const updatedStories = activeBookData.stories.map(s => {
      if (s.id === story.id) {
        const updatedScenes = s.scenes.map(scene => {
          if (scene.id === currentScene.id) {
            return { 
              ...scene, 
              characters: characterNames, // v4.0: Store names
              characterIds: characterNames, // Backward compat
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
    
    // Trigger update
    onStoryUpdate();
  };

  const handleElementSelection = async (event: SelectChangeEvent<string[]>) => {
    if (!story || !currentScene) return;
    
    const value = event.target.value;
    const elementNames = typeof value === 'string' ? value.split(',') : value;
    setSelectedElements(elementNames);
    
    // v4.0: Store element names instead of IDs
    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData) return;
    
    const updatedStories = activeBookData.stories.map(s => {
      if (s.id === story.id) {
        const updatedScenes = s.scenes.map(scene => {
          if (scene.id === currentScene.id) {
            return { 
              ...scene, 
              elements: elementNames, // v4.0: Store names
              elementIds: elementNames, // Backward compat
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
    
    // Trigger update
    onStoryUpdate();
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
   * Load character reference images from IndexedDB for characters with selected images
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
          // Load image from IndexedDB (returns blob URL)
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

  const generatePrompt = async () => {
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
    
    // Define available macros
    const macros = {
      'SceneDescription': currentScene.description || ''
    };
    
    let prompt = `Create an illustration with the following requirements:\n\n`;
    
    // Book Style - visual guidelines for the entire book
    if (activeBook) {
      const style = activeBook.style;
      if (style) {
        const styleText = formatBookStyleForPrompt(style);
        if (styleText) {
          prompt += `## BOOK-WIDE VISUAL STYLE (apply to all elements):\n${styleText}\n\n`;
        }
      }
    }
    
    // Book Background Setup - applies to all stories/scenes in this book
    if (activeBook?.backgroundSetup) {
      prompt += `## BOOK-WIDE VISUAL WORLD (applies to all scenes):\n${activeBook.backgroundSetup}\n\n`;
    }
    
    // Story Background Setup - specific context for this story
    if (story.backgroundSetup) {
      prompt += `## STORY CONTEXT (specific to this narrative):\n${story.backgroundSetup}\n\n`;
    }
    
    // Scene Description - what happens in this specific chapter/scene
    prompt += `## THIS SCENE (Chapter/Illustration Details):\n${currentScene.description}\n\n`;
    
    if (selectedCast.length > 0) {
      prompt += `## Characters in this Scene\n`;
      for (const character of selectedCast) {
        const characterDescription = replaceMacros(character.description, macros);
        prompt += `[Character Definition: ${character.name}]\n${characterDescription}\n`;
        
        // Include character image reference if available (v4.1+)
        // Cast to new Character type to access imageGallery fields
        const charWithImages = character as unknown as Character;
        if (charWithImages.selectedImageId && charWithImages.imageGallery) {
          const selectedImage = charWithImages.imageGallery.find(img => img.id === charWithImages.selectedImageId);
          if (selectedImage) {
            prompt += `\nREFERENCE IMAGE PROVIDED: A reference image of ${character.name} is included with this request.`;
            prompt += `\nPlease maintain exact visual consistency with this character's appearance shown in the reference image.`;
            prompt += `\nIMPORTANT: Match ALL visual characteristics from the reference image - appearance, style, colors, proportions, and distinctive features.`;
            prompt += `\nThe character should look identical to the reference, just in this new scene and context.`;
          }
        }
        prompt += `\n\n`;
      }
    }
    
    if (selectedElements.length > 0) {
      prompt += `## Elements in this Scene\n`;
      selectedElements.forEach(element => {
        const elementDescription = replaceMacros(element.description, macros);
        prompt += `[Object Definition: ${element.name}]\n${elementDescription}\n\n`;
      });
    }

    return prompt;
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

  // Actually perform the image generation with the selected model
  const performImageGeneration = async (modelName: string) => {
    // Store the selected model for potential retry
    lastSelectedModel.current = modelName;
    
    // Get the active book to retrieve aspect ratio and panel config
    const activeBookId = await BookService.getActiveBookId();
    const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
    const aspectRatio = activeBook?.aspectRatio || '3:4';
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

    const prompt = await generatePrompt();
    
    // Load character reference images
    console.log('Loading character reference images...');
    const referenceImages = await loadCharacterImages();
    if (referenceImages.length > 0) {
      console.log(`✓ ${referenceImages.length} reference image(s) loaded`);
    }
    
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);

    try {
      const result = await ImageGenerationService.generateImage({ 
        prompt,
        aspectRatio,
        model: modelName,  // Use the selected model
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined // Include reference images if available
      });
      
      if (result.success && result.imageUrl) {
        let finalImageUrl = result.imageUrl;
        
        // Calculate image dimensions based on aspect ratio
        const imageDimensions = getImageDimensionsFromAspectRatio(aspectRatio);
        
        // Apply overlays (text and/or diagram) if present
        const hasTextPanel = textPanel && textPanel.trim();
        const hasDiagramPanel = currentScene?.diagramPanel;
        
        if (hasTextPanel || hasDiagramPanel) {
          try {
            const overlayOptions: any = {
              imageWidth: imageDimensions.width,
              imageHeight: imageDimensions.height
            };
            
            // Add text panel if present
            if (hasTextPanel) {
              // Define macros for text panel replacement
              const macros = {
                'SceneDescription': currentScene?.description || ''
              };
              
              // Replace macros in the text panel
              const panelText = replaceMacros(textPanel, macros);
              
              // Get panel config from book or use defaults
              const panelConfig = activeBook?.style?.panelConfig || DEFAULT_PANEL_CONFIG;
              
              overlayOptions.textPanel = {
                text: panelText,
                config: panelConfig
              };
            }
            
            // Add diagram panel if present
            if (hasDiagramPanel && story?.diagramStyle) {
              overlayOptions.diagramPanel = {
                panel: currentScene.diagramPanel,
                style: story.diagramStyle
              };
            }
            
            // Apply all overlays
            finalImageUrl = await applyAllOverlays(
              result.imageUrl,
              overlayOptions
            );
          } catch (overlayError) {
            console.error('Error applying overlays:', overlayError);
            // Continue with original image if overlay fails
            setSnackbarMessage('Warning: Overlay failed, showing original image');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        }
        
        setGeneratedImageUrl(finalImageUrl);
        
        // Save generated image to scene in local storage
        if (story && currentScene) {
          const activeBookData = await BookService.getActiveBookData();
          if (activeBookData) {
            // Create new GeneratedImage entry with the model that was used
            // NOTE: We do NOT store the URL in localStorage to avoid quota issues
            // The URL is only stored in IndexedDB and loaded on demand
            const imageId = crypto.randomUUID();
            const newGeneratedImage = {
              id: imageId,
              // url is omitted - not stored in localStorage anymore
              modelName: modelName,
              timestamp: new Date()
            };
            
            // Store image in IndexedDB for persistence
            ImageStorageService.storeImage(
              imageId,
              currentScene.id,
              finalImageUrl,
              modelName
            ).catch(error => {
              console.error('Failed to store image in IndexedDB:', error);
              // This is critical - without IndexedDB storage, image will be lost on refresh
            });
            
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
        const autoSaveEnabled = SettingsService.isAutoSaveEnabled();
        
        if (autoSaveEnabled && story && currentScene) {
          const activeBookId = await BookService.getActiveBookId();
          const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
          
          if (activeBook) {
            const saveResult = await FileSystemService.saveImage(
              result.imageUrl,
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
      } else {
        // Show error in dialog instead of snackbar
        setErrorDialogMessage(result.error || 'Failed to generate image');
        setErrorDialogOpen(true);
      }
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
        
        {!story?.diagramStyle && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Note: Diagram style (colors, position, board type) needs to be configured at the story level. 
            The diagram will use default blackboard style.
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

      {/* Character Selection */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon color="primary" />
            <Typography variant="h6">
              Characters in this Scene ({selectedCharacters.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth>
            <InputLabel>Select Characters</InputLabel>
            <Select
              multiple
              value={selectedCharacters}
              onChange={handleCharacterSelection}
              input={<OutlinedInput label="Select Characters" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((characterId) => {
                    const character = availableCharacters.find(c => c.id === characterId);
                    return character ? (
                      <Chip 
                        key={characterId} 
                        label={character.name} 
                        size="small" 
                        color="primary"
                        variant="filled"
                      />
                    ) : (
                      <Chip 
                        key={characterId} 
                        label={`Unknown (${characterId.slice(0, 8)}...)`} 
                        size="small" 
                        color="error"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {availableCharacters.map((character: any) => (
                <MenuItem key={character.name} value={character.name}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">{character.name}</Typography>
                      {character.isBookLevel && (
                        <Chip 
                          label="Book" 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {character.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Selected Characters Summary */}
          {selectedCharacters.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Selected Characters:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedCharacters.map((characterId) => {
                  const character = availableCharacters.find(c => c.id === characterId);
                  return character ? (
                    <Chip
                      key={characterId}
                      label={character.name}
                      size="small"
                      color="primary"
                      variant="outlined"
                      onDelete={() => {
                        const newSelection = selectedCharacters.filter(id => id !== characterId);
                        setSelectedCharacters(newSelection);
                        updateSceneCharacterIds(newSelection);
                      }}
                    />
                  ) : (
                    <Chip
                      key={characterId}
                      label={`Unknown (${characterId.slice(0, 8)}...)`}
                      size="small"
                      color="error"
                      variant="outlined"
                      onDelete={() => {
                        const newSelection = selectedCharacters.filter(id => id !== characterId);
                        setSelectedCharacters(newSelection);
                        updateSceneCharacterIds(newSelection);
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
          
          {availableCharacters.length === 0 && (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary">
                No characters available. Add characters to the story's cast first.
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Element Selection */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">
              Elements in this Scene ({selectedElements.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth>
            <InputLabel>Select Elements</InputLabel>
            <Select
              multiple
              value={selectedElements}
              onChange={handleElementSelection}
              input={<OutlinedInput label="Select Elements" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((elementId) => {
                    const element = availableElements.find(e => e.id === elementId);
                    return element ? (
                      <Chip 
                        key={elementId} 
                        label={element.name} 
                        size="small" 
                        color="secondary"
                        variant="filled"
                      />
                    ) : (
                      <Chip 
                        key={elementId} 
                        label={`Unknown (${elementId.slice(0, 8)}...)`} 
                        size="small" 
                        color="error"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {availableElements.map((element) => (
                <MenuItem key={element.id} value={element.id}>
                  <Box>
                    <Typography variant="body1">{element.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {element.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Selected Elements Summary */}
          {selectedElements.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="secondary" gutterBottom>
                Selected Elements:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {selectedElements.map((elementId) => {
                  const element = availableElements.find(e => e.id === elementId);
                  return element ? (
                    <Chip
                      key={elementId}
                      label={element.name}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      onDelete={() => {
                        const newSelection = selectedElements.filter(id => id !== elementId);
                        setSelectedElements(newSelection);
                        updateSceneElementIds(newSelection);
                      }}
                    />
                  ) : (
                    <Chip
                      key={elementId}
                      label={`Unknown (${elementId.slice(0, 8)}...)`}
                      size="small"
                      color="error"
                      variant="outlined"
                      onDelete={() => {
                        const newSelection = selectedElements.filter(id => id !== elementId);
                        setSelectedElements(newSelection);
                        updateSceneElementIds(newSelection);
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
          
          {availableElements.length === 0 && (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary">
                No elements available. Add elements to the story's elements first.
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

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
            onClick={() => {
              setTextFitDialogOpen(false);
              // Force generation with clipped text using last selected model or default
              const modelToUse = lastSelectedModel.current || SettingsService.getImageGenerationModel();
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
      </Box>
    </Paper>
  );
}; 