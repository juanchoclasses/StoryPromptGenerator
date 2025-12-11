import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';

export interface PreviewData {
  sceneTitle: string;
  sceneDescription: string;
  prompt: string;
  characterImages: Array<{
    name: string;
    url: string;
  }>;
  aspectRatio: string;
  model: string;
}

interface ImageGenerationPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: () => void;
  previewData: PreviewData | null;
}

export const ImageGenerationPreviewDialog: React.FC<ImageGenerationPreviewDialogProps> = ({
  open,
  onClose,
  onGenerate,
  previewData
}) => {
  if (!previewData) return null;

  const handleGenerate = () => {
    onGenerate();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="primary" />
          <Typography variant="h6">
            Image Generation Preview
          </Typography>
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Scene Info */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Scene
          </Typography>
          <Typography variant="h6" gutterBottom>
            {previewData.sceneTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {previewData.sceneDescription}
          </Typography>
        </Paper>

        {/* Generation Settings */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Generation Settings
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Model
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {previewData.model}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Aspect Ratio
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {previewData.aspectRatio}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Character Reference Images */}
        {previewData.characterImages.length > 0 && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ImageIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="medium">
                Character Reference Images
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({previewData.characterImages.length})
              </Typography>
            </Box>
            <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 2
              }}>
                {previewData.characterImages.map((char, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'grey.100',
                        border: '2px solid',
                        borderColor: 'primary.main'
                      }}
                    >
                      <img
                        src={char.url}
                        alt={char.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                    <Typography variant="caption" fontWeight="medium" textAlign="center">
                      {char.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </>
        )}

        {/* Prompt */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TextFieldsIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="medium">
            Generation Prompt
          </Typography>
        </Box>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            maxHeight: '400px',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}
        >
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
          >
            {previewData.prompt}
          </Typography>
        </Paper>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            <strong>Note:</strong> This preview shows the exact prompt and reference images that will be
            sent to the AI model. Review to ensure all details are correct before generating.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          color="primary"
          startIcon={<ImageIcon />}
        >
          Generate Image
        </Button>
      </DialogActions>
    </Dialog>
  );
};




