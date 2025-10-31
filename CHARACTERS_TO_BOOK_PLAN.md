# Move Characters to Book Level - Refactoring Plan

**Created:** October 30, 2025  
**Status:** 📝 Planning  
**Priority:** HIGH - Resolves character image gallery sharing issue

---

## 🎯 Problem Statement

Currently, characters belong to individual stories. When creating a new story with the "same" characters (e.g., Professor Fizzwinkle in both "Stacks and Queues" and "Dijkstra's Quest"), they are actually separate character instances. This means:

❌ Character image galleries don't carry over to new stories  
❌ Have to regenerate character images for each story  
❌ No guarantee of visual consistency across stories  
❌ Wasted storage and generation costs

## ✅ Desired Architecture

Characters should belong to the **Book** level, allowing:

✓ Characters shared across all stories in a book  
✓ Image galleries preserved across stories  
✓ Generate once, use everywhere  
✓ Guaranteed visual consistency  
✓ Efficient storage and reuse

---

## 📊 Architecture Changes

### Current Structure
```
Book
├── stories[]
    └── Story
        ├── characters[]  ← Characters here (story-level)
        ├── elements[]
        └── scenes[]
            ├── characters: string[]  (character names)
            └── elements: string[]  (element names)
```

### New Structure
```
Book
├── characters[]  ← Characters move here (book-level)
├── stories[]
    └── Story
        ├── elements[]  (remain at story level - story-specific)
        └── scenes[]
            ├── characters: string[]  (character names - unchanged)
            └── elements: string[]  (element names - unchanged)
```

---

## 📋 Implementation Steps

### Phase 1: Data Model Changes (2-3 hours)

#### 1.1 Update Book Model (`src/models/Book.ts`)
- [ ] Add `characters: Character[]` field to Book class
- [ ] Import Character and CharacterImage interfaces from Story
- [ ] Update constructor to accept characters
- [ ] Add methods:
  - `addCharacter(character: Character): void`
  - `findCharacterByName(name: string): Character | undefined`
  - `renameCharacter(oldName: string, newName: string): void`
  - `deleteCharacter(name: string): boolean`
- [ ] Update validation to check for duplicate character names at book level
- [ ] Update `toJSON()` to include characters
- [ ] Update `fromJSON()` to load characters

#### 1.2 Update Story Model (`src/models/Story.ts`)
- [ ] Remove `characters: Character[]` field
- [ ] Remove character-related methods (addCharacter, findCharacterByName, etc.)
- [ ] Keep Character and CharacterImage interfaces (move to separate file if needed)
- [ ] Update validation to remove character duplicate checks
- [ ] Update `toJSON()` to NOT export characters
- [ ] Update `fromJSON()` to NOT load characters
- [ ] Add note in documentation about characters being at book level

#### 1.3 Create Shared Types File (Optional but Recommended)
- [ ] Create `src/types/Character.ts`
- [ ] Move `Character` and `CharacterImage` interfaces there
- [ ] Export from both Book and Story for backward compatibility
- [ ] Update imports across codebase

---

### Phase 2: Storage Layer Changes (2-3 hours)

#### 2.1 Update ImageStorageService (`src/services/ImageStorageService.ts`)
- [ ] Change character image keys from `${storyId}:${characterName}:${imageId}` 
  - to `${bookId}:${characterName}:${imageId}`
- [ ] Update `storeCharacterImage()` to use bookId
- [ ] Update `getCharacterImage()` to use bookId
- [ ] Update `deleteCharacterImage()` to use bookId
- [ ] Update `getAllCharacterImages()` to use bookId
- [ ] Add migration helper to convert old storyId-based keys to bookId-based keys

#### 2.2 Update CharacterImageService (`src/services/CharacterImageService.ts`)
- [ ] Update `generateCharacterImage()` signature: accept `bookId` instead of `storyId`
- [ ] Update `loadCharacterGallery()` signature: accept `bookId` instead of `storyId`
- [ ] Update all internal calls to ImageStorageService with bookId
- [ ] Update documentation and comments

