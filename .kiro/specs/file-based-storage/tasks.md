# Implementation Plan - File-Based Storage Migration

## Overview

This plan implements a file-based storage system where each book is a directory containing individual story files, with Git version control for data integrity and recovery. The implementation is organized into 5 phases for incremental progress.

**Implementation Order:**
1. Core Infrastructure (slug generation, file operations, validation)
2. Git Integration (version control, recovery)
3. Migration (old format → new format)
4. Lazy Loading (performance optimization)
5. Integration & Testing (connect everything, comprehensive tests)

---

## Tasks

- [x] 1. Phase 1: Core Infrastructure - Slug Generation
  - Implement SlugService for generating filesystem-safe slugs from titles
  - Handle lowercase conversion, space-to-hyphen replacement, special character removal
  - Implement 50-character limit
  - Handle empty/invalid titles with UUID fallback
  - Implement unique slug generation with numeric suffixes
  - _Requirements: 1.5, 11.3, 11.4_

- [x] 1.1 Write property test for slug generation
  - **Property 1: Slug generation is deterministic and valid**
  - **Validates: Requirements 1.5**
  - Generate random titles and verify slugs are valid (lowercase, alphanumeric + hyphens, max 50 chars)
  - _Requirements: 1.5_

- [x] 2. Implement ValidationService for JSON structure validation
  - Create validation rules for book.json structure
  - Create validation rules for story JSON structure
  - Implement field type checking (UUID, dates, arrays, strings)
  - Implement automatic repair for common corruption patterns
  - Return detailed validation results with field-level errors
  - _Requirements: 3.1, 3.2, 3.3, 8.2_

- [x] 2.1 Write property test for validation
  - **Property 8: Validation detects invalid JSON structures**
  - **Validates: Requirements 3.1, 3.2, 3.3**
  - Generate invalid book/story data and verify validation fails with correct errors
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Implement FileBasedStorageService (without Git initially)
  - Implement directory creation for books
  - Implement book.json file writing with proper formatting (2-space indentation)
  - Implement story file writing to stories/ subdirectory
  - Implement book.json file reading
  - Implement story file reading
  - Implement file deletion
  - Handle filesystem errors gracefully
  - _Requirements: 1.1, 1.2, 1.3, 8.1, 9.1, 9.4_

- [x] 3.1 Write property test for directory structure creation
  - **Property 2: Directory structure is created correctly**
  - **Validates: Requirements 1.1, 1.2**
  - Generate random books, save them, verify directory and book.json exist
  - _Requirements: 1.1, 1.2_

- [x] 3.2 Write property test for story file creation
  - **Property 3: Story files are created with correct slugs**
  - **Validates: Requirements 1.3**
  - Generate random stories, save them, verify files exist with correct slugs
  - _Requirements: 1.3_

- [x] 3.3 Write property test for slug conflict resolution
  - **Property 4: Slug conflicts are resolved with numeric suffixes**
  - **Validates: Requirements 1.4**
  - Create stories with identical titles, verify numeric suffixes are appended
  - _Requirements: 1.4_

- [x] 3.4 Write property test for JSON formatting
  - **Property 16: JSON files are formatted with proper indentation**
  - **Validates: Requirements 9.1**
  - Save files and verify they have 2-space indentation
  - _Requirements: 9.1_

- [x] 4. Checkpoint - Verify core file operations work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Phase 2: Git Integration - Implement GitService
  - Implement Git availability detection
  - Implement Git repository initialization
  - Implement Git commit creation with file staging
  - Implement Git history retrieval
  - Implement file revert to specific commit
  - Implement uncommitted changes detection
  - Handle Git unavailability gracefully (log warnings, continue)
  - Use simple-git library for Git operations
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 13.1, 13.2, 13.3, 13.4_

- [x] 5.1 Write property test for Git initialization
  - **Property 5: Git repository is initialized for new books**
  - **Validates: Requirements 2.1**
  - Create new book directories, verify .git directory exists (if Git available)
  - _Requirements: 2.1_

- [x] 5.2 Write property test for Git commits
  - **Property 6: Git commits are created on save**
  - **Validates: Requirements 2.2, 12.1, 12.2, 12.3, 12.4**
  - Save books/stories, verify Git commits exist with correct messages
  - _Requirements: 2.2, 12.1, 12.2, 12.3, 12.4_

- [x] 5.3 Write property test for batched commits
  - **Property 7: Multiple saves are batched into single commits**
  - **Validates: Requirements 2.3, 7.4**
  - Save multiple files together, verify only one commit created
  - _Requirements: 2.3, 7.4_

