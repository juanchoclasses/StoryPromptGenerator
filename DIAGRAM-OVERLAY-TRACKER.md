# Diagram Overlay Feature - Implementation Tracker

## Overview
Add support for procedural diagrams (Mermaid, LaTeX math, code blocks) that can be rendered onto blackboard/whiteboard images and composited onto scene images in post-processing.

**Pattern**: Follow existing text overlay implementation in `OverlayService.ts`

**Start Date**: 2025-10-30  
**Target Completion**: TBD  
**Status**: 🟡 Planning

---

## Phase 0: Prototype & Testing ✅ COMPLETE

### 0.1 Create Standalone Test Class
- [x] Create `DiagramRenderer.ts` - standalone TypeScript class ✅
- [x] Create `test-diagram-renderer.html` - browser test harness ✅
- [x] Create `test-diagram-renderer-working.html` - **WORKING** browser test harness ✅
- [x] Create `DIAGRAM-RENDERER-TEST-GUIDE.md` - testing documentation ✅
- [ ] Create `DiagramRenderer.test.ts` - unit tests (optional for now)
- [ ] Install npm dependencies: `mermaid`, `katex`, `highlight.js` (optional for test harness)
- [x] Test Mermaid diagram rendering ✅ (ready to test - working version available)
- [x] Test Math equation rendering (simplified version) ✅
- [x] Test Code syntax highlighting ✅
- [x] Test blackboard/whiteboard styling ✅
- [x] Validate canvas composition works ✅
- [ ] Performance testing with complex diagrams (test with real usage)

**Acceptance Criteria:**
- ✅ Class works independently of React ✅
- ✅ Can be tested in browser with simple HTML page ✅
- ✅ Mermaid diagrams render correctly ✅
- ✅ Code blocks render correctly ✅
- ✅ Output is valid canvas element ✅

**✅ TESTED & WORKING:** Use `test-diagram-final.html` - fully functional!

**What Works:**
- ✅ Mermaid flowcharts render correctly
- ✅ Diagrams displayed on blackboard/whiteboard backgrounds
- ✅ Wooden frame borders
- ✅ Customizable dimensions
- ✅ SVG to canvas conversion
- ✅ Proper scaling and centering

**Test File:** `test-diagram-final.html`

---

## Phase 1: Data Model Extensions

### 1.1 Type Definitions (`src/types/Story.ts`)
- [ ] Create `DiagramPanel` interface
- [ ] Create `DiagramStyle` interface
- [ ] Add `diagramPanel?: DiagramPanel` to Scene interface
- [ ] Export types for use across app

**Files to modify:**
- `src/types/Story.ts`

**Testing:**
- [ ] TypeScript compilation passes
- [ ] Existing code still compiles

---

### 1.2 Book Configuration (`src/types/Book.ts`)
- [ ] Add `diagramConfig?: DiagramStyle` to Book interface
- [ ] Add `diagramConfig?: DiagramStyle` to BookMetadata interface
- [ ] Create `DEFAULT_DIAGRAM_CONFIG` constant
- [ ] Update any Book-related types

**Files to modify:**
- `src/types/Book.ts`

**Testing:**
- [ ] TypeScript compilation passes
- [ ] Default config has sensible values

---

### 1.3 Scene Model (`src/models/Scene.ts`)
- [ ] Add `diagramPanel?: DiagramPanel` property
- [ ] Update `SceneExchangeFormat` to include diagramPanel
- [ ] Update `toJSON()` to serialize diagramPanel
- [ ] Update `fromJSON()` to deserialize diagramPanel
- [ ] Update constructor to accept diagramPanel

**Files to modify:**
- `src/models/Scene.ts`

**Testing:**
- [ ] Scene serialization includes diagram panel
- [ ] Scene deserialization works correctly
- [ ] Backward compatibility maintained (undefined diagram panels)

---

## Phase 2: Diagram Rendering Service

### 2.1 Port Prototype to Service (`src/services/DiagramRenderService.ts`)
- [ ] Copy tested `DiagramRenderer` class
- [ ] Adapt for React/browser environment if needed
- [ ] Add error handling and logging
- [ ] Add caching for repeated renders (optional)
- [ ] Export service functions

**Files to create:**
- `src/services/DiagramRenderService.ts`

**Testing:**
- [ ] Unit tests pass
- [ ] Service integrates with app dependencies
- [ ] Error cases handled gracefully

