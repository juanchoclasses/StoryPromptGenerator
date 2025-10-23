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
  Link,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { 
  Folder as FolderIcon, 
  FolderOpen as FolderOpenIcon,
  CheckCircle as CheckIcon 
} from '@mui/icons-material';
import { SettingsService } from '../services/SettingsService';
import { FileSystemService } from '../services/FileSystemService';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const IMAGE_MODELS = [
  { value: 'google/gemini-2.5-flash-image', label: 'Google Gemini 2.5 Flash Image (Recommended - $0.03/K imgs)' },
  { value: 'google/gemini-2.5-flash-image-preview', label: 'Google Gemini 2.5 Flash Image Preview ($0.03/K imgs)' },
  { value: 'openai/gpt-5-image-mini', label: 'OpenAI GPT-5 Image Mini (Fast - $0.008/K imgs)' },
  { value: 'openai/gpt-5-image', label: 'OpenAI GPT-5 Image (Premium)' },
  { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o (Multimodal)' },
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveDirectory, setSaveDirectory] = useState<string | null>(null);
  const [isSelectingDirectory, setIsSelectingDirectory] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  useEffect(() => {
    if (open) {
      const settings = SettingsService.getAllSettings();
      setApiKey(settings.openRouterApiKey || '');
      setModel(settings.imageGenerationModel || 'google/gemini-2.5-flash-image');
      setAutoSaveEnabled(settings.autoSaveImages ?? false);
      setSaved(false);
      
      // Load current directory
      FileSystemService.getDirectoryPath().then(path => {
        setSaveDirectory(path);
      });
    }
  }, [open]);

  const handleSave = () => {
    SettingsService.updateSettings({
      openRouterApiKey: apiKey.trim() || undefined,
      imageGenerationModel: model,
      autoSaveImages: autoSaveEnabled
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

  const handleSelectDirectory = async () => {
    setIsSelectingDirectory(true);
    const result = await FileSystemService.selectDirectory();
    setIsSelectingDirectory(false);
    
    if (result.success && result.path) {
      setSaveDirectory(result.path);
      setSaved(true);
    }
  };

  const handleClearDirectory = async () => {
    await FileSystemService.clearDirectory();
    setSaveDirectory(null);
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
              Gemini 2.5 Flash Image (Nano Banana) is recommended for quality, or GPT-5 Image Mini for faster/cheaper generation.
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

          <Divider sx={{ my: 3 }} />

          {/* Auto-Save Directory Section */}
          <Typography variant="h6" gutterBottom>
            Auto-Save Images
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                Enable automatic saving after image generation
              </Typography>
            }
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a parent directory where images will be saved. 
            Each book will get its own subdirectory. Use the Save button on images to save manually.
          </Typography>

          {!FileSystemService.isSupported() && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="caption">
                File System Access API is not supported in your browser. 
                Please use Chrome, Edge, or Opera for automatic saving.
              </Typography>
            </Alert>
          )}

          {FileSystemService.isSupported() && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                  variant={saveDirectory ? 'outlined' : 'contained'}
                  startIcon={saveDirectory ? <FolderOpenIcon /> : <FolderIcon />}
                  onClick={handleSelectDirectory}
                  disabled={isSelectingDirectory}
                >
                  {isSelectingDirectory ? 'Selecting...' : saveDirectory ? 'Change Directory' : 'Select Directory'}
                </Button>
                {saveDirectory && (
                  <Button
                    variant="text"
                    color="error"
                    onClick={handleClearDirectory}
                  >
                    Clear
                  </Button>
                )}
              </Box>

              {saveDirectory && (
                <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                      Auto-save enabled
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <FolderOpenIcon fontSize="small" />
                      {saveDirectory}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Images will be automatically saved to: {saveDirectory}/[BookTitle]/[scene-name]_[timestamp].png
                    </Typography>
                  </Box>
                </Alert>
              )}

              {!saveDirectory && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="caption">
                    <strong>How it works:</strong> Select a parent folder once. 
                    Each book will automatically create its own subfolder. 
                    Generated images will save there automatically without downloads.
                  </Typography>
                </Alert>
              )}
            </>
          )}
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

