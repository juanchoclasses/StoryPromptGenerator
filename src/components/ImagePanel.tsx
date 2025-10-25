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
      
      // Ensure we have a valid image type
      let blobType = blob.type;
      if (!blobType || blobType === 'application/octet-stream') {
        // Default to PNG if type is unknown
        blobType = 'image/png';
        blob = new Blob([blob], { type: blobType });
      }
      
      // Copy to clipboard using the Clipboard API
      await navigator.clipboard.write([
        new ClipboardItem({
          [blobType]: blob
        })
      ]);

      setSnackbarMessage('Image copied to clipboard');
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

