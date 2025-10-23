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
  { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o (Recommended - Text to Image)' },
  { value: 'openai/gpt-4-turbo', label: 'OpenAI GPT-4 Turbo' },
  { value: 'anthropic/claude-3.5-sonnet', label: 'Anthropic Claude 3.5 Sonnet' },
  { value: 'google/gemini-pro-1.5', label: 'Google Gemini Pro 1.5' },
  { value: 'google/gemini-flash-1.5', label: 'Google Gemini Flash 1.5' },
  { value: 'meta-llama/llama-3.2-90b-vision-instruct', label: 'Meta Llama 3.2 90B Vision' },
  { value: 'x-ai/grok-vision-beta', label: 'xAI Grok Vision Beta' },
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      const settings = SettingsService.getAllSettings();
      setApiKey(settings.openRouterApiKey || '');
      setModel(settings.imageGenerationModel || 'openai/gpt-4o');
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
            Configure your OpenRouter API key to generate content from your scene prompts.
            Get your API key from{' '}
            <Link href="https://openrouter.ai/keys" target="_blank" rel="noopener">
              openrouter.ai/keys
            </Link>
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="caption">
              <strong>Note:</strong> OpenRouter primarily provides text generation models. 
              For actual image generation, you may need to use the generated descriptions with a 
              separate image generation service (DALL-E, Midjourney, Stable Diffusion, etc.).
              Some models like GPT-4o can provide image URLs if the prompt requests it.
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
              <strong>Note:</strong> Different models have different capabilities and pricing. 
              Check OpenRouter's documentation for details on each model.
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

