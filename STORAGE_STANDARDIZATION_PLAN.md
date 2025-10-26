# Storage Standardization Work Order

## Status: REVISED - No Legacy Data

**IMPORTANT**: User has confirmed that existing localStorage data can be trashed. No backward compatibility needed. This massively simplifies the implementation.

## Overview
Standardize the localStorage storage format to match the JSON import/export format, using name-based references instead of IDs for maximum simplicity and portability.

## Current Situation

### LocalStorage Format (StoryData)
```typescript
interface StoryData {
  version: string;
  stories: Story[];
  characters: Character[];  // DEPRECATED in v3.0.0
  elements: StoryElement[];  // DEPRECATED in v3.0.0
  lastUpdated: Date;
}

interface Story {
  id: string;
  title: string;
  description?: string;
  backgroundSetup: string;
  characters: Character[];  // Array of full Character objects with IDs
  elements: StoryElement[];  // Array of full Element objects with IDs
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
}

interface Scene {
  id: string;
  title: string;
  description: string;
  textPanel?: string;
  characterIds: string[];  // Array of IDs referencing story.characters
  elementIds: string[];    // Array of IDs referencing story.elements
  imageHistory?: GeneratedImage[];
  lastGeneratedImage?: string;  // DEPRECATED
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
```

### JSON Import Format
```json
{
  "story": {
    "title": "Story Title",
    "backgroundSetup": "Background description..."
  },
  "characters": [
    {
      "name": "Character Name",
      "description": "Description..."
    }
  ],
  "elements": [
    {
      "name": "Element Name",
      "description": "Description...",
      "category": "Category"
    }
  ],
  "scenes": [
    {
      "title": "Scene Title",
      "description": "Scene description...",
      "textPanel": "Text overlay...",
      "characters": ["Character Name 1", "Character Name 2"],
      "elements": ["Element Name 1"]
    }
  ]
}
```

## Key Differences

1. **Scene References**:
   - **localStorage**: Uses IDs (`characterIds`, `elementIds`)
   - **JSON Import**: Uses names (`characters`, `elements`)

2. **Metadata**:
   - **localStorage**: Has `id`, `createdAt`, `updatedAt` timestamps
   - **JSON Import**: No IDs or timestamps (generated on import)

3. **Top-level Structure**:
   - **localStorage**: Wrapped in `StoryData` with version and lastUpdated
   - **JSON Import**: Flat structure with `story`, `characters`, `elements`, `scenes`

4. **Image Data**:
   - **localStorage**: Has `imageHistory` and deprecated `lastGeneratedImage`
   - **JSON Import**: No image data (images generated after import)

## Proposed Solution

### SIMPLIFIED: Name-Based Format for Everything

Since there's no legacy data to worry about, we'll standardize on the **name-based JSON format** for BOTH storage and import/export.

**Benefits**:
- ✅ Single format everywhere - no conversion needed
- ✅ Human-readable localStorage data
- ✅ Easy to manually edit/debug
- ✅ Direct import/export - no transformation
- ✅ Portable and shareable
- ✅ Simpler codebase

**Trade-offs** (acceptable given benefits):
- ⚠️ Name changes require updating scene references (but we can provide tools for this)
- ⚠️ Names must be unique within a story (enforce in UI)
- ⚠️ Slightly slower lookups (but negligible for reasonable story sizes)

## New Storage Format

### Storage Structure (.ts file for testability)

All storage logic will be moved to TypeScript files for proper unit testing:
- `src/models/Book.ts` - Book class with validation and methods
- `src/models/Story.ts` - Story class with validation and methods  
- `src/models/Scene.ts` - Scene class with validation and methods
- `src/services/StorageService.ts` - Handles localStorage operations
- `tests/models/` - Unit tests for all models

