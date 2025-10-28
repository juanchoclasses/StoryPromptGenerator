# Character Audition Feature - Development Plan

**Version:** 4.1.0  
**Created:** October 28, 2025  
**Status:** 📝 Planning

---

## 🎯 Feature Overview

Enable users to generate, store, and manage visual representations of characters. Selected character images will be automatically included in scene generation prompts to ensure visual consistency across all scenes.

### Key Capabilities

1. **Character Image Generation**
   - Generate character images from character descriptions
   - Include book style and story style in character prompts
   - Request plain white background for easy compositing
   
2. **Character Image Gallery**
   - Store multiple generated images per character
   - View all images in a gallery view
   - Select one image as the "active" character image
   - Delete unwanted images
   - Compare different versions side-by-side

3. **Scene Integration**
   - Selected character image included in scene generation prompts
   - Prompt construction: Book Style → Story Style → Character Images → Scene Description
   - Visual consistency across all scenes featuring the character

---

## 📊 Data Model Changes

### Character Interface Extension

```typescript
// src/models/Story.ts

export interface Character {
  name: string;
  description: string;
  // NEW: Character image gallery
  imageGallery?: CharacterImage[];
  selectedImageId?: string; // ID of the currently selected image
}

export interface CharacterImage {
  id: string; // UUID
  url?: string; // Blob URL (loaded from IndexedDB)
  model: string; // Model used for generation
  prompt: string; // Full prompt used
  timestamp: Date;
  width?: number;
  height?: number;
}
```

### Storage Requirements

- **IndexedDB**: Store character image blobs (similar to scene images)
- **localStorage**: Store character metadata (image IDs, selected image, etc.)
- **Backward Compatibility**: Existing characters without images continue to work

---

## 🎨 UI Changes

### 1. CastManager Enhancement

**Current State:**
```
┌─────────────────────────────────────┐
│ Character Name                   [Edit] [Delete] │
│ Description...                      │
└─────────────────────────────────────┘
```

**New State:**
```
┌─────────────────────────────────────────────────┐
│ Character Name         [🎭 Audition] [Edit] [Delete] │
│ Description...                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Selected Character Image Thumbnail]        │ │
│ │ 3 images in gallery                         │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Interaction Flow:**
1. Click **🎭 Audition** button → Opens Character Audition Dialog
2. Shows selected character image (if any) in accordion
3. Click thumbnail → Opens gallery view

### 2. Character Audition Dialog (NEW Component)

**Component:** `src/components/CharacterAuditionDialog.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ Character Audition: [Character Name]               [X]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Character Description:                                   │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [Character description - read-only or editable?]     │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ Image Generation:                                        │
│ ┌────────────────────────┬────────────────────────────┐  │
│ │ Model: [Dropdown ▼]    │ [Generate Image] 🎨        │  │
│ └────────────────────────┴────────────────────────────┘  │
│                                                          │
│ Character Gallery:                                       │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ┌──────┐ ┌──────┐ ┌──────┐                          │ │
│ │ │ [✓]  │ │      │ │      │  + more                  │ │
│ │ │ Img1 │ │ Img2 │ │ Img3 │                          │ │
│ │ └──────┘ └──────┘ └──────┘                          │ │
│ │ [Select] [Delete] [View Full Size]                  │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│                         [Close]                          │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- Display character description (read-only, edit in main Character Manager)
- Model selector (same models as scene generation)
- Generate button with progress indicator
- Gallery grid showing thumbnails
- Checkmark on selected image
- Select/Delete/View actions per image
- Click image thumbnail → full-size preview dialog

### 3. Character Gallery View Dialog (NEW Component)

**Component:** `src/components/CharacterImageGalleryDialog.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ Character Images: [Character Name]                  [X] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│ │   [✓]   │ │         │ │         │ │         │       │
│ │  Image1 │ │  Image2 │ │  Image3 │ │  Image4 │       │
│ │         │ │         │ │         │ │         │       │
│ │ Select  │ │ Select  │ │ Select  │ │ Select  │       │
│ │ Delete  │ │ Delete  │ │ Delete  │ │ Delete  │       │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                          │
│ Generated: Oct 28, 2025                                  │
│ Model: google/gemini-2.5-flash-image-preview            │
│ Prompt: [View Full Prompt]                              │
│                                                          │
│                         [Close]                          │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- Grid layout (responsive, 2-4 columns)
- Checkmark indicates selected image
- Select button → sets as active character image
- Delete button → removes from gallery
- Click image → full-size preview with metadata
- Show generation metadata (date, model, prompt)

---

## 🔧 Service Changes

### 1. CharacterImageService (NEW)

**File:** `src/services/CharacterImageService.ts`

**Methods:**
```typescript
class CharacterImageService {
  // Generate character image
  static async generateCharacterImage(
    character: Character,
    story: Story,
    book: Book,
    model: string
  ): Promise<CharacterImage>;

