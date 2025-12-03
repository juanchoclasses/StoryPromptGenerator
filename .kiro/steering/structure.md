# Project Structure

## Directory Organization

```
src/
├── components/          # React UI components (Material-UI based)
├── services/           # Business logic and data management
├── models/             # Domain models (Book, Story, Scene)
├── types/              # TypeScript type definitions
├── constants/          # Shared constants (aspect ratios, image models)
├── hooks/              # Custom React hooks
└── assets/             # Static assets

electron/               # Electron main process and preload scripts
tests/                  # Test files mirroring src/ structure
stories/                # Sample story JSON files
coverage/               # Test coverage reports (generated)
```

## Key Architectural Patterns

### Service Layer
- `BookService.ts` - High-level book management API (uses StorageService + Book model)
- `StorageService.ts` - Persistence layer (localStorage/electron-store)
- `ImageStorageService.ts` - Image storage and retrieval (filesystem/IndexedDB)
- `FileSystemService.ts` - Filesystem abstraction (web File System Access API / Electron IPC)
- `PromptService.ts` - AI prompt generation
- `MarkdownStoryParser.ts` - Story import from markdown
- `*ExportService.ts` - Various export formats (DOCX, JSON with images)

### Model Layer
- `Book.ts` - Book domain model with validation and business logic
- `Story.ts` - Story model with character/element management
- `Scene.ts` - Scene model with layout and content

### Component Organization
- Components are functional with React hooks
- Material-UI components for consistent styling
- Dialog components for modals (e.g., `SettingsDialog`, `ImportStoryDialog`)
- Manager components for CRUD operations (e.g., `CastManager`, `ElementsManager`)
- Editor components for content editing (e.g., `SceneEditor`, `SceneLayoutEditor`)

## Data Flow

1. **Storage**: StorageService ↔ localStorage/electron-store
2. **Business Logic**: BookService uses StorageService + Book model
3. **UI**: Components call BookService methods
4. **State**: React useState/useEffect for local state, callbacks for updates

## File Naming Conventions

- Components: PascalCase (e.g., `SceneEditor.tsx`)
- Services: PascalCase (e.g., `BookService.ts`)
- Types: PascalCase (e.g., `Story.ts`)
- Tests: Match source file with `.test.ts(x)` suffix
- Constants: camelCase files (e.g., `aspectRatios.ts`)

## Testing Structure

Tests mirror the `src/` structure:
- `tests/components/` - Component tests
- `tests/services/` - Service tests
- `tests/models/` - Model tests
- `tests/setup.ts` - Test configuration

## Configuration Files

- `vite.config.ts` - Vite build configuration
- `vitest.config.ts` - Test configuration
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App TypeScript config
- `tsconfig.node.json` - Node/build TypeScript config
- `electron-builder.yml` - Electron packaging config
- `eslint.config.js` - ESLint configuration
