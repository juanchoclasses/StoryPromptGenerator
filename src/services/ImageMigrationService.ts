/**
 * ImageMigrationService - Handles migration of images from IndexedDB to filesystem
 * 
 * This service provides functionality to:
 * 1. Scan IndexedDB for all stored images
 * 2. Check which images are already on disk
 * 3. Copy missing images to filesystem
 * 4. Provide progress tracking and statistics
 */

import { FileSystemService } from './FileSystemService';
import { BookService } from './BookService';

export interface MigrationStats {
  totalImages: number;
  alreadyOnDisk: number;
  needsMigration: number;
  migrated: number;
  failed: number;
  skipped: number;
  totalSizeMB: number;
}

export interface MigrationProgress {
  current: number;
  total: number;
  currentFile: string;
  status: 'scanning' | 'migrating' | 'complete' | 'error';
  error?: string;
}

export interface ImageToMigrate {
  id: string;
  storyId: string;
  characterName?: string;
  type: 'scene' | 'character';
  blob: Blob;
  path: string; // Destination path on disk
}

const DB_NAME = 'StoryPromptImages';
const STORE_NAME = 'images';
const CHARACTER_STORE_NAME = 'character-images';

export class ImageMigrationService {
  /**
   * Scan IndexedDB and determine what needs to be migrated
   */
  static async analyzeImages(): Promise<MigrationStats> {
    const stats: MigrationStats = {
      totalImages: 0,
      alreadyOnDisk: 0,
      needsMigration: 0,
      migrated: 0,
      failed: 0,
      skipped: 0,
      totalSizeMB: 0
    };

    try {
      const db = await this.openDB();
      
      // Scan scene images
      const sceneImages = await this.getAll(db, STORE_NAME);
      stats.totalImages += sceneImages.length;
      
      for (const img of sceneImages) {
        const path = `.prompter-cache/scenes/${img.id}.png`;
        const exists = await FileSystemService.fileExists(path);
        if (exists) {
          stats.alreadyOnDisk++;
        } else {
          stats.needsMigration++;
        }
        stats.totalSizeMB += img.blob.size / (1024 * 1024);
      }

      // Scan character images
      const characterImages = await this.getAll(db, CHARACTER_STORE_NAME);
      stats.totalImages += characterImages.length;

      for (const img of characterImages) {
        const path = `.prompter-cache/characters/${img.imageId}.png`;
        const exists = await FileSystemService.fileExists(path);
        if (exists) {
          stats.alreadyOnDisk++;
        } else {
          stats.needsMigration++;
        }
        stats.totalSizeMB += img.blob.size / (1024 * 1024);
      }

      db.close();
    } catch (error) {
      console.error('Error analyzing images:', error);
      throw error;
    }

    return stats;
  }

  /**
   * Migrate all images from IndexedDB to filesystem
   * @param onProgress Callback for progress updates
   */
  static async migrateAllImages(
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationStats> {
    const stats: MigrationStats = {
      totalImages: 0,
      alreadyOnDisk: 0,
      needsMigration: 0,
      migrated: 0,
      failed: 0,
      skipped: 0,
      totalSizeMB: 0
    };

    try {
      // First, check if filesystem is configured
      const isConfigured = await FileSystemService.isConfigured();
      if (!isConfigured) {
        throw new Error('Filesystem not configured. Please select a save directory in Settings.');
      }

      onProgress?.({
        current: 0,
        total: 0,
        currentFile: 'Scanning IndexedDB...',
        status: 'scanning'
      });

      const db = await this.openDB();

      // Get all images to migrate
      const imagesToMigrate: ImageToMigrate[] = [];

      // Scene images
      const sceneImages = await this.getAll(db, STORE_NAME);
      stats.totalImages += sceneImages.length;

      for (const img of sceneImages) {
        const path = `.prompter-cache/scenes/${img.id}.png`;
        const exists = await FileSystemService.fileExists(path);
        
        if (exists) {
          stats.alreadyOnDisk++;
        } else {
          imagesToMigrate.push({
            id: img.id,
            storyId: img.sceneId,
            type: 'scene',
            blob: img.blob,
            path
          });
        }
        stats.totalSizeMB += img.blob.size / (1024 * 1024);
      }

      // Character images
      const characterImages = await this.getAll(db, CHARACTER_STORE_NAME);
      stats.totalImages += characterImages.length;

      for (const img of characterImages) {
        const path = `.prompter-cache/characters/${img.imageId}.png`;
        const exists = await FileSystemService.fileExists(path);
        
        if (exists) {
          stats.alreadyOnDisk++;
        } else {
          imagesToMigrate.push({
            id: img.imageId,
            storyId: img.storyId,
            characterName: img.characterName,
            type: 'character',
            blob: img.blob,
            path
          });
        }
        stats.totalSizeMB += img.blob.size / (1024 * 1024);
      }

      db.close();

      stats.needsMigration = imagesToMigrate.length;

      // Migrate images
      onProgress?.({
        current: 0,
        total: imagesToMigrate.length,
        currentFile: `Found ${imagesToMigrate.length} images to migrate`,
        status: 'migrating'
      });

      for (let i = 0; i < imagesToMigrate.length; i++) {
        const image = imagesToMigrate[i];
        
        onProgress?.({
          current: i + 1,
          total: imagesToMigrate.length,
          currentFile: `${image.type}: ${image.id}`,
          status: 'migrating'
        });

        try {
          // Convert blob to data URL
          const dataUrl = await this.blobToDataURL(image.blob);
          
          // Save to filesystem
          const result = await FileSystemService.saveImageToPath(image.path, dataUrl);
          
          if (result.success) {
            stats.migrated++;
          } else {
            console.error(`Failed to migrate ${image.id}:`, result.error);
            stats.failed++;
          }
        } catch (error) {
          console.error(`Error migrating ${image.id}:`, error);
          stats.failed++;
        }
      }

      onProgress?.({
        current: stats.migrated,
        total: imagesToMigrate.length,
        currentFile: 'Migration complete',
        status: 'complete'
      });

    } catch (error) {
      console.error('Migration failed:', error);
      onProgress?.({
        current: 0,
        total: 0,
        currentFile: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }

    return stats;
  }

  /**
   * Open IndexedDB connection
   */
  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records from a store
   */
  private static getAll(db: IDBDatabase, storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (error) {
        // Store might not exist
        resolve([]);
      }
    });
  }

  /**
   * Convert Blob to Data URL
   */
  private static blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Format bytes to human-readable size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

