# Technology Stack

## Core Technologies

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material-UI (MUI) v7 with Emotion styling
- **Build Tool**: Vite 7 for fast development and optimized builds
- **Desktop**: Electron 33 with IPC for filesystem operations
- **Testing**: Vitest with React Testing Library and jsdom
- **Storage**: Browser localStorage (web) / electron-store (desktop)

## Key Libraries

- `@google/generative-ai` - Google Gemini API integration
- `@modelcontextprotocol/sdk` - MCP integration
- `mermaid` - Diagram rendering
- `marked` - Markdown parsing
- `katex` - Math rendering
- `docx` - Word document export
- `html2canvas` - Screenshot/image capture
- `jszip` - Archive handling
- `uuid` - ID generation

## Common Commands

### Development
```bash
npm run dev                 # Start Vite dev server (port 5173)
npm run electron:dev        # Start Electron app with hot reload
```

### Testing
```bash
npm test                    # Run tests once
npm run test:ui             # Run tests with UI
npm run test:coverage       # Generate coverage report
```

### Building
```bash
npm run build               # Build for web (outputs to dist/)
npm run electron:build      # Build Electron app
npm run electron:pack       # Package Electron app (no installer)
```

### Deployment
```bash
npm run deploy              # Deploy to GitHub Pages
```

### Linting
```bash
npm run lint                # Run ESLint
```

## Build Configuration

- **Base Path**: `/StoryPromptGenerator/` for web, `./` for Electron
- **Output**: `dist/` directory
- **TypeScript**: Strict mode with project references (app + node configs)
- **Test Environment**: jsdom with globals enabled
