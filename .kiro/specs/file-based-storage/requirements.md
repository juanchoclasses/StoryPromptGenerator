# Requirements Document - File-Based Storage Migration

## Introduction

The current storage system saves each book as a single monolithic JSON file in `prompter-cache/books/{bookId}.json`. This makes external editing difficult and error-prone. This specification defines a migration to a file-based storage structure where each book is a directory containing individual files for stories, with Git-based versioning for data integrity and recovery.

**Current State:**
- Books stored as single JSON files: `prompter-cache/books/{bookId}.json`
- Entire book must be loaded/saved as one unit
- No version history or corruption recovery
- Difficult to edit stories externally (must parse entire book JSON)
- No validation when files are edited externally

**Desired State:**
- Each book is a directory: `prompter-cache/books/{book-slug}/`
- Individual story files: `{book-slug}/stories/{story-slug}.json`
- Book metadata file: `{book-slug}/book.json`
- Git repository per book for version control
- Automatic validation on load with recovery options
- Easy external editing of individual stories

**Benefits:**
- External editors can modify individual stories without touching entire book
- Git provides automatic versioning and corruption recovery
- Easier to track changes and collaborate
- Better performance (load only needed stories)
- Automatic backup through Git history

## Glossary

- **Book Directory**: A directory representing a single book, named using a slug derived from the book title
- **Story File**: An individual JSON file containing a single story's data
- **Book Metadata File**: A `book.json` file containing book-level information (title, description, characters, settings)
- **Slug**: A URL-safe identifier derived from a title (lowercase, hyphens instead of spaces, no special characters)
- **Git Repository**: A version control repository initialized in each book directory
- **Validation**: Process of checking JSON structure and data integrity when loading files
- **Corruption Recovery**: Process of offering user options to revert to previous Git commits when validation fails
- **Migration**: Process of converting existing monolithic JSON files to new directory structure
- **Atomic Save**: Saving all related files (book.json + story files) in a single Git commit

## Requirements

### Requirement 1

**User Story:** As a developer, I want each book stored as a directory with individual story files, so that I can edit stories externally without parsing the entire book.

#### Acceptance Criteria

1. WHEN a book is saved THEN the system SHALL create a directory named `prompter-cache/books/{book-slug}/`
2. WHEN a book is saved THEN the system SHALL create a `book.json` file containing book metadata (title, description, backgroundSetup, aspectRatio, style, characters, defaultLayout)
3. WHEN a story is saved THEN the system SHALL create an individual file at `stories/{story-slug}.json` within the book directory
4. WHEN a story slug conflicts with an existing file THEN the system SHALL append a numeric suffix (e.g., `story-1.json`, `story-2.json`)
5. WHEN generating slugs THEN the system SHALL convert titles to lowercase, replace spaces with hyphens, remove special characters, and limit to 50 characters

### Requirement 2

**User Story:** As a developer, I want Git version control for each book, so that I can track changes and recover from corruption.

#### Acceptance Criteria

1. WHEN a book directory is created THEN the system SHALL initialize a Git repository in that directory
2. WHEN book or story files are saved THEN the system SHALL create a Git commit with a descriptive message
3. WHEN multiple files are saved together THEN the system SHALL group them into a single atomic commit
4. WHEN a book is loaded THEN the system SHALL verify the Git repository exists and is valid
5. WHEN Git operations fail THEN the system SHALL log errors but continue operation (Git is enhancement, not requirement)

### Requirement 3

**User Story:** As a user, I want automatic validation when loading books, so that I know if external edits caused corruption.

#### Acceptance Criteria

1. WHEN a book is loaded THEN the system SHALL validate the `book.json` file structure
2. WHEN a story is loaded THEN the system SHALL validate the story JSON file structure
3. WHEN validation fails THEN the system SHALL identify which file is corrupted
4. WHEN validation fails THEN the system SHALL check if the file has uncommitted changes in Git
5. WHEN validation detects corruption THEN the system SHALL present recovery options to the user

### Requirement 4

**User Story:** As a user, I want recovery options when corruption is detected, so that I can restore my data without losing work.

#### Acceptance Criteria

1. WHEN a corrupted file is detected THEN the system SHALL offer to revert to the last Git commit
2. WHEN a corrupted file is detected THEN the system SHALL offer to view the Git history and select a specific commit
3. WHEN a corrupted file is detected THEN the system SHALL offer to skip loading that file and continue with other data
4. WHEN a corrupted file is detected THEN the system SHALL offer to attempt automatic repair (if possible)
5. WHEN the user selects a recovery option THEN the system SHALL execute it and reload the data

### Requirement 5

**User Story:** As a developer, I want automatic migration from the old format, so that existing users don't lose data.

#### Acceptance Criteria

1. WHEN the app starts THEN the system SHALL detect if old-format book files exist
2. WHEN old-format files are detected THEN the system SHALL offer to migrate them to the new format
3. WHEN migration is initiated THEN the system SHALL convert each `{bookId}.json` file to a book directory structure
4. WHEN migration is complete THEN the system SHALL create a backup of the old files in `prompter-cache/books-backup/`
5. WHEN migration is complete THEN the system SHALL delete the old monolithic JSON files

