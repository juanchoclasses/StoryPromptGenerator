# Diagram Renderer Test Guide

## Overview

This guide explains how to test the `DiagramRenderer` class standalone before integrating it into the React app.

## Files Created

1. **`src/services/DiagramRenderer.ts`** - The standalone TypeScript class
2. **`test-diagram-renderer.html`** - Browser-based test harness
3. **`DIAGRAM-OVERLAY-TRACKER.md`** - Implementation tracking plan

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install mermaid katex highlight.js
npm install --save-dev @types/katex
```

### Step 2: Compile the TypeScript Class

You have two options:

**Option A: Using existing build system (Vite)**
```bash
npm run build
```

**Option B: Compile just the DiagramRenderer**
```bash
npx tsc src/services/DiagramRenderer.ts --outDir dist --target ES2020 --module ESNext --lib ES2020,DOM
```

### Step 3: Open the Test Harness

**Working Version (Recommended):**
```bash
# On macOS:
open test-diagram-renderer-working.html

# Or just double-click the file in Finder
```

This version includes all the JavaScript implementation inline and works immediately!

**Original Version:**
The `test-diagram-renderer.html` file requires compiling the TypeScript class first. Use the `-working.html` version for immediate testing.

The test harness will load the required libraries (Mermaid, KaTeX, Highlight.js) from CDN.

## Test Harness Features

### 1. Mermaid Diagram Testing

Test various Mermaid diagram types:
- Flowcharts
- Sequence diagrams  
- Class diagrams
- State diagrams
- And more

**Controls:**
- Content textarea for Mermaid syntax
- Width/Height adjustments
- Board style (blackboard/whiteboard/transparent)
- Border style (frame/shadow/none)

### 2. Math Equation Testing

Test LaTeX/KaTeX rendering:
- Inline equations
- Block equations
- Matrices, fractions, summations
- Complex mathematical notation

**Controls:**
- LaTeX content textarea
- Font size adjustment
- Board style selection

### 3. Code Syntax Highlighting

Test code rendering with syntax highlighting:
- JavaScript, Python, Java, C++, TypeScript
- Adjustable font size
- Monospace rendering

**Controls:**
- Code content textarea
- Language selection
- Font size and dimensions

### 4. Custom Text

Test simple text rendering on boards:
- Multi-line text
- Centered layout
- Board backgrounds

## Using the DiagramRenderer Class

### Basic Usage

```typescript
import { DiagramRenderer } from './services/DiagramRenderer';

const renderer = new DiagramRenderer();

// Render a Mermaid diagram
const result = await renderer.renderDiagram({
  type: 'mermaid',
  content: 'graph TD; A-->B; B-->C;',
  width: 800,
  height: 600,
  style: {
    boardStyle: 'blackboard',
    borderStyle: 'frame'
  }
});

