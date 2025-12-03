# Implementation Plan

- [x] 1. Extract SceneElementSelector component
  - Create new component file with TypeScript interfaces
  - Implement element selection UI (accordion, dropdown, chips)
  - Handle multi-select functionality
  - Add category badges for elements
  - Handle unknown element references gracefully
  - Add empty state message
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.1 Write tests for SceneElementSelector
  - **Property 2: SceneElementSelector component correctness**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  - Test rendering with various element lists
  - Test selection/deselection behavior
  - Test chip display and removal
  - Test unknown element handling
  - Test empty state
  - Test accessibility
  - Target: ~20 tests
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.2 Integrate SceneElementSelector into SceneEditor
  - Import component
  - Replace existing element selection code
  - Wire up props and callbacks
  - Remove old element selection accordion
  - Verify all 35 SceneEditor tests still pass
  - _Requirements: 1.3, 7.1_

- [x] 2. Extract SceneImageGenerator component
  - Create new component file with TypeScript interfaces
  - Implement generate button and loading states
  - Integrate ModelSelectionDialog
  - Integrate ImageGenerationPreviewDialog
  - Handle generation workflow and state transitions
  - Add error handling and display
  - Implement image save/clear callbacks
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2.1 Write tests for SceneImageGenerator
  - **Property 3: SceneImageGenerator component correctness**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
  - Test button rendering and clicks
  - Test dialog opening/closing
  - Test generation workflow
  - Test loading states
  - Test error display
  - Test callback invocation
  - Target: ~20 tests
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2.2 Integrate SceneImageGenerator into SceneEditor
  - Import component
  - Replace existing image generation code
  - Wire up props and callbacks
  - Remove old generation button and dialogs
  - Verify all 35 SceneEditor tests still pass
  - _Requirements: 1.3, 7.1_

- [x] 3. Extract ScenePromptPreview component
  - Create new component file with TypeScript interfaces
  - Implement prompt generation logic
  - Add prompt display UI
  - Implement copy to clipboard functionality
  - Add macro insertion buttons
  - Handle success/error notifications
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3.1 Write tests for ScenePromptPreview
  - **Property 4: ScenePromptPreview component correctness**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
  - Test prompt generation
  - Test clipboard copying
  - Test macro insertion
  - Test prop updates
  - Test success/error feedback
  - Target: ~20 tests
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3.2 Integrate ScenePromptPreview into SceneEditor
  - Import component
  - Replace existing prompt code
  - Wire up props and callbacks
  - Remove old prompt accordion
  - Verify all 35 SceneEditor tests still pass
  - _Requirements: 1.3, 7.1_

- [x] 4. Extract useSceneEditor custom hook
  - Create new hook file with TypeScript interfaces
  - Implement scene state management
  - Add field update handlers (title, description, text panel)
  - Add character/element selection handlers
  - Implement save operation with BookService
  - Add error handling for save failures
  - Implement macro insertion logic
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 4.1 Write tests for useSceneEditor hook
  - **Property 5: useSceneEditor hook correctness**
  - **Validates: Requirements 6.1, 6.3, 6.4**
  - Test state initialization
  - Test field updates
  - Test save operations
  - Test error handling
  - Test macro insertion
  - Target: ~10 tests
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 4.2 Integrate useSceneEditor into SceneEditor
  - Import and use hook
  - Replace local state with hook state
  - Replace handlers with hook handlers
  - Remove duplicate state management code
  - Verify all 35 SceneEditor tests still pass
  - _Requirements: 1.3, 7.1_

- [x] 5. Extract useImageGeneration custom hook
  - Create new hook file with TypeScript interfaces
  - Implement generation state management
  - Add generation workflow coordination
  - Integrate with SceneImageGenerationService
  - Add error handling
  - Implement preview data management
  - Add cancellation support
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 5.1 Write tests for useImageGeneration hook
  - **Property 6: useImageGeneration hook correctness**
  - **Validates: Requirements 6.2, 6.3, 6.4**
  - Test generation workflow
  - Test state transitions
  - Test error handling
  - Test preview management
  - Test cancellation
  - Target: ~10 tests
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 5.2 Integrate useImageGeneration into SceneEditor
  - Import and use hook
  - Replace local generation state with hook state
  - Replace generation logic with hook methods
  - Remove duplicate generation code
  - Verify all 35 SceneEditor tests still pass
  - _Requirements: 1.3, 7.1_

- [-] 6. Final verification and cleanup
  - Run full test suite (verify 115+ tests passing)
  - Verify SceneEditor is under 800 lines
  - Run TypeScript compiler (no errors)
  - Run ESLint (no warnings)
  - Update component documentation
  - Update architecture diagrams
  - _Requirements: 1.1, 8.1, 8.2, 8.3, 8.4, 8.5, 9.5_

- [x] 6.1 Verify final line count
  - **Property 7: Final component size verification**
  - **Validates: Requirements 1.1, 9.5**
  - Run: `wc -l src/components/SceneEditor.tsx`
  - Verify result is less than 800 lines
  - Document final line count in requirements.md
  - _Requirements: 1.1, 9.5_

- [-] 6.2 Update documentation
  - Update ARCHITECTURE-ANALYSIS-REPORT.md with new component structure
  - Update ARCHITECTURE-HEALING-TRACKING.md with completion status
  - Add component hierarchy diagram to design.md
  - Document data flow between components
  - Update README if needed
  - _Requirements: 8.1, 8.3, 8.5_

- [ ] 7. Checkpoint - Ensure all tests pass, ask the user if questions arise
