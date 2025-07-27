import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Snackbar, Alert } from '@mui/material';
import type { Scene, Story, SceneItem } from '../types/Story';
import { StoryService } from '../services/StoryService';

interface SceneEditorProps {
  story: Story | null;
  selectedScene: Scene | null;
  onStoryUpdate: () => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({ story, selectedScene, onStoryUpdate }) => {
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [sceneItems, setSceneItems] = useState<SceneItem[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [openSceneItemDialog, setOpenSceneItemDialog] = useState(false);
  const [editingSceneItem, setEditingSceneItem] = useState<SceneItem | null>(null);
  const [sceneItemTitle, setSceneItemTitle] = useState('');
  const [sceneItemDescription, setSceneItemDescription] = useState('');

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (selectedScene) {
      setCurrentScene(selectedScene);
      setSceneItems(selectedScene.scenes);
      setSelectedCharacters(selectedScene.characterIds);
    } else {
      setCurrentScene(null);
      setSceneItems([]);
      setSelectedCharacters([]);
    }
  }, [selectedScene]);

  const handleAddSceneItem = () => {
    setEditingSceneItem(null);
    setSceneItemTitle('');
    setSceneItemDescription('');
    setOpenSceneItemDialog(true);
  };

  const handleEditSceneItem = (sceneItem: SceneItem) => {
    setEditingSceneItem(sceneItem);
    setSceneItemTitle(sceneItem.title);
    setSceneItemDescription(sceneItem.description);
    setOpenSceneItemDialog(true);
  };

  const handleDeleteSceneItem = (sceneItemId: string) => {
    if (!story || !currentScene) return;
    if (window.confirm('Are you sure you want to delete this scene item?')) {
      StoryService.deleteSceneItem(story.id, currentScene.id, sceneItemId);
      const updatedStory = StoryService.getStoryById(story.id);
      if (updatedStory) {
        const updatedScene = updatedStory.scenes.find(s => s.id === currentScene.id);
        if (updatedScene) {
          setCurrentScene(updatedScene);
          setSceneItems(updatedScene.scenes);
          onStoryUpdate();
        }
      }
    }
  };

  const handleSaveSceneItem = () => {
    if (!story || !currentScene || !sceneItemTitle.trim()) return;

    if (editingSceneItem) {
      StoryService.updateSceneItem(story.id, currentScene.id, editingSceneItem.id, {
        title: sceneItemTitle.trim(),
        description: sceneItemDescription.trim()
      });
    } else {
      StoryService.addSceneItem(story.id, currentScene.id, sceneItemTitle.trim(), sceneItemDescription.trim());
    }

    setOpenSceneItemDialog(false);
    const updatedStory = StoryService.getStoryById(story.id);
    if (updatedStory) {
      const updatedScene = updatedStory.scenes.find(s => s.id === currentScene.id);
      if (updatedScene) {
        setCurrentScene(updatedScene);
        setSceneItems(updatedScene.scenes);
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
    <Paper elevation={2} sx={{ p: 3, height: 'fit-content', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
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

      <Typography variant="body1" color="text.secondary" mb={3}>
        {currentScene.description}
      </Typography>

      {/* Debug Information (temporary) */}
      <Box mb={2} p={1} bgcolor="grey.100" borderRadius={1}>
        <Typography variant="caption" color="text.secondary">
          Debug: Available characters: {availableCharacters.length}, Selected: {selectedCharacters.length}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Available IDs: {availableCharacters.map(c => c.id.slice(0, 8)).join(', ')}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Selected IDs: {selectedCharacters.map(id => id.slice(0, 8)).join(', ')}
        </Typography>
        <Button 
          size="small" 
          variant="outlined" 
          onClick={() => {
            // Clear invalid character IDs
            const validCharacterIds = selectedCharacters.filter(id => 
              availableCharacters.some(char => char.id === id)
            );
            if (validCharacterIds.length !== selectedCharacters.length) {
              setSelectedCharacters(validCharacterIds);
              // Update the scene
              if (story && currentScene) {
                const updatedStory = { ...story };
                const sceneIndex = updatedStory.scenes.findIndex(s => s.id === currentScene.id);
                if (sceneIndex !== -1) {
                  updatedStory.scenes[sceneIndex] = {
                    ...updatedStory.scenes[sceneIndex],
                    characterIds: validCharacterIds,
                    updatedAt: new Date()
                  };
                  updatedStory.updatedAt = new Date();
                  StoryService.updateStory(story.id, updatedStory);
                  onStoryUpdate();
                }
              }
            }
          }}
          sx={{ mt: 1 }}
        >
          Fix Invalid Character IDs
        </Button>
      </Box>

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

      {/* Scene Items */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Scene Elements ({sceneItems.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {sceneItems.length === 0 ? (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary" mb={2}>
                No scene elements yet
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddSceneItem}
              >
                Add Scene Element
              </Button>
            </Box>
          ) : (
            <Box>
              {sceneItems.map((sceneItem) => (
                <Box
                  key={sceneItem.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      {sceneItem.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {sceneItem.description}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Edit scene element">
                      <IconButton
                        onClick={() => handleEditSceneItem(sceneItem)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete scene element">
                      <IconButton
                        onClick={() => handleDeleteSceneItem(sceneItem.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddSceneItem}
                fullWidth
              >
                Add Scene Element
              </Button>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Scene Item Dialog */}
      <Dialog open={openSceneItemDialog} onClose={() => setOpenSceneItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSceneItem ? 'Edit Scene Element' : 'Add Scene Element'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={sceneItemTitle}
            onChange={(e) => setSceneItemTitle(e.target.value)}
            placeholder="Enter scene element title..."
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={sceneItemDescription}
            onChange={(e) => setSceneItemDescription(e.target.value)}
            placeholder="Describe this scene element..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSceneItemDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSceneItem} variant="contained" disabled={!sceneItemTitle.trim()}>
            {editingSceneItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
}; 