  // Store image in IndexedDB
  static async storeCharacterImage(
    characterName: string,
    storyId: string,
    imageId: string,
    blob: Blob
  ): Promise<void>;

  // Load image from IndexedDB
  static async loadCharacterImage(
    characterName: string,
    storyId: string,
    imageId: string
  ): Promise<string | null>; // Returns blob URL

  // Delete character image
  static async deleteCharacterImage(
    characterName: string,
    storyId: string,
    imageId: string
  ): Promise<void>;

  // Load all images for a character
  static async loadCharacterGallery(
    characterName: string,
    storyId: string,
    imageIds: string[]
  ): Promise<Map<string, string>>; // imageId -> blobUrl

  // Set selected character image
  static async setSelectedCharacterImage(
    characterName: string,
    storyId: string,
    imageId: string
  ): Promise<void>;

  // Build character generation prompt
  static buildCharacterPrompt(
    character: Character,
    story: Story,
    book: Book
  ): string;
}
```

**Prompt Construction:**
```typescript
static buildCharacterPrompt(character: Character, story: Story, book: Book): string {
  return `
${formatBookStyleForPrompt(book.style)}

Story Context:
${story.backgroundSetup}

Character to Generate:
Name: ${character.name}
Description: ${character.description}

IMPORTANT: Generate this character on a plain white background.
The character should be clearly visible and well-lit against the white background.
Focus on capturing the character's unique features and personality as described.
`.trim();
}
```

### 2. ImageStorageService Enhancement

**File:** `src/services/ImageStorageService.ts`

**New Methods:**
```typescript
// Add methods for character images
static async storeCharacterImage(
  characterKey: string, // e.g., "story-id:character-name"
  imageId: string,
  blob: Blob
): Promise<void>;

static async getCharacterImage(
  characterKey: string,
  imageId: string
): Promise<Blob | null>;

static async deleteCharacterImage(
  characterKey: string,
  imageId: string
): Promise<void>;

static async getAllCharacterImages(
  characterKey: string
): Promise<Map<string, Blob>>;
```

**IndexedDB Structure:**
```
Store: character-images
Key: `${storyId}:${characterName}:${imageId}`
Value: { blob: Blob, timestamp: Date }
```

### 3. SceneEditor Prompt Enhancement

**File:** `src/components/SceneEditor.tsx`

**Modified:** `generatePrompt()` method

**New Prompt Structure:**
```
[Book Style]

[Book Background Setup]

[Story Background Setup]

Characters in this scene:
1. [Character Name]
   Description: [Character Description]
   Reference Image: [Include base64 or URL if selected]

2. [Character Name 2]
   ...

Elements in this scene:
- [Element 1]: [Description]
- [Element 2]: [Description]

Scene Description:
[Scene Description]

