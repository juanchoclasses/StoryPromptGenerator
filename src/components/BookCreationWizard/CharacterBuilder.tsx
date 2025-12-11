import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { ConversationView } from './ConversationView';
import type { CharacterProfile, Message } from '../../types/Wizard';
import type { BookStyle } from '../../types/BookStyle';
import { v4 as uuidv4 } from 'uuid';

/**
 * Props for CharacterBuilder component
 */
export interface CharacterBuilderProps {
  /** Number of characters to create */
  characterCount: number;
  /** Book concept for context */
  bookConcept: string;
  /** Book style for visual consistency */
  bookStyle: BookStyle;
  /** Existing characters (for editing) */
  existingCharacters?: CharacterProfile[];
  /** Callback when character is confirmed */
  onCharacterConfirmed: (character: CharacterProfile, index: number) => void;
  /** Callback to generate character details */
  onGenerateDetails: (
    name: string,
    role: string,
    basicDescription: string,
    existingCharacters: Array<{ name: string; description: string }>
  ) => Promise<CharacterProfile>;
  /** Callback to refine character description */
  onRefineDescription: (
    character: CharacterProfile,
    feedback: string
  ) => Promise<CharacterProfile>;
  /** Callback to detect characters from conversation */
  onDetectCharacters?: () => Promise<void>;
}

/**
 * CharacterBuilder Component
 * 
 * Step-by-step character creation interface with AI-powered description generation.
 * 
 * Features:
 * - Character counter display
 * - Form fields for basic info (name, role, description)
 * - "Generate Details" button for AI-powered descriptions
 * - Refinement conversation for descriptions
 * - Navigation between characters
 * - List of completed characters
 * - Edit completed characters
 * - Loading states
 * - Error handling
 * - Responsive layout
 * - Accessible form controls
 */
