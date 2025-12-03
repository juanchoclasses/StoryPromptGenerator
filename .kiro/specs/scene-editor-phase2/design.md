# Design Document - SceneEditor Phase 2 Refactoring

## Overview

This document outlines the technical approach for Phase 2 of the SceneEditor refactoring. Phase 1 successfully extracted 5 components and 2 hooks, reducing SceneEditor from 2,305 to 1,680 lines. Phase 2 will extract 3 additional high-value features to achieve a final size of ~1,030 lines.

**Design Goals:**
1. Extract diagram panel management into SceneDiagramPanel component
2. Extract text panel management into SceneTextPanel component
3. Extract layout operations into useLayoutManagement hook
4. Reduce SceneEditor from 1,680 to ~1,030 lines (39% reduction)
5. Maintain all existing functionality and tests
6. Achieve 55% total reduction from original 2,305 lines

## Architecture

### Current State (After Phase 1)

```
SceneEditor (1,680 lines)
├── ✅ SceneCharacterSelector (extracted)
├── ✅ SceneElementSelector (extracted)
├── ✅ SceneImageGenerator (extracted)
├── ✅ ScenePromptPreview (extracted)
├── ✅ useSceneEditor hook (extracted)
├── ✅ useImageGeneration hook (extracted)
├── Diagram Panel Management (~250 lines) ⏳
├── Text Panel Management (~200 lines) ⏳
├── Layout Management (~300 lines) ⏳
├── Dialog Management (~400 lines)
├── Scene Loading & State (~200 lines)
├── Image Management (~150 lines)
└── Utility Functions (~100 lines)
```

### Target State (After Phase 2)

```
SceneEditor (~1,030 lines) - Orchestration only
├── ✅ SceneCharacterSelector (195 lines)
├── ✅ SceneElementSelector (200 lines)
├── ✅ SceneImageGenerator (180 lines)
├── ✅ ScenePromptPreview (150 lines)
├── 🆕 SceneDiagramPanel (~250 lines) - Diagram editing
├── 🆕 SceneTextPanel (~200 lines) - Text panel editing
├── ✅ useSceneEditor hook (120 lines)
├── ✅ useImageGeneration hook (150 lines)
└── 🆕 useLayoutManagement hook (~200 lines) - Layout operations
```

### Component Hierarchy

```
SceneEditor
  ├── Header Section
  │   ├── Scene Title TextField
  │   ├── Scene Description TextField
  │   └── Action Buttons (Generate, Layout, Test, Clear)
  │
  ├── SceneTextPanel (NEW) 🆕
  │   ├── Text content TextField
  │   ├── Macro insertion buttons
  │   └── Preview button
  │
  ├── SceneDiagramPanel (NEW) 🆕
  │   ├── Diagram type Select
  │   ├── Language Select (for code)
  │   ├── Diagram content TextField
  │   ├── Preview button
  │   └── Configuration alert
  │
  ├── Scrollable Content
  │   ├── SceneCharacterSelector
  │   ├── SceneElementSelector
  │   └── ScenePromptPreview
  │
  └── Dialogs
      ├── SceneLayoutEditor (uses useLayoutManagement)
      ├── Preview Dialogs (diagram, text, layout test)
      ├── Error Dialog
      ├── Text Fit Dialog
      └── Panel Config Dialog
```

## Components and Interfaces

### 1. SceneDiagramPanel (NEW)

**Purpose:** Handle all diagram panel editing functionality

**Props:**
```typescript
interface SceneDiagramPanelProps {
  /** Current scene being edited */
  scene: Scene;
  /** Parent story for diagram style configuration */
  story: Story;
  /** Current diagram type */
  diagramType: 'mermaid' | 'math' | 'code' | 'markdown';
  /** Current diagram content */
  diagramContent: string;
  /** Programming language for code blocks */
  diagramLanguage: string;
  /** Callback when diagram changes (includes auto-save) */
  onDiagramChange: (content: string, type: string, language?: string) => Promise<void>;
  /** Callback when preview is requested */
  onPreview: () => void;
}
```

**Features:**
- Diagram type selection (mermaid, math, code, markdown)
- Language selection for code blocks
- Diagram content editing with monospace font
- Preview button
- Auto-save on change
- Configuration alert when diagram style not set

**Responsibilities:**
- Render diagram editing UI
- Handle diagram type changes
- Handle content changes with auto-save
- Trigger preview callback
- Display appropriate placeholders

**State:**
- None (controlled component, all state managed by parent)

**Estimated Size:** ~250 lines

---

### 2. SceneTextPanel (NEW)

**Purpose:** Handle text panel editing with macro support