```typescript
// Complete storage format
interface AppData {
  version: string;
  books: Book[];
  activeBookId?: string;
  lastUpdated: Date;
}

interface Book {
  id: string;
  title: string;
  description?: string;
  backgroundSetup?: string;     // Book-wide background for all stories
  aspectRatio?: string;          // e.g., "9:16", "16:9", "1:1"
  
  // NEW: Book-level style configuration
  style: BookStyle;
  
  stories: Story[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface BookStyle {
  // Visual style guidance for all stories in this book
  colorPalette?: string;         // Description of colors to use
  visualTheme?: string;          // Overall visual theme/aesthetic
  characterStyle?: string;       // How characters should look
  environmentStyle?: string;     // How environments should look
  artStyle?: string;             // Art style (e.g., "hand-painted", "digital", "watercolor")
  
  // Panel configuration (for text overlays)
  panelConfig?: {
    fontFamily?: string;
    fontSize?: number;
    textAlign?: string;
    widthPercentage?: number;
    heightPercentage?: number;
    autoHeight?: boolean;
    position?: string;
    backgroundColor?: string;
    fontColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    gutterTop?: number;
    gutterBottom?: number;
    gutterLeft?: number;
    gutterRight?: number;
  };
}

interface Story {
  title: string;
  backgroundSetup: string;      // Story-specific background
  description?: string;
  
  characters: Character[];
  elements: Element[];
  scenes: Scene[];
  
  // Metadata (not in export files)
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Character {
  name: string;                  // Unique within story
  description: string;
}

interface Element {
  name: string;                  // Unique within story
  description: string;
  category?: string;
}

interface Scene {
  title: string;
  description: string;
  textPanel?: string;
  characters: string[];          // Character names (not IDs!)
  elements: string[];            // Element names (not IDs!)
  
  // Metadata (not in export files)
  id?: string;
  imageHistory?: GeneratedImage[];
}

interface GeneratedImage {
  id: string;
  modelName: string;
  timestamp: Date;
  // url not stored in localStorage - loaded from IndexedDB
}
```

### Import/Export Format

When importing/exporting stories, they use a simplified format without IDs:

```typescript
interface StoryExchangeFormat {
  story: {
    title: string;
    backgroundSetup: string;
    description?: string;
  };
  characters: Character[];
  elements: Element[];
  scenes: Omit<Scene, 'id' | 'imageHistory'>[];
}
```

Books can optionally be exported with their style configuration:

```typescript
interface BookExchangeFormat {
  book: {
    title: string;
    description?: string;
    backgroundSetup?: string;
    aspectRatio?: string;
    style: BookStyle;
  };
  stories: StoryExchangeFormat[];
}
```

### Implementation Plan

#### Phase 1: Create Model Layer with Tests (2 hours)
1. **Create Model Classes** (`src/models/`):
   ```typescript
   // src/models/Book.ts
   export class Book {
     constructor(data: Partial<Book>);
     validate(): ValidationResult;
     addStory(story: Story): void;
     removeStory(storyId: string): void;
     updateStyle(style: Partial<BookStyle>): void;
     toJSON(): BookExchangeFormat;
     static fromJSON(data: BookExchangeFormat): Book;
   }
   
   // src/models/Story.ts
   export class Story {
     constructor(data: Partial<Story>);
     validate(): ValidationResult;
     addCharacter(character: Character): void;
     renameCharacter(oldName: string, newName: string): void;
     addElement(element: Element): void;
     renameElement(oldName: string, newName: string): void;
     addScene(scene: Scene): void;
     toJSON(): StoryExchangeFormat;
     static fromJSON(data: StoryExchangeFormat): Story;
   }
   
   // src/models/Scene.ts
   export class Scene {
     constructor(data: Partial<Scene>);
     validate(story: Story): ValidationResult;
     addCharacter(name: string): void;
     removeCharacter(name: string): void;
     addElement(name: string): void;
     removeElement(name: string): void;
   }
   ```

2. **Create Unit Tests** (`tests/models/`):
   - `Book.test.ts` - Test book creation, validation, style management
   - `Story.test.ts` - Test story operations, character/element renaming
   - `Scene.test.ts` - Test scene validation, name references