#### 2.3 Update BookService (`src/services/BookService.ts`)
- [ ] Update `saveBook()` to save book-level characters
- [ ] Update `getActiveBook()` to load book-level characters
- [ ] Ensure character metadata (imageGallery, selectedImageId) is preserved
- [ ] Test backward compatibility

---

### Phase 3: Migration Logic (3-4 hours)

#### 3.1 Create MigrationService Enhancement
- [ ] Add new migration: `migrateCharactersToBookLevel()`
- [ ] Logic:
  1. For each book in localStorage
  2. Collect all characters from all stories
  3. Deduplicate by name (case-insensitive)
  4. For duplicate names, merge image galleries
  5. Move characters to book.characters[]
  6. Remove characters from story.characters[]
  7. Update IndexedDB character image keys from storyId to bookId
  8. Save updated book
- [ ] Add version check (bump to v5.0.0 or similar)
- [ ] Add extensive logging for debugging
- [ ] Test with multiple scenarios:
  - Single story with characters
  - Multiple stories with same characters
  - Multiple stories with different characters
  - Mix of characters with and without images

#### 3.2 Handle Image Gallery Merging
When multiple stories have the same character (by name):
- [ ] Merge all imageGallery arrays
- [ ] Remove duplicate images (by id)
- [ ] Keep the most recent selectedImageId
- [ ] Preserve all unique images
- [ ] Update all image keys in IndexedDB to use bookId

---

### Phase 4: Service Layer Updates (2-3 hours)

#### 4.1 Update All Services Using Characters
Services to check and update:
- [ ] `CharacterImageService.ts` - Update to use book-level characters
- [ ] `PromptService.ts` - Update character references if any
- [ ] `StoryExportService.ts` - Update export format
- [ ] `DocxExportService.ts` - Update if it references characters
- [ ] Any other services referencing characters

---

### Phase 5: UI Component Updates (4-5 hours)

#### 5.1 Update CastManager (`src/components/CastManager.tsx`)
**Current:** Manages story-level characters  
**New:** Manage book-level characters

- [ ] Change to accept `book` and `story` props
- [ ] Load characters from `book.characters` instead of `story.characters`
- [ ] Filter characters shown to only those used in current story (optional)
- [ ] Update add/edit/delete to modify book.characters
- [ ] Update save logic to save book instead of just story
- [ ] Show indicator if character is used in other stories

#### 5.2 Update CharacterAuditionDialog (`src/components/CharacterAuditionDialog.tsx`)
- [ ] Accept `bookId` instead of `storyId`
- [ ] Update image generation calls to use bookId
- [ ] Update image loading calls to use bookId
- [ ] Update all IndexedDB interactions

#### 5.3 Update SceneEditor (`src/components/SceneEditor.tsx`)
- [ ] Update `loadCharacterImages()` to use bookId
- [ ] Update character loading from book.characters
- [ ] Ensure character references still work (should be name-based, so minimal changes)

#### 5.4 Update ImportStoryDialog (`src/components/ImportStoryDialog.tsx`)
**Major Changes Needed:**

Current behavior: Creates new characters for each imported story  
New behavior: Check for existing characters at book level first

- [ ] When importing, check if characters already exist in book by name
- [ ] If character exists:
  - Use existing character (with its image gallery)
  - Don't create duplicate
- [ ] If character doesn't exist:
  - Add to book.characters
- [ ] Update logic to add characters to book, not story
- [ ] Update UI messaging to indicate character reuse

#### 5.5 Update Other Components
- [ ] `StoriesPanel.tsx` - Update if it shows character counts
- [ ] Any component displaying character lists
- [ ] Any component that creates/edits characters

---

### Phase 6: Testing & Validation (2-3 hours)

#### 6.1 Unit Tests
- [ ] Test Book model with characters
- [ ] Test character add/rename/delete at book level
- [ ] Test character deduplication during migration
- [ ] Test ImageStorageService with bookId keys

#### 6.2 Integration Tests
- [ ] Test full migration from story-level to book-level
- [ ] Test creating new story and reusing existing characters
- [ ] Test character image generation with bookId
- [ ] Test character image loading across stories

