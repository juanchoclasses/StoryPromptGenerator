# Diagram Overlay Feature - Implementation Tracker

## Overview
Add support for procedural diagrams (Mermaid, LaTeX math, code blocks) that can be rendered onto blackboard/whiteboard images and composited onto scene images in post-processing.

**Pattern**: Follow existing text overlay implementation in `OverlayService.ts`

**Start Date**: 2025-10-30  
**Branch**: `feature/diagram-overlay`  
**Target Completion**: TBD  
**Status**: 🟢 In Progress - Phase 0 Complete

---

## Phase 0: Prototype & Testing ✅ COMPLETE (Committed: 36f4020)

### 0.1 Create Standalone Test Class
- [x] Create `test-diagram-renderer.html` - browser test harness ✅
- [x] Test Mermaid diagram rendering ✅
- [x] Test Math equation rendering with KaTeX ✅
- [x] Test Code syntax highlighting with highlight.js ✅
- [x] Test Markdown rendering with marked.js ✅
- [x] Test blackboard/whiteboard styling ✅
- [x] Validate canvas composition works ✅
- [x] High contrast color schemes for both board styles ✅
- [ ] Create `DiagramRenderer.test.ts` - unit tests (deferred)
- [ ] Install npm dependencies (will do in Phase 2)
- [ ] Performance testing with complex diagrams (test with real usage)

**Acceptance Criteria:**
- ✅ Class works independently of React ✅
- ✅ Can be tested in browser with simple HTML page ✅
- ✅ Mermaid diagrams render correctly ✅
- ✅ Code blocks render correctly ✅
- ✅ Output is valid canvas element ✅

**✅ TESTED & WORKING:** `test-diagram-renderer.html` - fully functional!

**What Works:**
- ✅ Mermaid diagrams (flowcharts, sequence, class diagrams)
- ✅ LaTeX math equations with KaTeX
- ✅ Code syntax highlighting with highlight.js (Python, Java, JavaScript)
- ✅ Markdown text rendering with marked.js
- ✅ Blackboard/whiteboard board styles
- ✅ High contrast colors (bright chalk / dark markers)
- ✅ Canvas rendering for all types
- ✅ HTML preview mode for all types
- ✅ Wooden frame borders
- ✅ Customizable dimensions
- ✅ Example templates for each type

**Test File:** `test-diagram-renderer.html`  
**Libraries Used:** Mermaid 10.x, KaTeX 0.16.9, highlight.js 11.9.0, marked.js 11.0.0, html2canvas 1.4.1

---

## Phase 1: Data Model Extensions ✅ COMPLETE (Committed: 510d087)

### 1.1 Type Definitions (`src/types/Story.ts`) ✅
- [x] Create `DiagramPanel` interface ✅
- [x] Create `DiagramStyle` interface ✅
- [x] Add `diagramPanel?: DiagramPanel` to Scene interface ✅
- [x] Add `diagramStyle?: DiagramStyle` to Story interface ✅
- [x] Create `DiagramType` and `BoardStyle` type definitions ✅
- [x] Create `DEFAULT_DIAGRAM_STYLE` and `WHITEBOARD_DIAGRAM_STYLE` constants ✅
- [x] Export types for use across app ✅

**Files modified:**
- `src/types/Story.ts` ✅

**Testing:**
- [x] TypeScript compilation passes ✅
- [x] Existing code still compiles ✅

---

### 1.2 Scene Model (`src/models/Scene.ts`) ✅
- [x] Add `diagramPanel?: DiagramPanel` property ✅
- [x] Update `SceneExchangeFormat` to include diagramPanel ✅
- [x] Update `toJSON()` to serialize diagramPanel ✅
- [x] Update `toExportJSON()` to export diagramPanel ✅
- [x] Update `fromJSON()` to deserialize diagramPanel ✅
- [x] Update constructor to accept diagramPanel ✅

**Files modified:**
- `src/models/Scene.ts` ✅

**Testing:**
- [x] Scene serialization includes diagram panel ✅
- [x] Scene deserialization works correctly ✅
- [x] Backward compatibility maintained (undefined diagram panels) ✅

---

