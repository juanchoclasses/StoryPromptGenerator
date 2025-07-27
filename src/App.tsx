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
  TextField
} from '@mui/material';
import { Book as BookIcon } from '@mui/icons-material';
import { BackgroundSetup } from './components/BackgroundSetup';
import { SceneList } from './components/SceneList';
import { SceneEditor } from './components/SceneEditor';
import { StoriesPanel } from './components/StoriesPanel';
import { CastManager } from './components/CastManager';
import { VersionInfo } from './components/VersionInfo';
import type { Scene, Story } from './types/Story';
import { StoryService } from './services/StoryService';

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
      const updatedStory = StoryService.getStoryById(selectedStory.id);
      setSelectedStory(updatedStory);
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
  };

  const handleStoryTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = event.target.value;
    setStoryTitle(newTitle);
    
    // Auto-save the story title
    if (selectedStory) {
      const updatedStory = { ...selectedStory, title: newTitle, updatedAt: new Date() };
      StoryService.updateStory(selectedStory.id, updatedStory);
      setSelectedStory(updatedStory);
    }
  };

  const handleStoryDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = event.target.value;
    setStoryDescription(newDescription);
    
    // Auto-save the story description
    if (selectedStory) {
      const updatedStory = { ...selectedStory, description: newDescription, updatedAt: new Date() };
      StoryService.updateStory(selectedStory.id, updatedStory);
      setSelectedStory(updatedStory);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
          <Typography variant="h6" component="div">
            Story Prompt Editor
          </Typography>
          <VersionInfo />
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 100px)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Stories" />
            <Tab label="Characters" disabled={!selectedStory} />
            <Tab label="Story Editor" disabled={!selectedStory} />
          </Tabs>
        </Box>

        {activeTab === 0 && (
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

        {activeTab === 1 && selectedStory && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <CastManager
              story={selectedStory}
              onStoryUpdate={handleStoryUpdate}
            />
          </Box>
        )}

        {activeTab === 2 && selectedStory && (
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
      </Container>
    </ThemeProvider>
  );
}

export default App;
