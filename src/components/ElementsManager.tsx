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
  AccordionDetails,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import type { StoryElement, Story } from '../types/Story';
import { BookService } from '../services/BookService';

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
  const descriptionFieldRef = React.useRef<HTMLTextAreaElement>(null);

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

  const insertMacro = (macro: string) => {
    const textarea = descriptionFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = elementDescription;
    
    const newText = text.substring(0, start) + macro + text.substring(end);
    setElementDescription(newText);
    
    // Set cursor position after the inserted macro
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + macro.length, start + macro.length);
    }, 0);
  };

  const handleDeleteElement = async (elementId: string) => {
    if (!story) return;
    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData) return;
    
    if (window.confirm('Are you sure you want to delete this element? This will also remove it from all scenes.')) {
      const updatedElements = story.elements.filter(element => element.id !== elementId);
      
      // Update the story in the book data
      const updatedStories = activeBookData.stories.map(s => 
        s.id === story.id 
          ? { ...s, elements: updatedElements, updatedAt: new Date() }
          : s
      );
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      onStoryUpdate();
    }
  };

  const handleSaveElement = async () => {
    if (!story) return;
    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData || !elementName.trim()) return;

    let updatedElements: StoryElement[];
    
    if (editingElement) {
      // Update existing element
      updatedElements = story.elements.map(element => 
        element.id === editingElement.id 
          ? { ...element, name: elementName.trim(), description: elementDescription, category: elementCategory.trim() || undefined }
          : element
      );
    } else {
      // Create new element
      const newElement: StoryElement = {
        id: crypto.randomUUID(),
        name: elementName.trim(),
        description: elementDescription,
        category: elementCategory.trim() || undefined
      };
      updatedElements = [...story.elements, newElement];
    }
    
    // Update the story in the book data
    const updatedStories = activeBookData.stories.map(s => 
      s.id === story.id 
        ? { ...s, elements: updatedElements, updatedAt: new Date() }
        : s
    );
    const updatedData = { ...activeBookData, stories: updatedStories };
    await BookService.saveActiveBookData(updatedData);

    setOpenDialog(false);
    onStoryUpdate();
  };

  const getElementsByCategory = () => {
    if (!story) return {};
    
    const categories: { [key: string]: StoryElement[] } = {};
    story.elements.forEach((element: StoryElement) => {
      const category = element.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(element);
    });
    
    return categories;
  };

  const getExistingCategories = (): string[] => {
    if (!story) return [];
    
    const categorySet = new Set<string>();
    story.elements.forEach((element: StoryElement) => {
      if (element.category && element.category.trim() !== '') {
        categorySet.add(element.category);
      }
    });
    
    return Array.from(categorySet).sort();
  };

  // Check if there's an active book instead of requiring a story
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
          Story Elements ({story.elements.length})
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
        {story.elements.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No elements yet
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Add elements to your book to use in scenes across all stories
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
                                component="div"
                                onClick={() => handleEditElement(element)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete element">
                              <IconButton
                                component="div"
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
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {element.description}
                          </Typography>
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
          
          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" color="text.secondary">
                Description (use macros to insert dynamic content)
              </Typography>
              <Tooltip title="Insert Scene Description macro">
                <Button
                  size="small"
                  startIcon={<CodeIcon />}
                  onClick={() => insertMacro('{SceneDescription}')}
                  variant="outlined"
                >
                  {'{SceneDescription}'}
                </Button>
              </Tooltip>
            </Box>
            <TextField
              inputRef={descriptionFieldRef}
              label="Description"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={elementDescription}
              onChange={(e) => setElementDescription(e.target.value)}
              placeholder="Describe this element... Use {SceneDescription} to reference the scene description."
            />
          </Box>
          
          <Autocomplete
            freeSolo
            options={getExistingCategories()}
            value={elementCategory}
            onChange={(_, newValue) => setElementCategory(newValue || '')}
            onInputChange={(_, newInputValue) => setElementCategory(newInputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label="Category (Optional)"
                variant="outlined"
                placeholder="e.g., Props, Locations, Events..."
              />
            )}
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