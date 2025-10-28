/**
 * CharacterAuditionDialog - Generate and manage character images
 * 
 * Allows users to:
 * - Generate character images with different models
 * - View character image gallery
 * - Select active character image
 * - Delete unwanted images
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardMedia,
  CardActions,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Upload as UploadIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import type { Character } from '../models/Story';
import type { Book } from '../models/Book';
import { CharacterImageService } from '../services/CharacterImageService';
import { IMAGE_MODELS } from '../constants/imageModels';

interface CharacterAuditionDialogProps {
  open: boolean;
  character: Character;
  storyId: string;
  storyBackgroundSetup: string;
  book: Book;
  onClose: () => void;
  onUpdate: () => void; // Callback when character is updated
}

export const CharacterAuditionDialog: React.FC<CharacterAuditionDialogProps> = ({
  open,
  character,
  storyId,
  storyBackgroundSetup,
  book,
  onClose,
  onUpdate
}) => {
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].value);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<Map<string, string>>(new Map());
  const [loadingGallery, setLoadingGallery] = useState(false);
  
  // Prompt dialog state
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  
  // File upload state
  const [uploading, setUploading] = useState(false);

  const loadGallery = useCallback(async () => {
    setLoadingGallery(true);
    try {
      const images = await CharacterImageService.loadCharacterGallery(storyId, character.name);
      setGalleryImages(images);
    } catch (err) {
      console.error('Failed to load character gallery:', err);
      setError('Failed to load character images');
    } finally {
      setLoadingGallery(false);
    }
  }, [storyId, character.name]);

  // Load gallery images when dialog opens
  useEffect(() => {
    if (open) {
      loadGallery();
    }
  }, [open, loadGallery]);

  const handleGenerateImage = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate the character image (always use 1:1 for character portraits)
      const characterImage = await CharacterImageService.generateCharacterImage(
        character,
        storyId,
        storyBackgroundSetup,
        book,
        selectedModel,
        '1:1'
      );

      // Add to character's gallery (metadata only)
      CharacterImageService.addImageToGallery(character, characterImage);

      // If this is the first image, auto-select it
      if (!character.selectedImageId && characterImage.id) {
        CharacterImageService.setSelectedCharacterImage(character, characterImage.id);
      }

      // Notify parent to save changes
      onUpdate();

      // Reload gallery to show new image
      await loadGallery();

      setSuccess('Character image generated successfully!');
    } catch (err: unknown) {
      console.error('Failed to generate character image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate image: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectImage = (imageId: string) => {
    CharacterImageService.setSelectedCharacterImage(character, imageId);
    onUpdate();
    setSuccess('Character image selected!');
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      // Delete from IndexedDB
      await CharacterImageService.deleteCharacterImage(storyId, character.name, imageId);

      // Remove from character's gallery
      CharacterImageService.removeImageFromGallery(character, imageId);

      // Notify parent to save changes
      onUpdate();

      // Reload gallery
      await loadGallery();

      setSuccess('Image deleted successfully!');
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError('Failed to delete image');
    }
  };

  const isImageSelected = (imageId: string) => {
    return character.selectedImageId === imageId;
  };

  const handleViewPrompt = () => {
    // Build the prompt that would be used for generation
    const prompt = CharacterImageService.buildCharacterPrompt(
      character,
      storyBackgroundSetup,
      book
    );
    setGeneratedPrompt(prompt);
    setShowPromptDialog(true);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setSuccess('Prompt copied to clipboard!');
    } catch {
      setError('Failed to copy prompt');
    }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create a blob URL from the file
      const blobUrl = URL.createObjectURL(file);

      // Create character image metadata (without actual generation)
      const imageId = crypto.randomUUID();
      const characterImage = {
        id: imageId,
        url: blobUrl,
        model: 'user-uploaded',
        prompt: `Manual upload by user for ${character.name}`,
        timestamp: new Date(),
      };

      // Store in IndexedDB using ImageStorageService
      const { ImageStorageService } = await import('../services/ImageStorageService');
      await ImageStorageService.storeCharacterImage(
        storyId,
        character.name,
        imageId,
        blobUrl,
        'user-uploaded'
      );

      // Add to character's gallery
      CharacterImageService.addImageToGallery(character, characterImage);

      // If this is the first image, auto-select it
      if (!character.selectedImageId) {
        CharacterImageService.setSelectedCharacterImage(character, imageId);
      }

      // Notify parent to save changes
      onUpdate();

      // Reload gallery
      await loadGallery();

      setSuccess('Image uploaded successfully!');
    } catch (err: unknown) {
      console.error('Failed to upload image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to upload image: ${errorMessage}`);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">
              🎭 Character Audition: {character.name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Character Description Section */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Character Description:
          </Typography>
          <TextField
            multiline
            rows={3}
            value={character.description}
            disabled
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
              }
            }}
            helperText="Edit description in the Characters panel"
          />
        </Box>

        {/* Image Generation Section */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Generate or Upload Character Image:
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Model</InputLabel>
              <Select
                value={selectedModel}
                label="Model"
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={generating}
              >
                {IMAGE_MODELS.map((model) => (
                  <MenuItem key={model.value} value={model.value}>
                    {model.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleGenerateImage}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {generating ? 'Generating...' : 'Generate'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleViewPrompt}
              startIcon={<VisibilityIcon />}
            >
              View Prompt
            </Button>

            <Button
              variant="outlined"
              component="label"
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleUploadImage}
              />
            </Button>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Generate with API, view the prompt for external tools, or upload an existing image
          </Typography>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Character Gallery */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2">
              Character Gallery ({character.imageGallery?.length || 0} images)
            </Typography>
            <Tooltip title="Refresh gallery">
              <IconButton onClick={loadGallery} size="small" disabled={loadingGallery}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {loadingGallery ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : !character.imageGallery || character.imageGallery.length === 0 ? (
            <Box 
              p={4} 
              textAlign="center" 
              sx={{ 
                border: '2px dashed #ccc', 
                borderRadius: 2,
                backgroundColor: '#f9f9f9'
              }}
            >
              <Typography variant="body2" color="textSecondary">
                No images yet. Generate your first character image!
              </Typography>
            </Box>
          ) : (
            <Box 
              display="grid" 
              gridTemplateColumns={{
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              }}
              gap={2}
            >
              {character.imageGallery.map((img) => {
                const imageUrl = galleryImages.get(img.id);
                const selected = isImageSelected(img.id);

                return (
                  <Box key={img.id}>
                    <Card
                      sx={{
                        position: 'relative',
                        border: selected ? '3px solid #1976d2' : '1px solid #e0e0e0',
                        boxShadow: selected ? 3 : 1,
                      }}
                    >
                      {selected && (
                        <Badge
                          badgeContent={<CheckCircleIcon sx={{ fontSize: 20 }} />}
                          color="primary"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 1,
                          }}
                        />
                      )}
                      <CardMedia
                        component="img"
                        height="200"
                        image={imageUrl || '/placeholder.png'}
                        alt={`${character.name} - ${img.model}`}
                        sx={{
                          objectFit: 'contain',
                          backgroundColor: '#f5f5f5',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                      <CardActions sx={{ justifyContent: 'space-between', px: 1 }}>
                        <Tooltip title={selected ? 'Currently selected' : 'Select this image'}>
                          <Button
                            size="small"
                            variant={selected ? 'contained' : 'outlined'}
                            onClick={() => handleSelectImage(img.id)}
                            disabled={selected}
                          >
                            {selected ? 'Selected' : 'Select'}
                          </Button>
                        </Tooltip>
                        <Tooltip title="Delete image">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteImage(img.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                      <Box px={1} pb={1}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {img.model.split('/').pop()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {new Date(img.timestamp).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>

    {/* Prompt View Dialog */}
    <Dialog
      open={showPromptDialog}
      onClose={() => setShowPromptDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Character Generation Prompt</Typography>
          <IconButton onClick={() => setShowPromptDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          This is the prompt that will be used to generate the character image. You can copy it to use with other AI tools (Midjourney, Stable Diffusion, etc.)
        </Typography>
        <TextField
          multiline
          fullWidth
          value={generatedPrompt}
          rows={20}
          variant="outlined"
          InputProps={{
            readOnly: true,
            sx: {
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }
          }}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleCopyPrompt}
          startIcon={<ContentCopyIcon />}
          variant="contained"
        >
          Copy Prompt
        </Button>
        <Button onClick={() => setShowPromptDialog(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