#### 6.3 Manual Testing
- [ ] Create book with multiple stories
- [ ] Generate character images in story 1
- [ ] Create story 2 with same characters
- [ ] Verify images appear in story 2
- [ ] Test editing character description
- [ ] Test deleting character used in multiple stories
- [ ] Test export/import with new format

---

## 🔄 Migration Strategy

### Automatic Migration on App Load
1. Check current data version
2. If version < 5.0.0, run migration
3. Display loading screen during migration
4. Log all migration actions
5. On success:
   - Update version to 5.0.0
   - Save migrated data
   - Continue app load
6. On failure:
   - Show error message
   - Offer to export backup
   - Don't proceed with potentially corrupted data

### Migration Edge Cases to Handle
- [ ] Empty books (no stories)
- [ ] Stories with no characters
- [ ] Characters with same name but different descriptions (keep most recent)
- [ ] Orphaned character images in IndexedDB
- [ ] Corrupted character data
- [ ] Very large image galleries (performance)

---

## 🎨 UI/UX Improvements

### Character Management Panel (Future Enhancement)
- Show which stories use each character
- Bulk character operations
- Character usage statistics
- Preview character across different stories

### Import Dialog Enhancement
- Show when importing would reuse existing character
- Option to import as new character (with suffix like "Professor Fizzwinkle 2")
- Visual indicator of character image gallery presence

---

## 📝 Documentation Updates

- [ ] Update STORY_DEFINITION_GUIDE.md
- [ ] Update README.md architecture section
- [ ] Update any API documentation
- [ ] Add migration notes to CHANGELOG
- [ ] Document new character sharing behavior

---

## ⚠️ Breaking Changes

1. **Storage Format**: Books now contain characters array
2. **IndexedDB Keys**: Character images use bookId instead of storyId
3. **Import Format**: Imported stories should reference book characters
4. **API Changes**: Several service methods change signatures (storyId → bookId)

---

## 🚀 Rollout Plan

### Phase 1: Development (Day 1-2)
- Implement all code changes
- Write unit tests
- Local testing

### Phase 2: Testing (Day 2-3)
- Migration testing with real data
- Integration testing
- Edge case testing

### Phase 3: Deployment (Day 3)
- Deploy with migration logic
- Monitor for issues
- Be ready to rollback if needed

---

## 📦 Backward Compatibility

### Reading Old Data
✓ Migration handles conversion automatically  
✓ Old data structure is converted on first load  
✓ No data loss expected

### Writing Old Format
❌ Once migrated, cannot downgrade  
❌ Export format changes  
❌ Need version check on import

---

## 🎯 Success Criteria

✅ Characters successfully moved to book level  
✅ Image galleries accessible across stories  
✅ No data loss during migration  
✅ All existing functionality works  
✅ Import/export works with new format  
✅ Performance is acceptable  
✅ No console errors or warnings

---

## 📊 Estimated Timeline

| Phase | Hours | Status |
|-------|-------|--------|
| Phase 1: Data Models | 2-3 | ⬜ Not Started |
| Phase 2: Storage Layer | 2-3 | ⬜ Not Started |
| Phase 3: Migration | 3-4 | ⬜ Not Started |
| Phase 4: Services | 2-3 | ⬜ Not Started |
| Phase 5: UI Components | 4-5 | ⬜ Not Started |
| Phase 6: Testing | 2-3 | ⬜ Not Started |
| **Total** | **15-21 hours** | ⬜ Not Started |

---

## 🤔 Open Questions

1. **Character Deletion**: If deleting character used in multiple stories, confirm with user?
2. **Character Editing**: Allow editing description if character used in multiple stories?
3. **Character Variations**: Should we support "Professor Fizzwinkle (Young)" as separate character?
4. **Character Ownership**: Can stories have "private" characters not shared with other stories?
5. **Migration UI**: Show progress bar during migration? Allow cancel?

---

## 📌 Notes

- This is a significant architectural change that touches many parts of the codebase
- Thorough testing is critical before deploying
- Consider creating a backup system before migration
- May want to implement in feature branch and test extensively
- User communication about the change would be helpful