---

### 2.2 Mermaid Integration
- [ ] Initialize Mermaid library
- [ ] Configure Mermaid themes (dark/light)
- [ ] Implement `renderMermaid()` function
- [ ] Handle Mermaid syntax errors
- [ ] SVG to canvas conversion

**Dependencies:**
- `mermaid` npm package

**Testing:**
- [ ] Flowcharts render correctly
- [ ] Sequence diagrams render correctly
- [ ] Class diagrams render correctly
- [ ] Invalid syntax shows error message

---

### 2.3 Math Rendering (KaTeX)
- [ ] Initialize KaTeX library
- [ ] Implement `renderMath()` function
- [ ] Handle inline vs block equations
- [ ] Handle LaTeX syntax errors
- [ ] HTML/SVG to canvas conversion

**Dependencies:**
- `katex` npm package

**Testing:**
- [ ] Simple equations render correctly
- [ ] Complex equations with fractions, matrices work
- [ ] Invalid LaTeX shows error message

---

### 2.4 Code Syntax Highlighting
- [ ] Initialize highlight.js or Prism
- [ ] Implement `renderCode()` function
- [ ] Support multiple languages (JS, Python, Java, etc.)
- [ ] Apply syntax theme colors
- [ ] Render to canvas with proper formatting

**Dependencies:**
- `highlight.js` or `prismjs` npm package

**Testing:**
- [ ] JavaScript code highlights correctly
- [ ] Python code highlights correctly
- [ ] Line numbers optional
- [ ] Theme matches blackboard/whiteboard style

---

## Phase 3: Overlay Service Extension

### 3.1 Diagram Overlay Function (`src/services/OverlayService.ts`)
- [ ] Implement `overlayDiagramOnImage()` function
- [ ] Calculate diagram positioning (9 positions)
- [ ] Handle gutter/margins
- [ ] Composite diagram onto base image
- [ ] Return composited image URL

**Files to modify:**
- `src/services/OverlayService.ts`

**Testing:**
- [ ] Diagram positions correctly at all 9 locations
- [ ] Gutters/margins work correctly
- [ ] Image quality preserved

---

### 3.2 Combined Overlay Function
- [ ] Implement `applyAllOverlays()` function
- [ ] Apply text overlay first (if exists)
- [ ] Apply diagram overlay second (if exists)
- [ ] Handle cases where panels overlap
- [ ] Optimize to avoid redundant image loads

**Files to modify:**
- `src/services/OverlayService.ts`

**Testing:**
- [ ] Text + diagram both render correctly
- [ ] Text-only works (backward compat)
- [ ] Diagram-only works
- [ ] Neither works (returns original image)
- [ ] Overlays don't interfere with each other

---

## Phase 4: UI Components

### 4.1 Diagram Panel Editor (`src/components/DiagramPanelEditor.tsx`)
- [ ] Create component file
- [ ] Diagram type selector (Mermaid/Math/Code)
- [ ] Content textarea with syntax highlighting
- [ ] Live preview pane (optional)
- [ ] Clear/Reset buttons
- [ ] Style controls (position, size, colors)
- [ ] Validation and error display

**Files to create:**
- `src/components/DiagramPanelEditor.tsx`

**Testing:**
- [ ] Type selector changes update state
- [ ] Textarea updates propagate to parent
- [ ] Preview shows rendered diagram
- [ ] Validation catches errors

---

### 4.2 Diagram Config Dialog (`src/components/DiagramConfigDialog.tsx`)
- [ ] Create component file
- [ ] Board style selector (blackboard/whiteboard/transparent)
- [ ] Color pickers (background, foreground)
- [ ] Position controls
- [ ] Size controls (width/height percentage)
- [ ] Gutter controls
- [ ] Border style options
- [ ] Preview with sample diagram
- [ ] Save/Cancel buttons

**Files to create:**
- `src/components/DiagramConfigDialog.tsx`

**Testing:**
- [ ] All controls update config state
- [ ] Preview updates in real-time
- [ ] Save persists configuration
- [ ] Cancel discards changes

---

### 4.3 Update Scene Editor (`src/components/SceneEditor.tsx`)
- [ ] Import DiagramPanelEditor
- [ ] Add `diagramPanel` state
- [ ] Add diagram panel UI section (after text panel)
- [ ] Update `handleDiagramPanelChange` with auto-save
- [ ] Add "Configure Diagram Style" button
- [ ] Update image generation to use diagram overlay
- [ ] Update preview to show diagram

