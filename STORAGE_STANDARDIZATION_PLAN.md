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

```typescript
interface StoryData {
  version: string;
  stories: StoryExchangeFormat[];  // Array of stories in exchange format
  lastUpdated: Date;
}

interface StoryExchangeFormat {
  story: {
    title: string;
    backgroundSetup: string;
    description?: string;
  };
  characters: Array<{
    name: string;        // Unique within story
    description: string;
  }>;
  elements: Array<{
    name: string;        // Unique within story
    description: string;
    category?: string;
  }>;
  scenes: Array<{
    title: string;
    description: string;
    textPanel?: string;
    characters: string[];  // Character names (not IDs!)
    elements: string[];    // Element names (not IDs!)
  }>;
  // Metadata (not in import/export files)
  id?: string;           // Internal use only
  createdAt?: Date;      // Internal use only
  updatedAt?: Date;      // Internal use only
  imageHistory?: { ... } // Stored separately in IndexedDB
}
```

### Implementation Plan

#### Phase 1: Update Type Definitions (30 min)
1. Update `Story.ts` to use name-based references:
   ```typescript
   interface Scene {
     title: string;
     description: string;
     textPanel?: string;
     characters: string[];  // Changed from characterIds
     elements: string[];    // Changed from elementIds
     // Remove createdAt/updatedAt from core - add to wrapper if needed
   }
   
   interface Story {
     title: string;
     backgroundSetup: string;
     description?: string;
     characters: Character[];  // No IDs!
     elements: StoryElement[];  // No IDs!
     scenes: Scene[];
   }
   ```

2. Add metadata wrapper for internal use:
   ```typescript
   interface StoredStory extends Story {
     id: string;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

#### Phase 2: Update BookService (1 hour)
1. Change storage format to store stories directly
2. Remove ID-based lookups, use name-based lookups
3. Add validation for unique names within stories
4. Migration: Clear existing data (accepted by user)

#### Phase 3: Update All Components (2 hours)
1. **SceneEditor**: Use character/element names directly
2. **CastManager**: Enforce unique names, update scene references on rename
3. **ElementsManager**: Enforce unique names, update scene references on rename
4. **ImportStoryDialog**: Simplified - no conversion needed!
5. **All other components**: Use names instead of IDs

#### Phase 4: Add Helper Utilities (1 hour)
1. `findCharacterByName(story, name)` - lookup helper
2. `findElementByName(story, name)` - lookup helper  
3. `renameCharacter(story, oldName, newName)` - updates all scene references
4. `renameElement(story, oldName, newName)` - updates all scene references
5. `validateUniqueNames(story)` - enforces uniqueness

#### Phase 5: Update Import/Export (30 min)
1. Import: Direct load (already done in `ImportStoryDialog`)
2. Export: Direct save (already done in `StoryExportService`)
3. Remove any conversion logic

#### Phase 6: Testing & Cleanup (1 hour)
1. Test import → edit → export round-trip
2. Test character/element renaming
3. Test duplicate name prevention
4. Remove deprecated ID-based code
5. Update documentation

## File Changes Required

### New Files
- `src/services/StoryExportService.ts` - ✅ **Already created** - Export to JSON
- `src/services/StoryHelpers.ts` - Name lookup and rename utilities

### Modified Files (Major Changes)
- `src/types/Story.ts` - Remove IDs, use names for references
- `src/services/BookService.ts` - Name-based storage and lookups
- `src/components/SceneEditor.tsx` - Use names instead of IDs
- `src/components/CastManager.tsx` - Enforce unique names, handle renames
- `src/components/ElementsManager.tsx` - Enforce unique names, handle renames
- `src/components/ImportStoryDialog.tsx` - Simplified (no conversion!)
- `src/components/StoriesPanel.tsx` - ✅ **Already has download button**

### Modified Files (Minor Changes)
- All components that reference characters/elements - use names
- `src/services/MigrationService.ts` - Add clear-all migration for v4.0.0

### Removed
- All ID-based lookup logic
- ID generation for characters/elements
- Character/element ID arrays in scenes

## Benefits

1. **Simplicity**: Single format everywhere - no conversion needed
2. **Human-Readable**: Can manually edit localStorage data
3. **Portable**: Stories are self-contained and shareable
4. **Debuggable**: Easy to inspect and understand data
5. **Direct Import/Export**: No transformation layer
6. **Clean Codebase**: Less complexity, fewer abstractions

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

- Phase 1 (Types): 30 min
- Phase 2 (BookService): 1 hour
- Phase 3 (Components): 2 hours
- Phase 4 (Helpers): 1 hour
- Phase 5 (Import/Export): 30 min
- Phase 6 (Testing): 1 hour
- **Total**: ~6 hours

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

