import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  AutoAwesome as GenerateAllIcon,
  Description as DocxIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { BookService } from '../services/BookService';
import { ImportStoryDialog } from './ImportStoryDialog';
import { BatchImageGenerationDialog } from './BatchImageGenerationDialog';
import { ImageGenerationService } from '../services/ImageGenerationService';
import { ImageStorageService } from '../services/ImageStorageService';
import { overlayTextOnImage } from '../services/OverlayService';
import { DEFAULT_PANEL_CONFIG } from '../types/Book';
import { DocxExportService } from '../services/DocxExportService';
import { StoryExportService } from '../services/StoryExportService';
import type { Story, StoryData } from '../types/Story';
import { DEFAULT_DIAGRAM_STYLE, WHITEBOARD_DIAGRAM_STYLE } from '../types/Story';
import type { DiagramStyle } from '../types/Story';

interface StoriesPanelProps {
  selectedStory: Story | null;
  onStorySelect: (story: Story | null) => void;
  onStoryUpdate: () => void;
  onNavigateToEditor?: () => void;
}

export const StoriesPanel: React.FC<StoriesPanelProps> = ({ 
  selectedStory, 
  onStorySelect, 
  onStoryUpdate,
  onNavigateToEditor
}) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [batchGenerationOpen, setBatchGenerationOpen] = useState(false);
  const [batchGenerationStory, setBatchGenerationStory] = useState<Story | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [exportValidationOpen, setExportValidationOpen] = useState(false);
  const [exportValidationData, setExportValidationData] = useState<{
    story: Story | null;
    errors: string[];
    warnings: string[];
  }>({ story: null, errors: [], warnings: [] });
  const [isExporting, setIsExporting] = useState(false);
  const [diagramStyleDialogOpen, setDiagramStyleDialogOpen] = useState(false);
  const [editingDiagramStyleStory, setEditingDiagramStyleStory] = useState<Story | null>(null);
  const [tempDiagramStyle, setTempDiagramStyle] = useState<DiagramStyle>(DEFAULT_DIAGRAM_STYLE);

  useEffect(() => {
    loadStories();
  }, []);

  // Note: Stories are reloaded via onStoryUpdate callbacks throughout the component

  const loadStories = async () => {
    // Get the active book's data
    const activeBookData = await BookService.getActiveBookData();
    if (activeBookData) {
      setStories(activeBookData.stories);
    } else {
      setStories([]);
    }
  };

  const handleAddStory = () => {
    setEditingStory(null);
    setStoryTitle('');
    setStoryDescription('');
    setOpenDialog(true);
  };

  const handleEditStory = (story: Story) => {
    onStorySelect(story);
    if (onNavigateToEditor) {
      onNavigateToEditor();
    }
  };

  const handleConfigureDiagramStyle = (story: Story, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDiagramStyleStory(story);
    setTempDiagramStyle(story.diagramStyle || DEFAULT_DIAGRAM_STYLE);
    setDiagramStyleDialogOpen(true);
  };

  const handleSaveDiagramStyle = async () => {
    if (!editingDiagramStyleStory) return;

    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData) return;

    const updatedStories = activeBookData.stories.map(s => {
      if (s.id === editingDiagramStyleStory.id) {
        return { ...s, diagramStyle: tempDiagramStyle, updatedAt: new Date() };
      }
      return s;
    });

    const updatedData = { ...activeBookData, stories: updatedStories };
    await BookService.saveActiveBookData(updatedData);
    
    setDiagramStyleDialogOpen(false);
    setEditingDiagramStyleStory(null);
    onStoryUpdate();
    
    showSnackbar('Diagram style saved successfully!', 'success');
  };

  const handleDeleteStory = async (storyId: string) => {
    if (window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) {
        showSnackbar('No active book selected', 'error');
        return;
      }

      const updatedStories = activeBookData.stories.filter(story => story.id !== storyId);
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      
      if (selectedStory?.id === storyId) {
        onStorySelect(null);
      }
      await loadStories();
      onStoryUpdate();
      showSnackbar('Story deleted successfully', 'success');
    }
  };

  const handleSaveStory = async () => {
    if (!storyTitle.trim()) return;

    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData) {
      showSnackbar('No active book selected', 'error');
      return;
    }

    if (editingStory) {
      // Update existing story
      const updatedStories = activeBookData.stories.map(story => 
        story.id === editingStory.id 
          ? { ...story, title: storyTitle.trim(), description: storyDescription.trim(), updatedAt: new Date() }
          : story
      );
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      onStorySelect(updatedStories.find(s => s.id === editingStory.id) || null);
    } else {
      // Create new story
      const newStory: Story = {
        id: crypto.randomUUID(),
        title: storyTitle.trim(),
        description: storyDescription.trim(),
        backgroundSetup: '',
        characters: [], // Initialize empty characters array for this story
        elements: [], // Initialize empty elements array for this story
        scenes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedData = { 
        ...activeBookData, 
        stories: [...activeBookData.stories, newStory] 
      };
      await BookService.saveActiveBookData(updatedData);
      onStorySelect(newStory);
    }

    setOpenDialog(false);
    await loadStories();
    onStoryUpdate();
    showSnackbar(editingStory ? 'Story updated successfully' : 'Story created successfully', 'success');
  };

  const getStoryStats = (story: Story) => {
    if (!story.scenes) return { characters: 0, scenes: 0 };
    
    // Use story-level characters instead of book-level
    const characters = story.characters?.length || 0;
    const scenes = story.scenes.length;

    return { characters, scenes };
  };

  const handleExportData = () => {
    try {
      const data = localStorage.getItem('story-data-v2');
      if (!data) {
        showSnackbar('No data to export', 'error');
        return;
      }
      
      const dataBlob = new Blob([data], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `story-data-v2-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      showSnackbar('Data exported successfully', 'success');
    } catch {
      showSnackbar('Failed to export data', 'error');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const data: StoryData = JSON.parse(content);
            
            // Validate the data structure
            if (!data.stories || !Array.isArray(data.stories)) {
              throw new Error('Invalid data format');
            }
            
            // Clear current data and import new data
            localStorage.setItem('story-data-v2', JSON.stringify(data));
            loadStories();
            onStoryUpdate();
            
                         showSnackbar('Data imported successfully', 'success');
           } catch {
             showSnackbar('Failed to import data. Please check the file format.', 'error');
           }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleOpenBatchGeneration = (story: Story, e: React.MouseEvent) => {
    e.stopPropagation();
    setBatchGenerationStory(story);
    setBatchGenerationOpen(true);
  };

  const handleDownloadStoryJson = (story: Story, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      StoryExportService.downloadStoryAsJson(story);
      showSnackbar(`Story "${story.title}" downloaded as JSON`, 'success');
    } catch (error) {
      console.error('Failed to download story:', error);
      showSnackbar(`Failed to download story: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleExportStory = async (story: Story, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Validate story first
    const validation = await DocxExportService.validateStoryForExport(story);
    
    if (!validation.isValid || validation.warnings.length > 0) {
      // Show validation dialog
      setExportValidationData({
        story,
        errors: validation.errors,
        warnings: validation.warnings
      });
      setExportValidationOpen(true);
    } else {
      // Proceed with export
      await performExport(story);
    }
  };

  const performExport = async (story: Story) => {
    setIsExporting(true);
    try {
      const bookCollection = await BookService.getBookCollection();
      const activeBookId = await BookService.getActiveBookId();
      const activeBook = activeBookId ? bookCollection.books.find(book => book.id === activeBookId) : undefined;
      const bookTitle = activeBook?.title || 'Unknown Book';
      
      const blob = await DocxExportService.exportStoryToDocx(story, bookTitle);
      const filename = `${story.title.replace(/[^a-z0-9]/gi, '_')}.docx`;
      DocxExportService.downloadBlob(blob, filename);
      
      showSnackbar(`Story "${story.title}" exported successfully!`, 'success');
    } catch (error) {
      console.error('Failed to export story:', error);
      showSnackbar(`Failed to export story: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsExporting(false);
      setExportValidationOpen(false);
    }
  };

  const replaceMacros = (text: string, macros: Record<string, string>): string => {
    let result = text;
    Object.entries(macros).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  };

  const getImageDimensionsFromAspectRatio = (aspectRatio: string): { width: number; height: number } => {
    switch (aspectRatio) {
      case '1:1':
        return { width: 1024, height: 1024 };
      case '16:9':
        return { width: 1792, height: 1024 };
      case '9:16':
        return { width: 1024, height: 1792 };
      case '3:4':
        return { width: 768, height: 1024 };
      default:
        return { width: 1024, height: 1792 };
    }
  };

  const handleBatchGenerateScene = async (sceneId: string, modelName: string) => {
    if (!batchGenerationStory) return;
    
    const scene = batchGenerationStory.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    // Get book data
    const activeBookId = await BookService.getActiveBookId();
    const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
    const aspectRatio = activeBook?.aspectRatio || '3:4';
    const panelConfig = activeBook?.style?.panelConfig || DEFAULT_PANEL_CONFIG;
    
    // Get characters and elements for this scene (handle both new and legacy formats)
    const characterIds = scene.characterIds || [];
    const elementIds = scene.elementIds || [];
    const sceneCharacters = batchGenerationStory.characters.filter(char => characterIds.includes(char.id));
    const sceneElements = batchGenerationStory.elements.filter(elem => elementIds.includes(elem.id));
    
    // Generate prompt for this scene
    const characterSection = sceneCharacters.length > 0
      ? `## Characters in this Scene\n\n${sceneCharacters.map(char => {
          const macros = { 'SceneDescription': scene.description };
          return `[Character Definition: ${char.name}] ${replaceMacros(char.description, macros)}`;
        }).join('\n\n')}`
      : '';
    
    const elementSection = sceneElements.length > 0
      ? `## Elements in this Scene\n\n${sceneElements.map(elem => {
          const macros = { 'SceneDescription': scene.description };
          return `[Object Definition: ${elem.name}] ${replaceMacros(elem.description, macros)}`;
        }).join('\n\n')}`
      : '';
    
    const prompt = `Create an illustration in the whimsical storybook style with the following requirements:

