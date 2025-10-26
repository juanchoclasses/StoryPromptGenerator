# Storage Refactoring Progress Tracker

**Plan Document**: [STORAGE_STANDARDIZATION_PLAN.md](./STORAGE_STANDARDIZATION_PLAN.md)

**Start Date**: October 26, 2025  
**Target Completion**: TBD  
**Estimated Time**: 10.5 hours  
**Status**: 🔴 Not Started

---

## Overview

Refactoring the storage system to:
- ✅ Use name-based references (no IDs)
- ✅ Add Book style system
- ✅ Create proper model layer with tests
- ✅ Support book import/export

---

## Phase 1: Create Model Layer with Tests (2 hours)

**Status**: ⬜ Not Started  
**Estimated**: 2 hours  
**Actual**: -

### Tasks

- [ ] **1.1** Create `src/models/Book.ts`
  - [ ] Book class with constructor
  - [ ] validate() method
  - [ ] addStory() method
  - [ ] removeStory() method
  - [ ] updateStyle() method
  - [ ] toJSON() method
  - [ ] fromJSON() static method

- [ ] **1.2** Create `src/models/Story.ts`
  - [ ] Story class with constructor
  - [ ] validate() method
  - [ ] addCharacter() method
  - [ ] renameCharacter() method
  - [ ] addElement() method
  - [ ] renameElement() method
  - [ ] addScene() method
  - [ ] toJSON() method
  - [ ] fromJSON() static method

- [ ] **1.3** Create `src/models/Scene.ts`
  - [ ] Scene class with constructor
  - [ ] validate() method
  - [ ] addCharacter() method
  - [ ] removeCharacter() method
  - [ ] addElement() method
  - [ ] removeElement() method

- [ ] **1.4** Create `tests/models/Book.test.ts`
  - [ ] Test book creation
  - [ ] Test validation
  - [ ] Test style management
  - [ ] Test story operations
  - [ ] Test JSON conversion

- [ ] **1.5** Create `tests/models/Story.test.ts`
  - [ ] Test story creation
  - [ ] Test character rename updates scenes
  - [ ] Test element rename updates scenes
  - [ ] Test duplicate name prevention
  - [ ] Test JSON conversion

- [ ] **1.6** Create `tests/models/Scene.test.ts`
  - [ ] Test scene validation
  - [ ] Test character references
  - [ ] Test element references
  - [ ] Test invalid references

- [ ] **1.7** Update Type Definitions
  - [ ] Create `src/types/BookStyle.ts`
  - [ ] Update `src/types/Book.ts` (add style, stories array)
  - [ ] Update `src/types/Story.ts` (remove IDs, use names)
  - [ ] Remove deprecated ID fields

### Notes
- 

---

## Phase 2: Create Storage Service (1.5 hours)

**Status**: ⬜ Not Started  
**Estimated**: 1.5 hours  
**Actual**: -

### Tasks

- [ ] **2.1** Create `src/services/StorageService.ts`
  - [ ] load() method
  - [ ] save() method
  - [ ] getBook() method
  - [ ] saveBook() method
  - [ ] deleteBook() method
  - [ ] getActiveBook() method
  - [ ] setActiveBook() method
  - [ ] migrate() method
  - [ ] clearAll() method

- [ ] **2.2** Create Storage Tests
  - [ ] Test save/load operations
  - [ ] Test data integrity
  - [ ] Test book CRUD operations
  - [ ] Test active book management

- [ ] **2.3** Add Migration Logic
  - [ ] Bump version to 4.0.0
  - [ ] Clear old data migration
  - [ ] Show user notification

### Notes
- 

---

## Phase 3: Update BookService (1 hour)

**Status**: ⬜ Not Started  
**Estimated**: 1 hour  
**Actual**: -

### Tasks

- [ ] **3.1** Refactor BookService to use StorageService
  - [ ] Replace localStorage calls with StorageService
  - [ ] Use Book model class
  - [ ] Remove ID-based lookups
  - [ ] Add name-based lookups

- [ ] **3.2** Add Validation
  - [ ] Enforce unique character names within story
  - [ ] Enforce unique element names within story
  - [ ] Validate references in scenes

- [ ] **3.3** Update Helper Functions
  - [ ] findCharacterByName()
  - [ ] findElementByName()
  - [ ] validateStoryNames()

### Notes
- 

---

## Phase 4: Add Book Style Management UI (1.5 hours)

**Status**: ⬜ Not Started  
**Estimated**: 1.5 hours  
**Actual**: -

### Tasks

- [ ] **4.1** Create `src/components/BookStyleEditor.tsx`
  - [ ] Visual style fields (color palette, visual theme, etc.)
  - [ ] Character style input
  - [ ] Environment style input
  - [ ] Art style selector
  - [ ] Panel configuration section (moved from PanelConfigDialog)
  - [ ] Preview/help text

- [ ] **4.2** Update `src/components/FileManager.tsx`
  - [ ] Add "Edit Style" button
  - [ ] Integrate BookStyleEditor dialog
  - [ ] Pass book style to dialog

- [ ] **4.3** Update Prompt Generation
  - [ ] Include book style in `SceneEditor.generatePrompt()`
  - [ ] Order: Book Style → Book Background → Story Background → Scene
  - [ ] Format style fields for AI readability

- [ ] **4.4** Remove Old PanelConfigDialog
  - [ ] Delete `src/components/PanelConfigDialog.tsx`
  - [ ] Remove references in other components

### Notes
- 

---

## Phase 5: Update All Components (2 hours)

**Status**: ⬜ Not Started  
**Estimated**: 2 hours  
**Actual**: -