**Files to modify:**
- `src/components/SceneEditor.tsx`

**Testing:**
- [ ] Diagram panel shows in UI
- [ ] Changes auto-save to localStorage
- [ ] Generate Image applies diagram overlay
- [ ] UI doesn't break existing functionality

---

### 4.4 Update Book Style Editor (`src/components/BookStyleEditor.tsx`)
- [ ] Add diagram config section
- [ ] Link to DiagramConfigDialog
- [ ] Show current diagram config summary
- [ ] Save diagram config to book

**Files to modify:**
- `src/components/BookStyleEditor.tsx`

**Testing:**
- [ ] Diagram config UI integrates smoothly
- [ ] Config saves to book correctly
- [ ] Config loads from book correctly

---

## Phase 5: Integration with Image Generation

### 5.1 Update Scene Image Generation
- [ ] Modify `performImageGeneration` in SceneEditor
- [ ] Check for diagram panel presence
- [ ] Call `applyAllOverlays` instead of just text overlay
- [ ] Pass diagram config from book
- [ ] Handle diagram rendering errors gracefully
- [ ] Update loading states/messages

**Files to modify:**
- `src/components/SceneEditor.tsx` (lines ~720-755)

**Testing:**
- [ ] Images generate with diagrams correctly
- [ ] Text + diagram both work
- [ ] Error handling works
- [ ] Loading indicators show during render

---

### 5.2 Update Batch Image Generation
- [ ] Modify `handleBatchGenerateScene` in StoriesPanel
- [ ] Apply diagram overlays in batch mode
- [ ] Handle diagram rendering errors in batch
- [ ] Update progress messages

**Files to modify:**
- `src/components/StoriesPanel.tsx` (lines ~315-400)

**Testing:**
- [ ] Batch generation includes diagrams
- [ ] Errors don't stop batch process
- [ ] Progress messages accurate

---

## Phase 6: Dependencies & Configuration

### 6.1 Add NPM Dependencies
- [ ] Install `mermaid` package
- [ ] Install `katex` package
- [ ] Install `highlight.js` or `prismjs`
- [ ] Update package.json
- [ ] Update package-lock.json
- [ ] Verify no version conflicts

**Commands:**
```bash
npm install mermaid katex highlight.js
npm install --save-dev @types/katex @types/node
```

**Testing:**
- [ ] npm install succeeds
- [ ] No dependency conflicts
- [ ] App builds successfully

---

### 6.2 Library Initialization
- [ ] Initialize Mermaid in main.tsx or service
- [ ] Configure Mermaid themes
- [ ] Configure KaTeX settings
- [ ] Configure highlight.js languages/themes
- [ ] Handle initialization errors

**Files to modify:**
- `src/main.tsx` or create `src/config/diagram-libraries.ts`

**Testing:**
- [ ] Libraries load without errors
- [ ] Configuration applies correctly
- [ ] No console errors on app start

---

## Phase 7: Storage & Migration

### 7.1 Storage Service Updates
- [ ] Verify Scene serialization includes diagramPanel
- [ ] Test localStorage save/load with diagram data
- [ ] Test IndexedDB compatibility (if used)
- [ ] Handle large diagram content (size limits)

**Files to verify:**
- `src/services/StorageService.ts`
- `src/services/BookService.ts`

**Testing:**
- [ ] Scenes with diagrams save correctly
- [ ] Scenes load with diagrams intact
- [ ] No localStorage quota issues

---

### 7.2 Data Migration
- [ ] Create migration function in MigrationService
- [ ] Add diagramPanel: undefined to existing scenes
- [ ] Add diagramConfig to existing books if needed
- [ ] Version bump if needed (e.g., v5.0.0)
- [ ] Test migration on sample data

**Files to modify:**
- `src/services/MigrationService.ts`

**Testing:**
- [ ] Migration runs successfully
- [ ] Existing data not corrupted
- [ ] New fields added correctly
- [ ] Backward compatibility maintained

---

## Phase 8: Export Integration

### 8.1 DOCX Export
- [ ] Verify images exported include diagram overlays
- [ ] Test with various diagram types
- [ ] Ensure image quality in Word docs

**Files to verify:**
- `src/services/DocxExportService.ts`

