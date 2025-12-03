# Requirements Document

## Introduction

The SceneEditor component has grown to 2,305 lines, making it difficult to maintain, test, and understand. This component is responsible for too many concerns (scene editing, character selection, element selection, image generation, prompt building, layout management, and dialog management). 

**Phase 1 (Testing): COMPLETE** ✅
- 35 comprehensive tests created
- All tests passing
- Safety net established

**Phase 2 (Refactoring): IN PROGRESS** 🔄
- SceneCharacterSelector extracted (DONE ✅)
- SceneElementSelector (TODO)
- SceneImageGenerator (TODO)
- ScenePromptPreview (TODO)
- Custom hooks extraction (TODO)

This spec covers the complete refactoring effort to break SceneEditor into smaller, focused components while maintaining all existing functionality.

## Glossary

- **SceneEditor**: The main component for editing scene content, currently 2,305 lines
- **Sub-component**: A smaller, focused component extracted from SceneEditor
- **Hook**: A custom React hook that encapsulates reusable logic
- **Safety Net**: The 35 existing tests that verify functionality remains intact
- **God Object**: An anti-pattern where a single component has too many responsibilities
- **Extraction**: The process of moving code from SceneEditor into a new component or hook

## Progress Summary

### Completed Work ✅
- **Phase 1: Testing** - 35 comprehensive tests (100%)
- **SceneCharacterSelector** - Extracted, tested (23 tests), integrated, old code removed (100%)
- **Line Reduction** - 2,400 → 2,305 lines (95 lines removed, ~4% reduction)

### Remaining Work ⏳
- **SceneElementSelector** - Extract element selection logic (~200 lines)
- **SceneImageGenerator** - Extract image generation UI and logic (~300 lines)
- **ScenePromptPreview** - Extract prompt display and copying (~150 lines)
- **Custom Hooks** - Extract useSceneEditor and useImageGeneration (~200 lines)
- **Final Integration** - Ensure all 35 tests still pass
- **Target** - Reduce SceneEditor from 2,305 → <800 lines

### Estimated Effort
- **Completed:** 20 hours (testing + SceneCharacterSelector)
- **Remaining:** 16 hours (3 components + hooks + integration)
- **Total:** 36 hours

## Requirements

### Requirement 1

**User Story:** As a developer, I want the SceneEditor component broken into smaller sub-components, so that the codebase is easier to maintain and understand.

#### Acceptance Criteria

1. WHEN the refactoring is complete THEN the SceneEditor SHALL be less than 800 lines
2. WHEN sub-components are extracted THEN each sub-component SHALL have a single, clear responsibility
3. WHEN the refactoring is complete THEN all 35 existing tests SHALL continue to pass without modification
4. WHEN a sub-component is created THEN the system SHALL maintain the same user-facing behavior
5. WHEN components are split THEN the system SHALL preserve all existing props and callbacks

### Requirement 2 ✅ COMPLETE

**User Story:** As a developer, I want character selection logic extracted into a dedicated component, so that character management is isolated and reusable.

**Status:** DONE - SceneCharacterSelector component created with 23 passing tests

#### Acceptance Criteria

1. ✅ WHEN SceneCharacterSelector is created THEN the component SHALL handle character selection UI
2. ✅ WHEN a character is selected THEN the component SHALL call the provided onChange callback
3. ✅ WHEN the component renders THEN the system SHALL display available characters from both story and book levels
4. ✅ WHEN characters are displayed THEN the system SHALL show character names and descriptions
5. ✅ WHEN the component is used THEN the system SHALL support multi-select functionality

**Implementation Details:**
- Component: `src/components/SceneCharacterSelector.tsx` (195 lines)
- Tests: `tests/components/SceneCharacterSelector.test.tsx` (23 tests, all passing)
- Features: Multi-select dropdown, book-level badges, unknown character handling, removable chips
- Integration: ✅ Imported and used in SceneEditor
- Cleanup: ✅ Old character selection code removed from SceneEditor
- Verification: ✅ All 35 SceneEditor tests still passing

### Requirement 3

**User Story:** As a developer, I want element selection logic extracted into a dedicated component, so that element management is isolated and reusable.

#### Acceptance Criteria

