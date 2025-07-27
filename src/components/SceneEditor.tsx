import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Movie as MovieIcon
} from '@mui/icons-material';
import type { Scene, Character, SceneItem } from '../types/Story';
import { StoryService } from '../services/StoryService';

interface SceneEditorProps {
  scene: Scene | null;
  onSceneUpdate: () => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({ scene, onSceneUpdate }) => {
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [characterDialog, setCharacterDialog] = useState(false);
  const [sceneItemDialog, setSceneItemDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editingSceneItem, setEditingSceneItem] = useState<SceneItem | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [sceneItemTitle, setSceneItemTitle] = useState('');
  const [sceneItemDescription, setSceneItemDescription] = useState('');

  useEffect(() => {
    setCurrentScene(scene);
  }, [scene]);

  const handleAddCharacter = () => {
    setEditingCharacter(null);
    setCharacterName('');
    setCharacterDescription('');
    setCharacterDialog(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setCharacterName(character.name);
    setCharacterDescription(character.description);
    setCharacterDialog(true);
  };

  const handleDeleteCharacter = (characterId: string) => {
    if (currentScene && window.confirm('Are you sure you want to delete this character?')) {
      StoryService.deleteCharacter(currentScene.id, characterId);
      setCurrentScene(StoryService.getStoryData().scenes.find(s => s.id === currentScene.id) || null);
      onSceneUpdate();
    }
  };

  const handleSaveCharacter = () => {
    if (!currentScene || !characterName.trim()) return;

    if (editingCharacter) {
      StoryService.updateCharacter(currentScene.id, editingCharacter.id, {
        name: characterName.trim(),
        description: characterDescription.trim()
      });
    } else {
      StoryService.addCharacterToScene(currentScene.id, characterName.trim(), characterDescription.trim());
    }

    setCharacterDialog(false);
    setCurrentScene(StoryService.getStoryData().scenes.find(s => s.id === currentScene.id) || null);
    onSceneUpdate();
  };

  const handleAddSceneItem = () => {
    setEditingSceneItem(null);
    setSceneItemTitle('');
    setSceneItemDescription('');
    setSceneItemDialog(true);
  };

  const handleEditSceneItem = (sceneItem: SceneItem) => {
    setEditingSceneItem(sceneItem);
    setSceneItemTitle(sceneItem.title);
    setSceneItemDescription(sceneItem.description);
    setSceneItemDialog(true);
  };

  const handleDeleteSceneItem = (itemId: string) => {
    if (currentScene && window.confirm('Are you sure you want to delete this scene item?')) {
      StoryService.deleteSceneItem(currentScene.id, itemId);
      setCurrentScene(StoryService.getStoryData().scenes.find(s => s.id === currentScene.id) || null);
      onSceneUpdate();
    }
  };

  const handleSaveSceneItem = () => {
    if (!currentScene || !sceneItemTitle.trim()) return;

    if (editingSceneItem) {
      StoryService.updateSceneItem(currentScene.id, editingSceneItem.id, {
        title: sceneItemTitle.trim(),
        description: sceneItemDescription.trim()
      });
    } else {
      StoryService.addSceneItem(currentScene.id, sceneItemTitle.trim(), sceneItemDescription.trim());
    }

    setSceneItemDialog(false);
    setCurrentScene(StoryService.getStoryData().scenes.find(s => s.id === currentScene.id) || null);
    onSceneUpdate();
  };

  if (!currentScene) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a scene to edit
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {currentScene.title}
      </Typography>

      {/* Characters Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon />
            <Typography variant="h6">Characters ({currentScene.characters.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box mb={2}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddCharacter}
            >
              Add Character
            </Button>
          </Box>

          {currentScene.characters.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No characters added yet.
            </Typography>
          ) : (
            <List>
              {currentScene.characters.map((character) => (
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
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      {/* Scene Items Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <MovieIcon />
            <Typography variant="h6">Scene Items ({currentScene.scenes.length})</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box mb={2}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddSceneItem}
            >
              Add Scene Item
            </Button>
          </Box>

          {currentScene.scenes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No scene items added yet.
            </Typography>
          ) : (
            <List>
              {currentScene.scenes.map((sceneItem) => (
                <ListItem key={sceneItem.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                  <ListItemText
                    primary={sceneItem.title}
                    secondary={sceneItem.description}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit scene item">
                      <IconButton
                        onClick={() => handleEditSceneItem(sceneItem)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete scene item">
                      <IconButton
                        onClick={() => handleDeleteSceneItem(sceneItem.id)}
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
        </AccordionDetails>
      </Accordion>

      {/* Character Dialog */}
      <Dialog open={characterDialog} onClose={() => setCharacterDialog(false)} maxWidth="sm" fullWidth>
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
            placeholder="Describe the character..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCharacterDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCharacter} variant="contained" disabled={!characterName.trim()}>
            {editingCharacter ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scene Item Dialog */}
      <Dialog open={sceneItemDialog} onClose={() => setSceneItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSceneItem ? 'Edit Scene Item' : 'Add New Scene Item'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Scene Item Title"
            fullWidth
            variant="outlined"
            value={sceneItemTitle}
            onChange={(e) => setSceneItemTitle(e.target.value)}
            placeholder="Enter scene item title..."
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Scene Item Description"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={sceneItemDescription}
            onChange={(e) => setSceneItemDescription(e.target.value)}
            placeholder="Describe the scene item..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSceneItemDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSceneItem} variant="contained" disabled={!sceneItemTitle.trim()}>
            {editingSceneItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}; 