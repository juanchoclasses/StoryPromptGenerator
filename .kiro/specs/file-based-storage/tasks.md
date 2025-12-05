# Implementation Plan - Simple File-Based Storage

## Overview

This plan implements a simple file-based storage system where each book is a directory containing individual story files. The approach focuses on simplicity: use existing FileSystemService APIs, create a standalone migration script, and maintain backward compatibility.

**Key Principles:**
- Use existing FileSystemService APIs (no new filesystem code)
- Standalone migration script (throwaway code, not in app)
- Support both old and new formats during transition
- Keep it simple - no Git, no validation, no lazy loading

---

## Tasks

- [x] 1. Implement SlugService
  - Create `src/services/SlugService.ts`
  - Implement `generateSlug(title: string, fallbackPrefix: string): string`
  - Convert to lowercase, replace spaces with hyphens, remove special characters
  - Limit to 50 characters
  - Handle empty/invalid titles with UUID fallback (e.g., `book-a1b2c3d4`)
  - Implement `generateUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string`
  - Handle conflicts by appending numeric suffixes (e.g., `story-1`, `story-2`)
  - _Requirements: 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 1.1 Write unit tests for SlugService
  - Test basic slug generation (lowercase, hyphens, special chars removed)
  - Test length limiting (50 chars max)
  - Test empty/invalid title fallback
  - Test unique slug generation with conflicts
  - _Requirements: 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2. Implement FileBasedStorageService
  - Create `src/services/FileBasedStorageService.ts`
  - Implement `saveBook(book: Book): Promise<{success: boolean; error?: string}>`
    - Generate book slug from title
    - Create directory: `prompter-cache/books/{book-slug}/`
    - Create subdirectory: `prompter-cache/books/{book-slug}/stories/`
    - Save book.json with metadata (id, title, description, backgroundSetup, aspectRatio, style, defaultLayout, characters, createdAt, updatedAt)
    - Save each story to `stories/{story-slug}.json` with unique slugs
    - Format JSON with 2-space indentation
    - Handle filesystem errors with clear error messages
  - Implement `loadBook(bookSlugOrId: string): Promise<Book | null>`
    - Try loading by slug first: `prompter-cache/books/{slug}/book.json`
    - If not found, search all directories for matching book ID
    - Load all story files from `stories/` directory
    - Reconstruct Book object with all stories
    - Return null if book not found
  - Implement `isDirectoryFormat(bookSlugOrId: string): Promise<boolean>`
    - Check if `prompter-cache/books/{slug}/book.json` exists
  - Use existing FileSystemService APIs for all file operations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

- [ ]* 2.1 Write unit tests for FileBasedStorageService
  - Test saving book creates correct directory structure
  - Test book.json contains correct metadata fields
  - Test story files are created with correct slugs
  - Test slug conflicts are resolved with numeric suffixes
  - Test JSON formatting (2-space indentation)
  - Test loading book by slug
  - Test loading book by ID
  - Test loading returns null for non-existent books
  - Test error handling for filesystem failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Update StorageService for backward compatibility
  - Update `loadAllBooks()` to check both formats:
    - Load old format: `prompter-cache/books/{bookId}.json`
    - Load new format: `prompter-cache/books/{book-slug}/book.json`
  - Update `loadBook(bookId)` to check both formats
  - Update `saveBook(book)` to always use new directory format
  - When saving old-format book, convert to new format automatically
  - Maintain existing API so no changes needed in UI components
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.2, 7.3, 7.4_

- [ ]* 3.1 Write integration tests for backward compatibility
  - Test loading books in old format
  - Test loading books in new format
  - Test mixed format (some old, some new)
  - Test converting old format to new on save
  - Test new books always use new format
  - Test book listing works with both formats
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.2, 7.3, 7.4_

