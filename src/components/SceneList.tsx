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
import type { Scene } from '../types/Story';
import { StoryService } from '../services/StoryService';

interface SceneListProps {
  selectedSceneId?: string;
  onSceneSelect: (scene: Scene) => void;
  onScenesChange: () => void;
}

export const SceneList: React.FC<SceneListProps> = ({
  selectedSceneId,
  onSceneSelect,
  onScenesChange
}) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [sceneTitle, setSceneTitle] = useState('');
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadScenes();
  }, []);

  const loadScenes = () => {
    const data = StoryService.getStoryData();
    setScenes(data.scenes);
  };

  const handleAddScene = () => {
    setEditingScene(null);
    setSceneTitle('');
    setOpenDialog(true);
  };

  const handleEditScene = (scene: Scene) => {
    setEditingScene(scene);
    setSceneTitle(scene.title);
    setOpenDialog(true);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (window.confirm('Are you sure you want to delete this scene?')) {
      StoryService.deleteScene(sceneId);
      loadScenes();
      onScenesChange();
    }
  };

  const handleSaveScene = () => {
    if (sceneTitle.trim()) {
      if (editingScene) {
        StoryService.updateScene(editingScene.id, { title: sceneTitle.trim() });
      } else {
        StoryService.createScene(sceneTitle.trim());
      }
      setOpenDialog(false);
      loadScenes();
      onScenesChange();
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

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
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
          {scenes.map((scene) => (
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
                      {scene.characters.length} characters • {scene.scenes.length} sub-scenes
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
                  {scene.characters.length > 0 && (
                    <Box mb={1}>
                      <Typography variant="subtitle2" color="primary">
                        Characters:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {scene.characters.map((character) => (
                          <Chip
                            key={character.id}
                            label={character.name}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {scene.scenes.length > 0 && (
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
          ))}
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