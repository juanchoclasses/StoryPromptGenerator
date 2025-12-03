# SceneEditor Refactoring Analysis - Phase 2

**Date:** December 3, 2025  
**Current State:** 1,680 lines (down from 2,305)  
**Target:** Further reduction and improved maintainability

---

## Executive Summary

After the successful Phase 1 refactoring (extracting 5 components and 2 hooks), SceneEditor still contains **1,680 lines**. This analysis identifies additional refactoring opportunities to further improve maintainability.

### Phase 1 Achievements ✅
- SceneCharacterSelector (195 lines, 23 tests)
- SceneElementSelector (200 lines, 25 tests)
- SceneImageGenerator (180 lines, 14 tests)
- ScenePromptPreview (150 lines, 20 tests)
- useSceneEditor hook (120 lines, 25 tests)
- useImageGeneration hook (150 lines, 14 tests)

---

## Current SceneEditor Breakdown

### Remaining Responsibilities (1,680 lines)

1. **Diagram Panel Management** (~250 lines)
   - Diagram type selection (mermaid, math, code, markdown)
   - Diagram content editing
   - Language selection for code blocks
   - Preview functionality
   - Auto-save logic

2. **Text Panel Management** (~200 lines)
   - Text panel editing
   - Macro insertion
   - Preview functionality
   - Text fit validation

3. **Layout Management** (~300 lines)
   - Layout editor dialog
   - Layout testing with placeholder images
   - Layout saving/clearing
   - Layout resolution logic
   - Aspect ratio calculations

4. **Dialog Management** (~400 lines)
   - Error dialog (image generation errors)
   - Text fit warning dialog
   - Panel config dialog
   - Preview dialogs (diagram, text panel, layout test)
   - Snackbar notifications

5. **Scene Loading & State** (~200 lines)
   - Scene loading from storage
   - Image loading with fallback
   - Active book loading
   - Scene state synchronization

6. **Image Management** (~150 lines)
   - Image URL state
   - Image save/clear operations
   - Image history management
   - Parent notification

7. **Utility Functions** (~100 lines)
   - calculateTextPanelHeight
   - replaceMacros
   - getImageDimensionsFromAspectRatio
   - Event handler wrappers

8. **JSX Rendering** (~80 lines)
   - Header section
   - Text panel section
   - Diagram panel section
   - Scrollable content area

---

## Recommended Phase 2 Extractions

### Priority 1: High-Value Extractions

#### 1. **SceneDiagramPanel Component** (~250 lines)
**Rationale:** Self-contained feature with clear boundaries

**Responsibilities:**
- Diagram type selection
- Content editing
- Language selection
- Preview functionality
- Auto-save

**Props:**
```typescript
interface SceneDiagramPanelProps {
  scene: Scene;
  story: Story;
  diagramType: 'mermaid' | 'math' | 'code' | 'markdown';
  diagramContent: string;
  diagramLanguage: string;
  onDiagramChange: (content: string, type: string, language?: string) => void;
  onPreview: () => void;
}
```

**Benefits:**
- Reduces SceneEditor by ~250 lines
- Reusable for other diagram editing contexts
- Easier to test diagram-specific logic
- Clear separation of concerns

**Estimated Effort:** 4 hours (component + tests + integration)

---

#### 2. **SceneTextPanel Component** (~200 lines)
**Rationale:** Another self-contained feature

**Responsibilities:**
- Text panel editing
- Macro insertion UI
- Preview functionality

**Props:**
```typescript
interface SceneTextPanelProps {
  textPanelContent: string;
  onTextPanelChange: (content: string) => void;
  onInsertMacro: (macro: string) => void;
  onPreview: () => void;
  textPanelFieldRef?: React.RefObject<HTMLTextAreaElement>;
}
```

**Benefits:**
- Reduces SceneEditor by ~200 lines
- Isolates text panel logic
- Easier to add new macro types
- Better testability

**Estimated Effort:** 3 hours (component + tests + integration)

---

#### 3. **useLayoutManagement Hook** (~200 lines)
**Rationale:** Complex layout logic can be extracted

**Responsibilities:**
- Layout resolution
- Layout source calculation
- Layout saving/clearing
- Layout testing

**Interface:**
```typescript
interface UseLayoutManagementReturn {
  layoutSourceInfo: LayoutSourceInfo;
  layoutEditorOpen: boolean;
  layoutTestPreviewUrl: string | null;
  isTestingLayout: boolean;
  handleEditLayout: () => void;
  handleSaveLayout: (layout: SceneLayout) => Promise<void>;
  handleClearSceneLayout: () => Promise<void>;
  handleTestLayout: () => Promise<void>;
  setLayoutEditorOpen: (open: boolean) => void;
  setLayoutTestPreviewUrl: (url: string | null) => void;
}
```

**Benefits:**
- Reduces SceneEditor by ~200 lines
- Reusable layout logic
- Easier to test layout operations
- Cleaner separation

**Estimated Effort:** 5 hours (hook + tests + integration)

---

### Priority 2: Medium-Value Extractions

#### 4. **useDialogManager Hook** (~150 lines)
**Rationale:** Consolidate dialog state management

**Responsibilities:**
- Manage all dialog open/close states
- Snackbar state management
- Error dialog state
- Preview dialog states

