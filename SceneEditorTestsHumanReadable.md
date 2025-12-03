# SceneEditor Tests - Human Readable Guide

**Purpose:** This document explains what the SceneEditor component tests are checking in plain English.

**Test File:** `tests/components/SceneEditor.test.tsx`  
**Total Tests:** 35  
**Status:** ✅ All passing  
**Created:** December 1, 2025

---

## What is SceneEditor?

SceneEditor is the main component for editing individual scenes in a story. It's a large component (2,400 lines) that handles:
- Editing scene details (title, description, text panel)
- Selecting which characters and elements appear in the scene
- Generating images for the scene
- Managing layout and diagrams (uses the shared `SceneLayoutEditor` component)
- Building prompts for AI image generation

### Layout Editor Hierarchy

The app uses a **hierarchical layout system** with a single reusable `SceneLayoutEditor` component:

```
Book Level (FileManager)
  ↓ inherits if not overridden
Story Level (StoriesPanel)
  ↓ inherits if not overridden
Scene Level (SceneEditor) ← tested here
```

Each level can:
- Define its own layout
- Inherit from parent level
- Clear its layout to use parent's layout

---

## Test Suites Overview

### 1. Rendering (5 tests)

**What we're testing:** Can the component load and display correctly?

- ✅ **Shows a placeholder when no scene is selected**
  - If you haven't picked a scene yet, it should show "Select a scene to edit" instead of crashing

- ✅ **Displays the scene editor when a scene is selected**
  - When you select a scene, it should load the editor interface with all the fields

- ✅ **Loads and shows all the scene's data correctly**
  - The scene's title, description, and text panel content all appear in the right places

- ✅ **Shows which characters are in the scene**
  - Characters that were added to the scene are visible in the editor

- ✅ **Shows which elements are in the scene**
  - Elements (like "Sword" or "Castle") that were added to the scene are displayed

---

### 2. Scene Title Editing (2 tests)

**What we're testing:** Can users edit the scene's title?

- ✅ **Updates and saves when you change the title**
  - When you type a new title, it automatically saves the change

- ✅ **Handles an empty title gracefully**
  - If you delete all the text from the title, it doesn't break - it just saves an empty title

---

### 3. Scene Description Editing (1 test)

**What we're testing:** Can users edit the scene's description?

- ✅ **Updates and saves when you change the description**
  - When you modify the scene description, it automatically saves

---

### 4. Character Selection (2 tests)

**What we're testing:** Can users add/remove characters from scenes?

- ✅ **Shows the list of available characters from the story**
  - You can see all the characters that exist in your story

- ✅ **Saves changes when you select/deselect characters**
  - When you add or remove characters from the scene, it saves properly

---

### 5. Element Selection (2 tests)

**What we're testing:** Can users add/remove elements from scenes?

- ✅ **Shows the elements section**
  - The interface for managing elements (props, objects) is visible

- ✅ **Displays the elements that are in the scene**
  - Elements that have been added to the scene are shown correctly

---

### 6. Text Panel Editing (2 tests)

**What we're testing:** Can users edit the text that appears over the image?

- ✅ **Updates and saves new text panel content**
  - When you type in the text panel field (the text that overlays the image), it saves

- ✅ **Handles empty text panel content**
  - If you delete all text from the text panel, it doesn't break

---

### 7. Image Generation (4 tests)

**What we're testing:** Can users generate images for their scenes?

- ✅ **Shows a "Generate Image" button**
  - There's a visible button to start image generation

- ✅ **Opens model selection when you click "Generate"**
  - Clicking the generate button opens a dialog where you pick which AI model to use

- ✅ **Shows loading state during generation**
  - While an image is being generated, the button isn't disabled (to allow cancellation)

- ✅ **Calls the callback when an image is generated**
  - When image generation completes, it notifies the parent component (if callback provided)

---

### 8. Prompt Building (2 tests)

**What we're testing:** Can users copy the AI prompt to clipboard?

- ✅ **Shows a "Copy Prompt" button**
  - There's a button to copy the prompt that would be sent to the AI

