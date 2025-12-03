# Design Document

## Overview

This document outlines the technical approach for refactoring the SceneEditor component from 2,305 lines into smaller, focused components. The refactoring follows a test-first approach with 35 existing tests providing a safety net. One component (SceneCharacterSelector) has already been successfully extracted, demonstrating the pattern for remaining extractions.

**Design Goals:**
1. Reduce SceneEditor from 2,305 lines to <800 lines
2. Extract 3 remaining sub-components with clear responsibilities
3. Create 2 custom hooks for shared logic
4. Maintain all existing functionality and tests
5. Improve code maintainability and reusability

## Architecture

### Current State

```
SceneEditor (2,305 lines)
├── Scene metadata editing (title, description, text panel)
├── ✅ Character selection (EXTRACTED → SceneCharacterSelector)
├── Element selection (needs extraction)
├── Image generation UI and logic (needs extraction)
├── Prompt building and display (needs extraction)
├── Layout management
├── Diagram panel editing
├── Dialog management (model selection, layout editor, etc.)
└── State management (15+ useState hooks)
```

### Target State

```
SceneEditor (<800 lines) - Orchestration only
├── SceneCharacterSelector (195 lines) ✅ DONE
├── SceneElementSelector (~200 lines) - Element selection UI
├── SceneImageGenerator (~300 lines) - Image generation workflow
├── ScenePromptPreview (~150 lines) - Prompt display and copying
├── useSceneEditor hook (~150 lines) - Scene state management
└── useImageGeneration hook (~100 lines) - Image generation state
```

### Component Hierarchy

```
SceneEditor
  ├── Scene Metadata Section
  │   ├── Title TextField
  │   ├── Description TextField
  │   └── Text Panel TextField
  │
  ├── SceneCharacterSelector ✅
  │   └── Character multi-select with chips
  │
  ├── SceneElementSelector (NEW)
  │   └── Element multi-select with chips
  │
  ├── SceneImageGenerator (NEW)
  │   ├── Generate Image Button
  │   ├── ModelSelectionDialog
  │   ├── ImageGenerationPreviewDialog
  │   └── Loading/Error states
  │
  ├── ScenePromptPreview (NEW)
  │   ├── Prompt display
  │   ├── Copy to clipboard button
  │   └── Macro insertion
  │
  ├── Layout Management Section
  │   ├── Layout Editor Button
  │   └── SceneLayoutEditor Dialog
  │
  └── Diagram Panel Section
      ├── Diagram content TextField
      └── Diagram style Select
```

## Components and Interfaces

### 1. SceneElementSelector (NEW)

**Purpose:** Handle element selection for scenes, similar to SceneCharacterSelector

**Props:**
```typescript
interface SceneElementSelectorProps {
  /** List of elements available for selection (from story) */
  availableElements: StoryElement[];
  /** Currently selected element IDs */
  selectedElements: string[];
  /** Callback when selection changes */
  onSelectionChange: (elementIds: string[]) => void;
}
```

**Features:**
- Multi-select dropdown with element names and descriptions
- Category badges for elements
- Selected elements summary with removable chips
- Handles unknown/invalid element references gracefully
- Empty state when no elements available

**Responsibilities:**
- Render element selection UI
- Handle element selection/deselection
- Display selected elements as chips
- Call parent callback on changes

**State:**
- None (controlled component)

**Estimated Size:** ~200 lines

### 2. SceneImageGenerator (NEW)

**Purpose:** Handle all image generation UI and logic

**Props:**
```typescript
interface SceneImageGeneratorProps {
  /** Current scene being edited */
  scene: Scene;
  /** Parent story for context */
  story: Story;
  /** Callback when image state changes */
  onImageStateChange: (url: string | null, onSave: () => void, onClear: () => void) => void;
  /** Callback when scene is updated */
  onSceneUpdate: () => void;
}
```

**Features:**
- Generate Image button with loading state
- Model selection dialog integration
- Image generation preview dialog
- Error handling and display
- Progress tracking
- Image save/clear callbacks

**Responsibilities:**
- Manage image generation workflow
- Handle model selection
- Display generation progress
- Handle errors
- Coordinate with ImageStorageService
- Update scene with generated images

**State:**
- `modelSelectionOpen: boolean`
- `previewDialogOpen: boolean`
- `previewData: PreviewData | null`
- `isGenerating: boolean`
- `generationError: string | null`

**Estimated Size:** ~300 lines

### 3. ScenePromptPreview (NEW)

**Purpose:** Display and manage prompt text

