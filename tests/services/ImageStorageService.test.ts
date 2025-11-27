/**
 * ImageStorageService Tests
 * 
 * Tests for the ImageStorageService class which provides image storage
 * with in-memory cache and filesystem persistence.
 * This is a CRITICAL service (422 lines) that manages all image storage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImageStorageService } from '../../src/services/ImageStorageService';

// Mock FileSystemService
vi.mock('../../src/services/FileSystemService', () => ({
  FileSystemService: {
    isConfigured: vi.fn(() => Promise.resolve(true)),
    saveImageById: vi.fn(() => Promise.resolve({ success: true, path: '/fake/path/image.png' })),
    loadImageById: vi.fn(() => Promise.resolve('blob:fake-url')),
    deleteImageById: vi.fn(() => Promise.resolve(true)),
    saveCharacterImage: vi.fn(() => Promise.resolve({ success: true, path: '/fake/path/char.png' })),
    loadCharacterImage: vi.fn(() => Promise.resolve('blob:fake-char-url')),
    deleteCharacterImage: vi.fn(() => Promise.resolve(true)),
  }
}));

// Mock ImageCache
vi.mock('../../src/services/ImageCache', () => ({
  imageCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    getStats: vi.fn(() => ({ size: 0, hits: 0, misses: 0, hitRate: 0 })),
  }
}));

describe('ImageStorageService', () => {
  // Access mocked services
  let FileSystemService: any;
  let imageCache: any;

  beforeEach(async () => {
    // Import mocked modules
    const fsModule = await import('../../src/services/FileSystemService');
    const cacheModule = await import('../../src/services/ImageCache');
    FileSystemService = fsModule.FileSystemService;
    imageCache = cacheModule.imageCache;

    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Reset default mock behaviors
    FileSystemService.isConfigured.mockResolvedValue(true);
    imageCache.get.mockReturnValue(null);
  });

  describe('Scene Image Storage', () => {
    describe('storeImage', () => {
      it('should store an image to filesystem', async () => {
        await ImageStorageService.storeImage(
          'image-123',
          'scene-456',
          'data:image/png;base64,fake',
          'test-model'
        );

        expect(FileSystemService.saveImageById).toHaveBeenCalledWith(
          'image-123',
          'data:image/png;base64,fake',
          {
            sceneId: 'scene-456',
            modelName: 'test-model'
          }
        );
      });

      it('should throw error if filesystem not configured', async () => {
        (FileSystemService.isConfigured as any).mockResolvedValueOnce(false);

        await expect(
          ImageStorageService.storeImage('img-1', 'scene-1', 'data:...', 'model')
        ).rejects.toThrow('Filesystem not configured');
      });

      it('should throw error if filesystem save fails', async () => {
        (FileSystemService.saveImageById as any).mockResolvedValueOnce({
          success: false,
          error: 'Disk full'
        });

        await expect(
          ImageStorageService.storeImage('img-1', 'scene-1', 'data:...', 'model')
        ).rejects.toThrow('Failed to store image');
      });
    });

    describe('getImage', () => {
      it('should return cached image if available', async () => {
        (imageCache.get as any).mockReturnValueOnce('blob:cached-url');

        const url = await ImageStorageService.getImage('image-123');

        expect(url).toBe('blob:cached-url');
        expect(FileSystemService.loadImageById).not.toHaveBeenCalled();
      });

      it('should load from filesystem if not in cache', async () => {
        (imageCache.get as any).mockReturnValue(null);
        (FileSystemService.loadImageById as any).mockResolvedValueOnce('blob:fs-url');

        const url = await ImageStorageService.getImage('image-123');

        expect(url).toBe('blob:fs-url');
        expect(FileSystemService.loadImageById).toHaveBeenCalledWith('image-123');
        expect(imageCache.set).toHaveBeenCalledWith('image-123', 'blob:fs-url');
      });

      it('should return null if image not found', async () => {
        (imageCache.get as any).mockReturnValue(null);
        (FileSystemService.loadImageById as any).mockResolvedValueOnce(null);

        const url = await ImageStorageService.getImage('nonexistent');

        expect(url).toBeNull();
      });

      it('should throw error if filesystem not configured', async () => {
        (imageCache.get as any).mockReturnValue(null);
        (FileSystemService.isConfigured as any).mockResolvedValueOnce(false);

        await expect(
          ImageStorageService.getImage('img-1')
        ).rejects.toThrow('Filesystem not configured');
      });
    });

    describe('deleteImage', () => {
      it('should delete image from cache and filesystem', async () => {
        await ImageStorageService.deleteImage('image-123');

        expect(imageCache.remove).toHaveBeenCalledWith('image-123');
        expect(FileSystemService.deleteImageById).toHaveBeenCalledWith('image-123');
      });

      it('should remove from cache even if filesystem delete fails', async () => {
        (FileSystemService.deleteImageById as any).mockResolvedValueOnce(false);

        await ImageStorageService.deleteImage('image-123');

        expect(imageCache.remove).toHaveBeenCalledWith('image-123');
      });

      it('should throw error if filesystem not configured', async () => {
        (FileSystemService.isConfigured as any).mockResolvedValueOnce(false);

        await expect(
          ImageStorageService.deleteImage('img-1')
        ).rejects.toThrow('Filesystem not configured');
      });
    });
  });

  describe('Character Image Storage', () => {
    describe('storeCharacterImage', () => {
      it('should store a character image to filesystem', async () => {
        await ImageStorageService.storeCharacterImage(
          'story-123',
          'Hero',
          'char-img-456',
          'data:image/png;base64,fake',
          'test-model'
        );

        expect(FileSystemService.saveImageById).toHaveBeenCalledWith(
          'char-img-456',
          'data:image/png;base64,fake',
          {
            characterName: 'Hero',
            modelName: 'test-model'
          }
        );
      });

      it('should throw error if filesystem not configured', async () => {
        (FileSystemService.isConfigured as any).mockResolvedValueOnce(false);

        await expect(
          ImageStorageService.storeCharacterImage(
            'story-1',
            'Hero',
            'img-1',
            'data:...',
            'model'
          )
        ).rejects.toThrow('Filesystem not configured');
      });

      it('should throw error if filesystem save fails', async () => {
        (FileSystemService.saveImageById as any).mockResolvedValueOnce({
          success: false,
          error: 'Permission denied'
        });

        await expect(
          ImageStorageService.storeCharacterImage(
            'story-1',
            'Hero',
            'img-1',
            'data:...',
            'model'
          )
        ).rejects.toThrow('Failed to store character image');
      });
    });

    describe('getCharacterImage', () => {
      it('should return cached character image if available', async () => {
        const cacheKey = 'story-123:Hero:img-456';
        (imageCache.get as any).mockReturnValueOnce('blob:cached-char-url');

        const url = await ImageStorageService.getCharacterImage(
          'story-123',
          'Hero',
          'img-456'
        );

        expect(url).toBe('blob:cached-char-url');
        expect(imageCache.get).toHaveBeenCalledWith(cacheKey);
      });

      it('should load from filesystem if not in cache', async () => {
        (imageCache.get as any).mockReturnValue(null);
        (FileSystemService.loadImageById as any).mockResolvedValueOnce('blob:fs-char-url');

        const url = await ImageStorageService.getCharacterImage(
          'story-123',
          'Hero',
          'img-456'
        );

        expect(url).toBe('blob:fs-char-url');
        expect(FileSystemService.loadImageById).toHaveBeenCalledWith('img-456');
      });

      it('should return null if character image not found', async () => {
        (imageCache.get as any).mockReturnValue(null);
        (FileSystemService.loadImageById as any).mockResolvedValueOnce(null);

        const url = await ImageStorageService.getCharacterImage(
          'story-123',
          'NonExistent',
          'img-456'
        );

        expect(url).toBeNull();
      });

      it('should throw error if filesystem not configured', async () => {
        (imageCache.get as any).mockReturnValue(null);
        (FileSystemService.isConfigured as any).mockResolvedValueOnce(false);

        await expect(
          ImageStorageService.getCharacterImage('story-1', 'Hero', 'img-1')
        ).rejects.toThrow('Filesystem not configured');
      });
    });

    describe('deleteCharacterImage', () => {
      it('should delete character image from cache and filesystem', async () => {
        await ImageStorageService.deleteCharacterImage(
          'story-123',
          'Hero',
          'img-456'
        );

        const cacheKey = 'story-123:Hero:img-456';
        expect(imageCache.remove).toHaveBeenCalledWith(cacheKey);
        expect(FileSystemService.deleteImageById).toHaveBeenCalledWith('img-456');
      });

      it('should remove from cache even if filesystem delete fails', async () => {
        (FileSystemService.deleteImageById as any).mockResolvedValueOnce(false);

        await ImageStorageService.deleteCharacterImage(
          'story-123',
          'Hero',
          'img-456'
        );

        const cacheKey = 'story-123:Hero:img-456';
        expect(imageCache.remove).toHaveBeenCalledWith(cacheKey);
      });
    });
  });

  describe('Cache Management', () => {
    describe('getCacheStats', () => {
      it('should return cache statistics', () => {
        const mockStats = { size: 5, hits: 100, misses: 20, hitRate: 0.83 };
        (imageCache.getStats as any).mockReturnValue(mockStats);

        const stats = ImageStorageService.getCacheStats();

        expect(stats).toEqual(mockStats);
      });
    });

    describe('clearAll', () => {
      it('should clear the cache', async () => {
        await ImageStorageService.clearAll();

        expect(imageCache.clear).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle filesystem configuration check failures', async () => {
      (FileSystemService.isConfigured as any).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      await expect(
        ImageStorageService.storeImage('img-1', 'scene-1', 'data:...', 'model')
      ).rejects.toThrow('Permission denied');
    });

    it('should handle filesystem save errors gracefully', async () => {
      (FileSystemService.saveImageById as any).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        ImageStorageService.storeImage('img-1', 'scene-1', 'data:...', 'model')
      ).rejects.toThrow('Network error');
    });

    it('should handle filesystem load errors gracefully', async () => {
      (imageCache.get as any).mockReturnValue(null);
      (FileSystemService.loadImageById as any).mockRejectedValueOnce(
        new Error('File corrupted')
      );

      await expect(
        ImageStorageService.getImage('img-1')
      ).rejects.toThrow('File corrupted');
    });
  });

  describe('Cache-First Strategy', () => {
    it('should always check cache before filesystem', async () => {
      (imageCache.get as any).mockReturnValueOnce('blob:cached');

      await ImageStorageService.getImage('img-123');

      expect(imageCache.get).toHaveBeenCalled();
      expect(FileSystemService.loadImageById).not.toHaveBeenCalled();
    });

    it('should cache filesystem results', async () => {
      (imageCache.get as any).mockReturnValue(null);
      (FileSystemService.loadImageById as any).mockResolvedValueOnce('blob:fs-url');

      await ImageStorageService.getImage('img-123');

      expect(imageCache.set).toHaveBeenCalledWith('img-123', 'blob:fs-url');
    });

    it('should not cache null results', async () => {
      (imageCache.get as any).mockReturnValue(null);
      (FileSystemService.loadImageById as any).mockResolvedValueOnce(null);

      await ImageStorageService.getImage('nonexistent');

      expect(imageCache.set).not.toHaveBeenCalled();
    });
  });
});

