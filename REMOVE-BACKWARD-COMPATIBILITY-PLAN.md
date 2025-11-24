# Remove Backward Compatibility - Work Plan

## Status: READY TO IMPLEMENT

## Overview
Remove all backward compatibility layers that are causing bugs and complexity. The codebase has multiple conversion layers between `Book` model, `StoryData` format, and legacy field names that are no longer needed.

## Current Problems

### 1. Multiple Data Formats
- **Book Model**: The actual TypeScript class with proper types
- **StoryData**: Legacy format with deprecated fields (`characterIds`, `elementIds`)
- **Conversion bugs**: Properties like `layout` get lost during Book ↔ StoryData conversion

### 2. Deprecated Fields
- `Scene.characterIds` and `Scene.elementIds` (replaced by `characters` and `elements`)
- `StoryData.characters` and `StoryData.elements` (top-level, now at story level)
- Dummy `id` fields added to characters/elements for backward compat

### 3. Unnecessary Conversions
- `BookService.getBookData()` converts Book → StoryData (loses data!)
- `BookService.saveBookData()` converts StoryData → Book
- Components use `StoryData` when they should use `Book` directly

## Benefits of Removal

✅ **Eliminate bugs**: No more data loss during conversions (like the `layout` bug)
✅ **Simpler code**: Remove conversion functions and duplicate interfaces
✅ **Type safety**: Use actual TypeScript classes everywhere
✅ **Better performance**: No unnecessary object transformations
✅ **Easier maintenance**: Single source of truth

## Implementation Plan

### Phase 1: Update Type Definitions

**File: `src/types/Story.ts`**

```typescript
// REMOVE StoryData interface entirely
// REMOVE deprecated fields from Scene interface:
//   - characterIds
//   - elementIds

// KEEP only:
export interface Scene {
  id: string;
  title: string;
  description: string;
  textPanel?: string;
  diagramPanel?: DiagramPanel;
  layout?: SceneLayout;
  characters: string[];  // Character names (not IDs)
  elements: string[];    // Element names (not IDs)
  imageHistory?: GeneratedImage[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Phase 2: Update BookService

**File: `src/services/BookService.ts`**

**REMOVE these methods:**
- `getBookData()` - Returns StoryData (conversion layer)
- `saveBookData()` - Accepts StoryData (conversion layer)
- `getActiveBookData()` - Returns StoryData
- `saveActiveBookData()` - Accepts StoryData

**KEEP only:**
- `getAllBooks()` → `Promise<Book[]>`
- `getBook(id)` → `Promise<Book | null>`
- `getActiveBook()` → `Promise<Book | null>`
- `saveBook(book)` → `Promise<void>`
- `setActiveBook(id)` → `Promise<void>`
- `deleteBook(id)` → `Promise<boolean>`

### Phase 3: Update Components

**Files to update:**
- `src/components/SceneEditor.tsx`
- `src/components/StoriesPanel.tsx`
- `src/components/SceneList.tsx`
- `src/components/BookEditor.tsx`
- Any other components using `StoryData`

**Changes:**
1. Replace `StoryData` type with `Book` type
2. Replace `getActiveBookData()` with `getActiveBook()`
3. Replace `saveBookData()` with `saveBook()`
4. Use `book.stories` directly instead of `data.stories`

**Example:**
```typescript
// BEFORE
const data = await BookService.getActiveBookData();
if (data) {
  const story = data.stories.find(s => s.id === storyId);
}

// AFTER
const book = await BookService.getActiveBook();
if (book) {
  const story = book.stories.find(s => s.id === storyId);
}
```

### Phase 4: Clean Up Scene Model

**File: `src/models/Scene.ts`**

**REMOVE:**
- `characterIds` and `elementIds` from constructor
- Any logic handling these deprecated fields
- `SceneExchangeFormat` if it has deprecated fields

**KEEP:**
- Only `characters` and `elements` (name-based arrays)

### Phase 5: Update Storage/Serialization

**Files:**
- `src/services/StorageService.ts`
- `src/services/BookCache.ts`

**Changes:**
1. Remove any code handling `characterIds`/`elementIds`
2. Ensure serialization includes ALL current fields (especially `layout`)
3. Remove conversion logic for deprecated fields

### Phase 6: Update Import/Export

**File: `src/services/StoryImportService.ts`**

**Changes:**
- Remove handling of old format with `characterIds`/`elementIds`
- Only support name-based format

**File: `src/services/StoryExportService.ts`**

**Changes:**
- Remove generation of deprecated fields
- Export only current format

### Phase 7: Testing & Verification

**Test scenarios:**
1. ✅ Create new book → Save → Reload → Verify all data persists
2. ✅ Edit scene layout → Save → Reload → Verify layout persists
3. ✅ Add characters/elements → Reference in scenes → Verify references work
4. ✅ Import JSON story → Verify it loads correctly
5. ✅ Export story → Verify JSON is clean (no deprecated fields)
6. ✅ Generate images → Verify all features work

## Migration Strategy

**NO MIGRATION NEEDED** - User confirmed existing data can be discarded.

If users have data they want to keep:
1. Export all books to ZIP (with images) using current version
2. Update to new version
3. Import books from ZIP

## Files to Modify

### Core Changes (Required)
- [ ] `src/types/Story.ts` - Remove StoryData, clean Scene interface
- [ ] `src/services/BookService.ts` - Remove conversion methods
- [ ] `src/models/Scene.ts` - Remove deprecated fields
- [ ] `src/services/StorageService.ts` - Clean up serialization
- [ ] `src/services/BookCache.ts` - Clean up serialization

### Component Updates (Required)
- [ ] `src/components/SceneEditor.tsx` - Use Book instead of StoryData
- [ ] `src/components/StoriesPanel.tsx` - Use Book instead of StoryData
- [ ] `src/components/SceneList.tsx` - Use Book instead of StoryData
- [ ] `src/components/BookEditor.tsx` - Use Book instead of StoryData

### Import/Export (Required)
- [ ] `src/services/StoryImportService.ts` - Remove old format support
- [ ] `src/services/StoryExportService.ts` - Remove deprecated fields

### Testing (Required)
- [ ] Manual testing of all features
- [ ] Verify no console errors
- [ ] Verify data persistence

## Estimated Effort

- **Phase 1-2**: 1 hour (type definitions and service cleanup)
- **Phase 3**: 2 hours (component updates)
- **Phase 4-5**: 1 hour (model and storage cleanup)
- **Phase 6**: 30 minutes (import/export)
- **Phase 7**: 1 hour (testing)

**Total**: ~5.5 hours

## Success Criteria

✅ No `StoryData` type anywhere in codebase
✅ No `characterIds` or `elementIds` fields
✅ All components use `Book` model directly
✅ All features work (create, edit, save, load, import, export, generate images)
✅ Layout persistence works correctly
✅ No conversion bugs or data loss

## Notes

- This is a **breaking change** - old saved data won't load
- User has confirmed this is acceptable
- Will significantly simplify codebase
- Will prevent future bugs like the layout persistence issue
- Makes the codebase more maintainable

## Next Steps

1. Review this plan
2. Get approval
3. Create a new branch: `remove-backward-compat`
4. Implement phases 1-6
5. Test thoroughly (phase 7)
6. Merge to main

---

**Question for user**: Should we proceed with this plan? Any concerns or modifications needed?

