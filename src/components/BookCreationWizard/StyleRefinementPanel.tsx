import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Card,
  CardMedia,
  Grid,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  CompareArrows as CompareArrowsIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import type { StyleOption, RefinementIteration } from '../../types/Wizard';

/**
 * Props for StyleRefinementPanel component
 */
export interface StyleRefinementPanelProps {
  /** Currently selected style option */
  selectedStyle: StyleOption;
  
  /** Refinement history */
  refinementHistory?: RefinementIteration[];
  
  /** Whether refinement is in progress */
  isRefining?: boolean;
  
  /** Error message if refinement failed */
  error?: string | null;
  
  /** Callback when user provides refinement feedback */
  onRefine?: (feedback: string) => void;
  
  /** Callback when user confirms the final style */
  onConfirm?: () => void;
  
  /** Callback when user wants to regenerate with current prompt */
  onRegenerate?: () => void;
}

/**
 * StyleRefinementPanel Component
 * 
 * Interface for refining a selected visual style through iterative feedback.
 * 
 * Features:
 * - Large preview of selected style image
 * - Editable prompt text area
 * - Refinement conversation input
 * - "Regenerate" button
 * - Refinement history display
 * - Side-by-side comparison view (current vs previous)
 * - Loading state during generation
 * - Error handling
 * - "Confirm Style" button
 * - Responsive layout
 * - Accessible controls
 */
export const StyleRefinementPanel: React.FC<StyleRefinementPanelProps> = ({
  selectedStyle,
  refinementHistory = [],
  isRefining = false,
  error = null,
  onRefine,
  onConfirm,
  onRegenerate
}) => {
  const [refinementFeedback, setRefinementFeedback] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  // Get current and previous images for comparison
  const currentImage = refinementHistory.length > 0
    ? refinementHistory[refinementHistory.length - 1].generatedImages[0]
    : { url: selectedStyle.imageUrl, prompt: selectedStyle.prompt };
  
  const previousImage = refinementHistory.length > 1
    ? refinementHistory[refinementHistory.length - 2].generatedImages[0]
    : { url: selectedStyle.imageUrl, prompt: selectedStyle.prompt };
  
  const hasRefinements = refinementHistory.length > 0;
  const hasPreviousImage = refinementHistory.length > 1;
  
  /**
   * Handle sending refinement feedback
   */
  const handleSendFeedback = () => {
    const trimmedFeedback = refinementFeedback.trim();
    if (trimmedFeedback && onRefine && !isRefining) {
      onRefine(trimmedFeedback);
      setRefinementFeedback('');
    }
  };
  
  /**
   * Handle key down in feedback input
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendFeedback();
    }
  };
  
  /**
   * Handle regenerate button click
   */
  const handleRegenerate = () => {
    if (onRegenerate && !isRefining) {
      onRegenerate();
    }
  };
  
  /**
   * Handle confirm button click
   */
  const handleConfirm = () => {
    if (onConfirm && !isRefining) {
      onConfirm();
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: 2
      }}
      role="region"
      aria-label="Style refinement panel"
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h2">
          Refine Your Style
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Comparison toggle */}
          {hasPreviousImage && (
            <Tooltip title="Compare with previous">
              <IconButton
                onClick={() => setShowComparison(!showComparison)}
                color={showComparison ? 'primary' : 'default'}
                aria-label="Toggle comparison view"
                aria-pressed={showComparison}
              >
                <CompareArrowsIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {/* History toggle */}
          {hasRefinements && (
            <Tooltip title="View refinement history">
              <IconButton
                onClick={() => setShowHistory(!showHistory)}
                color={showHistory ? 'primary' : 'default'}
                aria-label="Toggle refinement history"
                aria-pressed={showHistory}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      {/* Error display */}
      {error && (
        <Alert
          severity="error"
          onClose={() => {}}
          sx={{ mb: 1 }}
          role="alert"
        >
          {error}
        </Alert>
      )}
      
      {/* Image preview section */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}
      >
        {/* Comparison view */}
        {showComparison && hasPreviousImage ? (
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Previous
              </Typography>
              <Card>
                <CardMedia
                  component="img"
                  image={previousImage.url}
                  alt="Previous style iteration"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 400,
                    objectFit: 'contain'
                  }}
                />
              </Card>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Current
              </Typography>
              <Card>
                <CardMedia
                  component="img"
                  image={currentImage.url}
                  alt="Current style"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 400,
                    objectFit: 'contain'
                  }}
                />
              </Card>
            </Box>
          </Box>
        ) : (
          /* Single image view */
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 2,
              position: 'relative'
            }}
          >
            {isRefining && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 1,
                  borderRadius: 1
                }}
                role="status"
                aria-label="Generating refined image"
              >
                <CircularProgress size={60} />
              </Box>
            )}
            <img
              src={currentImage.url}
              alt="Selected style preview"
              style={{
                maxWidth: '100%',
                maxHeight: '500px',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
          </Box>
        )}
        
        {/* Prompt editor section */}
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Current Prompt
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowPromptEditor(!showPromptEditor)}
              aria-expanded={showPromptEditor}
              aria-label="Toggle prompt editor"
              sx={{
                transform: showPromptEditor ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          
          <Collapse in={showPromptEditor}>
            <TextField
              fullWidth
              multiline
              minRows={4}
              maxRows={8}
              value={currentImage.prompt}
              InputProps={{
                readOnly: true,
                sx: {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }
              }}
              sx={{ mb: 2 }}
              aria-label="Current prompt text"
            />
          </Collapse>
          
          {!showPromptEditor && (
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'text.secondary',
                bgcolor: 'action.hover',
                p: 1,
                borderRadius: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentImage.prompt}
            </Typography>
          )}
        </Box>
      </Paper>
      
      {/* Refinement history */}
      <Collapse in={showHistory}>
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Refinement History ({refinementHistory.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {refinementHistory.map((iteration, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  pb: 2,
                  borderBottom: index < refinementHistory.length - 1 ? 1 : 0,
                  borderColor: 'divider'
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Iteration {index + 1} - {new Date(iteration.timestamp).toLocaleTimeString()}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>Feedback:</strong> {iteration.userFeedback}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Collapse>
      
      {/* Refinement input section */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Refine This Style
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Describe how you'd like to adjust the style (e.g., "make it more cartoonish", "use warmer colors")
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            value={refinementFeedback}
            onChange={(e) => setRefinementFeedback(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your refinement feedback..."
            disabled={isRefining}
            aria-label="Refinement feedback input"
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRegenerate}
            disabled={isRefining}
            aria-label="Regenerate with current prompt"
          >
            Regenerate
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSendFeedback}
              disabled={isRefining || !refinementFeedback.trim()}
              aria-label="Apply refinement feedback"
            >
              {isRefining ? 'Refining...' : 'Refine'}
            </Button>
            
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleConfirm}
              disabled={isRefining}
              aria-label="Confirm and use this style"
            >
              Confirm Style
            </Button>
          </Box>
        </Box>
        
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          Press <strong>Enter</strong> to refine, <strong>Shift+Enter</strong> for new line
        </Typography>
      </Paper>
    </Box>
  );
};
