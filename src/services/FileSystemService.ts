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
}

