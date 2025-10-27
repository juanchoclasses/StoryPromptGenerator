import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageService } from '../../src/services/StorageService';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';

describe('StorageService', () => {
  // Clear localStorage before and after each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should create empty data structure when no data exists', async () => {
      const data = await StorageService.load();
      
      expect(data.version).toBe('4.0.0');
      expect(data.books).toHaveLength(0);
      expect(data.activeBookId).toBeNull();
      expect(data.lastUpdated).toBeInstanceOf(Date);
    });

    it('should check if storage is initialized', () => {
      expect(StorageService.isInitialized()).toBe(false);
      
      StorageService.migrate();
      
      expect(StorageService.isInitialized()).toBe(true);
    });

    it('should initialize storage on migrate', async () => {
      StorageService.migrate();
      
      const data = await StorageService.load();
      expect(data.version).toBe('4.0.0');
      expect(data.books).toHaveLength(0);
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
      
      const retrieved = await StorageService.getBook(book.id);
      expect(retrieved!.title).toBe('Updated Title');
      expect(await StorageService.getBookCount()).toBe(1);
    });

    it('should delete a book', async () => {
      const book = new Book({ title: 'Test Book' });
      await StorageService.saveBook(book);
      
      const deleted = await StorageService.deleteBook(book.id);
      
      expect(deleted).toBe(true);
      expect(await StorageService.getBook(book.id)).toBeNull();
      expect(await StorageService.getBookCount()).toBe(0);
    });

    it('should return false when deleting non-existent book', async () => {
      const deleted = await StorageService.deleteBook('non-existent-id');
      expect(deleted).toBe(false);
    });

    it('should get all books', async () => {
      const book1 = new Book({ title: 'Book 1' });
      const book2 = new Book({ title: 'Book 2' });
      
      await StorageService.saveBook(book1);
      await StorageService.saveBook(book2);
      
      const allBooks = await StorageService.getAllBooks();
      expect(allBooks).toHaveLength(2);
      expect(allBooks.map(b => b.title)).toContain('Book 1');
      expect(allBooks.map(b => b.title)).toContain('Book 2');
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

    it('should throw error when setting non-existent book as active', async () => {
      await expect(async () => {
        await StorageService.setActiveBook('non-existent-id');
      }).rejects.toThrow('Book with ID non-existent-id not found');
    });

    it('should allow setting active book to null', async () => {
      const book = new Book({ title: 'Test Book' });
      await StorageService.saveBook(book);
      await StorageService.setActiveBook(book.id);
      
      await StorageService.setActiveBook(null);
      
      const activeBook = await StorageService.getActiveBook();
      expect(activeBook).toBeNull();
    });

    it('should clear active book when deleting active book', async () => {
      const book = new Book({ title: 'Active Book' });
      await StorageService.saveBook(book);
      await StorageService.setActiveBook(book.id);
      
      await StorageService.deleteBook(book.id);
      
      const activeBook = await StorageService.getActiveBook();
      expect(activeBook).toBeNull();
    });
  });

  describe('Complex Data Structures', () => {
    it('should handle books with stories and scenes', async () => {
      const story = new Story({
        title: 'Test Story',
        backgroundSetup: 'Background'
      });
      
      const book = new Book({
        title: 'Test Book'
      });
      book.addStory(story);
      
      await StorageService.saveBook(book);
      
      const loaded = await StorageService.getBook(book.id);
      expect(loaded).toBeDefined();
      expect(loaded!.stories).toHaveLength(1);
      expect(loaded!.stories[0].title).toBe('Test Story');
    });

    it('should preserve story and scene dates', async () => {
      const story = new Story({
        title: 'Test Story',
        backgroundSetup: 'Background'
      });
      const originalStoryDate = story.createdAt;
      
      const book = new Book({ title: 'Test Book' });
      book.addStory(story);
      
      await StorageService.saveBook(book);
      
      const loaded = await StorageService.getBook(book.id);
      expect(loaded!.stories[0].createdAt).toBeInstanceOf(Date);
      expect(loaded!.stories[0].createdAt.getTime()).toBe(originalStoryDate.getTime());
    });

    it('should handle book style configuration', async () => {
      const book = new Book({ title: 'Styled Book' });
      book.updateStyle({
        colorPalette: 'Vibrant colors',
        visualTheme: 'Fantasy',
        artStyle: 'Hand-painted'
      });
      
      await StorageService.saveBook(book);
      
      const loaded = await StorageService.getBook(book.id);
      expect(loaded!.style.colorPalette).toBe('Vibrant colors');
      expect(loaded!.style.visualTheme).toBe('Fantasy');
      expect(loaded!.style.artStyle).toBe('Hand-painted');
    });
  });

  describe('Migration', () => {
    it('should detect and clear old storage format', () => {
      // Simulate old storage keys
      localStorage.setItem('book-story-data-v2-someid', '{"old": "data"}');
      localStorage.setItem('book-collection-v1', '{"old": "collection"}');
      
      StorageService.migrate();
      
      // Old keys should be removed
      expect(localStorage.getItem('book-story-data-v2-someid')).toBeNull();
      expect(localStorage.getItem('book-collection-v1')).toBeNull();
      
      // New storage should be initialized
      expect(StorageService.isInitialized()).toBe(true);
    });

    it('should not affect other localStorage keys', () => {
      localStorage.setItem('some-other-app-data', 'important');
      
      StorageService.migrate();
      
      expect(localStorage.getItem('some-other-app-data')).toBe('important');
    });
  });

  describe('Storage Statistics', () => {
    it('should return correct storage statistics', async () => {
      const book1 = new Book({ title: 'Book 1' });
      const story1 = new Story({
        title: 'Story 1',
        backgroundSetup: 'Background'
      });
      book1.addStory(story1);
      
      const book2 = new Book({ title: 'Book 2' });
      const story2 = new Story({
        title: 'Story 2',
        backgroundSetup: 'Background'
      });
      book2.addStory(story2);
      
      await StorageService.saveBook(book1);
      await StorageService.saveBook(book2);
      
      const stats = await StorageService.getStorageStats();
      
      expect(stats.bookCount).toBe(2);
      expect(stats.totalStories).toBe(2);
      expect(stats.totalScenes).toBe(0);
      expect(stats.version).toBe('4.0.0');
      expect(stats.storageSize).toBeGreaterThan(0);
    });
  });

  describe('Utility Methods', () => {
    it('should export data as JSON string', async () => {
      const book = new Book({ title: 'Export Test' });
      await StorageService.saveBook(book);
      
      const exported = await StorageService.exportData();
      
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe('4.0.0');
      expect(parsed.books).toHaveLength(1);
    });

    it('should clear all storage', async () => {
      const book = new Book({ title: 'Test Book' });
      await StorageService.saveBook(book);
      
      StorageService.clearAll();
      
      expect(StorageService.isInitialized()).toBe(false);
      expect(await StorageService.getBookCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupt localStorage data gracefully', async () => {
      localStorage.setItem('prompter-app-data-v4', 'invalid json{{{');
      
      const data = await StorageService.load();
      
      // Should return empty data instead of crashing
      expect(data.books).toHaveLength(0);
      expect(data.version).toBe('4.0.0');
    });

    it('should return null for non-existent book', async () => {
      const book = await StorageService.getBook('non-existent');
      expect(book).toBeNull();
    });
  });
});

