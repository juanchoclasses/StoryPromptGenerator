# Story Prompt Editor

A modern, responsive web application for creating and managing story prompts with scenes, characters, and background settings. Built with React, TypeScript, Material UI, and Vite.

## Features

- **Background Scene Setup**: Create and edit the foundational background and setting for your story
- **Scene Management**: Add, edit, and delete scenes with a clean, intuitive interface
- **Character Management**: For each scene, add detailed character descriptions
- **Scene Items**: Organize sub-scenes within each main scene
- **Local Storage**: All data is automatically saved to your browser's local storage
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful Material Design interface with smooth interactions

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material UI v7
- **Build Tool**: Vite
- **Storage**: Browser Local Storage
- **Styling**: Emotion (CSS-in-JS)

## Getting Started

### Prerequisites

- Node.js (v20.17.0 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd prompter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Usage

### Background Setup
1. Start by describing your story's background and setting in the top section
2. Click the save button to persist your changes

### Managing Scenes
1. Click "Add Scene" to create a new scene
2. Select a scene from the list to edit its details
3. Use the expand/collapse buttons to view scene contents
4. Edit or delete scenes using the action buttons

### Adding Characters
1. Select a scene from the list
2. In the Scene Editor, expand the "Characters" section
3. Click "Add Character" to create a new character
4. Fill in the character's name and description
5. Edit or delete characters as needed

### Managing Scene Items
1. In the Scene Editor, expand the "Scene Items" section
2. Click "Add Scene Item" to create a new sub-scene
3. Provide a title and description for the scene item
4. Organize your story's flow with these sub-scenes

## Data Structure

The application stores data in the following structure:

```typescript
interface StoryData {
  backgroundSetup: string;
  scenes: Scene[];
  lastUpdated: Date;
}

interface Scene {
  id: string;
  title: string;
  characters: Character[];
  scenes: SceneItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface Character {
  id: string;
  name: string;
  description: string;
}

interface SceneItem {
  id: string;
  title: string;
  description: string;
  order: number;
}
```

## Data Persistence

All data is automatically saved to your browser's local storage under the key `story-data`. This means:
- Your work is automatically saved as you type
- Data persists between browser sessions
- No internet connection required
- Data is stored locally on your machine

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
