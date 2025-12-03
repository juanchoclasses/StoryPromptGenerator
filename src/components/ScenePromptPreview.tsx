import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import type { Scene, Story } from '../types/Story';
import type { Character } from '../models/Story';
import { SceneImageGenerationService } from '../services/SceneImageGenerationService';

export interface ScenePromptPreviewProps {
  /** Current scene for prompt generation */
  scene: Scene;
  /** Parent story for context */
  story: Story;
  /** Active book for book-level characters and style */
  activeBook: any | null;
  /** Available characters for prompt */
  availableCharacters: (Character & { isBookLevel?: boolean })[];
  /** Available elements for prompt */
  availableElements: Array<{ name: string; description: string; category?: string }>;
  /** Selected character names */
  selectedCharacters: string[];
  /** Selected element IDs */
  selectedElements: string[];
  /** Text panel content */
  textPanelContent: string;
  /** Callback to insert macro into text panel */
  onInsertMacro: (macro: string) => void;
}

/**
 * ScenePromptPreview Component
 * 
 * Displays the generated AI prompt for a scene and provides:
 * - Prompt generation from scene data
 * - Copy to clipboard functionality
 * - Macro insertion buttons
 * - Success/error notifications
 */
export const ScenePromptPreview: React.FC<ScenePromptPreviewProps> = ({
  scene,
  story,
  activeBook,
  availableCharacters,
  availableElements,
  selectedCharacters,
  selectedElements,
  textPanelContent,
  onInsertMacro
}) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Generate prompt whenever dependencies change
  const prompt = useMemo(() => {
    if (!scene || !story) return '';

    try {
      // Filter selected characters
      const selectedCast = availableCharacters.filter(char =>
        selectedCharacters.includes(char.name)
      );

      // Filter selected elements
      const selectedElementsList = availableElements.filter(elem =>
        selectedElements.includes(elem.name)
      );

      // Build prompt using the service
      return SceneImageGenerationService.buildScenePrompt(
        scene,
        story,
        activeBook,
        selectedCast,
        selectedElementsList
      );
    } catch (error) {
      console.error('Error generating prompt:', error);
      return 'Error generating prompt';
    }
  }, [scene, story, activeBook, availableCharacters, availableElements, selectedCharacters, selectedElements]);

  // Handle copy to clipboard
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setSnackbarMessage('Prompt copied to clipboard!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      setSnackbarMessage('Failed to copy prompt');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle macro insertion
  const handleInsertMacro = (macro: string) => {
    onInsertMacro(macro);
    setSnackbarMessage(`Macro ${macro} inserted`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  return (
    <>
      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <CodeIcon color="action" />
            <Typography variant="h6">
              AI Prompt Preview
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="body2" color="text.secondary">
                This is the prompt that will be sent to the AI image generation service
              </Typography>
              <Box display="flex" gap={1}>
                <Tooltip title="Insert Scene Description macro">
                  <Button
                    size="small"
                    startIcon={<CodeIcon />}
                    onClick={() => handleInsertMacro('{SceneDescription}')}
                    variant="outlined"
                  >
                    {'{SceneDescription}'}
                  </Button>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<CopyIcon />}
                  onClick={handleCopyPrompt}
                  disabled={!prompt || prompt === 'Error generating prompt'}
                >
                  Copy Prompt
                </Button>
              </Box>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                border: 1,
                borderColor: 'grey.300',
                maxHeight: '300px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {prompt || 'No prompt generated yet'}
            </Paper>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
