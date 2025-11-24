# Hierarchical Layout System Implementation Plan

## Overview
Implement a 3-tier layout inheritance system: Book → Story → Scene

## Current State
- Only scenes have layout configuration (`scene.layout`)
- No layout inheritance or defaults

## Target State
- **Book**: Can have a default layout (`book.defaultLayout`)
- **Story**: Can have a story-specific layout (`story.layout`)
- **Scene**: Can have a scene-specific layout (`scene.layout`)

## Inheritance Rules
1. **Scene layout** takes highest priority (if defined)
2. **Story layout** takes second priority (if scene layout not defined)
3. **Book default layout** is fallback (if neither scene nor story layout defined)
4. If none defined, use system default (overlay with full-screen image)

## Data Structure Changes

### 1. Update `Book` interface (src/types/Book.ts)
```typescript
export interface Book {
  id: string;
  title: string;
  description?: string;
  backgroundSetup?: string;
  aspectRatio?: string;
  panelConfig?: PanelConfig;
  defaultLayout?: SceneLayout; // NEW: Default layout for all scenes in this book
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Update `Story` interface (src/types/Story.ts)
```typescript
export interface Story {
  id: string;
  title: string;
  description?: string;
  backgroundSetup: string;
  diagramStyle?: DiagramStyle;
  layout?: SceneLayout; // NEW: Default layout for all scenes in this story
  characters: Character[];
  elements: StoryElement[];
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Scene interface remains unchanged
```typescript
export interface Scene {
  // ... existing fields
  layout?: SceneLayout; // EXISTING: Scene-specific layout
  // ...
}
```

## Implementation Tasks

### Phase 1: Data Structure Updates
- [x] Update `Book` interface to include `defaultLayout`
- [x] Update `Story` interface to include `layout`
- [x] Update serialization/deserialization in `BookCache`
- [x] Update serialization in `BookService`

### Phase 2: Layout Resolution Logic
- [ ] Create `LayoutResolver` service with `resolveLayout(scene, story, book)` method
- [ ] Implement inheritance chain: scene → story → book → system default
- [ ] Add logging for layout resolution debugging

### Phase 3: UI Updates
- [ ] Add "Edit Default Layout" button to Book settings
- [ ] Add "Edit Story Layout" button to Story panel
- [ ] Update Scene layout editor to show inheritance info
- [ ] Add visual indicator showing which level layout is coming from

### Phase 4: Service Updates
- [ ] Update `SceneImageGenerationService` to use `LayoutResolver`
- [ ] Update layout editor to support editing at all three levels
- [ ] Update test layout preview to use resolved layout

### Phase 5: Testing
- [ ] Unit tests for `LayoutResolver` inheritance logic
- [ ] Unit tests for Book serialization with `defaultLayout`
- [ ] Unit tests for Story serialization with `layout`
- [ ] Integration tests for layout resolution chain
- [ ] Test backward compatibility (books/stories without layouts)

## Backward Compatibility
- Books without `defaultLayout` → no change in behavior
- Stories without `layout` → no change in behavior
- Scenes without `layout` → fall back to story or book layout
- Existing data continues to work without migration

## Testing Strategy
1. **Unit Tests**: Test each inheritance level independently
2. **Integration Tests**: Test full inheritance chain
3. **Regression Tests**: Ensure existing scenes still work
4. **Edge Cases**: Test with missing/undefined layouts at various levels

## Benefits
1. ✅ Set default layout once at book level
2. ✅ Override for specific stories
3. ✅ Override for specific scenes
4. ✅ Consistent layouts across similar content
5. ✅ Less repetitive configuration
6. ✅ Easier to maintain visual consistency