- [ ] 4. Handle edge cases
  - Books with no stories: create empty `stories/` directory
  - Stories with no scenes: save with empty scenes array
  - Titles with only special characters: use fallback slug (e.g., `book-{uuid}`)
  - Multiple books with identical titles: append numeric suffixes to directory names
  - File write failures: log error and return clear error message
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 4.1 Write unit tests for edge cases
  - Test book with no stories
  - Test story with no scenes
  - Test title with only special characters
  - Test duplicate book titles
  - Test file write failures
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5. Checkpoint - Verify core functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create standalone migration script
  - Create `migrate-books.ts` in project root (throwaway code)
  - Use Node.js `fs` module directly (not FileSystemService)
  - Read all old format files: `prompter-cache/books/*.json`
  - For each book:
    - Generate slug from book title
    - Create directory structure
    - Write book.json
    - Write story files
  - Create backup before migration: copy `books/` to `books-backup-{timestamp}/`
  - Log progress to console
  - Validate each migrated book (compare data)
  - Delete old files after successful migration
  - Keep backup until manually deleted
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 7. Test migration script
  - Create test books in old format
  - Run migration script on test data
  - Verify directory structure is correct
  - Verify all data is preserved
  - Verify slugs are generated correctly
  - Verify backup is created
  - Load migrated books in app to confirm they work
  - _Requirements: 6.2, 6.3, 6.4_

- [ ] 8. Run migration on real data
  - Backup current books directory manually (extra safety)
  - Run migration script: `npx tsx migrate-books.ts`
  - Verify migration completed successfully
  - Test app with migrated data
  - Keep backup until confident everything works
  - Delete migration script (throwaway code)
  - _Requirements: 6.5, 7.1_

- [ ] 9. Final testing
  - Test creating new books (should use new format)
  - Test editing existing books (should convert to new format)
  - Test loading books (both formats work)
  - Test external editing (modify story file on disk, reload in app)
  - Verify no data loss or corruption
  - Verify all existing app features still work
  - _Requirements: All_

- [ ] 10. Documentation and cleanup
  - Update README with new file structure
  - Document external editing capabilities
  - Add comments to SlugService and FileBasedStorageService
  - Remove old format support after all books migrated (optional, can wait)
  - _Requirements: 7.5_

---

## Task Dependencies

```
1 → 2 (SlugService before FileBasedStorageService)
2 → 3 (FileBasedStorageService before StorageService updates)
3 → 4 (Core functionality before edge cases)
4 → 5 (Checkpoint after core implementation)
5 → 6 → 7 → 8 (Migration script after core functionality)
8 → 9 → 10 (Final testing and docs)
```

## Success Criteria

The feature is complete when:

- [ ] All books stored as directories with individual story files
- [ ] External editing works (files visible and editable on disk)
- [ ] Old format books still load (backward compatibility)
- [ ] New books use new format
- [ ] Editing old books converts them to new format
- [ ] Migration script successfully migrates all existing books
- [ ] No data loss or corruption
- [ ] All existing tests pass
- [ ] Documentation updated

## Notes

### File Paths

```
Old format:
prompter-cache/books/{bookId}.json

New format:
prompter-cache/books/{book-slug}/
├── book.json
└── stories/
    ├── {story-slug-1}.json
    ├── {story-slug-2}.json
    └── ...
```

### Slug Generation Pattern

```typescript
const slug = title
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '-')           // spaces to hyphens
  .replace(/[^a-z0-9-]/g, '')     // remove special chars
  .replace(/-+/g, '-')            // collapse multiple hyphens
  .replace(/^-|-$/g, '')          // trim hyphens
  .substring(0, 50);              // limit length

if (slug.length === 0) {
  slug = `${fallbackPrefix}-${crypto.randomUUID().slice(0, 8)}`;
}
```

### Migration Safety

- Always create backup before migration
- Test on copy of data first
- Validate each migrated book
- Keep backup until confident
- Migration script is throwaway code (delete after use)

### Estimated Timeline

- Tasks 1-2: 0.5 days (core services)
- Task 3: 0.5 days (integration)
- Task 4-5: 0.5 days (edge cases + checkpoint)
- Tasks 6-8: 0.5 days (migration)
- Tasks 9-10: 0.5 days (testing + docs)

**Total: 2.5 days**

Much simpler than the complex version with Git/validation/lazy loading!
