import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Tabs,
  Tab,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { Book as BookIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { BackgroundSetup } from './components/BackgroundSetup';
import { SceneList } from './components/SceneList';
import { SceneEditor } from './components/SceneEditor';
import { StoriesPanel } from './components/StoriesPanel';
import { CastManager } from './components/CastManager';
import { BookCastManager } from './components/BookCastManager';
import { ElementsManager } from './components/ElementsManager';
import { FileManager } from './components/FileManager';
import { VersionInfo } from './components/VersionInfo';
import { AboutPanel } from './components/AboutPanel';
import { SettingsDialog } from './components/SettingsDialog';
import { ImagePanel } from './components/ImagePanel';
import { OperationsPanel } from './components/OperationsPanel';
import { ImageStorageService } from './services/ImageStorageService';
import type { Scene, Story, GeneratedImage } from './types/Story';
import type { StoryData } from './types/Story';
import { BookService } from './services/BookService';
import type { Book } from './models/Book';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [storyTitle, setStoryTitle] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const imageSaveHandlerRef = useRef<(() => void) | null>(null);
  const imageClearHandlerRef = useRef<(() => void) | null>(null);
  const [storyDescription, setStoryDescription] = useState('');
  const [bookData, setBookData] = useState<StoryData | null>(null);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleStorySelect = (story: Story | null) => {
    setSelectedStory(story);
    setSelectedScene(null); // Reset selected scene when switching stories
    if (story) {
      setStoryTitle(story.title);
      setStoryDescription(story.description || '');
    } else {
      setStoryTitle('');
      setStoryDescription('');
    }
  };

  const handleSceneSelect = (scene: Scene) => {
    setSelectedScene(scene);
  };

  const handleImageStateChange = useCallback((url: string | null, onSave: () => void, onClear: () => void) => {
    setImageUrl(url);
    imageSaveHandlerRef.current = onSave;
    imageClearHandlerRef.current = onClear;
  }, []);

  // Update imageHistory when selectedScene changes
  useEffect(() => {
    if (selectedScene && selectedScene.imageHistory) {
      setImageHistory(selectedScene.imageHistory);
    } else {
      setImageHistory([]);
    }
  }, [selectedScene]);

  const handleDeleteImage = useCallback(async (imageId: string) => {
    if (!selectedStory || !selectedScene) return;
    
    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData) return;
    
    const updatedStories = activeBookData.stories.map(s => {
      if (s.id === selectedStory.id) {
        const updatedScenes = s.scenes.map(scene => {
          if (scene.id === selectedScene.id) {
            const updatedHistory = (scene.imageHistory || []).filter(img => img.id !== imageId);
            // Also clear lastGeneratedImage if this was the last image
            const updates: Partial<typeof scene> = { 
              imageHistory: updatedHistory, 
              updatedAt: new Date() 
            };
            if (updatedHistory.length === 0) {
              updates.lastGeneratedImage = undefined;
            }
            return { ...scene, ...updates };
          }
          return scene;
        });
        return { ...s, scenes: updatedScenes, updatedAt: new Date() };
      }
      return s;
    });
    
    const updatedData = { ...activeBookData, stories: updatedStories };
    await BookService.saveActiveBookData(updatedData);
    
    // Delete from IndexedDB
    ImageStorageService.deleteImage(imageId).catch(error => {
      console.error('Failed to delete image from IndexedDB:', error);
      // Continue anyway - image is already removed from localStorage
    });
    
    // Update the imageHistory state immediately to refresh the UI
    const newHistory = imageHistory.filter(img => img.id !== imageId);
    setImageHistory(newHistory);
    
    // Check if we're deleting the currently displayed image by comparing IDs
    const currentImageId = imageHistory.find(img => img.url === imageUrl)?.id;
    const isDeletingCurrentImage = currentImageId === imageId;
    
    if (isDeletingCurrentImage || newHistory.length === 0) {
      // Either we deleted the current image, or we deleted the last image
      if (newHistory.length > 0) {
        // Load the most recent remaining image from IndexedDB
        const mostRecentImage = newHistory[newHistory.length - 1];
        ImageStorageService.getImage(mostRecentImage.id)
          .then(url => {
            if (url) {
              setImageUrl(url);
            } else {
              setImageUrl(null);
            }
          })
          .catch(error => {
            console.error('Failed to load replacement image:', error);
            setImageUrl(null);
          });
      } else {
        // No images left - clear the display
        setImageUrl(null);
        // Also clear the handler to notify SceneEditor
        if (imageClearHandlerRef.current) {
          imageClearHandlerRef.current();
        }
      }
    }
    
    setRefreshKey(prev => prev + 1);
  }, [selectedStory, selectedScene, imageHistory, imageUrl]);

  const handleCleanupMissingImages = useCallback(async (missingIds: string[]) => {
    if (!selectedStory || !selectedScene || missingIds.length === 0) return;
    
    console.log('Cleaning up missing images:', missingIds);
    
    const activeBookData = await BookService.getActiveBookData();
    if (!activeBookData) return;
    
    const updatedStories = activeBookData.stories.map(s => {
      if (s.id === selectedStory.id) {
        const updatedScenes = s.scenes.map(scene => {
          if (scene.id === selectedScene.id) {
            const updatedHistory = (scene.imageHistory || []).filter(img => !missingIds.includes(img.id));
            return { 
              ...scene, 
              imageHistory: updatedHistory,
              updatedAt: new Date() 
            };
          }
          return scene;
        });
        return { ...s, scenes: updatedScenes, updatedAt: new Date() };
      }
      return s;
    });
    
    const updatedData = { ...activeBookData, stories: updatedStories };
    await BookService.saveActiveBookData(updatedData);
    
    // Update the imageHistory state immediately to refresh the UI
    const newHistory = imageHistory.filter(img => !missingIds.includes(img.id));
    setImageHistory(newHistory);
    
    console.log(`✓ Cleaned up ${missingIds.length} missing image references`);
    setRefreshKey(prev => prev + 1);
  }, [selectedStory, selectedScene, imageHistory]);

  const handleSaveSpecificImage = useCallback(async (imageUrl: string) => {
    if (!selectedStory || !selectedScene) return;
    
    const activeBookId = await BookService.getActiveBookId();
    const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
    
    if (activeBook) {
      const { FileSystemService } = await import('./services/FileSystemService');
      await FileSystemService.saveImage(
        imageUrl,
        activeBook.title,
        selectedScene.title
      );
    }
  }, [selectedStory, selectedScene]);

  const handleStoryUpdate = async () => {
    setRefreshKey(prev => prev + 1);
    // Update selected story if it still exists
    if (selectedStory) {
      const activeBookData = await BookService.getActiveBookData();
      if (activeBookData) {
        const updatedStory = activeBookData.stories.find(s => s.id === selectedStory.id);
        setSelectedStory(updatedStory || null);
        // Update selected scene if it still exists
        if (selectedScene && updatedStory) {
          const updatedScene = updatedStory.scenes.find(s => s.id === selectedScene.id);
          setSelectedScene(updatedScene || null);
        }
        // Update title and description state
        if (updatedStory) {
          setStoryTitle(updatedStory.title);
          setStoryDescription(updatedStory.description || '');
        }
      }
    }
  };

  const handleStoryTitleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    setStoryTitle(newTitle);
    
    // Auto-save the story title
    if (selectedStory) {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === selectedStory.id) {
          return { ...s, title: newTitle, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      
      const updatedStory = updatedStories.find(s => s.id === selectedStory.id);
      setSelectedStory(updatedStory || null);
    }
  };

  const handleStoryDescriptionChange = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = event.target.value;
    setStoryDescription(newDescription);
    
    // Auto-save the story description
    if (selectedStory) {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === selectedStory.id) {
          return { ...s, description: newDescription, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      
      const updatedStory = updatedStories.find(s => s.id === selectedStory.id);
      setSelectedStory(updatedStory || null);
    }
  };

  // Book management
  const handleBookSelect = async (bookId: string) => {
    const data = await BookService.getBookData(bookId);
    const book = await BookService.getBook(bookId);
    if (data) {
      setBookData(data);
      setActiveBook(book);
      setSelectedStory(null);
      setSelectedScene(null);
      setStoryTitle('');
      setStoryDescription('');
    }
  };

  const handleBookUpdate = async () => {
    setRefreshKey(prev => prev + 1);
    // Reload current book data
    const activeBookId = await BookService.getActiveBookId();
    if (activeBookId) {
      const data = await BookService.getBookData(activeBookId);
      const book = await BookService.getBook(activeBookId);
      setBookData(data);
      setActiveBook(book);
    }
  };

  // Load initial book data
  React.useEffect(() => {
    const loadData = async () => {
      const data = await BookService.getActiveBookData();
      setBookData(data);
      
      // Also load the active Book instance (not just StoryData format)
      const activeBookId = await BookService.getActiveBookId();
      if (activeBookId) {
        const book = await BookService.getBook(activeBookId);
        setActiveBook(book);
      }
    };
    loadData();
  }, []);

  const handleTabChange = async (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Reload book data when switching to Book Characters tab to pick up any changes
    if (newValue === 1) {
      const activeBookId = await BookService.getActiveBookId();
      if (activeBookId) {
        const book = await BookService.getBook(activeBookId);
        setActiveBook(book);
      }
    }
  };

  const navigateToStoryEditor = () => {
    setActiveTab(2); // Story Editor tab
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <BookIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Story Prompt Editor
          </Typography>
          <Tooltip title="Settings">
            <IconButton 
              color="inherit" 
              onClick={() => setSettingsOpen(true)}
              sx={{ mr: 2 }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <VersionInfo />
        </Toolbar>
      </AppBar>
      
      <SettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 100px)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Books" />
            <Tab label="Book Characters" disabled={!bookData} />
            <Tab label="Stories" disabled={!bookData} />
            <Tab label="Story Editor" disabled={!selectedStory} />
            <Tab label="Story Characters" disabled={!selectedStory} />
            <Tab label="Story Elements" disabled={!selectedStory} />
            <Tab label="Operations" />
            <Tab label="About" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FileManager
              onBookSelect={handleBookSelect}
              onBookUpdate={handleBookUpdate}
            />
          </Box>
        )}

        {activeTab === 1 && activeBook && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <BookCastManager
              book={activeBook}
              onBookUpdate={handleBookUpdate}
            />
          </Box>
        )}

        {activeTab === 2 && bookData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <StoriesPanel
              key={refreshKey}
              selectedStory={selectedStory}
              onStorySelect={handleStorySelect}
              onStoryUpdate={handleStoryUpdate}
              onNavigateToEditor={navigateToStoryEditor}
            />
          </Box>
        )}

        {activeTab === 3 && selectedStory && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Story Title and Description */}
            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              pb: 2, 
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Story Title"
                placeholder="Enter story title..."
                value={storyTitle}
                onChange={handleStoryTitleChange}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }
                }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                variant="outlined"
                label="Story Description"
                placeholder="Enter story description..."
                value={storyDescription}
                onChange={handleStoryDescriptionChange}
              />
            </Box>
            
            {/* Background Setup */}
            <BackgroundSetup 
              story={selectedStory} 
              onStoryUpdate={handleStoryUpdate} 
            />
            
            {/* Main Content - Three Column Layout */}
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
              {/* Left Panel - Scene List */}
              <Box sx={{ flex: { lg: '0 0 400px' }, minWidth: 0 }}>
                <SceneList
                  story={selectedStory}
                  selectedSceneId={selectedScene?.id}
                  onSceneSelect={handleSceneSelect}
                  onStoryUpdate={handleStoryUpdate}
                />
              </Box>
              
              {/* Middle Panel - Scene Editor */}
              <Box sx={{ flex: { lg: '1' }, minWidth: 0 }}>
                <SceneEditor
                  story={selectedStory}
                  selectedScene={selectedScene}
                  onStoryUpdate={handleStoryUpdate}
                  onImageStateChange={handleImageStateChange}
                />
              </Box>

              {/* Right Panel - Generated Image */}
              <Box sx={{ flex: { lg: '0 0 400px' }, minWidth: 0 }}>
                <ImagePanel
                  imageUrl={imageUrl}
                  imageHistory={imageHistory}
                  onSave={() => imageSaveHandlerRef.current && imageSaveHandlerRef.current()}
                  onClear={() => imageClearHandlerRef.current && imageClearHandlerRef.current()}
                  onDeleteImage={handleDeleteImage}
                  onSaveSpecificImage={handleSaveSpecificImage}
                  onCleanupMissingImages={handleCleanupMissingImages}
                />
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 4 && selectedStory && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <CastManager
              story={selectedStory}
              onStoryUpdate={handleStoryUpdate}
            />
          </Box>
        )}

        {activeTab === 5 && selectedStory && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ElementsManager
              story={selectedStory}
              onStoryUpdate={handleStoryUpdate}
            />
          </Box>
        )}

        {activeTab === 6 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <OperationsPanel />
          </Box>
        )}

        {activeTab === 7 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AboutPanel />
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
