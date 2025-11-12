/**
 * TestDirectoryService - Manages test data directory for safe testing
 * 
 * Creates and manages a dedicated test data directory that:
 * - Can be initialized from production data
 * - Can be extended with new test data for new features
 * - Is completely isolated from production
 * - Uses filesystem only (no IndexedDB dependency)
 */

import { FileSystemService } from './FileSystemService';
import { DirectoryMigrationService } from './DirectoryMigrationService';

const TEST_MODE_KEY = 'prompter-test-mode';
const TEST_DIRECTORY_KEY = 'prompter-test-directory';
const TEST_DIRECTORY_HANDLE_KEY = 'prompter-test-directory-handle'; // Store in filesystem metadata

export class TestDirectoryService {
  private static testDirectoryHandle: FileSystemDirectoryHandle | null = null;
  private static isTestMode = false;

  /**
   * Initialize test mode status from storage
   */
  private static initTestMode(): boolean {
    const testModeFlag = localStorage.getItem(TEST_MODE_KEY);
    return testModeFlag === 'true';
  }

  /**
   * Save test directory handle to filesystem metadata
   */
  private static async saveTestDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    // Store handle reference in memory and localStorage path
    this.testDirectoryHandle = handle;
    localStorage.setItem(TEST_DIRECTORY_KEY, handle.name);
    
