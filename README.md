# Story Prompt Generator

A comprehensive web application for creating, organizing, and generating AI image prompts for storytelling and creative projects. Built with React, TypeScript, and Material-UI.

## 🌟 Features

### 📚 Book Management
- **Multi-book Organization**: Create and manage multiple books to organize your stories
- **Book Metadata**: Add titles and descriptions to provide context for your creative projects
- **Import/Export**: Backup and restore your books with JSON export/import functionality
- **Data Migration**: Automatic migration from older data formats

### 📖 Story Creation
- **Story Structure**: Create stories with titles, descriptions, and background setups
- **Scene Management**: Organize stories into individual scenes with detailed descriptions
- **Auto-save**: All changes are automatically saved to local storage
- **Version Control**: Built-in data versioning with automatic migration

### 🎭 Character Management
- **Global Cast**: Define characters that can be used across multiple scenes and stories
- **Character Details**: Add names and detailed descriptions for each character
- **Scene Assignment**: Assign characters to specific scenes for focused storytelling

### 🎨 Element Management
- **Story Elements**: Create objects, props, and environmental elements
- **Categorization**: Organize elements with optional categories
- **Scene Integration**: Add elements to scenes for rich visual descriptions

### 🤖 AI Prompt Generation
- **Structured Prompts**: Generate comprehensive prompts for AI image generation
- **Context-Aware**: Includes book description, background setup, scene details, characters, and elements
- **Copy to Clipboard**: One-click prompt copying for easy use with AI services
- **Rich Context**: Prompts include all relevant information for accurate image generation

### 💾 Data Management
- **Local Storage**: All data is stored locally in your browser
- **No Server Required**: Works completely offline
- **Data Export**: Backup your entire book collection
- **Migration Support**: Automatic upgrades from older data formats

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material-UI (MUI) with custom theming
- **Build Tool**: Vite for fast development and optimized builds
- **Deployment**: GitHub Pages for static hosting

### Project Structure
```
src/
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
└── App.tsx           # Main application component
```

### Data Models

#### Book Structure
```typescript
interface Book {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Story Structure
```typescript
interface Story {
  id: string;
  title: string;
  description?: string;
  backgroundSetup: string;
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Scene Structure
```typescript
interface Scene {
  id: string;
  title: string;
  description: string;
  characterIds: string[];      // References to characters
  elementIds: string[];        // References to elements
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/juanchoclasses/StoryPromptGenerator.git
   cd StoryPromptGenerator
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

### Building for Production
```bash
npm run build
```

### Deployment
The application is automatically deployed to GitHub Pages:
```bash
npm run deploy
```

## 📖 Usage Guide

### Creating Your First Book
1. Open the application and navigate to the "Books" tab
2. Click "New Book" to create your first book
3. Enter a title and optional description
4. Click "Create" to save your book

### Adding Stories
1. Select a book from the Books tab
2. Navigate to the "Stories" tab
3. Click "New Story" to create your first story
4. Enter a title and description for your story

### Managing Characters
1. Navigate to the "Book Characters" tab
2. Click "Add Character" to create new characters
3. Provide a name and detailed description
4. Characters can be assigned to scenes in the Story Editor

### Managing Elements
1. Navigate to the "Book Elements" tab
2. Click "Add Element" to create story elements
3. Provide a name, description, and optional category
4. Elements can be assigned to scenes in the Story Editor

### Creating Scenes
1. Select a story in the Stories tab
2. Click "New Scene" to add a scene
3. Enter a title and description for the scene
4. Assign characters and elements to the scene

### Generating Prompts
1. Navigate to the "Story Editor" tab
2. Select a scene from the scene list
3. Customize the scene details, characters, and elements
4. Click "Get Prompt" to generate and copy the AI prompt

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages

### Code Style
- TypeScript for type safety
- ESLint for code linting
- Material-UI for consistent UI components
- Functional components with React hooks

### Data Persistence
- All data is stored in browser localStorage
- Automatic data migration between versions
- Export/import functionality for data backup

## 🌐 Live Application

The application is live at: **[https://juanchoclasses.github.io/StoryPromptGenerator](https://juanchoclasses.github.io/StoryPromptGenerator)**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [GitHub Issues](https://github.com/juanchoclasses/StoryPromptGenerator/issues)
2. Create a new issue with detailed information about your problem
3. Include browser version and any error messages

## 🔄 Version History

- **v2.0.0**: Complete rewrite with book-based organization
- **v1.0.0**: Initial release with story management

---

**Built with ❤️ using React, TypeScript, and Material-UI**
