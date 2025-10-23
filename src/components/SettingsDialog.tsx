import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link
} from '@mui/material';
import { SettingsService } from '../services/SettingsService';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const IMAGE_MODELS = [
  { value: 'google/gemini-2.5-flash-image-preview', label: 'Google Gemini 2.5 Flash Image (Recommended)' },
  { value: 'google/gemini-2.0-flash-exp:image-generation', label: 'Google Gemini 2.0 Flash Image' },
  { value: 'google/gemini-flash-1.5-exp', label: 'Google Gemini Flash 1.5 Experimental' },
  { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o (Multimodal)' },
  { value: 'openai/gpt-4o-2024-11-20', label: 'OpenAI GPT-4o (Latest)' },
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      const settings = SettingsService.getAllSettings();
      setApiKey(settings.openRouterApiKey || '');
      setModel(settings.imageGenerationModel || 'google/gemini-2.5-flash-image-preview');
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    SettingsService.updateSettings({
      openRouterApiKey: apiKey.trim() || undefined,
      imageGenerationModel: model
    });
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    SettingsService.clearApiKey();
    setApiKey('');
    setSaved(true);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {saved && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Settings saved successfully!
            </Alert>
          )}

          <Typography variant="h6" gutterBottom>
            Image Generation
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure your OpenRouter API key to generate images from your scene prompts.
            Get your API key from{' '}
            <Link href="https://openrouter.ai/keys" target="_blank" rel="noopener">
              openrouter.ai/keys
            </Link>
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              <strong>How it works:</strong> OpenRouter supports image generation through models with "image" 
              in their output modalities. Images are returned as base64-encoded data URLs. 
              Gemini 2.5 Flash Image is recommended for best results.
            </Typography>
          </Alert>

          <TextField
            label="OpenRouter API Key"
            fullWidth
            type="password"
            variant="outlined"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            sx={{ mb: 3 }}
            helperText="Your API key is stored locally in your browser and never sent to our servers"
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>AI Model</InputLabel>
            <Select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              label="AI Model"
            >
              {IMAGE_MODELS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              <strong>Pricing:</strong> Image generation costs vary by model. Gemini models typically charge 
              per 1K characters of input. Check the{' '}
              <Link href="https://openrouter.ai/models" target="_blank" rel="noopener">
                Models page
              </Link>
              {' '}for current pricing.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        {apiKey && (
          <Button onClick={handleClear} color="error" sx={{ mr: 'auto' }}>
            Clear API Key
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

