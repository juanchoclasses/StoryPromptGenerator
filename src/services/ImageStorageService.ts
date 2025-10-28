/**
 * ImageStorageService - Persistent image storage using IndexedDB
 * 
 * Stores generated images as blobs in IndexedDB for persistence across sessions.
 * Images are keyed by their unique image ID from GeneratedImage.id
 */

const DB_NAME = 'StoryPromptImages';
const DB_VERSION = 2; // Incremented for character-images store
const STORE_NAME = 'images';
const CHARACTER_STORE_NAME = 'character-images';

interface StoredImage {
  id: string;           // GeneratedImage.id
  sceneId: string;      // Scene ID for cleanup
  blob: Blob;           // The actual image data
  timestamp: Date;      // When it was stored
  modelName: string;    // Which model generated it
}

interface StoredCharacterImage {
  id: string;           // Full key: storyId:characterName:imageId
  storyId: string;      // Story ID for cleanup
  characterName: string; // Character name for cleanup
  imageId: string;      // Individual image ID
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
        
        // Create scene images object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          objectStore.createIndex('sceneId', 'sceneId', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✓ IndexedDB scene images store created');
        }
        
        // Create character images object store if it doesn't exist (v4.1+)
        if (!db.objectStoreNames.contains(CHARACTER_STORE_NAME)) {
          const characterStore = db.createObjectStore(CHARACTER_STORE_NAME, { keyPath: 'id' });
          characterStore.createIndex('storyId', 'storyId', { unique: false });
          characterStore.createIndex('characterName', 'characterName', { unique: false });
          characterStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✓ IndexedDB character images store created');
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

  // ========================================
  // Character Image Methods (v4.1+)
  // ========================================

  /**
   * Store a character image in IndexedDB
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
    console.log('>>> storeCharacterImage called for:', characterName, imageId);
    console.log('    URL length:', imageUrl.length, 'chars');
    
    console.log('    Calling ensureReady()...');
    await this.ensureReady();
    console.log('    ✓ ensureReady() complete');
    console.log('    DB exists:', !!this.db);
    console.log('    DB object stores:', this.db ? Array.from(this.db.objectStoreNames) : 'none');
    
    // Check if CHARACTER_STORE_NAME exists
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    if (!this.db.objectStoreNames.contains(CHARACTER_STORE_NAME)) {
      console.error('CHARACTER_STORE_NAME not found in DB. Available stores:', Array.from(this.db.objectStoreNames));
      throw new Error(`Object store "${CHARACTER_STORE_NAME}" does not exist. Database may need to be upgraded.`);
    }
    console.log('    ✓ CHARACTER_STORE_NAME exists');

    try {
      // Convert image URL to blob
      let blob: Blob;
      
      if (imageUrl.startsWith('data:')) {
        // Data URL - convert directly to blob without fetch (avoid hanging on large data URLs)
        console.log('Converting data URL to blob (size:', imageUrl.length, 'chars)');
        const [metadata, base64Data] = imageUrl.split(',');
        const mimeMatch = metadata.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        
        // Decode base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        blob = new Blob([bytes], { type: mimeType });
        console.log('✓ Data URL converted to blob:', blob.size, 'bytes');
      } else if (imageUrl.startsWith('blob:')) {
        // Blob URL - fetch the blob
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status}`);
        }
        blob = await response.blob();
      } else {
        // HTTP URL - fetch the image
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        blob = await response.blob();
      }

      const fullKey = `${storyId}:${characterName}:${imageId}`;
      const storedImage: StoredCharacterImage = {
        id: fullKey,
        storyId,
        characterName,
        imageId,
        blob,
        timestamp: new Date(),
        modelName
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([CHARACTER_STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(CHARACTER_STORE_NAME);
        const request = objectStore.put(storedImage);

        request.onsuccess = () => {
          console.log(`✓ Character image stored: ${characterName}/${imageId} (${blob.size} bytes)`);
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to store character image:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error storing character image:', error);
      throw error;
    }
  }

  /**
   * Retrieve a character image from IndexedDB
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
    await this.ensureReady();

    const fullKey = `${storyId}:${characterName}:${imageId}`;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHARACTER_STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(CHARACTER_STORE_NAME);
      const request = objectStore.get(fullKey);

      request.onsuccess = () => {
        const storedImage = request.result as StoredCharacterImage | undefined;
        if (storedImage && storedImage.blob) {
          const blobUrl = URL.createObjectURL(storedImage.blob);
          console.log(`✓ Character image retrieved: ${characterName}/${imageId}`);
          resolve(blobUrl);
        } else {
          console.log(`Character image not found: ${characterName}/${imageId}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to retrieve character image:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a specific character image from IndexedDB
   * @param storyId Story ID
   * @param characterName Character name
   * @param imageId Unique image ID
   */
  async deleteCharacterImage(
    storyId: string,
    characterName: string,
    imageId: string
  ): Promise<void> {
    await this.ensureReady();

    const fullKey = `${storyId}:${characterName}:${imageId}`;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHARACTER_STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(CHARACTER_STORE_NAME);
      const request = objectStore.delete(fullKey);

      request.onsuccess = () => {
        console.log(`✓ Character image deleted: ${characterName}/${imageId}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete character image:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all character images for a specific character
   * @param storyId Story ID
   * @param characterName Character name
   * @returns Map of imageId -> blobUrl
   */
  async getAllCharacterImages(
    storyId: string,
    characterName: string
  ): Promise<Map<string, string>> {
    await this.ensureReady();

    // Check if character-images store exists
    if (!this.db!.objectStoreNames.contains(CHARACTER_STORE_NAME)) {
      console.log('Character images store not found - returning empty map');
      return new Map<string, string>();
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([CHARACTER_STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(CHARACTER_STORE_NAME);
        const index = objectStore.index('characterName');
        const request = index.openCursor(IDBKeyRange.only(characterName));

        const imageMap = new Map<string, string>();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const storedImage = cursor.value as StoredCharacterImage;
            // Only include images for this specific story
            if (storedImage.storyId === storyId) {
              const blobUrl = URL.createObjectURL(storedImage.blob);
              imageMap.set(storedImage.imageId, blobUrl);
            }
            cursor.continue();
          } else {
            console.log(`✓ Loaded ${imageMap.size} images for character: ${characterName}`);
            resolve(imageMap);
          }
        };

        request.onerror = () => {
          console.error('Failed to get character images:', request.error);
          // Resolve with empty map instead of rejecting
          resolve(new Map<string, string>());
        };

        // Add transaction error handler
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          resolve(new Map<string, string>());
        };
      } catch (error) {
        console.error('Error in getAllCharacterImages:', error);
        resolve(new Map<string, string>());
      }
    });
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
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHARACTER_STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(CHARACTER_STORE_NAME);
      const index = objectStore.index('characterName');
      const request = index.openCursor(IDBKeyRange.only(characterName));

      let deleteCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const storedImage = cursor.value as StoredCharacterImage;
          // Only delete images for this specific story
          if (storedImage.storyId === storyId) {
            objectStore.delete(cursor.primaryKey);
            deleteCount++;
          }
          cursor.continue();
        } else {
          console.log(`✓ Deleted ${deleteCount} images for character: ${characterName}`);
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to delete character images:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete all character images for a specific story
   * Useful for cleanup when a story is deleted
   * @param storyId Story ID
   */
  async deleteCharacterImagesForStory(storyId: string): Promise<void> {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHARACTER_STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(CHARACTER_STORE_NAME);
      const index = objectStore.index('storyId');
      const request = index.openCursor(IDBKeyRange.only(storyId));

      let deleteCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          objectStore.delete(cursor.primaryKey);
          deleteCount++;
          cursor.continue();
        } else {
          console.log(`✓ Deleted ${deleteCount} character images for story: ${storyId}`);
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to delete character images for story:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const ImageStorageService = new ImageStorageServiceClass();

