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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import type { Character, Story } from '../types/Story';
import { StoryService } from '../services/StoryService';

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
      setCharacters(story.cast);
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

  const handleDeleteCharacter = (characterId: string) => {
    if (!story) return;
    if (window.confirm('Are you sure you want to delete this character? This will also remove them from all scenes.')) {
      StoryService.deleteCharacter(story.id, characterId);
      const updatedStory = StoryService.getStoryById(story.id);
      if (updatedStory) {
        setCharacters(updatedStory.cast);
        onStoryUpdate();
      }
    }
  };

  const handleSaveCharacter = () => {
    if (!story || !characterName.trim()) return;

    if (editingCharacter) {
      StoryService.updateCharacter(story.id, editingCharacter.id, {
        name: characterName.trim(),
        description: characterDescription.trim()
      });
    } else {
      StoryService.addCharacterToCast(story.id, characterName.trim(), characterDescription.trim());
    }

    setOpenDialog(false);
    const updatedStory = StoryService.getStoryById(story.id);
    if (updatedStory) {
      setCharacters(updatedStory.cast);
      onStoryUpdate();
    }
  };

  if (!story) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a story to manage cast
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
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

      {characters.length === 0 ? (
        <Box textAlign="center" py={4}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No characters yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Add characters to your story's cast to use them in scenes
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
        <List>
          {characters.map((character) => (
            <ListItem key={character.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
              <ListItemText
                primary={character.name}
                secondary={character.description}
              />
              <ListItemSecondaryAction>
                <Tooltip title="Edit character">
                  <IconButton
                    onClick={() => handleEditCharacter(character)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete character">
                  <IconButton
                    onClick={() => handleDeleteCharacter(character.id)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

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