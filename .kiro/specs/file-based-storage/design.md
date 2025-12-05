# Design Document - File-Based Storage Migration

## Overview

This document outlines the technical design for migrating from monolithic JSON book storage to a file-based directory structure with Git version control. The new system will store each book as a directory containing individual story files, enabling external editing, version history, and corruption recovery.

**Design Goals:**
1. Enable external editing of individual stories without parsing entire books
2. Provide automatic version control and corruption recovery via Git
3. Maintain backward compatibility during transition
4. Improve performance through lazy loading
5. Ensure data integrity through validation and recovery mechanisms
6. Create human-readable file structures

**Key Design Decisions:**
- Use Git for version control (optional, graceful degradation if unavailable)
- Lazy load stories on demand (load book.json first, stories as needed)
- Slug-based naming for directories and files (human-readable, filesystem-safe)
- Atomic commits for related changes (batch multiple saves)
- Automatic migration with backup and rollback support

## Architecture

### Current Architecture (v5.0)

```
prompter-cache/
├── books/
│   ├── {bookId-1}.json          # Monolithic book file
│   ├── {bookId-2}.json          # Monolithic book file
│   └── ...
├── scenes/                       # Scene images
├── characters/                   # Character images
└── app-metadata.json            # Active book ID, settings
```

### New Architecture (v6.0)

```
prompter-cache/
├── books/
│   ├── {book-slug-1}/           # Book directory
│   │   ├── .git/                # Git repository
│   │   ├── book.json            # Book metadata
│   │   └── stories/             # Stories directory
│   │       ├── {story-slug-1}.json
│   │       ├── {story-slug-2}.json
│   │       └── ...
│   ├── {book-slug-2}/
│   │   ├── .git/
│   │   ├── book.json
│   │   └── stories/
│   │       └── ...
│   └── books-backup/            # Migration backup (temporary)
│       ├── {bookId-1}.json.bak
│       └── ...
├── scenes/                       # Scene images (unchanged)
├── characters/                   # Character images (unchanged)
└── app-metadata.json            # Active book ID, settings (unchanged)
```

### File Format Examples

**book.json:**
```json
{
  "id": "uuid-here",
  "title": "My Book Title",
  "description": "Book description",
  "backgroundSetup": "Background context",
  "aspectRatio": "9:16",
  "style": {
    "panelConfig": { ... }
  },
  "defaultLayout": { ... },
  "characters": [
    {
      "name": "Character Name",
      "description": "Character description",
      "imageGallery": [ ... ],
      "selectedImageId": "..."
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "_metadata": {
    "version": "6.0.0",
    "slug": "my-book-title"
  }
}
```

**stories/{story-slug}.json:**
```json
{
  "id": "uuid-here",
  "title": "Story Title",
  "description": "Story description",
  "backgroundSetup": "Story background",
  "diagramStyle": "...",
  "layout": { ... },
  "characters": [ ... ],
  "elements": [ ... ],
  "scenes": [
    {
      "id": "uuid-here",
      "title": "Scene Title",
      "description": "Scene description",
      "textPanel": "...",
      "diagramPanel": "...",
      "layout": { ... },
      "characters": [ ... ],
      "elements": [ ... ],
      "imageHistory": [ ... ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "_metadata": {
    "version": "6.0.0",
    "slug": "story-title",
    "bookId": "uuid-here"
  }
}
```

## Components and Interfaces

### 1. Slug Generation Service

**Purpose:** Convert titles to filesystem-safe slugs

**Interface:**
```typescript
class SlugService {
  /**
   * Generate a slug from a title
   * - Convert to lowercase
   * - Replace spaces with hyphens
   * - Remove special characters (keep alphanumeric and hyphens)
   * - Limit to 50 characters
   * - Handle empty/invalid titles with fallback
   */
  static generateSlug(title: string, fallbackPrefix: string = 'item'): string;
  
  /**
   * Generate a unique slug by appending numeric suffix if needed
   * - Check if slug exists in directory
   * - Append -1, -2, -3, etc. until unique
   */
  static generateUniqueSlug(
    baseSlug: string,
    existingSlugs: Set<string>
  ): string;
  
  /**
   * Validate a slug format
   */
  static isValidSlug(slug: string): boolean;
}
```

