/**
 * BookService Tests
 * 
 * Tests for the BookService class which provides CRUD operations for books.
 * This is a CRITICAL service (622 lines) that manages all book operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BookService } from '../../src/services/BookService';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';
import { Scene } from '../../src/models/Scene';
import { bookCache } from '../../src/services/BookCache';

// Mock the FileSystemService since we're testing BookService logic, not file I/O
vi.mock('../../src/services/FileSystemService', () => ({
  FileSystemService: {
    isConfigured: vi.fn(() => Promise.resolve(true)),
    ensureDirectoryExists: vi.fn(() => Promise.resolve()),
    writeJSON: vi.fn(() => Promise.resolve()),
    readJSON: vi.fn(() => Promise.resolve(null)),
    deleteFile: vi.fn(() => Promise.resolve()),
    listFiles: vi.fn(() => Promise.resolve([])),
    loadAllBooksMetadata: vi.fn(() => Promise.resolve(new Map())),
    loadAppMetadata: vi.fn(() => Promise.resolve(null)),
    saveAppMetadata: vi.fn(() => Promise.resolve()),
    deleteBookMetadata: vi.fn(() => Promise.resolve()),
    fileExists: vi.fn(() => Promise.resolve(false)),
  }
}));

describe('BookService', () => {
  beforeEach(async () => {
    // Clear the book cache before each test
    await bookCache.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await bookCache.clear();
  });

  describe('Book Creation', () => {
    it('should create a new book', async () => {
      const book = await BookService.createBook('Test Book', 'A test book');

      expect(book).toBeDefined();
      expect(book.title).toBe('Test Book');
      expect(book.description).toBe('A test book');
      expect(book.id).toBeDefined();
      expect(book.stories).toEqual([]);
    });

    it('should create a book with default values', async () => {
      const book = await BookService.createBook('Minimal Book');

      expect(book.aspectRatio).toBe('9:16');
      expect(book.characters).toEqual([]);
      expect(book.stories).toEqual([]);
      expect(book.style).toBeDefined();
    });

    it('should generate a unique ID for each book', async () => {
      const book1 = await BookService.createBook('Book 1');
      const book2 = await BookService.createBook('Book 2');

      expect(book1.id).not.toBe(book2.id);
    });
  });

  describe('Book Retrieval', () => {
    it('should get a book by ID', async () => {
      const created = await BookService.createBook('Test Book');
      const retrieved = await BookService.getBook(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Test Book');
    });

    it('should return null for non-existent book ID', async () => {
      const book = await BookService.getBook('non-existent-id');
      expect(book).toBeNull();
    });

    it('should get all books', async () => {
      await BookService.createBook('Book 1');
      await BookService.createBook('Book 2');
      await BookService.createBook('Book 3');

      const books = await BookService.getAllBooks();
      expect(books).toHaveLength(3);
      expect(books.map(b => b.title)).toEqual(['Book 1', 'Book 2', 'Book 3']);
    });

    it('should return empty array when no books exist', async () => {
      const books = await BookService.getAllBooks();
      expect(books).toEqual([]);
    });
  });

  describe('Book Updates', () => {
    it('should save an updated book', async () => {
      const book = await BookService.createBook('Original Title');
      
      book.title = 'Updated Title';
      book.description = 'New description';
      await BookService.saveBook(book);

      const retrieved = await BookService.getBook(book.id);
      expect(retrieved?.title).toBe('Updated Title');
      expect(retrieved?.description).toBe('New description');
    });

    it('should preserve book ID when saving', async () => {
      const book = await BookService.createBook('Test Book');
      const originalId = book.id;
      
      book.title = 'Updated';
      await BookService.saveBook(book);

      const retrieved = await BookService.getBook(originalId);
      expect(retrieved?.id).toBe(originalId);
    });

    it('should update book timestamp on save', async () => {
      const book = await BookService.createBook('Test Book');
      const originalTimestamp = book.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      book.title = 'Updated';
      await BookService.saveBook(book);

      const retrieved = await BookService.getBook(book.id);
      expect(retrieved?.updatedAt.getTime()).toBeGreaterThan(originalTimestamp.getTime());
    });
  });

  describe('Book Deletion', () => {
    it('should delete a book by ID', async () => {
      const book = await BookService.createBook('To Delete');
      
      await BookService.deleteBook(book.id);

      const retrieved = await BookService.getBook(book.id);
      expect(retrieved).toBeNull();
    });

    it('should not throw when deleting non-existent book', async () => {
      await expect(BookService.deleteBook('non-existent')).resolves.not.toThrow();
    });
  });

  describe('Active Book Management', () => {
    it('should set and get active book ID', async () => {
      const book = await BookService.createBook('Active Book');
      
      await BookService.setActiveBook(book.id);
      const activeId = await BookService.getActiveBookId();

      expect(activeId).toBe(book.id);
    });

    it('should get active book', async () => {
      const book = await BookService.createBook('Active Book');
      await BookService.setActiveBook(book.id);

      const activeBook = await BookService.getActiveBook();
      expect(activeBook?.id).toBe(book.id);
      expect(activeBook?.title).toBe('Active Book');
    });

    it('should return null when no active book is set', async () => {
      const activeBook = await BookService.getActiveBook();
      expect(activeBook).toBeNull();
    });

    it('should allow clearing active book', async () => {
      const book = await BookService.createBook('Active Book');
      await BookService.setActiveBook(book.id);
      await BookService.setActiveBook(null);

      const activeId = await BookService.getActiveBookId();
      expect(activeId).toBeNull();
    });
  });

  describe('Story Management', () => {
    it('should add a story to a book', async () => {
      const book = await BookService.createBook('Test Book');
      const story = new Story({
        title: 'Test Story',
        backgroundSetup: 'Setup'
      });

      book.addStory(story);
      await BookService.saveBook(book);

      const retrieved = await BookService.getBook(book.id);
      expect(retrieved?.stories).toHaveLength(1);
      expect(retrieved?.stories[0].title).toBe('Test Story');
    });

    it('should remove a story from a book', async () => {
      const book = await BookService.createBook('Test Book');
      const story = new Story({
        title: 'Test Story',
        backgroundSetup: 'Setup'
      });

      book.addStory(story);
      await BookService.saveBook(book);

      book.removeStory(story.id);
      await BookService.saveBook(book);

      const retrieved = await BookService.getBook(book.id);
      expect(retrieved?.stories).toHaveLength(0);
    });
  });

  describe('Book-level Character Management', () => {
    it('should add a character to a book', async () => {
      const book = await BookService.createBook('Test Book');
      
      book.addCharacter({
        name: 'Hero',
        description: 'The protagonist'
      });
      await BookService.saveBook(book);

      const retrieved = await BookService.getBook(book.id);
      expect(retrieved?.characters).toHaveLength(1);
      expect(retrieved?.characters[0].name).toBe('Hero');
    });

    it('should not allow duplicate character names', async () => {
      const book = await BookService.createBook('Test Book');
      
      book.addCharacter({
        name: 'Hero',
        description: 'The protagonist'
      });

      expect(() => {
        book.addCharacter({
          name: 'Hero',
          description: 'Another hero'
        });
      }).toThrow('already exists');
    });

    it('should delete a character from a book', async () => {
      const book = await BookService.createBook('Test Book');
      
      book.addCharacter({
        name: 'Hero',
        description: 'The protagonist'
      });
      await BookService.saveBook(book);

      book.deleteCharacter('Hero');
      await BookService.saveBook(book);

      const retrieved = await BookService.getBook(book.id);
      expect(retrieved?.characters).toHaveLength(0);
    });

    it('should find character by name (case-insensitive)', async () => {
      const book = await BookService.createBook('Test Book');
      
      book.addCharacter({
        name: 'Hero',
        description: 'The protagonist'
      });

      const found = book.findCharacterByName('hero');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Hero');
    });
  });

  describe('Book Validation', () => {
    it('should validate a valid book', async () => {
      const book = await BookService.createBook('Valid Book');
      const validation = book.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing title', () => {
      const book = new Book({ title: '', description: 'Test' });
      const validation = book.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Book title is required');
    });

    it('should warn about no stories', async () => {
      const book = await BookService.createBook('Empty Book');
      const validation = book.validate();

      expect(validation.warnings).toContain('Book has no stories');
    });
  });

  describe('Cache Integration', () => {
    it('should store book in cache after creation', async () => {
      const book = await BookService.createBook('Cached Book');
      
      const cached = bookCache.get(book.id);
      expect(cached).toBeDefined();
      expect(cached?.title).toBe('Cached Book');
    });

    it('should update cache after saving', async () => {
      const book = await BookService.createBook('Original');
      
      book.title = 'Updated';
      await BookService.saveBook(book);

      const cached = bookCache.get(book.id);
      expect(cached?.title).toBe('Updated');
    });

    it('should remove from cache after deletion', async () => {
      const book = await BookService.createBook('To Delete');
      await BookService.deleteBook(book.id);

      const cached = bookCache.get(book.id);
      expect(cached).toBeNull();
    });
  });

  describe('updateBook() method', () => {
    it('should update book title', async () => {
      const book = await BookService.createBook('Original Title');
      
      const updated = await BookService.updateBook(book.id, {
        title: 'New Title'
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('New Title');
    });

    it('should update book description', async () => {
      const book = await BookService.createBook('Test Book', 'Original description');
      
      const updated = await BookService.updateBook(book.id, {
        description: 'Updated description'
      });

      expect(updated?.description).toBe('Updated description');
    });

    it('should update book aspect ratio', async () => {
      const book = await BookService.createBook('Test Book');
      
      const updated = await BookService.updateBook(book.id, {
        aspectRatio: '16:9'
      });

      expect(updated?.aspectRatio).toBe('16:9');
    });

    it('should update book background setup', async () => {
      const book = await BookService.createBook('Test Book');
      
      const updated = await BookService.updateBook(book.id, {
        backgroundSetup: 'New background'
      });

      expect(updated?.backgroundSetup).toBe('New background');
    });

    it('should update panel config', async () => {
      const book = await BookService.createBook('Test Book');
      const newPanelConfig = {
        fontFamily: 'Arial',
        fontSize: 20,
        textAlign: 'left' as const,
        widthPercentage: 80,
        heightPercentage: 20,
        autoHeight: true,
        position: 'top-left' as const,
        backgroundColor: '#000000',
        fontColor: '#ffffff',
        borderColor: '#cccccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        gutterTop: 5,
        gutterBottom: 5,
        gutterLeft: 5,
        gutterRight: 5
      };
      
      const updated = await BookService.updateBook(book.id, {
        panelConfig: newPanelConfig
      });

      expect(updated?.style.panelConfig).toEqual(newPanelConfig);
    });

    it('should update multiple properties at once', async () => {
      const book = await BookService.createBook('Test Book');
      
      const updated = await BookService.updateBook(book.id, {
        title: 'New Title',
        description: 'New Description',
        aspectRatio: '4:3'
      });

      expect(updated?.title).toBe('New Title');
      expect(updated?.description).toBe('New Description');
      expect(updated?.aspectRatio).toBe('4:3');
    });

    it('should return null for non-existent book', async () => {
      const updated = await BookService.updateBook('non-existent', {
        title: 'New Title'
      });

      expect(updated).toBeNull();
    });

    it('should throw error on validation failure', async () => {
      const book = await BookService.createBook('Valid Book');
      
      await expect(
        BookService.updateBook(book.id, {
          title: '' // Invalid: empty title
        })
      ).rejects.toThrow('Cannot update book');
    });

    it('should set defaultLayout to undefined', async () => {
      const book = await BookService.createBook('Test Book');
      
      const updated = await BookService.updateBook(book.id, {
        defaultLayout: undefined
      });

      expect(updated?.defaultLayout).toBeUndefined();
    });
  });

  describe('Export and Import', () => {
    it('should export book as JSON string', async () => {
      const book = await BookService.createBook('Export Book', 'A book to export');
      const story = new Story({
        title: 'Test Story',
        backgroundSetup: 'Setup'
      });
      book.addStory(story);
      await BookService.saveBook(book);

      const exported = await BookService.exportBook(book.id);

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      
      const parsed = JSON.parse(exported!);
      expect(parsed.book.title).toBe('Export Book');
      expect(parsed.book.description).toBe('A book to export');
      expect(parsed.stories).toHaveLength(1);
    });

    it('should return null when exporting non-existent book', async () => {
      const exported = await BookService.exportBook('non-existent');
      expect(exported).toBeNull();
    });

    it('should import book from JSON string', async () => {
      const originalBook = await BookService.createBook('Original Book', 'Original description');
      const exportedJSON = await BookService.exportBook(originalBook.id);

      const importedBook = await BookService.importBook(exportedJSON!);

      expect(importedBook).toBeDefined();
      expect(importedBook?.title).toBe('Original Book');
      expect(importedBook?.description).toBe('Original description');
      expect(importedBook?.id).not.toBe(originalBook.id); // Should have new ID
    });

    it('should set imported book as active', async () => {
      const originalBook = await BookService.createBook('Original Book');
      const exportedJSON = await BookService.exportBook(originalBook.id);

      const importedBook = await BookService.importBook(exportedJSON!);
      const activeBookId = await BookService.getActiveBookId();

      expect(activeBookId).toBe(importedBook?.id);
    });

    it('should return null for invalid JSON', async () => {
      const importedBook = await BookService.importBook('invalid json');
      expect(importedBook).toBeNull();
    });

    it('should preserve stories during import', async () => {
      const book = await BookService.createBook('Test Book');
      const story1 = new Story({ title: 'Story 1', backgroundSetup: 'Setup 1' });
      const story2 = new Story({ title: 'Story 2', backgroundSetup: 'Setup 2' });
      book.addStory(story1);
      book.addStory(story2);
      await BookService.saveBook(book);

      const exportedJSON = await BookService.exportBook(book.id);
      const importedBook = await BookService.importBook(exportedJSON!);

      expect(importedBook?.stories).toHaveLength(2);
      expect(importedBook?.stories.map(s => s.title)).toEqual(['Story 1', 'Story 2']);
    });
  });

  describe('importBookInstance()', () => {
    it('should import a Book instance directly', async () => {
      const book = new Book({
        title: 'Direct Import Book',
        description: 'Imported directly'
      });
      const originalId = book.id;

      const importedBook = await BookService.importBookInstance(book);

      expect(importedBook).toBeDefined();
      expect(importedBook.title).toBe('Direct Import Book');
      expect(importedBook.id).not.toBe(originalId); // Should have new ID
    });

    it('should validate book before importing', async () => {
      const invalidBook = new Book({
        title: '', // Invalid: empty title
        description: 'Test'
      });

      await expect(
        BookService.importBookInstance(invalidBook)
      ).rejects.toThrow('Cannot import book');
    });

    it('should set imported book instance as active', async () => {
      const book = new Book({
        title: 'Instance Import',
        description: 'Test'
      });

      const importedBook = await BookService.importBookInstance(book);
      const activeBookId = await BookService.getActiveBookId();

      expect(activeBookId).toBe(importedBook.id);
    });
  });

  describe('Storage Statistics', () => {
    it('should get storage statistics', async () => {
      await BookService.createBook('Book 1');
      await BookService.createBook('Book 2');

      const stats = await BookService.getStorageStats();

      expect(stats).toBeDefined();
      expect(stats.bookCount).toBe(2);
      expect(stats.version).toBeDefined();
      expect(stats.storageSize).toBeGreaterThanOrEqual(0);
    });

    it('should count total stories across all books', async () => {
      const book1 = await BookService.createBook('Book 1');
      const book2 = await BookService.createBook('Book 2');
      
      book1.addStory(new Story({ title: 'Story 1', backgroundSetup: 'Setup' }));
      book1.addStory(new Story({ title: 'Story 2', backgroundSetup: 'Setup' }));
      book2.addStory(new Story({ title: 'Story 3', backgroundSetup: 'Setup' }));
      
      await BookService.saveBook(book1);
      await BookService.saveBook(book2);

      const stats = await BookService.getStorageStats();

      expect(stats.totalStories).toBe(3);
    });
  });

  describe('Book Collection', () => {
    it('should get book collection with metadata', async () => {
      await BookService.createBook('Book 1', 'First book');
      await BookService.createBook('Book 2', 'Second book');

      const collection = await BookService.getBookCollection();

      expect(collection).toBeDefined();
      expect(collection.books).toHaveLength(2);
      expect(collection.books[0].title).toBe('Book 1');
      expect(collection.books[1].title).toBe('Book 2');
      expect(collection.lastUpdated).toBeInstanceOf(Date);
    });

    it('should include story counts in collection', async () => {
      const book = await BookService.createBook('Test Book');
      book.addStory(new Story({ title: 'Story 1', backgroundSetup: 'Setup' }));
      book.addStory(new Story({ title: 'Story 2', backgroundSetup: 'Setup' }));
      await BookService.saveBook(book);

      const collection = await BookService.getBookCollection();

      expect(collection.books[0].storyCount).toBe(2);
    });

    it('should include active book ID in collection', async () => {
      const book = await BookService.createBook('Active Book');
      await BookService.setActiveBook(book.id);

      const collection = await BookService.getBookCollection();

      expect(collection.activeBookId).toBe(book.id);
    });

    it('should handle empty book collection', async () => {
      const collection = await BookService.getBookCollection();

      expect(collection.books).toEqual([]);
      expect(collection.activeBookId).toBeNull();
    });
  });

  describe('Character Usage Tracking', () => {
    it('should track character usage across stories', async () => {
      const book = await BookService.createBook('Test Book');
      
      const story1 = new Story({ title: 'Story 1', backgroundSetup: 'Setup' });
      story1.addCharacter({ name: 'Hero', description: 'Main character' });
      const scene1 = new Scene({ title: 'Scene 1', textPanel: 'Text', characters: ['Hero'] });
      story1.addScene(scene1);
      
      const story2 = new Story({ title: 'Story 2', backgroundSetup: 'Setup' });
      story2.addCharacter({ name: 'Hero', description: 'Main character' });
      const scene2 = new Scene({ title: 'Scene 2', textPanel: 'Text', characters: ['Hero'] });
      story2.addScene(scene2);
      
      book.addStory(story1);
      book.addStory(story2);

      const usage = BookService.getCharacterUsageInBook(book, 'Hero');

      expect(usage.storiesUsing).toHaveLength(2);
      expect(usage.totalSceneCount).toBe(2);
      expect(usage.storiesUsing[0].sceneCount).toBe(1);
      expect(usage.storiesUsing[1].sceneCount).toBe(1);
    });

    it('should handle character not used in any story', async () => {
      const book = await BookService.createBook('Test Book');
      const story = new Story({ title: 'Story 1', backgroundSetup: 'Setup' });
      book.addStory(story);

      const usage = BookService.getCharacterUsageInBook(book, 'NonExistent');

      expect(usage.storiesUsing).toHaveLength(0);
      expect(usage.totalSceneCount).toBe(0);
    });

    it('should be case-insensitive when tracking character usage', async () => {
      const book = await BookService.createBook('Test Book');
      const story = new Story({ title: 'Story 1', backgroundSetup: 'Setup' });
      story.addCharacter({ name: 'Hero', description: 'Main character' });
      const scene = new Scene({ title: 'Scene 1', textPanel: 'Text', characters: ['Hero'] });
      story.addScene(scene);
      book.addStory(story);

      const usage = BookService.getCharacterUsageInBook(book, 'hero'); // lowercase

      expect(usage.storiesUsing).toHaveLength(1);
      expect(usage.totalSceneCount).toBe(1);
    });

    it('should count multiple scenes with same character', async () => {
      const book = await BookService.createBook('Test Book');
      const story = new Story({ title: 'Story 1', backgroundSetup: 'Setup' });
      story.addCharacter({ name: 'Hero', description: 'Main character' });
      const scene1 = new Scene({ title: 'Scene 1', textPanel: 'Text', characters: ['Hero'] });
      const scene2 = new Scene({ title: 'Scene 2', textPanel: 'Text', characters: ['Hero'] });
      story.addScene(scene1);
      story.addScene(scene2);
      book.addStory(story);

      const usage = BookService.getCharacterUsageInBook(book, 'Hero');

      expect(usage.storiesUsing).toHaveLength(1);
      expect(usage.totalSceneCount).toBe(2);
      expect(usage.storiesUsing[0].sceneCount).toBe(2);
    });
  });

  describe('First Book Auto-Activation', () => {
    it('should automatically set first book as active', async () => {
      const book = await BookService.createBook('First Book');
      const activeBookId = await BookService.getActiveBookId();

      expect(activeBookId).toBe(book.id);
    });

    it('should not change active book when creating second book', async () => {
      const book1 = await BookService.createBook('First Book');
      const book2 = await BookService.createBook('Second Book');
      const activeBookId = await BookService.getActiveBookId();

      expect(activeBookId).toBe(book1.id);
      expect(activeBookId).not.toBe(book2.id);
    });
  });
});