[Text Panel Content if any]
```

**Open Question:** How to include character images in prompt?
- **Option A:** Base64 encode and include inline (may be large)
- **Option B:** URL reference (if API supports)
- **Option C:** Text description only + "match reference image style"
- **Option D:** Multi-modal prompt with image attachments (if API supports)

**Recommendation:** Start with Option C (text + reference note), evaluate based on results.

---

## 🏗️ Implementation Phases

### Phase 1: Data Model & Storage (2 hours)

**Tasks:**
- [x] Extend `Character` interface with `imageGallery` and `selectedImageId`
- [x] Create `CharacterImage` interface
- [x] Extend `ImageStorageService` with character image methods
- [x] Add IndexedDB store for character images
- [x] Update `BookService` to handle character image metadata
- [x] Write unit tests for storage layer

**Deliverables:**
- Updated type definitions
- Character image storage working in IndexedDB
- Backward compatibility maintained (existing characters work)

### Phase 2: CharacterImageService (1.5 hours)

**Tasks:**
- [x] Create `CharacterImageService.ts`
- [x] Implement `buildCharacterPrompt()` with book + story context
- [x] Implement `generateCharacterImage()` using `ImageGenerationService`
- [x] Implement storage/retrieval methods
- [x] Add "plain white background" requirement to prompt
- [x] Write unit tests

**Deliverables:**
- Character image generation working
- Prompt includes book style, story context, white background request
- Images stored in IndexedDB

### Phase 3: Character Audition Dialog UI (3 hours)

**Tasks:**
- [x] Create `CharacterAuditionDialog.tsx`
- [x] Design layout (description, model selector, generate button, gallery)
- [x] Integrate model selector (reuse from SceneEditor)
- [x] Implement generate button with progress indicator
- [x] Show character description (read-only)
- [x] Display gallery grid with thumbnails
- [x] Implement select/delete actions
- [x] Handle loading states and errors
- [x] Add image preview on click

**Deliverables:**
- Functional character audition dialog
- Can generate and view character images
- Can select/delete images

### Phase 4: Character Gallery Dialog UI (1.5 hours)

**Tasks:**
- [x] Create `CharacterImageGalleryDialog.tsx`
- [x] Grid layout with responsive columns
- [x] Show selected image indicator (checkmark)
- [x] Implement select action → updates character's selectedImageId
- [x] Implement delete action → removes from gallery
- [x] Show image metadata (date, model, prompt)
- [x] Full-size preview on click
- [x] Handle empty gallery state

**Deliverables:**
- Gallery view dialog working
- Can select/delete images
- Metadata visible

### Phase 5: CastManager Integration (1 hour)

**Tasks:**
- [x] Add "🎭 Audition" button to each character accordion
- [x] Show selected character image thumbnail (if any)
- [x] Show image count ("3 images in gallery")
- [x] Click thumbnail → opens gallery dialog
- [x] Click "🎭 Audition" → opens audition dialog
- [x] Update UI after image selection
- [x] Handle character without images gracefully

**Deliverables:**
- CastManager shows character images
- Easy access to audition and gallery dialogs
- Visual feedback for selected images

### Phase 6: Scene Prompt Integration (2 hours)

**Tasks:**
- [x] Update `SceneEditor.generatePrompt()` to include character images
- [x] Load selected character images for scene
- [x] Format character section with image references
- [x] Handle characters without images gracefully
- [x] Test prompt generation with/without character images
- [x] Evaluate different image inclusion strategies (base64 vs text reference)
- [x] Add option to toggle character image inclusion

**Deliverables:**
- Scene prompts include character image information
- Visual consistency improves across generated scenes
- Prompt remains readable and effective

### Phase 7: Testing & Polish (1.5 hours)

**Tasks:**
- [x] Integration testing: Generate character → Select → Use in scene
- [x] Test with multiple characters per scene
- [x] Test gallery management (add/delete/select)
- [x] Test backward compatibility (characters without images)
- [x] Test storage limits (large galleries)
- [x] Error handling and user feedback
- [x] Polish UI/UX (loading states, animations, tooltips)
- [x] Update documentation

**Deliverables:**
- Feature fully tested and working
- No regressions in existing functionality
- User documentation updated

---

## 📋 Technical Considerations

### 1. Image Inclusion Strategy

**Challenge:** How to include character images in scene generation prompts?

**Options:**

**A. Text Reference Only (Simplest)**
```
Character: Alice
Description: Young girl, blonde hair, blue dress
Reference: A previously generated image exists showing this character
```
- ✅ Pros: Simple, no API changes, works with all models
- ❌ Cons: May not provide visual consistency

**B. Base64 Inline (Medium Complexity)**
```
Character: Alice
Description: Young girl, blonde hair, blue dress
Reference Image: data:image/png;base64,[...]
```
- ✅ Pros: Image directly available to model
- ❌ Cons: Very large prompts, token limits, not all APIs support

**C. Multi-Modal Prompt (Complex)**
```typescript
{
  messages: [
    { role: 'user', content: [
      { type: 'text', text: 'Character: Alice...' },
      { type: 'image_url', image_url: { url: 'data:...' } }
    ]}
  ]
}
```
- ✅ Pros: Proper multi-modal support, image + text
- ❌ Cons: Requires API support, more complex implementation

**Recommendation:**
- **Start with Option A** (text reference)
- **Add Option C** if visual consistency issues arise
- Make it configurable in settings

### 2. Storage Management

**Considerations:**
- IndexedDB has ~50MB default quota (browser-dependent)
- Character images on white background may compress well (PNG)
- Estimate: ~500KB per character image
- Max ~100 character images per browser before quota issues

**Strategies:**
- Limit gallery to 10 images per character (configurable)
- Add "Clear Old Images" button
- Show storage usage in settings
- Compress images before storing

### 3. Prompt Token Limits

**Consideration:** Adding character images/descriptions may increase prompt length

**Mitigation:**
- Only include characters actually in the scene
- Summarize character descriptions if very long
- Make character image inclusion optional
- Monitor prompt length and warn user

### 4. Performance

**Considerations:**
- Loading multiple character images from IndexedDB
- Rendering gallery with many images
- Generating thumbnails

**Optimizations:**
- Lazy load images in gallery
- Generate and cache thumbnails
- Use `IntersectionObserver` for gallery scrolling
- Debounce gallery updates

---

## 🧪 Testing Plan

### Unit Tests
- [ ] `CharacterImageService.buildCharacterPrompt()` - correct format
- [ ] `CharacterImageService.generateCharacterImage()` - API call
- [ ] `ImageStorageService` character image methods - CRUD operations
- [ ] Character image gallery - add/delete/select logic

### Integration Tests
- [ ] Generate character image → appears in gallery
- [ ] Select character image → updates character metadata
- [ ] Delete character image → removes from storage and UI
- [ ] Scene generation includes selected character images
- [ ] Multiple characters with images in single scene

### Manual Testing
- [ ] UI responsiveness on different screen sizes
- [ ] Loading states and error messages
- [ ] Image quality on white background
- [ ] Visual consistency in scenes with character images
- [ ] Storage quota handling
- [ ] Backward compatibility with existing characters

### Performance Tests
- [ ] Gallery with 10+ images loads quickly
- [ ] IndexedDB operations don't block UI
- [ ] Scene prompt generation time with character images
- [ ] Memory usage with multiple character images loaded

---

## 📈 Success Metrics

- ✅ Can generate character images from character descriptions
- ✅ Gallery stores and displays multiple images per character
- ✅ Selected character image persists across sessions
- ✅ Scene prompts include character image context
- ✅ Visual consistency improves in generated scenes
- ✅ No performance degradation in existing features
- ✅ Backward compatible with existing characters
- ✅ User feedback: "Character images improve scene quality"

---

## 🔮 Future Enhancements (v4.2+)

- **Character Pose Library:** Store multiple poses of same character
- **Character Comparison:** Side-by-side comparison of character variations
- **Batch Character Generation:** Generate all characters at once
- **Character Import/Export:** Share character images between books
- **AI Character Refinement:** Iteratively refine character appearance
- **Character Style Transfer:** Apply book style to imported character images
- **Character Animation:** Simple animations or expressions
- **Character Relationships:** Visual groupings of related characters

---

## ⏱️ Estimated Time

| Phase | Estimated | Priority |
|-------|-----------|----------|
| Phase 1: Data Model & Storage | 2h | High |
| Phase 2: CharacterImageService | 1.5h | High |
| Phase 3: Character Audition Dialog | 3h | High |
| Phase 4: Character Gallery Dialog | 1.5h | High |
| Phase 5: CastManager Integration | 1h | High |
| Phase 6: Scene Prompt Integration | 2h | Medium |
| Phase 7: Testing & Polish | 1.5h | High |
| **TOTAL** | **12.5 hours** | |

**Target Completion:** 1.5 - 2 days

---

## 🚦 Risk Assessment

### High Risk
- **API Token Limits:** Including images in prompts may hit token limits
  - *Mitigation:* Make character image inclusion optional, start with text-only

### Medium Risk
- **Storage Quota:** Too many character images may exceed browser storage
  - *Mitigation:* Limit gallery size, add cleanup tools

- **Visual Consistency:** Character images may not improve scene quality
  - *Mitigation:* A/B test, make it optional, gather user feedback

### Low Risk
- **Performance:** Gallery rendering may be slow with many images
  - *Mitigation:* Lazy loading, thumbnails, virtualization

- **Backward Compatibility:** Existing characters without images
  - *Mitigation:* Graceful degradation, optional feature

---

## ✅ Definition of Done

- [ ] All 7 phases completed
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] No linter errors
- [ ] No performance regressions
- [ ] Backward compatibility verified
- [ ] User feedback collected (if possible)
- [ ] Code reviewed and committed

---

## 📝 Open Questions

1. **Should character description be editable in Audition dialog?**
   - Option A: Read-only, edit in main Character Manager
   - Option B: Editable, changes save back to character
   - **Recommendation:** Read-only to avoid confusion

2. **How to handle characters in multiple stories?**
   - Character images are story-scoped (each story has its own)
   - Or character images are book-scoped (shared across stories)
   - **Recommendation:** Story-scoped (allows different styles per story)

3. **Should we include character images by default in scene prompts?**
   - Option A: Always include if available
   - Option B: User toggle per scene
   - Option C: User toggle in settings (global)
   - **Recommendation:** Option C (global setting, defaults to ON)

4. **What happens when character is renamed?**
   - Option A: Lose all images (hard)
   - Option B: Ask user to confirm image transfer (medium)
   - Option C: Automatically transfer images (easy, may have bugs)
   - **Recommendation:** Option B (safer, clear to user)

5. **Image format and size for character images?**
   - Format: PNG (transparency) or JPEG (smaller)
   - Size: 512x512, 1024x1024, or flexible?
   - **Recommendation:** Same as scene images (model-dependent), prefer PNG

---

## 📚 References

- Story Model: `src/models/Story.ts`
- Image Storage: `src/services/ImageStorageService.ts`
- Scene Editor: `src/components/SceneEditor.tsx`
- Cast Manager: `src/components/CastManager.tsx`
- Image Generation: `src/services/ImageGenerationService.ts`

---

**Created:** October 28, 2025  
**Last Updated:** October 28, 2025  
**Version:** 1.0  
**Status:** Ready for Review 📋

