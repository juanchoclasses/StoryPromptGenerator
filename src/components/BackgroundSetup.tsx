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
import { StoryService } from '../services/StoryService';

interface BackgroundSetupProps {
  onSave?: () => void;
}

export const BackgroundSetup: React.FC<BackgroundSetupProps> = ({ onSave }) => {
  const [backgroundSetup, setBackgroundSetup] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const data = StoryService.getStoryData();
    setBackgroundSetup(data.backgroundSetup);
  }, []);

  const handleSave = () => {
    StoryService.updateBackgroundSetup(backgroundSetup);
    setIsDirty(false);
    onSave?.();
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBackgroundSetup(event.target.value);
    setIsDirty(true);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" component="h2">
          Background Scene Setup
        </Typography>
        <Tooltip title="Save changes">
          <IconButton 
            onClick={handleSave} 
            disabled={!isDirty}
            color="primary"
          >
            <SaveIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <TextField
        fullWidth
        multiline
        rows={8}
        variant="outlined"
        label="Describe the background and setting for your story"
        placeholder="Enter the background scene setup, including the world, setting, atmosphere, and any important contextual information..."
        value={backgroundSetup}
        onChange={handleChange}
        helperText="This will serve as the foundation for all your scenes"
      />
    </Paper>
  );
}; 