export const CharacterBuilder: React.FC<CharacterBuilderProps> = ({
  characterCount,
  bookConcept,
  bookStyle,
  existingCharacters = [],
  onCharacterConfirmed,
  onGenerateDetails,
  onRefineDescription,
  onDetectCharacters
}) => {
  // Current character being edited
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Form state for current character
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [basicDescription, setBasicDescription] = useState('');
  
  // Generated character profile
  const [generatedProfile, setGeneratedProfile] = useState<CharacterProfile | null>(null);
  
  // Refinement conversation
  const [refinementMessages, setRefinementMessages] = useState<Message[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  
  // Completed characters
  const [completedCharacters, setCompletedCharacters] = useState<CharacterProfile[]>(
    existingCharacters
  );
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);

  // Sync existingCharacters prop with local completedCharacters state
  useEffect(() => {
    if (existingCharacters && existingCharacters.length > 0) {
      setCompletedCharacters(existingCharacters);
    }
  }, [existingCharacters]);

  // Load character data when index changes
  useEffect(() => {
    if (completedCharacters[currentIndex]) {
      const character = completedCharacters[currentIndex];
      setName(character.name);
      setRole(''); // Role not stored in CharacterProfile
      setBasicDescription(character.description);
      setGeneratedProfile(character);
      setShowRefinement(true); // Show refinement view for existing characters
      
      // Add initial system message for existing character
      const systemMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: 'You can refine this character description by providing feedback below, or confirm to continue.',
        timestamp: new Date()
      };
      setRefinementMessages([systemMessage]);
    } else {
      // Reset form for new character
      setName('');
      setRole('');
      setBasicDescription('');
      setGeneratedProfile(null);
      setShowRefinement(false);
      setRefinementMessages([]);
    }
    setError(null);
  }, [currentIndex, completedCharacters]);

  // Handle generate details
  const handleGenerateDetails = async () => {
    if (!name.trim()) {
      setError('Please enter a character name');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const existingChars = completedCharacters.map(c => ({
        name: c.name,
        description: c.description
      }));

      const profile = await onGenerateDetails(
        name.trim(),
        role.trim() || 'Character',
        basicDescription.trim(),
        existingChars
      );

      setGeneratedProfile(profile);
      setShowRefinement(true);
      
      // Add initial system message
      const systemMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: 'Character details generated! You can refine the description by providing feedback below, or confirm to continue.',
        timestamp: new Date()
      };
      setRefinementMessages([systemMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate character details');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle refinement message
  const handleRefinementMessage = async (feedback: string) => {
    if (!generatedProfile) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: feedback,
      timestamp: new Date()
    };
    setRefinementMessages(prev => [...prev, userMessage]);

    setIsRefining(true);
    setError(null);

    try {
      const refinedProfile = await onRefineDescription(generatedProfile, feedback);
      setGeneratedProfile(refinedProfile);

      // Add assistant message
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `Updated character description:\n\n${refinedProfile.description}\n\n**Visual Details:**\n- Appearance: ${refinedProfile.visualDetails.appearance}\n- Clothing: ${refinedProfile.visualDetails.clothing}\n- Distinctive Features: ${refinedProfile.visualDetails.distinctiveFeatures}`,
        timestamp: new Date()
      };
      setRefinementMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine character description');
    } finally {
      setIsRefining(false);
    }
  };

  // Handle confirm character
  const handleConfirmCharacter = () => {
    if (!generatedProfile) {
      setError('Please generate character details first');
      return;
    }

    // Update completed characters
    const updatedCharacters = [...completedCharacters];
    updatedCharacters[currentIndex] = generatedProfile;
    setCompletedCharacters(updatedCharacters);

    // Notify parent
    onCharacterConfirmed(generatedProfile, currentIndex);

    // Move to next character or stay on last
    if (currentIndex < characterCount - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Handle navigation
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < characterCount - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Handle edit character
  const handleEditCharacter = (index: number) => {
    setCurrentIndex(index);
  };

  // Handle detect characters
  const handleDetectCharacters = async () => {
    if (!onDetectCharacters) return;

    setIsDetecting(true);
    setError(null);

    try {
      await onDetectCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect characters');
    } finally {
      setIsDetecting(false);
    }
  };

  // Check if current character is completed
  const isCurrentCompleted = !!completedCharacters[currentIndex];
  const allCompleted = completedCharacters.length === characterCount;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        gap: 2,
        overflow: 'hidden'
      }}
    >
      {/* Main character form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Character {currentIndex + 1} of {characterCount}
            </Typography>
            
            {onDetectCharacters && completedCharacters.length === 0 && (
              <Button
                variant="outlined"
                onClick={handleDetectCharacters}
                disabled={isDetecting}
                startIcon={isDetecting ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                size="small"
                aria-label="Detect characters from conversation"
              >
                {isDetecting ? 'Detecting...' : 'Detect Characters'}
              </Button>
            )}
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Character images can be generated after book creation using the Character Audition feature.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Box>

        {/* Form or refinement view */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
          {!showRefinement ? (
            // Basic info form
            <Stack spacing={2}>
              <TextField
                label="Character Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                disabled={isGenerating}
                autoFocus
                inputProps={{
                  'aria-label': 'Character name',
                  'aria-required': 'true'
                }}
              />

              <TextField
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                fullWidth
                disabled={isGenerating}
                placeholder="e.g., protagonist, mentor, antagonist"
                helperText="Optional: Character's role in the story"
                inputProps={{
                  'aria-label': 'Character role'
                }}
              />

              <TextField
                label="Basic Description"
                value={basicDescription}
                onChange={(e) => setBasicDescription(e.target.value)}
                multiline
                rows={4}
                fullWidth
                disabled={isGenerating}
                placeholder="Describe the character's personality, background, or key traits..."
                helperText="Optional: Provide context for AI to generate detailed visual description"
                inputProps={{
                  'aria-label': 'Basic character description'
                }}
              />

              <Button
                variant="contained"
                onClick={handleGenerateDetails}
                disabled={isGenerating || !name.trim()}
                startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                fullWidth
                size="large"
                aria-label="Generate character details with AI"
              >
                {isGenerating ? 'Generating Details...' : 'Generate Details'}
              </Button>
            </Stack>
          ) : (
            // Refinement view
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Generated profile display */}
              {generatedProfile && (
                <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
                  <Typography variant="h6" gutterBottom>
                    {generatedProfile.name}
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {generatedProfile.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Visual Details:
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    <strong>Appearance:</strong> {generatedProfile.visualDetails.appearance}
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    <strong>Clothing:</strong> {generatedProfile.visualDetails.clothing}
                  </Typography>
                  
                  <Typography variant="body2">
                    <strong>Distinctive Features:</strong> {generatedProfile.visualDetails.distinctiveFeatures}
                  </Typography>
                </Paper>
              )}

              {/* Refinement conversation */}
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ConversationView
                  messages={refinementMessages}
                  isProcessing={isRefining}
                  onSendMessage={handleRefinementMessage}
                  error={error}
                  placeholder="Describe how you'd like to refine this character..."
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Footer with navigation and confirm */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
            alignItems: 'center'
          }}
        >
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            startIcon={<ArrowBackIcon />}
            aria-label="Previous character"
          >
            Previous
          </Button>

          <Box sx={{ flex: 1 }} />

          {showRefinement && (
            <Button
              variant="contained"
              onClick={handleConfirmCharacter}
              startIcon={<CheckIcon />}
              disabled={!generatedProfile}
              aria-label="Confirm character"
            >
              Confirm Character
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={currentIndex === characterCount - 1}
            endIcon={<ArrowForwardIcon />}
            aria-label="Next character"
          >
            Next
          </Button>
        </Box>
      </Box>

      {/* Sidebar with completed characters */}
      <Paper
        sx={{
          width: 280,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        elevation={2}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Characters
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completedCharacters.length} of {characterCount} completed
          </Typography>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto' }}>
          {Array.from({ length: characterCount }).map((_, index) => {
            const character = completedCharacters[index];
            const isCompleted = !!character;
            const isCurrent = index === currentIndex;

            return (
              <React.Fragment key={index}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    isCompleted && (
                      <IconButton
                        edge="end"
                        onClick={() => handleEditCharacter(index)}
                        size="small"
                        aria-label={`Edit character ${index + 1}`}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemButton
                    selected={isCurrent}
                    onClick={() => handleEditCharacter(index)}
                    aria-label={`Character ${index + 1}${character ? `: ${character.name}` : ''}`}
                    aria-current={isCurrent ? 'true' : 'false'}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {character ? character.name : `Character ${index + 1}`}
                          </Typography>
                          {isCompleted && (
                            <Chip
                              icon={<CheckIcon />}
                              label="Done"
                              size="small"
                              color="success"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        character
                          ? character.description.substring(0, 60) + '...'
                          : 'Not started'
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < characterCount - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>

        {allCompleted && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Alert severity="success" icon={<CheckIcon />}>
              All characters completed!
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