- ✅ **Clipboard functionality is available**
  - The browser's clipboard API is properly set up for copying

---

### 9. Layout Management (2 tests)

**What we're testing:** Can users design how characters/elements are positioned?

**Note:** `SceneLayoutEditor` is a **reusable component** also used in:
- **FileManager** - For book-level default layouts
- **StoriesPanel** - For story-level layouts
- **SceneEditor** - For scene-specific layouts (tested here)

The layout editor provides a visual canvas to position:
- The main image
- Text panels (overlays)
- Diagram panels (visualizations)

- ✅ **Shows an "Edit Layout" button**
  - There's a button to open the layout editor

- ✅ **Opens the layout editor dialog**
  - Clicking the layout button opens the `SceneLayoutEditor` dialog where you can:
    - Drag elements to position them
    - Resize elements
    - Set aspect ratios
    - Preview the layout
    - Inherit layouts from story or book level

---

### 10. Diagram Panel (3 tests)

**What we're testing:** Can users add diagrams/visualizations to scenes?

- ✅ **Shows the diagram panel section**
  - The interface for adding diagrams is visible

- ✅ **Loads existing diagram content**
  - If a scene already has a diagram, it displays in the editor

- ✅ **Updates and saves diagram changes**
  - When you edit the diagram code, it saves automatically

---

### 11. Snackbar Notifications (1 test)

**What we're testing:** Does the user get feedback when things save?

- ✅ **Shows success message after saving**
  - When changes are saved, a notification appears (though the test just verifies save was called)

---

### 12. Error Handling (3 tests)

**What we're testing:** What happens when things go wrong?

- ✅ **Handles save errors gracefully**
  - If saving fails (network error, permissions issue), the component doesn't crash

- ✅ **Handles missing story data gracefully**
  - If somehow there's no story data, it shows a helpful message instead of crashing

- ✅ **Handles image loading errors gracefully**
  - If images fail to load from storage, the component continues working

---

### 13. Backward Compatibility (2 tests)

**What we're testing:** Does it work with old data formats?

- ✅ **Works with legacy characterIds field**
  - Old data that used "characterIds" instead of "characters" still works

- ✅ **Works with legacy elementIds field**
  - Old data that used "elementIds" instead of "elements" still works

---

### 14. Macro Insertion (1 test)

**What we're testing:** Can users insert character name macros into text?

- ✅ **Shows macro buttons for characters**
  - Each character has a button to insert their name as a macro into the text panel

---

### 15. Component Integration (2 tests)

**What we're testing:** Does it work with different prop configurations?

- ✅ **Works with all props provided**
  - When you pass all possible props (including optional ones), everything works

- ✅ **Works without optional props**
  - When you don't pass optional props (like onImageStateChange), it still works fine

---

### 16. Performance (1 test)

**What we're testing:** Is it efficient?

- ✅ **Doesn't re-render unnecessarily**
  - When props don't change, the component doesn't waste time re-rendering

---

## Why These Tests Matter

### Safety Net for Refactoring
SceneEditor is 2,400 lines of code - way too big! We need to break it into smaller pieces. These tests ensure that when we split it up, nothing breaks.

### Critical Functionality
SceneEditor is the heart of the app - users spend most of their time here. These tests ensure:
- Users never lose their work
- The UI responds correctly to all actions
- Errors don't cause crashes
- Data from different versions of the app still works

### Coverage Areas

| Area | Tests | Status |
|------|-------|--------|
| **Data Display** | 5 | ✅ All render correctly |
| **Text Editing** | 5 | ✅ All save properly |
| **Selection** | 4 | ✅ Characters & elements work |
| **Image Features** | 6 | ✅ Generation & prompts work |
| **Advanced Features** | 6 | ✅ Layout, diagrams, macros work |
| **Robustness** | 6 | ✅ Errors handled, legacy data works |
| **Quality** | 3 | ✅ Integration & performance good |

---

## What's NOT Tested (Yet)

These are things we might want to test in the future:

