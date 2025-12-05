import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import { Upload as UploadIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { MarkdownStoryParser } from '../services/MarkdownStoryParser';
import type { ParsedStoryBundle } from '../services/MarkdownStoryParser';
import { BookService } from '../services/BookService';
import type { Story, Scene, StoryElement } from '../types/Story';
import type { Character } from '../models/Story';
// Note: Character is now in models/Story.ts (name-based, not ID-based)

interface ImportStoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportStoryDialog: React.FC<ImportStoryDialogProps> = ({ open, onClose, onSuccess }) => {
  const [importMode, setImportMode] = useState<'json' | 'markdown'>('json');
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [charactersFile, setCharactersFile] = useState<File | null>(null);
  const [scenesFile, setScenesFile] = useState<File | null>(null);
  const [poemFile, setPoemFile] = useState<File | null>(null);
  
  const [storyTitle, setStoryTitle] = useState('');
  const [storyBackgroundSetup, setStoryBackgroundSetup] = useState('');
  
  const [parsedBundle, setParsedBundle] = useState<ParsedStoryBundle | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (type: 'characters' | 'scenes' | 'poem', file: File | null) => {
    switch (type) {
      case 'characters':
        setCharactersFile(file);
        break;
      case 'scenes':
        setScenesFile(file);
        break;
      case 'poem':
        setPoemFile(file);
        break;
    }
    setParsedBundle(null); // Clear preview when files change
    setError(null);
  };

  const handlePreview = async () => {
    try {
      setError(null);
      
      if (importMode === 'json') {
        if (!jsonFile) {
          setError('Please select a JSON file');
          return;
        }
        
        const content = await MarkdownStoryParser.readFile(jsonFile);
        const jsonData = JSON.parse(content);
        
        // Convert JSON format to ParsedStoryBundle
        const bundle: ParsedStoryBundle = {
          characters: jsonData.characters || [],
          scenes: (jsonData.scenes || []).map((scene: any) => ({
            title: scene.title,
            description: scene.description,
            characterNames: scene.characters || [],
            elementNames: scene.elements || []
          })),
          stanzas: (jsonData.scenes || []).map((scene: any) => ({
            title: scene.title,
            content: scene.textPanel || ''
          }))
        };
        
        // Auto-fill story details from JSON
        if (jsonData.story) {
          setStoryTitle(jsonData.story.title || '');
          setStoryBackgroundSetup(jsonData.story.backgroundSetup || '');
        }
        
        setParsedBundle(bundle);
      } else {
        // Markdown mode
        if (!charactersFile || !scenesFile || !poemFile) {
          setError('Please select all three markdown files');
          return;
        }

        const [charactersContent, scenesContent, poemContent] = await Promise.all([
          MarkdownStoryParser.readFile(charactersFile),
          MarkdownStoryParser.readFile(scenesFile),
          MarkdownStoryParser.readFile(poemFile)
        ]);

        const bundle = MarkdownStoryParser.parseStoryBundle(
          charactersContent,
          scenesContent,
          poemContent
        );

        setParsedBundle(bundle);
      }
    } catch (err) {
      setError(`Failed to parse files: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleImport = async () => {
    if (!parsedBundle || !storyTitle.trim()) {
      setError('Please fill in story title and parse the files first');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const activeBookId = await BookService.getActiveBookId();
      if (!activeBookId) {
        throw new Error('No active book selected');
      }

      // Get the actual Book object to access book-level characters
      const { StorageService } = await import('../services/StorageService');
      const book = await StorageService.getBook(activeBookId);
      if (!book) {
        throw new Error('No active book selected. Please create or select a book first.');
      }

      // Get book data for StoryData format (used for saving)
      const bookData = await BookService.getActiveBookData();
      if (!bookData) {
        throw new Error('No active book selected. Please create or select a book first.');
      }

      // Create characters - add to book level instead of story level
      const characterMap = new Map<string, string>(); // name -> id (for validation only)
      
      // First, add all existing book-level characters to the map
      const existingBookCharacters = book.characters || [];
      existingBookCharacters.forEach(char => {
        characterMap.set(char.name, char.id);
      });
      
      // Then create new characters from the import
      const newCharacters: Character[] = parsedBundle.characters.map(pc => {
        const char: Character = {
          id: crypto.randomUUID(),
          name: pc.name,
          description: pc.description
        };
        // Add to map (will overwrite if duplicate, but that's ok - we check by name)
        characterMap.set(pc.name, char.id);
        return char;
      });

      // Only add characters that don't already exist at book level (case-insensitive check)
      const existingCharacterNames = new Set(
        existingBookCharacters.map(c => c.name.toLowerCase())
      );
      
      const charactersToAdd = newCharacters.filter(
        char => !existingCharacterNames.has(char.name.toLowerCase())
      );
      
      console.log(`Import: Found ${existingBookCharacters.length} existing book characters`);
      console.log(`Import: Adding ${charactersToAdd.length} new characters to book level`);
      console.log(`Import: Character map has ${characterMap.size} total characters`);

      // Create elements
      const elementMap = new Map<string, string>(); // name -> id
      const elements: StoryElement[] = [];
      
      // If JSON file was uploaded, read it once for elements and diagramPanels
      let jsonElements: any[] = [];
      let jsonScenes: any[] = [];
      if (importMode === 'json' && jsonFile) {
        try {
          const content = await MarkdownStoryParser.readFile(jsonFile);
          const jsonData = JSON.parse(content);
          jsonElements = jsonData.elements || [];
          jsonScenes = jsonData.scenes || [];
        } catch (e) {
          // Ignore if can't read
        }
      }
      
      // Collect unique element names from scenes
      const elementNames = new Set<string>();
      parsedBundle.scenes.forEach(scene => {
        scene.elementNames.forEach(name => elementNames.add(name));
      });
      
      // Create elements with appropriate descriptions and categories
      elementNames.forEach(name => {
        // Check if element is defined in JSON
        const jsonElement = jsonElements.find((e: any) => e.name === name);
        
        let description = '';
        let category = 'Props';
        
        if (jsonElement) {
          // Use JSON definition if available
          description = jsonElement.description;
          category = jsonElement.category || 'Props';
        } else {
          // Generate descriptions based on element type
        if (name.includes('Multiplication Machine')) {
          description = 'A whimsical machine with personality, featuring dials, displays, conveyor belts for arms, and lights that glow when calculating. Makes happy whirring sounds during multiplication.';
          category = 'Machinery';
        } else if (name.includes('Speaking Tube')) {
          description = 'A colorful communication tube that connects factory levels, used for passing questions downward during the recursive call process.';
          category = 'Machinery';
        } else if (name.includes('Return Tube')) {
          description = 'A glowing tube that carries answers upward from lower levels, showing the return values flowing back up through the recursion.';
          category = 'Machinery';
        } else if (name.includes('Conveyor Belt')) {
          description = 'A rainbow-colored segment conveyor belt that carries numbers and calculations between different parts of the factory floor.';
          category = 'Machinery';
        } else if (name.includes('Factory Gears')) {
          description = 'Oversized gears labeled with numbers, spinning and turning as calculations proceed. Some are shaped like factorial symbols (!).';
          category = 'Machinery';
        } else if (name.includes('Order Ticket')) {
          description = 'A floating pneumatic ticket showing the factorial calculation request (e.g., "4!"), delivered from above to start the process.';
          category = 'Props';
        } else if (name.includes('Base Case Pedestal')) {
          description = 'A golden, glowing pedestal marking the foundation level where 1! = 1. Has special importance as the stopping point of recursion.';
          category = 'Set Pieces';
        } else if (name.includes('Factory Level')) {
          description = 'A factory floor representing a recursion depth level, with machinery, workstations, and tubes connecting to levels above and below.';
          category = 'Set Pieces';
          } else {
            description = `A ${name} element from the story.`;
            category = 'Props';
          }
        }
        
        const element: StoryElement = {
          id: crypto.randomUUID(),
          name: name,
          description: description,
          category: category
        };
        elementMap.set(name, element.id);
        elements.push(element);
      });

      // Create scenes, matching with stanzas
      const scenes: Scene[] = parsedBundle.scenes.map((ps, index) => {
        // Match scene with corresponding stanza (skip intro/conclusion stanzas)
        const stanza = parsedBundle.stanzas[index];
        const textPanel = stanza ? stanza.content : '';
        
        // Use character names directly (Scene uses names, not IDs)
        // Filter to only include characters that exist in the character map
        const characters = ps.characterNames.filter(name => {
          const exists = characterMap.has(name);
          if (!exists) {
            console.warn(`Import: Scene "${ps.title}" references character "${name}" which is not in character map`);
          }
          return exists;
        });
        
        // Use element names directly (Scene uses names, not IDs)
        const elements = ps.elementNames.filter(name => elementMap.has(name));
        
        console.log(`Import: Scene "${ps.title}" has ${characters.length} characters:`, characters);

        // Extract diagramPanel from JSON if available
        // Note: diagramPanel.style is stored separately in Story.diagramStyle
        // but we preserve the full structure for now (style will be extracted to story level if needed)
        const jsonScene = jsonScenes[index];
        let diagramPanel: any = undefined;
        if (jsonScene?.diagramPanel) {
          // Extract just the DiagramPanel fields (type, content, language)
          // Style is handled separately at the Story level
          diagramPanel = {
            type: jsonScene.diagramPanel.type,
            content: jsonScene.diagramPanel.content,
            language: jsonScene.diagramPanel.language
          };
        }

        const scene: Scene = {
          id: crypto.randomUUID(),
          title: ps.title,
          description: ps.description,
          textPanel: textPanel,
          diagramPanel: diagramPanel,
          characters: characters,
          elements: elements,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return scene;
      });

      // Extract diagramStyle from first scene's diagramPanel.style if available
      // (diagramStyle is shared at Story level, but JSON may have it per-scene)
      let diagramStyle: any = undefined;
      if (jsonScenes.length > 0) {
        const firstSceneWithStyle = jsonScenes.find((s: any) => s.diagramPanel?.style);
        if (firstSceneWithStyle?.diagramPanel?.style) {
          diagramStyle = firstSceneWithStyle.diagramPanel.style;
        }
      }

      // Create the story (without characters - they're at book level)
      const story: Story = {
        id: crypto.randomUUID(),
        title: storyTitle.trim(),
        description: undefined,
        backgroundSetup: storyBackgroundSetup.trim() || 'Story background setup',
        characters: [], // Characters are at book level, not story level
        elements: elements, // Elements remain at story level
        scenes: scenes,
        diagramStyle: diagramStyle,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update the book with new characters and story
      book.characters = [...existingBookCharacters, ...charactersToAdd]; // Add new characters to book level
      book.stories.push(story);
      book.updatedAt = new Date();

      // Debug: Log what we're saving
      console.log(`Import: Saving story "${story.title}" with ${story.scenes.length} scenes`);
      story.scenes.forEach((scene, idx) => {
        console.log(`  Scene ${idx + 1} "${scene.title}": ${scene.characters.length} characters`, scene.characters);
      });
      console.log(`Import: Book now has ${book.characters.length} book-level characters:`, book.characters.map(c => c.name));

      // Save the book using StorageService (which handles book-level characters)
      await StorageService.saveBook(book);

      // Also update bookData for statistics (StoryData format)
      const updatedBookData = {
        ...bookData,
        stories: [...bookData.stories, story],
        lastUpdated: new Date()
      };
      await BookService.updateBookStatistics(activeBookId, updatedBookData);

      // Success!
      onSuccess();
      handleClose();
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setJsonFile(null);
      setCharactersFile(null);
      setScenesFile(null);
      setPoemFile(null);
      setStoryTitle('');
      setStoryBackgroundSetup('');
      setParsedBundle(null);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Story Bundle</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {importMode === 'json' 
            ? 'Upload a single JSON file containing your complete story with characters, scenes, and text panels.'
            : 'Upload three markdown files: characters, scenes, and poem. The system will automatically parse and create your story.'}
        </Alert>

        {/* Mode Selector */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Import Format</InputLabel>
            <Select
              value={importMode}
              label="Import Format"
              onChange={(e) => {
                setImportMode(e.target.value as 'json' | 'markdown');
                setParsedBundle(null);
                setError(null);
              }}
            >
              <MenuItem value="json">JSON (Recommended - Single File)</MenuItem>
              <MenuItem value="markdown">Markdown (Three Files)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* File uploads */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>1. Select File{importMode === 'markdown' ? 's' : ''}</Typography>
          
          {importMode === 'json' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={jsonFile ? <CheckIcon /> : <UploadIcon />}
                color={jsonFile ? 'success' : 'primary'}
                fullWidth
              >
                {jsonFile ? `✓ ${jsonFile.name}` : 'Upload Story JSON File'}
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={(e) => {
                    setJsonFile(e.target.files?.[0] || null);
                    setParsedBundle(null);
                    setError(null);
                  }}
                />
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={charactersFile ? <CheckIcon /> : <UploadIcon />}
                color={charactersFile ? 'success' : 'primary'}
              >
                {charactersFile ? `✓ ${charactersFile.name}` : 'Characters File (.md)'}
                <input
                  type="file"
                  hidden
                  accept=".md,.markdown"
                  onChange={(e) => handleFileSelect('characters', e.target.files?.[0] || null)}
                />
              </Button>

              <Button
                variant="outlined"
                component="label"
                startIcon={scenesFile ? <CheckIcon /> : <UploadIcon />}
                color={scenesFile ? 'success' : 'primary'}
              >
                {scenesFile ? `✓ ${scenesFile.name}` : 'Scenes File (.md)'}
                <input
                  type="file"
                  hidden
                  accept=".md,.markdown"
                  onChange={(e) => handleFileSelect('scenes', e.target.files?.[0] || null)}
                />
              </Button>

              <Button
                variant="outlined"
                component="label"
                startIcon={poemFile ? <CheckIcon /> : <UploadIcon />}
                color={poemFile ? 'success' : 'primary'}
              >
                {poemFile ? `✓ ${poemFile.name}` : 'Poem File (.md)'}
                <input
                  type="file"
                  hidden
                  accept=".md,.markdown"
                  onChange={(e) => handleFileSelect('poem', e.target.files?.[0] || null)}
                />
              </Button>
            </Box>
          )}

          <Button
            variant="contained"
            onClick={handlePreview}
            disabled={importMode === 'json' ? !jsonFile : (!charactersFile || !scenesFile || !poemFile)}
            sx={{ mt: 2 }}
          >
            Parse & Preview
          </Button>
        </Box>

        {/* Preview */}
        {parsedBundle && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Preview:</Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={`${parsedBundle.characters.length} Characters`}
                    secondary={parsedBundle.characters.map(c => c.name).join(', ')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={`${parsedBundle.scenes.length} Scenes`}
                    secondary={parsedBundle.scenes.map(s => s.title).join(', ')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={`${parsedBundle.stanzas.length} Stanzas`}
                    secondary="Will be matched to scenes for text panels"
                  />
                </ListItem>
              </List>
            </Box>
          </>
        )}

        {/* Story info */}
        {parsedBundle && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>2. Story Details</Typography>
            
            <TextField
              fullWidth
              label="Story Title"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              required
              disabled={importMode === 'json'}
              helperText={importMode === 'json' ? '✓ Auto-filled from JSON file' : ''}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Story Background Setup (Optional)"
              value={storyBackgroundSetup}
              onChange={(e) => setStoryBackgroundSetup(e.target.value)}
              multiline
              rows={3}
              placeholder="Story-specific context (e.g., 'The students are learning about recursion...')"
              disabled={importMode === 'json'}
              helperText={importMode === 'json' ? '✓ Auto-filled from JSON file' : ''}
              sx={{ mb: 2 }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isImporting}>Cancel</Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!parsedBundle || !storyTitle.trim() || isImporting}
          startIcon={isImporting ? <CircularProgress size={20} /> : undefined}
        >
          {isImporting ? 'Importing...' : 'Import Story'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

