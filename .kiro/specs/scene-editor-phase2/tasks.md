# Implementation Plan - SceneEditor Phase 2

## Overview

This plan extracts 3 high-value features from SceneEditor to reduce it from 1,680 lines to ~1,030 lines (39% additional reduction). All extractions follow the proven pattern from Phase 1.

**Extraction Order:**
1. SceneDiagramPanel (most self-contained)
2. SceneTextPanel (also self-contained)
3. useLayoutManagement (most complex, benefits from previous extractions)

---

## Tasks

- [x] 1. Extract SceneDiagramPanel component
  - Create new component file with TypeScript interfaces
  - Implement diagram type selection (mermaid, math, code, markdown)
  - Implement language selection for code blocks
  - Implement diagram content editing with monospace font
  - Add preview button
  - Add configuration alert when diagram style not set
  - Handle auto-save on content changes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.1 Write tests for SceneDiagramPanel
  - **Property 1: SceneDiagramPanel component correctness**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
  - Test rendering with different diagram types
  - Test type selection behavior
  - Test language selector visibility (code type only)
  - Test content change handling
  - Test preview button click
  - Test auto-save callback invocation
  - Test alert display when no diagram style
  - Test placeholder text for each type
  - Target: ~15 tests
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.2 Integrate SceneDiagramPanel into SceneEditor
  - Import component
  - Replace existing diagram panel code
  - Wire up props and callbacks
  - Remove old diagram panel section
  - Verify all 35 SceneEditor tests still pass
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. Extract SceneTextPanel component
  - Create new component file with TypeScript interfaces
  - Implement text content editing with monospace font
  - Add macro insertion buttons
  - Add preview button
  - Maintain textarea ref for cursor positioning
  - Add helpful caption about macro usage
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.1 Write tests for SceneTextPanel
  - **Property 2: SceneTextPanel component correctness**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
  - Test rendering with text content
  - Test text change handling
  - Test macro button clicks
  - Test preview button click
  - Test textarea ref attachment
  - Test macro insertion callback
  - Test empty state handling
  - Target: ~12 tests
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2.2 Integrate SceneTextPanel into SceneEditor
  - Import component
  - Replace existing text panel code
  - Wire up props and callbacks
  - Remove old text panel section
  - Verify all 35 SceneEditor tests still pass
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. Extract useLayoutManagement hook
  - Create new hook file with TypeScript interfaces
  - Implement layout source calculation
  - Implement layout resolution with LayoutResolver
  - Add layout editor dialog state management
  - Implement layout save operation
  - Implement layout clear operation
  - Implement layout test generation with placeholder image
  - Add layout test dialog state management
  - Add error handling for save/test failures
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.1 Write tests for useLayoutManagement hook
  - **Property 3: useLayoutManagement hook correctness**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
  - Test layout source calculation (scene/story/book/default)
  - Test layout resolution with LayoutResolver
  - Test layout editor dialog state
  - Test layout save operation
  - Test layout clear operation
  - Test layout test generation
  - Test layout test dialog state
  - Test error handling for save failures
  - Test error handling for test failures
  - Test snackbar integration
  - Target: ~15 tests
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.2 Integrate useLayoutManagement into SceneEditor
  - Import and use hook
  - Replace local layout state with hook state
  - Replace layout handlers with hook methods
  - Remove duplicate layout management code
  - Verify all 35 SceneEditor tests still pass
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Final verification and cleanup
  - Run full test suite (verify 784+ tests passing)
  - Verify SceneEditor is approximately 1,030 lines
  - Run TypeScript compiler (no errors)
  - Run ESLint (no warnings)
  - Update component documentation
  - Update architecture diagrams
  - _Requirements: 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4.1 Verify final line count
  - Run: `wc -l src/components/SceneEditor.tsx`
  - Verify result is approximately 1,030 lines
  - Document final line count in requirements.md
  - Calculate total reduction from original (2,305 → 1,030 = 55%)
  - _Requirements: 7.4, 7.5_

- [x] 4.2 Update documentation
  - Update ARCHITECTURE-ANALYSIS-REPORT.md with Phase 2 results
  - Update ARCHITECTURE-HEALING-TRACKING.md with completion status
  - Update SCENE-EDITOR-REFACTORING-ANALYSIS.md with actual results
  - Document component hierarchy in design.md
  - Update README if needed
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 5. Checkpoint - Ensure all tests pass, ask the user if questions arise

---

## Notes

### Testing Strategy
- **Optional tests marked with `*`** - These are important but can be skipped for MVP
- **Core implementation tasks** - Must be completed
- **Integration verification** - All 35 SceneEditor tests must pass after each extraction

### Extraction Pattern (Proven from Phase 1)
1. Write tests first (TDD approach)
2. Extract component/hook
3. Integrate into SceneEditor
4. Remove old code
5. Verify all tests pass
6. Commit

### Success Metrics
- SceneEditor: 1,680 → ~1,030 lines (39% reduction)
- Total reduction: 2,305 → 1,030 lines (55% from original)
- New tests: ~57 (target: 784+ total)
- All existing tests: Pass (35 SceneEditor tests)
- TypeScript: No errors
- ESLint: No new warnings

