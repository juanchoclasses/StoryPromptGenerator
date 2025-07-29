import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Link,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Code,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Book as BookIcon,
  Person as PersonIcon,
  Palette as PaletteIcon,
  SmartToy as SmartToyIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  Rocket as RocketIcon,
  Help as HelpIcon,
  GitHub as GitHubIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';

export const AboutPanel: React.FC = () => {
  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Story Prompt Generator
      </Typography>
      
      <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
        A comprehensive web application for creating, organizing, and generating AI image prompts for storytelling and creative projects.
      </Typography>

      {/* Features Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🌟 Features
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 2 }}>
          {/* Book Management */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BookIcon color="primary" />
              📚 Book Management
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Multi-book Organization" secondary="Create and manage multiple books to organize your stories" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Book Metadata" secondary="Add titles and descriptions to provide context for your creative projects" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Import/Export" secondary="Backup and restore your books with JSON export/import functionality" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Data Migration" secondary="Automatic migration from older data formats" />
              </ListItem>
            </List>
          </Box>

          {/* Story Creation */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BookIcon color="secondary" />
              📖 Story Creation
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Story Structure" secondary="Create stories with titles, descriptions, and background setups" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Scene Management" secondary="Organize stories into individual scenes with detailed descriptions" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Auto-save" secondary="All changes are automatically saved to local storage" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Version Control" secondary="Built-in data versioning with automatic migration" />
              </ListItem>
            </List>
          </Box>

          {/* Character Management */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon color="primary" />
              🎭 Character Management
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Global Cast" secondary="Define characters that can be used across multiple scenes and stories" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Character Details" secondary="Add names and detailed descriptions for each character" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Scene Assignment" secondary="Assign characters to specific scenes for focused storytelling" />
              </ListItem>
            </List>
          </Box>

          {/* Element Management */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PaletteIcon color="secondary" />
              🎨 Element Management
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Story Elements" secondary="Create objects, props, and environmental elements" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Categorization" secondary="Organize elements with optional categories" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Scene Integration" secondary="Add elements to scenes for rich visual descriptions" />
              </ListItem>
            </List>
          </Box>

          {/* AI Prompt Generation */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SmartToyIcon color="primary" />
              🤖 AI Prompt Generation
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Structured Prompts" secondary="Generate comprehensive prompts for AI image generation" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Context-Aware" secondary="Includes book description, background setup, scene details, characters, and elements" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Copy to Clipboard" secondary="One-click prompt copying for easy use with AI services" />
              </ListItem>
            </List>
          </Box>

          {/* Data Management */}
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <StorageIcon color="secondary" />
              💾 Data Management
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Local Storage" secondary="All data is stored locally in your browser" />
              </ListItem>
              <ListItem>
                <ListItemText primary="No Server Required" secondary="Works completely offline" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Data Export" secondary="Backup your entire book collection" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Migration Support" secondary="Automatic upgrades from older data formats" />
              </ListItem>
            </List>
          </Box>
        </Box>
      </Paper>

      {/* Technology Stack */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon color="primary" />
          🏗️ Architecture
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Technology Stack
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip label="React 19" color="primary" />
          <Chip label="TypeScript" color="primary" />
          <Chip label="Material-UI" color="secondary" />
          <Chip label="Vite" color="secondary" />
          <Chip label="GitHub Pages" color="secondary" />
        </Box>

        <Typography variant="h6" gutterBottom>
          Project Structure
        </Typography>
        <Box sx={{ backgroundColor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`src/
├── components/          # React components
│   ├── BackgroundSetup.tsx    # Story background editor
│   ├── CastManager.tsx        # Character management
│   ├── ElementsManager.tsx    # Story elements management
│   ├── FileManager.tsx        # Book management interface
│   ├── SceneEditor.tsx        # Scene editing and prompt generation
│   ├── SceneList.tsx          # Scene navigation
│   ├── StoriesPanel.tsx       # Story management
│   └── VersionInfo.tsx        # Version display
├── services/           # Business logic and data management
│   ├── BookService.ts         # Book and data management
│   ├── MigrationService.ts    # Data version migration
│   └── PromptService.ts       # Prompt management
├── types/             # TypeScript type definitions
│   ├── Book.ts               # Book-related types
│   ├── Prompt.ts             # Prompt-related types
│   └── Story.ts              # Story and scene types
└── App.tsx           # Main application component`}
          </pre>
        </Box>
      </Paper>

      {/* Usage Guide */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RocketIcon color="primary" />
          📖 Usage Guide
        </Typography>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Creating Your First Book</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="1. Open the application and navigate to the 'Books' tab"
                  secondary="This is where you'll manage all your books"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Click 'New Book' to create your first book"
                  secondary="You can add a title and optional description"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Enter a title and optional description"
                  secondary="The description will be included in generated prompts"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Click 'Create' to save your book"
                  secondary="Your book is now ready for stories"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Adding Stories</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="1. Select a book from the Books tab"
                  secondary="Click on any book to make it active"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Navigate to the 'Stories' tab"
                  secondary="This tab is only available when a book is selected"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Click 'New Story' to create your first story"
                  secondary="Each story can have multiple scenes"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Enter a title and description for your story"
                  secondary="The description helps provide context"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Generating Prompts</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="1. Navigate to the 'Story Editor' tab"
                  secondary="This tab is only available when a story is selected"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="2. Select a scene from the scene list"
                  secondary="Each scene can have different characters and elements"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="3. Customize the scene details, characters, and elements"
                  secondary="Add or remove characters and elements as needed"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="4. Click 'Get Prompt' to generate and copy the AI prompt"
                  secondary="The prompt includes all relevant context for image generation"
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Links and Support */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HelpIcon color="primary" />
          🌐 Links & Support
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 2 }}>
          <Alert severity="info" sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Live Application
            </Typography>
            <Link 
              href="https://juanchoclasses.github.io/StoryPromptGenerator" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <LaunchIcon />
              View Live Application
            </Link>
          </Alert>

          <Alert severity="info" sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Source Code
            </Typography>
            <Link 
              href="https://github.com/juanchoclasses/StoryPromptGenerator" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <GitHubIcon />
              View on GitHub
            </Link>
          </Alert>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Support
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          If you encounter any issues or have questions:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="1. Check the GitHub Issues"
              secondary="Look for existing solutions or similar problems"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="2. Create a new issue"
              secondary="Include detailed information about your problem"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="3. Include browser version and error messages"
              secondary="This helps us diagnose and fix issues faster"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Version Info */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          🔄 Version History
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="v2.0.0"
              secondary="Complete rewrite with book-based organization"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="v1.0.0"
              secondary="Initial release with story management"
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary" align="center">
          Built with ❤️ using React, TypeScript, and Material-UI
        </Typography>
      </Paper>
    </Box>
  );
}; 