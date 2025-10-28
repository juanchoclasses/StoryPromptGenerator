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
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import type { Character } from '../models/Story';
import type { Story } from '../types/Story';
import { BookService } from '../services/BookService';

interface CastManagerProps {
  story: Story | null;
  onStoryUpdate: () => void;
}

export const CastManager: React.FC<CastManagerProps> = ({ story, onStoryUpdate }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');

  useEffect(() => {
    if (story) {
      setCharacters(story.characters || []);
    } else {
      setCharacters([]);
    }
  }, [story]);

  const handleAddCharacter = () => {
    if (!story) return;
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

  const handleDeleteCharacter = async (characterName: string) => {
    if (!story) return;
    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData) return;
    
    if (window.confirm('Are you sure you want to delete this character? This will also remove them from all scenes.')) {
      const updatedCharacters = story.characters.filter(char => char.name !== characterName);
      
      // Update the story in the book data
      // Convert model Character[] to old format with IDs for backward compatibility
      const charactersWithIds = updatedCharacters.map(char => ({
        id: char.name, // Use name as ID
        name: char.name,
        description: char.description
      }));
      
      const updatedStories = activeBookData.stories.map(s => 
        s.id === story.id 
          ? { ...s, characters: charactersWithIds, updatedAt: new Date() }
          : s
      );
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      setCharacters(updatedCharacters);
      onStoryUpdate();
    }
  };

  const handleSaveCharacter = async () => {
    if (!story) return;
    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData || !characterName.trim()) return;

    let updatedCharacters: Character[];
    
    if (editingCharacter) {
      // Update existing character
      updatedCharacters = story.characters.map(char => 
        char.name === editingCharacter.name 
          ? { name: characterName.trim(), description: characterDescription }
          : char
      );
    } else {
      // Create new character
      const newCharacter: Character = {
        name: characterName.trim(),
        description: characterDescription
      };
      updatedCharacters = [...story.characters, newCharacter];
    }
    
    // Update the story in the book data
    // Convert model Character[] to old format with IDs for backward compatibility
    const charactersWithIds = updatedCharacters.map(char => ({
      id: char.name, // Use name as ID
      name: char.name,
      description: char.description
    }));
    
    const updatedStories = activeBookData.stories.map(s => 
      s.id === story.id 
        ? { ...s, characters: charactersWithIds, updatedAt: new Date() }
        : s
    );
    const updatedData = { ...activeBookData, stories: updatedStories };
    await BookService.saveActiveBookData(updatedData);
    setCharacters(updatedCharacters);

    setOpenDialog(false);
    onStoryUpdate();
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCharacter} variant="contained" disabled={!characterName.trim()}>
            {editingCharacter ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}; 