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

export interface CharacterPreviewData {
  characterName: string;
  characterDescription: string;
  prompt: string;
  referenceImage?: string | null;
  includeReferenceImage: boolean;
  aspectRatio: string;
  model: string;
  promptStrategy: 'auto' | 'legacy' | 'gemini';
}

interface CharacterImagePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: () => void;
  previewData: CharacterPreviewData | null;
}

export const CharacterImagePreviewDialog: React.FC<CharacterImagePreviewDialogProps> = ({
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
            Character Image Generation Preview
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
        {/* Character Info */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Character
          </Typography>
          <Typography variant="h6" gutterBottom>
            {previewData.characterName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {previewData.characterDescription}
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
            <Box>
              <Typography variant="caption" color="text.secondary">
                Prompt Strategy
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {previewData.promptStrategy === 'auto' ? 'Auto (Detect from Model)' :
                 previewData.promptStrategy === 'gemini' ? 'Gemini (Structured)' :
                 'Legacy (Simple)'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Reference Image */}
        {previewData.referenceImage && previewData.includeReferenceImage && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ImageIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="medium">
                Reference Image
              </Typography>
            </Box>
            <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Box
                  sx={{
                    width: 200,
                    aspectRatio: '1',
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: 'grey.100',
                    border: '2px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  <img
                    src={previewData.referenceImage}
                    alt="Reference"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                This reference image will be sent to the AI model for visual consistency
              </Typography>
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
            <strong>Note:</strong> This preview shows the exact prompt{previewData.referenceImage && previewData.includeReferenceImage ? ' and reference image' : ''} that will be
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




