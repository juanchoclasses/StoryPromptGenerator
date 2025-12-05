# Design Document - Simple File-Based Storage

## Overview

This document outlines a simplified approach to splitting monolithic book JSON files into directories with separate story files. The design focuses on simplicity and uses existing FileSystemService APIs that already work.

**Design Goals:**
1. Split books into directories with separate story files
2. Make external editing easier
3. Use existing FileSystemService APIs (no new filesystem code)
4. Maintain backward compatibility with old format
5. No migration in the app - use standalone script instead

**Key Design Decisions:**
- Use Node.js `fs` module for one-time migration script (throwaway code)
- App uses existing FileSystemService APIs
- Support both old and new formats during transition
- New books always use new format
- Old books convert to new format when edited

## Architecture

### Current Architecture

```
prompter-cache/books/
├── {bookId-1}.json          # Monolithic book file
├── {bookId-2}.json
└── ...
```

### New Architecture

```
prompter-cache/books/
├── {book-slug-1}/           # Book directory
│   ├── book.json            # Book metadata
│   └── stories/
│       ├── {story-slug-1}.json
│       ├── {story-slug-2}.json
│       └── ...
├── {book-slug-2}/
│   └── ...
└── {old-bookId}.json        # Old format (during transition)
```

### File Format

**book.json:**
```json
{
  "id": "uuid",
  "title": "Book Title",
  "description": "...",
  "backgroundSetup": "...",
  "aspectRatio": "9:16",
  "style": { ... },
  "defaultLayout": { ... },
  "characters": [ ... ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**stories/{story-slug}.json:**
```json
{
  "id": "uuid",
  "title": "Story Title",
  "description": "...",
  "backgroundSetup": "...",
  "diagramStyle": "...",
  "layout": { ... },
  "characters": [ ... ],
  "elements": [ ... ],
  "scenes": [ ... ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Components and Interfaces

### 1. SlugService

**Purpose:** Generate filesystem-safe slugs from titles

```typescript
class SlugService {
  static generateSlug(title: string, fallbackPrefix: string = 'item'): string {
    if (!title || title.trim().length === 0) {
      return `${fallbackPrefix}-${crypto.randomUUID().slice(0, 8)}`;
    }
    
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    
    if (slug.length === 0) {
      return `${fallbackPrefix}-${crypto.randomUUID().slice(0, 8)}`;
    }
    
    return slug;
  }
  
  static generateUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string {
    let slug = baseSlug;
    let counter = 1;
    
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }
}
```

### 2. FileBasedStorageService

**Purpose:** Handle reading/writing books in directory format

```typescript
class FileBasedStorageService {
  // Save book to directory structure
  static async saveBook(book: Book): Promise<{ success: boolean; error?: string }> {
    const slug = SlugService.generateSlug(book.title, 'book');
    const bookPath = `prompter-cache/books/${slug}`;
    
    // Create directories
    await FileSystemService.createDirectory(bookPath);
    await FileSystemService.createDirectory(`${bookPath}/stories`);
    
    // Save book.json
    const bookData = {
      id: book.id,
      title: book.title,
      description: book.description,
      backgroundSetup: book.backgroundSetup,
      aspectRatio: book.aspectRatio,
      style: book.style,
      defaultLayout: book.defaultLayout,
      characters: book.characters,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    };
    await FileSystemService.writeFile(`${bookPath}/book.json`, JSON.stringify(bookData, null, 2));
    
    // Save each story
    const existingSlugs = new Set<string>();
    for (const story of book.stories) {
      const storySlug = SlugService.generateUniqueSlug(
        SlugService.generateSlug(story.title, 'story'),
        existingSlugs
      );
      existingSlugs.add(storySlug);
      
      const storyData = {
        id: story.id,
        title: story.title,
        description: story.description,
        backgroundSetup: story.backgroundSetup,
        diagramStyle: story.diagramStyle,
        layout: story.layout,
        characters: story.characters,
        elements: story.elements,
        scenes: story.scenes,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt
      };
      
      await FileSystemService.writeFile(
        `${bookPath}/stories/${storySlug}.json`,
        JSON.stringify(storyData, null, 2)
      );
    }
    
    return { success: true };
  }
  
  // Load book from directory structure
  static async loadBook(bookSlugOrId: string): Promise<Book | null> {
    // Try as slug first
    let bookPath = `prompter-cache/books/${bookSlugOrId}`;
    let bookJson = await FileSystemService.readFile(`${bookPath}/book.json`);
    
    // If not found, search by ID
    if (!bookJson) {
      const allDirs = await FileSystemService.listDirectories('prompter-cache/books');
      for (const dir of allDirs) {
        const json = await FileSystemService.readFile(`prompter-cache/books/${dir}/book.json`);
        if (json) {
          const data = JSON.parse(json);
          if (data.id === bookSlugOrId) {
            bookPath = `prompter-cache/books/${dir}`;
            bookJson = json;
            break;
          }
        }
      }
    }
    
    if (!bookJson) return null;
    
    const bookData = JSON.parse(bookJson);
    
    // Load all stories
    const storyFiles = await FileSystemService.listFiles(`${bookPath}/stories`);
    const stories = [];
    for (const file of storyFiles) {
      if (file.endsWith('.json')) {
        const storyJson = await FileSystemService.readFile(`${bookPath}/stories/${file}`);
        if (storyJson) {
          stories.push(JSON.parse(storyJson));
        }
      }
    }
    
    // Reconstruct book
    return new Book({
      ...bookData,
      stories
    });
  }
  
  // Check if path is a directory (new format) or file (old format)
  static async isDirectoryFormat(bookSlugOrId: string): Promise<boolean> {
    const bookJsonPath = `prompter-cache/books/${bookSlugOrId}/book.json`;
    return await FileSystemService.fileExists(bookJsonPath);
  }
}
```

### 3. StorageService Updates

**Purpose:** Add directory format suppo