1. WHEN SceneElementSelector is created THEN the component SHALL handle element selection UI
2. WHEN an element is selected THEN the component SHALL call the provided onChange callback
3. WHEN the component renders THEN the system SHALL display available elements from the story
4. WHEN elements are displayed THEN the system SHALL show element names, descriptions, and categories
5. WHEN the component is used THEN the system SHALL support multi-select functionality

### Requirement 4

**User Story:** As a developer, I want image generation logic extracted into a dedicated component, so that image generation concerns are isolated.

#### Acceptance Criteria

1. WHEN SceneImageGenerator is created THEN the component SHALL handle all image generation UI and logic
2. WHEN the generate button is clicked THEN the component SHALL open the model selection dialog
3. WHEN image generation completes THEN the component SHALL call the onImageStateChange callback
4. WHEN generation is in progress THEN the component SHALL display loading state
5. WHEN an error occurs THEN the component SHALL display appropriate error messages

### Requirement 5

**User Story:** As a developer, I want prompt building and preview logic extracted into a dedicated component, so that prompt concerns are isolated.

#### Acceptance Criteria

1. WHEN ScenePromptPreview is created THEN the component SHALL handle prompt display and copying
2. WHEN the prompt is displayed THEN the component SHALL show the full generated prompt text
3. WHEN the copy button is clicked THEN the component SHALL copy the prompt to clipboard
4. WHEN the prompt changes THEN the component SHALL update the display automatically
5. WHEN macro insertion is needed THEN the component SHALL provide macro insertion functionality

### Requirement 6

**User Story:** As a developer, I want reusable scene editing logic extracted into custom hooks, so that logic can be shared and tested independently.

#### Acceptance Criteria

1. WHEN useSceneEditor hook is created THEN the hook SHALL manage scene state and operations
2. WHEN useImageGeneration hook is created THEN the hook SHALL manage image generation state
3. WHEN hooks are used THEN the system SHALL maintain the same behavior as before
4. WHEN hooks manage state THEN the system SHALL properly handle all state updates
5. WHEN hooks are extracted THEN the system SHALL reduce component complexity

### Requirement 7

**User Story:** As a developer, I want the refactoring to be done incrementally, so that we can verify correctness at each step.

#### Acceptance Criteria

1. WHEN a sub-component is extracted THEN all 35 tests SHALL pass before proceeding to the next extraction
2. WHEN the refactoring is in progress THEN the system SHALL remain in a working state after each commit
3. WHEN a component is extracted THEN the commit SHALL include only that single extraction
4. WHEN tests fail THEN the developer SHALL fix issues before continuing
5. WHEN the refactoring is complete THEN the system SHALL have the same test coverage as before

### Requirement 8

**User Story:** As a developer, I want clear documentation of the new component structure, so that future developers understand the architecture.

#### Acceptance Criteria

1. WHEN the refactoring is complete THEN the system SHALL include updated architecture documentation
2. WHEN components are created THEN each component SHALL have clear JSDoc comments
3. WHEN the structure changes THEN the system SHALL update the component hierarchy diagram
4. WHEN props are defined THEN each prop SHALL have TypeScript types and descriptions
5. WHEN the refactoring is done THEN the system SHALL document the data flow between components

### Requirement 9

**User Story:** As a developer, I want to track completion of the refactoring work, so that I know what's done and what remains.

#### Acceptance Criteria

1. WHEN work is completed THEN the system SHALL mark requirements as COMPLETE with checkmarks
2. WHEN a component is extracted THEN the system SHALL document the file location and line count
3. WHEN tests are written THEN the system SHALL document the test file location and test count
4. WHEN the refactoring progresses THEN the system SHALL update the SceneEditor line count
5. WHEN all extractions are done THEN the system SHALL verify SceneEditor is under 800 lines

**Current Status:**
- ✅ Phase 1: Testing Complete (35 tests)
- ✅ SceneCharacterSelector: Extracted (195 lines, 23 tests)
- ⏳ SceneElementSelector: Not started
- ⏳ SceneImageGenerator: Not started
- ⏳ ScenePromptPreview: Not started
- ⏳ Custom hooks: Not started
- 📊 SceneEditor: 2,305 lines → Target: <800 lines
