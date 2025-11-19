import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { 
  FolderOpen as FolderOpenIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { FileSystemService } from '../services/FileSystemService';

interface DirectoryReconnectDialogProps {
  open: boolean;
  onReconnect: () => void;
  onCancel?: () => void;
}

export const DirectoryReconnectDialog: React.FC<DirectoryReconnectDialogProps> = ({ 
  open, 
  onReconnect,
  onCancel 
}) => {
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectDirectory = async () => {
    setSelecting(true);
    setError(null);
    
    try {
      const result = await FileSystemService.selectDirectory();
      
      if (result.success) {
        console.log('✓ Directory reconnected:', result.path);
        // Trigger data reload
        onReconnect();
      } else {
        setError(result.error || 'Failed to select directory');
      }
    } catch (err) {
      console.error('Error selecting directory:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSelecting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Directory Connection Lost
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Cannot find your books directory
          </Typography>
          <Typography variant="body2">
            This can happen if your browser crashed or restarted. Your books are safe on disk, 
            but you need to reconnect to the directory.
          </Typography>
        </Alert>

        <Box sx={{ my: 2 }}>
          <Typography variant="body2" paragraph>
            <strong>What happened:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 3 }}>
            <li>Your browser lost the reference to your books directory</li>
            <li>All your book files are still safely stored on your computer</li>
            <li>You just need to select the same directory again</li>
          </Typography>
        </Box>

        <Box sx={{ my: 2 }}>
          <Typography variant="body2" paragraph>
            <strong>What to do:</strong>
          </Typography>
          <Typography variant="body2" component="ol" sx={{ pl: 3 }}>
            <li>Click "Select Directory" below</li>
            <li>Navigate to your books directory (likely where you selected it before)</li>
            <li>Your books will load automatically</li>
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {onCancel && (
          <Button onClick={onCancel} disabled={selecting}>
            Skip for Now
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={selecting ? <CircularProgress size={20} /> : <FolderOpenIcon />}
          onClick={handleSelectDirectory}
          disabled={selecting}
          color="primary"
        >
          {selecting ? 'Selecting...' : 'Select Directory'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