### Tasks

- [ ] **5.1** Update `src/components/SceneEditor.tsx`
  - [ ] Use character names instead of IDs
  - [ ] Use element names instead of IDs
  - [ ] Update character/element selection to use names
  - [ ] Include book style in prompt generation

- [ ] **5.2** Update `src/components/CastManager.tsx`
  - [ ] Enforce unique character names
  - [ ] Add character rename functionality
  - [ ] Update all scene references on rename
  - [ ] Show validation errors for duplicates

- [ ] **5.3** Update `src/components/ElementsManager.tsx`
  - [ ] Enforce unique element names
  - [ ] Add element rename functionality
  - [ ] Update all scene references on rename
  - [ ] Show validation errors for duplicates

- [ ] **5.4** Update `src/components/ImportStoryDialog.tsx`
  - [ ] Simplify import (no ID conversion needed)
  - [ ] Add book import option
  - [ ] Validate unique names on import

- [ ] **5.5** Update Other Components
  - [ ] `StoriesPanel.tsx` - use names
  - [ ] `BackgroundSetup.tsx` - ensure compatibility
  - [ ] Any other components referencing characters/elements

### Notes
- 

---

## Phase 6: Update Import/Export (1 hour)

**Status**: ⬜ Not Started  
**Estimated**: 1 hour  
**Actual**: -

### Tasks

- [ ] **6.1** Story Export (Already Done)
  - [x] `StoryExportService.ts` exists
  - [ ] Verify it works with new format
  - [ ] Test export

- [ ] **6.2** Create Book Export
  - [ ] Create `src/services/BookExportService.ts`
  - [ ] exportBook() method
  - [ ] exportBookWithImages() method (optional for later)
  - [ ] Add UI button in FileManager

- [ ] **6.3** Create Book Import
  - [ ] Add book import to ImportStoryDialog
  - [ ] Parse BookExchangeFormat
  - [ ] Create book with all stories
  - [ ] Test with CS-100.json

- [ ] **6.4** Remove Conversion Logic
  - [ ] Remove ID generation for characters
  - [ ] Remove ID generation for elements
  - [ ] Remove ID-based reference conversion

### Notes
- 

---

## Phase 7: Testing & Documentation (1.5 hours)

**Status**: ⬜ Not Started  
**Estimated**: 1.5 hours  
**Actual**: -

### Tasks

- [ ] **7.1** Run All Unit Tests
  - [ ] Book model tests pass
  - [ ] Story model tests pass
  - [ ] Scene model tests pass
  - [ ] Storage service tests pass

- [ ] **7.2** Integration Testing
  - [ ] Import CS-100.json
  - [ ] Edit characters and elements
  - [ ] Generate images with book style
  - [ ] Rename character → verify scene updates
  - [ ] Rename element → verify scene updates
  - [ ] Export book → re-import → verify data

- [ ] **7.3** UI Testing
  - [ ] Book style editor works
  - [ ] Duplicate name prevention works
  - [ ] Character/element rename works
  - [ ] Import/export works

- [ ] **7.4** Clean Up
  - [ ] Remove deprecated code
  - [ ] Remove console.logs
  - [ ] Fix any linter errors
  - [ ] Update comments

- [ ] **7.5** Documentation
  - [ ] Update README with book style info
  - [ ] Create example book files
  - [ ] Document new import/export format
  - [ ] Add migration guide

### Notes
- 

---

## Test Files Checklist

### Example/Test Data Files
- [x] `stories/CS-100.json` - Created as example book format
- [ ] `stories/simple-story.json` - Simple test story
- [ ] Test imports work correctly
- [ ] Test exports produce valid JSON

### Unit Test Files
- [ ] `tests/models/Book.test.ts`
- [ ] `tests/models/Story.test.ts`
- [ ] `tests/models/Scene.test.ts`
- [ ] `tests/services/StorageService.test.ts`

---

## Breaking Changes & Migration

- [x] User approved data reset
- [ ] Version bumped to 4.0.0
- [ ] Migration added to clear old data
- [ ] User notification implemented
- [ ] Example files ready for re-import

---

## Blockers / Issues

**Current Blockers**:
- None

**Resolved Issues**:
- None yet

---

## Progress Summary

| Phase | Status | Time Est. | Time Actual | % Complete |
|-------|--------|-----------|-------------|------------|
| Phase 1: Model Layer | ⬜ Not Started | 2h | - | 0% |
| Phase 2: Storage Service | ⬜ Not Started | 1.5h | - | 0% |
| Phase 3: Update BookService | ⬜ Not Started | 1h | - | 0% |
| Phase 4: Book Style UI | ⬜ Not Started | 1.5h | - | 0% |
| Phase 5: Update Components | ⬜ Not Started | 2h | - | 0% |
| Phase 6: Import/Export | ⬜ Not Started | 1h | - | 0% |
| Phase 7: Testing & Docs | ⬜ Not Started | 1.5h | - | 0% |
| **TOTAL** | **⬜ Not Started** | **10.5h** | **-** | **0%** |

---

## Status Legend

- ⬜ Not Started
- 🟡 In Progress
- ✅ Complete
- ⚠️ Blocked
- ❌ Cancelled

---

## Next Steps

1. Review and approve this tracking document
2. Begin Phase 1: Create model layer
3. Write unit tests as we go
4. Update this document after each task completion

---

## Notes & Decisions

**Date**: October 26, 2025  
- Created tracking document
- CS-100.json created as example book format
- Plan reviewed and approved by user

---

**Last Updated**: October 26, 2025

