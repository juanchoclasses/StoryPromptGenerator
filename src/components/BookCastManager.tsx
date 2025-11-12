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
  AccordionDetails,
  Alert,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  TheaterComedy as TheaterComedyIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import type { Character } from '../models/Story';
import type { Book } from '../models/Book';
import { BookService } from '../services/BookService';
import { CharacterAuditionDialog } from './CharacterAuditionDialog';

interface BookCastManagerProps {
  book: Book | null;
  onBookUpdate: () => void;
}

export const BookCastManager: React.FC<BookCastManagerProps> = ({ book, onBookUpdate }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  
  // Character Audition Dialog state
  const [openAuditionDialog, setOpenAuditionDialog] = useState(false);
  const [auditionCharacter, setAuditionCharacter] = useState<Character | null>(null);

  // Demote dialog state
  const [openDemoteDialog, setOpenDemoteDialog] = useState(false);
  const [demoteCharacter, setDemoteCharacter] = useState<Character | null>(null);
  const [demoteError, setDemoteError] = useState<string | null>(null);
  const [demoteStoriesUsing, setDemoteStoriesUsing] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (book) {
      setCharacters(book.characters || []);
    } else {
      setCharacters([]);
    }
  }, [book]);

  const handleAddCharacter = () => {
    if (!book) return;
    setEditingCharacter(null);
    setCharacterName('');
    setCharacterDescription('');
    setOpenDialog(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setCharacterName(character.name);
    setCharacterDescription(character.description);
    setOpenDialog(true);
  };

  const handleOpenAudition = (character: Character) => {
    setAuditionCharacter(character);
    setOpenAuditionDialog(true);
  };

  const handleCloseAudition = () => {
    setOpenAuditionDialog(false);
    setAuditionCharacter(null);
  };

  const handleAuditionUpdate = async () => {
    // Save changes to book after character images are updated
    console.log('=== BookCastManager: handleAuditionUpdate called ===');
    console.log('Book:', book?.title);
    
    // Simply call the onBookUpdate callback
    // The character images are already saved to filesystem by CharacterAuditionDialog
    // We just need to trigger a refresh in the parent component
    onBookUpdate();
    
    console.log('✓ Book update triggered');
  };

  const handleSaveCharacter = async () => {
    if (!book) return;

    const trimmedName = characterName.trim();
    if (!trimmedName) return;

    try {
      if (editingCharacter) {
        // Edit existing character
        const updatedCharacters = characters.map(c =>
          c.name === editingCharacter.name
            ? { ...c, name: trimmedName, description: characterDescription }
            : c
        );
        book.characters = updatedCharacters;
      } else {
        // Add new character
        book.addCharacter({
          name: trimmedName,
          description: characterDescription,
          imageGallery: []
        });
      }

      // Save book directly
      await BookService.saveBook(book);

      setCharacters(book.characters);
      setOpenDialog(false);
      onBookUpdate();
    } catch (error) {
      console.error('Failed to save character:', error);
      alert(`Failed to save character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteCharacter = async (character: Character) => {
    if (!book) return;
    
    if (!window.confirm(`Delete character "${character.name}"? This will also delete all their audition images.`)) {
      return;
    }

    try {
      // Delete character from book
      book.deleteCharacter(character.name);

      // Save book directly
      await BookService.saveBook(book);

      setCharacters(book.characters);
      onBookUpdate();
    } catch (error) {
      console.error('Failed to delete character:', error);
      alert(`Failed to delete character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleOpenDemote = (character: Character) => {
    setDemoteCharacter(character);
    setDemoteError(null);
    setDemoteStoriesUsing([]);
    setOpenDemoteDialog(true);
  };

  const handleDemoteCharacter = async () => {
    if (!book || !demoteCharacter) return;

    try {
      const result = await BookService.demoteCharacterToStory(book.id, demoteCharacter.name);

      if (result.success) {
        setOpenDemoteDialog(false);
        onBookUpdate();
      } else {
        setDemoteError(result.error || 'Unknown error');
        setDemoteStoriesUsing(result.storiesUsing || []);
      }
    } catch (error) {
      console.error('Failed to demote character:', error);
      setDemoteError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getCharacterUsageInfo = (character: Character): string => {
    if (!book) return '';
    
    const usage = BookService.getCharacterUsageInBook(book, character.name);
    if (usage.storiesUsing.length === 0) {
      return 'Not used in any scenes';
    } else if (usage.storiesUsing.length === 1) {
      return `Used in ${usage.totalSceneCount} scene(s) in "${usage.storiesUsing[0].title}"`;
    } else {
      return `Used in ${usage.totalSceneCount} scene(s) across ${usage.storiesUsing.length} stories`;
    }
  };

  if (!book) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Select a book to manage book-level characters
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Book Characters ({characters.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCharacter}
        >
          Add Character
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Book-level characters are shared across all stories in "{book.title}".
      </Typography>

      {characters.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">
            No book-level characters yet. Add a character or promote one from a story.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {characters.map((character, index) => (
            <Accordion key={index} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  <Typography sx={{ flexGrow: 1 }}>{character.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                    {getCharacterUsageInfo(character)}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {character.description || 'No description'}
                  </Typography>

                  <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                    Images: {character.imageGallery?.length || 0} audition{character.imageGallery?.length !== 1 ? 's' : ''}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Tooltip title="Edit character details">
                      <IconButton size="small" onClick={() => handleEditCharacter(character)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Generate character images">
                      <IconButton size="small" onClick={() => handleOpenAudition(character)}>
                        <TheaterComedyIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Demote to story-level character">
                      <IconButton size="small" onClick={() => handleOpenDemote(character)}>
                        <ArrowDownwardIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete character">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCharacter(character)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Add/Edit Character Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCharacter ? 'Edit Character' : 'Add Book Character'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Character Name"
            fullWidth
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={characterDescription}
            onChange={(e) => setCharacterDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCharacter} variant="contained">
            {editingCharacter ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Demote Character Dialog */}
      <Dialog open={openDemoteDialog} onClose={() => setOpenDemoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Demote Character to Story Level</DialogTitle>
        <DialogContent>
          {demoteError ? (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {demoteError}
              </Alert>
              {demoteStoriesUsing.length > 0 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Character is used in these stories:
                  </Typography>
                  <List dense>
                    {demoteStoriesUsing.map((story) => (
                      <ListItem key={story.id}>
                        <ListItemText primary={story.title} />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    To demote this character, first remove them from all but one story's scenes.
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Typography>
              Demote "{demoteCharacter?.name}" from book level to story level?
              <br /><br />
              The character will be moved to the story where it's currently used.
              If not used in any story, you'll need to specify a target story.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDemoteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDemoteCharacter}
            variant="contained"
            color="primary"
            disabled={!!demoteError}
          >
            Demote
          </Button>
        </DialogActions>
      </Dialog>

      {/* Character Audition Dialog */}
      {auditionCharacter && book && (
        <CharacterAuditionDialog
          open={openAuditionDialog}
          onClose={handleCloseAudition}
          character={auditionCharacter}
          storyId={`book:${book.id}`} // Use book ID prefixed with "book:"
          book={book}
          storyBackgroundSetup={book.backgroundSetup || ''}
          onUpdate={handleAuditionUpdate}
        />
      )}
    </Box>
  );
};