- [x] 5.4 Write property test for Git-optional behavior
  - **Property 18: System works without Git**
  - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
  - Simulate Git unavailable, verify file operations still work
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 6. Integrate Git into FileBasedStorageService
  - Add Git initialization when creating book directories
  - Add Git commits when saving book.json
  - Add Git commits when saving story files
  - Implement atomic commits for batch operations
  - Generate descriptive commit messages
  - _Requirements: 2.1, 2.2, 2.3, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 7. Implement RecoveryService for corruption handling
  - Implement corruption detection using ValidationService
  - Implement recovery option generation (revert, history, skip, repair)
  - Implement revert to last commit
  - Implement revert to specific commit
  - Implement automatic repair execution
  - Implement skip loading (continue with other data)
  - _Requirements: 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7.1 Write property test for recovery options
  - **Property 9: Recovery options are provided for corrupted files**
  - **Validates: Requirements 3.5, 4.1, 4.2, 4.3, 4.4**
  - Corrupt files, verify recovery options are offered
  - _Requirements: 3.5, 4.1, 4.2, 4.3, 4.4_

- [x] 8. Checkpoint - Verify Git and recovery work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Phase 3: Migration - Implement MigrationService
  - Implement old format detection (check for {bookId}.json files)
  - Implement backup creation (copy to books-backup/)
  - Implement single book migration (old JSON → new directory structure)
  - Implement batch migration (all books)
  - Implement migration validation (compare old and new data)
  - Implement rollback on failure (restore from backup)
  - Implement backup cleanup (delete after 30 days)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9.1 Write property test for migration round-trip
  - **Property 10: Migration preserves all data**
  - **Validates: Requirements 5.3, 10.1, 10.2, 10.3, 10.4, 10.5**
  - Generate random books in old format, migrate, verify data equivalence
  - _Requirements: 5.3, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 9.2 Write property test for migration backup
  - **Property 11: Migration creates backups**
  - **Validates: Requirements 5.4, 6.1**
  - Run migration, verify backup files exist
  - _Requirements: 5.4, 6.1_

- [x] 9.3 Write property test for migration rollback
  - **Property 12: Failed migration triggers automatic rollback**
  - **Validates: Requirements 6.2**
  - Simulate migration failure, verify automatic restore from backup
  - _Requirements: 6.2_

- [x] 10. Add migration detection and UI prompt on app start
  - Check for old format files on app initialization
  - Display migration prompt to user if old files detected
  - Execute migration when user accepts
  - Show migration progress
  - Handle migration errors with clear messages
  - _Requirements: 5.1, 5.2, 8.4_

- [x] 11. Checkpoint - Verify migration works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Phase 4: Lazy Loading - Implement LazyBook wrapper
  - Create LazyBook class extending Book
  - Implement lazy story loading (load on first access)
  - Implement story caching (keep loaded stories in memory)
  - Implement story metadata loading (without full story data)
  - Implement preload functionality for specific stories
  - Track which stories are loaded vs. not loaded
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 12.1 Write property test for lazy loading
  - **Property 13: Lazy loading loads only requested data**
  - **Validates: Requirements 7.1, 7.2**
  - Load book, verify only book.json read initially, stories loaded on access
  - _Requirements: 7.1, 7.2_

- [x] 13. Implement incremental save (only modified files)
  - Track which files have been modified since last save
  - Save only modified book.json or story files
  - Skip unchanged files
  - Batch all changes into single Git commit
  - _Requirements: 7.3, 7.4_

- [x] 13.1 Write property test for incremental save
  - **Property 14: Only modified files are saved**
  - **Validates: Requirements 7.3**
  - Modify one story, save book, verify only that story file is written
  - _Requirements: 7.3_

- [x] 14. Update BookCache to use FileBasedStorageService
  - Replace monolithic JSON loading with directory-based loading
  - Use LazyBook for all book instances
  - Update cache invalidation logic
  - Maintain backward compatibility during transition
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 15. Update StorageService to use new file-based storage
  - Update load() to use FileBasedStorageService
  - Update save() to use FileBasedStorageService
  - Update getBook() to return LazyBook instances
  - Update saveBook() to use incremental saves
  - Maintain backward compatibility with old API
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 15.1 Write property test for backward compatibility
  - **Property 19: Backward compatibility is maintained**
  - **Validates: Requirements 14.1, 14.2, 14.3**
  - Call old API methods, verify they work with new storage
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 16. Checkpoint - Verify lazy loading and incremental saves work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Phase 5: Integration - Add error handling and user-facing messages
  - Implement clear error messages for file operations
  - Implement clear error messages for validation failures
  - Implement clear error messages for Git operations
  - Implement clear error messages for migration failures
  - Add console logging for debugging
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 17.1 Write property test for error messages
  - **Property 15: Error messages identify specific files and errors**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
  - Trigger various errors, verify messages contain file paths and reasons
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 18. Add edge case handling
  - Handle books with no stories (create empty stories/ directory)
  - Handle stories with no scenes (save with empty scenes array)
  - Handle titles with only special characters (use UUID fallback)
  - Handle duplicate book titles (append numeric suffixes to directories)
  - Handle locked/inaccessible files (retry with exponential backoff)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 18.1 Write property test for edge cases
  - **Property 17: Edge cases are handled gracefully**
  - **Validates: Requirements 11.1, 11.2, 11.3**
  - Test empty books, empty stories, special character titles
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 19. Update FileSystemService to delegate to FileBasedStorageService
  - Update saveBookMetadata() to use new directory structure
  - Update loadBookMetadata() to use new directory structure
  - Update loadAllBooksMetadata() to use new directory structure
  - Update deleteBookMetadata() to use new directory structure
  - Maintain Electron compatibility
  - _Requirements: 14.1, 14.2, 14.3_

