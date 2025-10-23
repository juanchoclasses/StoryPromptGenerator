import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { IMAGE_MODELS } from '../constants/imageModels';
import { SettingsService } from '../services/SettingsService';

interface ModelSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (modelName: string) => void;
}

export const ModelSelectionDialog: React.FC<ModelSelectionDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [selectedModel, setSelectedModel] = useState('');
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    if (open) {
      // Load the last used model or default
      const lastModel = SettingsService.getImageGenerationModel();
      setSelectedModel(lastModel);
      setRememberChoice(false);
    }
  }, [open]);

  const handleConfirm = () => {
    if (!selectedModel) return;
    
    // Optionally save as default
    if (rememberChoice) {
      SettingsService.updateSettings({
        imageGenerationModel: selectedModel
      });
    }
    
    onConfirm(selectedModel);
    onClose();
  };

  const getModelInfo = () => {
    const model = IMAGE_MODELS.find(m => m.value === selectedModel);
    return model ? model.label : '';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select AI Model for Image Generation</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Choose which AI model to use for generating this image. Each model has different 
            strengths, speeds, and costs.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Model</InputLabel>
            <Select
              value={selectedModel}
              label="Model"
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {IMAGE_MODELS.map((model) => (
                <MenuItem key={model.value} value={model.value}>
                  {model.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedModel && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Selected:</strong> {getModelInfo()}
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              💡 Tip: You can also set a default model in Settings
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={!selectedModel}
        >
          Generate Image
        </Button>
      </DialogActions>
    </Dialog>
  );
};

