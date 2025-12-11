import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Collapse,
  IconButton,
  Box,
  Skeleton,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import type { StyleOption } from '../../types/Wizard';

/**
 * Props for StyleImageCard component
 */
export interface StyleImageCardProps {
  /** Style option to display */
  styleOption?: StyleOption;
  
  /** Whether this style is currently selected */
  isSelected?: boolean;
  
  /** Whether the image is still loading */
  isLoading?: boolean;
  
  /** Error message if generation failed */
  error?: string;
  
  /** Callback when select button is clicked */
  onSelect?: (styleOption: StyleOption) => void;
}

/**
 * StyleImageCard Component
 * 
 * Displays a generated style image with its details and selection controls.
 * 
 * Features:
 * - Display generated style image
 * - Show style name/description
 * - Collapsible prompt text section
 * - Select button
 * - Selected state (highlighted border)
 * - Loading state (skeleton)
 * - Error state (failed to generate)
 * - Hover effects
 * - Responsive sizing
 * - Accessible with proper labels
 */
export const StyleImageCard: React.FC<StyleImageCardProps> = ({
  styleOption,
  isSelected = false,
  isLoading = false,
  error,
  onSelect
}) => {
  const [promptExpanded, setPromptExpanded] = useState(false);
  
  /**
   * Handle expand/collapse of prompt section
   */
  const handleExpandClick = () => {
    setPromptExpanded(!promptExpanded);
  };
  
  /**
   * Handle select button click
   */
  const handleSelectClick = () => {
    if (styleOption && onSelect) {
      onSelect(styleOption);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        role="status"
        aria-label="Loading style option"
      >
        <Skeleton
          variant="rectangular"
          height={240}
          animation="wave"
        />
        <CardContent>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
        </CardContent>
        <CardActions>
          <Skeleton variant="rectangular" width={100} height={36} />
        </CardActions>
      </Card>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderColor: 'error.main',
          borderWidth: 2,
          borderStyle: 'solid'
        }}
        role="alert"
        aria-label="Failed to generate style"
      >
        <Box
          sx={{
            height: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'error.light',
            color: 'error.contrastText'
          }}
        >
          <ErrorIcon sx={{ fontSize: 64, opacity: 0.5 }} />
        </Box>
        <CardContent sx={{ flexGrow: 1 }}>
          <Alert severity="error" sx={{ mb: 1 }}>
            Failed to generate
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  // No style option provided
  if (!styleOption) {
    return null;
  }
  
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isSelected ? 3 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        borderStyle: 'solid',
        transition: 'all 0.3s ease',
        position: 'relative',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)'
        }
      }}
      role="article"
      aria-label={`Style option: ${styleOption.name}`}
      aria-selected={isSelected}
    >
      {/* Selected indicator */}
      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            bgcolor: 'primary.main',
            borderRadius: '50%',
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Selected"
        >
          <CheckCircleIcon sx={{ color: 'primary.contrastText', fontSize: 24 }} />
        </Box>
      )}
      
      {/* Style image */}
      <CardMedia
        component="img"
        height="240"
        image={styleOption.imageUrl}
        alt={`${styleOption.name} style preview`}
        sx={{
          objectFit: 'cover',
          bgcolor: 'action.hover'
        }}
      />
      
      {/* Style details */}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: isSelected ? 600 : 400
          }}
        >
          {styleOption.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {styleOption.style.artStyle}
        </Typography>
        
        {styleOption.style.colorPalette && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Colors: {styleOption.style.colorPalette}
          </Typography>
        )}
      </CardContent>
      
      {/* Collapsible prompt section */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
            borderTop: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
            Prompt Details
          </Typography>
          <IconButton
            onClick={handleExpandClick}
            aria-expanded={promptExpanded}
            aria-label="Show prompt details"
            size="small"
            sx={{
              transform: promptExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        
        <Collapse in={promptExpanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ pt: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                bgcolor: 'action.hover',
                p: 1,
                borderRadius: 1,
                maxHeight: 200,
                overflow: 'auto'
              }}
            >
              {styleOption.prompt}
            </Typography>
          </CardContent>
        </Collapse>
      </Box>
      
      {/* Actions */}
      <CardActions sx={{ p: 2, pt: 1 }}>
        <Button
          variant={isSelected ? 'contained' : 'outlined'}
          color="primary"
          fullWidth
          onClick={handleSelectClick}
          disabled={isSelected}
          aria-label={isSelected ? 'Style selected' : `Select ${styleOption.name} style`}
        >
          {isSelected ? 'Selected' : 'Select Style'}
        </Button>
      </CardActions>
    </Card>
  );
};
