# Unified Image Generation Architecture

## Overview

This document describes the unified image generation system that ensures consistent behavior across all image generation flows in the application.

## Single Source of Truth

**File:** `src/services/SceneImageGenerationService.ts`

**Method:** `generateCompleteSceneImage()`

This is the **single source of truth** for generating scene images. Both the SceneEditor (single scene) and StoriesPanel (batch generation) use this same method.

## What It Does

The unified service handles the complete image generation pipeline:

### 1. **Prompt Building**
- Combines book style, background setup, and scene description
- Includes character descriptions with reference image notes
- Includes element descriptions

### 2. **Character Reference Images**
- Loads selected character images from filesystem
- Converts blob URLs to base64 data URLs for API
- Handles both book-level and story-level characters
- Includes reference image instructions in the prompt

### 3. **Base Image Generation**
- Calls OpenRouter API with multi-modal request
- Includes reference images for character consistency
- Uses book's aspect ratio setting

### 4. **Overlay Application** (if `applyOverlays: true`)
- **Text Panels:** Applies rhyming text or scene descriptions at the bottom
- **Diagram Panels:** Applies code, Mermaid, math, or markdown diagrams
- **Smart Style Detection:** Checks both `scene.diagramPanel.style` (legacy) and `story.diagramStyle` (preferred)

## Key Features

### Handles Both Data Formats

The service automatically detects and handles diagram styles from two locations:

1. **Legacy Format** (from import): `scene.diagramPanel.style`
2. **Preferred Format**: `story.diagramStyle`

This ensures backward compatibility while supporting the correct architecture.

### Comprehensive Logging

```
🎨 Generating base image for scene: "Welcome to Decisions"
🖼️  Applying overlays to scene: "Welcome to Decisions"
  - Text panel: YES
  - Diagram panel: YES
✓ Overlays applied successfully
```

### Error Recovery

If overlay application fails, the service:
- Logs the error
- Returns the base image (without overlays)
- Doesn't fail the entire generation

## Usage

### StoriesPanel (Batch Generation)

```typescript
const { SceneImageGenerationService } = await import('../services/SceneImageGenerationService');
const finalImageUrl = await SceneImageGenerationService.generateCompleteSceneImage({
  scene,
  story: batchGenerationStory,
  book: activeBook,
  model: modelName,
  aspectRatio,
  applyOverlays: true
});
```

### SceneEditor (Single Scene)

**TODO:** Update SceneEditor to use this same method (currently still uses manual overlay application).

## Benefits

1. **Consistency:** Both single and batch generation use identical logic
2. **Maintainability:** One place to fix bugs or add features
3. **Flexibility:** Handles multiple data formats (legacy and current)
4. **Robustness:** Comprehensive error handling and logging
5. **Debugging:** Clear console logs show exactly what's happening

## Investigation: Why Panels Weren't Appearing

### Problem

Batch-generated images weren't showing text or diagram panels.

### Root Cause

The "If and If-Else" story was imported with diagram styles embedded at the scene level (`scene.diagramPanel.style`) instead of at the story level (`story.diagramStyle`).

The old batch generation code only checked `story.diagramStyle`, so it failed this condition:
```typescript
if (hasDiagramPanel && batchGenerationStory.diagramStyle) {
  // This was false because diagramStyle wasn't at story level
}
```

### Solution

The new unified service checks **both** locations:
```typescript
private static getDiagramStyle(scene: Scene, story: Story): DiagramStyle | null {
  // Check scene-level first (legacy import format)
  if (scene.diagramPanel && (scene.diagramPanel as any).style) {
    return (scene.diagramPanel as any).style;
  }
  
  // Check story-level (preferred location)
  if (story.diagramStyle) {
    return story.diagramStyle;
  }
  
  return null;
}
```

## Next Steps

1. ✅ **StoriesPanel:** Updated to use `generateCompleteSceneImage()`
2. ⏳ **SceneEditor:** Should be updated to use the same method
3. ⏳ **Data Migration:** Consider migrating old story data to move `diagramPanel.style` to `story.diagramStyle`

## Files Modified

- ✅ `src/services/SceneImageGenerationService.ts` - Added `generateCompleteSceneImage()` method
- ✅ `src/components/StoriesPanel.tsx` - Simplified to use unified service
- ⏳ `src/components/SceneEditor.tsx` - Needs update (future work)

