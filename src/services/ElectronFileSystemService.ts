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
    // Remove leading/trailing slashes and join
    const cleaned = segments.map(s => s.replace(/^\/+|\/+$/g, ''));
    return cleaned.join('/');
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
}

