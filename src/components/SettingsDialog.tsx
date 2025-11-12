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
  Switch,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { 
  Folder as FolderIcon, 
  FolderOpen as FolderOpenIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { SettingsService } from '../services/SettingsService';
import { FileSystemService } from '../services/FileSystemService';
import { DirectoryMigrationService } from '../services/DirectoryMigrationService';
import type { MigrationProgress } from '../services/DirectoryMigrationService';
import { IMAGE_MODELS } from '../constants/imageModels';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveDirectory, setSaveDirectory] = useState<string | null>(null);
  const [isSelectingDirectory, setIsSelectingDirectory] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  
  // Migration state
  const [showMigrationWarning, setShowMigrationWarning] = useState(false);
  const [migrationData, setMigrationData] = useState<{ oldPath?: string; newPath?: string; oldHandle?: FileSystemDirectoryHandle } | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; filesCopied: number; errors: string[] } | null>(null);

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
    
    // Get old handle and check for data BEFORE selecting new directory
    const oldHandle = await FileSystemService.getDirectoryHandle();
    const oldPath = oldHandle ? oldHandle.name : null;
    const hasExistingData = oldHandle ? await FileSystemService.hasDataInDirectory(oldHandle) : false;
    
    // Temporarily store old handle for migration
    if (oldHandle) {
      FileSystemService.setOldDirectoryHandle(oldHandle);
    }
    
    const result = await FileSystemService.selectDirectory();
    setIsSelectingDirectory(false);
    
    if (result.success && result.path) {
      // Check if there's existing data to migrate
      if (hasExistingData && oldHandle && oldPath && oldPath !== result.path) {
        // Store migration data and show warning
        setMigrationData({
          oldPath: oldPath,
          newPath: result.path,
          oldHandle: oldHandle
        });
        setShowMigrationWarning(true);
        // Don't update saveDirectory yet - wait for migration decision
      } else {
        // No existing data or same directory - just update directory
        setSaveDirectory(result.path);
        setSaved(true);
        FileSystemService.setOldDirectoryHandle(null);
      }
    } else {
      FileSystemService.setOldDirectoryHandle(null);
    }
  };

  const handleStartMigration = async () => {
    if (!migrationData?.oldHandle) return;
    
    setShowMigrationWarning(false);
    setMigrating(true);
    
    // Get new directory handle
    const newHandle = await FileSystemService.getDirectoryHandle();
    if (!newHandle) {
      setMigrating(false);
      return;
    }

    // Perform migration
    const result = await DirectoryMigrationService.migrateDirectory(
      migrationData.oldHandle,
      newHandle,
      (progress) => {
        setMigrationProgress(progress);
      }
    );

    setMigrationResult({
      success: result.success,
      filesCopied: result.filesCopied,
      errors: result.errors
    });
    setMigrating(false);
    setMigrationProgress(null);
    
    // Update directory display
    if (migrationData.newPath) {
      setSaveDirectory(migrationData.newPath);
    }
    
    // Ask if user wants to delete old directory
    if (result.success && result.filesCopied > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const handleSkipMigration = async () => {
    setShowMigrationWarning(false);
    if (migrationData?.newPath) {
      // User chose to skip migration - use new directory
      setSaveDirectory(migrationData.newPath);
      setSaved(true);
    }
    setMigrationData(null);
    FileSystemService.setOldDirectoryHandle(null);
  };

  const handleCancelMigrationWarning = async () => {
    // User closed dialog without choosing - revert to old directory
    if (migrationData?.oldHandle) {
      // Restore old directory handle
      await FileSystemService.saveDirectoryHandle(migrationData.oldHandle);
      FileSystemService.restoreDirectoryHandle(migrationData.oldHandle);
      FileSystemService.setOldDirectoryHandle(null);
      if (migrationData.oldPath) {
        setSaveDirectory(migrationData.oldPath);
      }
    }
    setShowMigrationWarning(false);
    setMigrationData(null);
  };

  const handleDeleteOldDirectory = async () => {
    if (!migrationData?.oldHandle) return;
    
    const deleted = await DirectoryMigrationService.deleteOldDirectory(migrationData.oldHandle);
    setShowDeleteConfirm(false);
    setMigrationData(null);
    setSaved(true);
    
    if (!deleted) {
      // Show error but don't block - user can delete manually
      console.warn('Failed to delete old directory - you can delete it manually');
    }
  };

  const handleKeepOldDirectory = () => {
    setShowDeleteConfirm(false);
    setMigrationData(null);
    setSaved(true);
  };

  const handleClearDirectory = async () => {
    await FileSystemService.clearDirectory();
    setSaveDirectory(null);
    setSaved(true);
  };

  return (
    <>
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

          {/* Storage Directory Section */}
          <Typography variant="h6" gutterBottom>
            Persistent Image Storage
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              <strong>New!</strong> Images are now stored to your local disk instead of browser storage. 
              This prevents images from being deleted when your browser clears cache or runs low on space.
            </Typography>
          </Alert>

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
            Select a directory for storing all generated images. This directory is used for:
            <br />• <strong>Persistent storage</strong> - Images are cached to disk (in .prompter-cache folder)
            <br />• <strong>Manual exports</strong> - Images you save manually go to book subdirectories
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
                      Persistent storage enabled
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <FolderOpenIcon fontSize="small" />
                      {saveDirectory}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      • Cache: {saveDirectory}/.prompter-cache/
                      <br />
                      • Manual saves: {saveDirectory}/[BookTitle]/[scene-name]_[timestamp].png
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

    {/* Migration Warning Dialog */}
    <Dialog open={showMigrationWarning} onClose={handleCancelMigrationWarning} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Migrate Existing Data?</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            You're changing your storage directory, but you have existing data in the old location.
          </Typography>
        </Alert>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>Old directory:</strong> {migrationData?.oldPath}
          <br />
          <strong>New directory:</strong> {migrationData?.newPath}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Would you like to migrate all your images and book data to the new directory?
          <br />
          <br />
          If you skip migration, your old data will remain in the old directory and new data will be saved to the new directory.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSkipMigration}>Skip Migration</Button>
        <Button onClick={handleStartMigration} variant="contained" color="primary">
          Migrate Data
        </Button>
      </DialogActions>
    </Dialog>

    {/* Migration Progress Dialog */}
    <Dialog open={migrating} maxWidth="sm" fullWidth>
      <DialogTitle>Migrating Data...</DialogTitle>
      <DialogContent>
        {migrationProgress && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {migrationProgress.currentFile}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(migrationProgress.current / migrationProgress.total) * 100} 
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {migrationProgress.current} of {migrationProgress.total} files
            </Typography>
          </Box>
        )}
        {!migrationProgress && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
    </Dialog>

    {/* Delete Old Directory Confirmation */}
    <Dialog open={showDeleteConfirm} onClose={handleKeepOldDirectory} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Old Directory?</DialogTitle>
      <DialogContent>
        {migrationResult && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Migration completed successfully! {migrationResult.filesCopied} files copied.
              </Typography>
            </Alert>
            {migrationResult.errors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {migrationResult.errors.length} files had errors during migration.
                </Typography>
              </Alert>
            )}
            <Typography variant="body2" sx={{ mb: 2 }}>
              Your data has been migrated to the new directory:
              <br />
              <strong>{migrationData?.newPath}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Would you like to delete the old directory ({migrationData?.oldPath})?
              <br />
              This will remove the .prompter-cache folder from the old location.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleKeepOldDirectory}>Keep Old Directory</Button>
        <Button onClick={handleDeleteOldDirectory} variant="contained" color="error">
          Delete Old Directory
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

