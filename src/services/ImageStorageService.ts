/**
 * ImageStorageService - Filesystem-only image storage with in-memory cache
 * 
 * Storage Strategy:
 * 1. IN-MEMORY CACHE: LRU cache for recently accessed images (instant access)
 * 2. FILESYSTEM: Local filesystem via File System Access API (persistent, no browser eviction)
 * 
 * Images are keyed by their unique image ID from GeneratedImage.id
 * 
 * NOTE: Filesystem must be configured. No IndexedDB fallback.
 */

import { FileSystemService } from './FileSystemService';
import { imageCache } from './ImageCache';

class ImageStorageServiceClass {
  /**
   * Check if filesystem is configured, throw error if not
   */
  private async ensureFilesystemConfigured(): Promise<void> {
    const fsConfigured = await FileSystemService.isConfigured();
    if (!fsConfigured) {
      throw new Error('Filesystem not configured. Please select a storage directory in Settings.');
    }
  }

  /**
   * Store an image to filesystem
   * @param imageId Unique image ID
   * @param sceneId Scene ID for cleanup purposes
   * @param imageUrl URL to fetch the image from (blob:, data:, or http:)
   * @param modelName Model that generated the image
   * @returns Promise that resolves when stored
   */
  async storeImage(
    imageId: string,
    sceneId: string,
    imageUrl: string,
    modelName: string
  ): Promise<void> {
    await this.ensureFilesystemConfigured();

    const fsResult = await FileSystemService.saveImageById(imageId, imageUrl, {
      sceneId,
      modelName
    });
    
    if (fsResult.success) {
      console.log(`✓ Image stored to filesystem: ${imageId} (path: ${fsResult.path})`);
    } else {
      throw new Error(`Failed to store image: ${fsResult.error}`);
    }
  }

  /**
   * Retrieve an image using cache + filesystem
   * (cache → filesystem)
   * @param imageId Unique image ID
   * @returns Blob URL that can be used in <img> src, or null if not found
   */
  async getImage(imageId: string): Promise<string | null> {
    // 1. Check in-memory cache first (instant)
    const cachedUrl = imageCache.get(imageId);
    if (cachedUrl) {
      return cachedUrl;
    }

    // 2. Try filesystem
    await this.ensureFilesystemConfigured();
    const fsUrl = await FileSystemService.loadImageById(imageId);
    if (fsUrl) {
      console.log(`✓ Image loaded from filesystem: ${imageId}`);
      // Cache for next time
      imageCache.set(imageId, fsUrl);
      return fsUrl;
    }

    return null;
  }

  /**
   * Delete a specific image from cache and filesystem
   * @param imageId Unique image ID
   */
  async deleteImage(imageId: string): Promise<void> {
    // Remove from cache first
    imageCache.remove(imageId);

    // Delete from filesystem
    await this.ensureFilesystemConfigured();
    const fsDeleted = await FileSystemService.deleteImageById(imageId);
    if (fsDeleted) {
      console.log(`✓ Image deleted from filesystem: ${imageId}`);
    }
  }

  /**
   * Delete all images for a specific scene
   * @param sceneId Scene ID
   */
  async deleteImagesForScene(sceneId: string): Promise<void> {
    // Note: We can't easily enumerate filesystem to find all images for a scene
    // This would require scanning all image files and checking metadata
    // For now, this is a no-op - images will be cleaned up when scenes are deleted
    // TODO: Implement filesystem enumeration if needed
    console.log(`Note: deleteImagesForScene(${sceneId}) - filesystem enumeration not implemented`);
  }

