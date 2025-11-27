# Character Audition Save Bug Fix

**Date:** November 27, 2025  
**Issue:** Character auditions disappearing in second book (book-level characters)  
**Status:** ✅ FIXED

---

## 🐛 Problem Summary

Character auditions (generated images) were disappearing for **book-level characters** but working fine for **story-level characters**. This was caused by duplicate/out-of-sync code between the two CastManager components.

---

## 🔍 Root Cause

The codebase has TWO CastManager components:

1. **`CastManager.tsx`** - Manages story-level characters
2. **`BookCastManager.tsx`** - Manages book-level characters (added when book-level character feature was implemented)

Both components use the same `CharacterAuditionDialog`, but they had **different implementations** for saving character auditions:

### CastManager.tsx (Story-level) ✅ WORKED

```typescript
const handleAuditionUpdate = async () => {
  // 1. Load the book from cache
  const book = await BookService.getActiveBook();
  const bookStory = book.stories.find(s => s.id === story.id);
  const char = bookStory.characters.find(c => c.name === auditionCharacter.name);
  
  // 2. Update character metadata
  char.imageGallery = auditionCharacter.imageGallery;
  char.selectedImageId = auditionCharacter.selectedImageId;
  
  // 3. ✅ SAVE THE BOOK
  await BookService.saveBook(book);
  
  // 4. Reload and refresh UI
  const updatedBook = await BookService.getActiveBook();
  setCharacters(updatedStory.characters);
  onStoryUpdate();
}
```

### BookCastManager.tsx (Book-level) ❌ BROKEN

```typescript
const handleAuditionUpdate = async () => {
  // ❌ DOES NOT SAVE THE BOOK
  // Just calls parent callback
  onBookUpdate();
}
```

The comment in BookCastManager claimed:
> "The character images are already saved to filesystem by CharacterAuditionDialog. We just need to trigger a refresh in the parent component."

**This was incorrect!**

- ✅ True: Image FILES are saved to filesystem cache (IndexedDB)
- ❌ False: Character METADATA (imageGallery array, selectedImageId) is NOT saved automatically
- ❌ Result: Character audition metadata was lost on refresh/app reload

---

## ✅ Solution

Updated `BookCastManager.tsx` to properly save the book after character auditions are updated:

```typescript
const handleAuditionUpdate = async () => {
  if (!book || !auditionCharacter) return;
  
  try {
    // 1. Find the character in the book
    const char = book.characters.find(c => c.name === auditionCharacter.name);
    
    if (char) {
      // 2. Update character metadata
      char.imageGallery = auditionCharacter.imageGallery;
      char.selectedImageId = auditionCharacter.selectedImageId;
    }
    
    // 3. ✅ SAVE THE BOOK (THIS WAS MISSING!)
    await BookService.saveBook(book);
    
    // 4. Reload characters from saved book
    const updatedBook = await BookService.getActiveBook();
    setCharacters(updatedBook.characters);
    
    // 5. Notify parent to refresh
    onBookUpdate();
  } catch (err) {
    console.error('Failed to save character image changes:', err);
  }
}
```

---

## 📊 Code Comparison

### Before (Out of Sync)

| Component | Save Logic | Status |
|-----------|-----------|---------|
| **CastManager** | Full save + reload flow | ✅ Works |
| **BookCastManager** | Only calls `onBookUpdate()` | ❌ Broken |

### After (Synchronized)

| Component | Save Logic | Status |
|-----------|-----------|---------|
| **CastManager** | Full save + reload flow | ✅ Works |
| **BookCastManager** | Full save + reload flow | ✅ Works |

Both components now follow the **same save pattern**:
1. Find character in book/story
2. Update character metadata
3. **Save book to cache** ← KEY FIX
4. Reload from cache
5. Refresh UI

---

## 🧪 Testing

### Before Fix
1. ❌ Generate character audition for book-level character
2. ❌ Close and reopen dialog → Images disappear
3. ❌ Refresh browser → Images disappear
4. ❌ Character metadata not persisted

### After Fix
1. ✅ Generate character audition for book-level character
2. ✅ Close and reopen dialog → Images persist
3. ✅ Refresh browser → Images persist
4. ✅ Character metadata properly saved to cache

---

## 🔄 Data Flow

### Character Audition Data Persistence

```
User Action: Generate Character Image
    ↓
CharacterAuditionDialog
    ├─ Generates image via ImageGenerationService
    ├─ Stores image blob in filesystem (IndexedDB)
    ├─ Updates character.imageGallery array (metadata)
    ├─ Updates character.selectedImageId
    └─ Calls onUpdate() callback
        ↓
BookCastManager.handleAuditionUpdate() / CastManager.handleAuditionUpdate()
    ├─ Finds character in book/story
    ├─ Copies metadata from auditionCharacter to book character
    ├─ 🔑 Saves book to filesystem cache (JSON)
    ├─ Reloads book from cache
    └─ Refreshes UI
        ↓
✅ Character auditions persisted across sessions
```

---

## 📝 Files Changed

- **`src/components/BookCastManager.tsx`** - Fixed `handleAuditionUpdate()` to save book

---

## 🎯 Key Takeaways

1. **Character Image Storage is Two-Part:**
   - Image blobs → IndexedDB (handled by CharacterAuditionDialog)
   - Character metadata → Book cache JSON (must be handled by CastManager)

2. **Always Save After Metadata Changes:**
   - Modifying `character.imageGallery` or `character.selectedImageId` requires saving the book
   - Don't assume parent callbacks will handle this

3. **Keep Duplicate Code in Sync:**
   - CastManager and BookCastManager should follow the same save pattern
   - Consider refactoring shared logic into a common service/hook

4. **Test Both Story-Level and Book-Level Characters:**
   - Different code paths can have different bugs
   - Always test both when adding features

---

## 🔮 Future Improvements

1. **Refactor Shared Logic:**
   - Extract common save logic into a hook or utility function
   - Reduce code duplication between CastManager and BookCastManager

2. **Add Unit Tests:**
   - Test character audition save flow for both story-level and book-level
   - Test metadata persistence across sessions

3. **Add Validation:**
   - Warn user if save fails
   - Retry mechanism for save failures

---

**Status:** ✅ Fixed and verified  
**Commit:** (pending)

