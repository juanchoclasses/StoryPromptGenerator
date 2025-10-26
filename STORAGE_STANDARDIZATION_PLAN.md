# Storage Standardization Work Order

## Overview
Standardize the localStorage storage format to match the JSON import format, creating a single, consistent data structure for both internal storage and import/export operations.

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

### Option A: Dual Format Support (RECOMMENDED)

Keep both formats but make them interchangeable:

1. **Internal Format** (localStorage): Current format with IDs
   - Pros: No breaking changes, IDs enable fast lookups, maintains referential integrity
   - Cons: More complex than import format

2. **Exchange Format** (import/export): JSON format with names
   - Pros: Human-readable, portable, easy to create manually
   - Cons: Requires name-to-ID mapping

3. **Conversion Layer**: Add utilities to convert between formats
   - `toExchangeFormat(story: Story): StoryBundle` - Convert IDs to names
   - `fromExchangeFormat(bundle: StoryBundle): Story` - Convert names to IDs

### Option B: Standardize on Name-Based References

Change internal storage to use names instead of IDs:

1. **Benefits**:
   - Single format for both storage and import/export
   - Simpler data structure
   - Easier manual editing of localStorage data

2. **Drawbacks**:
   - Name changes require updating all scene references
   - Potential performance issues with name lookups
   - Risk of name conflicts/duplicates
   - Loss of referential integrity

### Option C: Standardize on ID-Based Import Format

Add IDs to the JSON import format:

1. **Benefits**:
   - Single format for both storage and import/export
   - Maintains referential integrity

2. **Drawbacks**:
   - Less human-readable import files
   - Requires generating UUIDs when creating import files manually
   - Harder to write import files by hand

## Recommended Approach: Option A (Dual Format)

### Implementation Plan

#### Phase 1: Create Exchange Format Types
1. Define `StoryExchangeFormat` interface matching JSON schema
2. Add type definitions for the exchange format

#### Phase 2: Add Conversion Utilities
1. Create `StoryExchangeService.ts`:
   ```typescript
   export class StoryExchangeService {
     static toExchangeFormat(story: Story): StoryExchangeFormat
     static fromExchangeFormat(bundle: StoryExchangeFormat): Story
     static validateExchangeFormat(data: unknown): ValidationResult
   }
   ```

2. Implement `toExchangeFormat`:
   - Map character IDs → names in scenes
   - Map element IDs → names in scenes
   - Strip internal metadata (id, createdAt, updatedAt)
   - Strip image data

3. Implement `fromExchangeFormat`:
   - Generate UUIDs for all entities
   - Create name→ID maps for characters and elements
   - Map character/element names → IDs in scenes
   - Add timestamps
   - Initialize empty imageHistory arrays

#### Phase 3: Update Import/Export
1. Modify `ImportStoryDialog`:
   - Use `StoryExchangeService.fromExchangeFormat()` instead of manual conversion
   - Remove duplicate conversion logic

2. Add Export to Exchange Format:
   - Add "Export Story to JSON" button in StoriesPanel
   - Use `StoryExchangeService.toExchangeFormat()`
   - Download as `.json` file

#### Phase 4: Add Validation
1. JSON Schema validation for imported files
2. Warnings for:
   - Duplicate character/element names
   - Missing references in scenes
   - Invalid data types

#### Phase 5: Documentation
1. Update `STORY_DEFINITION_GUIDE.md` with exchange format docs
2. Create examples of both formats
3. Document conversion utilities

## File Changes Required

### New Files
- `src/services/StoryExchangeService.ts` - Conversion utilities
- `src/types/StoryExchange.ts` - Exchange format type definitions

### Modified Files
- `src/components/ImportStoryDialog.tsx` - Use new conversion service
- `src/components/StoriesPanel.tsx` - Add JSON export button
- `src/services/MarkdownStoryParser.ts` - Return exchange format
- `story-import-schema.json` - Update if needed
- `STORY_DEFINITION_GUIDE.md` - Document both formats

### No Changes Needed
- `src/types/Story.ts` - Keep internal format as-is
- `src/services/BookService.ts` - No changes to storage
- All UI components - Continue using internal format

## Benefits

1. **Backward Compatibility**: Existing localStorage data unchanged
2. **Clean Separation**: Internal format optimized for performance, exchange format for portability
3. **Easy Import/Export**: Users can create stories in text editors
4. **Future-Proof**: Can add more features to internal format without breaking imports
5. **Validation**: Clear contract for import files

## Migration Strategy

**No migration needed** - This is purely additive:
1. Current localStorage format stays the same
2. Import continues to work (with improved conversion)
3. New export functionality added

## Testing Plan

1. Unit tests for conversion utilities
2. Test import with existing factorial-story.json
3. Test round-trip (export → import) preserves data
4. Test edge cases (duplicate names, missing references)
5. Performance testing with large stories (100+ scenes)

## Timeline Estimate

- Phase 1 (Types): 30 minutes
- Phase 2 (Conversion): 2 hours
- Phase 3 (Import/Export UI): 1 hour
- Phase 4 (Validation): 1 hour
- Phase 5 (Documentation): 30 minutes
- **Total**: ~5 hours

## Open Questions

1. Should we support exporting individual stories or entire books?
2. Should the exchange format include book-level settings (aspectRatio, panelConfig)?
3. Do we want to support exporting images along with story data?
4. Should we version the exchange format separately from internal format?

## Success Criteria

- [ ] Can export any story to JSON matching import schema
- [ ] Can import exported JSON and get identical story (minus timestamps)
- [ ] Import/export is lossless for story content
- [ ] Validation catches common errors before import
- [ ] Documentation clearly explains both formats
- [ ] All existing tests pass
- [ ] No breaking changes to localStorage format