3. **Update Type Definitions**:
   - Move to name-based references (characters/elements as string arrays)
   - Add `BookStyle` interface with visual style fields
   - Remove ID-based references from core types

#### Phase 2: Create Storage Service (1.5 hours)
1. **Create `StorageService.ts`**:
   ```typescript
   export class StorageService {
     static load(): AppData;
     static save(data: AppData): void;
     static getBook(bookId: string): Book | null;
     static saveBook(book: Book): void;
     static deleteBook(bookId: string): void;
     static getActiveBook(): Book | null;
     static setActiveBook(bookId: string): void;
     // Migration utilities
     static migrate(): void;
     static clearAll(): void;
   }
   ```

2. **Add Storage Tests**:
   - Test save/load operations
   - Test data integrity
   - Test migration from old format

#### Phase 3: Update BookService (1 hour)
1. Refactor to use new `StorageService` and model classes
2. Remove ID-based lookups, use name-based lookups
3. Add validation for unique names within stories
4. Migration: Clear existing data (accepted by user)

#### Phase 4: Add Book Style Management UI (1.5 hours)
1. **Create `BookStyleEditor` component**:
   - Visual style fields (color palette, visual theme, character style, etc.)
   - Art style selector
   - Panel configuration (moved from separate dialog)
   - Preview/description of how style affects image generation

2. **Update `FileManager`**:
   - Add "Edit Style" button for books
   - Integrate BookStyleEditor dialog

3. **Update Prompt Generation**:
   - Include book style in image generation prompts
   - Combine book style + book background + story background + scene description

#### Phase 5: Update All Components (2 hours)
1. **SceneEditor**: Use character/element names directly
2. **CastManager**: Enforce unique names, update scene references on rename
3. **ElementsManager**: Enforce unique names, update scene references on rename
4. **ImportStoryDialog**: Simplified - no conversion needed!
5. **All other components**: Use names instead of IDs

#### Phase 6: Update Import/Export (1 hour)
1. **Story Export**: Already done in `StoryExportService`
2. **Book Export**: Add export entire book with style
   ```typescript
   export class BookExportService {
     static exportBook(book: Book): void;
     static exportBookWithImages(book: Book): Promise<void>;
   }
   ```
3. **Book Import**: Add import entire book
4. Remove any ID-based conversion logic

#### Phase 7: Testing & Documentation (1.5 hours)
1. Run all unit tests for models
2. Test import → edit → export round-trip
3. Test character/element renaming
4. Test duplicate name prevention
5. Test book style application to prompts
6. Remove deprecated ID-based code
7. Update documentation
8. Create example book export files

## File Changes Required

### New Files
- **Models & Tests**:
  - `src/models/Book.ts` - Book class with methods and validation
  - `src/models/Story.ts` - Story class with methods and validation
  - `src/models/Scene.ts` - Scene class with methods and validation
  - `tests/models/Book.test.ts` - Unit tests for Book class
  - `tests/models/Story.test.ts` - Unit tests for Story class
  - `tests/models/Scene.test.ts` - Unit tests for Scene class

- **Services**:
  - `src/services/StorageService.ts` - localStorage operations with tests
  - `src/services/BookExportService.ts` - Export books with style
  - `src/services/StoryExportService.ts` - ✅ **Already created** - Export stories to JSON

- **Components**:
  - `src/components/BookStyleEditor.tsx` - Book style management UI

- **Types**:
  - `src/types/BookStyle.ts` - BookStyle interface and defaults

### Modified Files (Major Changes)
- `src/types/Story.ts` - Remove IDs, use names for references
- `src/types/Book.ts` - Add `style: BookStyle` and `stories: Story[]`
- `src/services/BookService.ts` - Use StorageService and model classes
- `src/components/FileManager.tsx` - Add "Edit Style" button
- `src/components/SceneEditor.tsx` - Use names, include book style in prompts
- `src/components/CastManager.tsx` - Enforce unique names, handle renames
- `src/components/ElementsManager.tsx` - Enforce unique names, handle renames
- `src/components/ImportStoryDialog.tsx` - Simplified (no conversion!)
- `src/components/StoriesPanel.tsx` - ✅ **Already has download button**

