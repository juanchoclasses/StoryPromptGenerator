/**
 * CharacterAuditionDialog - Generate and manage character images
 * 
 * Allows users to:
 * - Generate character images with different models
 * - View character image gallery
 * - Select active character image
 * - Delete unwanted images
 */

import React, { useState, useEffect } from 'react';
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
  Grid,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
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

  // Load gallery images when dialog opens
  useEffect(() => {
    if (open) {
      loadGallery();
    }
  }, [open, character.name]);

  const loadGallery = async () => {
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
  };

  const handleGenerateImage = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate the character image
      const characterImage = await CharacterImageService.generateCharacterImage(
        character,
        storyId,
        storyBackgroundSetup,
        book,
        selectedModel,
        book.style?.aspectRatio || '1:1'
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

  return (
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
            Generate Character Image:
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
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
              sx={{ minWidth: 150 }}
            >
              {generating ? 'Generating...' : 'Generate Image'}
            </Button>
          </Box>
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
            <Grid container spacing={2}>
              {character.imageGallery.map((img) => {
                const imageUrl = galleryImages.get(img.id);
                const selected = isImageSelected(img.id);

                return (
                  <Grid item xs={12} sm={6} md={4} key={img.id}>
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
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