**Testing:**
- [ ] Exported images have diagrams
- [ ] Images clear and readable in Word
- [ ] No quality loss

---

### 8.2 JSON Story Export
- [ ] Verify diagramPanel included in Scene export
- [ ] Test import of scenes with diagrams
- [ ] Update story-import-schema.json if needed
- [ ] Test round-trip (export → import)

**Files to modify:**
- `src/services/StoryExportService.ts`
- `story-import-schema.json` (if validation added)

**Testing:**
- [ ] Export includes diagram data
- [ ] Import reconstructs diagram correctly
- [ ] Round-trip preserves all data

---

## Phase 9: Documentation & Examples

### 9.1 User Documentation
- [ ] Update README with diagram feature
- [ ] Create DIAGRAM_USAGE_GUIDE.md
- [ ] Add Mermaid syntax examples
- [ ] Add LaTeX math examples
- [ ] Add code block examples
- [ ] Screenshot examples

**Files to create/modify:**
- `README.md`
- `DIAGRAM_USAGE_GUIDE.md` (new)

---

### 9.2 Sample Content
- [ ] Add example scenes with Mermaid diagrams
- [ ] Add example with math equations
- [ ] Add example with code blocks
- [ ] Add to existing CS-100.json story

**Files to modify:**
- `stories/CS-100.json` or create new example story

---

## Phase 10: Testing & Polish

### 10.1 Integration Testing
- [ ] Test complete workflow: edit → generate → export
- [ ] Test with different aspect ratios
- [ ] Test with different book styles
- [ ] Test performance with complex diagrams
- [ ] Test error recovery

---

### 10.2 Edge Cases
- [ ] Empty diagram content
- [ ] Invalid Mermaid syntax
- [ ] Invalid LaTeX syntax
- [ ] Very large diagrams
- [ ] Overlapping text + diagram panels
- [ ] Multiple scenes with diagrams in batch

---

### 10.3 Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

---

### 10.4 Performance Optimization
- [ ] Profile diagram rendering time
- [ ] Add caching for repeated renders
- [ ] Optimize canvas operations
- [ ] Debounce preview updates
- [ ] Lazy load diagram libraries

---

## Known Issues & Future Enhancements

### Current Limitations
- [ ] Document any diagram size limitations
- [ ] Document rendering performance issues
- [ ] Document browser compatibility issues

### Future Enhancements
- [ ] Interactive diagram editor (visual)
- [ ] Diagram templates library
- [ ] Hand-drawn chalk effect
- [ ] Animation support (animated diagrams)
- [ ] Multiple diagram panels per scene
- [ ] AI-generated diagrams from descriptions

---

## Rollback Plan

If major issues arise:
1. Feature flag to disable diagram rendering
2. Revert to text-only overlays
3. Data structure preserves diagram content even if not rendered
4. Migration can be reversed

---

## Dependencies

**NPM Packages:**
- `mermaid` (^10.6.1) - Diagram rendering
- `katex` (^0.16.9) - Math equation rendering
- `highlight.js` (^11.9.0) - Code syntax highlighting

**Existing Services:**
- `OverlayService.ts` - Base for diagram overlay
- `ImageStorageService.ts` - Image persistence
- `BookService.ts` - Configuration storage

**Existing Components:**
- `SceneEditor.tsx` - Main integration point
- `PanelConfigDialog.tsx` - Pattern for diagram config UI

---

## Success Criteria

✅ **Must Have:**
- [ ] Mermaid diagrams render and overlay correctly
- [ ] Math equations render correctly
- [ ] Code blocks render with syntax highlighting
- [ ] Configuration persists across sessions
- [ ] Backward compatibility maintained
- [ ] Export includes diagram overlays

🎯 **Nice to Have:**
- [ ] Live preview of diagrams
- [ ] Diagram templates
- [ ] Visual diagram editor
- [ ] Caching for performance

---

## Notes

- Follow existing text overlay pattern closely
- Keep prototype class independent for testing
- Prioritize Mermaid support first (most versatile)
- Math and code can be added incrementally
- Consider performance with complex diagrams

---

## Validation Checklist

Before marking complete:
- [ ] All phases completed
- [ ] All tests passing
- [ ] Documentation complete
- [ ] No regressions in existing features
- [ ] Performance acceptable (< 2s for typical diagrams)
- [ ] User feedback positive

