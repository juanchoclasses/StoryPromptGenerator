import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BookCache } from '../../src/services/BookCache';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';
import { Scene } from '../../src/models/Scene';
import { FileSystemService } from '../../src/services/FileSystemService';

// Mock FileSystemService
vi.mock('../../src/services/FileSystemService', () => ({
  FileSystemService: {
    isConfigured: vi.fn(),
    loadAllBooksMetadata: vi.fn(),
    loadAppMetadata: vi.fn(),
    saveBookMetadata: vi.fn(),
    saveAppMetadata: vi.fn(),
    deleteBookMetadata: vi.fn()
  }
}));

describe('BookCache', () => {
  let cache: BookCache;
  let testBook: Book;
  let testBook2: Book;

  beforeEach(() => {
    cache = new BookCache();
    
    // Mock console to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create test books
    const scene = new Scene({
      title: 'Test Scene',
      description: 'Test description',
      characters: ['Alice'],
      elements: ['Sword']
    });

    const story = new Story({
      title: 'Test Story',
      backgroundSetup: 'Test background',
      characters: [{ name: 'Alice', description: 'Hero' }],
      elements: [{ name: 'Sword', description: 'Magic sword' }],
      scenes: [scene]
    });

    testBook = new Book({
      title: 'Test Book 1',
      description: 'Description 1'
    });
    testBook.stories = [story];

    testBook2 = new Book({
      title: 'Test Book 2',
      description: 'Description 2'
    });

    // Setup default mock behavior
    vi.mocked(FileSystemService.isConfigured).mockResolvedValue(true);
    vi.mocked(FileSystemService.loadAllBooksMetadata).mockResolvedValue(new Map());
    vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue(null);
    vi.mocked(FileSystemService.saveBookMetadata).mockResolvedValue();
    vi.mocked(FileSystemService.saveAppMetadata).mockResolvedValue();
    vi.mocked(FileSystemService.deleteBookMetadata).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should get a book from cache', () => {
      cache['cache'].set(testBook.id, testBook);
      
      const retrieved = cache.get(testBook.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(testBook.id);
    });

    it('should return null for non-existent book', () => {
      const retrieved = cache.get('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should get all books from cache', () => {
      cache['cache'].set(testBook.id, testBook);
      cache['cache'].set(testBook2.id, testBook2);
      
      const books = cache.getAll();
      expect(books).toHaveLength(2);
    });

    it('should return empty array when cache is empty', () => {
      const books = cache.getAll();
      expect(books).toHaveLength(0);
    });
  });

  describe('Set Book', () => {
    it('should add book to cache', async () => {
      await cache.set(testBook);
      
      const retrieved = cache.get(testBook.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(testBook.id);
    });

    it('should update book updatedAt timestamp', async () => {
      const oldDate = testBook.updatedAt;
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 5));
      
      await cache.set(testBook);
      
      expect(testBook.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('should save to filesystem', async () => {
      await cache.set(testBook);
      
      // Wait a bit for async save
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(FileSystemService.saveBookMetadata).toHaveBeenCalled();
    });

    it('should handle filesystem save errors gracefully', async () => {
      vi.mocked(FileSystemService.saveBookMetadata).mockRejectedValue(new Error('Save failed'));
      
      // Should not throw
      await expect(cache.set(testBook)).resolves.not.toThrow();
    });

    it('should not save when filesystem is not configured', async () => {
      vi.mocked(FileSystemService.isConfigured).mockResolvedValue(false);
      
      await cache.set(testBook);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should still add to cache
      expect(cache.get(testBook.id)).toBeDefined();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('not configured'));
    });
  });

  describe('Delete Book', () => {
    it('should delete book from cache', async () => {
      cache['cache'].set(testBook.id, testBook);
      
      await cache.delete(testBook.id);
      
      expect(cache.get(testBook.id)).toBeNull();
    });

    it('should delete from filesystem', async () => {
      cache['cache'].set(testBook.id, testBook);
      
      await cache.delete(testBook.id);
      
      expect(FileSystemService.deleteBookMetadata).toHaveBeenCalledWith(testBook.id);
    });

    it('should clear active book if deleted', async () => {
      cache['cache'].set(testBook.id, testBook);
      cache['activeBookId'] = testBook.id;
      
      await cache.delete(testBook.id);
      
      expect(cache.getActiveBookId()).toBeNull();
    });

    it('should handle filesystem delete errors gracefully', async () => {
      vi.mocked(FileSystemService.deleteBookMetadata).mockRejectedValue(new Error('Delete failed'));
      cache['cache'].set(testBook.id, testBook);
      
      // Should not throw
      await expect(cache.delete(testBook.id)).resolves.not.toThrow();
      
      // Should still remove from cache
      expect(cache.get(testBook.id)).toBeNull();
    });
  });

  describe('Active Book Management', () => {
    it('should set active book ID', async () => {
      await cache.setActiveBookId(testBook.id);
      
      expect(cache.getActiveBookId()).toBe(testBook.id);
    });

    it('should save active book ID to filesystem', async () => {
      await cache.setActiveBookId(testBook.id);
      
      expect(FileSystemService.saveAppMetadata).toHaveBeenCalledWith({ activeBookId: testBook.id });
    });

    it('should handle null active book ID', async () => {
      await cache.setActiveBookId(null);
      
      expect(cache.getActiveBookId()).toBeNull();
    });

    it('should get active book', () => {
      cache['cache'].set(testBook.id, testBook);
      cache['activeBookId'] = testBook.id;
      
      const activeBook = cache.getActiveBook();
      expect(activeBook).toBeDefined();
      expect(activeBook?.id).toBe(testBook.id);
    });

    it('should return null when no active book set', () => {
      const activeBook = cache.getActiveBook();
      expect(activeBook).toBeNull();
    });

    it('should return null when active book not in cache', () => {
      cache['activeBookId'] = 'non-existent';
      
      const activeBook = cache.getActiveBook();
      expect(activeBook).toBeNull();
    });

    it('should handle filesystem errors when setting active book', async () => {
      vi.mocked(FileSystemService.saveAppMetadata).mockRejectedValue(new Error('Save failed'));
      
      await expect(cache.setActiveBookId(testBook.id)).resolves.not.toThrow();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Cache Status', () => {
    it('should report loaded status', () => {
      expect(cache.isLoaded()).toBe(false);
      
      cache['loaded'] = true;
      
      expect(cache.isLoaded()).toBe(true);
    });

    it('should get cache statistics', () => {
      cache['cache'].set(testBook.id, testBook);
      cache['cache'].set(testBook2.id, testBook2);
      cache['activeBookId'] = testBook.id;
      cache['loaded'] = true;
      
      const stats = cache.getStats();
      
      expect(stats.bookCount).toBe(2);
      expect(stats.activeBookId).toBe(testBook.id);
      expect(stats.loaded).toBe(true);
    });

    it('should clear cache', () => {
      cache['cache'].set(testBook.id, testBook);
      cache['activeBookId'] = testBook.id;
      cache['loaded'] = true;
      
      cache.clear();
      
      expect(cache.getAll()).toHaveLength(0);
      expect(cache.getActiveBookId()).toBeNull();
      expect(cache.isLoaded()).toBe(false);
    });
  });

  describe('Load All Books', () => {
    it('should load books from filesystem', async () => {
      const bookData = {
        id: testBook.id,
        title: testBook.title,
        description: testBook.description,
        stories: [],
        createdAt: testBook.createdAt.toISOString(),
        updatedAt: testBook.updatedAt.toISOString()
      };

      const booksMap = new Map();
      booksMap.set(testBook.id, JSON.stringify(bookData));

      vi.mocked(FileSystemService.loadAllBooksMetadata).mockResolvedValue(booksMap);
      
      await cache.loadAll();
      
      expect(cache.isLoaded()).toBe(true);
      expect(cache.getAll()).toHaveLength(1);
    });

    it('should only load once', async () => {
      await cache.loadAll();
      await cache.loadAll();
      await cache.loadAll();
      
      // Should only call filesystem once
      expect(FileSystemService.loadAllBooksMetadata).toHaveBeenCalledTimes(1);
    });

    it('should wait for loading if already in progress', async () => {
      const booksMap = new Map();
      vi.mocked(FileSystemService.loadAllBooksMetadata).mockResolvedValue(booksMap);
      
      // Start multiple loads simultaneously
      const promises = [
        cache.loadAll(),
        cache.loadAll(),
        cache.loadAll()
      ];
      
      await Promise.all(promises);
      
      // Should only call filesystem once
      expect(FileSystemService.loadAllBooksMetadata).toHaveBeenCalledTimes(1);
    });

    it('should handle filesystem not configured', async () => {
      vi.mocked(FileSystemService.isConfigured).mockResolvedValue(false);
      
      await cache.loadAll();
      
      expect(cache.isLoaded()).toBe(true);
      expect(cache.getAll()).toHaveLength(0);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('not configured'));
    });

    it('should load activeBookId from metadata', async () => {
      const booksMap = new Map();
      vi.mocked(FileSystemService.loadAllBooksMetadata).mockResolvedValue(booksMap);
      vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue({
        activeBookId: 'test-book-id'
      });
      
      await cache.loadAll();
      
      expect(cache.getActiveBookId()).toBe('test-book-id');
    });

    it('should use first book as active if no activeBookId in metadata', async () => {
      const bookData = {
        id: testBook.id,
        title: testBook.title,
        stories: [],
        createdAt: testBook.createdAt.toISOString(),
        updatedAt: testBook.updatedAt.toISOString()
      };

      const booksMap = new Map();
      booksMap.set(testBook.id, JSON.stringify(bookData));

      vi.mocked(FileSystemService.loadAllBooksMetadata).mockResolvedValue(booksMap);
      vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue(null);
      
      await cache.loadAll();
      
      expect(cache.getActiveBookId()).toBe(testBook.id);
    });

    it('should handle JSON parse errors', async () => {
      const booksMap = new Map();
      booksMap.set('bad-book', 'invalid json{{{');

      vi.mocked(FileSystemService.loadAllBooksMetadata).mockResolvedValue(booksMap);
      
      await cache.loadAll();
      
      expect(cache.isLoaded()).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle load errors and still mark as loaded', async () => {
      vi.mocked(FileSystemService.loadAllBooksMetadata).mockRejectedValue(new Error('Load failed'));
      
      await cache.loadAll();
      
      expect(cache.isLoaded()).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Serialization', () => {
    it('should serialize book with all properties', async () => {
      await cache.set(testBook);
      
      // Check that the serialized data includes all properties
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(FileSystemService.saveBookMetadata).toHaveBeenCalled();
      const calls = vi.mocked(FileSystemService.saveBookMetadata).mock.calls;
      const serializedJson = calls[0][1];
      const serialized = JSON.parse(serializedJson);
      
      expect(serialized.id).toBe(testBook.id);
      expect(serialized.title).toBe(testBook.title);
      expect(serialized.stories).toBeDefined();
      expect(serialized.stories).toHaveLength(1);
    });

    it('should serialize nested stories and scenes', async () => {
      await cache.set(testBook);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const calls = vi.mocked(FileSystemService.saveBookMetadata).mock.calls;
      const serialized = JSON.parse(calls[0][1]);
      
      const story = serialized.stories[0];
      expect(story.title).toBe('Test Story');
      expect(story.scenes).toHaveLength(1);
      
      const scene = story.scenes[0];
      expect(scene.title).toBe('Test Scene');
      expect(scene.characters).toContain('Alice');
      expect(scene.elements).toContain('Sword');
    });

    it('should serialize book with layout', async () => {
      const layout = {
        type: 'overlay',
        canvas: { width: 1080, height: 1440, aspectRatio: '3:4' },
        elements: {
          image: { x: 0, y: 0, width: 100, height: 100, zIndex: 1, aspectRatio: '16:9' },
          textPanel: { x: 5, y: 78, width: 90, height: 17, zIndex: 2 }
        }
      };
      
      testBook.defaultLayout = layout;
      
      await cache.set(testBook);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const calls = vi.mocked(FileSystemService.saveBookMetadata).mock.calls;
      const serialized = JSON.parse(calls[0][1]);
      
      expect(serialized.defaultLayout).toBeDefined();
      expect(serialized.defaultLayout.type).toBe('overlay');
    });
  });

  describe('Deserialization', () => {
    it('should deserialize book from JSON', async () => {
      const scene = {
        id: 'scene-1',
        title: 'Scene 1',
        description: 'Desc',
        characters: ['Alice'],
        elements: ['Sword'],
        imageHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const story = {
        id: 'story-1',
        title: 'Story 1',
        backgroundSetup: 'Setup',
        characters: [{ name: 'Alice', description: 'Hero' }],
        elements: [{ name: 'Sword', description: 'Weapon' }],
        scenes: [scene],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const bookData = {
        id: 'book-1',
        title: 'Book 1',
        stories: [story],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const booksMap = new Map();
      booksMap.set('book-1', JSON.stringify(bookData));

      vi.mocked(FileSystemService.loadAllBooksMetadata).mockResolvedValue(booksMap);
      
      await cache.loadAll();
      
      const book = cache.get('book-1');
      expect(book).toBeDefined();
      expect(book?.title).toBe('Book 1');
      expect(book?.stories).toHaveLength(1);
      expect(book?.stories[0].scenes).toHaveLength(1);
    });

    it('should convert dates during deserialization', async () => {
      const bookData = {
        id: 'book-1',
        title: 'Book 1',
        stories: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z'
      };

      const booksMap = new Map();
      booksMap.set('book-1', JSON.stringify(bookData));

      vi.mocked(FileSystemService.loadAllBooksMetadata).mockResolvedValue(booksMap);
      
      await cache.loadAll();
      
      const book = cache.get('book-1');
      expect(book?.createdAt).toBeInstanceOf(Date);
      expect(book?.updatedAt).toBeInstanceOf(Date);
    });
  });
});


