import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as GeneratingIcon
} from '@mui/icons-material';
import type { Story, Scene } from '../types/Story';
import type { Book } from '../types/Book';
import { IMAGE_MODELS } from '../constants/imageModels';

interface BatchImageGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  story: Story;
  activeBook: Book;
  onGenerate: (sceneId: string, modelName: string) => Promise<void>;
}

type SceneStatus = 'pending' | 'generating' | 'completed' | 'error';

interface SceneProgress {
  sceneId: string;
  status: SceneStatus;
  error?: string;
}

export const BatchImageGenerationDialog: React.FC<BatchImageGenerationDialogProps> = ({
  open,
  onClose,
  story,
  activeBook,
  onGenerate
}) => {
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].value);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<Map<string, SceneProgress>>(new Map());
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [stopRequested, setStopRequested] = useState(false);

  const handleStart = async () => {
    setIsGenerating(true);
    setStopRequested(false);
    setCurrentSceneIndex(0);

    // Initialize progress for all scenes
    const initialProgress = new Map<string, SceneProgress>();
    story.scenes.forEach(scene => {
      initialProgress.set(scene.id, { sceneId: scene.id, status: 'pending' });
    });
    setProgress(initialProgress);

    // Generate images for each scene
    for (let i = 0; i < story.scenes.length; i++) {
      if (stopRequested) {
        break;
      }

      const scene = story.scenes[i];
      setCurrentSceneIndex(i);

      // Update status to generating
      setProgress(prev => {
        const newProgress = new Map(prev);
        newProgress.set(scene.id, { sceneId: scene.id, status: 'generating' });
        return newProgress;
      });

      try {
        await onGenerate(scene.id, selectedModel);
        
        // Update status to completed
        setProgress(prev => {
          const newProgress = new Map(prev);
          newProgress.set(scene.id, { sceneId: scene.id, status: 'completed' });
          return newProgress;
        });
      } catch (error) {
        // Update status to error
        setProgress(prev => {
          const newProgress = new Map(prev);
          newProgress.set(scene.id, {
            sceneId: scene.id,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return newProgress;
        });
      }

      // Small delay between generations to avoid rate limiting
      if (i < story.scenes.length - 1 && !stopRequested) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsGenerating(false);
  };

  const handleStop = () => {
    setStopRequested(true);
  };

  const handleClose = () => {
    if (!isGenerating) {
      setProgress(new Map());
      setCurrentSceneIndex(0);
      onClose();
    }
  };

  const getStatusIcon = (status: SceneStatus) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'generating':
        return <GeneratingIcon color="primary" />;
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: SceneStatus): 'default' | 'primary' | 'success' | 'error' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'generating':
        return 'primary';
      default:
        return 'default';
    }
  };

  const completedCount = Array.from(progress.values()).filter(p => p.status === 'completed').length;
  const errorCount = Array.from(progress.values()).filter(p => p.status === 'error').length;
  const progressPercentage = story.scenes.length > 0 
    ? (completedCount / story.scenes.length) * 100 
    : 0;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={isGenerating}
    >
      <DialogTitle>
        Generate All Scene Images
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This will generate images for all {story.scenes.length} scenes in "{story.title}".
          </Typography>
          
          {!isGenerating && progress.size === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Select a model and click "Start Generation". Images will be generated one at a time.
            </Alert>
          )}
        </Box>

        {/* Model Selection */}
        {!isGenerating && progress.size === 0 && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Image Generation Model</InputLabel>
            <Select
              value={selectedModel}
              label="Image Generation Model"
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {IMAGE_MODELS.map((model) => (
                <MenuItem key={model.value} value={model.value}>
                  {model.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Progress */}
        {progress.size > 0 && (
          <>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Progress: {completedCount} / {story.scenes.length} completed
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage} 
                sx={{ height: 8, borderRadius: 1 }}
              />
              {errorCount > 0 && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {errorCount} scene{errorCount > 1 ? 's' : ''} failed
                </Typography>
              )}
            </Box>

            {/* Scene List */}
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {story.scenes.map((scene, index) => {
                const sceneProgress = progress.get(scene.id);
                const status = sceneProgress?.status || 'pending';
                
                return (
                  <ListItem
                    key={scene.id}
                    sx={{
                      bgcolor: index === currentSceneIndex && isGenerating 
                        ? 'action.selected' 
                        : 'transparent',
                      borderRadius: 1,
                      mb: 0.5
                    }}
                  >
                    <ListItemIcon>
                      {getStatusIcon(status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {index + 1}. {scene.title}
                          </Typography>
                          <Chip 
                            label={status} 
                            size="small" 
                            color={getStatusColor(status)}
                          />
                        </Box>
                      }
                      secondary={
                        sceneProgress?.error && (
                          <Typography variant="caption" color="error">
                            Error: {sceneProgress.error}
                          </Typography>
                        )
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isGenerating}>
          {progress.size > 0 && !isGenerating ? 'Close' : 'Cancel'}
        </Button>
        
        {!isGenerating && progress.size === 0 && (
          <Button 
            onClick={handleStart} 
            variant="contained" 
            color="primary"
          >
            Start Generation
          </Button>
        )}
        
        {isGenerating && (
          <Button 
            onClick={handleStop} 
            variant="outlined" 
            color="error"
          >
            Stop
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

