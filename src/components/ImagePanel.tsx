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
      // Simple approach: Load image from URL, draw to canvas, get PNG blob
      // This works because the URL is already valid (save functionality works)
      console.log('Loading image from URL for clipboard:', urlString.substring(0, 80) + '...');
      
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // Load image and convert to PNG
      const blob = await new Promise<Blob>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout (10s)'));
        }, 10000);
        
        img.onload = () => {
          clearTimeout(timeout);
          try {
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            
            if (canvas.width === 0 || canvas.height === 0) {
              reject(new Error('Image has zero dimensions'));
              return;
            }
            
            console.log('✓ Image loaded:', canvas.width, 'x', canvas.height);
            
            // Draw image to canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to PNG blob
            canvas.toBlob((pngBlob) => {
              if (pngBlob && pngBlob.size > 0) {
                console.log('✓ PNG blob created - size:', pngBlob.size, 'type:', pngBlob.type);
                resolve(pngBlob);
              } else {
                reject(new Error('Canvas produced empty or null blob'));
              }
            }, 'image/png', 1.0);
          } catch (err) {
            reject(err);
          }
        };
        
        img.onerror = (event) => {
          clearTimeout(timeout);
          console.error('Image load error:', event);
          reject(new Error('Failed to load image from URL'));
        };
        
        // Load image directly from the URL (works for blob:, data:, and http: URLs)
        img.crossOrigin = 'anonymous';
        img.src = urlString;
      });
      
      console.log('Final PNG blob for clipboard - size:', blob.size, 'type:', blob.type);
      
      // Verify clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API not available. This may require HTTPS or localhost.');
      }
      
      // Check if ClipboardItem supports image/png
      console.log('Checking clipboard capabilities...');
      console.log('Blob size:', blob.size, 'bytes');
      console.log('Blob type:', blob.type);
      
      // Try to write PNG blob to clipboard
      console.log('Attempting clipboard write...');
      
      try {
        // Method 1: Direct blob write
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        console.log('✓ Clipboard write successful (direct blob)');
      } catch (directError) {
        console.warn('Direct blob write failed, trying alternative method:', directError);
        
        // Method 2: Use a promise that resolves to the blob
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': Promise.resolve(blob)
            })
          ]);
          console.log('✓ Clipboard write successful (promise blob)');
        } catch (promiseError) {
          console.error('Promise blob write also failed:', promiseError);
          
          // Method 3: Try converting to data URL as last resort
          try {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            
            console.log('Created data URL, length:', dataUrl.length);
            
            // Try writing data URL wrapped in HTML
            await navigator.clipboard.write([
              new ClipboardItem({
                'text/html': new Blob([`<img src="${dataUrl}" />`], { type: 'text/html' })
              })
            ]);
            console.log('✓ Clipboard write successful (HTML fallback)');
          } catch (htmlError) {
            console.error('All clipboard methods failed:', htmlError);
            throw new Error('Unable to copy image to clipboard. Browser may not support this feature.');
          }
        }
      }

      const formatMessage = 'Image copied to clipboard (PNG format)';
      
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