**Props:**
```typescript
interface SceneTextPanelProps {
  /** Current text panel content */
  textPanelContent: string;
  /** Callback when text changes */
  onTextPanelChange: (content: string) => void;
  /** Callback to insert macro at cursor position */
  onInsertMacro: (macro: string) => void;
  /** Callback when preview is requested */
  onPreview: () => void;
  /** Ref for textarea to manage cursor position */
  textPanelFieldRef?: React.RefObject<HTMLTextAreaElement>;
}
```

**Features:**
- Text content editing with monospace font
- Macro insertion buttons (e.g., {SceneDescription})
- Preview button
- Cursor position management for macro insertion
- Helpful caption about macro usage

**Responsibilities:**
- Render text panel editing UI
- Handle text changes
- Insert macros at cursor position
- Trigger preview callback
- Maintain textarea ref

**State:**
- None (controlled component, all state managed by parent)

**Estimated Size:** ~200 lines

---

### 3. useLayoutManagement Hook (NEW)

**Purpose:** Manage all layout-related operations and state

**Interface:**
```typescript
interface LayoutSourceInfo {
  source: 'scene' | 'story' | 'book' | 'default';
  description: string;
  resolvedLayout: SceneLayout | undefined;
  inheritedLayout: SceneLayout | undefined;
  inheritedLayoutSource: string | undefined;
}

interface UseLayoutManagementReturn {
  // Layout source information
  layoutSourceInfo: LayoutSourceInfo;
  
  // Dialog states
  layoutEditorOpen: boolean;
  layoutTestPreviewOpen: boolean;
  layoutTestPreviewUrl: string | null;
  isTestingLayout: boolean;
  
  // Actions
  handleEditLayout: () => void;
  handleSaveLayout: (layout: SceneLayout) => Promise<void>;
  handleClearSceneLayout: () => Promise<void>;
  handleTestLayout: () => Promise<void>;
  
  // State setters
  setLayoutEditorOpen: (open: boolean) => void;
  setLayoutTestPreviewUrl: (url: string | null) => void;
  
  // Snackbar callback
  showSnackbar: (message: string, severity: 'success' | 'error' | 'warning') => void;
}

function useLayoutManagement(
  currentScene: Scene | null,
  story: Story | null,
  activeBook: any,
  onStoryUpdate: () => void,
  showSnackbar: (message: string, severity: 'success' | 'error' | 'warning') => void
): UseLayoutManagementReturn
```

**Responsibilities:**
- Calculate layout source (scene/story/book/default)
- Resolve effective layout using LayoutResolver
- Manage layout editor dialog state
- Save layout to correct scene in storage
- Clear scene-specific layout
- Generate layout test preview with placeholder image
- Manage layout test dialog state

**State:**
- `layoutEditorOpen: boolean`
- `layoutTestPreviewOpen: boolean`
- `layoutTestPreviewUrl: string | null`
- `isTestingLayout: boolean`
- `layoutSourceInfo: LayoutSourceInfo` (computed)

**Estimated Size:** ~200 lines

---

## Data Models

### Existing Types (No Changes)

```typescript
// From types/Story.ts
interface Scene {
  id: string;
  title: string;
  description: string;
  textPanel?: string;
  diagramPanel?: DiagramPanel;
  layout?: SceneLayout;
  characters: string[];
  elements: string[];
  imageHistory?: GeneratedImage[];
  createdAt: Date;
  updatedAt: Date;
}

interface DiagramPanel {
  type: 'mermaid' | 'math' | 'code' | 'markdown';
  content: string;
  language?: string; // For code blocks
}

interface SceneLayout {
  type: 'overlay' | 'comic-book' | 'side-by-side';
  canvas: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  elements: {
    image: LayoutElement;
    textPanel?: LayoutElement;
    diagramPanel?: LayoutElement;
  };
}

interface LayoutElement {
  x: number;        // Percentage
  y: number;        // Percentage
  width: number;    // Percentage
  height: number;   // Percentage
  zIndex: number;
  aspectRatio?: string;
}
```

### New Types

No new types needed - all existing types are sufficient.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

#### 1.1 WHEN SceneDiagramPanel is created THEN the component SHALL handle all diagram editing UI and logic
**Thoughts:** This is about the component rendering correctly with all necessary UI elements. We can test by rendering and checking for expected elements.
**Testable:** yes - property

#### 1.2 WHEN a user selects a diagram type THEN the component SHALL update the UI accordingly
**Thoughts:** We can test by changing the diagram type and verifying the language selector appears for code type.
**Testable:** yes - property

#### 1.3 WHEN diagram content changes THEN the component SHALL auto-save to storage
**Thoughts:** We can test by changing content and verifying the callback is called with correct parameters.
**Testable:** yes - property

