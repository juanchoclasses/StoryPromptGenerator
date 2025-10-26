import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Checkbox,
  IconButton,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import type { GeneratedImage } from '../types/Story';
import { ImageStorageService } from '../services/ImageStorageService';

interface ImageComparisonDialogProps {
  open: boolean;
  onClose: () => void;
  imageHistory: GeneratedImage[];
  onDeleteImage: (imageId: string) => void;
  onSaveImage: (imageUrl: string) => void;
  onCopyImage: (imageUrl: string) => void;
}

// Type for enriched image with loaded URL
interface EnrichedImage extends GeneratedImage {
  url: string;
}

export const ImageComparisonDialog: React.FC<ImageComparisonDialogProps> = ({
  open,
  onClose,
  imageHistory,
  onDeleteImage,
  onSaveImage,
  onCopyImage
}) => {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'gallery' | 'compare'>('gallery');
  const [enrichedHistory, setEnrichedHistory] = useState<EnrichedImage[]>([]);
  const [loading, setLoading] = useState(false);

  // Load URLs from IndexedDB when dialog opens
  useEffect(() => {
    if (!open || imageHistory.length === 0) {
      setEnrichedHistory([]);
      return;
    }

    const loadImages = async () => {
      setLoading(true);
      const enriched: EnrichedImage[] = [];

      for (const image of imageHistory) {
        // Try to load URL from IndexedDB
        let url = image.url; // Might be undefined or legacy value

        if (!url || url.startsWith('blob:')) {
          // Need to load from IndexedDB
          try {
            const loadedUrl = await ImageStorageService.getImage(image.id);
            if (loadedUrl) {
              url = loadedUrl;
            }
          } catch (error) {
            console.error(`Failed to load image ${image.id} from IndexedDB:`, error);
          }
        }

        if (url) {
          enriched.push({ ...image, url });
        } else {
          console.warn(`Could not load URL for image ${image.id}`);
        }
      }

      setEnrichedHistory(enriched);
      setLoading(false);
    };

    loadImages();
  }, [open, imageHistory]);

  const handleToggleSelect = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      // Limit to 4 images for comparison
      if (newSelected.size < 4) {
        newSelected.add(imageId);
      }
    }
    setSelectedImages(newSelected);
  };

  const handleCompareSelected = () => {
    if (selectedImages.size >= 2) {
      setViewMode('compare');
    }
  };

  const handleBackToGallery = () => {
    setViewMode('gallery');
    setSelectedImages(new Set());
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedImagesList = Array.from(selectedImages)
    .map(id => enrichedHistory.find(img => img.id === id))
    .filter((img): img is EnrichedImage => img !== undefined);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {viewMode === 'gallery' ? 'Image History' : 'Compare Images'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        {viewMode === 'gallery' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Select 2-4 images to compare side by side
          </Typography>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              Loading images from storage...
            </Typography>
          </Box>
        ) : viewMode === 'gallery' ? (
          // Gallery View
          <Grid container spacing={2}>
            {enrichedHistory.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                  No images generated yet for this scene.
                </Typography>
              </Grid>
            ) : (
              enrichedHistory.slice().reverse().map((image) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
                  <Card 
                    sx={{ 
                      position: 'relative',
                      border: selectedImages.has(image.id) ? '3px solid primary.main' : 'none'
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Checkbox
                        checked={selectedImages.has(image.id)}
                        onChange={() => handleToggleSelect(image.id)}
                        disabled={!selectedImages.has(image.id) && selectedImages.size >= 4}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          zIndex: 1,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                          }
                        }}
                      />
                      <CardMedia
                        component="img"
                        image={image.url}
                        alt={`Generated by ${image.modelName}`}
                        sx={{ 
                          height: 200,
                          objectFit: 'contain',
                          backgroundColor: '#f5f5f5',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleToggleSelect(image.id)}
                      />
                    </Box>
                    <CardContent sx={{ pb: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Chip 
                          label={image.modelName} 
                          size="small" 
                          color="primary"
                          sx={{ fontSize: '0.7rem' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(image.timestamp)}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5} justifyContent="flex-end">
                        <IconButton 
                          size="small" 
                          onClick={() => onCopyImage(image.url)}
                          title="Copy to clipboard"
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => onSaveImage(image.url)}
                          title="Save image"
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => onDeleteImage(image.id)}
                          color="error"
                          title="Delete image"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        ) : (
          // Comparison View
          <Box>
            <Grid container spacing={2}>
              {selectedImagesList.map((image) => (
                <Grid item xs={12} sm={6} md={selectedImagesList.length <= 2 ? 6 : 3} key={image.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Chip label={image.modelName} size="small" color="primary" />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(image.timestamp)}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardMedia
                      component="img"
                      image={image.url}
                      alt={`Generated by ${image.modelName}`}
                      sx={{ 
                        maxHeight: '60vh',
                        objectFit: 'contain',
                        backgroundColor: '#f5f5f5'
                      }}
                    />
                    <CardContent>
                      <Box display="flex" gap={1} justifyContent="center">
                        <Button 
                          size="small" 
                          startIcon={<CopyIcon />}
                          onClick={() => onCopyImage(image.url)}
                        >
                          Copy
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<SaveIcon />}
                          onClick={() => onSaveImage(image.url)}
                          variant="contained"
                        >
                          Save
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {viewMode === 'gallery' ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
              {enrichedHistory.length} image{enrichedHistory.length !== 1 ? 's' : ''} total
            </Typography>
            <Button onClick={onClose}>Close</Button>
            <Button
              onClick={handleCompareSelected}
              variant="contained"
              disabled={selectedImages.size < 2}
            >
              Compare Selected ({selectedImages.size})
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleBackToGallery}>Back to Gallery</Button>
            <Button onClick={onClose} variant="contained">Done</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

