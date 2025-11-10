// File System Access API Service for automatic image saving
const DB_NAME = 'StoryPrompterFS';
const DB_VERSION = 1;
const STORE_NAME = 'fileHandles';
const DIRECTORY_KEY = 'saveDirectory';

export class FileSystemService {
  private static db: IDBDatabase | null = null;
  private static directoryHandle: FileSystemDirectoryHandle | null = null;

  // Check if File System Access API is supported
  static isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  // Initialize IndexedDB for storing directory handle
  private static async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  // Save directory handle to IndexedDB
  private static async saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(handle, DIRECTORY_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Load directory handle from IndexedDB
  private static async loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(DIRECTORY_KEY);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error loading directory handle:', error);
      return null;
    }
  }

  // Request directory selection from user
  static async selectDirectory(): Promise<{ success: boolean; path?: string; error?: string }> {
    if (!this.isSupported()) {
      return {
        success: false,
        error: 'File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.'
      };
    }

    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      await this.saveDirectoryHandle(handle);
      this.directoryHandle = handle;

      return {
        success: true,
        path: handle.name
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Directory selection cancelled' };
      }
      console.error('Error selecting directory:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get current directory handle (load from storage if needed)
  static async getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    if (this.directoryHandle) {
      // Verify we still have permission
      const permission = await this.directoryHandle.queryPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        return this.directoryHandle;
      }
    }

    // Try to load from storage
    const handle = await this.loadDirectoryHandle();
    if (handle) {
      const permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        this.directoryHandle = handle;
        return handle;
      }
      // Request permission again
      const newPermission = await handle.requestPermission({ mode: 'readwrite' });
      if (newPermission === 'granted') {
        this.directoryHandle = handle;
        return handle;
      }
    }

    return null;
  }

  // Get directory name/path
  static async getDirectoryPath(): Promise<string | null> {
    const handle = await this.getDirectoryHandle();
    return handle ? handle.name : null;
  }

  // Clear directory handle (forget directory)
  static async clearDirectory(): Promise<void> {
    this.directoryHandle = null;
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(DIRECTORY_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Save image to book subdirectory
  static async saveImage(
    imageDataUrl: string,
    bookTitle: string,
    sceneTitle: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const parentHandle = await this.getDirectoryHandle();
      if (!parentHandle) {
        return {
          success: false,
          error: 'No directory selected. Please select a save directory in Settings.'
        };
      }

      // Sanitize names for file system
      const sanitizedBookTitle = this.sanitizeFilename(bookTitle);
      const sanitizedSceneTitle = this.sanitizeFilename(sceneTitle);

      // Create or get book subdirectory
      const bookDirHandle = await parentHandle.getDirectoryHandle(sanitizedBookTitle, { create: true });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${sanitizedSceneTitle}_${timestamp}.png`;

      // Create file
      const fileHandle = await bookDirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();

      // Convert data URL to blob
      const blob = await this.dataURLtoBlob(imageDataUrl);

      // Write blob to file
      await writable.write(blob);
      await writable.close();

      return {
        success: true,
        path: `${sanitizedBookTitle}/${filename}`
      };
    } catch (error) {
      console.error('Error saving image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save image'
      };
    }
  }

  // Sanitize filename (remove invalid characters)
  private static sanitizeFilename(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length
  }

  // Convert data URL to Blob
  private static async dataURLtoBlob(dataURL: string): Promise<Blob> {
    const response = await fetch(dataURL);
    return response.blob();
  }

  /**
   * Save image with specific ID to .prompter-cache directory
   * Used for automatic image storage (scene images, character images)
   */
  static async saveImageById(
    imageId: string,
    imageDataUrl: string,
    metadata?: { sceneId?: string; characterName?: string; modelName?: string }
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const parentHandle = await this.getDirectoryHandle();
      if (!parentHandle) {
        return {
          success: false,
          error: 'No directory selected. Images will be stored in browser storage only.'
        };
      }

      // Create .prompter-cache subdirectory
      const cacheHandle = await parentHandle.getDirectoryHandle('.prompter-cache', { create: true });
      
      // Organize by type
      let typeHandle: FileSystemDirectoryHandle;
      if (metadata?.sceneId) {
        typeHandle = await cacheHandle.getDirectoryHandle('scenes', { create: true });
      } else if (metadata?.characterName) {
        typeHandle = await cacheHandle.getDirectoryHandle('characters', { create: true });
      } else {
        typeHandle = cacheHandle;
      }

      // Create file with imageId as name
      const filename = `${imageId}.png`;
      const fileHandle = await typeHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();

      // Convert data URL to blob
      const blob = await this.dataURLtoBlob(imageDataUrl);

      // Write blob to file
      await writable.write(blob);
      await writable.close();

      // Also save metadata as JSON
      const metadataFilename = `${imageId}.json`;
      const metadataHandle = await typeHandle.getFileHandle(metadataFilename, { create: true });
      const metadataWritable = await metadataHandle.createWritable();
      await metadataWritable.write(JSON.stringify({
        id: imageId,
        timestamp: new Date().toISOString(),
        ...metadata
      }));
      await metadataWritable.close();

      return {
        success: true,
        path: `.prompter-cache/${metadata?.sceneId ? 'scenes' : metadata?.characterName ? 'characters' : ''}/${filename}`
      };
    } catch (error) {
      console.error('Error saving image by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save image'
      };
    }
  }

  /**
   * Load image by ID from .prompter-cache directory
   */
  static async loadImageById(imageId: string): Promise<string | null> {
    try {
      const parentHandle = await this.getDirectoryHandle();
      if (!parentHandle) {
        return null;
      }

      // Try .prompter-cache subdirectory
      const cacheHandle = await parentHandle.getDirectoryHandle('.prompter-cache', { create: false });
      
      // Try both scenes and characters directories
      const directories = ['scenes', 'characters', '.'];
      
      for (const dir of directories) {
        try {
          const typeHandle = dir === '.' ? cacheHandle : await cacheHandle.getDirectoryHandle(dir, { create: false });
          const filename = `${imageId}.png`;
          const fileHandle = await typeHandle.getFileHandle(filename, { create: false });
          const file = await fileHandle.getFile();
          const blob = new Blob([await file.arrayBuffer()], { type: 'image/png' });
          return URL.createObjectURL(blob);
        } catch {
          // Try next directory
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error loading image by ID:', error);
      return null;
    }
  }

  /**
   * Delete image by ID from .prompter-cache directory
   */
  static async deleteImageById(imageId: string): Promise<boolean> {
    try {
      const parentHandle = await this.getDirectoryHandle();
      if (!parentHandle) {
        return false;
      }

      const cacheHandle = await parentHandle.getDirectoryHandle('.prompter-cache', { create: false });
      
      // Try both scenes and characters directories
      const directories = ['scenes', 'characters', '.'];
      
      for (const dir of directories) {
        try {
          const typeHandle = dir === '.' ? cacheHandle : await cacheHandle.getDirectoryHandle(dir, { create: false });
          await typeHandle.removeEntry(`${imageId}.png`);
          await typeHandle.removeEntry(`${imageId}.json`).catch(() => {}); // Ignore if metadata doesn't exist
          return true;
        } catch {
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting image by ID:', error);
      return false;
    }
  }

  /**
   * Check if filesystem storage is available and configured
   */
  static async isConfigured(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const handle = await this.getDirectoryHandle();
    return handle !== null;
  }

  /**
   * Check if a file exists at the specified path
   * @param path Path relative to root directory (e.g., ".prompter-cache/scenes/abc123.png")
   * @returns true if file exists, false otherwise
   */
  static async fileExists(path: string): Promise<boolean> {
    try {
      const parentHandle = await this.getDirectoryHandle();
      if (!parentHandle) return false;

      const parts = path.split('/');
      let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = parentHandle;

      // Navigate through directories
      for (let i = 0; i < parts.length - 1; i++) {
        if (currentHandle.kind === 'directory') {
          currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(
            parts[i],
            { create: false }
          );
        }
      }

      // Check for the file
      const filename = parts[parts.length - 1];
      if (currentHandle.kind === 'directory') {
        await (currentHandle as FileSystemDirectoryHandle).getFileHandle(filename, { create: false });
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get file size in bytes
   * @param path Path relative to root directory
   * @returns File size in bytes, or null if file doesn't exist
   */
  static async getFileSize(path: string): Promise<number | null> {
    try {
      const parentHandle = await this.getDirectoryHandle();
      if (!parentHandle) return null;

      const parts = path.split('/');
      let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = parentHandle;

      // Navigate through directories
      for (let i = 0; i < parts.length - 1; i++) {
        if (currentHandle.kind === 'directory') {
          currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(
            parts[i],
            { create: false }
          );
        }
      }

      // Get the file
      const filename = parts[parts.length - 1];
      if (currentHandle.kind === 'directory') {
        const fileHandle = await (currentHandle as FileSystemDirectoryHandle).getFileHandle(
          filename,
          { create: false }
        );
        const file = await fileHandle.getFile();
        return file.size;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Save image to a specific path with directory creation
   * @param path Path relative to root directory (will create directories as needed)
   * @param imageDataUrl Image data URL or blob URL
   * @returns Success status
   */
  static async saveImageToPath(
    path: string,
    imageDataUrl: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const parentHandle = await this.getDirectoryHandle();
      if (!parentHandle) {
        return {
          success: false,
          error: 'No directory selected. Please select a save directory in Settings.'
        };
      }

      const parts = path.split('/');
      const filename = parts.pop()!;
      let currentHandle: FileSystemDirectoryHandle = parentHandle;

      // Create directory structure
      for (const dir of parts) {
        currentHandle = await currentHandle.getDirectoryHandle(dir, { create: true });
      }

      // Create file
      const fileHandle = await currentHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();

      // Convert data URL to blob
      const blob = await this.dataURLtoBlob(imageDataUrl);

      // Write blob to file
      await writable.write(blob);
      await writable.close();

      return {
        success: true,
        path: path
      };
    } catch (error) {
      console.error('Error saving image to path:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save image'
      };
    }
  }
}


