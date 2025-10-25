/**
 * ImageStorageService - Persistent image storage using IndexedDB
 * 
 * Stores generated images as blobs in IndexedDB for persistence across sessions.
 * Images are keyed by their unique image ID from GeneratedImage.id
 */

const DB_NAME = 'StoryPromptImages';
const DB_VERSION = 1;
const STORE_NAME = 'images';

interface StoredImage {
  id: string;           // GeneratedImage.id
  sceneId: string;      // Scene ID for cleanup
  blob: Blob;           // The actual image data
  timestamp: Date;      // When it was stored
  modelName: string;    // Which model generated it
}

class ImageStorageServiceClass {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initDatabase();
  }

  /**
   * Initialize IndexedDB database
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✓ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('sceneId', 'sceneId', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✓ IndexedDB object store created');
        }
      };
    });
  }

  /**
   * Ensure database is ready before operations
   */
  private async ensureReady(): Promise<void> {
    await this.dbReady;
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
  }

  /**
   * Store an image in IndexedDB
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
    await this.ensureReady();

    try {
      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();

      const storedImage: StoredImage = {
        id: imageId,
        sceneId,
        blob,
        timestamp: new Date(),
        modelName
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.put(storedImage);

        request.onsuccess = () => {
          console.log(`✓ Image stored in IndexedDB: ${imageId} (${blob.size} bytes)`);
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to store image:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error storing image:', error);
      throw error;
    }
  }

  /**
   * Retrieve an image from IndexedDB
   * @param imageId Unique image ID
   * @returns Blob URL that can be used in <img> src, or null if not found
   */
  async getImage(imageId: string): Promise<string | null> {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(imageId);

      request.onsuccess = () => {
        const storedImage = request.result as StoredImage | undefined;
        if (storedImage && storedImage.blob) {
          // Create a blob URL from the stored blob
          const blobUrl = URL.createObjectURL(storedImage.blob);
          console.log(`✓ Image retrieved from IndexedDB: ${imageId}`);
          resolve(blobUrl);
        } else {
          console.log(`Image not found in IndexedDB: ${imageId}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to retrieve image:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a specific image from IndexedDB
   * @param imageId Unique image ID
   */
  async deleteImage(imageId: string): Promise<void> {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(imageId);

      request.onsuccess = () => {
        console.log(`✓ Image deleted from IndexedDB: ${imageId}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete image:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete all images for a specific scene
   * @param sceneId Scene ID
   */
  async deleteImagesForScene(sceneId: string): Promise<void> {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('sceneId');
      const request = index.openCursor(IDBKeyRange.only(sceneId));

      const imagesToDelete: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          imagesToDelete.push(cursor.value.id);
          cursor.continue();
        } else {
          // Delete all collected images
          imagesToDelete.forEach(id => {
            objectStore.delete(id);
          });
          console.log(`✓ Deleted ${imagesToDelete.length} images for scene: ${sceneId}`);
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to delete images for scene:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all stored image IDs
   * Useful for cleanup and debugging
   */
  async getAllImageIds(): Promise<string[]> {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAllKeys();

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };

      request.onerror = () => {
        console.error('Failed to get all image IDs:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{ count: number; totalSize: number }> {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const images = request.result as StoredImage[];
        const totalSize = images.reduce((sum, img) => sum + img.blob.size, 0);
        resolve({
          count: images.length,
          totalSize
        });
      };

      request.onerror = () => {
        console.error('Failed to get storage stats:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all stored images (useful for debugging/cleanup)
   */
  async clearAll(): Promise<void> {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log('✓ All images cleared from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear images:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const ImageStorageService = new ImageStorageServiceClass();

