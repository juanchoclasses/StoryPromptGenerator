/**
 * FileBasedStorageService Tests
 * 
 * Tests for the FileBasedStorageService class which handles reading/writing
 * books in directory format with individual story files.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileBasedStorageService } from '../../src/services/FileBasedStorageService';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';

// Mock ElectronAPI
const mockElectronAPI = {
  selectDirectory: vi.fn(),
  getDirectoryPath: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  deleteFile: vi.fn(),
  fileExists: vi.fn(),
  readDirectory: vi.fn(),
  createDirectory: vi.fn(),
  writeFileBinary: vi.fn(),
  readFileBinary: vi.fn(),
  getStoreValue: vi.fn(),
  setStoreValue: vi.fn(),
  deleteStoreValue: vi.fn(),
};

// Reset ElectronFileSystemService static state
const resetElectronService = async () => {
  try {
    const { ElectronFileSystemService } = await import('../../src/services/ElectronFileSystemService');
    (ElectronFileSystemService as any).baseDirectory = null;
  } catch {
    // Not loaded yet
  }
};

describe('FileBasedStorageService', () => {
  beforeEach(async () => {
    // Setup Electron environment
    (window as any).electronAPI = mockElectronAPI;
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Reset ElectronFileSystemService state
    await resetElectronService();
    
    // Default mock implementations
    mockElectronAPI.getDirectoryPath.mockResolvedValue({ path: '/fake/path' });
    mockElectronAPI.createDirectory.mockResolvedValue({ success: true });
    mockElectronAPI.writeFile.mockResolvedValue({ success: true });
    mockElectronAPI.fileExists.mockResolvedValue({ exists: false });
    mockElectronAPI.readDirectory.mockResolvedValue({ 
      success: true, 
      files: [], 
      directories: [] 
    });
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  describe('saveBook', () => {
    it('should create correct directory structure', async () => {
      const book = new Book({
        title: 'Test Book',
        stories: []
      });

      const result = await FileBasedStorageService.saveBook(book);

      expect(result.success).toBe(true);
      expect(mockElectronAPI.createDirectory).toHaveBeenCalledWith(
        expect.stringContaining('prompter-cache/books/test-book')
      );
      expect(mockElectronAPI.createDirectory).toHaveBeenCalledWith(
        expect.stringContaining('prompter-cache/books/test-book/stories')
      );
    });

    it('should save book.json with correct metadata fields', async () => {
      const book = new Book({
        title: 'Test Book',
        description: 'A test book',
        backgroundSetup: 'Test background',
        aspectRatio: '16:9',
        stories: []
      });

      await FileBasedStorageService.saveBook(book);

      // Find the writeFile call for book.json
      const bookJsonCall = mockElectronAPI.writeFile.mock.calls.find(
        (call: any[]) => call[0].endsWith('/book.json')
      );

      expect(bookJsonCall).toBeDefined();
      const bookData = JSON.parse(bookJsonCall![1]);
      
      expect(bookData).toHaveProperty('id');
      expect(bookData).toHaveProperty('title', 'Test Book');
      expect(bookData).toHaveProperty('description', 'A test book');
      expect(bookData).toHaveProperty('backgroundSetup', 'Test background');
      expect(bookData).toHaveProperty('aspectRatio', '16:9');
      expect(bookData).toHaveProperty('style');
      expect(bookData).toHaveProperty('characters');
      expect(bookData).toHaveProperty('createdAt');
      expect(bookData).toHaveProperty('updatedAt');
      expect(bookData).not.toHaveProperty('stories'); // Stories should not be in book.json
    });

    it('should create story files with correct slugs', async () => {
      const story1 = new Story({ title: 'First Story', backgroundSetup: 'Setup 1' });
      const story2 = new Story({ title: 'Second Story', backgroundSetup: 'Setup 2' });
      
      const book = new Book({
        title: 'Test Book',
        stories: [story1, story2]
      });

      await FileBasedStorageService.saveBook(book);

      // Check that story files were created
      const storyFileCalls = mockElectronAPI.writeFile.mock.calls.filter(
        (call: any[]) => call[0].includes('/stories/') && call[0].endsWith('.json')
      );

      expect(storyFileCalls).toHaveLength(2);
      expect(storyFileCalls[0][0]).toContain('first-story.json');
      expect(storyFileCalls[1][0]).toContain('second-story.json');
    });

    it('should resolve slug conflicts with numeric suffixes', async () => {
      const story1 = new Story({ title: 'My Story', backgroundSetup: 'Setup' });
      const story2 = new Story({ title: 'My Story', backgroundSetup: 'Setup' });
      const story3 = new Story({ title: 'My Story', backgroundSetup: 'Setup' });
      
      const book = new Book({
        title: 'Test Book',
        stories: [story1, story2, story3]
      });

      await FileBasedStorageService.saveBook(book);

      const storyFileCalls = mockElectronAPI.writeFile.mock.calls.filter(
        (call: any[]) => call[0].includes('/stories/') && call[0].endsWith('.json')
      );

      expect(storyFileCalls).toHaveLength(3);
      expect(storyFileCalls[0][0]).toContain('my-story.json');
      expect(storyFileCalls[1][0]).toContain('my-story-1.json');
      expect(storyFileCalls[2][0]).toContain('my-story-2.json');
    });

    it('should format JSON with 2-space indentation', async () => {
      const book = new Book({
        title: 'Test Book',
        stories: []
      });

      await FileBasedStorageService.saveBook(book);

      const bookJsonCall = mockElectronAPI.writeFile.mock.calls.find(
        (call: any[]) => call[0].endsWith('/book.json')
      );

      expect(bookJsonCall).toBeDefined();
      const jsonString = bookJsonCall![1];
      
      // Check for 2-space indentation
      expect(jsonString).toContain('\n  "');
    });

    it('should handle filesystem errors with clear error messages', async () => {
      mockElectronAPI.createDirectory.mockResolvedValue({
        success: false,
        error: 'Permission denied'
      });

      const book = new Book({
        title: 'Test Book',
        stories: []
      });

      const result = await FileBasedStorageService.saveBook(book);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Permission denied');
    });

    it('should handle books with no stories', async () => {
      const book = new Book({
        title: 'Empty Book',
        stories: []
      });

      const result = await FileBasedStorageService.saveBook(book);

      expect(result.success).toBe(true);
      // Should still create stories directory
      expect(mockElectronAPI.createDirectory).toHaveBeenCalledWith(
        expect.stringContaining('/stories')
      );
    });
  });

  describe('loadBook', () => {
    it('should load book by slug', async () => {
      const bookData = {
        id: 'book-123',
        title: 'Test Book',
        description: 'Test description',
        stories: []
      };

      mockElectronAPI.fileExists.mockResolvedValue({ exists: true });
      mockElectronAPI.readFile.mockResolvedValue({
        success: true,
        content: JSON.stringify(bookData)
      });
      mockElectronAPI.readDirectory.mockResolvedValue({
        success: true,
        files: [],
        directories: []
      });

      const book = await FileBasedStorageService.loadBook('test-book');

      expect(book).not.toBeNull();
      expect(book?.title).toBe('Test Book');
      expect(book?.id).toBe('book-123');
    });

    it('should load book by ID when slug not found', async () => {
      const bookData = {
        id: 'book-123',
        title: 'Test Book',
        description: 'Test description'
      };

      // First call (by slug) returns false
      // Second call (searching directories) returns true
      mockElectronAPI.fileExists
        .mockResolvedValueOnce({ exists: false })
        .mockResolvedValueOnce({ exists: true });

      mockElectronAPI.readDirectory.mockResolvedValue({
        success: true,
        files: [],
        directories: ['some-other-slug']
      });

      mockElectronAPI.readFile.mockResolvedValue({
        success: true,
        content: JSON.stringify(bookData)
      });

      const book = await FileBasedStorageService.loadBook('book-123');

      expect(book).not.toBeNull();
      expect(book?.id).toBe('book-123');
    });

    it('should load all story files from stories directory', async () => {
      const bookData = {
        id: 'book-123',
        title: 'Test Book'
      };

      const story1Data = {
        id: 'story-1',
        title: 'Story 1',
        scenes: []
      };

      const story2Data = {
        id: 'story-2',
        title: 'Story 2',
        scenes: []
      };

      mockElectronAPI.fileExists.mockResolvedValue({ exists: true });
      
      // First readFile call is for book.json
      // Subsequent calls are for story files
      mockElectronAPI.readFile
        .mockResolvedValueOnce({ success: true, content: JSON.stringify(bookData) })
        .mockResolvedValueOnce({ success: true, content: JSON.stringify(story1Data) })
        .mockResolvedValueOnce({ success: true, content: JSON.stringify(story2Data) });

      mockElectronAPI.readDirectory.mockResolvedValue({
        success: true,
        files: ['story-1.json', 'story-2.json'],
        directories: []
      });

      const book = await FileBasedStorageService.loadBook('test-book');

      expect(book).not.toBeNull();
      expect(book?.stories).toHaveLength(2);
      expect(book?.stories[0].title).toBe('Story 1');
      expect(book?.stories[1].title).toBe('Story 2');
    });

    it('should return null for non-existent books', async () => {
      mockElectronAPI.fileExists.mockResolvedValue({ exists: false });
      mockElectronAPI.readDirectory.mockResolvedValue({
        success: true,
        files: [],
        directories: []
      });

      const book = await FileBasedStorageService.loadBook('nonexistent');

      expect(book).toBeNull();
    });

    it('should handle read errors gracefully', async () => {
      mockElectronAPI.fileExists.mockResolvedValue({ exists: true });
      mockElectronAPI.readFile.mockResolvedValue({
        success: false,
        error: 'Read error'
      });

      const book = await FileBasedStorageService.loadBook('test-book');

      expect(book).toBeNull();
    });
  });

  describe('isDirectoryFormat', () => {
    it('should return true when book.json exists', async () => {
      mockElectronAPI.fileExists.mockResolvedValue({ exists: true });

      const result = await FileBasedStorageService.isDirectoryFormat('test-book');

      expect(result).toBe(true);
      expect(mockElectronAPI.fileExists).toHaveBeenCalledWith(
        expect.stringContaining('prompter-cache/books/test-book/book.json')
      );
    });

    it('should return false when book.json does not exist', async () => {
      mockElectronAPI.fileExists.mockResolvedValue({ exists: false });

      const result = await FileBasedStorageService.isDirectoryFormat('test-book');

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      mockElectronAPI.fileExists.mockRejectedValue(new Error('Filesystem error'));

      const result = await FileBasedStorageService.isDirectoryFormat('test-book');

      expect(result).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should save and load a complete book with stories', async () => {
      const story1 = new Story({ 
        title: 'Chapter 1',
        description: 'First chapter',
        backgroundSetup: 'Chapter 1 setup'
      });
      const story2 = new Story({ 
        title: 'Chapter 2',
        description: 'Second chapter',
        backgroundSetup: 'Chapter 2 setup'
      });
      
      const originalBook = new Book({
        title: 'My Novel',
        description: 'A great novel',
        backgroundSetup: 'Fantasy world',
        aspectRatio: '16:9',
        stories: [story1, story2]
      });

      // Save the book
      const saveResult = await FileBasedStorageService.saveBook(originalBook);
      expect(saveResult.success).toBe(true);

      // Capture what was written
      const bookJsonCall = mockElectronAPI.writeFile.mock.calls.find(
        (call: any[]) => call[0].endsWith('/book.json')
      );
      const storyFileCalls = mockElectronAPI.writeFile.mock.calls.filter(
        (call: any[]) => call[0].includes('/stories/')
      );

      // Setup mocks for loading
      mockElectronAPI.fileExists.mockResolvedValue({ exists: true });
      mockElectronAPI.readFile
        .mockResolvedValueOnce({ success: true, content: bookJsonCall![1] }) // book.json
        .mockResolvedValueOnce({ success: true, content: storyFileCalls[0][1] }) // story 1
        .mockResolvedValueOnce({ success: true, content: storyFileCalls[1][1] }); // story 2

      mockElectronAPI.readDirectory.mockResolvedValue({
        success: true,
        files: ['chapter-1.json', 'chapter-2.json'],
        directories: []
      });

      // Load the book
      const loadedBook = await FileBasedStorageService.loadBook('my-novel');

      expect(loadedBook).not.toBeNull();
      expect(loadedBook?.title).toBe('My Novel');
      expect(loadedBook?.description).toBe('A great novel');
      expect(loadedBook?.backgroundSetup).toBe('Fantasy world');
      expect(loadedBook?.aspectRatio).toBe('16:9');
      expect(loadedBook?.stories).toHaveLength(2);
      expect(loadedBook?.stories[0].title).toBe('Chapter 1');
      expect(loadedBook?.stories[1].title).toBe('Chapter 2');
    });

    it('should handle special characters in book titles', async () => {
      const book = new Book({
        title: 'Book!!! With??? Special*** Characters',
        stories: []
      });

      const result = await FileBasedStorageService.saveBook(book);

      expect(result.success).toBe(true);
      // Slug should be sanitized
      expect(mockElectronAPI.createDirectory).toHaveBeenCalledWith(
        expect.stringContaining('book-with-special-characters')
      );
    });

    it('should handle empty story titles with fallback slugs', async () => {
      const story = new Story({ title: '!!!', backgroundSetup: 'Setup' }); // Only special chars
      
      const book = new Book({
        title: 'Test Book',
        stories: [story]
      });

      const result = await FileBasedStorageService.saveBook(book);

      expect(result.success).toBe(true);
      
      const storyFileCalls = mockElectronAPI.writeFile.mock.calls.filter(
        (call: any[]) => call[0].includes('/stories/')
      );

      // Should use fallback slug with UUID
      expect(storyFileCalls[0][0]).toMatch(/story-[a-f0-9]{8}\.json/);
    });
  });
});
