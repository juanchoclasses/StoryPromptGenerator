import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  TheaterComedy as TheaterComedyIcon,
  ArrowUpward as ArrowUpwardIcon
} from '@mui/icons-material';
import type { Character } from '../models/Story';
import type { Story } from '../types/Story';
import type { Book } from '../models/Book';
import { BookService } from '../services/BookService';
import { CharacterAuditionDialog } from './CharacterAuditionDialog';
import { useCharacterManager } from '../hooks/useCharacterManager';

interface CastManagerProps {
  story: Story | null;
  onStoryUpdate: () => void;
}

export const CastManager: React.FC<CastManagerProps> = ({ story, onStoryUpdate }) => {
  // Load active book for character management and audition dialog
  const [activeBook, setActiveBook] = useState<Book | null>(null);

  // Promote to Book state (story-level specific)
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    loadActiveBook();
  }, []);

  const loadActiveBook = async () => {
    try {
      const bookId = await BookService.getActiveBookId();
      if (bookId) {
        const book = await BookService.getBook(bookId);
        setActiveBook(book);
      }
    } catch (error) {
      console.error('Failed to load active book:', error);
    }
  };

  // Use the character manager hook
  const {
    characters,
    openDialog,
    editingCharacter,
    characterName,
    characterDescription,
    openAuditionDialog,
    auditionCharacter,
    setCharacterName,
    setCharacterDescription,
    handleAddCharacter,
    handleEditCharacter,
    handleSaveCharacter,
    handleDeleteCharacter,
    handleCloseDialog,
    handleOpenAudition,
    handleCloseAudition,
    handleAuditionUpdate,
  } = useCharacterManager({
    type: 'story',
    book: activeBook,
    storyId: story?.id,
    onUpdate: onStoryUpdate,
  });

  // Story-level specific: Promote character to book
  const handlePromoteToBook = async (character: Character) => {
    if (!story || !activeBook) return;

    if (!window.confirm(
      `Promote "${character.name}" to book level?\n\n` +
      `This character will become available to all stories in "${activeBook.title}".`
    )) {
      return;
    }

    setPromoting(true);
    try {
      const result = await BookService.promoteCharacterToBook(activeBook.id, story.id, character.name);
      
      if (result.success) {
        console.log(`✓ Successfully promoted "${character.name}" to book level`);
        // Refresh the story data
        onStoryUpdate();
      } else {
        alert(`Failed to promote character: ${result.error}`);
      }
    } catch (error) {
      console.error('Error promoting character:', error);
      alert(`Error promoting character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPromoting(false);
    }
  };

  // Check if there's a selected story
  if (!story) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a story to manage characters
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 200px)', 
      maxHeight: 'calc(100vh - 200px)',
      overflow: 'hidden'
    }}>
      {/* Fixed Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon color="primary" />
            <Typography variant="h5" component="h2">
              Cast of Characters ({characters.length})
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCharacter}
          >
            Add Character
          </Button>
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 3,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#a8a8a8',
        },
      }}>
        {characters.length === 0 ? (
          <Box textAlign="center" py={4}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No characters yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Add characters to your book's cast to use them in scenes across all stories
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddCharacter}
            >
              Add Your First Character
            </Button>
          </Box>
        ) : (
          <Box>
            {characters.map((character) => (
              <Accordion key={character.name} sx={{ mb: 1 }}>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ 
                    '& .MuiAccordionSummary-content': {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%'
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6">
                      {character.name}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Character Audition - Generate images">
                      <IconButton
                        component="div"
                        onClick={() => handleOpenAudition(character)}
                        color="primary"
                        size="small"
                      >
                        <TheaterComedyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Promote to book-level character">
                      <IconButton
                        component="div"
                        onClick={() => handlePromoteToBook(character)}
                        size="small"
                        disabled={promoting}
                      >
                        <ArrowUpwardIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit character">
                      <IconButton
                        component="div"
                        onClick={() => handleEditCharacter(character)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete character">
                      <IconButton
                        component="div"
                        onClick={() => handleDeleteCharacter(character.name)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {character.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>

      {/* Character Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCharacter ? 'Edit Character' : 'Add New Character'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Character Name"
            fullWidth
            variant="outlined"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Enter character name..."
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Character Description"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={characterDescription}
            onChange={(e) => setCharacterDescription(e.target.value)}
            placeholder="Describe the character's personality, appearance, background..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveCharacter} variant="contained" disabled={!characterName.trim()}>
            {editingCharacter ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Character Audition Dialog */}
      {auditionCharacter && activeBook && story && (
        <CharacterAuditionDialog
          open={openAuditionDialog}
          character={auditionCharacter}
          storyId={story.id}
          storyBackgroundSetup={story.backgroundSetup}
          book={activeBook}
          onClose={handleCloseAudition}
          onUpdate={handleAuditionUpdate}
        />
      )}
    </Paper>
  );
}; 