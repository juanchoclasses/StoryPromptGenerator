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
  Alert
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import type { Scene, Story } from '../types/Story';
import { StoryService } from '../services/StoryService';

interface SceneEditorProps {
  story: Story | null;
  selectedScene: Scene | null;
  onStoryUpdate: () => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({ story, selectedScene, onStoryUpdate }) => {
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [sceneDescription, setSceneDescription] = useState('');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (selectedScene) {
      setCurrentScene(selectedScene);
      setSelectedCharacters(selectedScene.characterIds);
      setSceneDescription(selectedScene.description || '');
    } else {
      setCurrentScene(null);
      setSelectedCharacters([]);
      setSceneDescription('');
    }
  }, [selectedScene]);

  const handleSceneDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = event.target.value;
    setSceneDescription(newDescription);
    
    // Auto-save the scene description
    if (story && currentScene) {
      const updatedStory = { ...story };
      const sceneIndex = updatedStory.scenes.findIndex(s => s.id === currentScene.id);
      if (sceneIndex !== -1) {
        updatedStory.scenes[sceneIndex] = {
          ...updatedStory.scenes[sceneIndex],
          description: newDescription,
          updatedAt: new Date()
        };
        updatedStory.updatedAt = new Date();
        StoryService.updateStory(story.id, updatedStory);
        onStoryUpdate();
      }
    }
  };

  const handleCharacterSelection = (event: SelectChangeEvent<string[]>) => {
    if (!story || !currentScene) return;
    
    const value = event.target.value;
    const characterIds = typeof value === 'string' ? value.split(',') : value;
    setSelectedCharacters(characterIds);
    
    // Update the scene's character IDs by updating the story
    const updatedStory = { ...story };
    const sceneIndex = updatedStory.scenes.findIndex(s => s.id === currentScene.id);
    if (sceneIndex !== -1) {
      updatedStory.scenes[sceneIndex] = {
        ...updatedStory.scenes[sceneIndex],
        characterIds: characterIds,
        updatedAt: new Date()
      };
      updatedStory.updatedAt = new Date();
      
      // Update the story through the service
      StoryService.updateStory(story.id, updatedStory);
      
      // Trigger update
      onStoryUpdate();
    }
  };

  const generatePrompt = () => {
    if (!story || !currentScene) return '';

    const selectedCast = story.cast.filter(char => currentScene.characterIds.includes(char.id));
    
    let prompt = `# Story Prompt\n\n`;
    prompt += `## Background Setup\n${story.backgroundSetup}\n\n`;
    prompt += `## Scene: ${currentScene.title}\n`;
    prompt += `${currentScene.description}\n\n`;
    
    if (selectedCast.length > 0) {
      prompt += `## Characters in this Scene\n`;
      selectedCast.forEach(character => {
        prompt += `### ${character.name}\n${character.description}\n\n`;
      });
    }
    
    if (currentScene.scenes.length > 0) {
      prompt += `## Scene Elements\n`;
      currentScene.scenes.forEach((sceneItem, index) => {
        prompt += `${index + 1}. **${sceneItem.title}**: ${sceneItem.description}\n`;
      });
    }

    return prompt;
  };

  const handleCopyPrompt = async () => {
    const prompt = generatePrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setSnackbarMessage('Prompt copied to clipboard!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      setSnackbarMessage('Failed to copy prompt');
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

  const availableCharacters = story.cast;

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
            <Typography variant="h5" component="h2">
              Scene: {currentScene.title}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CopyIcon />}
            onClick={handleCopyPrompt}
          >
            Get Prompt
          </Button>
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
                        // Update the scene's character IDs
                        if (story && currentScene) {
                          const updatedStory = StoryService.getStoryById(story.id);
                          if (updatedStory) {
                            const sceneIndex = updatedStory.scenes.findIndex(s => s.id === currentScene.id);
                            if (sceneIndex !== -1) {
                              updatedStory.scenes[sceneIndex].characterIds = newSelection;
                              updatedStory.scenes[sceneIndex].updatedAt = new Date();
                              updatedStory.updatedAt = new Date();
                              onStoryUpdate();
                            }
                          }
                        }
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
                        // Update the scene's character IDs
                        if (story && currentScene) {
                          const updatedStory = StoryService.getStoryById(story.id);
                          if (updatedStory) {
                            const sceneIndex = updatedStory.scenes.findIndex(s => s.id === currentScene.id);
                            if (sceneIndex !== -1) {
                              updatedStory.scenes[sceneIndex].characterIds = newSelection;
                              updatedStory.scenes[sceneIndex].updatedAt = new Date();
                              updatedStory.updatedAt = new Date();
                              onStoryUpdate();
                            }
                          }
                        }
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



      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
      </Box>
    </Paper>
  );
}; 