**Interface:**
```typescript
interface UseDialogManagerReturn {
  // Snackbar
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: 'success' | 'error' | 'warning';
  showSnackbar: (message: string, severity: 'success' | 'error' | 'warning') => void;
  closeSnackbar: () => void;
  
  // Error dialog
  errorDialogOpen: boolean;
  errorDialogMessage: string;
  showErrorDialog: (message: string) => void;
  closeErrorDialog: () => void;
  
  // Preview dialogs
  diagramPreviewOpen: boolean;
  diagramPreviewUrl: string | null;
  textPanelPreviewOpen: boolean;
  textPanelPreviewUrl: string | null;
  // ... etc
}
```

**Benefits:**
- Reduces SceneEditor by ~150 lines
- Centralized dialog management
- Easier to add new dialogs
- Consistent dialog patterns

**Estimated Effort:** 4 hours (hook + tests + integration)

---

#### 5. **SceneMetadataSection Component** (~100 lines)
**Rationale:** Group related UI elements

**Responsibilities:**
- Scene title editing
- Scene description editing
- Action buttons (Generate, Layout, Test Layout, Clear Images)

**Props:**
```typescript
interface SceneMetadataSectionProps {
  sceneTitle: string;
  sceneDescription: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  // Action button props
  onEditLayout: () => void;
  onTestLayout: () => void;
  onClearImages: () => void;
  isGenerating: boolean;
  isTestingLayout: boolean;
  hasImages: boolean;
}
```

**Benefits:**
- Reduces SceneEditor by ~100 lines
- Groups related metadata fields
- Cleaner header section
- Easier to modify metadata UI

**Estimated Effort:** 2 hours (component + tests + integration)

---

### Priority 3: Lower-Value Extractions

#### 6. **Utility Functions Module** (~100 lines)
**Rationale:** Move pure functions to separate module

**Functions to Extract:**
- `calculateTextPanelHeight`
- `replaceMacros`
- `getImageDimensionsFromAspectRatio`

**Location:** `src/utils/sceneEditorUtils.ts`

**Benefits:**
- Reduces SceneEditor by ~100 lines
- Easier to test pure functions
- Reusable across components
- Better organization

**Estimated Effort:** 1 hour (move + tests)

---

## Projected Results

### If All Priority 1 Extractions Are Done:

| Metric | Current | After P1 | Reduction |
|--------|---------|----------|-----------|
| **SceneEditor Lines** | 1,680 | ~1,030 | 650 lines (39%) |
| **New Components** | 5 | 7 | +2 |
| **New Hooks** | 2 | 3 | +1 |
| **Total Tests** | 727 | ~800+ | +73 |

**Estimated Effort:** 12 hours

### If All Priorities Are Done:

| Metric | Current | After All | Reduction |
|--------|---------|-----------|-----------|
| **SceneEditor Lines** | 1,680 | ~680 | 1,000 lines (60%) |
| **New Components** | 5 | 8 | +3 |
| **New Hooks** | 2 | 4 | +2 |
| **Total Tests** | 727 | ~900+ | +173 |

**Estimated Effort:** 19 hours

---

## Recommendations

### Recommended Approach: Priority 1 Only

**Rationale:**
1. **Diminishing Returns:** After Priority 1, we hit diminishing returns
2. **Maintainability:** 1,030 lines is much more manageable than 1,680
3. **Effort vs. Benefit:** Priority 1 gives 39% reduction for 12 hours
4. **Component Cohesion:** Remaining code would be well-organized orchestration logic

### What Would Remain in SceneEditor (~1,030 lines):

1. **Core Orchestration** (~200 lines)
   - Component composition
   - State coordination
   - Props passing

2. **Scene Loading & Lifecycle** (~150 lines)
   - useEffect hooks
   - Scene/book loading
   - Image loading

3. **Image Management** (~150 lines)
   - Image state
   - Save/clear operations
   - Parent notifications

4. **Dialog Rendering** (~300 lines)
   - Error dialog JSX
   - Text fit dialog JSX
   - Panel config dialog JSX
   - Preview dialogs JSX

5. **Main JSX Structure** (~230 lines)
   - Paper container
   - Header section (using SceneMetadataSection if extracted)
   - Scrollable content
   - Component composition

### Alternative: Stop Here

**Rationale:**
- Current state (1,680 lines) is already a 27% improvement
- All major features extracted into focused components
- Remaining code is mostly orchestration and JSX
- Further extraction may over-engineer the solution

**When to Continue:**
- If SceneEditor becomes difficult to navigate again
- If diagram/text panel logic needs to be reused elsewhere
- If layout management becomes more complex
- If team agrees the effort is worthwhile

---

## Decision Matrix

| Factor | Priority 1 | Priority 2 | Priority 3 | Stop Here |
|--------|-----------|-----------|-----------|-----------|
| **Effort** | 12 hrs | +7 hrs | +1 hr | 0 hrs |
| **Line Reduction** | 650 | +250 | +100 | 0 |
| **Reusability** | High | Medium | High | N/A |
| **Testability** | High | Medium | High | N/A |
| **Complexity** | Medium | Low | Low | N/A |
| **ROI** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | N/A |

---

## Conclusion

**Recommendation:** Proceed with **Priority 1 extractions** (SceneDiagramPanel, SceneTextPanel, useLayoutManagement)

**Reasoning:**
1. High-value extractions with clear boundaries
2. Significant line reduction (39%)
3. Improved reusability and testability
4. Reasonable effort (12 hours)
5. Gets SceneEditor to ~1,030 lines (manageable size)

**Next Steps:**
1. Review this analysis with the team
2. Get approval for Priority 1 extractions
3. Create new spec document for Phase 2
4. Implement extractions incrementally
5. Maintain test coverage throughout

