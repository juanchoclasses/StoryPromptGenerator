import React, { useState, useEffect, useRef } from 'react';
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
  const autoSaveTimerRef = useRef<number | null>(null);
  const isEditingRef = useRef(false);

  useEffect(() => {
    // Only update from story prop if we're not actively editing
    if (story && !isEditingRef.current) {
      setBackgroundSetup(story.backgroundSetup);
      setIsDirty(false);
    } else if (!story) {
      setBackgroundSetup('');
      setIsDirty(false);
    }
  }, [story]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const performSave = async (value: string) => {
    if (!story) return;
    
    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData) return;
    
    const updatedStories = activeBookData.stories.map(s => {
      if (s.id === story.id) {
        return { ...s, backgroundSetup: value, updatedAt: new Date() };
      }
      return s;
    });
    
    const updatedData = { ...activeBookData, stories: updatedStories };
    await BookService.saveActiveBookData(updatedData);
    setIsDirty(false);
    
    // Mark that we're done editing so the next story update can refresh the state
    isEditingRef.current = false;
  };

  const handleSave = () => {
    if (story) {
      performSave(backgroundSetup);
      onStoryUpdate();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setBackgroundSetup(newValue);
    setIsDirty(true);
    isEditingRef.current = true;
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Auto-save after a short delay
    if (story) {
      autoSaveTimerRef.current = window.setTimeout(() => {
        performSave(newValue);
        // Don't call onStoryUpdate() here to avoid triggering parent re-render
      }, 1000) as unknown as number;
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