### Modified Files (Minor Changes)
- All components that reference characters/elements - use names
- `src/services/MigrationService.ts` - Add clear-all migration for v4.0.0
- `src/services/PromptService.ts` - Include book style in prompts

### Removed
- All ID-based lookup logic
- ID generation for characters/elements
- Character/element ID arrays in scenes
- Separate PanelConfigDialog (moved into BookStyleEditor)

## Benefits

1. **Simplicity**: Single format everywhere - no conversion needed
2. **Human-Readable**: Can manually edit localStorage data
3. **Portable**: Stories are self-contained and shareable
4. **Debuggable**: Easy to inspect and understand data
5. **Direct Import/Export**: No transformation layer
6. **Clean Codebase**: Less complexity, fewer abstractions
7. **Testability**: Proper model classes with comprehensive unit test coverage
8. **Book Style System**: Centralized visual style management for entire books

## New Feature: Book Style Management

The book style system allows setting visual style guidelines that apply to all stories in a book:

### Visual Style Fields
- **Color Palette**: Description of colors to use throughout the book
- **Visual Theme**: Overall aesthetic (e.g., "whimsical", "dark and mysterious")
- **Character Style**: How characters should look (proportions, style, etc.)
- **Environment Style**: How settings and environments should appear
- **Art Style**: Specific art style (e.g., "hand-painted", "digital", "watercolor")

### Panel Configuration
- Moved from book-level to book style (more logical grouping)
- Font, sizing, positioning, colors, borders, gutters
- Applies to all text overlays across all stories in the book

### Prompt Integration
When generating images, the system will combine:
1. **Book Style** (visual guidelines)
2. **Book Background Setup** (world description)
3. **Story Background Setup** (story-specific context)
4. **Scene Description** (specific scene details)

This creates consistent visuals across an entire book while allowing story-specific variations.

### Export/Import
- Books can be exported with their style configuration
- Enables sharing complete "styled books" between users
- Maintains visual consistency when reimporting

## Migration Strategy

**DATA RESET**: User has accepted clearing existing data
1. Bump version to 4.0.0
2. Add migration that clears all story data
3. Show notification: "Storage format updated - please re-import stories"
4. Users re-import from JSON files (which they can now download first!)

## Testing Plan

1. Test character rename updates all scenes
2. Test element rename updates all scenes  
3. Test duplicate name prevention
4. Test import → edit → export round-trip
5. Test lookup performance with large stories
6. Test unique name validation

## Timeline Estimate

- Phase 1 (Model Layer with Tests): 2 hours
- Phase 2 (Storage Service): 1.5 hours
- Phase 3 (Update BookService): 1 hour
- Phase 4 (Book Style Management UI): 1.5 hours
- Phase 5 (Update Components): 2 hours
- Phase 6 (Import/Export): 1 hour
- Phase 7 (Testing & Documentation): 1.5 hours
- **Total**: ~10.5 hours

### Key Additions vs Original Plan
- ✅ Proper model layer with classes (+2 hours)
- ✅ Unit tests for all models (+1 hour)
- ✅ Book style management system (+1.5 hours)
- ✅ Storage service abstraction (+0.5 hours)

## Breaking Changes

**localStorage Data**: All existing story data will be cleared
- **Mitigation**: Users can export stories as JSON before update (if needed)
- **User Acceptance**: Confirmed by user that data can be trashed

## Success Criteria

- [ ] Stories use names instead of IDs for all references
- [ ] Can import JSON files directly without conversion
- [ ] Can export stories and re-import without loss
- [ ] Character/element renames update all scene references
- [ ] Duplicate names are prevented in UI
- [ ] Round-trip import/export is lossless
- [ ] All UI components work with name-based references
- [ ] Documentation updated to reflect new format