### 1.3 Story Model (`src/models/Story.ts`) ✅
- [x] Add `diagramStyle?: DiagramStyle` property ✅
- [x] Update `StoryExchangeFormat` to include diagramStyle ✅
- [x] Update `toJSON()` to serialize diagramStyle ✅
- [x] Update `toExportJSON()` to export diagramStyle ✅
- [x] Update `fromJSON()` to deserialize diagramStyle ✅
- [x] Update constructor to accept diagramStyle ✅

**Files modified:**
- `src/models/Story.ts` ✅

**Testing:**
- [x] Story serialization includes diagram style ✅
- [x] Story deserialization works correctly ✅
- [x] Backward compatibility maintained (undefined diagram styles) ✅

**Design Decision:**
- ✅ Diagram style defined at **Story level** (applies to all scenes in story)
- ✅ Diagram content defined at **Scene level** (each scene can have different diagram or none)

---

## Phase 2: Diagram Rendering Service ✅ COMPLETE (Committed: fe9ca10)

### 2.1 Port Prototype to Service (`src/services/DiagramRenderService.ts`) ✅
- [x] Port tested logic from test-diagram-renderer.html ✅
- [x] Adapt for React/browser environment ✅
- [x] Add error handling and logging ✅
- [x] Export service functions ✅
- [x] Initialize libraries on first use ✅
- [ ] Add caching for repeated renders (deferred - optimize later)

**Files created:**
- `src/services/DiagramRenderService.ts` ✅

**Main Functions:**
- `renderDiagramToCanvas()` - Main entry point
- `canvasToDataURL()` - Convert canvas to image URL
- `canvasToImageBitmap()` - Convert for efficient compositing

**Testing:**
- [x] TypeScript compilation passes ✅
- [x] No linter errors ✅
- [ ] Unit tests (will test with real usage)
- [ ] Error cases handled gracefully ✅

---

### 2.2 Mermaid Integration ✅
- [x] Initialize Mermaid library ✅
- [x] Configure Mermaid base theme ✅
- [x] Implement `renderMermaid()` function ✅
- [x] Handle Mermaid syntax errors (try/catch) ✅
- [x] SVG to canvas conversion with html2canvas ✅

**Dependencies:**
- [x] `mermaid` npm package installed ✅

**Supported Diagrams:**
- ✅ Flowcharts
- ✅ Sequence diagrams
- ✅ Class diagrams
- ✅ All Mermaid diagram types

---

### 2.3 Math Rendering (KaTeX) ✅
- [x] Initialize KaTeX library ✅
- [x] Implement `renderMath()` function ✅
- [x] Handle block equations (multi-line support) ✅
- [x] Handle LaTeX syntax errors (throwOnError: false) ✅
- [x] HTML to canvas conversion with html2canvas ✅

**Dependencies:**
- [x] `katex` npm package installed ✅
- [x] `@types/katex` installed ✅

**Features:**
- ✅ Multi-line equation support
- ✅ Proper LaTeX rendering with KaTeX
- ✅ Error fallback to plain text

---

### 2.4 Code Syntax Highlighting ✅
- [x] Initialize highlight.js ✅
- [x] Implement `renderCode()` function ✅
- [x] Support multiple languages (JS, Python, Java, etc.) ✅
- [x] Apply syntax theme colors (blackboard/whiteboard) ✅
- [x] Render to canvas with proper formatting ✅
- [x] Custom chalk colors for blackboard ✅
- [x] Custom marker colors for whiteboard ✅

**Dependencies:**
- [x] `highlight.js` npm package installed ✅

**Supported Languages:**
- ✅ JavaScript, Python, Java
- ✅ All languages supported by highlight.js

**Features:**
- ✅ High contrast colors for readability
- ✅ Board-specific color schemes

---

### 2.5 Markdown Rendering ✅
- [x] Initialize marked.js ✅
- [x] Implement `renderMarkdown()` function ✅
- [x] Parse markdown to HTML ✅
- [x] Style headers, lists, bold, italic ✅
- [x] Render to canvas ✅

**Dependencies:**
- [x] `marked` npm package installed ✅

**Supported Markdown:**
- ✅ Headers (H1, H2, H3)
- ✅ Lists (ordered and unordered)
- ✅ Bold and italic
- ✅ Paragraphs

---

### 2.6 HTML to Canvas Conversion ✅
- [x] `html2canvas` npm package installed ✅
- [x] Used for all diagram types ✅
- [x] High quality rendering (scale: 2) ✅

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

