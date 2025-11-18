/**
 * DirectoryMigrationService - Migrate data between storage directories
 * 
 * Handles copying all prompter-cache data from one directory to another
 * when user changes their storage directory.
 */

import { FileSystemService } from './FileSystemService';

export interface MigrationProgress {
  current: number;
  total: number;
  currentFile: string;
  status: 'scanning' | 'migrating' | 'complete' | 'error';
}

export interface MigrationResult {
  success: boolean;
  filesCopied: number;
  filesSkipped: number;
  errors: string[];
  error?: string;
}

export class DirectoryMigrationService {
  /**
   * Migrate all data from old directory to new directory
   * @param oldHandle Old directory handle
   * @param newHandle New directory handle
   * @param onProgress Progress callback
   * @returns Migration result
   */
  static async migrateDirectory(
    oldHandle: FileSystemDirectoryHandle,
    newHandle: FileSystemDirectoryHandle,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      filesCopied: 0,
      filesSkipped: 0,
      errors: []
    };

    try {
      // Check if old directory has prompter-cache
      let oldCacheHandle: FileSystemDirectoryHandle;
      try {
        oldCacheHandle = await oldHandle.getDirectoryHandle('prompter-cache', { create: false });
      } catch {
        // No old cache directory - nothing to migrate
        result.success = true;
        return result;
      }

      // Create new prompter-cache directory
      const newCacheHandle = await newHandle.getDirectoryHandle('prompter-cache', { create: true });

      // Collect all files to copy
      const filesToCopy: Array<{ path: string[]; file: FileSystemFileHandle }> = [];
      
      onProgress?.({
        current: 0,
        total: 0,
        currentFile: 'Scanning old directory...',
        status: 'scanning'
      });

      // Scan scenes directory
      await this.scanDirectory(oldCacheHandle, newCacheHandle, 'scenes', filesToCopy);
      
      // Scan characters directory
      await this.scanDirectory(oldCacheHandle, newCacheHandle, 'characters', filesToCopy);
      
      // Scan books directory
      await this.scanDirectory(oldCacheHandle, newCacheHandle, 'books', filesToCopy);

      const totalFiles = filesToCopy.length;
      
      onProgress?.({
        current: 0,
        total: totalFiles,
        currentFile: `Found ${totalFiles} files to migrate`,
        status: 'migrating'
      });

      // Copy each file
      for (let i = 0; i < filesToCopy.length; i++) {
        const { path, file } = filesToCopy[i];
        const fileName = path[path.length - 1];
        
        onProgress?.({
          current: i + 1,
          total: totalFiles,
          currentFile: fileName,
          status: 'migrating'
        });

        try {
          // Read file from old location
          const oldFile = await file.getFile();
          const fileData = await oldFile.arrayBuffer();

          // Create directory structure in new location
          let currentHandle = newCacheHandle;
          for (let j = 0; j < path.length - 1; j++) {
            currentHandle = await currentHandle.getDirectoryHandle(path[j], { create: true });
          }

          // Write file to new location
          const newFileHandle = await currentHandle.getFileHandle(fileName, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(fileData);
          await writable.close();

          result.filesCopied++;
        } catch (error) {
          const errorMsg = `Failed to copy ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg, error);
          result.errors.push(errorMsg);
        }
      }

      result.success = result.errors.length === 0 || result.filesCopied > 0;
      
      onProgress?.({
        current: totalFiles,
        total: totalFiles,
        currentFile: 'Migration complete',
        status: result.success ? 'complete' : 'error'
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.error = errorMsg;
      result.success = false;
      
      onProgress?.({
        current: 0,
        total: 0,
        currentFile: `Migration failed: ${errorMsg}`,
        status: 'error'
      });

      return result;
    }
  }

  /**
   * Scan a subdirectory and collect files to copy
   */
  private static async scanDirectory(
    oldCacheHandle: FileSystemDirectoryHandle,
    newCacheHandle: FileSystemDirectoryHandle,
    subdir: string,
    filesToCopy: Array<{ path: string[]; file: FileSystemFileHandle }>
  ): Promise<void> {
    try {
      const oldSubdirHandle = await oldCacheHandle.getDirectoryHandle(subdir, { create: false });
      
      // Recursively scan directory
      await this.scanDirectoryRecursive(oldSubdirHandle, [subdir], newCacheHandle, filesToCopy);
    } catch {
      // Directory doesn't exist - skip
    }
  }

  /**
   * Recursively scan directory for files
   */
  private static async scanDirectoryRecursive(
    currentHandle: FileSystemDirectoryHandle,
    currentPath: string[],
    newCacheHandle: FileSystemDirectoryHandle,
    filesToCopy: Array<{ path: string[]; file: FileSystemFileHandle }>
  ): Promise<void> {
    for await (const entry of currentHandle.values()) {
      if (entry.kind === 'file') {
        // Check if file already exists in new location
        try {
          let newHandle = newCacheHandle;
          for (const dir of currentPath) {
            newHandle = await newHandle.getDirectoryHandle(dir, { create: false });
          }
          await newHandle.getFileHandle(entry.name, { create: false });
          // File exists - skip
        } catch {
          // File doesn't exist - add to copy list
          filesToCopy.push({
            path: [...currentPath, entry.name],
            file: entry
          });
        }
      } else if (entry.kind === 'directory') {
        // Recursively scan subdirectory
        await this.scanDirectoryRecursive(
          entry,
          [...currentPath, entry.name],
          newCacheHandle,
          filesToCopy
        );
      }
    }
  }

  /**
   * Delete old directory's prompter-cache folder
   * @param oldHandle Old directory handle
   * @returns Success status
   */
  static async deleteOldDirectory(oldHandle: FileSystemDirectoryHandle): Promise<boolean> {
    try {
      const cacheHandle = await oldHandle.getDirectoryHandle('prompter-cache', { create: false });
      await oldHandle.removeEntry('prompter-cache', { recursive: true });
      return true;
    } catch (error) {
      console.error('Failed to delete old directory:', error);
      return false;
    }
  }
}

