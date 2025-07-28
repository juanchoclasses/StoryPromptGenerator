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
  IconButton,
  Tooltip,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import type { Story, StoryElement } from '../types/Story';
import { StoryService } from '../services/StoryService';

interface ElementsManagerProps {
  story: Story | null;
  onStoryUpdate: () => void;
}

export const ElementsManager: React.FC<ElementsManagerProps> = ({ story, onStoryUpdate }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingElement, setEditingElement] = useState<StoryElement | null>(null);
  const [elementName, setElementName] = useState('');
  const [elementDescription, setElementDescription] = useState('');
  const [elementCategory, setElementCategory] = useState('');

  const handleAddElement = () => {
    setEditingElement(null);
    setElementName('');
    setElementDescription('');
    setElementCategory('');
    setOpenDialog(true);
  };

  const handleEditElement = (element: StoryElement) => {
    setEditingElement(element);
    setElementName(element.name);
    setElementDescription(element.description);
    setElementCategory(element.category || '');
    setOpenDialog(true);
  };

  const handleDeleteElement = (elementId: string) => {
    if (!story) return;
    if (window.confirm('Are you sure you want to delete this element? This will also remove it from all scenes.')) {
      StoryService.deleteElement(elementId);
      onStoryUpdate();
    }
  };

  const handleSaveElement = () => {
    if (!story || !elementName.trim()) return;

    if (editingElement) {
      StoryService.updateElement(editingElement.id, {
        name: elementName.trim(),
        description: elementDescription,
        category: elementCategory.trim() || undefined
      });
    } else {
      StoryService.addElementToStory(elementName.trim(), elementDescription, elementCategory.trim() || undefined);
    }

    setOpenDialog(false);
    onStoryUpdate();
  };

  const getElementsByCategory = () => {
    if (!story) return {};
    
    const categories: { [key: string]: StoryElement[] } = {};
    const allElements = StoryService.getAllElements();
    allElements.forEach(element => {
      const category = element.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(element);
    });
    
    return categories;
  };

  if (!story) {
    return (
      <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Select a story to manage elements
        </Typography>
      </Paper>
    );
  }

  const elementsByCategory = getElementsByCategory();

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
                  <Typography variant="h5" component="h2">
          Story Elements ({StoryService.getAllElements().length})
        </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddElement}
          >
            Add Element
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
        {StoryService.getAllElements().length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No elements yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Add elements to your story to use in scenes
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddElement}
            >
              Add First Element
            </Button>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {Object.entries(elementsByCategory).map(([category, elements]) => (
              <Accordion key={category} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    {category} ({elements.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {elements.map((element) => (
                      <Accordion key={element.id} sx={{ mb: 1 }}>
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
                            <Typography variant="h6">
                              {element.name}
                            </Typography>
                            {element.category && (
                              <Chip
                                label={element.category}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                          <Box display="flex" gap={1} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Edit element">
                              <IconButton
                                onClick={() => handleEditElement(element)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete element">
                              <IconButton
                                onClick={() => handleDeleteElement(element.id)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ whiteSpace: 'pre-line' }}>
                            {element.description}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Box>

      {/* Element Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingElement ? 'Edit Element' : 'Add New Element'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Element Name"
            fullWidth
            variant="outlined"
            value={elementName}
            onChange={(e) => setElementName(e.target.value)}
            placeholder="Enter element name..."
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={elementDescription}
            onChange={(e) => setElementDescription(e.target.value)}
            placeholder="Describe this element..."
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Category (Optional)"
            fullWidth
            variant="outlined"
            value={elementCategory}
            onChange={(e) => setElementCategory(e.target.value)}
            placeholder="e.g., Props, Locations, Events..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveElement} variant="contained" disabled={!elementName.trim()}>
            {editingElement ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}; 