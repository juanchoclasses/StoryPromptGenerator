import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  AutoStories as AutoStoriesIcon,
  Palette as PaletteIcon,
  People as PeopleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import type { WizardBookData, WizardStep } from '../../types/Wizard';

/**
 * Props for SummaryView component
 */
export interface SummaryViewProps {
  /** Book data to display in summary */
  bookData: WizardBookData;
  
  /** Whether book creation is in progress */
  isCreating?: boolean;
  
  /** Error message if book creation failed */
  error?: string | null;
  
  /** Callback to navigate to a specific step for editing */
  onEditSection?: (step: WizardStep) => void;
  
  /** Callback when user confirms and creates the book */
  onCreateBook?: () => void;
  
  /** Optional estimated storage size in bytes */
  estimatedSize?: number;
}

/**
 * SummaryView Component
 * 
 * Displays a comprehensive summary of the book configuration before creation.
 * 
 * Features:
 * - Organized sections for book details, style, and characters
 * - Edit button for each section (returns to that step)
 * - Prominent "Create Book" button
 * - Estimated storage size indicator (optional)
 * - Loading state during book creation
 * - Error handling
 * - Responsive layout
 * - Accessible with proper headings and navigation
 */
export const SummaryView: React.FC<SummaryViewProps> = ({
  bookData,
  isCreating = false,
  error = null,
  onEditSection,
  onCreateBook,
  estimatedSize
}) => {
  /**
   * Format bytes to human-readable size
   */
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  /**
   * Handle edit button click
   */
  const handleEdit = (step: WizardStep) => {
    if (onEditSection) {
      onEditSection(step);
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        pb: 3
      }}
      role="region"
      aria-label="Book summary"
    >
      {/* Header */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CheckCircleIcon color="success" fontSize="large" />
          <Typography variant="h4" component="h1">
            Review Your Book
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Review your book configuration below. You can edit any section before creating your book.
        </Typography>
      </Box>
      
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Failed to Create Book
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      )}
      
      {/* Book Details Section */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoStoriesIcon color="primary" />
            <Typography variant="h5" component="h2">
              Book Details
            </Typography>
          </Box>
          {onEditSection && (
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={() => handleEdit('concept')}
              aria-label="Edit book details"
            >
              Edit
            </Button>
          )}
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Title
            </Typography>
            <Typography variant="h6">
              {bookData.title || 'Untitled Book'}
            </Typography>
          </Box>
          
          {bookData.description && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">
                {bookData.description}
              </Typography>
            </Box>
          )}
          
          {bookData.backgroundSetup && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Background Setup
              </Typography>
              <Typography variant="body1">
                {bookData.backgroundSetup}
              </Typography>
            </Box>
          )}
          
          {bookData.aspectRatio && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Aspect Ratio
              </Typography>
              <Chip label={bookData.aspectRatio} size="small" />
            </Box>
          )}
        </Stack>
      </Paper>
      
      {/* Visual Style Section */}
      {bookData.style && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            position: 'relative'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaletteIcon color="primary" />
              <Typography variant="h5" component="h2">
                Visual Style
              </Typography>
            </Box>
            {onEditSection && (
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEdit('style')}
                aria-label="Edit visual style"
              >
                Edit
              </Button>
            )}
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Stack spacing={2}>
            {/* Style image preview */}
            {bookData.stylePrompt && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Style Prompt
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                    {bookData.stylePrompt}
                  </Typography>
                </CardContent>
              </Card>
            )}
            
            {/* Style properties */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Style Properties
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {bookData.style.artStyle && (
                  <Chip label={`Art: ${bookData.style.artStyle}`} size="small" />
                )}
                {bookData.style.colorPalette && (
                  <Chip label={`Colors: ${bookData.style.colorPalette}`} size="small" />
                )}
                {bookData.style.visualTheme && (
                  <Chip label={`Theme: ${bookData.style.visualTheme}`} size="small" />
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>
      )}
      
      {/* Characters Section */}
      {bookData.characters && bookData.characters.length > 0 && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            position: 'relative'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon color="primary" />
              <Typography variant="h5" component="h2">
                Characters ({bookData.characters.length})
              </Typography>
            </Box>
            {onEditSection && (
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => handleEdit('characters')}
                aria-label="Edit characters"
              >
                Edit
              </Button>
            )}
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <List>
            {bookData.characters.map((character, index) => (
              <React.Fragment key={character.name}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 1
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6" component="h3">
                        {character.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {character.description}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < bookData.characters.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Storage size indicator */}
      {estimatedSize !== undefined && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: 'info.lighter',
            border: 1,
            borderColor: 'info.main'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="info" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Estimated storage size: <strong>{formatSize(estimatedSize)}</strong>
            </Typography>
          </Box>
        </Paper>
      )}
      
      {/* Create Book Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          pt: 2
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={onCreateBook}
          disabled={isCreating || !bookData.title}
          startIcon={isCreating ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          sx={{
            minWidth: 200,
            py: 1.5
          }}
          aria-label={isCreating ? 'Creating book...' : 'Create book'}
        >
          {isCreating ? 'Creating Book...' : 'Create Book'}
        </Button>
      </Box>
    </Box>
  );
};
