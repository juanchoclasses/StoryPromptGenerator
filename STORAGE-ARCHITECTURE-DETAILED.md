# Storage Architecture - Detailed Technical Documentation

**Created:** November 27, 2025  
**Status:** ✅ Complete  
**Version:** 5.0

---

## Overview

The Story Prompter uses a **multi-layer storage architecture** with in-memory caching and filesystem persistence. This document provides detailed technical information about how data flows through the system.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│         (Components: SceneEditor, CastManager, etc.)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│   (BookService, ImageStorageService, StorageService)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ↓                         ↓
┌──────────────────┐      ┌──────────────────┐
│   CACHE LAYER    │      │   CACHE LAYER    │
│   BookCache      │      │   ImageCache     │
│   (In-Memory)    │      │   (In-Memory)    │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         └────────────┬────────────┘
                      ↓
         ┌─────────────────────────┐
         │   FILESYSTEM LAYER      │
         │  FileSystemService      │
         └─────────┬───────────────┘
                   │
                   ↓
    ┌──────────────────────────────┐
    │  PHYSICAL STORAGE            │
    │  ~/Documents/AI-Books/cache/ │
    │  prompter-cache/             │
    └──────────────────────────────┘
```

---

## Layer Details

### 1. Application Layer

**Components:**
- SceneEditor, CastManager, BookCastManager, StoriesPanel
- React components that interact with services

**Responsibilities:**
- User interaction
- UI rendering
- Calling service APIs
- No direct storage access

### 2. Service Layer

#### BookService
**File:** `src/services/BookService.ts` (622 lines)  
**Tests:** ✅ 28 tests (100% passing)

**API:**
```typescript
class BookService {
  // CRUD Operations
  static async getAllBooks(): Promise<Book[]>
  static async getBook(bookId: string): Promise<Book | null>
  static async createBook(title: string, description?: string): Promise<Book>
  static async saveBook(book: Book): Promise<void>
  static async deleteBook(bookId: string): Promise<void>
  
  // Active Book Management
  static async getActiveBookId(): Promise<string | null>
  static async getActiveBook(): Promise<Book | null>
  static async setActiveBook(bookId: string | null): Promise<void>
  
  // Character Operations
  static async promoteCharacterToBook(bookId: string, storyId: string, characterName: string)
  static async demoteCharacterToStory(bookId: string, characterName: string)
  static getCharacterUsageInBook(book: Book, characterName: string)
}
```

**Data Flow:**
```
User Action (e.g., "Save Book")
    ↓
BookService.saveBook(book)
    ↓
StorageService.saveBook(book)
    ↓
BookCache.set(book)
    ├─ Update in-memory cache
    └─ FileSystemService.writeJSON(bookId, bookData)
        └─ Write to: ~/Documents/.../books/{bookId}.json
```

#### ImageStorageService
**File:** `src/services/ImageStorageService.ts` (422 lines)  
**Tests:** ✅ 27 tests (100% passing)

**API:**
```typescript
class ImageStorageService {
  // Scene Images
  async storeImage(imageId: string, sceneId: string, imageUrl: string, modelName: string)
  async getImage(imageId: string): Promise<string | null>
  async deleteImage(imageId: string): Promise<void>
  
  // Character Images
  async storeCharacterImage(storyId: string, characterName: string, imageId: string, imageUrl: string, modelName: string)
  async getCharacterImage(storyId: string, characterName: string, imageId: string): Promise<string | null>
  async deleteCharacterImage(storyId: string, characterName: string, imageId: string): Promise<void>
  
  // Cache Management
  getCacheStats(): { size: number, hits: number, misses: number, hitRate: number }
  async clearAll(): Promise<void>
}
```

**Caching Strategy:**
```
getImage(imageId)
    ↓
1. Check ImageCache (in-memory)
    ├─ HIT → Return blob URL (instant)
    └─ MISS ↓
2. Load from FileSystemService
    ├─ FOUND → Cache + Return
    └─ NOT FOUND → Return null
```

#### StorageService
**File:** `src/services/StorageService.ts` (347 lines)  
**Tests:** ✅ Tests exist

**Purpose:** Legacy wrapper around BookCache, maintained for backward compatibility.

**API:**
```typescript
class StorageService {
  static async load(): Promise<AppData>
  static async save(data: AppData): Promise<void>
  static async getBook(bookId: string): Promise<Book | null>
  static async getAllBooks(): Promise<Book[]>
  static async saveBook(book: Book): Promise<void>
  static async deleteBook(bookId: string): Promise<void>
  static async getActiveBook(): Promise<Book | null>
  static async setActiveBook(bookId: string | null): Promise<void>
}
```

### 3. Cache Layer

#### BookCache
**File:** `src/services/BookCache.ts` (345 lines)  
**Tests:** ✅ Tests exist

**Purpose:** In-memory cache for all books with automatic filesystem synchronization.

**Features:**
- Lazy loading (loads on first access)
- Automatic deserialization (JSON → Book instances)
- Immediate persistence to filesystem
- Active book tracking

**Data Structure:**
```typescript
class BookCache {
  private cache: Map<string, Book>
  private activeBookId: string | null
  private loaded: boolean
  private loadingPromise: Promise<void> | null
  