**Implementation:**
```typescript
static generateSlug(title: string, fallbackPrefix: string = 'item'): string {
  if (!title || title.trim().length === 0) {
    return `${fallbackPrefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Spaces to hyphens
    .replace(/[^a-z0-9-]/g, '')     // Remove special chars
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
  
  // If slug is empty after cleaning, use fallback
  if (slug.length === 0) {
    return `${fallbackPrefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  
  // Limit to 50 characters
  return slug.substring(0, 50);
}
```

---

### 2. File-Based Storage Service

**Purpose:** Handle file I/O for book directories and story files

**Interface:**
```typescript
class FileBasedStorageService {
  /**
   * Save a book to directory structure
   * - Create book directory if needed
   * - Save book.json with metadata
   * - Save modified story files
   * - Create Git commit
   */
  static async saveBook(book: Book): Promise<{
    success: boolean;
    bookPath?: string;
    error?: string;
  }>;
  
  /**
   * Load a book from directory structure
   * - Load book.json
   * - Validate structure
   * - Return book with lazy-loaded stories
   */
  static async loadBook(bookSlugOrId: string): Promise<Book | null>;
  
  /**
   * Load a specific story from file
   * - Load story JSON file
   * - Validate structure
   * - Return story instance
   */
  static async loadStory(
    bookSlug: string,
    storySlug: string
  ): Promise<Story | null>;
  
  /**
   * Save a story to file
   * - Save story JSON file
   * - Update book's updatedAt timestamp
   * - Create Git commit
   */
  static async saveStory(
    bookSlug: string,
    story: Story
  ): Promise<{ success: boolean; error?: string }>;
  
  /**
   * Delete a story file
   * - Remove story JSON file
   * - Create Git commit
   */
  static async deleteStory(
    bookSlug: string,
    storySlug: string
  ): Promise<boolean>;
  
  /**
   * List all books (read book.json from each directory)
   */
  static async listBooks(): Promise<Array<{
    id: string;
    slug: string;
    title: string;
    storyCount: number;
  }>>;
  
  /**
   * Get book directory path
   */
  static async getBookPath(bookSlugOrId: string): Promise<string | null>;
  
  /**
   * Check if book directory exists
   */
  static async bookExists(bookSlugOrId: string): Promise<boolean>;
}
```

---

### 3. Git Service

**Purpose:** Handle Git operations for version control

**Interface:**
```typescript
class GitService {
  /**
   * Check if Git is available
   */
  static async isGitAvailable(): Promise<boolean>;
  
  /**
   * Initialize Git repository in directory
   * - Run `git init`
   * - Create .gitignore if needed
   * - Create initial commit
   */
  static async initRepository(dirPath: string): Promise<{
    success: boolean;
    error?: string;
  }>;
  
  /**
   * Create a Git commit
   * - Stage specified files
   * - Commit with message
   */
  static async commit(
    dirPath: string,
    files: string[],
    message: string
  ): Promise<{ success: boolean; commitHash?: string; error?: string }>;
  
  /**
   * Get Git history for a file
   */
  static async getFileHistory(
    dirPath: string,
    filePath: string
  ): Promise<Array<{
    hash: string;
    message: string;
    date: Date;
    author: string;
  }>>;
  
  /**
   * Revert file to specific commit
   */
  static async revertFile(
    dirPath: string,
    filePath: string,
    commitHash: string
  ): Promise<{ success: boolean; error?: string }>;
  
  /**
   * Check if file has uncommitted changes
   */
  static async hasUncommittedChanges(
    dirPath: string,
    filePath: string
  ): Promise<boolean>;
  
  /**
   * Get file content from specific commit
   */
  static async getFileAtCommit(
    dirPath: string,
    filePath: string,
    commitHash: string
  ): Promise<string | null>;
}
```

**Implementation Notes:**
- Use `simple-git` library for Git operations (or Electron IPC for Electron mode)
- Gracefully handle Git unavailability (log warning, continue without Git)
- Set Git user config if not set: `user.name="Story Prompter"`, `user.email="app@storyprompt.local"`

---

### 4. Validation Service

**Purpose:** Validate JSON structure and data integrity

**Interface:**
```typescript
interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

class ValidationService {
  /**
   * Validate book.json structure
   */
  static validateBookJSON(data: any): ValidationResult;
  
  /**
   * Validate story JSON structure
   */
  static validateStoryJSON(data: any): ValidationResult;
  
  /**
   * Attempt automatic repair of common corruption patterns
   * - Missing required fields (add defaults)
   * - Invalid dates (use current date)
   * - Invalid UUIDs (generate new)
   * - Malformed arrays (convert to empty array)
   */
  static attemptRepair(data: any, type: 'book' | 'story'): {
    repaired: any;
    changes: string[];
  };
}
```

**Validation Rules:**

**Book JSON:**
- Required fields: `id`, `title`, `stories` (can be empty array), `createdAt`, `updatedAt`
- `id` must be valid UUID
- `title` must be non-empty string
- `aspectRatio` must be valid ratio if present
- `characters` must be array if present
- Dates must be valid ISO 8601 strings

**Story JSON:**
- Required fields: `id`, `title`, `scenes`, `createdAt`, `updatedAt`
- `id` must be valid UUID
- `title` must be non-empty string
- `scenes` must be array
- Each scene must have required fields: `id`, `title`, `createdAt`, `updatedAt`

---

### 5. Migration Service

**Purpose:** Migrate from old monolithic format to new directory structure

**Interface:**
```typescript
class MigrationService {
  /**
   * Detect if old-format files exist
   */
  static async detectOldFormat(): Promise<{
    hasOldFormat: boolean;
    bookCount: number;
    bookIds: string[];
  }>;
  
  /**
   * Migrate all books from old to new format
   * - Create backup
   * - Convert each book
   * - Validate migration
   * - Delete old files
   */
  static async migrateAll(): Promise<{
    success: boolean;
    migratedCount: number;
    failedBooks: string[];
    error?: string;
  }>;
  
  /**
   * Migrate a single book
   */
  static async migrateBook(bookId: string): Promise<{
    success: boolean;
    newSlug?: string;
    error?: string;
  }>;
  
  /**
   * Create backup of old files
   */
  static async createBackup(): Promise<{
    success: boolean;
    backupPath?: string;
    error?: string;
  }>;
  
  /**
   * Restore from backup (rollback migration)
   */
  static async restoreFromBackup(): Promise<{
    success: boolean;
    restoredCount: number;
    error?: string;
  }>;
  
  /**
   * Validate migration (compare old and new data)
   */
  static async validateMigration(bookId: string, newSlug: string): Promise<{
    isValid: boolean;
    differences: string[];
  }>;
  
  /**
   * Clean up old backup files (after 30 days)
   */
  static async cleanupOldBackups(): Promise<void>;
}
```

**Migration Algorithm:**
```
For each old book file:
  1. Load old JSON file
  2. Parse and validate
  3. Generate slug from book title
  4. Create book directory
  5. Initialize Git repository
  6. Extract book metadata -> save as book.json
  7. For each story:
     a. Generate story slug
     b. Save story as stories/{slug}.json
  8. Create Git commit: "Migrate book: {title}"
  9. Validate migration (compare data)
  10. If valid, mark as migrated
  11. If invalid, rollback and report error

After all books:
  1. If all successful, move old files to backup
  2. If any failed, keep old files and report
  3. Create backup metadata with timestamp
```

---

### 6. Recovery Service

**Purpose:** Handle corruption detection and recovery

**Interface:**
```typescript
interface RecoveryOption {
  type: 'revert' | 'history' | 'skip' | 'repair';
  label: string;
  description: string;
  action: () => Promise<void>;
}

class RecoveryService {
  /**
   * Detect corruption and offer recovery options
   */
  static async detectAndRecover(
    bookSlug: string,
    filePath: string,
    validationResult: ValidationResult
  ): Promise<{
    isCorrupted: boolean;
    options: RecoveryOption[];
  }>;
  
  /**
   * Revert file to last commit
   */
  static async revertToLastCommit(
    bookSlug: string,
    filePath: string
  ): Promise<{ success: boolean; error?: string }>;
  
  /**
   * Get Git history for file
   */
  static async getFileHistory(
    bookSlug: string,
    filePath: string
  ): Promise<Array<{
    hash: string;
    message: string;
    date: Date;
    preview: string;
  }>>;
  
  /**
   * Revert to specific commit
   */
  static async revertToCommit(
    bookSlug: string,
    filePath: string,
    commitHash: string
  ): Promise<{ success: boolean; error?: string }>;
  
  /**
   * Attempt automatic repair
   */
  static async attemptRepair(
    bookSlug: string,
    filePath: string,
    data: any,
    type: 'book' | 'story'
  ): Promise<{ success: boolean; changes: string[]; error?: string }>;
}
```

---

### 7. Lazy Loading Book Wrapper

**Purpose:** Wrap Book model to support lazy-loaded stories

**Interface:**
```typescript
class LazyBook extends Book {
  private loadedStories: Map<string, Story> = new Map();
  private storyMetadata: Array<{ id: string; slug: string; title: string }>;
  
  /**
   * Get story by ID (load from file if not in memory)
   */
  async getStory(storyId: string): Promise<Story | undefined>;
  
  /**
   * Get all stories (load all from files if needed)
   */
  async getAllStories(): Promise<Story[]>;
  
  /**
   * Check if story is loaded in memory
   */
  isStoryLoaded(storyId: string): boolean;
  
  /**
   * Preload specific stories
   */
  async preloadStories(storyIds: string[]): Promise<void>;
  
  /**
   * Get story metadata without loading full story
   */
  getStoryMetadata(): Array<{ id: string; slug: string; title: string }>;
}
```

## Data Models

### Book Directory Metadata

```typescript
interface BookDirectoryMetadata {
  id: string;
  slug: string;
  title: string;
  storyCount: number;
  lastModified: Date;
  gitInitialized: boolean;
}
```

### Migration Backup Metadata

```typescript
interface MigrationBackup {
  timestamp: Date;
  bookCount: number;
  books: Array<{
    id: string;
    filename: string;
    size: number;
  }>;
  expiresAt: Date; // timestamp + 30 days
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Slug generation is deterministic and valid
*For any* book or story title, generating a slug should produce a valid filesystem-safe string that is lowercase, uses hyphens for spaces, contains only alphanumeric characters and hyphens, and is at most 50 characters long
**Validates: Requirements 1.5**

### Property 2: Directory structure is created correctly
*For any* book being saved, the system should create a directory with the correct slug, a book.json file, and a stories subdirectory
**Validates: Requirements 1.1, 1.2**

### Property 3: Story files are created with correct slugs
*For any* story being saved, the system should create a file at `stories/{story-slug}.json` with the correct slug derived from the story title
**Validates: Requirements 1.3**

### Property 4: Slug conflicts are resolved with numeric suffixes
*For any* set of stories with identical titles, the system should append numeric suffixes (-1, -2, -3, etc.) to ensure unique filenames
**Validates: Requirements 1.4**

### Property 5: Git repository is initialized for new books
*For any* new book directory created, the system should initialize a Git repository (if Git is available)
**Validates: Requirements 2.1**

### Property 6: Git commits are created on save
*For any* book or story save operation, the system should create a Git commit with a descriptive message (if Git is available)
**Validates: Requirements 2.2, 12.1, 12.2, 12.3, 12.4**

### Property 7: Multiple saves are batched into single commits
*For any* batch of file saves occurring together, the system should create only one Git commit containing all changes
**Validates: Requirements 2.3, 7.4**

### Property 8: Validation detects invalid JSON structures
*For any* book.json or story JSON file with missing required fields or invalid data types, validation should fail and identify the specific errors
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 9: Recovery options are provided for corrupted files
*For any* corrupted file detected during load, the system should offer recovery options including revert, history view, skip, and repair
**Validates: Requirements 3.5, 4.1, 4.2, 4.3, 4.4**

### Property 10: Migration preserves all data
*For any* book in old format, migrating to new format and loading back should produce equivalent data (round-trip property)
**Validates: Requirements 5.3, 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 11: Migration creates backups
*For any* migration operation, the system should create a backup of all old files before making changes
**Validates: Requirements 5.4, 6.1**

### Property 12: Failed migration triggers automatic rollback
*For any* migration that fails validation, the system should automatically restore from backup
**Validates: Requirements 6.2**

### Property 13: Lazy loading loads only requested data
*For any* book being loaded, initially only the book.json file should be read, and story files should be loaded only when accessed
**Validates: Requirements 7.1, 7.2**

### Property 14: Only modified files are saved
*For any* book save operation, only files that have changed since last save should be written to disk
**Validates: Requirements 7.3**

### Property 15: Error messages identify specific files and errors
*For any* file operation error, the error message should include the specific file path and reason for failure
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 16: JSON files are formatted with proper indentation
*For any* JSON file saved, it should be formatted with 2-space indentation for human readability
**Validates: Requirements 9.1**

### Property 17: Edge cases are handled gracefully
*For any* book with no stories, story with no scenes, or title with only special characters, the system should handle it without errors
**Validates: Requirements 11.1, 11.2, 11.3**

### Property 18: System works without Git
*For any* environment where Git is unavailable, the system should still save and load files correctly, just without version control features
**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 19: Backward compatibility is maintained
*For any* call to the old storage API, the system should correctly translate it to the new file-based storage operations
**Validates: Requirements 14.1, 14.2, 14.3**

## Error Handling

### File System Errors
- **Directory creation fails**: Log error, return failure status, don't modify existing data
- **File write fails**: Rollback partial writes, return error with file path
- **File read fails**: Check if file exists, offer recovery if corrupted, return null if missing
- **Permission denied**: Clear error message explaining permission issue, suggest solutions

### Git Errors
- **Git not available**: Log warning, disable Git features, continue with file operations
- **Git init fails**: Log error, continue without Git (graceful degradation)
- **Git commit fails**: Log error, files are still saved (Git is enhancement)
- **Git revert fails**: Return error, offer alternative recovery options

### Validation Errors
- **Invalid JSON syntax**: Offer to view file, attempt repair, or revert to last commit
- **Missing required fields**: Attempt automatic repair with defaults
- **Invalid data types**: Attempt type coercion, or fail with clear error
- **Corrupted file**: Offer all recovery options (revert, history, skip, repair)

### Migration Errors
- **Migration fails for one book**: Continue with other books, report failed book
- **Backup creation fails**: Abort migration, return error
- **Validation fails after migration**: Rollback that book, keep old file
- **Disk space insufficient**: Abort migration, clear error message

## Testing Strategy

### Unit Tests

**Slug Generation:**
- Test basic title conversion (spaces to hyphens, lowercase)
- Test special character removal
- Test length limiting (50 chars)
- Test empty/invalid titles (fallback to UUID)
- Test numeric suffix generation for conflicts

**File Operations:**
- Test directory creation
- Test file writing and reading
- Test JSON formatting (2-space indentation)
- Test file deletion
- Test path resolution

**Validation:**
- Test valid book.json passes validation
- Test invalid book.json fails with correct errors
- Test valid story JSON passes validation
- Test invalid story JSON fails with correct errors
- Test automatic repair for common issues

**Migration:**
- Test single book migration
- Test batch migration
- Test backup creation
- Test rollback on failure
- Test validation after migration

### Property-Based Tests

We will use `fast-check` for property-based testing in TypeScript.

**Property 1: Slug generation**
```typescript
// Generate random titles and verify slug properties
fc.assert(
  fc.property(fc.string(), (title) => {
    const slug = SlugService.generateSlug(title);
    // Verify: lowercase, no spaces, no special chars, max 50 chars
    return slug.length <= 50 &&
           slug === slug.toLowerCase() &&
           /^[a-z0-9-]+$/.test(slug);
  })
);
```

**Property 2: Round-trip migration**
```typescript
// Generate random books, migrate, load back, verify equivalence
fc.assert(
  fc.property(bookGenerator, async (book) => {
    // Save in old format
    await saveOldFormat(book);
    // Migrate
    await MigrationService.migrateBook(book.id);
    // Load from new format
    const loaded = await FileBasedStorageService.loadBook(book.id);
    // Verify equivalence
    return deepEqual(book, loaded);
  })
);
```

**Property 3: Lazy loading efficiency**
```typescript
// Generate random books, verify only book.json is read initially
fc.assert(
  fc.property(bookGenerator, async (book) => {
    const readCount = trackFileReads();
    await FileBasedStorageService.loadBook(book.id);
    // Should only read book.json, not story files
    return readCount.get('book.json') === 1 &&
           readCount.get('stories/') === 0;
  })
);
```

**Property 4: Validation catches errors**
```typescript
// Generate invalid book data, verify validation fails
fc.assert(
  fc.property(invalidBookGenerator, (invalidBook) => {
    const result = ValidationService.validateBookJSON(invalidBook);
    return !result.isValid && result.errors.length > 0;
  })
);
```

### Integration Tests

**End-to-End Migration:**
1. Create test books in old format
2. Run migration
3. Verify all books migrated
4. Verify all data preserved
5. Verify Git repositories initialized
6. Verify backup created

**Corruption Recovery:**
1. Create book in new format
2. Corrupt a story file
3. Attempt to load
4. Verify corruption detected
5. Verify recovery options offered
6. Execute recovery
7. Verify data restored

**Lazy Loading:**
1. Create book with multiple stories
2. Load book
3. Verify only book.json read
4. Access one story
5. Verify only that story file read
6. Access same story again
7. Verify no additional file read (cached)

### Manual Testing

**External Editing:**
1. Create book in app
2. Close app
3. Edit story JSON file externally
4. Reopen app
5. Verify changes loaded correctly

**Git History:**
1. Create book
2. Make several edits
3. View Git history
4. Verify commits present with correct messages
5. Revert to previous commit
6. Verify data restored

**Migration:**
1. Create books in old format
2. Start app
3. Accept migration prompt
4. Verify migration completes
5. Verify all data present
6. Verify backup created

## Implementation Plan Summary

### Phase 1: Core Infrastructure (No Git)
1. Implement SlugService
2. Implement FileBasedStorageService (without Git)
3. Implement ValidationService
4. Add unit tests

### Phase 2: Git Integration
1. Implement GitService
2. Add Git operations to FileBasedStorageService
3. Implement RecoveryService
4. Add Git-related tests

### Phase 3: Migration
1. Implement MigrationService
2. Add migration detection on app start
3. Add migration UI
4. Add migration tests

### Phase 4: Lazy Loading
1. Implement LazyBook wrapper
2. Update BookService to use lazy loading
3. Add caching logic
4. Add performance tests

### Phase 5: Integration & Polish
1. Update all components to use new storage
2. Add comprehensive integration tests
3. Add error handling and recovery UI
4. Performance optimization
5. Documentation

**Estimated Effort:** 2-3 weeks

## Success Criteria

1. ✅ All books stored as directories with individual story files
2. ✅ Git version control working for all books
3. ✅ Validation detects corrupted files
4. ✅ Recovery options restore data successfully
5. ✅ Migration preserves 100% of data
6. ✅ Lazy loading improves performance
7. ✅ External editing works correctly
8. ✅ All 819 existing tests still pass
9. ✅ New property-based tests pass
10. ✅ Manual testing confirms all features work
