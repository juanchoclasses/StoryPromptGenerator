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
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import type { Scene, Story } from '../types/Story';
import { StoryService } from '../services/StoryService';

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

  const handleEditScene = (scene: Scene) => {
    setEditingScene(scene);
    setSceneTitle(scene.title);
    setSceneDescription(scene.description);
    setOpenDialog(true);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (!story) return;
    if (window.confirm('Are you sure you want to delete this scene?')) {
      StoryService.deleteScene(story.id, sceneId);
      const updatedStory = StoryService.getStoryById(story.id);
      if (updatedStory) {
        setScenes(updatedStory.scenes);
        onStoryUpdate();
      }
    }
  };

  const handleSaveScene = () => {
    if (!story || !sceneTitle.trim()) return;

    if (editingScene) {
      StoryService.updateScene(story.id, editingScene.id, { 
        title: sceneTitle.trim(), 
        description: sceneDescription.trim() 
      });
    } else {
      StoryService.createScene(story.id, sceneTitle.trim(), sceneDescription.trim());
    }
    
    setOpenDialog(false);
    const updatedStory = StoryService.getStoryById(story.id);
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
            <Box key={scene.id}>
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
                      {scene.characterIds?.length || 0} characters • {scene.scenes?.length || 0} sub-scenes
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updated: {scene.updatedAt.toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
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
                    <Tooltip title="Edit scene">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditScene(scene);
                        }}
                        size="small"
                      >
                        <EditIcon />
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
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
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
                          const character = story.cast.find(c => c.id === characterId);
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
                  
                  {scene.scenes && scene.scenes.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="primary">
                        Sub-scenes:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {scene.scenes.map((sceneItem) => (
                          <Chip
                            key={sceneItem.id}
                            label={sceneItem.title}
                            size="small"
                            variant="outlined"
                          />
                        ))}
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