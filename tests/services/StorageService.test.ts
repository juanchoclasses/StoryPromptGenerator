import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../../src/services/StorageService';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';
import { bookCache } from '../../src/services/BookCache';

/**
 * StorageService Tests (v5.0+)
 * 
 * StorageService is now a thin wrapper around BookCache + FileSystemService.
 * These tests verify the StorageService API works correctly.
 * 
 * Note: BookCache has its own comprehensive test suite (BookCacheSerialization.test.ts)
 */

describe('StorageService (v5.0)', () => {
  beforeEach(async () => {
    // Clear the book cache before each test
    bookCache.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    bookCache.clear();
  });

  describe('Initialization', () => {
    it('should create empty data structure when no books exist', async () => {
      const data = await StorageService.load();
      
      expect(data.version).toBe('5.0.0');
      expect(data.books).toHaveLength(0);
      expect(data.activeBookId).toBeNull();
      expect(data.lastUpdated).toBeInstanceOf(Date);
    });

    it('should check if storage is initialized', async () => {
      // Initially no books
      const initializedBefore = await StorageService.isInitialized();
      expect(initializedBefore).toBe(false);
      
      // Add a book
      const book = new Book({ title: 'Test Book' });
      await StorageService.saveBook(book);
      
      // Now initialized
      const initializedAfter = await StorageService.isInitialized();
      expect(initializedAfter).toBe(true);
    });
  });

  describe('Save and Load', () => {
    it('should save and load app data', async () => {
      const book = new Book({
        title: 'Test Book',
        description: 'A test book'
      });
      
      await StorageService.saveBook(book);
      
      const loaded = await StorageService.load();
      expect(loaded.books).toHaveLength(1);
      expect(loaded.books[0].title).toBe('Test Book');
    });

    it('should preserve dates when saving and loading', async () => {
      const book = new Book({
        title: 'Test Book'
      });
      
      const originalCreatedAt = book.createdAt;
      await StorageService.saveBook(book);
      
      const loaded = await StorageService.getBook(book.id);
      expect(loaded).toBeDefined();
      expect(loaded!.createdAt).toBeInstanceOf(Date);
      expect(loaded!.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    it('should update lastUpdated timestamp on save', async () => {
      const book = new Book({ title: 'Test Book' });
      const beforeSave = new Date();
      
      await StorageService.saveBook(book);
      
      const loaded = await StorageService.load();
      expect(loaded.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    });
  });

  describe('Book CRUD Operations', () => {
    it('should save a new book', async () => {
      const book = new Book({
        title: 'New Book',
        description: 'Description'
      });
      
      await StorageService.saveBook(book);
      
      const retrieved = await StorageService.getBook(book.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.title).toBe('New Book');
    });

    it('should update an existing book', async () => {
      const book = new Book({ title: 'Original Title' });
      await StorageService.saveBook(book);
      
      book.title = 'Updated Title';
      await StorageService.saveBook(book);
      
      const count = await StorageService.getBookCount();
      expect(count).toBe(1); // Should still be 1, not 2
      
      const retrieved = await StorageService.getBook(book.id);
      expect(retrieved!.title).toBe('Updated Title');
    });

    it('should delete a book', async () => {
      const book = new Book({ title: 'To Delete' });
      await StorageService.saveBook(book);
      
      await StorageService.deleteBook(book.id);
      
      const retrieved = await StorageService.getBook(book.id);
      expect(retrieved).toBeNull();
      
      const count = await StorageService.getBookCount();
      expect(count).toBe(0);
    });

    it('should get all books', async () => {
      const book1 = new Book({ title: 'Book 1' });
      const book2 = new Book({ title: 'Book 2' });
      
      await StorageService.saveBook(book1);
      await StorageService.saveBook(book2);
      
      const books = await StorageService.getAllBooks();
      expect(books).toHaveLength(2);
      expect(books.map(b => b.title).sort()).toEqual(['Book 1', 'Book 2']);
    });

    it('should get book count', async () => {
      expect(await StorageService.getBookCount()).toBe(0);
      
      await StorageService.saveBook(new Book({ title: 'Book 1' }));
      expect(await StorageService.getBookCount()).toBe(1);
      
      await StorageService.saveBook(new Book({ title: 'Book 2' }));
      expect(await StorageService.getBookCount()).toBe(2);
    });
  });

  describe('Active Book Management', () => {
    it('should set and get active book', async () => {
      const book = new Book({ title: 'Active Book' });
      await StorageService.saveBook(book);
      
      await StorageService.setActiveBook(book.id);
      
      const activeBook = await StorageService.getActiveBook();
      expect(activeBook).toBeDefined();
      expect(activeBook!.id).toBe(book.id);
    });

    it('should return null when no active book set', async () => {
      const activeBook = await StorageService.getActiveBook();
      expect(activeBook).toBeNull();
    });

    it('should clear active book', async () => {
      const book = new Book({ title: 'Active Book' });
      await StorageService.saveBook(book);
      await StorageService.setActiveBook(book.id);
      
      await StorageService.setActiveBook(null);
      
      const activeBook = await StorageService.getActiveBook();
      expect(activeBook).toBeNull();
    });
  });

  describe('Storage Statistics', () => {
    it('should return correct storage statistics', async () => {
      const book1 = new Book({ title: 'Book 1' });
      const story1 = new Story({ title: 'Story 1' });
      book1.stories.push(story1);
      
      const book2 = new Book({ title: 'Book 2' });
      
      await StorageService.saveBook(book1);
      await StorageService.saveBook(book2);
      
      const stats = await StorageService.getStorageStats();
      
      expect(stats.bookCount).toBe(2);
      expect(stats.totalStories).toBe(1);
      expect(stats.totalScenes).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    it('should export data as JSON string', async () => {
      const book = new Book({ title: 'Export Test' });
      await StorageService.saveBook(book);
      
      const exported = await StorageService.exportData();
      
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe('5.0.0');
      expect(parsed.books).toHaveLength(1);
    });

    it('should clear all storage', async () => {
      const book = new Book({ title: 'To Clear' });
      await StorageService.saveBook(book);
      
      StorageService.clearAll();
      
      expect(await StorageService.isInitialized()).toBe(false);
      expect(await StorageService.getBookCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle getting non-existent book', async () => {
      const book = await StorageService.getBook('non-existent-id');
      expect(book).toBeNull();
    });

    it('should handle deleting non-existent book', async () => {
      // Should not throw
      await expect(StorageService.deleteBook('non-existent-id')).resolves.not.toThrow();
    });
  });
});
