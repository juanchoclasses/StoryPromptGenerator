/**
 * Electron-specific FileSystemService implementation
 * Replaces browser File System Access API with Electron IPC
 */

interface ElectronAPI {
  selectDirectory: () => Promise<{ success: boolean; path?: string; error?: string }>;
  getDirectoryPath: () => Promise<{ path: string | null }>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  readFileBinary: (filePath: string) => Promise<{ success: boolean; data?: ArrayBuffer; byteOffset?: number; byteLength?: number; error?: string }>;
  writeFileBinary: (filePath: string, buffer: ArrayBuffer) => Promise<{ success: boolean; error?: string }>;
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  fileExists: (filePath: string) => Promise<{ exists: boolean }>;
  readDirectory: (dirPath: string) => Promise<{ success: boolean; files?: string[]; directories?: string[]; error?: string }>;
  createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  getStoreValue: (key: string) => Promise<any>;
  setStoreValue: (key: string, value: any) => Promise<void>;
  deleteStoreValue: (key: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

const CACHE_DIR_NAME = 'prompter-cache';

export class ElectronFileSystemService {
  private static baseDirectory: string | null = null;

  /**
   * Check if running in Electron
   */
  static isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  /**
   * Select directory dialog
   */
  static async selectDirectory(): Promise<{ 
    success: boolean; 
    path?: string; 
    error?: string;
    hasExistingData?: boolean;
    oldPath?: string;
  }> {
    if (!this.isElectron()) {
      return { success: false, error: 'Not running in Electron' };
    }

    try {
      // Get old path before selecting new one
      const oldPath = await this.getDirectoryPath();
      const hasExistingData = oldPath ? await this.hasDataInDirectory(oldPath) : false;

      const result = await window.electronAPI!.selectDirectory();
      
      if (result.success && result.path) {
        this.baseDirectory = result.path;
        return {
          success: true,
          path: result.path,
          hasExistingData,
          oldPath: oldPath || undefined
        };
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the current base directory path
   */
  static async getDirectoryPath(): Promise<string | null> {
    if (!this.isElectron()) {
      return null;
    }

    if (this.baseDirectory) {
      return this.baseDirectory;
    }

    // Try to load from store
    try {
      const result = await window.electronAPI!.getDirectoryPath();
      if (result.path) {
        this.baseDirectory = result.path;
        return result.path;
      }
    } catch (error) {
      console.error('Error getting directory path:', error);
    }

    return null;
  }

  /**
   * Check if directory has prompter-cache data
   */
  static async hasDataInDirectory(dirPath: string): Promise<boolean> {
    if (!this.isElectron()) {
      return false;
    }

    try {
      const cachePath = `${dirPath}/${CACHE_DIR_NAME}`;
      const result = await window.electronAPI!.fileExists(cachePath);
      return result.exists;
    } catch {
      return false;
    }
  }

  /**
   * Read text file
   */
  static async readFile(relativePath: string): Promise<string | null> {
    if (!this.isElectron()) {
      return null;
    }

    const baseDir = await this.getDirectoryPath();
    if (!baseDir) {
      throw new Error('No directory selected');
    }

    const fullPath = this.joinPath(baseDir, relativePath);
    const result = await window.electronAPI!.readFile(fullPath);
    
    if (result.success && result.content !== undefined) {
      return result.content;
    }
    
    throw new Error(result.error || 'Failed to read file');
  }

  /**
   * Write text file
   */
  static async writeFile(relativePath: string, content: string): Promise<void> {
    if (!this.isElectron()) {
      throw new Error('Not running in Electron');
    }

    const baseDir = await this.getDirectoryPath();
    if (!baseDir) {
      throw new Error('No directory selected');
    }

    const fullPath = this.joinPath(baseDir, relativePath);
    const result = await window.electronAPI!.writeFile(fullPath, content);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to write file');
    }
  }

  /**
   * Read binary file (for images)
   */
  static async readFileBinary(relativePath: string): Promise<ArrayBuffer | null> {
    if (!this.isElectron()) {
      return null;
    }

    const baseDir = await this.getDirectoryPath();
    if (!baseDir) {
      throw new Error('No directory selected');
    }

    const fullPath = this.joinPath(baseDir, relativePath);
    const result = await window.electronAPI!.readFileBinary(fullPath);
    
    if (result.success && result.data) {
      // Convert to ArrayBuffer
      return result.data.slice(result.byteOffset || 0, (result.byteOffset || 0) + (result.byteLength || 0));
    }
    
    throw new Error(result.error || 'Failed to read file');
  }

  /**
   * Write binary file (for images)
   */
  static async writeFileBinary(relativePath: string, buffer: ArrayBuffer): Promise<void> {
    if (!this.isElectron()) {
      throw new Error('Not running in Electron');
    }

    const baseDir = await this.getDirectoryPath();
    if (!baseDir) {
      throw new Error('No directory selected');
    }

    const fullPath = this.joinPath(baseDir, relativePath);
    const result = await window.electronAPI!.writeFileBinary(fullPath, buffer);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to write file');
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(relativePath: string): Promise<void> {
    if (!this.isElectron()) {
      throw new Error('Not running in Electron');
    }

    const baseDir = await this.getDirectoryPath();
    if (!baseDir) {
      throw new Error('No directory selected');
    }

    const fullPath = this.joinPath(baseDir, relativePath);
    const result = await window.electronAPI!.deleteFile(fullPath);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete file');
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(relativePath: string): Promise<boolean> {
    if (!this.isElectron()) {
      return false;
    }

    const baseDir = await this.getDirectoryPath();
    if (!baseDir) {
      return false;
    }

    const fullPath = this.joinPath(baseDir, relativePath);
    const result = await window.electronAPI!.fileExists(fullPath);
    return result.exists;
  }

  /**
   * List directory contents
   */
  static async listDirectory(relativePath: string = ''): Promise<{ files: string[]; directories: string[] }> {
    if (!this.isElectron()) {
      return { files: [], directories: [] };
    }

    const baseDir = await this.getDirectoryPath();
    if (!baseDir) {
      return { files: [], directories: [] };
    }

    const fullPath = relativePath ? this.joinPath(baseDir, relativePath) : baseDir;
    const result = await window.electronAPI!.readDirectory(fullPath);
    
    if (result.success) {
      return {
        files: result.files || [],
        directories: result.directories || []
      };
    }
    
    return { files: [], directories: [] };
  }

  /**
   * Create directory
   */
  static async createDirectory(relativePath: string): Promise<void> {
    if (!this.isElectron()) {
      throw new Error('Not running in Electron');
    }

    const baseDir = await this.getDirectoryPath();
    if (!baseDir) {
      throw new Error('No directory selected');
    }

    const fullPath = this.joinPath(baseDir, relativePath);
    const result = await window.electronAPI!.createDirectory(fullPath);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create directory');
    }
  }

  /**
   * Join path segments (cross-platform)
   */
  private static joinPath(...segments: string[]): string {
    if (segments.length === 0) return '';
    
    // Check if first segment starts with / (absolute path)
    const isAbsolute = segments[0].startsWith('/');
    
    // Remove leading/trailing slashes from all segments
    const cleaned = segments.map(s => s.replace(/^\/+|\/+$/g, ''));
    
    // Join and restore leading slash if it was absolute
    const joined = cleaned.filter(s => s.length > 0).join('/');
    return isAbsolute ? '/' + joined : joined;
  }

  /**
   * Get store value (replaces localStorage.getItem)
   */
  static async getStoreValue(key: string): Promise<any> {
    if (!this.isElectron()) {
      return null;
    }

    try {
      return await window.electronAPI!.getStoreValue(key);
    } catch (error) {
      console.error(`Error getting store value for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set store value (replaces localStorage.setItem)
   */
  static async setStoreValue(key: string, value: any): Promise<void> {
    if (!this.isElectron()) {
      return;
    }

    try {
      await window.electronAPI!.setStoreValue(key, value);
    } catch (error) {
      console.error(`Error setting store value for key "${key}":`, error);
    }
  }

  /**
   * Delete store value (replaces localStorage.removeItem)
   */
  static async deleteStoreValue(key: string): Promise<void> {
    if (!this.isElectron()) {
      return;
    }

    try {
      await window.electronAPI!.deleteStoreValue(key);
    } catch (error) {
      console.error(`Error deleting store value for key "${key}":`, error);
    }
  }

  /**
   * Load all books metadata from filesystem
   * @returns Map of bookId -> book JSON string
   */
  static async loadAllBooksMetadata(): Promise<Map<string, string>> {
    const books = new Map<string, string>();
    
    if (!this.isElectron()) {
      return books;
    }

    try {
      const baseDir = await this.getDirectoryPath();
      if (!baseDir) {
        console.log('No base directory configured');
        return books;
      }

      const booksPath = this.joinPath(baseDir, CACHE_DIR_NAME, 'books');
      
      // Check if books directory exists
      const dirExists = await window.electronAPI!.fileExists(booksPath);
      if (!dirExists.exists) {
        console.log('Books directory does not exist:', booksPath);
        return books;
      }

      // Read books directory
      const dirResult = await window.electronAPI!.readDirectory(booksPath);
      if (!dirResult.success || !dirResult.files) {
        console.log('Failed to read books directory:', dirResult.error);
        return books;
      }

      // Load each book JSON file
      for (const filename of dirResult.files) {
        if (filename.endsWith('.json')) {
          try {
            const filePath = this.joinPath(booksPath, filename);
            const fileResult = await window.electronAPI!.readFile(filePath);
            
            if (fileResult.success && fileResult.content) {
              const bookId = filename.replace('.json', '');
              books.set(bookId, fileResult.content);
              console.log(`✓ Loaded book: ${bookId}`);
            }
          } catch (error) {
            console.error(`Error reading book file ${filename}:`, error);
          }
        }
      }

      console.log(`📚 Loaded ${books.size} books from Electron filesystem`);
    } catch (error) {
      console.error('Error loading books metadata:', error);
    }
    
    return books;
  }

  /**
   * Load app metadata from filesystem
   * @returns App metadata or null if not found
   */
  static async loadAppMetadata(): Promise<{ activeBookId?: string | null; settings?: any } | null> {
    if (!this.isElectron()) {
      return null;
    }

    try {
      const baseDir = await this.getDirectoryPath();
      if (!baseDir) {
        return null;
      }

      const metadataPath = this.joinPath(baseDir, CACHE_DIR_NAME, 'app-metadata.json');
      const result = await window.electronAPI!.readFile(metadataPath);
      
      if (result.success && result.content) {
        return JSON.parse(result.content);
      }
    } catch (error) {
      console.log('No app metadata found (this is normal for first run)');
    }

    return null;
  }

  /**
   * Save book metadata to filesystem
   * @param bookId Book ID
   * @param bookData Book data as JSON string
   * @returns Success status
   */
  static async saveBookMetadata(bookId: string, bookData: string): Promise<{ success: boolean; path?: string; error?: string }> {
    if (!this.isElectron()) {
      return { success: false, error: 'Not running in Electron' };
    }

    try {
      const baseDir = await this.getDirectoryPath();
      if (!baseDir) {
        return { success: false, error: 'Filesystem not configured' };
      }

      // Create books directory
      const booksDir = this.joinPath(baseDir, CACHE_DIR_NAME, 'books');
      await window.electronAPI!.createDirectory(booksDir);

      // Save book JSON file
      const bookPath = this.joinPath(CACHE_DIR_NAME, 'books', `${bookId}.json`);
      await this.writeFile(bookPath, bookData);

      return { 
        success: true,
        path: bookPath
      };
    } catch (error) {
      console.error('Error saving book metadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save book metadata'
      };
    }
  }

  /**
   * Save image with specific ID to prompter-cache directory
   * @param imageId Image ID
   * @param imageDataUrl Data URL of image
   * @param metadata Optional metadata (sceneId, characterName, etc.)
   * @returns Success status
   */
  static async saveImageById(
    imageId: string,
    imageDataUrl: string,
    metadata?: { sceneId?: string; characterName?: string; modelName?: string }
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    if (!this.isElectron()) {
      return { success: false, error: 'Not running in Electron' };
    }

    try {
      const baseDir = await this.getDirectoryPath();
      if (!baseDir) {
        return {
          success: false,
          error: 'No directory selected. Images will be stored in browser storage only.'
        };
      }

      // Determine subdirectory based on metadata
      let subdir = '';
      if (metadata?.sceneId) {
        subdir = 'scenes';
      } else if (metadata?.characterName) {
        subdir = 'characters';
      }

      // Create cache directory structure
      const cacheDir = this.joinPath(baseDir, CACHE_DIR_NAME);
      await window.electronAPI!.createDirectory(cacheDir);
      
      if (subdir) {
        const subdirPath = this.joinPath(cacheDir, subdir);
        await window.electronAPI!.createDirectory(subdirPath);
      }

      // Convert data URL to blob and then to ArrayBuffer
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Save image file
      const imagePath = subdir 
        ? this.joinPath(CACHE_DIR_NAME, subdir, `${imageId}.png`)
        : this.joinPath(CACHE_DIR_NAME, `${imageId}.png`);
      
      await this.writeFileBinary(imagePath, arrayBuffer);

      // Save metadata as JSON
      const metadataPath = subdir
        ? this.joinPath(CACHE_DIR_NAME, subdir, `${imageId}.json`)
        : this.joinPath(CACHE_DIR_NAME, `${imageId}.json`);
      
      const metadataJson = JSON.stringify({
        id: imageId,
        timestamp: new Date().toISOString(),
        ...metadata
      }, null, 2);

      await this.writeFile(metadataPath, metadataJson);

      return {
        success: true,
        path: imagePath
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
   * Delete image by ID from prompter-cache directory
   * @param imageId Image ID
   * @returns Success status
   */
  static async deleteImageById(imageId: string): Promise<boolean> {
    if (!this.isElectron()) {
      return false;
    }

    try {
      const baseDir = await this.getDirectoryPath();
      if (!baseDir) {
        return false;
      }

      // Try both scenes and characters directories
      const directories = ['scenes', 'characters'];
      let deleted = false;

      for (const dir of directories) {
        try {
          // Delete image file
          const imagePath = this.joinPath(CACHE_DIR_NAME, dir, `${imageId}.png`);
          const imageExists = await this.fileExists(imagePath);
          
          if (imageExists) {
            await this.deleteFile(imagePath);
            deleted = true;
          }

          // Delete metadata file
          const metadataPath = this.joinPath(CACHE_DIR_NAME, dir, `${imageId}.json`);
          const metadataExists = await this.fileExists(metadataPath);
          
          if (metadataExists) {
            await this.deleteFile(metadataPath);
          }
        } catch (error) {
          // Continue to next directory
          continue;
        }
      }

      return deleted;
    } catch (error) {
      console.error('Error deleting image by ID:', error);
      return false;
    }
  }

  /**
   * Load image by ID from prompter-cache directory
   * @param imageId Image ID
   * @returns Data URL of image or null if not found
   */
  static async loadImageById(imageId: string): Promise<string | null> {
    if (!this.isElectron()) {
      return null;
    }

    try {
      const baseDir = await this.getDirectoryPath();
      if (!baseDir) {
        return null;
      }

      // Try both scenes and characters directories
      const directories = ['scenes', 'characters'];
      
      for (const dir of directories) {
        try {
          const imagePath = this.joinPath(baseDir, CACHE_DIR_NAME, dir, `${imageId}.png`);
          const exists = await window.electronAPI!.fileExists(imagePath);
          
          if (exists) {
            const result = await window.electronAPI!.readFileBinary(imagePath);
            
            if (result.success && result.data) {
              // Convert ArrayBuffer to data URL
              const blob = new Blob([result.data], { type: 'image/png' });
              return await this.blobToDataURL(blob);
            }
          }
        } catch (error) {
          // Try next directory
          continue;
        }
      }

      // Not found in any directory
      return null;
    } catch (error) {
      console.error('Error loading image by ID:', error);
      return null;
    }
  }

  /**
   * Convert Blob to data URL
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
   * Save app metadata (activeBookId, settings, etc.) to filesystem
   * @param metadata App metadata object
   * @returns Success status
   */
  static async saveAppMetadata(metadata: { 
    activeBookId?: string | null;
    settings?: any;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron()) {
      return { success: false, error: 'Not running in Electron' };
    }

    try {
      const baseDir = await this.getDirectoryPath();
      if (!baseDir) {
        return { success: false, error: 'Filesystem not configured' };
      }

      // Ensure cache directory exists
      const cacheDir = this.joinPath(baseDir, CACHE_DIR_NAME);
      await window.electronAPI!.createDirectory(cacheDir);

      // Load existing metadata to merge
      let existingMetadata: any = {};
      try {
        const metadataPath = this.joinPath(baseDir, CACHE_DIR_NAME, 'app-metadata.json');
        const existingResult = await window.electronAPI!.readFile(metadataPath);
        if (existingResult.success && existingResult.content) {
          existingMetadata = JSON.parse(existingResult.content);
        }
      } catch {
        // File doesn't exist yet - start fresh
      }

      // Merge and save
      const metadataPath = this.joinPath(baseDir, CACHE_DIR_NAME, 'app-metadata.json');
      const metadataJson = JSON.stringify({
        ...existingMetadata,
        ...metadata,
        lastUpdated: new Date().toISOString()
      }, null, 2);

      const result = await window.electronAPI!.writeFile(metadataPath, metadataJson);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to save metadata' };
      }
    } catch (error) {
      console.error('Error saving app metadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save app metadata'
      };
    }
  }
}
