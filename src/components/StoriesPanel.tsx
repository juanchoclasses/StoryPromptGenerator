import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { BookService } from '../services/BookService';
import { ImportStoryDialog } from './ImportStoryDialog';
import type { Story, StoryData } from '../types/Story';

interface StoriesPanelProps {
  selectedStory: Story | null;
  onStorySelect: (story: Story | null) => void;
  onStoryUpdate: () => void;
  onNavigateToEditor?: () => void;
}

export const StoriesPanel: React.FC<StoriesPanelProps> = ({ 
  selectedStory, 
  onStorySelect, 
  onStoryUpdate,
  onNavigateToEditor
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadStories();
  }, []);

  // Reload stories when active book changes
  useEffect(() => {
    loadStories();
  }, [BookService.getActiveBookId()]);

  const loadStories = () => {
    // Get the active book's data
    const activeBookData = BookService.getActiveBookData();
    if (activeBookData) {
      setStories(activeBookData.stories);
    } else {
      setStories([]);
    }
  };

  const handleAddStory = () => {
    setEditingStory(null);
    setStoryTitle('');
    setStoryDescription('');
    setOpenDialog(true);
  };

  const handleEditStory = (story: Story) => {
    onStorySelect(story);
    if (onNavigateToEditor) {
      onNavigateToEditor();
    }
  };

  const handleDeleteStory = (storyId: string) => {
    if (window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      const activeBookData = BookService.getActiveBookData();
      if (!activeBookData) {
        showSnackbar('No active book selected', 'error');
        return;
      }

      const updatedStories = activeBookData.stories.filter(story => story.id !== storyId);
      const updatedData = { ...activeBookData, stories: updatedStories };
      BookService.saveActiveBookData(updatedData);
      
      if (selectedStory?.id === storyId) {
        onStorySelect(null);
      }
      loadStories();
      onStoryUpdate();
      showSnackbar('Story deleted successfully', 'success');
    }
  };

  const handleSaveStory = () => {
    if (!storyTitle.trim()) return;

    const activeBookData = BookService.getActiveBookData();
    if (!activeBookData) {
      showSnackbar('No active book selected', 'error');
      return;
    }

    if (editingStory) {
      // Update existing story
      const updatedStories = activeBookData.stories.map(story => 
        story.id === editingStory.id 
          ? { ...story, title: storyTitle.trim(), description: storyDescription.trim(), updatedAt: new Date() }
          : story
      );
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      BookService.saveActiveBookData(updatedData);
      onStorySelect(updatedStories.find(s => s.id === editingStory.id) || null);
    } else {
      // Create new story
      const newStory: Story = {
        id: crypto.randomUUID(),
        title: storyTitle.trim(),
        description: storyDescription.trim(),
        backgroundSetup: '',
        scenes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedData = { 
        ...activeBookData, 
        stories: [...activeBookData.stories, newStory] 
      };
      BookService.saveActiveBookData(updatedData);
      onStorySelect(newStory);
    }

    setOpenDialog(false);
    loadStories();
    onStoryUpdate();
    showSnackbar(editingStory ? 'Story updated successfully' : 'Story created successfully', 'success');
  };

  const getStoryStats = (story: Story) => {
    if (!story.scenes) return { characters: 0, scenes: 0 };
    
    const activeBookData = BookService.getActiveBookData();
    const characters = activeBookData?.characters.length || 0;
    const scenes = story.scenes.length;

    return { characters, scenes };
  };

  const handleExportData = () => {
    try {
      const data = localStorage.getItem('story-data-v2');
      if (!data) {
        showSnackbar('No data to export', 'error');
        return;
      }
      
      const dataBlob = new Blob([data], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `story-data-v2-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      showSnackbar('Data exported successfully', 'success');
    } catch {
      showSnackbar('Failed to export data', 'error');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const data: StoryData = JSON.parse(content);
            
            // Validate the data structure
            if (!data.stories || !Array.isArray(data.stories)) {
              throw new Error('Invalid data format');
            }
            
            // Clear current data and import new data
            localStorage.setItem('story-data-v2', JSON.stringify(data));
            loadStories();
            onStoryUpdate();
            
                         showSnackbar('Data imported successfully', 'success');
           } catch {
             showSnackbar('Failed to import data. Please check the file format.', 'error');
           }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" component="h2">
          Stories
        </Typography>
        <Box>
          <Tooltip title="Export Data">
            <IconButton onClick={handleExportData} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Data">
            <IconButton onClick={handleImportData} color="primary">
              <UploadIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ ml: 1 }}
          >
            Import Story Bundle
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddStory}
            sx={{ ml: 1 }}
          >
            New Story
          </Button>
        </Box>
      </Box>

      {stories.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No stories yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Create your first story to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddStory}
          >
            Create Story
          </Button>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {stories.map((story) => {
            if (!story || !story.id) return null;
            
            const stats = getStoryStats(story);
            const isSelected = selectedStory?.id === story.id;
            
            return (
              <Paper
                key={story.id}
                elevation={isSelected ? 4 : 2}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  '&:hover': {
                    elevation: 3,
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => onStorySelect(story)}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {story.title}
                    </Typography>
                    {story.description && (
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {story.description}
                      </Typography>
                    )}
                    <Box display="flex" gap={2}>
                      <Typography variant="caption" color="text.secondary">
                        Characters: {stats.characters}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Scenes: {stats.scenes}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
        
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStory(story);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Story Dialog */}
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
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={storyDescription}
            onChange={(e) => setStoryDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveStory} variant="contained" disabled={!storyTitle.trim()}>
            {editingStory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Story Bundle Dialog */}
      <ImportStoryDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={() => {
          setSnackbarMessage('Story bundle imported successfully!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          loadStories();
          onStoryUpdate();
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 