  async loadAll(): Promise<void>
  get(bookId: string): Book | null
  getAll(): Book[]
  async set(book: Book): Promise<void>
  async delete(bookId: string): Promise<void>
  getActiveBookId(): string | null
  async setActiveBookId(bookId: string | null): Promise<void>
  async clear(): Promise<void>
}
```

**Load Flow:**
```
bookCache.loadAll()
    ↓
1. Check if already loaded
    └─ YES → Return immediately
    └─ NO ↓
2. Load from FileSystemService.loadAllBooksMetadata()
    ↓
3. Deserialize each book (JSON → Book instance)
    ├─ Parse JSON
    ├─ Reconstruct Story instances
    ├─ Reconstruct Scene instances
    └─ Convert date strings to Date objects
    ↓
4. Store in Map<bookId, Book>
    ↓
5. Mark as loaded
```

#### ImageCache
**File:** `src/services/ImageCache.ts` (234 lines)  
**Tests:** ✅ Tests exist (3 minor failures)

**Purpose:** LRU cache for image blob URLs.

**Features:**
- LRU eviction policy
- Automatic blob URL management
- Statistics tracking (hits/misses)
- Prune invalid entries

**Data Structure:**
```typescript
class ImageCache {
  private cache: Map<string, string>  // imageId → blobUrl
  private stats: { hits: number, misses: number }
  
  get(imageId: string): string | null
  set(imageId: string, blobUrl: string): void
  remove(imageId: string): void
  clear(): void
  getStats(): CacheStats
  async prune(): Promise<number>
}
```

**Cache Keys:**
- Scene images: `{imageId}`
- Character images: `{storyId}:{characterName}:{imageId}`

### 4. Filesystem Layer

#### FileSystemService
**File:** `src/services/FileSystemService.ts` (920 lines)  
**Tests:** ⏳ TODO (Sprint 1)

**Purpose:** Abstraction over File System Access API (browser) or Electron fs module.

**Platform Detection:**
```typescript
static isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

static isSupported(): boolean {
  if (isElectron()) return true;
  return typeof window !== 'undefined' && 
         'showDirectoryPicker' in window;
}
```

**API:**
```typescript
class FileSystemService {
  // Configuration
  static async isConfigured(): Promise<boolean>
  static async selectDirectory(): Promise<boolean>
  static async reconnectDirectory(): Promise<boolean>
  
  // Book Operations
  static async loadAllBooksMetadata(): Promise<Map<string, string>>
  static async writeJSON(filename: string, data: any): Promise<void>
  static async readJSON(filename: string): Promise<any | null>
  static async deleteBookMetadata(bookId: string): Promise<void>
  
  // Image Operations
  static async saveImageById(imageId: string, imageUrl: string, metadata?: any)
  static async loadImageById(imageId: string): Promise<string | null>
  static async deleteImageById(imageId: string): Promise<boolean>
  
  // App Metadata
  static async loadAppMetadata(): Promise<any | null>
  static async saveAppMetadata(metadata: any): Promise<void>
}
```

**Directory Structure:**
```
~/Documents/AI-Books/cache/prompter-cache/
├── app-metadata.json           # Active book ID, settings
├── books/                      # Book metadata
│   ├── {bookId1}.json         # Book with stories, characters
│   ├── {bookId2}.json
│   └── ...
└── images/                     # Image files
    ├── {imageId1}.png         # Scene or character image
    ├── {imageId2}.png
    └── ...
```

---

## Data Flow Examples

### Example 1: Creating a New Book

```
1. User clicks "Create Book" in UI
    ↓
2. Component calls: await BookService.createBook('My Book', 'Description')
    ↓
3. BookService creates Book instance
    book = new Book({ title: 'My Book', description: 'Description' })
    book.validate() // Throws if invalid
    ↓
4. BookService calls: await StorageService.saveBook(book)
    ↓
5. StorageService calls: await BookCache.set(book)
    ↓
6. BookCache updates in-memory cache
    cache.set(book.id, book)
    ↓
7. BookCache calls: await FileSystemService.writeJSON(book.id, bookData)
    ↓
8. FileSystemService writes to:
    ~/Documents/.../books/{book.id}.json
    ↓
9. BookService returns Book instance to component
    ↓
10. Component updates UI
```

### Example 2: Generating a Character Image

```
1. User clicks "Generate" in Character Audition Dialog
    ↓