**Props:**
```typescript
interface ScenePromptPreviewProps {
  /** Current scene for prompt generation */
  scene: Scene;
  /** Parent story for context */
  story: Story;
  /** Available characters for prompt */
  availableCharacters: Character[];
  /** Available elements for prompt */
  availableElements: StoryElement[];
  /** Selected character names */
  selectedCharacters: string[];
  /** Selected element IDs */
  selectedElements: string[];
  /** Text panel content */
  textPanelContent: string;
  /** Callback to insert macro into text panel */
  onInsertMacro: (macro: string) => void;
}
```

**Features:**
- Generate and display full prompt
- Copy to clipboard functionality
- Macro insertion buttons
- Prompt preview with formatting
- Success/error notifications

**Responsibilities:**
- Generate prompt from scene data
- Display prompt text
- Handle clipboard operations
- Provide macro insertion
- Show copy success feedback

**State:**
- `prompt: string`
- `copySuccess: boolean`
- `copyError: string | null`

**Estimated Size:** ~150 lines

### 4. useSceneEditor Hook (NEW)

**Purpose:** Manage scene editing state and operations

**Interface:**
```typescript
interface UseSceneEditorReturn {
  // Scene state
  sceneTitle: string;
  sceneDescription: string;
  textPanelContent: string;
  selectedCharacters: string[];
  selectedElements: string[];
  
  // Handlers
  handleTitleChange: (title: string) => void;
  handleDescriptionChange: (description: string) => void;
  handleTextPanelChange: (content: string) => void;
  handleCharacterSelectionChange: (characters: string[]) => void;
  handleElementSelectionChange: (elements: string[]) => void;
  handleInsertMacro: (macro: string) => void;
  
  // Save operation
  saveScene: () => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
}

function useSceneEditor(
  story: Story,
  scene: Scene | null,
  onSceneUpdate: () => void
): UseSceneEditorReturn
```

**Responsibilities:**
- Manage scene editing state
- Handle all scene field updates
- Coordinate saves with BookService
- Handle save errors
- Provide macro insertion logic

**Estimated Size:** ~150 lines

### 5. useImageGeneration Hook (NEW)

**Purpose:** Manage image generation state and workflow

**Interface:**
```typescript
interface UseImageGenerationReturn {
  // State
  isGenerating: boolean;
  generationError: string | null;
  previewData: PreviewData | null;
  
  // Actions
  startGeneration: (modelId: string, promptStrategy: string) => Promise<void>;
  cancelGeneration: () => void;
  clearError: () => void;
  
  // Preview
  showPreview: (data: PreviewData) => void;
  hidePreview: () => void;
}

function useImageGeneration(
  scene: Scene,
  story: Story,
  onImageStateChange: (url: string | null, onSave: () => void, onClear: () => void) => void,
  onSceneUpdate: () => void
): UseImageGenerationReturn
```

**Responsibilities:**
- Manage generation state
- Coordinate with SceneImageGenerationService
- Handle generation errors
- Manage preview data
- Update scene with generated images

**Estimated Size:** ~100 lines

## Data Models

### Existing Types (No Changes)

```typescript
// From types/Story.ts
interface Scene {
  id: string;
  title: string;
  description: string;
  textPanel?: string;
  diagramPanel?: string;
  layout?: SceneLayout;
  characters: string[];  // Character names
  elements: string[];    // Element names
  imageHistory?: GeneratedImage[];
  createdAt: Date;
  updatedAt: Date;
}

interface Story {
  id: string;
  title: string;
  description?: string;
  backgroundSetup: string;
  diagramStyle?: DiagramStyle;
  layout?: SceneLayout;
  scenes: Scene[];
  characters: Character[];
  elements: StoryElement[];
  createdAt: Date;
  updatedAt: Date;
}

// From models/Story.ts
interface Character {
  name: string;
  description: string;
  imageGallery?: CharacterImage[];
  selectedImageId?: string;
}

interface StoryElement {
  name: string;
  description: string;
  category?: string;
}
```

### New Types

