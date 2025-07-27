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
  Tab
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

  const handleStorySelect = (story: Story | null) => {
    setSelectedStory(story);
    setSelectedScene(null); // Reset selected scene when switching stories
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
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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
