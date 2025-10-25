import React, { useState } from 'react';
import {
  Typography,
  Paper,
  Button,
  Card,
  CardMedia,
  CardActions,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  Box,
  Badge,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Close as CloseIcon, 
  ContentCopy as CopyIcon,
  CompareArrows as CompareIcon
} from '@mui/icons-material';
import { ImageComparisonDialog } from './ImageComparisonDialog';
import type { GeneratedImage } from '../types/Story';

interface ImagePanelProps {
  imageUrl: string | null;
  imageHistory: GeneratedImage[];
  onSave: () => void;
  onClear: () => void;
  onDeleteImage: (imageId: string) => void;
  onSaveSpecificImage: (imageUrl: string) => void;
}

export const ImagePanel: React.FC<ImagePanelProps> = ({
  imageUrl,
  imageHistory,
  onSave,
  onClear,
  onDeleteImage,
  onSaveSpecificImage
}) => {
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleCopyImage = async (urlToCopy?: string) => {
    const targetUrl = urlToCopy || imageUrl;
    if (!targetUrl) return;

    // Debug logging
    console.log('Copy image - targetUrl type:', typeof targetUrl);
    console.log('Copy image - targetUrl value:', targetUrl);

    // Ensure targetUrl is a string
    const urlString = typeof targetUrl === 'string' ? targetUrl : String(targetUrl);
    
    if (!urlString || urlString === 'null' || urlString === 'undefined') {
      console.error('Invalid URL string:', urlString);
      setSnackbarMessage('No valid image URL to copy');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      let blob: Blob;
      
      // Handle different types of URLs
      if (urlString.startsWith('blob:')) {
        // For blob URLs, fetch directly
        const response = await fetch(urlString);
        if (!response.ok) {
          throw new Error('Failed to fetch blob URL. The image may have been cleared.');
        }
        blob = await response.blob();
      } else if (urlString.startsWith('data:')) {
        // For data URLs, convert to blob
        const base64Response = await fetch(urlString);
        blob = await base64Response.blob();
      } else {
        // For regular URLs (http/https), fetch with CORS
        const response = await fetch(urlString, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        blob = await response.blob();
      }
      
      console.log('Original blob type:', blob.type);
      console.log('Original blob size:', blob.size);
      
      // Try to convert to PNG for maximum compatibility with applications like Word
      // If conversion fails, fall back to copying the original blob
      let conversionSucceeded = false;
      const originalBlob = blob;
      
      // Check if blob is already a standard image format
      const isStandardFormat = blob.type === 'image/png' || blob.type === 'image/jpeg' || blob.type === 'image/jpg';
      
      if (isStandardFormat && blob.size > 0) {
        console.log('Image is already in standard format, will try conversion but can fall back');
      }
      
      try {
        // Convert to PNG for maximum compatibility with applications like Word
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        
        // Create object URL from blob for loading
        const objectUrl = URL.createObjectURL(blob);
        
        try {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Image load timeout (10s)'));
            }, 10000);
            
            img.onload = () => {
              clearTimeout(timeout);
              try {
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                
                console.log('Image loaded:', canvas.width, 'x', canvas.height);
                
                // Draw image to canvas
                ctx.drawImage(img, 0, 0);
                
                // Convert canvas to blob (PNG format)
                canvas.toBlob((pngBlob) => {
                  if (pngBlob) {
                    blob = pngBlob;
                    console.log('Converted blob type:', blob.type);
                    console.log('Converted blob size:', blob.size);
                    conversionSucceeded = true;
                    resolve();
                  } else {
                    reject(new Error('Failed to convert canvas to PNG blob'));
                  }
                }, 'image/png');
              } catch (err) {
                reject(err);
              }
            };
            
            img.onerror = (event) => {
              clearTimeout(timeout);
              console.error('Image load error event:', event);
              reject(new Error('Failed to load image for conversion'));
            };
            
            // Set crossOrigin before setting src
            img.crossOrigin = 'anonymous';
            img.src = objectUrl;
            
            console.log('Loading image from:', objectUrl.substring(0, 50) + '...');
          });
        } finally {
          // Clean up object URL
          URL.revokeObjectURL(objectUrl);
          console.log('Object URL revoked');
        }
      } catch (conversionError) {
        console.warn('Image conversion failed, will use original blob:', conversionError);
        blob = originalBlob;
        conversionSucceeded = false;
      }
      
      // Ensure blob has correct type for clipboard
      // Always use image/png type for maximum compatibility
      if (blob.type !== 'image/png') {
        console.log('Re-wrapping blob with image/png type. Original type:', blob.type);
        blob = new Blob([blob], { type: 'image/png' });
      }
      
      console.log('Final blob for clipboard - type:', blob.type, 'size:', blob.size);
      
      // Verify clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API not available. This may require HTTPS or localhost.');
      }
      
      // Copy to clipboard using the Clipboard API
      console.log('Writing to clipboard...');
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      console.log('✓ Clipboard write successful');

      const formatMessage = conversionSucceeded 
        ? 'Image copied to clipboard (converted to PNG)' 
        : 'Image copied to clipboard (original format)';
      
      setSnackbarMessage(formatMessage);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSnackbarMessage(`Failed to copy image: ${errorMessage}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  if (!imageUrl) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: 'fit-content' }}>
        <Typography variant="h6" gutterBottom>
          Generated Image
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No image generated yet. Configure your scene and click "Generate Image" to create one.
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper elevation={2} sx={{ p: 3, height: 'fit-content', position: 'sticky', top: 16 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Generated Image
          </Typography>
          {imageHistory.length > 0 && (
            <Button
              size="small"
              startIcon={<CompareIcon />}
              onClick={() => setComparisonDialogOpen(true)}
              variant="outlined"
            >
              <Badge badgeContent={imageHistory.length} color="primary" max={99}>
                <span style={{ marginRight: 16 }}>Compare</span>
              </Badge>
            </Button>
          )}
        </Box>
        <Card>
          <CardMedia
            component="img"
            image={imageUrl}
            alt="Generated scene image"
            onClick={() => setFullScreenOpen(true)}
            sx={{ 
              maxHeight: 600, 
              objectFit: 'contain',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.9
              }
            }}
          />
          <CardActions>
            <Button
              size="small"
              startIcon={<SaveIcon />}
              onClick={onSave}
              variant="contained"
            >
              Save
            </Button>
            <Button
              size="small"
              startIcon={<CopyIcon />}
              onClick={handleCopyImage}
              variant="outlined"
            >
              Copy
            </Button>
            <Button
              size="small"
              onClick={onClear}
            >
              Clear
            </Button>
          </CardActions>
        </Card>
      </Paper>

      {/* Full Screen Image Dialog */}
      <Dialog
        open={fullScreenOpen}
        onClose={() => setFullScreenOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setFullScreenOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 1
            }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <img
              src={imageUrl || ''}
              alt="Full size scene image"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
            />
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#f5f5f5' }}>
            <Button
              startIcon={<CopyIcon />}
              onClick={handleCopyImage}
              variant="outlined"
            >
              Copy to Clipboard
            </Button>
            <Button
              startIcon={<SaveIcon />}
              onClick={() => {
                onSave();
                setFullScreenOpen(false);
              }}
              variant="contained"
            >
              Save Image
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Image Comparison Dialog */}
      <ImageComparisonDialog
        open={comparisonDialogOpen}
        onClose={() => setComparisonDialogOpen(false)}
        imageHistory={imageHistory}
        onDeleteImage={onDeleteImage}
        onSaveImage={onSaveSpecificImage}
        onCopyImage={handleCopyImage}
      />
    </>
  );
};