#### 1.4 WHEN the preview button is clicked THEN the component SHALL call the provided preview callback
**Thoughts:** We can test by clicking the button and verifying the callback is invoked.
**Testable:** yes - property

#### 1.5 WHEN the story has no diagram style configured THEN the component SHALL display an informational alert
**Thoughts:** We can test by rendering with a story that has no diagramStyle and checking for the alert.
**Testable:** yes - property

#### 2.1 WHEN SceneTextPanel is created THEN the component SHALL handle text panel editing UI
**Thoughts:** We can test by rendering and checking for text field and macro buttons.
**Testable:** yes - property

#### 2.2 WHEN a user types in the text field THEN the component SHALL call the onChange callback
**Thoughts:** We can test by simulating typing and verifying the callback is called.
**Testable:** yes - property

#### 2.3 WHEN a macro button is clicked THEN the component SHALL insert the macro at the cursor position
**Thoughts:** We can test by clicking a macro button and verifying the callback is called with the macro.
**Testable:** yes - property

#### 2.4 WHEN the preview button is clicked THEN the component SHALL call the provided preview callback
**Thoughts:** We can test by clicking the button and verifying the callback is invoked.
**Testable:** yes - property

#### 2.5 WHEN the component renders THEN the system SHALL maintain the textarea ref
**Thoughts:** We can test by verifying the ref is properly attached to the textarea.
**Testable:** yes - property

#### 3.1 WHEN useLayoutManagement hook is created THEN the hook SHALL manage all layout-related state
**Thoughts:** We can test using renderHook and verify all state values are initialized correctly.
**Testable:** yes - property

#### 3.2 WHEN layout is edited THEN the hook SHALL save changes to the correct scene in storage
**Thoughts:** We can test by calling handleSaveLayout and verifying BookService is called with correct data.
**Testable:** yes - property

#### 3.3 WHEN layout is cleared THEN the hook SHALL remove scene-specific layout
**Thoughts:** We can test by calling handleClearSceneLayout and verifying the scene's layout is set to undefined.
**Testable:** yes - property

#### 3.4 WHEN layout is tested THEN the hook SHALL generate a preview with placeholder image
**Thoughts:** We can test by calling handleTestLayout and verifying a preview URL is generated.
**Testable:** yes - property

#### 3.5 WHEN layout source is calculated THEN the hook SHALL correctly resolve scene/story/book hierarchy
**Thoughts:** We can test with different combinations of scene/story/book layouts and verify correct resolution.
**Testable:** yes - property

#### 4.1-4.5 Maintaining existing functionality
**Thoughts:** These are verified by running the existing 35 SceneEditor tests after each extraction.
**Testable:** yes - property (existing tests)

#### 5.1-5.5 Test coverage requirements
**Thoughts:** These are about test counts, verified by counting tests after implementation.
**Testable:** yes - example

#### 6.1-6.5 Documentation requirements
**Thoughts:** These are about documentation quality, not runtime behavior.
**Testable:** no

#### 7.1-7.5 Progress tracking
**Thoughts:** These are about project management, not code behavior.
**Testable:** no

---

## Property Reflection

After reviewing all properties, here are the redundancies to eliminate:

**Redundant Properties:**
- Properties 1.1-1.5 (SceneDiagramPanel) can be combined into comprehensive component tests
- Properties 2.1-2.5 (SceneTextPanel) can be combined into comprehensive component tests
- Properties 3.1-3.5 (useLayoutManagement) can be combined into comprehensive hook tests
- Property 4.1-4.5 are already covered by existing SceneEditor tests

**Final Property Set:**
1. SceneDiagramPanel works correctly (comprehensive component tests)
2. SceneTextPanel works correctly (comprehensive component tests)
3. useLayoutManagement hook works correctly (comprehensive hook tests)
4. Refactoring preserves all functionality (existing 35 tests pass)

---

## Correctness Properties

### Property 1: SceneDiagramPanel component correctness
*For any* valid scene and story, the SceneDiagramPanel component should:
- Render all diagram editing UI elements (type selector, content field, preview button)
- Show language selector when diagram type is 'code'
- Call onDiagramChange when content or type changes
- Call onPreview when preview button is clicked
- Display alert when story has no diagram style configured
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: SceneTextPanel component correctness
*For any* valid text panel content, the SceneTextPanel component should:
- Render text editing UI with macro buttons
- Call onTextPanelChange when text changes
- Call onInsertMacro when macro button is clicked
- Call onPreview when preview button is clicked
- Maintain textarea ref for cursor positioning
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: useLayoutManagement hook correctness
*For any* valid scene, story, and book combination, the useLayoutManagement hook should:
- Calculate correct layout source (scene/story/book/default)
- Resolve effective layout using LayoutResolver
- Save layout changes to correct scene in storage
- Clear scene-specific layout when requested
- Generate layout test preview with placeholder image
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 4: Refactoring preserves all functionality
*For any* refactoring step, when code is modified, all 35 existing SceneEditor tests should continue to pass without modification
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

