/**
 * ImageCache - In-memory LRU cache for blob URLs
 * 
 * Caches recently accessed images in memory for instant access.
 * Automatically evicts least recently used images when cache is full.
 * Properly revokes blob URLs to prevent memory leaks.
 */

interface CacheEntry {
  url: string;
  lastUsed: number;
  size?: number; // Optional: track size for memory monitoring
}

export class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Get image URL from cache
   * @param id Image ID
   * @returns Blob URL if cached, null otherwise
   */
  get(id: string): string | null {
    const entry = this.cache.get(id);
    if (entry) {
      // Update last used timestamp
      entry.lastUsed = Date.now();
      this.hits++;
      console.log(`🎯 Cache HIT: ${id} (${this.hits}/${this.hits + this.misses} = ${this.getHitRate()}%)`);
      return entry.url;
    }
    this.misses++;
    console.log(`❌ Cache MISS: ${id} (${this.hits}/${this.hits + this.misses} = ${this.getHitRate()}%)`);
    return null;
  }

  /**
   * Add or update image URL in cache
   * @param id Image ID
   * @param url Blob URL
   * @param size Optional size in bytes
   */
  set(id: string, url: string, size?: number): void {
    // If already cached, just update
    if (this.cache.has(id)) {
      const entry = this.cache.get(id)!;
      entry.lastUsed = Date.now();
      entry.size = size;
      return;
    }

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    // Add new entry
    this.cache.set(id, {
      url,
      lastUsed: Date.now(),
      size
    });

    console.log(`📦 Cached: ${id} (${this.cache.size}/${this.maxSize})`);
  }

  /**
   * Remove specific image from cache
   * @param id Image ID
   */
  remove(id: string): void {
    const entry = this.cache.get(id);
    if (entry) {
      // Revoke blob URL to free memory
      if (entry.url.startsWith('blob:')) {
        URL.revokeObjectURL(entry.url);
        console.log(`🗑️  Revoked blob URL: ${id}`);
      }
      this.cache.delete(id);
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    console.log(`🧹 Clearing cache (${this.cache.size} entries)`);
    
    // Revoke all blob URLs
    for (const [id, entry] of this.cache.entries()) {
      if (entry.url.startsWith('blob:')) {
        URL.revokeObjectURL(entry.url);
      }
    }
    
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Evict least recently used entry
   */
  private evictOldest(): void {
    if (this.cache.size === 0) return;

    // Find oldest entry
    let oldestId: string | null = null;
    let oldestTime = Date.now();

    for (const [id, entry] of this.cache.entries()) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestId = id;
      }
    }

    if (oldestId) {
      console.log(`♻️  Evicting oldest: ${oldestId}`);
      this.remove(oldestId);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate()
    };
  }

  /**
   * Get cache hit rate as percentage
   */
  private getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? Math.round((this.hits / total) * 100) : 0;
  }

  /**
   * Check if ID is cached
   */
  has(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Update max cache size
   */
  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    
    // Evict entries if new max is smaller
    while (this.cache.size > this.maxSize) {
      this.evictOldest();
    }
  }

  /**
   * Get list of cached image IDs
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Prune cache to remove invalid blob URLs
   * Useful for cleaning up after browser revokes URLs
   */
  async prune(): Promise<number> {
    let prunedCount = 0;
    const idsToRemove: string[] = [];

    for (const [id, entry] of this.cache.entries()) {
      if (entry.url.startsWith('blob:')) {
        // Try to verify blob URL is still valid
        try {
          const response = await fetch(entry.url, { method: 'HEAD' });
          if (!response.ok) {
            idsToRemove.push(id);
          }
        } catch {
          idsToRemove.push(id);
        }
      }
    }

    // Remove invalid entries
    for (const id of idsToRemove) {
      this.cache.delete(id); // Don't revoke, already invalid
      prunedCount++;
    }

    if (prunedCount > 0) {
      console.log(`🧹 Pruned ${prunedCount} invalid entries`);
    }

    return prunedCount;
  }
}

// Singleton instance
export const imageCache = new ImageCache(100);






