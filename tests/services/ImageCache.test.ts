import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageCache } from '../../src/services/ImageCache';

describe('ImageCache', () => {
  let cache: ImageCache;
  
  beforeEach(() => {
    // Create a new cache with small size for testing
    cache = new ImageCache(3);
    
    // Mock console.log to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('Constructor', () => {
    it('should create cache with default max size', () => {
      const defaultCache = new ImageCache();
      expect(defaultCache.size()).toBe(0);
      expect(defaultCache.getStats().maxSize).toBe(100);
    });

    it('should create cache with custom max size', () => {
      expect(cache.size()).toBe(0);
      expect(cache.getStats().maxSize).toBe(3);
    });
  });

  describe('Basic Operations', () => {
    it('should add item to cache', () => {
      cache.set('img1', 'url1');
      
      expect(cache.has('img1')).toBe(true);
      expect(cache.size()).toBe(1);
    });

    it('should retrieve cached item', () => {
      cache.set('img1', 'url1');
      const url = cache.get('img1');
      
      expect(url).toBe('url1');
    });

    it('should return null for non-existent item', () => {
      const url = cache.get('nonexistent');
      expect(url).toBeNull();
    });

    it('should update existing item without increasing size', () => {
      cache.set('img1', 'url1');
      cache.set('img1', 'url1', 1024);
      
      expect(cache.size()).toBe(1);
      expect(cache.get('img1')).toBe('url1');
    });

    it('should check if item exists', () => {
      cache.set('img1', 'url1');
      
      expect(cache.has('img1')).toBe(true);
      expect(cache.has('img2')).toBe(false);
    });

    it('should remove specific item', () => {
      cache.set('img1', 'url1');
      cache.remove('img1');
      
      expect(cache.has('img1')).toBe(false);
      expect(cache.size()).toBe(0);
    });

    it('should handle removing non-existent item gracefully', () => {
      cache.remove('nonexistent');
      expect(cache.size()).toBe(0);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits', () => {
      cache.set('img1', 'url1');
      cache.get('img1');
      cache.get('img1');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(100);
    });

    it('should track cache misses', () => {
      cache.get('img1');
      cache.get('img2');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0);
    });

    it('should calculate hit rate correctly', () => {
      cache.set('img1', 'url1');
      cache.get('img1'); // hit
      cache.get('img2'); // miss
      cache.get('img1'); // hit
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(67); // 2/3 = 66.67% rounded to 67%
    });

    it('should return 0 hit rate when no accesses', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should return correct stats', () => {
      cache.set('img1', 'url1');
      cache.set('img2', 'url2');
      cache.get('img1');
      cache.get('img3');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict oldest item when cache is full', async () => {
      // Fill cache to max with delays to ensure different timestamps
      cache.set('img1', 'url1');
      await new Promise(resolve => setTimeout(resolve, 5));
      cache.set('img2', 'url2');
      await new Promise(resolve => setTimeout(resolve, 5));
      cache.set('img3', 'url3');
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // Add one more - should evict img1 (oldest)
      cache.set('img4', 'url4');
      
      expect(cache.size()).toBe(3);
      expect(cache.has('img1')).toBe(false);
      expect(cache.has('img4')).toBe(true);
    });

    it('should update LRU order on get', async () => {
      cache.set('img1', 'url1');
      await new Promise(resolve => setTimeout(resolve, 5));
      cache.set('img2', 'url2');
      await new Promise(resolve => setTimeout(resolve, 5));
      cache.set('img3', 'url3');
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // Access img1 to make it most recently used
      cache.get('img1');
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // Add new item - should evict img2 (oldest)
      cache.set('img4', 'url4');
      
      expect(cache.has('img1')).toBe(true);
      expect(cache.has('img2')).toBe(false);
      expect(cache.has('img3')).toBe(true);
      expect(cache.has('img4')).toBe(true);
    });

    it('should update LRU order on set to existing key', async () => {
      cache.set('img1', 'url1');
      await new Promise(resolve => setTimeout(resolve, 5));
      cache.set('img2', 'url2');
      await new Promise(resolve => setTimeout(resolve, 5));
      cache.set('img3', 'url3');
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // Update img1 to make it most recently used
      cache.set('img1', 'url1-updated');
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // Add new item - should evict img2 (oldest)
      cache.set('img4', 'url4');
      
      expect(cache.has('img1')).toBe(true);
      expect(cache.has('img2')).toBe(false);
    });
  });

  describe('Clear and Keys', () => {
    it('should clear entire cache', () => {
      cache.set('img1', 'url1');
      cache.set('img2', 'url2');
      
      cache.clear();
      
      expect(cache.size()).toBe(0);
      expect(cache.has('img1')).toBe(false);
      expect(cache.has('img2')).toBe(false);
    });

    it('should reset statistics on clear', () => {
      cache.set('img1', 'url1');
      cache.get('img1');
      cache.get('img2');
      
      cache.clear();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should return list of cached keys', () => {
      cache.set('img1', 'url1');
      cache.set('img2', 'url2');
      cache.set('img3', 'url3');
      
      const keys = cache.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('img1');
      expect(keys).toContain('img2');
      expect(keys).toContain('img3');
    });

    it('should return empty array when cache is empty', () => {
      const keys = cache.keys();
      expect(keys).toHaveLength(0);
    });
  });

  describe('Max Size Management', () => {
    it('should update max size', () => {
      cache.setMaxSize(5);
      expect(cache.getStats().maxSize).toBe(5);
    });

    it('should evict entries when reducing max size', () => {
      cache.set('img1', 'url1');
      cache.set('img2', 'url2');
      cache.set('img3', 'url3');
      
      // Reduce max size - should evict oldest entries
      cache.setMaxSize(2);
      
      expect(cache.size()).toBe(2);
      expect(cache.has('img1')).toBe(false);
      expect(cache.has('img2')).toBe(true);
      expect(cache.has('img3')).toBe(true);
    });

    it('should not evict when increasing max size', () => {
      cache.set('img1', 'url1');
      cache.set('img2', 'url2');
      
      cache.setMaxSize(10);
      
      expect(cache.size()).toBe(2);
      expect(cache.has('img1')).toBe(true);
      expect(cache.has('img2')).toBe(true);
    });
  });

  describe('Blob URL Handling', () => {
    it('should revoke blob URL when removing', () => {
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
      
      cache.set('img1', 'blob:http://localhost/123');
      cache.remove('img1');
      
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/123');
    });

    it('should not try to revoke non-blob URLs', () => {
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
      
      cache.set('img1', 'https://example.com/image.jpg');
      cache.remove('img1');
      
      expect(revokeObjectURL).not.toHaveBeenCalled();
    });

    it('should revoke all blob URLs when clearing', () => {
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
      
      cache.set('img1', 'blob:http://localhost/123');
      cache.set('img2', 'https://example.com/image.jpg');
      cache.set('img3', 'blob:http://localhost/456');
      
      cache.clear();
      
      expect(revokeObjectURL).toHaveBeenCalledTimes(2);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/123');
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/456');
    });
  });

  describe('Prune Invalid URLs', () => {
    it('should prune invalid blob URLs', async () => {
      // Mock fetch to simulate invalid blob URLs
      global.fetch = vi.fn((url) => {
        if (url === 'blob:http://localhost/invalid') {
          return Promise.reject(new Error('Invalid blob'));
        }
        return Promise.resolve({ ok: true } as Response);
      });
      
      cache.set('img1', 'blob:http://localhost/valid');
      cache.set('img2', 'blob:http://localhost/invalid');
      cache.set('img3', 'https://example.com/image.jpg');
      
      const prunedCount = await cache.prune();
      
      expect(prunedCount).toBe(1);
      expect(cache.size()).toBe(2);
      expect(cache.has('img2')).toBe(false);
    });

    it('should return 0 when no URLs need pruning', async () => {
      global.fetch = vi.fn(() => 
        Promise.resolve({ ok: true } as Response)
      );
      
      cache.set('img1', 'blob:http://localhost/valid');
      
      const prunedCount = await cache.prune();
      
      expect(prunedCount).toBe(0);
      expect(cache.size()).toBe(1);
    });

    it('should handle empty cache in prune', async () => {
      const prunedCount = await cache.prune();
      expect(prunedCount).toBe(0);
    });
  });

  describe('Optional Size Tracking', () => {
    it('should store size when provided', () => {
      cache.set('img1', 'url1', 2048);
      expect(cache.has('img1')).toBe(true);
    });

    it('should update size on re-set', () => {
      cache.set('img1', 'url1', 1024);
      cache.set('img1', 'url1', 2048);
      expect(cache.size()).toBe(1);
    });
  });
});

