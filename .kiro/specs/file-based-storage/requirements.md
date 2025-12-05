# Requirements Document - Simple File-Based Storage

## Introduction

Currently, each book is saved as a single monolithic JSON file: `prompter-cache/books/{bookId}.json`. This makes it difficult to edit individual stories externally.

**Goal:** Split books into directories where each story is a separate JSON file, making external editing easier.

**Current State:**
```
prompter-cache/books/
├── {bookId-1}.json          # Entire book in one file
├── {bookId-2}.json
└── ...
```

**Desired State:**
```
prompter-cache/books/
├── {book-slug-1}/
│   ├── book.json            # Book metadata only
│   └── stories/
│       ├── {story-slug-1}.json
│       ├── {story-slug-2}.json
│       └── ...
└── {book-slug-2}/
    └── ...
```

**Scope:**
- Change how NEW books are saved (no migration of existing books)
- Use existing FileSystemService APIs that already work
- Keep it simple - no Git, no validation, no lazy loading

## Glossary

- **Book Directory**: A directory representing a single book, named using a slug derived from the book title
- **Story File**: An individual JSON file containing a single story's data
- **Book Metadata File**: A `book.json` file containing book-level information (title, description, characters, settings)
- **Slug**: A URL-safe identifier derived from a title (lowercase, hyphens instead of spaces, no special characters, max 50 chars)

## Requirements

### Requirement 1: Directory Structure

**User Story:** As a developer, I want each book stored as a directory with individual story files, so that I can edit stories externally without parsing the entire book.

#### Acceptance Criteria

1. WHEN a book is saved THEN the system SHALL create a directory named `prompter-cache/books/{book-slug}/`
2. WHEN a book is saved THEN the system SHALL create a `book.json` file containing book metadata (title, description, backgroundSetup, aspectRatio, style, characters, defaultLayout)
3. WHEN a story is saved THEN the system SHALL create an individual file at `stories/{story-slug}.json` within the book directory
4. WHEN a story slug conflicts with an existing file THEN the system SHALL append a numeric suffix (e.g., `story-1.json`, `story-2.json`)
5. WHEN generating slugs THEN the system SHALL convert titles to lowercase, replace spaces with hyphens, remove special characters, and limit to 50 characters

### Requirement 2: Slug Generation

**User Story:** As a developer, I want filesystem-safe slugs generated from titles, so that directories and files have readable names.

#### Acceptance Criteria

1. WHEN generating a slug from a title THEN the system SHALL convert to lowercase
2. WHEN generating a slug THEN the system SHALL replace spaces with hyphens
3. WHEN generating a slug THEN the system SHALL remove all special characters except hyphens
4. WHEN generating a slug THEN the system SHALL limit length to 50 characters
5. WHEN a title is empty or only special characters THEN the system SHALL use a fallback slug with UUID

### Requirement 3: File Format

**User Story:** As a user, I want JSON files to be human-readable, so that I can understand and edit them externally.

#### Acceptance Criteria

1. WHEN JSON files are saved THEN the system SHALL format them with 2-space indentation
2. WHEN book.json is saved THEN the system SHALL include id, title, description, backgroundSetup, aspectRatio, style, defaultLayout, characters, createdAt, updatedAt
3. WHEN a story file is saved THEN the system SHALL include id, title, description, backgroundSetup, diagramStyle, layout, characters, elements, scenes, createdAt, updatedAt
4. WHEN files are saved THEN the system SHALL use the same format as current monolithic files (for compatibility)
5. WHEN loading files THEN the system SHALL support both old monolithic format and new directory format

### Requirement 4: Backward Compatibility

**User Story:** As a user, I want existing books to continue working, so that I don't lose my data.

#### Acceptance Criteria

1. WHEN the app starts THEN the system SHALL load books from both old format (single JSON) and new format (directories)
2. WHEN loading a book by ID THEN the system SHALL check both old and new locations
3. WHEN saving an existing old-format book THEN the system SHALL save it in the new directory format
4. WHEN all books are in new format THEN the system SHALL continue working normally
5. WHEN a book exists in both formats THEN the system SHALL prefer the newer format

### Requirement 5: Edge Cases

**User Story:** As a developer, I want the system to handle edge cases, so that unusual data doesn't break the app.

#### Acceptance Criteria

1. WHEN a book has no stories THEN the system SHALL create an empty `stories/` directory
2. WHEN a story has no scenes THEN the system SHALL save the story file with an empty scenes array
3. WHEN a title contains only special characters THEN the system SHALL generate a fallback slug (e.g., `book-{uuid}`)
4. WHEN multiple books have identical titles THEN the system SHALL append numeric suffixes to directory names
5. WHEN a file write fails THEN the system SHALL log the error and return a clear error message

### Requirement 6: One-Time Migration Script

**User Story:** As a developer, I want a standalone migration script to convert existing books once, so that I can test the new code against migrated data safely.

#### Acceptance Criteria

1. WHEN the migration script runs THEN the system SHALL create a standalone TypeScript console app (not part of main app)
2. WHEN the script runs THEN the system SHALL read old-format JSON files using Node.js fs module
3. WHEN the script runs THEN the system SHALL write new directory structure using Node.js fs module
4. WHEN the script runs THEN the system SHALL create a backup before making any changes
5. WHEN migration completes THEN the script SHALL be deleted (throwaway code for one-time use)

### Requirement 7: No In-App Migration

**User Story:** As a user, I don't want automatic migration in the app, so that I can avoid data loss risks.

#### Acceptance Criteria

1. WHEN the app starts THEN the system SHALL NOT automatically migrate existing books
2. WHEN old-format books exist THEN the system SHALL continue loading them normally
3. WHEN a user edits an old-format book THEN the system SHALL save it in the new format
4. WHEN a user creates a new book THEN the system SHALL save it in the new format
5. WHEN all books are in new format THEN the old-format loading code can be removed

## Out of Scope

The following features are explicitly OUT OF SCOPE for this simple implementation:

- ❌ Git version control
- ❌ Corruption detection and recovery
- ❌ JSON validation
- ❌ Lazy loading of stories
- ❌ Automatic migration of existing books
- ❌ Backup and rollback functionality
- ❌ Incremental saves (save only modified files)

These can be added later if needed, but are not part of the initial simple implementation.
