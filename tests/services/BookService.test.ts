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
    loadAllBooksMetadata: vi.fn(() => Promise.resolve([])),
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
      const book = await BookService.createBook({
        title: 'Test Book',
        description: 'A test book'
      });

      expect(book).toBeDefined();
      expect(book.title).toBe('Test Book');
      expect(book.description).toBe('A test book');
      expect(book.id).toBeDefined();
      expect(book.stories).toEqual([]);
    });

    it('should create a book with default values', async () => {
      const book = await BookService.createBook({
        title: 'Minimal Book'
      });

      expect(book.aspectRatio).toBe('9:16');
      expect(book.characters).toEqual([]);
      expect(book.stories).toEqual([]);
      expect(book.style).toBeDefined();
    });

    it('should generate a unique ID for each book', async () => {
      const book1 = await BookService.createBook({ title: 'Book 1' });
      const book2 = await BookService.createBook({ title: 'Book 2' });

      expect(book1.id).not.toBe(book2.id);
    });
  });

  describe('Book Retrieval', () => {
    it('should get a book by ID', async () => {
      const created = await BookService.createBook({ title: 'Test Book' });
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
      await BookService.createBook({ title: 'Book 1' });
      await BookService.createBook({ title: 'Book 2' });
      await BookService.createBook({ title: 'Book 3' });

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
      const book = await BookService.createBook({ title: 'Original Title' });
      
      book.title = 'Updated Title';
      book.description = 'New description';
      await BookService.saveBook(book);

      const retrieved = await BookService.getBook(book.id);
      expect(retrieved?.title).toBe('Updated Title');
      expect(retrieved?.description).toBe('New description');
    });

    it('should preserve book ID when saving', async () => {
      const book = await BookService.createBook({ title: 'Test Book' });
      const originalId = book.id;
      
      book.title = 'Updated';
      await BookService.saveBook(book);

      const retrieved = await BookService.getBook(originalId);
      expect(retrieved?.id).toBe(originalId);
    });

    it('should update book timestamp on save', async () => {
      const book = await BookService.createBook({ title: 'Test Book' });
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
      const book = await BookService.createBook({ title: 'To Delete' });
      
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
      const book = await BookService.createBook({ title: 'Active Book' });
      
      await BookService.setActiveBookId(book.id);
      const activeId = await BookService.getActiveBookId();

      expect(activeId).toBe(book.id);
    });

    it('should get active book', async () => {
      const book = await BookService.createBook({ title: 'Active Book' });
      await BookService.setActiveBookId(book.id);

      const activeBook = await BookService.getActiveBook();
      expect(activeBook?.id).toBe(book.id);
      expect(activeBook?.title).toBe('Active Book');
    });

    it('should return null when no active book is set', async () => {
      const activeBook = await BookService.getActiveBook();
      expect(activeBook).toBeNull();
    });

    it('should allow clearing active book', async () => {
      const book = await BookService.createBook({ title: 'Active Book' });
      await BookService.setActiveBookId(book.id);
      await BookService.setActiveBookId(null);

      const activeId = await BookService.getActiveBookId();
      expect(activeId).toBeNull();
    });
  });

  describe('Story Management', () => {
    it('should add a story to a book', async () => {
      const book = await BookService.createBook({ title: 'Test Book' });
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
      const book = await BookService.createBook({ title: 'Test Book' });
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
      const book = await BookService.createBook({ title: 'Test Book' });
      
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
      const book = await BookService.createBook({ title: 'Test Book' });
      
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
      const book = await BookService.createBook({ title: 'Test Book' });
      
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
      const book = await BookService.createBook({ title: 'Test Book' });
      
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
      const book = await BookService.createBook({ title: 'Valid Book' });
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
      const book = await BookService.createBook({ title: 'Empty Book' });
      const validation = book.validate();

      expect(validation.warnings).toContain('Book has no stories');
    });
  });

  describe('Cache Integration', () => {
    it('should store book in cache after creation', async () => {
      const book = await BookService.createBook({ title: 'Cached Book' });
      
      const cached = bookCache.get(book.id);
      expect(cached).toBeDefined();
      expect(cached?.title).toBe('Cached Book');
    });

    it('should update cache after saving', async () => {
      const book = await BookService.createBook({ title: 'Original' });
      
      book.title = 'Updated';
      await BookService.saveBook(book);

      const cached = bookCache.get(book.id);
      expect(cached?.title).toBe('Updated');
    });

    it('should remove from cache after deletion', async () => {
      const book = await BookService.createBook({ title: 'To Delete' });
      await BookService.deleteBook(book.id);

      const cached = bookCache.get(book.id);
      expect(cached).toBeNull();
    });
  });
});

