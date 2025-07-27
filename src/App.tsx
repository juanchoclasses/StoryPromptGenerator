import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  AppBar,
  Toolbar,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { Book as BookIcon } from '@mui/icons-material';
import { BackgroundSetup } from './components/BackgroundSetup';
import { SceneList } from './components/SceneList';
import { SceneEditor } from './components/SceneEditor';
import type { Scene } from './types/Story';
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
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSceneSelect = (scene: Scene) => {
    setSelectedScene(scene);
  };

  const handleScenesChange = () => {
    setRefreshKey(prev => prev + 1);
    // Update selected scene if it still exists
    if (selectedScene) {
      const data = StoryService.getStoryData();
      const updatedScene = data.scenes.find(s => s.id === selectedScene.id);
      setSelectedScene(updatedScene || null);
    }
  };

  const handleBackgroundSave = () => {
    setRefreshKey(prev => prev + 1);
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
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Background Setup */}
          <Box>
            <BackgroundSetup onSave={handleBackgroundSave} />
          </Box>
          
          {/* Main Content */}
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: { md: '0 0 33%' } }}>
              <SceneList
                key={refreshKey}
                selectedSceneId={selectedScene?.id}
                onSceneSelect={handleSceneSelect}
                onScenesChange={handleScenesChange}
              />
            </Box>
            
            <Box sx={{ flex: { md: '1' } }}>
              <SceneEditor
                scene={selectedScene}
                onSceneUpdate={handleScenesChange}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
