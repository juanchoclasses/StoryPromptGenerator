import React, { useState } from 'react';
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
import { ElementsManager } from './components/ElementsManager';
import { FileManager } from './components/FileManager';
import { VersionInfo } from './components/VersionInfo';
import { AboutPanel } from './components/AboutPanel';
import { SettingsDialog } from './components/SettingsDialog';
import type { Scene, Story } from './types/Story';
import type { StoryData } from './types/Story';
import { BookService } from './services/BookService';

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
  const [storyDescription, setStoryDescription] = useState('');
  const [bookData, setBookData] = useState<StoryData | null>(null);
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

  const handleStoryUpdate = () => {
    setRefreshKey(prev => prev + 1);
    // Update selected story if it still exists
    if (selectedStory) {
      const activeBookData = BookService.getActiveBookData();
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

  const handleStoryTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    setStoryTitle(newTitle);
    
    // Auto-save the story title
    if (selectedStory) {
      const activeBookData = BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === selectedStory.id) {
          return { ...s, title: newTitle, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      BookService.saveActiveBookData(updatedData);
      
      const updatedStory = updatedStories.find(s => s.id === selectedStory.id);
      setSelectedStory(updatedStory || null);
    }
  };

  const handleStoryDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = event.target.value;
    setStoryDescription(newDescription);
    
    // Auto-save the story description
    if (selectedStory) {
      const activeBookData = BookService.getActiveBookData();
      if (!activeBookData) return;
      
      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === selectedStory.id) {
          return { ...s, description: newDescription, updatedAt: new Date() };
        }
        return s;
      });
      
      const updatedData = { ...activeBookData, stories: updatedStories };
      BookService.saveActiveBookData(updatedData);
      
      const updatedStory = updatedStories.find(s => s.id === selectedStory.id);
      setSelectedStory(updatedStory || null);
    }
  };

  // Book management
  const handleBookSelect = (bookId: string) => {
    const data = BookService.getBookData(bookId);
    if (data) {
      setBookData(data);
      setSelectedStory(null);
      setSelectedScene(null);
      setStoryTitle('');
      setStoryDescription('');
    }
  };

  const handleBookUpdate = () => {
    setRefreshKey(prev => prev + 1);
    // Reload current book data
    const activeBookId = BookService.getActiveBookId();
    if (activeBookId) {
      const data = BookService.getBookData(activeBookId);
      setBookData(data);
    }
  };

  // Load initial book data
  React.useEffect(() => {
    const data = BookService.getActiveBookData();
    setBookData(data);
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const navigateToStoryEditor = () => {
    setActiveTab(4); // Story Editor tab
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
            <Tab label="Stories" disabled={!bookData} />
            <Tab label="Book Characters" disabled={!bookData} />
            <Tab label="Book Elements" disabled={!bookData} />
            <Tab label="Story Editor" disabled={!selectedStory} />
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

        {activeTab === 1 && bookData && (
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

        {activeTab === 2 && bookData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <CastManager
              onStoryUpdate={handleStoryUpdate}
            />
          </Box>
        )}

        {activeTab === 3 && bookData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ElementsManager
              onStoryUpdate={handleStoryUpdate}
            />
          </Box>
        )}

        {activeTab === 4 && selectedStory && (
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
            
            {/* Main Content - Horizontal Layout */}
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
              {/* Left Panel - Scene List */}
              <Box sx={{ flex: { lg: '0 0 300px' }, minWidth: 0 }}>
                <SceneList
                  story={selectedStory}
                  selectedSceneId={selectedScene?.id}
                  onSceneSelect={handleSceneSelect}
                  onStoryUpdate={handleStoryUpdate}
                />
              </Box>
              
              {/* Right Panel - Scene Editor */}
              <Box sx={{ flex: { lg: '1' }, minWidth: 0 }}>
                <SceneEditor
                  story={selectedStory}
                  selectedScene={selectedScene}
                  onStoryUpdate={handleStoryUpdate}
                />
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 5 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AboutPanel />
          </Box>
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