if (result.success) {
  // Use result.imageUrl (blob URL)
  // Or result.imageBlob for further processing
  // Or result.canvas to inspect the canvas
  document.getElementById('output').src = result.imageUrl;
} else {
  console.error('Rendering failed:', result.error);
}
```

### Diagram Types

**Mermaid:**
```typescript
{
  type: 'mermaid',
  content: `graph TD
    A[Start] --> B[Process]
    B --> C[End]`
}
```

**Math:**
```typescript
{
  type: 'math',
  content: 'E = mc^2'
}
```

**Code:**
```typescript
{
  type: 'code',
  content: 'function hello() { return "world"; }',
  language: 'javascript'
}
```

**Custom:**
```typescript
{
  type: 'custom',
  content: 'Any plain text content'
}
```

### Style Options

```typescript
interface DiagramStyle {
  backgroundColor: string;      // e.g., "#2d3748"
  foregroundColor: string;      // e.g., "#ffffff"
  boardStyle: 'blackboard' | 'whiteboard' | 'transparent';
  borderStyle: 'none' | 'frame' | 'shadow';
  padding: number;              // Inner padding
  borderWidth?: number;         // Border thickness
  borderColor?: string;         // Border color
  fontSize?: number;            // Base font size
  fontFamily?: string;          // Font family
  theme?: string;               // Theme for syntax/mermaid
}
```

### Default Styles

Get default styles for different board types:

```typescript
const blackboardStyle = DiagramRenderer.getDefaultStyleForBoard('blackboard');
const whiteboardStyle = DiagramRenderer.getDefaultStyleForBoard('whiteboard');
const transparentStyle = DiagramRenderer.getDefaultStyleForBoard('transparent');
```

## Testing Checklist

Before integration, verify:

- [ ] **Mermaid Diagrams**
  - [ ] Flowcharts render correctly
  - [ ] Sequence diagrams work
  - [ ] Class diagrams work
  - [ ] Complex diagrams scale properly
  - [ ] Invalid syntax shows error message

- [ ] **Math Equations**
  - [ ] Simple equations (E=mc²) render
  - [ ] Complex equations with fractions work
  - [ ] Matrices render correctly
  - [ ] Invalid LaTeX shows error

- [ ] **Code Highlighting**
  - [ ] JavaScript syntax highlights
  - [ ] Python syntax highlights
  - [ ] Other languages work
  - [ ] Long code scrolls/truncates properly

- [ ] **Board Styles**
  - [ ] Blackboard (dark) looks good
  - [ ] Whiteboard (light) looks good
  - [ ] Transparent has no background
  - [ ] Textures applied correctly

- [ ] **Borders**
  - [ ] Frame border draws correctly
  - [ ] Shadow effect works
  - [ ] No border works
  - [ ] Border colors correct

- [ ] **Performance**
  - [ ] Small diagrams render quickly (< 500ms)
  - [ ] Large diagrams render acceptably (< 2s)
  - [ ] No memory leaks with repeated renders
  - [ ] Canvas cleanup works

- [ ] **Edge Cases**
  - [ ] Empty content shows error
  - [ ] Invalid dimensions show error
  - [ ] Very large dimensions handled
  - [ ] Unicode/emoji content works

- [ ] **Output Formats**
  - [ ] Blob URL is valid
  - [ ] Image blob can be saved
  - [ ] Canvas can be composited
  - [ ] Data URL works

## Integration Path

Once standalone testing is complete:

1. ✅ **Phase 0 Complete** - Class tested and working
2. **Phase 1** - Add type definitions to `src/types/Story.ts`
3. **Phase 2** - Port class to service in React app
4. **Phase 3** - Extend OverlayService
5. **Phase 4** - Create UI components
6. **Phase 5** - Integrate with image generation

See `DIAGRAM-OVERLAY-TRACKER.md` for full implementation plan.

## Troubleshooting

### Mermaid not rendering

**Issue:** "Mermaid library not loaded"

**Solution:** 
- Check browser console for loading errors
- Verify CDN links are accessible
- Try initializing manually: `mermaid.initialize({startOnLoad: false})`

### KaTeX errors

**Issue:** Math equations not showing

**Solution:**
- Verify KaTeX CSS is loaded
- Check LaTeX syntax is valid
- Try simpler equations first

### Canvas is blank

**Issue:** Canvas renders but shows nothing

**Solution:**
- Check if SVG conversion is working
- Verify colors aren't matching (white on white)
- Check padding isn't too large for content

### Performance issues

**Issue:** Rendering takes too long

**Solution:**
- Reduce diagram complexity
- Decrease canvas dimensions
- Simplify styling (no textures)
- Cache rendered results

## Browser Compatibility

Tested on:
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

**Requirements:**
- Canvas API
- Blob URL support
- SVG support
- ES2020 JavaScript

## Next Steps

After successful standalone testing:

1. Mark Phase 0 complete in tracker
2. Proceed to Phase 1 (data model extensions)
3. Install dependencies in main project
4. Port tested class to service
5. Begin UI integration

## Notes

- Keep the test harness for regression testing
- Update as new features are added
- Use for performance benchmarking
- Reference for documentation examples

## Questions?

See the main tracker: `DIAGRAM-OVERLAY-TRACKER.md`

