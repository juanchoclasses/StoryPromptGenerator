/**
 * FileSystemService Tests
 * 
 * Tests for the FileSystemService class which provides filesystem operations
 * for both browser (File System Access API) and Electron environments.
 * 
 * This is a CRITICAL service (920 lines) that manages all file I/O.
 * 
 * Note: Due to the complexity of mocking File System Access API and IndexedDB,
 * these tests focus on the critical logic paths and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileSystemService } from '../../src/services/FileSystemService';

// Mock window.electronAPI for Electron detection
const mockElectronAPI = {
  selectDirectory: vi.fn(),
  getDirectoryPath: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  deleteFile: vi.fn(),
  listFiles: vi.fn(),
  fileExists: vi.fn(),
};

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({ onsuccess: null, onerror: null, result: null })),
          put: vi.fn(() => ({ onsuccess: null, onerror: null })),
          delete: vi.fn(() => ({ onsuccess: null, onerror: null })),
        }))
      })),
      objectStoreNames: {
        contains: vi.fn(() => false)
      }
    }
  }))
};

describe('FileSystemService', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock IndexedDB
    (global as any).indexedDB = mockIndexedDB;
    
    // Clear static state
    (FileSystemService as any).db = null;
    (FileSystemService as any).directoryHandle = null;
  });

  afterEach(() => {
    // Clean up
    delete (window as any).electronAPI;
    delete (global as any).indexedDB;
  });

  describe('Platform Detection', () => {
    it('should detect Electron environment', () => {
      (window as any).electronAPI = mockElectronAPI;
      
      const isElectron = FileSystemService.isElectron();
      
      expect(isElectron).toBe(true);
    });

    it('should detect browser environment', () => {
      delete (window as any).electronAPI;
      
      const isElectron = FileSystemService.isElectron();
      
      expect(isElectron).toBe(false);
    });

    it('should check if File System Access API is supported', () => {
      delete (window as any).electronAPI;
      
      // Mock showDirectoryPicker presence
      (window as any).showDirectoryPicker = () => {};
      
      const isSupported = FileSystemService.isSupported();
      
      expect(isSupported).toBe(true);
      
      // Cleanup
      delete (window as any).showDirectoryPicker;
    });

    it('should report Electron as always supported', () => {
      (window as any).electronAPI = mockElectronAPI;
      
      const isSupported = FileSystemService.isSupported();
      
      expect(isSupported).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should report as not configured when no directory set', async () => {
      delete (window as any).electronAPI;
      delete (window as any).showDirectoryPicker;
      
      const isConfigured = await FileSystemService.isConfigured();
      
      expect(isConfigured).toBe(false);
    });

    it('should report as configured in Electron with path', async () => {
      (window as any).electronAPI = {
        ...mockElectronAPI,
        getDirectoryPath: vi.fn().mockResolvedValue('/fake/path')
      };
      
      const isConfigured = await FileSystemService.isConfigured();
      
      expect(isConfigured).toBe(true);
    });
  });

  describe('Directory Operations', () => {
    it('should handle selectDirectory in Electron mode', async () => {
      (window as any).electronAPI = {
        ...mockElectronAPI,
        selectDirectory: vi.fn().mockResolvedValue({
          success: true,
          path: '/fake/path'
        })
      };
      
      const result = await FileSystemService.selectDirectory();
      
      expect(result.success).toBe(true);
      expect(result.path).toBe('/fake/path');
    });

    it('should return error when File System Access API not supported', async () => {
      delete (window as any).electronAPI;
      delete (window as any).showDirectoryPicker;
      
      const result = await FileSystemService.selectDirectory();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('should get directory path in Electron mode', async () => {
      (window as any).electronAPI = {
        ...mockElectronAPI,
        getDirectoryPath: vi.fn().mockResolvedValue('/home/user/documents')
      };
      
      const path = await FileSystemService.getDirectoryPath();
      
      expect(path).toBe('/home/user/documents');
    });
  });

  describe('Image Operations (Electron Mode)', () => {
    beforeEach(() => {
      (window as any).electronAPI = mockElectronAPI;
    });

    it('should save image by ID', async () => {
      const imageUrl = 'data:image/png;base64,fake';
      mockElectronAPI.writeFile.mockResolvedValue(true);
      
      const result = await FileSystemService.saveImageById(
        'img-123',
        imageUrl,
        { sceneId: 'scene-456' }
      );
      
      expect(result.success).toBe(true);
      expect(mockElectronAPI.writeFile).toHaveBeenCalled();
    });

    it('should load image by ID', async () => {
      const mockBlobUrl = 'blob:fake-url';
      mockElectronAPI.readFile.mockResolvedValue(new Blob());
      
      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => mockBlobUrl);
      
      const url = await FileSystemService.loadImageById('img-123');
      
      expect(url).toBe(mockBlobUrl);
    });

    it('should return null when image not found', async () => {
      mockElectronAPI.fileExists.mockResolvedValue(false);
      
      const url = await FileSystemService.loadImageById('nonexistent');
      
      expect(url).toBeNull();
    });

    it('should delete image by ID', async () => {
      mockElectronAPI.deleteFile.mockResolvedValue(true);
      
      const deleted = await FileSystemService.deleteImageById('img-123');
      
      expect(deleted).toBe(true);
      expect(mockElectronAPI.deleteFile).toHaveBeenCalled();
    });

    it('should handle image save errors gracefully', async () => {
      mockElectronAPI.writeFile.mockRejectedValue(new Error('Disk full'));
      
      const result = await FileSystemService.saveImageById(
        'img-123',
        'data:image/png;base64,fake'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Disk full');
    });
  });

  describe('Book Metadata Operations (Electron Mode)', () => {
    beforeEach(() => {
      (window as any).electronAPI = mockElectronAPI;
    });

    it('should save book metadata', async () => {
      const bookData = { id: 'book-123', title: 'Test Book' };
      mockElectronAPI.writeFile.mockResolvedValue(true);
      
      await FileSystemService.saveBookMetadata('book-123', JSON.stringify(bookData));
      
      expect(mockElectronAPI.writeFile).toHaveBeenCalled();
      const call = mockElectronAPI.writeFile.mock.calls[0];
      expect(call[0]).toContain('book-123.json');
    });

    it('should load book metadata', async () => {
      const bookData = { id: 'book-123', title: 'Test Book' };
      mockElectronAPI.readFile.mockResolvedValue(JSON.stringify(bookData));
      
      const data = await FileSystemService.loadBookMetadata('book-123');
      
      expect(data).toBe(JSON.stringify(bookData));
    });

    it('should return null when book metadata not found', async () => {
      mockElectronAPI.fileExists.mockResolvedValue(false);
      
      const data = await FileSystemService.loadBookMetadata('nonexistent');
      
      expect(data).toBeNull();
    });

    it('should load all books metadata', async () => {
      const book1 = JSON.stringify({ id: 'book-1', title: 'Book 1' });
      const book2 = JSON.stringify({ id: 'book-2', title: 'Book 2' });
      
      mockElectronAPI.listFiles.mockResolvedValue(['book-1.json', 'book-2.json']);
      mockElectronAPI.readFile
        .mockResolvedValueOnce(book1)
        .mockResolvedValueOnce(book2);
      
      const books = await FileSystemService.loadAllBooksMetadata();
      
      expect(books.size).toBe(2);
      expect(books.get('book-1')).toBe(book1);
      expect(books.get('book-2')).toBe(book2);
    });

    it('should delete book metadata', async () => {
      mockElectronAPI.deleteFile.mockResolvedValue(true);
      
      const deleted = await FileSystemService.deleteBookMetadata('book-123');
      
      expect(deleted).toBe(true);
      expect(mockElectronAPI.deleteFile).toHaveBeenCalled();
    });

    it('should handle corrupted book data gracefully', async () => {
      mockElectronAPI.readFile.mockResolvedValue('invalid json{');
      
      const data = await FileSystemService.loadBookMetadata('book-123');
      
      // Should return the raw string (parsing happens at higher level)
      expect(data).toBe('invalid json{');
    });
  });

  describe('App Metadata Operations (Electron Mode)', () => {
    beforeEach(() => {
      (window as any).electronAPI = mockElectronAPI;
    });

    it('should save app metadata', async () => {
      const metadata = { activeBookId: 'book-123' };
      mockElectronAPI.writeFile.mockResolvedValue(true);
      
      await FileSystemService.saveAppMetadata(metadata);
      
      expect(mockElectronAPI.writeFile).toHaveBeenCalled();
      const call = mockElectronAPI.writeFile.mock.calls[0];
      expect(call[0]).toContain('app-metadata.json');
      expect(call[1]).toContain('book-123');
    });

    it('should load app metadata', async () => {
      const metadata = { activeBookId: 'book-123' };
      mockElectronAPI.readFile.mockResolvedValue(JSON.stringify(metadata));
      
      const data = await FileSystemService.loadAppMetadata();
      
      expect(data).toEqual(metadata);
    });

    it('should return null when app metadata not found', async () => {
      mockElectronAPI.fileExists.mockResolvedValue(false);
      
      const data = await FileSystemService.loadAppMetadata();
      
      expect(data).toBeNull();
    });

    it('should handle corrupted app metadata', async () => {
      mockElectronAPI.fileExists.mockResolvedValue(true);
      mockElectronAPI.readFile.mockResolvedValue('invalid json');
      
      const data = await FileSystemService.loadAppMetadata();
      
      // Should return null on parse error
      expect(data).toBeNull();
    });
  });

  describe('File Existence Checks (Electron Mode)', () => {
    beforeEach(() => {
      (window as any).electronAPI = mockElectronAPI;
    });

    it('should check if file exists', async () => {
      mockElectronAPI.fileExists.mockResolvedValue(true);
      
      const exists = await FileSystemService.fileExists('test.json');
      
      expect(exists).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      mockElectronAPI.fileExists.mockResolvedValue(false);
      
      const exists = await FileSystemService.fileExists('nonexistent.json');
      
      expect(exists).toBe(false);
    });

    it('should handle file existence check errors', async () => {
      mockElectronAPI.fileExists.mockRejectedValue(new Error('Permission denied'));
      
      const exists = await FileSystemService.fileExists('test.json');
      
      // Should return false on error
      expect(exists).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (window as any).electronAPI = mockElectronAPI;
    });

    it('should handle write errors gracefully', async () => {
      mockElectronAPI.writeFile.mockRejectedValue(new Error('Disk full'));
      
      await expect(
        FileSystemService.saveBookMetadata('book-123', '{}')
      ).rejects.toThrow('Disk full');
    });

    it('should handle read errors gracefully', async () => {
      mockElectronAPI.readFile.mockRejectedValue(new Error('File corrupted'));
      
      const data = await FileSystemService.loadBookMetadata('book-123');
      
      expect(data).toBeNull();
    });

    it('should handle delete errors gracefully', async () => {
      mockElectronAPI.deleteFile.mockRejectedValue(new Error('Permission denied'));
      
      const deleted = await FileSystemService.deleteBookMetadata('book-123');
      
      expect(deleted).toBe(false);
    });
  });

  describe('Directory Path Handling', () => {
    it('should clear directory handle', async () => {
      (FileSystemService as any).directoryHandle = 'fake-handle';
      
      await FileSystemService.clearDirectory();
      
      expect((FileSystemService as any).directoryHandle).toBeNull();
    });

    it('should return null path when not configured', async () => {
      delete (window as any).electronAPI;
      
      const path = await FileSystemService.getDirectoryPath();
      
      expect(path).toBeNull();
    });
  });
});

