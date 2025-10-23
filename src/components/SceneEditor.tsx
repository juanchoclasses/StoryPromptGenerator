import React, { useState, useEffect } from 'react';
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
  Card,
  CardMedia,
  CardActions,
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
  Save as SaveIcon,
  Code as CodeIcon,
  TextFields as TextFieldsIcon
} from '@mui/icons-material';
import type { Scene, Story } from '../types/Story';
import { BookService } from '../services/BookService';
import { ImageGenerationService } from '../services/ImageGenerationService';
import { FileSystemService } from '../services/FileSystemService';
import { SettingsService } from '../services/SettingsService';
import { overlayTextOnImage } from '../services/OverlayService';
import { DEFAULT_PANEL_CONFIG } from '../types/Book';
import { measureTextFit } from '../services/TextMeasurementService';

interface SceneEditorProps {
  story: Story | null;
  selectedScene: Scene | null;
  onStoryUpdate: () => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({ story, selectedScene, onStoryUpdate }) => {
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [sceneTitle, setSceneTitle] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [textPanel, setTextPanel] = useState('');

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
  
  const textPanelFieldRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedScene) {
      setCurrentScene(selectedScene);
      setSelectedCharacters(selectedScene.characterIds);
      setSelectedElements(selectedScene.elementIds || []);
      setSceneTitle(selectedScene.title);
      setSceneDescription(selectedScene.description || '');
      setTextPanel(selectedScene.textPanel || '');
      setGeneratedImageUrl(selectedScene.lastGeneratedImage || null); // Load saved image or clear
    } else {
      setCurrentScene(null);
      setSelectedCharacters([]);
      setSelectedElements([]);
      setSceneTitle('');
      setSceneDescription('');
      setTextPanel('');
      setGeneratedImageUrl(null);
    }
  }, [selectedScene]);

  const handleSceneTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    setSceneTitle(newTitle);
    
    // Auto-save the scene title
    if (story && currentScene) {
      const activeBookData = BookService.getActiveBookData();
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
      BookService.saveActiveBookData(updatedData);
      onStoryUpdate();
    }
  };

  const handleSceneDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = event.target.value;
    setSceneDescription(newDescription);
    
    // Auto-save the scene description
    if (story && currentScene) {
      const activeBookData = BookService.getActiveBookData();
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
      BookService.saveActiveBookData(updatedData);
      onStoryUpdate();
    }
  };

  const handleTextPanelChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTextPanel = event.target.value;
    setTextPanel(newTextPanel);
    
    // Auto-save the text panel
    if (story && currentScene) {
      const activeBookData = BookService.getActiveBookData();
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
      BookService.saveActiveBookData(updatedData);
      onStoryUpdate();
    }
  };

  const insertMacroToTextPanel = (macro: string) => {
    const textarea = textPanelFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textPanel;
    
    const newText = text.substring(0, start) + macro + text.substring(end);
    setTextPanel(newText);
    
    // Trigger auto-save
    if (story && currentScene) {
      const activeBookData = BookService.getActiveBookData();
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
      BookService.saveActiveBookData(updatedData);
      onStoryUpdate();
    }
    
    // Set cursor position after the inserted macro
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + macro.length, start + macro.length);
    }, 0);
  };

  const handleCharacterSelection = (event: SelectChangeEvent<string[]>) => {
    if (!story || !currentScene) return;
    
    const value = event.target.value;
    const characterIds = typeof value === 'string' ? value.split(',') : value;
    setSelectedCharacters(characterIds);
    
    // Update the scene's character IDs by updating the book data
    const activeBookData = BookService.getActiveBookData();
    if (!activeBookData) return;
    
    const updatedStories = activeBookData.stories.map(s => {
      if (s.id === story.id) {
        const updatedScenes = s.scenes.map(scene => {
          if (scene.id === currentScene.id) {
            return { ...scene, characterIds: characterIds, updatedAt: new Date() };
          }
          return scene;
        });
        return { ...s, scenes: updatedScenes, updatedAt: new Date() };
      }
      return s;
    });
    
    const updatedData = { ...activeBookData, stories: updatedStories };
    BookService.saveActiveBookData(updatedData);
    
    // Trigger update
    onStoryUpdate();
  };

  const handleElementSelection = (event: SelectChangeEvent<string[]>) => {
    if (!story || !currentScene) return;
    
    const value = event.target.value;
    const elementIds = typeof value === 'string' ? value.split(',') : value;
    setSelectedElements(elementIds);
    
    // Update the scene's element IDs by updating the book data
    const activeBookData = BookService.getActiveBookData();
    if (!activeBookData) return;
    
    const updatedStories = activeBookData.stories.map(s => {
      if (s.id === story.id) {
        const updatedScenes = s.scenes.map(scene => {
          if (scene.id === currentScene.id) {
            return { ...scene, elementIds: elementIds, updatedAt: new Date() };
          }
          return scene;
        });
        return { ...s, scenes: updatedScenes, updatedAt: new Date() };
      }
      return s;
    });
    
    const updatedData = { ...activeBookData, stories: updatedStories };
    BookService.saveActiveBookData(updatedData);
    
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

  // Convert aspect ratio string to dimensions (assumes 1024px base for longest side)
  const getImageDimensionsFromAspectRatio = (aspectRatio: string): { width: number; height: number } => {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
    
    if (!widthRatio || !heightRatio) {
      return { width: 768, height: 1024 }; // Default to 3:4
    }
    
    // Use 1024 as the base for the longer dimension
    if (widthRatio > heightRatio) {
      // Landscape
      return {
        width: 1024,
        height: Math.round((1024 * heightRatio) / widthRatio)
      };
    } else if (heightRatio > widthRatio) {
      // Portrait
      return {
        width: Math.round((1024 * widthRatio) / heightRatio),
        height: 1024
      };
    } else {
      // Square
      return { width: 1024, height: 1024 };
    }
  };

  const generatePrompt = () => {
    if (!story || !currentScene) return '';

    const selectedCast = availableCharacters.filter(char => currentScene.characterIds.includes(char.id));
    const selectedElements = availableElements.filter(elem => (currentScene.elementIds || []).includes(elem.id));
    
    // Get the active book information
    const bookCollection = BookService.getBookCollection();
    const activeBookId = BookService.getActiveBookId();
    const activeBook = activeBookId ? bookCollection.books.find(book => book.id === activeBookId) : null;
    
    // Define available macros
    const macros = {
      'SceneDescription': currentScene.description || ''
    };
    
    let prompt = `Create an illustration in the whimsical Dr. Seuss style with the following requirements:

STYLE DIRECTIVES:
- Use vibrant, playful cartoon characters with exaggerated features
- Apply a soft, cheerful color palette typical of children's books
- Include clear, bold outlines around all elements
- Render in detailed 2D art style with a hand-drawn feel
- Emphasize whimsy and imagination in the composition

TECHNICAL REQUIREMENTS:
- Aspect ratio: 3:4 (portrait orientation for booklet printing)
- Do NOT include any text, titles, or labels in the image
- Focus solely on visual storytelling

SCENE CONTENT:
`;
    
    if (activeBook?.description) {
      prompt += `\n## Book Context\n${activeBook.description}\n\n`;
    }
    
    prompt += `## Background Setup\n${story.backgroundSetup}\n\n`;
    prompt += `## Scene Description\n${currentScene.description}\n\n`;
    
    if (selectedCast.length > 0) {
      prompt += `## Characters in this Scene\n`;
      selectedCast.forEach(character => {
        const characterDescription = replaceMacros(character.description, macros);
        prompt += `[Character Definition: ${character.name}]\n${characterDescription}\n\n`;
      });
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

  const updateSceneCharacterIds = (newCharacterIds: string[]) => {
    if (story && currentScene) {
      const activeBookData = BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(scene => {
            if (scene.id === currentScene.id) {
              return { ...scene, characterIds: newCharacterIds, updatedAt: new Date() };
            }
            return scene;
          });
          return { ...s, scenes: updatedScenes, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      BookService.saveActiveBookData(updatedData);
      onStoryUpdate();
    }
  };

  const updateSceneElementIds = (newElementIds: string[]) => {
    if (story && currentScene) {
      const activeBookData = BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(scene => {
            if (scene.id === currentScene.id) {
              return { ...scene, elementIds: newElementIds, updatedAt: new Date() };
            }
            return scene;
          });
          return { ...s, scenes: updatedScenes, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      BookService.saveActiveBookData(updatedData);
      onStoryUpdate();
    }
  };

  const handleCopyPrompt = async () => {
    const prompt = generatePrompt();
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

  const handleGenerateImage = async () => {
    // Get the active book to retrieve aspect ratio and panel config
    const bookCollection = BookService.getBookCollection();
    const activeBookId = BookService.getActiveBookId();
    const activeBook = activeBookId ? bookCollection.books.find(book => book.id === activeBookId) : null;
    const aspectRatio = activeBook?.aspectRatio || '3:4';
    const panelConfig = activeBook?.panelConfig || DEFAULT_PANEL_CONFIG;

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

    const prompt = generatePrompt();
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);

    try {
      const result = await ImageGenerationService.generateImage({ 
        prompt,
        aspectRatio 
      });
      
      if (result.success && result.imageUrl) {
        let finalImageUrl = result.imageUrl;
        
        // Apply text overlay if textPanel has content
        if (textPanel && textPanel.trim()) {
          try {
            // Define macros for text panel replacement
            const macros = {
              'SceneDescription': currentScene?.description || ''
            };
            
            // Replace macros in the text panel
            const panelText = replaceMacros(textPanel, macros);
            
            // Calculate image dimensions based on aspect ratio
            const imageDimensions = getImageDimensionsFromAspectRatio(aspectRatio);
            
            // Get panel config from book or use defaults
            const panelConfig = activeBook?.panelConfig || DEFAULT_PANEL_CONFIG;
            
            // Overlay text onto image with book's panel configuration
            finalImageUrl = await overlayTextOnImage(
              result.imageUrl,
              panelText,
              imageDimensions.width,
              imageDimensions.height,
              panelConfig
            );
          } catch (overlayError) {
            console.error('Error overlaying text:', overlayError);
            // Continue with original image if overlay fails
            setSnackbarMessage('Warning: Text overlay failed, showing original image');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        }
        
        setGeneratedImageUrl(finalImageUrl);
        
        // Save generated image to scene in local storage
        if (story && currentScene) {
          const activeBookData = BookService.getActiveBookData();
          if (activeBookData) {
            const updatedStories = activeBookData.stories.map(s => {
              if (s.id === story.id) {
                const updatedScenes = s.scenes.map(scene => {
                  if (scene.id === currentScene.id) {
                    return { ...scene, lastGeneratedImage: finalImageUrl, updatedAt: new Date() };
                  }
                  return scene;
                });
                return { ...s, scenes: updatedScenes, updatedAt: new Date() };
              }
              return s;
            });
            
            const updatedData = { ...activeBookData, stories: updatedStories };
            BookService.saveActiveBookData(updatedData);
          }
        }
        
        // Auto-save to file system if enabled and directory is configured
        const autoSaveEnabled = SettingsService.isAutoSaveEnabled();
        
        if (autoSaveEnabled && story && currentScene) {
          const bookCollection = BookService.getBookCollection();
          const activeBookId = BookService.getActiveBookId();
          const activeBook = activeBookId ? bookCollection.books.find(book => book.id === activeBookId) : null;
          
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

  const handleSaveImage = async () => {
    if (!generatedImageUrl || !story || !currentScene) return;
    
    // Try to save to configured directory first
    const bookCollection = BookService.getBookCollection();
    const activeBookId = BookService.getActiveBookId();
    const activeBook = activeBookId ? bookCollection.books.find(book => book.id === activeBookId) : null;
    
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
  };

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

      const activeBookData = BookService.getActiveBookData();
    const availableCharacters = activeBookData?.characters || [];
    const availableElements = activeBookData?.elements || [];

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
              {availableCharacters.map((character) => (
                <MenuItem key={character.id} value={character.id}>
                  <Box>
                    <Typography variant="body1">{character.name}</Typography>
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

      {/* Generated Image Display */}
      {generatedImageUrl && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Generated Image
          </Typography>
          <Card>
            <CardMedia
              component="img"
              image={generatedImageUrl}
              alt="Generated scene image"
              sx={{ 
                maxHeight: 600, 
                objectFit: 'contain',
                backgroundColor: '#f5f5f5'
              }}
            />
            <CardActions>
              <Button
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSaveImage}
                variant="contained"
              >
                Save Image
              </Button>
              <Button
                size="small"
                onClick={() => setGeneratedImageUrl(null)}
              >
                Clear
              </Button>
            </CardActions>
          </Card>
        </Box>
      )}

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
            onClick={() => {
              setTextFitDialogOpen(false);
              // Navigate to file manager to edit panel config
              setSnackbarMessage('Please adjust panel height in Book Settings or enable Auto Height');
              setSnackbarSeverity('success');
              setSnackbarOpen(true);
            }}
            color="primary"
          >
            Adjust Settings
          </Button>
          <Button
            onClick={() => {
              setTextFitDialogOpen(false);
              // Force generation with clipped text
              handleGenerateImage();
            }}
            variant="contained"
            color="warning"
          >
            Generate Anyway
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Paper>
  );
}; 