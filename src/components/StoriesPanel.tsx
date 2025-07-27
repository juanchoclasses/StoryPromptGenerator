import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  IconButton,
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
  Book as BookIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import type { Story } from '../types/Story';
import { StoryService } from '../services/StoryService';

interface StoriesPanelProps {
  selectedStoryId?: string;
  onStorySelect: (story: Story) => void;
  onStoriesChange: () => void;
}

export const StoriesPanel: React.FC<StoriesPanelProps> = ({
  selectedStoryId,
  onStorySelect,
  onStoriesChange
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [storyTitle, setStoryTitle] = useState('');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = () => {
    const allStories = StoryService.getAllStories();
    setStories(allStories);
  };

  const handleAddStory = () => {
    setEditingStory(null);
    setStoryTitle('');
    setOpenDialog(true);
  };

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setStoryTitle(story.title);
    setOpenDialog(true);
  };

  const handleDeleteStory = (storyId: string) => {
    if (window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      StoryService.deleteStory(storyId);
      loadStories();
      onStoriesChange();
    }
  };

  const handleSaveStory = () => {
    if (storyTitle.trim()) {
      if (editingStory) {
        StoryService.updateStory(editingStory.id, { title: storyTitle.trim() });
      } else {
        const newStory = StoryService.createStory(storyTitle.trim());
        onStorySelect(newStory);
      }
      setOpenDialog(false);
      loadStories();
      onStoriesChange();
    }
  };

  const getStoryStats = (story: Story) => {
    const totalScenes = story.scenes?.length || 0;
    const totalCharacters = story.cast?.length || 0;
    const totalSceneItems = story.scenes?.reduce((sum, scene) => sum + (scene.scenes?.length || 0), 0) || 0;
    
    return { totalScenes, totalCharacters, totalSceneItems };
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <BookIcon color="primary" />
          <Typography variant="h5" component="h2">
            Stories
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddStory}
        >
          New Story
        </Button>
      </Box>

      {stories.length === 0 ? (
        <Box textAlign="center" py={4}>
          <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No stories yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first story to get started
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddStory}
          >
            Create Your First Story
          </Button>
        </Box>
      ) : (
        <List>
          {stories.map((story) => {
            if (!story || !story.id) return null;
            const stats = getStoryStats(story);
            return (
              <Box key={story.id}>
                <Box
                  onClick={() => onStorySelect(story)}
                  sx={{
                    border: 1,
                    borderColor: selectedStoryId === story.id ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    mb: 1,
                    p: 2,
                    cursor: 'pointer',
                    backgroundColor: selectedStoryId === story.id ? 'primary.light' : 'background.paper',
                    '&:hover': {
                      backgroundColor: selectedStoryId === story.id ? 'primary.light' : 'action.hover',
                    },
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="h6" component="h3">
                          {story.title}
                        </Typography>
                        {story.backgroundSetup && (
                          <Chip
                            label="Has Background"
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Box display="flex" gap={2} mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          {stats.totalScenes} scenes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stats.totalCharacters} characters
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stats.totalSceneItems} sub-scenes
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Updated: {story.updatedAt.toLocaleDateString()} at {story.updatedAt.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Tooltip title="Edit story">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStory(story);
                          }}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete story">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStory(story.id);
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
              </Box>
            );
          })}
        </List>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStory ? 'Edit Story' : 'Create New Story'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Story Title"
            fullWidth
            variant="outlined"
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder="Enter story title..."
            helperText="Give your story a descriptive title"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveStory} variant="contained" disabled={!storyTitle.trim()}>
            {editingStory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}; 