### Requirement 6

**User Story:** As a developer, I want the migration to be reversible, so that I can roll back if issues occur.

#### Acceptance Criteria

1. WHEN migration starts THEN the system SHALL create a complete backup of all existing book files
2. WHEN migration fails THEN the system SHALL restore from backup automatically
3. WHEN migration completes THEN the system SHALL keep the backup for 30 days
4. WHEN the user requests rollback THEN the system SHALL restore from backup and delete new directories
5. WHEN backup restoration occurs THEN the system SHALL verify data integrity before completing

### Requirement 7

**User Story:** As a developer, I want efficient loading and saving, so that performance doesn't degrade with the new structure.

#### Acceptance Criteria

1. WHEN loading a book THEN the system SHALL load only the `book.json` file initially (lazy load stories)
2. WHEN a story is needed THEN the system SHALL load that specific story file on demand
3. WHEN saving a book THEN the system SHALL save only modified files (not all files)
4. WHEN saving multiple stories THEN the system SHALL batch writes into a single Git commit
5. WHEN the cache is populated THEN the system SHALL keep loaded stories in memory to avoid repeated file reads

### Requirement 8

**User Story:** As a developer, I want clear error messages, so that I can debug issues with the file structure.

#### Acceptance Criteria

1. WHEN a file cannot be read THEN the system SHALL report the specific file path and error reason
2. WHEN validation fails THEN the system SHALL report which fields are invalid and why
3. WHEN Git operations fail THEN the system SHALL report the Git error message
4. WHEN migration fails THEN the system SHALL report which book failed and the error details
5. WHEN errors occur THEN the system SHALL log detailed information to the console for debugging

### Requirement 9

**User Story:** As a user, I want the file structure to be human-readable, so that I can understand and edit files externally.

#### Acceptance Criteria

1. WHEN JSON files are saved THEN the system SHALL format them with 2-space indentation
2. WHEN JSON files are saved THEN the system SHALL include comments (where JSON5 is supported) explaining structure
3. WHEN directory names are created THEN the system SHALL use readable slugs derived from titles
4. WHEN the file structure is viewed THEN the system SHALL follow a clear hierarchy: `books/{book-slug}/stories/{story-slug}.json`
5. WHEN metadata is saved THEN the system SHALL separate concerns (book metadata vs story content)

### Requirement 10

**User Story:** As a developer, I want comprehensive data migration testing, so that I can ensure no data is lost during migration.

#### Acceptance Criteria

1. WHEN migration is tested THEN the system SHALL verify all books are migrated
2. WHEN migration is tested THEN the system SHALL verify all stories are migrated
3. WHEN migration is tested THEN the system SHALL verify all scenes are migrated
4. WHEN migration is tested THEN the system SHALL verify all characters and elements are preserved
5. WHEN migration is tested THEN the system SHALL verify all image references remain valid

### Requirement 11

**User Story:** As a developer, I want the system to handle edge cases, so that unusual data doesn't break the migration.

#### Acceptance Criteria

1. WHEN a book has no stories THEN the system SHALL create an empty `stories/` directory
2. WHEN a story has no scenes THEN the system SHALL save the story file with an empty scenes array
3. WHEN a title contains only special characters THEN the system SHALL generate a fallback slug (e.g., `book-{uuid}`)
4. WHEN multiple books have identical titles THEN the system SHALL append numeric suffixes to directory names
5. WHEN a file is locked or inaccessible THEN the system SHALL retry with exponential backoff before failing

### Requirement 12

**User Story:** As a developer, I want Git commit messages to be descriptive, so that I can understand the history.

#### Acceptance Criteria

1. WHEN a book is created THEN the system SHALL commit with message "Create book: {title}"
2. WHEN a story is added THEN the system SHALL commit with message "Add story: {title}"
3. WHEN a story is updated THEN the system SHALL commit with message "Update story: {title}"
4. WHEN a story is deleted THEN the system SHALL commit with message "Delete story: {title}"
5. WHEN multiple changes occur THEN the system SHALL commit with message "Update book: {summary of changes}"

### Requirement 13

**User Story:** As a developer, I want the system to work without Git if unavailable, so that the app remains functional in all environments.

#### Acceptance Criteria

1. WHEN Git is not installed THEN the system SHALL detect this and disable Git features
2. WHEN Git is disabled THEN the system SHALL still save and load files normally
3. WHEN Git is disabled THEN the system SHALL not show Git-related recovery options
4. WHEN Git is disabled THEN the system SHALL log a warning but continue operation
5. WHEN Git becomes available THEN the system SHALL automatically enable Git features on next save

### Requirement 14

**User Story:** As a developer, I want backward compatibility with the old storage API, so that existing code continues to work during transition.

#### Acceptance Criteria

1. WHEN the old API is called THEN the system SHALL translate calls to the new file-based storage
2. WHEN loading a book by ID THEN the system SHALL find the book directory and load all files
3. WHEN saving a book THEN the system SHALL save to the new directory structure
4. WHEN the migration is complete THEN the system SHALL remove backward compatibility shims
5. WHEN both old and new formats exist THEN the system SHALL prefer the new format

