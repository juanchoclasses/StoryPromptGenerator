# Requirements Document - SceneEditor Phase 2 Refactoring

## Introduction

SceneEditor Phase 1 successfully reduced the component from 2,305 lines to 1,680 lines (27% reduction) by extracting 5 components and 2 hooks. However, the component still contains significant complexity in diagram management, text panel management, and layout operations.

**Phase 2 Goal:** Extract 3 additional high-value features to reduce SceneEditor to ~1,030 lines (39% additional reduction, 55% total reduction from original).

**Initial State (Phase 2 Start):**
- SceneEditor: 1,680 lines
- Components extracted: 5 (SceneCharacterSelector, SceneElementSelector, SceneImageGenerator, ScenePromptPreview, SceneLayoutEditor)
- Hooks extracted: 2 (useSceneEditor, useImageGeneration)
- Tests: 727 passing

**Final State (Phase 2 Complete):**
- SceneEditor: 1,253 lines (25% reduction from Phase 2 start)
- Components extracted: 7 (+2: SceneDiagramPanel, SceneTextPanel)
- Hooks extracted: 3 (+1: useLayoutManagement)
- Tests: 819 passing (+92 tests)

**Total Reduction from Original:**
- Original: 2,305 lines
- Final: 1,253 lines
- **Reduction: 1,052 lines (46% total reduction)**

## Glossary

- **SceneEditor**: The main component for editing scene content, currently 1,680 lines
- **Diagram Panel**: Section for adding mermaid diagrams, math equations, code blocks, or markdown overlays
- **Text Panel**: Section for adding text overlays on generated images with macro support
- **Layout Management**: System for configuring how images, text, and diagrams are composed
- **Phase 1**: Previous refactoring that extracted character/element selection, image generation, and prompt preview
- **Phase 2**: Current refactoring focusing on diagram, text panel, and layout management

## Requirements

### Requirement 1

**User Story:** As a developer, I want diagram panel logic extracted into a dedicated component, so that diagram editing is isolated and reusable.

#### Acceptance Criteria

1. WHEN SceneDiagramPanel is created THEN the component SHALL handle all diagram editing UI and logic
2. WHEN a user selects a diagram type THEN the component SHALL update the UI accordingly (show language selector for code)
3. WHEN diagram content changes THEN the component SHALL auto-save to storage without triggering full scene reload
4. WHEN the preview button is clicked THEN the component SHALL call the provided preview callback
5. WHEN the story has no diagram style configured THEN the component SHALL display an informational alert

### Requirement 2

**User Story:** As a developer, I want text panel logic extracted into a dedicated component, so that text editing with macros is isolated and reusable.

#### Acceptance Criteria

1. WHEN SceneTextPanel is created THEN the component SHALL handle text panel editing UI
2. WHEN a user types in the text field THEN the component SHALL call the onChange callback
3. WHEN a macro button is clicked THEN the component SHALL insert the macro at the cursor position
4. WHEN the preview button is clicked THEN the component SHALL call the provided preview callback
5. WHEN the component renders THEN the system SHALL maintain the textarea ref for cursor positioning

### Requirement 3

**User Story:** As a developer, I want layout management logic extracted into a custom hook, so that layout operations are isolated and testable.

#### Acceptance Criteria

1. WHEN useLayoutManagement hook is created THEN the hook SHALL manage all layout-related state
2. WHEN layout is edited THEN the hook SHALL save changes to the correct scene in storage
3. WHEN layout is cleared THEN the hook SHALL remove scene-specific layout and fall back to inherited layout
4. WHEN layout is tested THEN the hook SHALL generate a preview with placeholder image
5. WHEN layout source is calculated THEN the hook SHALL correctly resolve scene/story/book hierarchy

### Requirement 4

**User Story:** As a developer, I want the refactoring to maintain all existing functionality, so that users experience no breaking changes.

#### Acceptance Criteria

1. WHEN Phase 2 refactoring is complete THEN all 35 SceneEditor tests SHALL continue to pass
2. WHEN components are extracted THEN the system SHALL maintain the same user-facing behavior
3. WHEN the refactoring is complete THEN the system SHALL preserve all existing props and callbacks
4. WHEN a component is extracted THEN the commit SHALL include only that single extraction
5. WHEN tests fail THEN the developer SHALL fix issues before continuing

### Requirement 5

**User Story:** As a developer, I want comprehensive tests for new components, so that extracted logic is well-tested.

#### Acceptance Criteria

1. WHEN SceneDiagramPanel is created THEN the component SHALL have at least 15 tests
2. WHEN SceneTextPanel is created THEN the component SHALL have at least 12 tests
3. WHEN useLayoutManagement is created THEN the hook SHALL have at least 15 tests
4. WHEN tests are written THEN each test SHALL focus on a single behavior
5. WHEN the refactoring is complete THEN total test count SHALL be at least 800

### Requirement 6

**User Story:** As a developer, I want clear documentation of Phase 2 changes, so that the team understands the new structure.

#### Acceptance Criteria

1. WHEN Phase 2 is complete THEN the system SHALL update architecture documentation
2. WHEN components are created THEN each component SHALL have clear TypeScript interfaces
3. WHEN the refactoring is done THEN the system SHALL document the component hierarchy
4. WHEN props are defined THEN each prop SHALL have TypeScript types and JSDoc comments
5. WHEN Phase 2 is complete THEN the system SHALL update the requirements.md with final metrics

### Requirement 7

**User Story:** As a developer, I want to track Phase 2 progress, so that I know what's done and what remains.

#### Acceptance Criteria

1. WHEN work is completed THEN the system SHALL mark requirements as COMPLETE with checkmarks
2. WHEN a component is extracted THEN the system SHALL document the file location and line count
3. WHEN tests are written THEN the system SHALL document the test file location and test count
4. WHEN the refactoring progresses THEN the system SHALL update the SceneEditor line count
5. WHEN all extractions are done THEN the system SHALL verify SceneEditor is approximately 1,030 lines

**Final Status:**
- ✅ SceneDiagramPanel: COMPLETE (src/components/SceneDiagramPanel.tsx, 15 tests)
- ✅ SceneTextPanel: COMPLETE (src/components/SceneTextPanel.tsx, 12 tests)
- ✅ useLayoutManagement: COMPLETE (src/hooks/useLayoutManagement.ts, 15 tests)
- ✅ SceneEditor: 1,253 lines (46% reduction from original 2,305 lines)

