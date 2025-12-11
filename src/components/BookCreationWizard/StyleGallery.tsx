import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Fade
} from '@mui/material';
import {
  Add as AddIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { StyleImageCard } from './StyleImageCard';
import { StyleRefinementPanel } from './StyleRefinementPanel';
import { useStyleRefinement } from '../../hooks/useStyleRefinement';
import type { StyleOption } from '../../types/Wizard';

/**
 * Props for StyleGallery component
 */
export interface StyleGalleryProps {
  /** Book concept for generating styles */
  concept: string;
  
  /** Optional style preferences from user */
  preferences?: string;
  
  /** Aspect ratio for generated images */
  aspectRatio?: string;
  
  /** Callback when style is confirmed */
  onStyleConfirmed?: (styleOption: StyleOption) => void;
  
  /** Whether to auto-generate styles on mount */
  autoGenerate?: boolean;
}

/**
 * StyleGallery Component
 * 
 * Displays a gallery of style options and handles style selection and refinement.
 * 
 * Features:
 * - Grid layout of StyleImageCard components
 * - Generate initial styles on mount
 * - Handle style selection
 * - Show StyleRefinementPanel when style selected
 * - Loading state (generating initial styles)
 * - Error handling (generation failures)
 * - "Generate More Options" button (optional)
 * - Responsive grid (1-3 columns based on screen size)
 * - Accessible navigation
 */
export const StyleGallery: React.FC<StyleGalleryProps> = ({
  concept,
  preferences,
  aspectRatio = '3:4',
  onStyleConfirmed,
  autoGenerate = true
}) => {
  const {
    refinementState,
    generateInitialStyles,
    selectStyle,
    refineStyle,
    confirmStyle,
    isGenerating,
    error
  } = useStyleRefinement();
  
  const [hasGenerated, setHasGenerated] = useState(false);
  
  /**
   * Generate initial styles on mount if autoGenerate is true
   */
  useEffect(() => {
    if (autoGenerate && !hasGenerated && concept) {
      handleGenerateStyles();
    }
  }, [autoGenerate, concept, hasGenerated]);
  
  /**
   * Handle generating initial style options
   */
  const handleGenerateStyles = async () => {
    try {
      await generateInitialStyles(concept, preferences, aspectRatio);
      setHasGenerated(true);
    } catch (err) {
      console.error('Failed to generate styles:', err);
    }
  };
  
  /**
   * Handle style card selection
   */
  const handleStyleSelect = (styleOption: StyleOption) => {
    selectStyle(styleOption.id);
  };
  
  /**
   * Handle style refinement
   */
  const handleRefine = async (feedback: string) => {
    try {
      await refineStyle(feedback, concept, aspectRatio);
    } catch (err) {
      console.error('Failed to refine style:', err);
    }
  };
  
  /**
   * Handle regenerate with current prompt
   */
  const handleRegenerate = async () => {
    if (!refinementState.selectedOption) return;
    
    try {
      // Use empty feedback to regenerate with same prompt
      await refineStyle('regenerate with same prompt', concept, aspectRatio);
    } catch (err) {
      console.error('Failed to regenerate:', err);
    }
  };
  
  /**
   * Handle style confirmation
   */
  const handleConfirm = () => {
    const finalStyle = confirmStyle();
    if (finalStyle && onStyleConfirmed) {
      onStyleConfirmed(finalStyle);
    }
  };
  
  /**
   * Handle back to gallery (deselect style)
   */
  const handleBackToGallery = () => {
    selectStyle(''); // Deselect by passing empty string
  };
  
  // Show loading state while generating initial styles
  if (isGenerating && !hasGenerated) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 3
        }}
        role="status"
        aria-label="Generating style options"
      >
        <CircularProgress size={60} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Generating Style Options
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Creating 3-5 unique visual styles based on your concept...
          </Typography>
        </Box>
      </Box>
    );
  }
  
  // Show error state if generation failed
  if (error && !hasGenerated) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 2
        }}
        role="alert"
      >
        <Alert
          severity="error"
          sx={{ maxWidth: 600 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleGenerateStyles}
              aria-label="Retry generating styles"
            >
              Retry
            </Button>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            Failed to Generate Styles
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }
  
  // Show refinement panel if a style is selected
  if (refinementState.selectedOption) {
    return (
      <Fade in timeout={300}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: 2
          }}
        >
          {/* Back button */}
          <Button
            variant="outlined"
            onClick={handleBackToGallery}
            sx={{ alignSelf: 'flex-start' }}
            aria-label="Back to style gallery"
          >
            ← Back to Gallery
          </Button>
          
          {/* Refinement panel */}
          <StyleRefinementPanel
            selectedStyle={refinementState.selectedOption}
            refinementHistory={refinementState.refinementHistory}
            isRefining={refinementState.isRefining}
            error={error}
            onRefine={handleRefine}
            onConfirm={handleConfirm}
            onRegenerate={handleRegenerate}
          />
        </Box>
      </Fade>
    );
  }
  
  // Show style gallery
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}
      role="region"
      aria-label="Style gallery"
    >
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h5" component="h2">
            Choose Your Visual Style
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Select a style that matches your vision. You can refine it further after selection.
        </Typography>
      </Box>
      
      {/* Error display (for refinement errors) */}
      {error && (
        <Alert severity="error" onClose={() => {}}>
          {error}
        </Alert>
      )}
      
      {/* Style cards grid */}
      <Grid
        container
        spacing={3}
        sx={{
          '& > *': {
            display: 'flex'
          }
        }}
      >
        {refinementState.initialOptions.map((styleOption) => (
          <Grid
            size={{ xs: 12, sm: 6, md: 4 }}
            key={styleOption.id}
          >
            <StyleImageCard
              styleOption={styleOption}
              isSelected={false}
              onSelect={handleStyleSelect}
            />
          </Grid>
        ))}
      </Grid>
      
      {/* Generate more options button */}
      {refinementState.initialOptions.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: 'action.hover',
            border: 1,
            borderColor: 'divider',
            borderStyle: 'dashed'
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Don't see what you're looking for?
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleGenerateStyles}
            disabled={isGenerating}
            aria-label="Generate more style options"
          >
            {isGenerating ? 'Generating...' : 'Generate More Options'}
          </Button>
        </Paper>
      )}
      
      {/* Empty state (shouldn't normally show) */}
      {refinementState.initialOptions.length === 0 && !isGenerating && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Styles Generated Yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleGenerateStyles}
            sx={{ mt: 2 }}
            aria-label="Generate initial styles"
          >
            Generate Styles
          </Button>
        </Box>
      )}
    </Box>
  );
};