---

## Error Handling

### Component Error Handling

**SceneDiagramPanel:**
- Invalid diagram type → Log warning, use default 'mermaid'
- Auto-save failure → Log error, don't crash UI
- Preview callback error → Caught by parent component

**SceneTextPanel:**
- Invalid macro → Log warning, insert as-is
- Textarea ref not available → Log warning, macro insertion skips cursor positioning
- Preview callback error → Caught by parent component

### Hook Error Handling

**useLayoutManagement:**
- Layout save failure → Show error snackbar, log error
- Layout test generation failure → Show error snackbar, set isTestingLayout to false
- Invalid scene/story/book → Return default layout source info
- LayoutResolver errors → Catch and return undefined layout

---

## Testing Strategy

### Unit Testing

**New Components (2 components × ~15 tests each = ~30 tests):**

1. **SceneDiagramPanel Tests** (~15 tests)
   - Rendering with different diagram types
   - Type selection behavior
   - Language selector visibility (code type only)
   - Content change handling
   - Preview button click
   - Auto-save callback invocation
   - Alert display when no diagram style
   - Placeholder text for each type

2. **SceneTextPanel Tests** (~12 tests)
   - Rendering with text content
   - Text change handling
   - Macro button clicks
   - Preview button click
   - Textarea ref attachment
   - Macro insertion callback
   - Empty state handling

**New Hooks (1 hook × ~15 tests = ~15 tests):**

1. **useLayoutManagement Tests** (~15 tests)
   - Layout source calculation (scene/story/book/default)
   - Layout resolution with LayoutResolver
   - Layout editor dialog state
   - Layout save operation
   - Layout clear operation
   - Layout test generation
   - Layout test dialog state
   - Error handling for save failures
   - Error handling for test failures
   - Snackbar integration

**Integration Tests:**
- All 35 existing SceneEditor tests must pass after each extraction
- No new integration tests needed (existing tests cover integration)

**Total New Tests:** ~57 tests
**Total Tests After Phase 2:** 727 (existing) + 57 (new) = 784 tests (target: 800+)

### Property-Based Testing

We will use **Vitest** (already configured) for all testing.

**Property Test 1: SceneDiagramPanel correctness**
- Test with various diagram types and content
- Verify UI updates correctly
- Verify callbacks are invoked with correct parameters

**Property Test 2: SceneTextPanel correctness**
- Test with various text content
- Verify macro insertion works at different cursor positions
- Verify callbacks are invoked correctly

**Property Test 3: useLayoutManagement correctness**
- Test with different scene/story/book layout combinations
- Verify correct layout resolution
- Verify save/clear operations work correctly

**Property Test 4: Refactoring preserves functionality**
- Run all 35 existing tests after each extraction
- All tests must pass without modification

### Testing Workflow

1. **Before Each Extraction:**
   - Run all 35 existing tests → Must pass
   - Document current line count

2. **During Extraction:**
   - Write tests for new component/hook first (TDD)
   - Extract code
   - Integrate into SceneEditor
   - Remove old code

3. **After Each Extraction:**
   - Run all 35 existing tests → Must pass
   - Run new component/hook tests → Must pass
   - Verify line count reduction
   - Commit if all tests pass

4. **Final Verification:**
   - All 784+ tests passing
   - SceneEditor ~1,030 lines
   - No TypeScript errors
   - No ESLint warnings

---

## Implementation Plan Summary

### Phase 2 Extraction Order

1. **SceneDiagramPanel** (First)
   - Most self-contained
   - Clear boundaries
   - Estimated: 4 hours

2. **SceneTextPanel** (Second)
   - Also self-contained
   - Depends on macro insertion from useSceneEditor
   - Estimated: 3 hours

3. **useLayoutManagement** (Third)
   - Most complex
   - Integrates with multiple services
   - Estimated: 5 hours

**Total Estimated Effort:** 12 hours

---

## Success Criteria

1. ✅ All 35 existing SceneEditor tests pass
2. ✅ 57+ new tests written and passing
3. ✅ SceneEditor reduced to ~1,030 lines (39% reduction from 1,680)
4. ✅ Total reduction from original: 55% (2,305 → 1,030)
5. ✅ No TypeScript errors
6. ✅ No ESLint warnings
7. ✅ All components have clear, single responsibilities
8. ✅ Code is more maintainable and reusable
9. ✅ Documentation updated