2. Dialog calls: CharacterImageService.generateCharacterImage(...)
    ↓
3. CharacterImageService builds prompt
    - Includes book style
    - Includes story background
    - Includes character description
    ↓
4. Calls ImageGenerationService.generateImage({ prompt, model })
    ↓
5. API returns image URL (data: or blob:)
    ↓
6. CharacterImageService calls: 
   ImageStorageService.storeCharacterImage(storyId, characterName, imageId, imageUrl, model)
    ↓
7. ImageStorageService calls:
   FileSystemService.saveImageById(imageId, imageUrl, { characterName, model })
    ↓
8. FileSystemService:
   a. Converts data URL to Blob
   b. Writes to ~/Documents/.../images/{imageId}.png
   c. Returns success
    ↓
9. CharacterImageService updates character.imageGallery
    character.imageGallery.push({ id: imageId, model, prompt, timestamp })
    ↓
10. Dialog calls onUpdate() callback
    ↓
11. BookCastManager.handleAuditionUpdate():
    a. Updates character in book
    b. Calls BookService.saveBook(book)
    c. Reloads UI
    ↓
12. Character image now persisted and visible in gallery
```

### Example 3: Loading a Book on App Start

```
1. App.tsx useEffect() runs
    ↓
2. Calls: const book = await BookService.getActiveBook()
    ↓
3. BookService calls: StorageService.getActiveBook()
    ↓
4. StorageService calls: await bookCache.loadAll()
    ↓
5. BookCache checks if already loaded
    - If YES: Return immediately
    - If NO: Continue ↓
    ↓
6. BookCache calls: FileSystemService.loadAllBooksMetadata()
    ↓
7. FileSystemService:
    a. Lists files in ~/Documents/.../books/
    b. Reads each {bookId}.json
    c. Returns Map<bookId, jsonString>
    ↓
8. BookCache deserializes each book:
    for (const [bookId, jsonString] of books) {
      const bookData = JSON.parse(jsonString)
      const book = await deserializeBook(bookData)
      cache.set(bookId, book)
    }
    ↓
9. BookCache loads activeBookId from app-metadata.json
    ↓
10. BookCache returns active book
    ↓