  /**
   * Get all stored image IDs
   * Useful for cleanup and debugging
   */
  async getAllImageIds(): Promise<string[]> {
    // Note: We can't easily enumerate filesystem to get all image IDs
    // This would require scanning all image files
    // For now, return empty array
    // TODO: Implement filesystem enumeration if needed
    console.log('Note: getAllImageIds() - filesystem enumeration not implemented');
    return [];
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{ count: number; totalSize: number }> {
    // Note: We can't easily get stats from filesystem without enumeration
    // For now, return zero stats
    // TODO: Implement filesystem enumeration if needed
    return { count: 0, totalSize: 0 };
  }

  /**
   * Clear all stored images (useful for debugging/cleanup)
   */
  async clearAll(): Promise<void> {
    // Clear cache first
    imageCache.clear();
    
    // Note: We can't easily clear all filesystem images without enumeration
    // For now, just clear cache
    // TODO: Implement filesystem enumeration if needed
    console.log('Note: clearAll() - filesystem enumeration not implemented, only cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return imageCache.getStats();
  }

  /**
   * Clear in-memory cache only (keeps filesystem)
   */
  clearCache(): void {
    imageCache.clear();
  }

  /**
   * Prune invalid entries from cache
   */
  async pruneCache(): Promise<number> {
    return imageCache.prune();
  }

  // ========================================
  // Character Image Methods
  // ========================================

  /**
   * Store a character image to filesystem
   * @param storyId Story ID
   * @param characterName Character name
   * @param imageId Unique image ID
   * @param imageUrl URL to fetch the image from (blob:, data:, or http:)
   * @param modelName Model that generated the image
   * @returns Promise that resolves when stored
   */
  async storeCharacterImage(
    storyId: string,
    characterName: string,
    imageId: string,
    imageUrl: string,
    modelName: string
  ): Promise<void> {
    await this.ensureFilesystemConfigured();

    const fsResult = await FileSystemService.saveImageById(imageId, imageUrl, {
      characterName,
      modelName
    });
    
    if (fsResult.success) {
      console.log(`✓ Character image stored to filesystem: ${characterName}/${imageId} (path: ${fsResult.path})`);
    } else {
      throw new Error(`Failed to store character image: ${fsResult.error}`);
    }
  }

  /**
   * Retrieve a character image using cache + filesystem
   * (cache → filesystem)
   * @param storyId Story ID
   * @param characterName Character name
   * @param imageId Unique image ID
   * @returns Blob URL that can be used in <img> src, or null if not found
   */
  async getCharacterImage(
    storyId: string,
    characterName: string,
    imageId: string
  ): Promise<string | null> {
    const fullKey = `${storyId}:${characterName}:${imageId}`;

    // 1. Check in-memory cache first (instant)
    const cachedUrl = imageCache.get(fullKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    // 2. Try filesystem
    await this.ensureFilesystemConfigured();
    const fsUrl = await FileSystemService.loadImageById(imageId);
    if (fsUrl) {
      console.log(`✓ Character image loaded from filesystem: ${characterName}/${imageId}`);
      // Cache for next time
      imageCache.set(fullKey, fsUrl);
      return fsUrl;
    }

    return null;
  }

  /**
   * Delete a specific character image from cache and filesystem
   * @param storyId Story ID
   * @param characterName Character name
   * @param imageId Unique image ID
   */
  async deleteCharacterImage(
    storyId: string,
    characterName: string,
    imageId: string
  ): Promise<void> {
    const fullKey = `${storyId}:${characterName}:${imageId}`;

    // Remove from cache first
    imageCache.remove(fullKey);

    // Delete from filesystem
    await this.ensureFilesystemConfigured();
    const fsDeleted = await FileSystemService.deleteImageById(imageId);
    if (fsDeleted) {
      console.log(`✓ Character image deleted from filesystem: ${characterName}/${imageId}`);
    }
  }

  /**
   * Get all character images for a specific character
   * NOTE: This requires knowing the imageIds beforehand (from character metadata)
   * @param storyId Story ID
   * @param characterName Character name
   * @param imageIds Array of image IDs to load (from character.imageGallery)
   * @returns Map of imageId -> blobUrl
   */
  async getAllCharacterImages(
    storyId: string,
    characterName: string,
    imageIds?: string[]
  ): Promise<Map<string, string>> {
    await this.ensureFilesystemConfigured();

    const imageMap = new Map<string, string>();

    // If imageIds provided, load them
    if (imageIds && imageIds.length > 0) {
      console.log(`Loading ${imageIds.length} images for character "${characterName}" (storyId: ${storyId})`);
      for (const imageId of imageIds) {
        const fullKey = `${storyId}:${characterName}:${imageId}`;
        
        // Check cache first
        const cachedUrl = imageCache.get(fullKey);
        if (cachedUrl) {
          console.log(`  ✓ Cache HIT: ${imageId}`);
          imageMap.set(imageId, cachedUrl);
          continue;
        }

        // Try filesystem
        console.log(`  Loading from filesystem: ${imageId}`);
        const fsUrl = await FileSystemService.loadImageById(imageId);
        if (fsUrl) {
          console.log(`  ✓ Filesystem HIT: ${imageId}`);
          imageMap.set(imageId, fsUrl);
          imageCache.set(fullKey, fsUrl);
        } else {
          console.log(`  ✗ Filesystem MISS: ${imageId}`);
        }
      }
    } else {
      console.log(`No imageIds provided for character "${characterName}" (storyId: ${storyId})`);
    }

    console.log(`✓ Loaded ${imageMap.size}/${imageIds?.length || 0} images for character: ${characterName}`);
    
    // Log warning if some images are missing
    if (imageIds && imageIds.length > 0 && imageMap.size < imageIds.length) {
      const missing = imageIds.filter(id => !imageMap.has(id));
      console.warn(`⚠️ Missing ${missing.length} images for character "${characterName}":`, missing);
    }
    
    return imageMap;
  }

  /**
   * Delete all images for a specific character
   * @param storyId Story ID
   * @param characterName Character name
   */
  async deleteAllCharacterImages(
    storyId: string,
    characterName: string
  ): Promise<void> {
    // Note: We can't easily enumerate filesystem to find all images for a character
    // This would require scanning all image files and checking metadata
    // For now, this is a no-op
    // TODO: Implement filesystem enumeration if needed
    console.log(`Note: deleteAllCharacterImages(${characterName}) - filesystem enumeration not implemented`);
  }

  /**
   * Delete all character images for a specific story
   * Useful for cleanup when a story is deleted
   * @param storyId Story ID
   */
  async deleteCharacterImagesForStory(storyId: string): Promise<void> {
    // Note: We can't easily enumerate filesystem to find all images for a story
    // This would require scanning all image files and checking metadata
    // For now, this is a no-op
    // TODO: Implement filesystem enumeration if needed
    console.log(`Note: deleteCharacterImagesForStory(${storyId}) - filesystem enumeration not implemented`);
  }

  // ========================================
  // Book-Level Character Image Methods
  // ========================================

  /**
   * Store a book-level character image to filesystem
   * Uses bookId instead of storyId as the first part of the key
   */
  async storeBookCharacterImage(
    bookId: string,
    characterName: string,
    imageId: string,
    imageUrl: string,
    modelName: string
  ): Promise<void> {
    // Use the same storage mechanism, just prefix with "book:" to differentiate
    const prefixedBookId = `book:${bookId}`;
    return this.storeCharacterImage(prefixedBookId, characterName, imageId, imageUrl, modelName);
  }

  /**
   * Retrieve a book-level character image from filesystem
   */
  async getBookCharacterImage(
    bookId: string,
    characterName: string,
    imageId: string
  ): Promise<string | null> {
    const prefixedBookId = `book:${bookId}`;
    return this.getCharacterImage(prefixedBookId, characterName, imageId);
  }

  /**
   * Get all character images for a book-level character
   */
  async getAllBookCharacterImages(
    bookId: string,
    characterName: string,
    imageIds?: string[]
  ): Promise<Map<string, string>> {
    const prefixedBookId = `book:${bookId}`;
    return this.getAllCharacterImages(prefixedBookId, characterName, imageIds);
  }

  /**
   * Delete a specific book-level character image
   */
  async deleteBookCharacterImage(
    bookId: string,
    characterName: string,
    imageId: string
  ): Promise<void> {
    const prefixedBookId = `book:${bookId}`;
    return this.deleteCharacterImage(prefixedBookId, characterName, imageId);
  }

  /**
   * Delete all images for a book-level character
   */
  async deleteAllBookCharacterImages(
    bookId: string,
    characterName: string
  ): Promise<void> {
    const prefixedBookId = `book:${bookId}`;
    return this.deleteAllCharacterImages(prefixedBookId, characterName);
  }

  /**
   * Delete all character images for a specific book
   * Useful for cleanup when a book is deleted
   */
  async deleteCharacterImagesForBook(bookId: string): Promise<void> {
    const prefixedBookId = `book:${bookId}`;
    return this.deleteCharacterImagesForStory(prefixedBookId);
  }
}

// Export singleton instance
export const ImageStorageService = new ImageStorageServiceClass();