## BOOK-WIDE VISUAL WORLD
${activeBook?.backgroundSetup || 'A whimsical, storybook world with vibrant colors and playful details.'}

## STORY CONTEXT
${batchGenerationStory.backgroundSetup}

## THIS SCENE
${scene.description}

${characterSection}

${elementSection}

TECHNICAL REQUIREMENTS:
- Aspect ratio: ${aspectRatio}
- Do NOT include any text, titles, or labels in the image
- Focus solely on visual storytelling`;

    // Generate the image
    const result = await ImageGenerationService.generateImage({ 
      prompt,
      aspectRatio,
      model: modelName
    });
    
    if (!result.success || !result.imageUrl) {
      throw new Error(result.error || 'Failed to generate image');
    }
    
    let finalImageUrl = result.imageUrl;
    
    // Apply text overlay if textPanel exists
    if (scene.textPanel && scene.textPanel.trim()) {
      try {
        const macros = { 'SceneDescription': scene.description };
        const panelText = replaceMacros(scene.textPanel, macros);
        const imageDimensions = getImageDimensionsFromAspectRatio(aspectRatio);
        
        finalImageUrl = await overlayTextOnImage(
          result.imageUrl,
          panelText,
          imageDimensions.width,
          imageDimensions.height,
          panelConfig
        );
      } catch (overlayError) {
        console.error('Error overlaying text:', overlayError);
        // Continue with original image if overlay fails
      }
    }
    
    // Save to scene in local storage
    const activeBookData = await BookService.getActiveBookData();
    if (activeBookData) {
      // Create image metadata (NO URL to avoid localStorage quota)
      const imageId = crypto.randomUUID();
      const newGeneratedImage = {
        id: imageId,
        // url is omitted - not stored in localStorage
        modelName: modelName,
        timestamp: new Date()
      };
      
      // Store in IndexedDB
      ImageStorageService.storeImage(
        imageId,
        sceneId,
        finalImageUrl,
        modelName
      ).catch(error => {
        console.error('Failed to store image in IndexedDB during batch generation:', error);
      });
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === batchGenerationStory.id) {
          const updatedScenes = s.scenes.map(sc => {
            if (sc.id === sceneId) {
              return {
                ...sc,
                imageHistory: [...(sc.imageHistory || []), newGeneratedImage],
                lastGeneratedImage: finalImageUrl, // Keep for backward compatibility
                updatedAt: new Date()
              };
            }
            return sc;
          });
          return { ...s, scenes: updatedScenes, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      
      // Don't reload stories here - it causes re-render which can close the dialog
      // The dialog will handle reloading when it closes
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" component="h2">
          Stories
        </Typography>
        <Box>
          <Tooltip title="Export Data">
            <IconButton onClick={handleExportData} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Data">
            <IconButton onClick={handleImportData} color="primary">
              <UploadIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ ml: 1 }}
          >
            Import Story Bundle
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddStory}
            sx={{ ml: 1 }}
          >
            New Story
          </Button>
        </Box>
      </Box>

      {stories.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No stories yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Create your first story to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddStory}
          >
            Create Story
          </Button>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {stories.map((story) => {
            if (!story || !story.id) return null;
            
            const stats = getStoryStats(story);
            const isSelected = selectedStory?.id === story.id;
            
            return (
              <Paper
                key={story.id}
                elevation={isSelected ? 4 : 2}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  '&:hover': {
                    elevation: 3,
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => onStorySelect(story)}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {story.title}
                    </Typography>
                    {story.description && (
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {story.description}
                      </Typography>
                    )}
                    <Box display="flex" gap={2}>
                      <Typography variant="caption" color="text.secondary">
                        Characters: {stats.characters}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Scenes: {stats.scenes}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
        
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Generate images for all scenes">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={(e) => handleOpenBatchGeneration(story, e)}
                        disabled={stats.scenes === 0}
                      >
                        <GenerateAllIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download story as JSON">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => handleDownloadStoryJson(story, e)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export story to Word document">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => handleExportStory(story, e)}
                        disabled={stats.scenes === 0}
                      >
                        <DocxIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Configure diagram style (blackboard/whiteboard)">
                      <IconButton
                        size="small"
                        color={story.diagramStyle ? "secondary" : "default"}
                        onClick={(e) => handleConfigureDiagramStyle(story, e)}
                      >
                        <SettingsIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStory(story);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Story Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStory ? 'Edit Story' : 'Create New Story'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Story Title"
            fullWidth
            variant="outlined"
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={storyDescription}
            onChange={(e) => setStoryDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveStory} variant="contained" disabled={!storyTitle.trim()}>
            {editingStory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Story Bundle Dialog */}
      <ImportStoryDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={() => {
          setSnackbarMessage('Story bundle imported successfully!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          loadStories();
          onStoryUpdate();
        }}
      />

      {/* Batch Image Generation Dialog */}
      {batchGenerationStory && (
        <BatchImageGenerationDialog
          open={batchGenerationOpen}
          onClose={() => {
            setBatchGenerationOpen(false);
            setBatchGenerationStory(null);
            // Reload stories after batch generation completes
            loadStories();
            onStoryUpdate();
          }}
          story={batchGenerationStory}
          activeBook={null}
          onGenerate={handleBatchGenerateScene}
        />
      )}

      {/* Export Validation Dialog */}
      <Dialog
        open={exportValidationOpen}
        onClose={() => !isExporting && setExportValidationOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {exportValidationData.errors.length > 0 ? 'Cannot Export Story' : 'Export Warning'}
        </DialogTitle>
        <DialogContent>
          {exportValidationData.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                The following issues prevent export:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                {exportValidationData.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </Box>
            </Alert>
          )}
          
          {exportValidationData.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Warning:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                {exportValidationData.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </Box>
              {exportValidationData.errors.length === 0 && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Do you want to proceed with the export?
                </Typography>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setExportValidationOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          {exportValidationData.errors.length === 0 && (
            <Button
              onClick={() => exportValidationData.story && performExport(exportValidationData.story)}
              variant="contained"
              color="primary"
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export Anyway'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diagram Style Configuration Dialog */}
      <Dialog 
        open={diagramStyleDialogOpen} 
        onClose={() => setDiagramStyleDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Configure Diagram Style for "{editingDiagramStyleStory?.title}"
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Alert severity="info">
              This configures the appearance and position of diagram overlays (blackboards/whiteboards) for all scenes in this story.
            </Alert>
            
            <TextField
              select
              label="Board Style"
              value={tempDiagramStyle.boardStyle}
              onChange={(e) => setTempDiagramStyle({
                ...tempDiagramStyle,
                boardStyle: e.target.value as any,
                backgroundColor: e.target.value === 'blackboard' ? '#2d3748' : '#ffffff',
                foregroundColor: e.target.value === 'blackboard' ? '#ffffff' : '#24292e'
              })}
              fullWidth
            >
              <MenuItem value="blackboard">Blackboard (dark gray with white chalk)</MenuItem>
              <MenuItem value="whiteboard">Whiteboard (white with dark markers)</MenuItem>
            </TextField>

            <TextField
              select
              label="Position"
              value={tempDiagramStyle.position}
              onChange={(e) => setTempDiagramStyle({ ...tempDiagramStyle, position: e.target.value as any })}
              fullWidth
            >
              <MenuItem value="top-left">Top Left</MenuItem>
              <MenuItem value="top-center">Top Center</MenuItem>
              <MenuItem value="top-right">Top Right</MenuItem>
              <MenuItem value="middle-left">Middle Left</MenuItem>
              <MenuItem value="middle-right">Middle Right</MenuItem>
              <MenuItem value="bottom-left">Bottom Left</MenuItem>
              <MenuItem value="bottom-center">Bottom Center</MenuItem>
              <MenuItem value="bottom-right">Bottom Right</MenuItem>
            </TextField>

            <TextField
              type="number"
              label="Width (%)"
              value={tempDiagramStyle.widthPercentage}
              onChange={(e) => setTempDiagramStyle({ ...tempDiagramStyle, widthPercentage: parseInt(e.target.value) || 0 })}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 10) {
                  setTempDiagramStyle({ ...tempDiagramStyle, widthPercentage: 10 });
                } else if (val > 100) {
                  setTempDiagramStyle({ ...tempDiagramStyle, widthPercentage: 100 });
                }
              }}
              InputProps={{ inputProps: { min: 10, max: 100 } }}
              fullWidth
              helperText="Percentage of image width (10-100%)"
            />

            <TextField
              type="number"
              label="Height (%)"
              value={tempDiagramStyle.heightPercentage}
              onChange={(e) => setTempDiagramStyle({ ...tempDiagramStyle, heightPercentage: parseInt(e.target.value) || 0 })}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 10) {
                  setTempDiagramStyle({ ...tempDiagramStyle, heightPercentage: 10 });
                } else if (val > 100) {
                  setTempDiagramStyle({ ...tempDiagramStyle, heightPercentage: 100 });
                }
              }}
              InputProps={{ inputProps: { min: 10, max: 100 } }}
              fullWidth
              helperText="Percentage of image height (10-100%)"
            />

            <TextField
              type="number"
              label="Font Size"
              value={tempDiagramStyle.fontSize}
              onChange={(e) => setTempDiagramStyle({ ...tempDiagramStyle, fontSize: parseInt(e.target.value) || 0 })}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 8) {
                  setTempDiagramStyle({ ...tempDiagramStyle, fontSize: 8 });
                } else if (val > 48) {
                  setTempDiagramStyle({ ...tempDiagramStyle, fontSize: 48 });
                }
              }}
              InputProps={{ inputProps: { min: 8, max: 48 } }}
              fullWidth
              helperText="Base font size in pixels"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiagramStyleDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveDiagramStyle} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 