- [x] 20. Add recovery UI components
  - Create RecoveryDialog component for displaying recovery options
  - Show file path and validation errors
  - Show Git history with commit messages and dates
  - Allow user to select recovery action
  - Execute recovery and reload data
  - _Requirements: 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 21. Add migration UI components
  - ~~Create MigrationDialog component for migration prompt~~
  - ~~Show number of books to migrate~~
  - ~~Show migration progress~~
  - ~~Handle migration errors~~
  - ~~Show success/failure results~~
  - **Simplified approach:** Created standalone migration script (`migrate-to-file-storage.js`) instead of UI component
  - Created MIGRATION-GUIDE.md with instructions for single-user migration
  - _Requirements: 5.2, 8.4_

- [ ] 22. Run comprehensive integration tests
  - Test end-to-end book creation and loading
  - Test end-to-end story editing and saving
  - Test migration from old to new format
  - Test corruption detection and recovery
  - Test lazy loading performance
  - Test Git version control
  - Verify all 819 existing tests still pass
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 22.1 Write integration test for external editing
  - Create book, edit story file externally, reload, verify changes loaded
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 22.2 Write integration test for Git history
  - Create book, make edits, view history, revert to previous commit
  - _Requirements: 2.2, 4.2, 4.5_

- [ ]* 22.3 Write integration test for complete migration
  - Create books in old format, run migration, verify all data preserved
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 23. Performance optimization
  - Profile file I/O operations
  - Optimize JSON parsing (use streaming if needed)
  - Optimize Git operations (batch when possible)
  - Add caching for frequently accessed data
  - Measure and document performance improvements
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 24. Final checkpoint - Verify everything works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Documentation and cleanup
  - Update README with new storage structure
  - Document migration process for users
  - Document external editing guidelines
  - Document Git recovery procedures
  - Add JSDoc comments to all new services
  - Remove deprecated code
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

---

## Notes

### Implementation Strategy

**Incremental Development:**
- Build and test each phase independently
- Maintain backward compatibility until Phase 5
- Run existing tests after each phase to catch regressions
- Use feature flags to enable/disable new storage during development

**Testing Approach:**
- Write property-based tests for core logic (slug generation, validation, migration)
- Write integration tests for end-to-end workflows
- Maintain all existing unit tests
- Add manual testing for UI components

**Git Integration:**
- Use `simple-git` library for Node.js Git operations
- For Electron, use IPC to call Git commands from main process
- Gracefully handle Git unavailability (log warnings, continue)
- Set default Git config if not set: `user.name="Story Prompter"`, `user.email="app@storyprompt.local"`

**Migration Safety:**
- Always create backup before migration
- Validate each migrated book before marking as complete
- Rollback automatically on any failure
- Keep backup for 30 days (configurable)
- Provide manual rollback option in UI

**Performance Considerations:**
- Lazy load stories to avoid reading all files on startup
- Cache loaded stories in memory
- Save only modified files (track dirty state)
- Batch Git commits for multiple saves
- Use async file operations to avoid blocking UI

### Common Patterns

**Slug Generation:**
```typescript
const slug = title
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .substring(0, 50);
```

**File Path Construction:**
```typescript
const bookPath = `prompter-cache/books/${bookSlug}`;
const bookJsonPath = `${bookPath}/book.json`;
const storyPath = `${bookPath}/stories/${storySlug}.json`;
```

**Git Commit Messages:**
- Create book: `"Create book: {title}"`
- Add story: `"Add story: {title}"`
- Update story: `"Update story: {title}"`
- Delete story: `"Delete story: {title}"`
- Batch update: `"Update book: {summary}"`

**Error Handling:**
```typescript
try {
  // File operation
} catch (error) {
  console.error(`Failed to ${operation} ${filePath}:`, error);
  return {
    success: false,
    error: `Failed to ${operation} file: ${error.message}`
  };
}
```

### Success Metrics

- All books stored as directories with individual story files
- Git version control working (when available)
- Migration preserves 100% of data
- Lazy loading reduces initial load time by 50%+
- External editing works correctly
- All 819 existing tests pass
- All new property-based tests pass
- Manual testing confirms all features work

### Dependencies

**New Dependencies:**
- `simple-git` - Git operations from Node.js
- `fast-check` - Property-based testing library

**Installation:**
```bash
npm install simple-git
npm install --save-dev fast-check
```

