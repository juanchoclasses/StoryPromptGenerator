import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { BookService } from '../services/BookService';
import type { Story } from '../types/Story';

interface BackgroundSetupProps {
  story: Story | null;
  onStoryUpdate: () => void;
}

export const BackgroundSetup: React.FC<BackgroundSetupProps> = ({ story, onStoryUpdate }) => {
  const [backgroundSetup, setBackgroundSetup] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (story) {
      setBackgroundSetup(story.backgroundSetup);
      setIsDirty(false);
    } else {
      setBackgroundSetup('');
      setIsDirty(false);
    }
  }, [story]);

  const handleSave = () => {
    if (story) {
      const activeBookData = BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          return { ...s, backgroundSetup: backgroundSetup, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      BookService.saveActiveBookData(updatedData);
      setIsDirty(false);
      onStoryUpdate();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBackgroundSetup(event.target.value);
    setIsDirty(true);
    
    // Auto-save after a short delay
    if (story) {
      setTimeout(() => {
        const activeBookData = BookService.getActiveBookData();
        if (!activeBookData) return;
        
        const updatedStories = activeBookData.stories.map(s => {
          if (s.id === story.id) {
            return { ...s, backgroundSetup: event.target.value, updatedAt: new Date() };
          }
          return s;
        });
        
        const updatedData = { ...activeBookData, stories: updatedStories };
        BookService.saveActiveBookData(updatedData);
        setIsDirty(false);
        onStoryUpdate();
      }, 1000);
    }
  };

  if (!story) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a story to edit background setup
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" component="h2">
          Background Scene Setup
        </Typography>
        <Tooltip title="Save changes">
          <span>
            <IconButton 
              onClick={handleSave} 
              disabled={!isDirty}
              color="primary"
            >
              <SaveIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      
      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        label="Describe the background and setting for your story"
        placeholder="Enter the background scene setup, including the world, setting, atmosphere, and any important contextual information..."
        value={backgroundSetup}
        onChange={handleChange}
        helperText="This will serve as the foundation for all your scenes. Changes are auto-saved."
      />
    </Paper>
  );
}; 