### In SceneEditor Tests:
1. **Actual image generation** - We mock it, but don't test the full flow
2. **Complex layout interactions** - Just test that the dialog opens (not the full editor)
3. **Diagram rendering** - Test the code saves, but not visual rendering
4. **Undo/redo** - If these features exist
5. **Keyboard shortcuts** - If any exist
6. **Accessibility** - Screen reader support, keyboard navigation

### SceneLayoutEditor Component (Shared):
The `SceneLayoutEditor` component itself should have its own test suite covering:
- **Drag and drop** - Moving elements around the canvas
- **Resizing** - Changing element sizes
- **Aspect ratio changes** - Recalculating canvas dimensions
- **Layout inheritance** - Showing inherited layouts from parent levels
- **Clear layout** - Reverting to parent layout
- **Preset layouts** - If any exist
- **Canvas constraints** - Elements stay within bounds

**Where it's used:**
- ✅ `SceneEditor` (Scene level) - Dialog opening tested
- ⏳ `StoriesPanel` (Story level) - Not tested yet
- ⏳ `FileManager` (Book level) - Not tested yet

**Recommendation:** Create `SceneLayoutEditor.test.tsx` to test the component thoroughly, ensuring all three usage contexts work correctly.

---

## Test Strategy

### Why We Test Before Refactoring

1. **Create a Safety Net**: These 35 tests ensure we don't break anything
2. **Document Behavior**: Tests show how the component should work
3. **Enable Confidence**: We can refactor boldly knowing tests will catch issues
4. **Speed Up Development**: Automated tests are faster than manual testing

### Test First, Refactor Second

**Phase 1** (Complete): Write comprehensive tests ✅  
**Phase 2** (Next): Break component into smaller pieces  
**Phase 3** (After): Verify all tests still pass

This approach means:
- 🟢 We know immediately if something breaks
- 🟢 We can refactor incrementally
- 🟢 We maintain 100% functionality
- 🟢 Users never notice the changes

---

## Running the Tests

```bash
# Run just SceneEditor tests
npm test -- tests/components/SceneEditor.test.tsx

# Run with coverage
npm test -- tests/components/SceneEditor.test.tsx --coverage

# Run in watch mode
npm test -- tests/components/SceneEditor.test.tsx --watch
```

---

## For Developers

### When to Update These Tests

**DO update tests when:**
- ✅ Adding new features to SceneEditor
- ✅ Changing how something works
- ✅ Fixing bugs (add a test that would have caught it)

**DON'T update tests when:**
- ❌ Just changing styling/CSS
- ❌ Refactoring without changing behavior
- ❌ Moving code around (tests should still pass)

### How to Add a New Test

```typescript
it('should [describe what it does in plain English]', async () => {
  // 1. Set up the test data
  // 2. Render the component
  // 3. Interact with it (click, type, etc.)
  // 4. Check that it behaved correctly
});
```

---

## Conclusion

These 35 tests give us confidence that SceneEditor works correctly in all common scenarios and many edge cases. They provide a solid foundation for the upcoming refactoring work, ensuring we can safely break the 2,400-line component into manageable pieces without breaking functionality.

### Important Notes About Shared Components

**SceneLayoutEditor is a shared component** used by SceneEditor, StoriesPanel, and FileManager. The tests here only verify that SceneEditor can open the layout editor dialog. The layout editor's internal functionality (drag, resize, aspect ratios, inheritance) should be tested separately in its own test suite.

This is a **good architecture pattern**: reusable components tested independently, integration tested where they're used.

**Next Steps**: 
1. Use these tests as a safety net to refactor SceneEditor into smaller components
2. Consider creating `SceneLayoutEditor.test.tsx` to test the shared layout editor thoroughly

---

**Last Updated:** December 1, 2025  
**Maintained By:** Architecture Team  
**Related Documents:**
- `tests/components/SceneEditor.test.tsx` - The actual test code
- `ARCHITECTURE-HEALING-TRACKING.md` - Overall refactoring progress
- `REFACTORING-ROADMAP.md` - Quick reference guide