```typescript
// For SceneCharacterSelector (already exists)
interface AvailableCharacter extends Character {
  isBookLevel?: boolean;
}

// For SceneImageGenerator
interface PreviewData {
  imageUrl: string;
  prompt: string;
  modelId: string;
  timestamp: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

#### 1.1 WHEN the refactoring is complete THEN the SceneEditor SHALL be less than 800 lines
**Thoughts:** This is a measurable property about the final state. We can verify by counting lines in the file.
**Testable:** yes - example

#### 1.2 WHEN sub-components are extracted THEN each sub-component SHALL have a single, clear responsibility
**Thoughts:** This is about code organization and design, not a runtime property we can test automatically.
**Testable:** no

#### 1.3 WHEN the refactoring is complete THEN all 35 existing tests SHALL continue to pass without modification
**Thoughts:** This is a critical property - the refactoring should not break existing functionality. We can verify by running the test suite.
**Testable:** yes - property

#### 1.4 WHEN a sub-component is created THEN the system SHALL maintain the same user-facing behavior
**Thoughts:** This is what the 35 tests verify - that user-facing behavior is preserved. This is covered by 1.3.
**Testable:** yes - property (covered by existing tests)

#### 1.5 WHEN components are split THEN the system SHALL preserve all existing props and callbacks
**Thoughts:** This is about API compatibility. The existing tests will fail if props/callbacks change incorrectly.
**Testable:** yes - property (covered by existing tests)

#### 2.1-2.5 SceneCharacterSelector criteria
**Thoughts:** Already implemented and tested with 23 tests. All criteria verified.
**Testable:** yes - property (already tested)

#### 3.1 WHEN SceneElementSelector is created THEN the component SHALL handle element selection UI
**Thoughts:** This is about the component rendering correctly. We can test by rendering and checking for expected elements.
**Testable:** yes - property

#### 3.2 WHEN an element is selected THEN the component SHALL call the provided onChange callback
**Thoughts:** This is a behavioral property we can test by simulating user interaction and verifying the callback is called.
**Testable:** yes - property

#### 3.3 WHEN the component renders THEN the system SHALL display available elements from the story
**Thoughts:** We can test by providing elements and verifying they appear in the rendered output.
**Testable:** yes - property

#### 3.4 WHEN elements are displayed THEN the system SHALL show element names, descriptions, and categories
**Thoughts:** We can verify all required information is displayed for each element.
**Testable:** yes - property

#### 3.5 WHEN the component is used THEN the system SHALL support multi-select functionality
**Thoughts:** We can test by selecting multiple elements and verifying the selection state.
**Testable:** yes - property

#### 4.1 WHEN SceneImageGenerator is created THEN the component SHALL handle all image generation UI and logic
**Thoughts:** This is about the component rendering and managing the generation workflow. We can test the UI elements and state transitions.
**Testable:** yes - property

#### 4.2 WHEN the generate button is clicked THEN the component SHALL open the model selection dialog
**Thoughts:** We can test by clicking the button and verifying the dialog opens.
**Testable:** yes - property

#### 4.3 WHEN image generation completes THEN the component SHALL call the onImageStateChange callback
**Thoughts:** We can test by mocking the generation service and verifying the callback is called with correct parameters.
**Testable:** yes - property

#### 4.4 WHEN generation is in progress THEN the component SHALL display loading state
**Thoughts:** We can test by triggering generation and verifying loading indicators appear.
**Testable:** yes - property

#### 4.5 WHEN an error occurs THEN the component SHALL display appropriate error messages
**Thoughts:** We can test by simulating errors and verifying error messages are displayed.
**Testable:** yes - property

#### 5.1 WHEN ScenePromptPreview is created THEN the component SHALL handle prompt display and copying
**Thoughts:** We can test by rendering the component and verifying prompt text and copy button are present.
**Testable:** yes - property

#### 5.2 WHEN the prompt is displayed THEN the component SHALL show the full generated prompt text
**Thoughts:** We can verify the prompt text matches what we expect based on scene data.
**Testable:** yes - property

#### 5.3 WHEN the copy button is clicked THEN the component SHALL copy the prompt to clipboard
**Thoughts:** We can test by mocking the clipboard API and verifying it's called with the correct text.
**Testable:** yes - property

#### 5.4 WHEN the prompt changes THEN the component SHALL update the display automatically
**Thoughts:** We can test by changing props and verifying the displayed prompt updates.
**Testable:** yes - property

#### 5.5 WHEN macro insertion is needed THEN the component SHALL provide macro insertion functionality
**Thoughts:** We can test by clicking macro buttons and verifying the callback is called.
**Testable:** yes - property

#### 6.1 WHEN useSceneEditor hook is created THEN the hook SHALL manage scene state and operations
**Thoughts:** We can test hooks using React Testing Library's renderHook utility.
**Testable:** yes - property

#### 6.2 WHEN useImageGeneration hook is created THEN the hook SHALL manage image generation state
**Thoughts:** We can test hooks using renderHook and verify state transitions.
**Testable:** yes - property

#### 6.3-6.5 Hook behavior criteria
**Thoughts:** These are all testable using hook testing utilities.
**Testable:** yes - property

#### 7.1 WHEN a sub-component is extracted THEN all 35 tests SHALL pass before proceeding
**Thoughts:** This is a process requirement about our workflow, verified by running tests after each extraction.
**Testable:** yes - example (run tests after each step)

#### 7.2-7.5 Incremental refactoring criteria
**Thoughts:** These are process requirements about how we work, not runtime properties.
**Testable:** no (process, not code)

#### 8.1-8.5 Documentation criteria
**Thoughts:** These are about documentation quality, not runtime behavior.
**Testable:** no

#### 9.1-9.5 Tracking criteria
**Thoughts:** These are about project management and tracking, not code behavior.
**Testable:** no

## Property Reflection

After reviewing all properties, here are the redundancies to eliminate:

**Redundant Properties:**
1. Property 1.4 (maintain user-facing behavior) is redundant with Property 1.3 (all tests pass) - if tests pass, behavior is maintained
2. Property 1.5 (preserve props/callbacks) is redundant with Property 1.3 - tests will fail if API changes break things

**Combined Properties:**
- Properties 3.1-3.5 (SceneElementSelector) can be combined into comprehensive component tests similar to SceneCharacterSelector
- Properties 4.1-4.5 (SceneImageGenerator) can be combined into comprehensive component tests
- Properties 5.1-5.5 (ScenePromptPreview) can be combined into comprehensive component tests
- Properties 6.1-6.5 (hooks) can be combined into comprehensive hook tests

**Final Property Set:**
1. Refactoring preserves all functionality (existing 35 tests pass)
2. SceneElementSelector works correctly (comprehensive component tests)
3. SceneImageGenerator works correctly (comprehensive component tests)
4. ScenePromptPreview works correctly (comprehensive component tests)
5. useSceneEditor hook works correctly (comprehensive hook tests)
6. useImageGeneration hook works correctly (comprehensive hook tests)
7. SceneEditor final size is under 800 lines (verification)

## Correctness Properties

### Property 1: Refactoring preserves all functionality
*For any* refactoring step, when the code is modified, all 35 existing SceneEditor tests should continue to pass without modification
**Validates: Requirements 1.3, 1.4, 1.5, 7.1**

### Property 2: SceneElementSelector component correctness
*For any* valid set of available elements and selected elements, the SceneElementSelector component should:
- Render all available elements in the dropdown
- Display element names, descriptions, and categories
- Call onSelectionChange when selection changes
- Support multi-select functionality
- Handle unknown element references gracefully
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 3: SceneImageGenerator component correctness
*For any* valid scene and story, the SceneImageGenerator component should:
- Display generate button and handle clicks
- Open model selection dialog when requested
- Show loading state during generation
- Display errors when generation fails
- Call onImageStateChange callback with correct parameters
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 4: ScenePromptPreview component correctness
*For any* valid scene data, the ScenePromptPreview component should:
- Generate and display the correct prompt text
- Copy prompt to clipboard when button is clicked
- Update display when props change
- Provide macro insertion functionality
- Show success feedback after copying
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 5: useSceneEditor hook correctness
*For any* valid story and scene, the useSceneEditor hook should:
- Manage all scene editing state correctly
- Handle field updates without data loss
- Save changes to BookService correctly
- Handle save errors gracefully
- Provide macro insertion functionality
**Validates: Requirements 6.1, 6.3, 6.4**

### Property 6: useImageGeneration hook correctness
*For any* valid scene and story, the useImageGeneration hook should:
- Manage generation state transitions correctly
- Coordinate with SceneImageGenerationService
- Handle generation errors appropriately
- Update scene with generated images
- Provide preview data management
**Validates: Requirements 6.2, 6.3, 6.4**

### Property 7: Final component size verification
*When* the refactoring is complete, the SceneEditor component should be less than 800 lines
**Validates: Requirements 1.1, 9.5**

## Error Handling

### Component Error Handling

**SceneElementSelector:**
- Invalid element references → Display "Unknown" chip with error styling
- Empty element list → Display empty state message
- Selection callback errors → Log error, don't crash UI

**SceneImageGenerator:**
- Generation API errors → Display error message to user
- Network failures → Show retry option
- Invalid model selection → Prevent generation, show validation error
- Service errors → Log to console, show user-friendly message

**ScenePromptPreview:**
- Clipboard API unavailable → Show fallback message
- Prompt generation errors → Display error, allow retry
- Macro insertion errors → Log error, don't crash

### Hook Error Handling

**useSceneEditor:**
- Save failures → Set saveError state, display to user
- Invalid scene data → Log warning, use defaults
- BookService errors → Catch and expose via saveError

**useImageGeneration:**
- Generation failures → Set generationError state
- Service unavailable → Show appropriate error message
- Timeout errors → Allow cancellation and retry

### Integration Error Handling

- Component extraction errors → Existing tests will catch
- Prop type mismatches → TypeScript will catch at compile time
- State synchronization issues → Tests will catch
- Callback errors → Log and handle gracefully

## Testing Strategy

### Unit Testing

**New Components (3 components × ~20 tests each = ~60 tests):**

1. **SceneElementSelector Tests** (~20 tests)
   - Rendering with various element lists
   - Selection/deselection behavior
   - Chip display and removal
   - Unknown element handling
   - Empty state
   - Accessibility

2. **SceneImageGenerator Tests** (~20 tests)
   - Button rendering and clicks
   - Dialog opening/closing
   - Generation workflow
   - Loading states
   - Error display
   - Callback invocation

3. **ScenePromptPreview Tests** (~20 tests)
   - Prompt generation
   - Clipboard copying
   - Macro insertion
   - Prop updates
   - Success/error feedback

**New Hooks (2 hooks × ~10 tests each = ~20 tests):**

1. **useSceneEditor Tests** (~10 tests)
   - State initialization
   - Field updates
   - Save operations
   - Error handling
   - Macro insertion

2. **useImageGeneration Tests** (~10 tests)
   - Generation workflow
   - State transitions
   - Error handling
   - Preview management
   - Cancellation

**Integration Tests:**
- All 35 existing SceneEditor tests must pass after each extraction
- No new integration tests needed (existing tests cover integration)

**Total New Tests:** ~80 tests
**Total Tests After Refactoring:** 35 (existing) + 80 (new) = 115 tests

### Property-Based Testing

We will use **Vitest** (already configured) for property-based testing where applicable.

**Property Test 1: Refactoring preserves functionality**
- Run all 35 existing tests after each extraction
- All tests must pass without modification
- Automated in CI/CD pipeline

**Property Test 2-6: Component/Hook correctness**
- Standard unit tests with multiple input variations
- Edge cases covered (empty arrays, null values, special characters)
- Error conditions tested

**Property Test 7: Size verification**
- Automated check: `wc -l src/components/SceneEditor.tsx < 800`
- Run as part of final verification

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
   - All 115 tests passing
   - SceneEditor < 800 lines
   - No TypeScript errors
   - No ESLint warnings

## Implementation Plan Summary

### Phase 1: Testing ✅ COMPLETE
- 35 comprehensive tests created
- All tests passing
- Safety net established

### Phase 2: SceneCharacterSelector ✅ COMPLETE
- Component extracted (195 lines)
- 23 tests written and passing
- Integrated into SceneEditor
- Old code removed
- All 35 SceneEditor tests still passing

### Phase 3: SceneElementSelector (NEXT)
- Extract element selection logic (~200 lines)
- Write ~20 component tests
- Integrate and verify all tests pass
- Estimated: 4 hours

### Phase 4: SceneImageGenerator
- Extract image generation UI and logic (~300 lines)
- Write ~20 component tests
- Integrate and verify all tests pass
- Estimated: 6 hours

### Phase 5: ScenePromptPreview
- Extract prompt display and copying (~150 lines)
- Write ~20 component tests
- Integrate and verify all tests pass
- Estimated: 4 hours

### Phase 6: Custom Hooks
- Extract useSceneEditor hook (~150 lines)
- Extract useImageGeneration hook (~100 lines)
- Write ~20 hook tests total
- Integrate and verify all tests pass
- Estimated: 4 hours

### Phase 7: Final Verification
- Verify SceneEditor < 800 lines
- Run full test suite (115 tests)
- Update documentation
- Code review
- Estimated: 2 hours

**Total Remaining Effort:** 20 hours

## Success Criteria

1. ✅ All 35 existing SceneEditor tests pass
2. ✅ 80+ new tests written and passing
3. ✅ SceneEditor reduced to <800 lines
4. ✅ No TypeScript errors
5. ✅ No ESLint warnings
6. ✅ All components have clear, single responsibilities
7. ✅ Code is more maintainable and reusable
8. ✅ Documentation updated
