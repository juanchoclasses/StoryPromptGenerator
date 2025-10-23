import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  IconButton,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DragIndicator as DragIndicatorIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import type { Scene, Story } from '../types/Story';
import { BookService } from '../services/BookService';

interface SceneListProps {
  story: Story | null;
  selectedSceneId?: string;
  onSceneSelect: (scene: Scene) => void;
  onStoryUpdate: () => void;
}

export const SceneList: React.FC<SceneListProps> = ({
  story,
  selectedSceneId,
  onSceneSelect,
  onStoryUpdate
}) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [sceneTitle, setSceneTitle] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);

  useEffect(() => {
    if (story) {
      setScenes(story.scenes);
    } else {
      setScenes([]);
    }
  }, [story]);

  const handleAddScene = () => {
    if (!story) return;
    setEditingScene(null);
    setSceneTitle('');
    setSceneDescription('');
    setOpenDialog(true);
  };



  const handleDeleteScene = (sceneId: string) => {
    if (!story) return;
    if (window.confirm('Are you sure you want to delete this scene?')) {
      const activeBookData = BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.filter(scene => scene.id !== sceneId);
          return { ...s, scenes: updatedScenes, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      BookService.saveActiveBookData(updatedData);
      
      // Update local state
      const updatedStory = updatedStories.find(s => s.id === story.id);
      if (updatedStory) {
        setScenes(updatedStory.scenes);
        onStoryUpdate();
      }
    }
  };

  const handleDuplicateScene = (sceneId: string) => {
    if (!story) return;
    
    const activeBookData = BookService.getActiveBookData();
    if (!activeBookData) return;
    
    const sceneToDuplicate = scenes.find(scene => scene.id === sceneId);
    if (!sceneToDuplicate) return;
    
    // Create a duplicate with a new ID
    const duplicatedScene: Scene = {
      ...sceneToDuplicate,
      id: crypto.randomUUID(),
      title: `${sceneToDuplicate.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedStories = activeBookData.stories.map(s => {
      if (s.id === story.id) {
        // Find the index of the original scene and insert the duplicate right after it
        const sceneIndex = s.scenes.findIndex(scene => scene.id === sceneId);
        const newScenes = [...s.scenes];
        newScenes.splice(sceneIndex + 1, 0, duplicatedScene);
        return { ...s, scenes: newScenes, updatedAt: new Date() };
      }
      return s;
    });
    
    const updatedData = { ...activeBookData, stories: updatedStories };
    BookService.saveActiveBookData(updatedData);
    
    // Update local state
    const updatedStory = updatedStories.find(s => s.id === story.id);
    if (updatedStory) {
      setScenes(updatedStory.scenes);
      onStoryUpdate();
    }
  };

  const handleSaveScene = () => {
    if (!story || !sceneTitle.trim()) return;

    const activeBookData = BookService.getActiveBookData();
    if (!activeBookData) return;

    if (editingScene) {
      // Update existing scene
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(scene => {
            if (scene.id === editingScene.id) {
              return { 
                ...scene, 
                title: sceneTitle.trim(), 
                description: sceneDescription.trim(),
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
      BookService.saveActiveBookData(updatedData);
    } else {
      // Create new scene
      const newScene: Scene = {
        id: crypto.randomUUID(),
        title: sceneTitle.trim(),
        description: sceneDescription.trim(),
        characterIds: [],
        elementIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          return { ...s, scenes: [...s.scenes, newScene], updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      BookService.saveActiveBookData(updatedData);
    }
    
    setOpenDialog(false);
    const updatedStory = activeBookData.stories.find(s => s.id === story.id);
    if (updatedStory) {
      setScenes(updatedStory.scenes);
      onStoryUpdate();
    }
  };

  const toggleSceneExpansion = (sceneId: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    setDraggedSceneId(sceneId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSceneId: string) => {
    e.preventDefault();
    if (!story || !draggedSceneId || draggedSceneId === targetSceneId) {
      setDraggedSceneId(null);
      return;
    }

    const draggedIndex = scenes.findIndex(scene => scene.id === draggedSceneId);
    const targetIndex = scenes.findIndex(scene => scene.id === targetSceneId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedSceneId(null);
      return;
    }

    const newScenes = [...scenes];
    const [draggedScene] = newScenes.splice(draggedIndex, 1);
    newScenes.splice(targetIndex, 0, draggedScene);

    // Update the story with the new scene order
    const activeBookData = BookService.getActiveBookData();
    if (!activeBookData) return;
    
    const updatedStories = activeBookData.stories.map(s => {
      if (s.id === story.id) {
        return { ...s, scenes: newScenes, updatedAt: new Date() };
      }
      return s;
    });
    
    const updatedData = { ...activeBookData, stories: updatedStories };
    BookService.saveActiveBookData(updatedData);
    setScenes(newScenes);
    onStoryUpdate();
    setDraggedSceneId(null);
  };

  const handleDragEnd = () => {
    setDraggedSceneId(null);
  };

  if (!story) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a story to manage scenes
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, height: 'fit-content', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" component="h2">
          Scenes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddScene}
        >
          Add Scene
        </Button>
      </Box>

      {scenes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No scenes created yet. Click "Add Scene" to get started.
        </Typography>
      ) : (
        <List>
          {scenes.map((scene) => {
            if (!scene || !scene.id) return null;
            return (
            <Box 
              key={scene.id}
              draggable
              onDragStart={(e) => handleDragStart(e, scene.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, scene.id)}
              onDragEnd={handleDragEnd}
              sx={{
                opacity: draggedSceneId === scene.id ? 0.5 : 1,
                transform: draggedSceneId === scene.id ? 'rotate(2deg)' : 'none',
                transition: 'opacity 0.2s, transform 0.2s'
              }}
            >
              <Box
                onClick={() => onSceneSelect(scene)}
                sx={{
                  border: 1,
                  borderColor: selectedSceneId === scene.id ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  mb: 1,
                  p: 2,
                  cursor: 'pointer',
                  backgroundColor: selectedSceneId === scene.id ? 'primary.light' : 'background.paper',
                  '&:hover': {
                    backgroundColor: selectedSceneId === scene.id ? 'primary.light' : 'action.hover',
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="h6" component="h3">
                      {scene.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {scene.characterIds?.length || 0} characters
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updated: {scene.updatedAt.toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="Drag to reorder">
                      <IconButton
                        size="small"
                        sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
                      >
                        <DragIndicatorIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Expand details">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSceneExpansion(scene.id);
                        }}
                        size="small"
                      >
                        {expandedScenes.has(scene.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Duplicate scene">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateScene(scene.id);
                        }}
                        size="small"
                      >
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete scene">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(scene.id);
                        }}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>

              {expandedScenes.has(scene.id) && (
                <Box ml={3} mb={2}>
                  {scene.description && (
                    <Box mb={1}>
                      <Typography variant="subtitle2" color="primary">
                        Description:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', whiteSpace: 'pre-line' }}>
                        {scene.description}
                      </Typography>
                    </Box>
                  )}
                  
                  {scene.characterIds && scene.characterIds.length > 0 && story && (
                    <Box mb={1}>
                      <Typography variant="subtitle2" color="primary">
                        Characters:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {scene.characterIds.map((characterId) => {
                          const activeBookData = BookService.getActiveBookData();
                          const allCharacters = activeBookData?.characters || [];
                          const character = allCharacters.find(c => c.id === characterId);
                          return character ? (
                            <Chip
                              key={characterId}
                              label={character.name}
                              size="small"
                              variant="outlined"
                            />
                          ) : null;
                        })}
                      </Box>
                    </Box>
                  )}
                  

                </Box>
              )}
            </Box>
          );
        })}
      </List>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingScene ? 'Edit Scene' : 'Add New Scene'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Scene Title"
            fullWidth
            variant="outlined"
            value={sceneTitle}
            onChange={(e) => setSceneTitle(e.target.value)}
            placeholder="Enter scene title..."
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Scene Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
            placeholder="Describe the scene, setting, atmosphere, and key elements..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveScene} variant="contained" disabled={!sceneTitle.trim()}>
            {editingScene ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}; 