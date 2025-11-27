import React, { useState } from 'react';
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
import { useCharacterManager } from '../hooks/useCharacterManager';

interface BookCastManagerProps {
  book: Book | null;
  onBookUpdate: () => void;
}

export const BookCastManager: React.FC<BookCastManagerProps> = ({ book, onBookUpdate }) => {
  // Demote dialog state (book-level specific)
  const [openDemoteDialog, setOpenDemoteDialog] = useState(false);
  const [demoteCharacter, setDemoteCharacter] = useState<Character | null>(null);
  const [demoteError, setDemoteError] = useState<string | null>(null);
  const [demoteStoriesUsing, setDemoteStoriesUsing] = useState<Array<{ id: string; title: string }>>([]);

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
    type: 'book',
    book,
    onUpdate: onBookUpdate,
  });

  // Book-level specific: Demote character to story
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
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a book to manage book-level characters
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
              Book Cast ({characters.length})
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
        <Typography variant="body2" color="text.secondary">
          Book-level characters are shared across all stories in this book
        </Typography>
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
              No book characters yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Add characters at the book level to use them across all stories
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
                    <Tooltip title="Demote to story-level character">
                      <IconButton
                        component="div"
                        onClick={() => handleOpenDemote(character)}
                        size="small"
                      >
                        <ArrowDownwardIcon />
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
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                    {character.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getCharacterUsageInfo(character)}
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
      {auditionCharacter && book && (
        <CharacterAuditionDialog
          open={openAuditionDialog}
          character={auditionCharacter}
          storyId={undefined}
          storyBackgroundSetup={undefined}
          book={book}
          onClose={handleCloseAudition}
          onUpdate={handleAuditionUpdate}
        />
      )}

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
                <>
                  <Typography variant="body2" gutterBottom>
                    This character is used in the following stories:
                  </Typography>
                  <List>
                    {demoteStoriesUsing.map(story => (
                      <ListItem key={story.id}>
                        <ListItemText primary={story.title} />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="body2" color="text.secondary">
                    To demote this character, it must be used in only one story, or not used at all.
                  </Typography>
                </>
              )}
            </>
          ) : (
            <Typography>
              Are you sure you want to demote "{demoteCharacter?.name}" to story level?
              {demoteCharacter && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {getCharacterUsageInfo(demoteCharacter)}
                  </Typography>
                </Box>
              )}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDemoteDialog(false)}>Cancel</Button>
          <Button onClick={handleDemoteCharacter} variant="contained" color="warning" disabled={!!demoteError}>
            Demote
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

