# Story Prompt Editor

A modern, feature-rich story prompt editor built with React, TypeScript, and Material UI. This application helps writers organize their stories with structured scenes, characters, and elements, making it easy to generate comprehensive prompts for AI writing tools.

## Features

### 📚 **Story Management**
- **Multiple Stories**: Create and manage multiple stories in one application
- **Story Organization**: Each story has its own background setup, cast, and scenes
- **Auto-save**: All changes are automatically saved to local storage
- **Version Control**: Data is versioned and automatically migrated between updates

### 👥 **Cast of Characters**
- **Global Cast**: Define characters once for the entire story
- **Character Profiles**: Each character has a name and detailed description
- **Reusable Characters**: Characters can be used across multiple scenes
- **Character Management**: Add, edit, and delete characters from the story's cast

### 🎬 **Scene Management**
- **Scene Creation**: Create multiple scenes within each story
- **Scene Descriptions**: Add detailed descriptions for each scene
- **Character Selection**: Select which characters appear in each scene from the story's cast
- **Scene Elements**: Add specific elements and events within each scene

### 📝 **Prompt Generation**
- **Smart Prompts**: Generate comprehensive prompts combining background, scene details, and characters
- **Clipboard Integration**: One-click copying to clipboard for use with AI tools
- **Structured Format**: Prompts are formatted in clear, organized Markdown

### 💾 **Data Persistence**
- **Local Storage**: All data is stored locally in your browser
- **No Server Required**: Works completely offline
- **Data Safety**: Automatic backups and version migration
- **Cross-platform**: Works on any device with a modern browser

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material UI v7
- **Build Tool**: Vite
- **State Management**: React Hooks with local storage
- **Styling**: Material UI theming system

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd prompter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## Usage

### Creating Your First Story

1. **Open the Stories Tab**
   - Click on the "Stories" tab in the main navigation
   - Click "Add New Story" to create your first story

2. **Add Characters to the Cast**
   - In the "Cast of Characters" section, click "Add Character"
   - Enter the character's name and description
   - Repeat for all characters in your story

3. **Set the Background**
   - Switch to the "Story Editor" tab
   - In the "Background Setup" section, describe your story's world and setting

4. **Create Scenes**
   - In the "Scenes" panel, click "Add Scene"
   - Give your scene a title and description
   - Select which characters appear in this scene from the cast

5. **Add Scene Elements**
   - Select a scene to edit its details
   - Add specific elements, events, or plot points for the scene
   - These will be included in your generated prompts

6. **Generate Prompts**
   - Click "Get Prompt" on any scene to generate a comprehensive prompt
   - The prompt will include background, scene details, and character information
   - Use this prompt with your favorite AI writing tool

### Data Structure

Each story contains:

```typescript
interface Story {
  id: string;
  title: string;
  description?: string;
  backgroundSetup: string;
  cast: Character[];           // Global cast of characters
  elements: StoryElement[];    // Global elements for the story
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
}

interface Character {
  id: string;
  name: string;
  description: string;
}

interface StoryElement {
  id: string;
  name: string;
  description: string;
  category?: string;
}

interface Scene {
  id: string;
  title: string;
  description: string;
  characterIds: string[];      // References to characters in cast
  elementIds: string[];        // References to elements in story
  createdAt: Date;
  updatedAt: Date;
}
```

### Data Persistence

- **Storage Location**: Browser's local storage (`localStorage`)
- **Storage Key**: `story-data`
- **Format**: JSON with versioning support
- **Auto-save**: Changes are saved automatically
- **Migration**: Data is automatically migrated between versions

### Version Control

The application includes a robust versioning system:

- **Current Version**: 1.0.0
- **Automatic Migration**: Old data formats are automatically upgraded
- **Backward Compatibility**: All previous data formats are supported
- **Version Display**: Current data version is shown in the app bar

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── BackgroundSetup.tsx
│   ├── CastManager.tsx
│   ├── SceneEditor.tsx
│   ├── SceneList.tsx
│   ├── StoriesPanel.tsx
│   └── VersionInfo.tsx
├── services/           # Business logic and data management
│   ├── MigrationService.ts
│   └── StoryService.ts
├── types/             # TypeScript type definitions
│   └── Story.ts
└── App.tsx           # Main application component
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