11. App.tsx displays book content
```

---

## Serialization & Deserialization

### Book Serialization

**To JSON (Storage):**
```typescript
book.toJSON() → {
  id: string,
  title: string,
  description?: string,
  aspectRatio?: string,
  style: BookStyle,
  defaultLayout?: SceneLayout,
  characters: Character[],
  stories: Story[],  // Nested serialization
  createdAt: Date → ISO string,
  updatedAt: Date → ISO string
}
```

**From JSON (Loading):**
```typescript
BookCache.deserializeBook(bookData) → {
  1. Parse dates: new Date(bookData.createdAt)
  2. Reconstruct Stories:
     stories.map(storyData => new Story({
       ...storyData,
       scenes: scenes.map(sceneData => new Scene({
         ...sceneData,
         createdAt: new Date(sceneData.createdAt),
         updatedAt: new Date(sceneData.updatedAt)
       }))
     }))
  3. Create Book instance:
     new Book({
       ...bookData,
       stories: reconstructedStories,
       createdAt: new Date(bookData.createdAt),
       updatedAt: new Date(bookData.updatedAt)
     })
}
```

**Key Point:** Must reconstruct class instances (Book, Story, Scene) not just plain objects, so methods work correctly!

### Image Serialization

**Images stored separately from metadata:**
- **Metadata:** Stored in book JSON (`character.imageGallery`)
- **Image Files:** Stored in filesystem (`~/Documents/.../images/{imageId}.png`)

**Character Image Metadata:**
```typescript
{
  id: string,              // UUID
  url?: string,            // Blob URL (runtime only, not persisted)
  model: string,           // e.g., "google/gemini-2.5-flash"
  prompt: string,          // Full prompt used
  timestamp: Date,         // Generation time
  width?: number,          // Optional dimensions
  height?: number
}
```

---

## Cache Invalidation Strategy

### BookCache
- **Write-through:** All writes immediately persist to filesystem
- **No TTL:** Cache never expires (single-user app)
- **Manual invalidation:** User can clear cache manually
- **Automatic reload:** On app restart

### ImageCache
- **LRU eviction:** Oldest unused entries removed when cache full
- **Prune invalid:** Periodic cleanup of invalid blob URLs
- **No persistence:** Cache cleared on app restart (URLs regenerated from filesystem)

---

## Error Handling

### Filesystem Not Configured
```typescript
if (!await FileSystemService.isConfigured()) {
  throw new Error('Filesystem not configured. Please select a storage directory in Settings.');
}
```

**User Experience:**
1. App shows "Select Storage Directory" dialog
2. User picks ~/Documents/AI-Books/cache/
3. FileSystemService stores directory handle
4. All operations now work

### Save Failures
```typescript
try {
  await BookService.saveBook(book);
} catch (error) {
  console.error('Failed to save book:', error);
  // User sees error toast
  // Book remains in memory but not persisted
  // User can retry or lose changes
}
```

### Load Failures
```typescript
try {
  const books = await BookCache.loadAll();
} catch (error) {
  console.error('Failed to load books:', error);
  // Cache marked as "loaded" to prevent retry loops
  // App shows empty state
  // User can try reconnecting directory
}
```

---

## Performance Characteristics

### BookCache
- **Load time:** ~100-500ms (depends on book count)
- **Get time:** ~0ms (in-memory Map lookup)
- **Save time:** ~10-50ms (JSON serialization + filesystem write)
- **Memory usage:** ~1-10MB per book (depends on story/scene count)

### ImageCache
- **Load time:** ~50-200ms per image (filesystem read + blob creation)
- **Get time:** ~0ms (in-memory Map lookup)
- **Save time:** ~100-500ms per image (URL fetch + filesystem write)
- **Memory usage:** ~0KB (stores blob URLs, not actual images)

### FileSystemService
- **Directory listing:** ~10-50ms
- **JSON read:** ~5-20ms per file
- **JSON write:** ~10-50ms per file
- **Image read:** ~50-200ms per image
- **Image write:** ~100-500ms per image

---

## Testing Strategy

### Unit Tests
- ✅ **BookService:** 28 tests (CRUD, validation, characters)
- ✅ **ImageStorageService:** 27 tests (scene/character images, cache)
- ✅ **BookCache:** Tests exist
- ✅ **ImageCache:** Tests exist (3 minor failures)
- ✅ **StorageService:** Tests exist
- ⏳ **FileSystemService:** TODO (mocking required)

### Mocking Strategy
```typescript
// Mock FileSystemService in tests
vi.mock('../../src/services/FileSystemService', () => ({
  FileSystemService: {
    isConfigured: vi.fn(() => Promise.resolve(true)),
    writeJSON: vi.fn(() => Promise.resolve()),
    readJSON: vi.fn(() => Promise.resolve(null)),
    loadAllBooksMetadata: vi.fn(() => Promise.resolve(new Map())),
    saveImageById: vi.fn(() => Promise.resolve({ success: true })),
    // ... etc
  }
}));
```

---

## Migration Notes

### v4.0 → v5.0 (Filesystem Storage)
- **Before:** localStorage for all data
- **After:** Filesystem for persistence, in-memory cache for speed
- **Migration:** Automatic on first load
  - Loads from localStorage
  - Saves to filesystem
  - Clears localStorage

### Backward Compatibility
- Old localStorage keys still supported (read-only)
- `BookService.getActiveBookData()` - legacy API
- `BookService.saveActiveBookData()` - legacy API

---

## Future Improvements

### Planned (Sprint 2-3)
1. **Add FileSystemService tests** (Sprint 1 remaining)
2. **Optimize bulk image loading** (batch reads)
3. **Add image compression** (reduce storage size)
4. **Implement filesystem enumeration** (for cleanup)

### Potential (Future)
1. **Incremental saves** (only changed data)
2. **Background sync** (Web Workers)
3. **Cloud backup** (optional sync to cloud storage)
4. **Version control** (track book changes over time)
5. **Undo/redo** (based on change history)

---

## Troubleshooting

### "Filesystem not configured"
**Solution:** Go to Settings → Select Storage Directory → Pick ~/Documents/AI-Books/cache/

### "Failed to load books"
**Possible causes:**
1. Directory permissions changed
2. Directory was deleted
3. Filesystem API not supported (old browser)

**Solution:** Reconnect directory or select new directory

### "Images not loading"
**Possible causes:**
1. Image files deleted manually
2. Directory permissions changed
3. Blob URLs expired

**Solution:** Regenerate images or reconnect directory

### "Book not saving"
**Possible causes:**
1. Disk full
2. Directory permissions changed
3. Invalid book data

**Solution:** Check disk space, reconnect directory, or check browser console for errors

---

## References

- **BookService:** `src/services/BookService.ts`
- **ImageStorageService:** `src/services/ImageStorageService.ts`
- **BookCache:** `src/services/BookCache.ts`
- **ImageCache:** `src/services/ImageCache.ts`
- **FileSystemService:** `src/services/FileSystemService.ts`
- **StorageService:** `src/services/StorageService.ts`

**Related Documentation:**
- ARCHITECTURE-ANALYSIS-REPORT.md
- ARCHITECTURE-DIAGRAMS.md
- FILESYSTEM-STORAGE-GUIDE.md
- IMAGE-CACHE-GUIDE.md

---

**Document Status:** ✅ Complete  
**Last Updated:** November 27, 2025  
**Maintained By:** Architecture Team