    // Also save handle to a known location in the test directory itself
    // This allows us to restore it after page reload
    try {
      const cacheHandle = await handle.getDirectoryHandle('.prompter-cache', { create: true });
      const metadataHandle = await cacheHandle.getFileHandle('test-directory-handle.json', { create: true });
      const writable = await metadataHandle.createWritable();
      
      const metadata = {
        path: handle.name,
        createdAt: new Date().toISOString(),
        note: 'This is a test data directory. Production data is stored elsewhere.'
      };
      
      const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      console.warn('Failed to save test directory metadata:', error);
      // Non-critical - continue anyway
    }
  }

  /**
   * Load test directory handle from filesystem
   * Tries to restore handle by checking known test directories
   */
  private static async loadTestDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    const testPath = localStorage.getItem(TEST_DIRECTORY_KEY);
    if (!testPath) {
      return null;
    }

    // Try to restore handle by prompting user to reselect
    // We can't store FileSystemDirectoryHandle persistently, so we need user to reselect
    // But we can at least remember the path
    return null; // Will need user to reselect
  }

  /**
   * Initialize test data directory from production data
   * Creates a snapshot of production data for testing
   * @param overwriteExisting If true, overwrites existing test data
   * @returns Success status and test directory path
   */
  static async initializeTestDataFromProduction(overwriteExisting: boolean = false): Promise<{ 
    success: boolean; 
    path?: string; 
    error?: string;
    filesCopied?: number;
  }> {
    try {
      // Check if File System Access API is available
      if (!FileSystemService.isSupported()) {
        return {
          success: false,
          error: 'File System Access API not available'
        };
      }

      // Get production directory
      const productionHandle = await FileSystemService.getDirectoryHandle();
      if (!productionHandle) {
        return {
          success: false,
          error: 'No production directory configured'
        };
      }

      // Check if production directory has data
      const hasProductionData = await FileSystemService.hasDataInDirectory(productionHandle);
      
      if (!hasProductionData) {
        return {
          success: false,
          error: 'Production directory has no data to copy'
        };
      }

      // Get or create test directory
      let testHandle: FileSystemDirectoryHandle;
      const existingTestPath = localStorage.getItem(TEST_DIRECTORY_KEY);
      
      if (existingTestPath && !overwriteExisting) {
        // Try to use existing test directory
        // User will need to reselect it (we can't store handles persistently)
        const useExisting = window.confirm(
          `Test directory already configured: ${existingTestPath}\n\n` +
          'Select this directory again to use it, or select a new directory to create fresh test data.'
        );
        
        if (!useExisting) {
          return {
            success: false,
            error: 'Test directory setup cancelled'
          };
        }
      }

      // Ask user to select/create test directory
      testHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      // Check if test directory already has data
      const hasTestData = await FileSystemService.hasDataInDirectory(testHandle);
      
      if (hasTestData && !overwriteExisting) {
        const overwrite = window.confirm(
          'Test directory already contains data. Overwrite with production data?\n\n' +
          'This will replace all existing test data with a fresh copy from production.'
        );
        if (!overwrite) {
          return {
            success: false,
            error: 'Test directory setup cancelled'
          };
        }
      }

      // Copy production data to test directory
      const migrationResult = await DirectoryMigrationService.migrateDirectory(
        productionHandle,
        testHandle,
        (progress) => {
          console.log(`Copying: ${progress.currentFile} (${progress.current}/${progress.total})`);
        }
      );

      if (!migrationResult.success && migrationResult.filesCopied === 0) {
        return {
          success: false,
          error: migrationResult.error || 'Failed to copy data to test directory',
          filesCopied: 0
        };
      }

      // Store test directory handle
      this.testDirectoryHandle = testHandle;
      this.isTestMode = true;

      // Save test directory handle and metadata
      await this.saveTestDirectoryHandle(testHandle);

      // Save test mode state
      localStorage.setItem(TEST_MODE_KEY, 'true');

      return {
        success: true,
        path: testHandle.name,
        filesCopied: migrationResult.filesCopied
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Test directory selection cancelled'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Set up test directory (alias for initializeTestDataFromProduction)
   * @deprecated Use initializeTestDataFromProduction instead
   */
  static async setupTestDirectory(): Promise<{ success: boolean; path?: string; error?: string }> {
    const result = await this.initializeTestDataFromProduction();
    return {
      success: result.success,
      path: result.path,
      error: result.error
    };
  }

  /**
   * Check if we're in test mode
   */
  static isInTestMode(): boolean {
    // Check both runtime state and localStorage
    const storedTestMode = this.initTestMode();
    return storedTestMode || (this.isTestMode && this.testDirectoryHandle !== null);
  }

  /**
   * Get test directory handle synchronously (for FileSystemService check)
   * Only works if handle is already in memory
   */
  static getTestDirectoryHandleSync(): FileSystemDirectoryHandle | null {
    return this.testDirectoryHandle;
  }

  /**
   * Get test directory handle (async version)
   * If not in memory, tries to restore from storage
   */
  static async getTestDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    // Return cached handle if available
    if (this.testDirectoryHandle) {
      return this.testDirectoryHandle;
    }

    // If we're in test mode but handle not in memory (e.g., after page reload)
    // User needs to set up test directory again
    // We don't auto-restore to prevent accidentally using wrong directory
    return null;
  }

  /**
   * Exit test mode and return to production directory
   * Production directory was never changed, so we just clear test mode flags
   */
  static async exitTestMode(): Promise<{ success: boolean; error?: string }> {
    try {
      // Clear test mode state
      // This will make FileSystemService.getDirectoryHandle() return production directory again
      localStorage.removeItem(TEST_MODE_KEY);
      localStorage.removeItem(TEST_DIRECTORY_KEY);

      // Clear test mode
      this.isTestMode = false;
      this.testDirectoryHandle = null;

      // Production directory was never changed - it's still in FileSystemService
      // Just clearing test mode flags makes FileSystemService return production directory again

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * @deprecated Use exitTestMode instead
   */
  static async restoreProductionDirectory(): Promise<{ success: boolean; error?: string }> {
    return this.exitTestMode();
  }

  /**
   * Add new test data to the test directory
   * Useful for adding test cases for new features
   * @param sourceDirectory Directory containing new test data to add
   * @returns Success status and number of files added
   */
  static async addTestData(sourceDirectory: FileSystemDirectoryHandle): Promise<{ 
    success: boolean; 
    filesAdded?: number; 
    error?: string;
  }> {
    try {
      if (!this.isTestMode || !this.testDirectoryHandle) {
        return {
          success: false,
          error: 'Test mode not active. Please set up test directory first.'
        };
      }

      // Merge data from source into test directory
      const migrationResult = await DirectoryMigrationService.migrateDirectory(
        sourceDirectory,
        this.testDirectoryHandle,
        (progress) => {
          console.log(`Adding test data: ${progress.currentFile} (${progress.current}/${progress.total})`);
        }
      );

      return {
        success: migrationResult.success || migrationResult.filesCopied > 0,
        filesAdded: migrationResult.filesCopied,
        error: migrationResult.errors.length > 0 ? migrationResult.errors.join('; ') : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Refresh test data from production (re-copy production data)
   * This overwrites existing test data with fresh production data
   */
  static async refreshTestDataFromProduction(): Promise<{ 
    success: boolean; 
    filesCopied?: number; 
    error?: string;
  }> {
    return this.initializeTestDataFromProduction(true); // overwriteExisting = true
  }

  /**
   * Clean up test directory (delete .prompter-cache from test directory)
   * WARNING: This deletes all test data!
   */
  static async cleanupTestDirectory(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.testDirectoryHandle) {
        return {
          success: false,
          error: 'No test directory configured'
        };
      }

      // Delete test directory's .prompter-cache
      const deleted = await DirectoryMigrationService.deleteOldDirectory(this.testDirectoryHandle);
      
      if (deleted) {
        // Clear test directory handle
        this.testDirectoryHandle = null;
        this.isTestMode = false;
        localStorage.removeItem(TEST_MODE_KEY);
        localStorage.removeItem(TEST_DIRECTORY_KEY);
        
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: 'Failed to delete test directory data'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get test directory status
   */
  static getStatus(): {
    isTestMode: boolean;
    testDirectoryPath: string | null;
  } {
    const storedTestMode = this.initTestMode();
    const testPath = localStorage.getItem(TEST_DIRECTORY_KEY);
    
    return {
      isTestMode: storedTestMode || this.isTestMode,
      testDirectoryPath: testPath || this.testDirectoryHandle?.name || null
    };
  }

  /**
   * Reselect test directory (useful after page reload)
   * Prompts user to reselect the test directory
   */
  static async reselectTestDirectory(): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const existingPath = localStorage.getItem(TEST_DIRECTORY_KEY);
      const message = existingPath 
        ? `Please reselect your test directory: ${existingPath}`
        : 'Please select your test directory';

      const testHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      // Verify this directory has test data
      const hasTestData = await FileSystemService.hasDataInDirectory(testHandle);
      if (!hasTestData) {
        const create = window.confirm(
          'Selected directory does not contain test data.\n\n' +
          'Would you like to initialize it with production data?'
        );
        if (create) {
          return this.initializeTestDataFromProduction(true);
        } else {
          return {
            success: false,
            error: 'Test directory must contain test data'
          };
        }
      }

      // Store handle
      this.testDirectoryHandle = testHandle;
      this.isTestMode = true;
      await this.saveTestDirectoryHandle(testHandle);
      localStorage.setItem(TEST_MODE_KEY, 'true');

      return {
        success: true,
        path: testHandle.name
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Directory selection cancelled'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

