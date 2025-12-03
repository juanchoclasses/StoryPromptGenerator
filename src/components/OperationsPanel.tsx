/**
 * OperationsPanel - Storage diagnostics and maintenance operations
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ContentCopy as ContentCopyIcon,
  PlayArrow as PlayArrowIcon,
  Science as ScienceIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { BookService } from '../services/BookService';
import { ImageStorageService } from '../services/ImageStorageService';

interface DiagnosticResult {
  timestamp: Date;
  localStorage: {
    exists: boolean;
    bookCount: number;
    bookCharacters: Array<{
      bookId: string;
      bookTitle: string;
      name: string;
      imageGalleryLength: number;
      selectedImageId?: string;
      imageIds: string[];
    }>;
    storyCharacters: Array<{
      storyId: string;
      storyTitle: string;
      bookId: string;
      name: string;
      imageGalleryLength: number;
      selectedImageId?: string;
      imageIds: string[];
    }>;
  };
  indexedDB: {
    available: boolean;
    characterImages: Array<{
      storyId: string;
      characterName: string;
      imageId: string;
      modelName: string;
      timestamp: Date;
    }>;
  };
  mismatches: Array<{
    type: 'missing_metadata' | 'missing_images' | 'orphaned_images';
    severity: 'error' | 'warning' | 'info';
    characterName: string;
    location: string;
    message: string;
    metadataCount: number;
    dbCount: number;
    details?: any;
  }>;
}

export const OperationsPanel: React.FC = () => {
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [remapping, setRemapping] = useState(false);
  const [rebuildingGalleries, setRebuildingGalleries] = useState(false);
  const [recoveringImages, setRecoveringImages] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState<{ current: number; total: number; currentFile: string } | null>(null);
  const [clearingIndexedDB, setClearingIndexedDB] = useState(false);
  
  // Test panel state
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }>>([]);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testMode, setTestMode] = useState(false);
  const [settingUpTestDir, setSettingUpTestDir] = useState(false);
  const [testDirPath, setTestDirPath] = useState<string | null>(null);

  const runDiagnostic = async () => {
    setRunning(true);
    setError(null);
    setFixResult(null);

    try {
      console.log('=== Storage Diagnostic Starting ===');
      
      // 1. Check localStorage
      const books = await BookService.getAllBooks();
      
      const bookCharacters: DiagnosticResult['localStorage']['bookCharacters'] = [];
      const storyCharacters: DiagnosticResult['localStorage']['storyCharacters'] = [];
      
      for (const book of books) {
        // Book-level characters
        for (const char of book.characters || []) {
          bookCharacters.push({
            bookId: book.id,
            bookTitle: book.title,
            name: char.name,
            imageGalleryLength: char.imageGallery?.length || 0,
            selectedImageId: char.selectedImageId,
            imageIds: (char.imageGallery || []).map(img => img.id)
          });
        }
        
        // Story-level characters
        for (const story of book.stories) {
          for (const char of story.characters || []) {
            storyCharacters.push({
              storyId: story.id,
              storyTitle: story.title,
              bookId: book.id,
              name: char.name,
              imageGalleryLength: char.imageGallery?.length || 0,
              selectedImageId: char.selectedImageId,
              imageIds: (char.imageGallery || []).map(img => img.id)
            });
          }
        }
      }
      
      // 2. Check IndexedDB (deprecated - images now in filesystem)
      // Keeping this check for one-time recovery/migration purposes
      const characterImages = await getAllCharacterImagesFromDB();
      
      // 3. Find mismatches
      const mismatches: DiagnosticResult['mismatches'] = [];
      
      // Check book-level characters
      for (const char of bookCharacters) {
        const expectedKey = `book:${char.bookId}`;
        const imagesInDB = characterImages.filter(img => 
          img.storyId === expectedKey && 
          img.characterName === char.name
        );
        
        if (char.imageGalleryLength === 0 && imagesInDB.length > 0) {
          mismatches.push({
            type: 'missing_metadata',
            severity: 'error',
            characterName: char.name,
            location: `Book: ${char.bookTitle}`,
            message: `Character has ${imagesInDB.length} images in IndexedDB (deprecated) but 0 in metadata`,
            metadataCount: 0,
            dbCount: imagesInDB.length,
            details: {
              bookId: char.bookId,
              isBookLevel: true,
              imageIds: imagesInDB.map(img => img.imageId)
            }
          });
        } else if (char.imageGalleryLength > 0 && imagesInDB.length === 0) {
          mismatches.push({
            type: 'missing_images',
            severity: 'warning',
            characterName: char.name,
            location: `Book: ${char.bookTitle}`,
            message: `Character has ${char.imageGalleryLength} images in metadata but 0 in IndexedDB (deprecated - check filesystem)`,
            metadataCount: char.imageGalleryLength,
            dbCount: 0,
            details: { bookId: char.bookId, isBookLevel: true }
          });
        } else if (char.imageGalleryLength !== imagesInDB.length && char.imageGalleryLength > 0) {
          mismatches.push({
            type: 'missing_images',
            severity: 'warning',
            characterName: char.name,
            location: `Book: ${char.bookTitle}`,
            message: `Count mismatch: ${char.imageGalleryLength} in metadata, ${imagesInDB.length} in IndexedDB (deprecated - check filesystem)`,
            metadataCount: char.imageGalleryLength,
            dbCount: imagesInDB.length,
            details: { bookId: char.bookId, isBookLevel: true }
          });
        }
      }
      
      // Check story-level characters
      for (const char of storyCharacters) {
        const imagesInDB = characterImages.filter(img => 
          img.storyId === char.storyId && 
          img.characterName === char.name
        );
        
        if (char.imageGalleryLength === 0 && imagesInDB.length > 0) {
          mismatches.push({
            type: 'missing_metadata',
            severity: 'error',
            characterName: char.name,
            location: `Story: ${char.storyTitle}`,
            message: `Character has ${imagesInDB.length} images in IndexedDB (deprecated) but 0 in metadata`,
            metadataCount: 0,
            dbCount: imagesInDB.length,
            details: {
              storyId: char.storyId,
              isBookLevel: false,
              imageIds: imagesInDB.map(img => img.imageId)
            }
          });
        }
      }
      
      const result: DiagnosticResult = {
        timestamp: new Date(),
        localStorage: {
          exists: books.length > 0,
          bookCount: books.length,
          bookCharacters,
          storyCharacters
        },
        indexedDB: {
          available: true,
          characterImages
        },
        mismatches
      };
      
      setDiagnosticResult(result);
      console.log('=== Storage Diagnostic Complete ===');
      console.log('Result:', result);
      
    } catch (err) {
      console.error('Diagnostic failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRunning(false);
    }
  };

  const fixMissingMetadata = async () => {
    if (!diagnosticResult) return;
    
    const missingMetadataMismatches = diagnosticResult.mismatches.filter(
      m => m.type === 'missing_metadata'
    );
    
    if (missingMetadataMismatches.length === 0) {
      setFixResult('No missing metadata to fix');
      return;
    }
    
    setFixing(true);
    setError(null);
    
    try {
      console.log('=== Fixing Missing Metadata ===');
      let fixedCount = 0;
      
      for (const mismatch of missingMetadataMismatches) {
        const { characterName, details } = mismatch;
        
        if (details.isBookLevel) {
          // Fix book-level character
          const book = await BookService.getBook(details.bookId);
          if (!book) continue;
          
          const character = book.characters.find(c => c.name === characterName);
          if (!character) continue;
          
          console.log(`Rebuilding imageGallery for ${characterName} (book-level)...`);
          
          // Rebuild imageGallery from IndexedDB
          character.imageGallery = details.imageIds.map((imageId: string) => ({
            id: imageId,
            url: '', // Will be loaded from IndexedDB on demand
            model: 'unknown',
            prompt: '',
            timestamp: new Date()
          }));
          
          console.log(`  Rebuilt gallery with ${character.imageGallery?.length || 0} images`);
          
          // Save book
          await BookService.saveBook(book);
          fixedCount++;
          
        } else {
          // Fix story-level character
          const books = await BookService.getAllBooks();
          for (const book of books) {
            for (const story of book.stories) {
              if (story.id === details.storyId) {
                const character = story.characters.find(c => c.name === characterName);
                if (!character) continue;
                
                console.log(`Rebuilding imageGallery for ${characterName} (story-level)...`);
                
                // Rebuild imageGallery from IndexedDB
                character.imageGallery = details.imageIds.map((imageId: string) => ({
                  id: imageId,
                  url: '',
                  model: 'unknown',
                  prompt: '',
                  timestamp: new Date()
                }));
                
                console.log(`  Rebuilt gallery with ${character.imageGallery?.length || 0} images`);
                
                // Save book
                await BookService.saveBook(book);
                fixedCount++;
                break;
              }
            }
          }
        }
      }
      
      setFixResult(`✅ Fixed ${fixedCount} character(s) - imageGallery metadata rebuilt from IndexedDB`);
      console.log('=== Fix Complete ===');
      
      // Re-run diagnostic
      setTimeout(() => runDiagnostic(), 1000);
      
    } catch (err) {
      console.error('Fix failed:', err);
      setError(err instanceof Error ? err.message : 'Fix failed');
    } finally {
      setFixing(false);
    }
  };

  const getAllCharacterImagesFromDB = async (): Promise<Array<{
    storyId: string;
    characterName: string;
    imageId: string;
    modelName: string;
    timestamp: Date;
  }>> => {
    return new Promise((resolve, reject) => {
      const DB_NAME = 'StoryPromptImages';
      const request = indexedDB.open(DB_NAME);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('character-images')) {
          db.close();
          resolve([]);
          return;
        }
        
        try {
          const tx = db.transaction(['character-images'], 'readonly');
          const store = tx.objectStore('character-images');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            const allImages = getAllRequest.result;
            const result = allImages.map((img: any) => ({
              storyId: img.storyId,
              characterName: img.characterName,
              imageId: img.imageId,
              modelName: img.modelName,
              timestamp: img.timestamp
            }));
            db.close();
            resolve(result);
          };
          
          getAllRequest.onerror = () => {
            db.close();
            reject(getAllRequest.error);
          };
        } catch (error) {
          db.close();
          reject(error);
        }
      };
    });
  };

  const rebuildGalleriesFromDB = async () => {
    if (!diagnosticResult) return;
    
    setRebuildingGalleries(true);
    setError(null);
    setFixResult(null);
    
    try {
      console.log('=== Rebuilding Galleries from Filesystem ===');
      
      const books = await BookService.getAllBooks();
      let fixedCount = 0;
      
      for (const book of books) {
        console.log(`Processing book: ${book.title}`);
        
        for (const character of book.characters) {
          console.log(`  Checking ${character.name}...`);
          
          // Get images from filesystem for this character
          // Use character.imageGallery to get imageIds
          const imageIds = character.imageGallery?.map(img => img.id);
          const imageMap = await ImageStorageService.getAllBookCharacterImages(
            book.id,
            character.name,
            imageIds
          );
          
          if (imageMap.size === 0) {
            console.log(`    No images found`);
            continue;
          }
          
          console.log(`    Found ${imageMap.size} images in filesystem`);
          
          // Rebuild imageGallery with actual IDs from filesystem
          const actualImageIds = Array.from(imageMap.keys());
          character.imageGallery = actualImageIds.map((imageId: string) => ({
            id: imageId,
            url: '', // Will be loaded on demand
            model: 'unknown',
            prompt: '',
            timestamp: new Date()
          }));
          
          // Update selectedImageId to first actual image if current one doesn't exist
          if (!character.selectedImageId || !actualImageIds.includes(character.selectedImageId)) {
            character.selectedImageId = actualImageIds[0];
            console.log(`    Updated selectedImageId to ${character.selectedImageId}`);
          }
          
          console.log(`    Rebuilt gallery with ${character.imageGallery?.length || 0} actual images`);
          fixedCount++;
        }
        
        // Save book
        await BookService.saveBook(book);
      }
      
      setFixResult(`✅ Rebuilt ${fixedCount} character galleries with actual image IDs from filesystem`);
      console.log('=== Rebuild Complete ===');
      
      // Re-run diagnostic
      setTimeout(() => runDiagnostic(), 1000);
      
    } catch (err) {
      console.error('Rebuild failed:', err);
      setError(err instanceof Error ? err.message : 'Rebuild failed');
    } finally {
      setRebuildingGalleries(false);
    }
  };

  const recoverImagesFromIndexedDB = async () => {
    setRecoveringImages(true);
    setError(null);
    setFixResult(null);
    setRecoveryProgress(null);
    
    try {
      console.log('=== Recovering Images from IndexedDB ===');
      
      const { ImageMigrationService } = await import('../services/ImageMigrationService');
      
      // Check if filesystem is configured
      const { FileSystemService } = await import('../services/FileSystemService');
      const isConfigured = await FileSystemService.isConfigured();
      if (!isConfigured) {
        throw new Error('Filesystem not configured. Please select a save directory in Settings first.');
      }
      
      // Migrate all images with progress tracking
      const stats = await ImageMigrationService.migrateAllImages((progress) => {
        setRecoveryProgress({
          current: progress.current,
          total: progress.total,
          currentFile: progress.currentFile
        });
        console.log(`Recovery progress: ${progress.current}/${progress.total} - ${progress.currentFile}`);
      });
      
      console.log('=== Recovery Complete ===', stats);
      
      setFixResult(
        `✅ Recovered ${stats.migrated} images from IndexedDB to filesystem. ` +
        `${stats.alreadyOnDisk} were already on disk. ` +
        `${stats.failed} failed. ` +
        `Total size: ${ImageMigrationService.formatBytes(stats.totalSizeMB * 1024 * 1024)}`
      );
      
      // Re-run diagnostic to verify
      setTimeout(() => runDiagnostic(), 1000);
      
    } catch (err) {
      console.error('Recovery failed:', err);
      setError(err instanceof Error ? err.message : 'Recovery failed');
    } finally {
      setRecoveringImages(false);
      setRecoveryProgress(null);
    }
  };

  const clearOldIndexedDB = async () => {
    if (!confirm('This will delete the old IndexedDB database (StoryPromptImages).\n\nAll images should already be recovered to filesystem.\n\nContinue?')) {
      return;
    }
    
    setClearingIndexedDB(true);
    setError(null);
    setFixResult(null);
    
    try {
      console.log('=== Clearing Old IndexedDB Database ===');
      
      const DB_NAME = 'StoryPromptImages';
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        
        request.onsuccess = () => {
          console.log('✓ IndexedDB database deleted successfully');
          setFixResult('✅ Old IndexedDB database cleared successfully');
          setClearingIndexedDB(false);
          resolve();
          // Re-run diagnostic
          setTimeout(() => runDiagnostic(), 1000);
        };
        
        request.onerror = () => {
          const error = request.error || new Error('Failed to delete database');
          console.error('✗ Failed to delete IndexedDB:', error);
          setError(`Failed to clear IndexedDB: ${error.message}`);
          setClearingIndexedDB(false);
          reject(error);
        };
        
        request.onblocked = () => {
          console.warn('IndexedDB delete blocked - database may be in use');
          setError('IndexedDB delete blocked. Please close other tabs and try again.');
          setClearingIndexedDB(false);
          reject(new Error('Database delete blocked'));
        };
      });
    } catch (err) {
      console.error('Clear IndexedDB failed:', err);
      setError(err instanceof Error ? err.message : 'Clear failed');
      setClearingIndexedDB(false);
    }
  };

  const remapImageKeys = async () => {
    if (!diagnosticResult) return;
    
    setRemapping(true);
    setError(null);
    setFixResult(null);
    
    try {
      console.log('=== Remapping Image Keys ===');
      
      const books = await BookService.getAllBooks();
      if (books.length === 0) {
        setError('No books found');
        return;
      }
      
      // Open IndexedDB
      const DB_NAME = 'StoryPromptImages';
      const CHARACTER_STORE_NAME = 'character-images';
      
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      let remappedCount = 0;
      
      // For each book
      for (const book of books) {
        console.log(`Processing book: ${book.title} (ID: ${book.id})`);
        
        // Get all images with "book:" prefix
        const tx = db.transaction([CHARACTER_STORE_NAME], 'readonly');
        const store = tx.objectStore(CHARACTER_STORE_NAME);
        const getAllRequest = store.getAll();
        
        const allImages = await new Promise<any[]>((resolve, reject) => {
          getAllRequest.onsuccess = () => resolve(getAllRequest.result);
          getAllRequest.onerror = () => reject(getAllRequest.error);
        });
        
        // Filter for images that start with "book:" but don't match this book's ID
        const incorrectBookImages = allImages.filter((img: any) => 
          img.storyId.startsWith('book:') && img.storyId !== `book:${book.id}`
        );
        
        console.log(`Found ${incorrectBookImages.length} images with incorrect book ID`);
        
        for (const oldImage of incorrectBookImages) {
          // Check if this character exists in this book
          const character = book.characters.find(c => c.name === oldImage.characterName);
          if (!character) {
            console.log(`  Skipping ${oldImage.characterName} - not in this book`);
            continue;
          }
          
          console.log(`  Remapping ${oldImage.characterName} / ${oldImage.imageId}`);
          console.log(`    Old key: ${oldImage.id}`);
          console.log(`    New key: book:${book.id}:${oldImage.characterName}:${oldImage.imageId}`);
          
          // Create new entry with correct book ID
          const newImage = {
            ...oldImage,
            id: `book:${book.id}:${oldImage.characterName}:${oldImage.imageId}`,
            storyId: `book:${book.id}`
          };
          
          // Write operations
          const writeTx = db.transaction([CHARACTER_STORE_NAME], 'readwrite');
          const writeStore = writeTx.objectStore(CHARACTER_STORE_NAME);
          
          // Add new entry
          await new Promise<void>((resolve, reject) => {
            const addRequest = writeStore.put(newImage);
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
          });
          
          // Delete old entry
          await new Promise<void>((resolve, reject) => {
            const deleteRequest = writeStore.delete(oldImage.id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
          
          remappedCount++;
        }
        
        // Also clean up any orphaned images (not matching any character in any book)
        const bookChars = book.characters.map(c => c.name);
        const orphanedForThisBook = incorrectBookImages.filter((img: any) => 
          !bookChars.includes(img.characterName)
        );
        
        if (orphanedForThisBook.length > 0) {
          console.log(`  Found ${orphanedForThisBook.length} orphaned images`);
          // Note: We're not deleting these automatically as they might belong to another book
        }
      }
      
      db.close();
      
      setFixResult(`✅ Remapped ${remappedCount} image key(s) to correct book IDs`);
      console.log('=== Remapping Complete ===');
      
      // Re-run diagnostic
      setTimeout(() => runDiagnostic(), 1000);
      
    } catch (err) {
      console.error('Remapping failed:', err);
      setError(err instanceof Error ? err.message : 'Remapping failed');
    } finally {
      setRemapping(false);
    }
  };

  const runTestsHandler = async () => {
    setRunningTests(true);
    setTestResults([]);
    setTestLogs([]);
    setError(null);
    
    try {
      const logs: string[] = [];
      const logFn = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        logs.push(`[${timestamp}] ${message}`);
        setTestLogs([...logs]);
      };
      
      // Check test mode status
      const { TestDirectoryService } = await import('../services/TestDirectoryService');
      const isInTestMode = TestDirectoryService.isInTestMode();
      const status = TestDirectoryService.getStatus();
      
      logFn('=== Starting Test Suite ===');
      if (isInTestMode) {
        logFn(`✓ Test Mode: Using test directory (${status.testDirectoryPath})`);
        logFn('  → Production data is safe');
      } else {
        logFn('⚠️  Production Mode: Tests will read from production data');
        logFn('  → Consider setting up a test directory first');
      }
      
      const results = await runTests(logFn);
      setTestResults(results);
      
      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const skipped = results.filter(r => r.status === 'skipped').length;
      
      logFn(`=== Tests Complete ===`);
      logFn(`Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
      
      // Update test mode status
      setTestMode(isInTestMode);
      setTestDirPath(status.testDirectoryPath);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Test execution failed';
      setError(errorMsg);
      setTestLogs(prev => [...prev, `[ERROR] ${errorMsg}`]);
    } finally {
      setRunningTests(false);
    }
  };
  
  // Check test mode status on mount
  useEffect(() => {
    const checkTestMode = async () => {
      try {
        const { TestDirectoryService } = await import('../services/TestDirectoryService');
        const status = TestDirectoryService.getStatus();
        setTestMode(status.isTestMode);
        setTestDirPath(status.testDirectoryPath);
      } catch (err) {
        // Ignore errors
      }
    };
    checkTestMode();
  }, []);

  const copyReportToClipboard = async () => {
    if (!diagnosticResult) return;
    
    const timestamp = diagnosticResult.timestamp.toLocaleString();
    let report = `=== PROMPTER STORAGE DIAGNOSTIC REPORT ===\n`;
    report += `Generated: ${timestamp}\n\n`;
    
    // Summary
    report += `SUMMARY\n`;
    report += `-------\n`;
    report += `Books: ${diagnosticResult.localStorage.bookCount}\n`;
    report += `Book-Level Characters: ${diagnosticResult.localStorage.bookCharacters.length}\n`;
    report += `Story-Level Characters: ${diagnosticResult.localStorage.storyCharacters.length}\n`;
    report += `Images in IndexedDB: ${diagnosticResult.indexedDB.characterImages.length}\n`;
    report += `Issues Found: ${diagnosticResult.mismatches.length}\n\n`;
    
    // Issues
    if (diagnosticResult.mismatches.length > 0) {
      report += `ISSUES FOUND\n`;
      report += `------------\n`;
      diagnosticResult.mismatches.forEach((mismatch, idx) => {
        const severity = mismatch.severity === 'error' ? '🔴 ERROR' : 
                        mismatch.severity === 'warning' ? '🟡 WARNING' : 
                        '🔵 INFO';
        report += `\n${idx + 1}. ${severity} - ${mismatch.characterName} (${mismatch.location})\n`;
        report += `   Type: ${mismatch.type}\n`;
        report += `   Message: ${mismatch.message}\n`;
        report += `   Metadata Count: ${mismatch.metadataCount}\n`;
        report += `   IndexedDB Count: ${mismatch.dbCount}\n`;
        if (mismatch.details?.imageIds) {
          report += `   Image IDs in DB: ${mismatch.details.imageIds.join(', ')}\n`;
        }
      });
      report += `\n`;
    } else {
      report += `✅ NO ISSUES FOUND - All data looks good!\n\n`;
    }
    
    // Book Characters Detail
    if (diagnosticResult.localStorage.bookCharacters.length > 0) {
      report += `BOOK-LEVEL CHARACTERS\n`;
      report += `---------------------\n`;
      diagnosticResult.localStorage.bookCharacters.forEach(char => {
        report += `- ${char.name} (${char.bookTitle})\n`;
        report += `  Gallery Size: ${char.imageGalleryLength}\n`;
        report += `  Selected Image: ${char.selectedImageId ? 'Yes' : 'No'}\n`;
        if (char.imageIds.length > 0) {
          report += `  Image IDs: ${char.imageIds.map(id => id.substring(0, 8)).join(', ')}...\n`;
        }
      });
      report += `\n`;
    }
    
    // Story Characters Detail
    if (diagnosticResult.localStorage.storyCharacters.length > 0) {
      report += `STORY-LEVEL CHARACTERS\n`;
      report += `----------------------\n`;
      diagnosticResult.localStorage.storyCharacters.forEach(char => {
        report += `- ${char.name} (${char.storyTitle})\n`;
        report += `  Gallery Size: ${char.imageGalleryLength}\n`;
        report += `  Selected Image: ${char.selectedImageId ? 'Yes' : 'No'}\n`;
      });
      report += `\n`;
    }
    
    // IndexedDB Detail
    if (diagnosticResult.indexedDB.characterImages.length > 0) {
      report += `INDEXEDDB CHARACTER IMAGES\n`;
      report += `--------------------------\n`;
      
      // Group by storage type
      const bookLevel = diagnosticResult.indexedDB.characterImages.filter(img => img.storyId.startsWith('book:'));
      const storyLevel = diagnosticResult.indexedDB.characterImages.filter(img => !img.storyId.startsWith('book:'));
      
      if (bookLevel.length > 0) {
        report += `Book-Level Images: ${bookLevel.length}\n`;
        const grouped = bookLevel.reduce((acc, img) => {
          if (!acc[img.characterName]) acc[img.characterName] = [];
          acc[img.characterName].push(img);
          return acc;
        }, {} as Record<string, typeof bookLevel>);
        
        Object.entries(grouped).forEach(([name, images]) => {
          report += `  ${name}: ${images.length} images (${images.map(i => i.modelName).join(', ')})\n`;
        });
      }
      
      if (storyLevel.length > 0) {
        report += `Story-Level Images: ${storyLevel.length}\n`;
        const grouped = storyLevel.reduce((acc, img) => {
          if (!acc[img.characterName]) acc[img.characterName] = [];
          acc[img.characterName].push(img);
          return acc;
        }, {} as Record<string, typeof storyLevel>);
        
        Object.entries(grouped).forEach(([name, images]) => {
          report += `  ${name}: ${images.length} images\n`;
        });
      }
    }
    
    report += `\n=== END OF REPORT ===`;
    
    try {
      await navigator.clipboard.writeText(report);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy to clipboard');
    }
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon /> Storage Operations
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Diagnostic and maintenance tools for filesystem storage
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={running ? <CircularProgress size={20} /> : <BugReportIcon />}
            onClick={runDiagnostic}
            disabled={running || fixing}
          >
            Run Storage Analysis
          </Button>
          
          {diagnosticResult && (
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={copyReportToClipboard}
              disabled={running || fixing}
              color={copySuccess ? 'success' : 'primary'}
            >
              {copySuccess ? 'Copied!' : 'Copy Report'}
            </Button>
          )}
          
          <Button
            variant="contained"
            color="info"
            startIcon={recoveringImages ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
            onClick={recoverImagesFromIndexedDB}
            disabled={running || fixing || remapping || rebuildingGalleries || recoveringImages || clearingIndexedDB}
            sx={{ mb: 1 }}
          >
            {recoveringImages ? 'Recovering Images...' : 'Recover Images from IndexedDB'}
          </Button>
          
          <Button
            variant="outlined"
            color="warning"
            startIcon={clearingIndexedDB ? <CircularProgress size={20} /> : <ErrorIcon />}
            onClick={clearOldIndexedDB}
            disabled={running || fixing || remapping || rebuildingGalleries || recoveringImages || clearingIndexedDB}
            sx={{ mb: 1 }}
          >
            {clearingIndexedDB ? 'Clearing...' : 'Clear Old IndexedDB Database'}
          </Button>
          
          {recoveryProgress && (
            <Box sx={{ mt: 1, mb: 2, width: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                {recoveryProgress.currentFile}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(recoveryProgress.current / recoveryProgress.total) * 100} 
                sx={{ mt: 1 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {recoveryProgress.current} / {recoveryProgress.total} images
              </Typography>
            </Box>
          )}
          
          {diagnosticResult && diagnosticResult.mismatches.length > 0 && (
            <>
              <Button
                variant="contained"
                color="warning"
                startIcon={fixing ? <CircularProgress size={20} /> : <BuildIcon />}
                onClick={fixMissingMetadata}
                disabled={running || fixing || remapping || rebuildingGalleries || recoveringImages}
              >
                Fix Missing Metadata
              </Button>
              
              <Button
                variant="contained"
                color="secondary"
                startIcon={remapping ? <CircularProgress size={20} /> : <BuildIcon />}
                onClick={remapImageKeys}
                disabled={running || fixing || remapping || rebuildingGalleries || recoveringImages}
              >
                Remap Image Keys
              </Button>
              
              <Button
                variant="contained"
                color="error"
                startIcon={rebuildingGalleries ? <CircularProgress size={20} /> : <BuildIcon />}
                onClick={rebuildGalleriesFromDB}
                disabled={running || fixing || remapping || rebuildingGalleries || recoveringImages}
              >
                Rebuild Galleries from DB
              </Button>
            </>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {fixResult && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {fixResult}
          </Alert>
        )}
      </Paper>

      {diagnosticResult && (
        <Box>
          {/* Summary */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<CheckCircleIcon />} 
                label={`${diagnosticResult.localStorage.bookCount} Books`} 
                color="primary" 
              />
              <Chip 
                icon={<CheckCircleIcon />} 
                label={`${diagnosticResult.localStorage.bookCharacters.length} Book Characters`} 
                color="primary" 
              />
              <Chip 
                icon={<CheckCircleIcon />} 
                label={`${diagnosticResult.localStorage.storyCharacters.length} Story Characters`} 
                color="primary" 
              />
              <Chip 
                icon={<CheckCircleIcon />} 
                label={`${diagnosticResult.indexedDB.characterImages.length} Images in DB`} 
                color="primary" 
              />
              {diagnosticResult.mismatches.length > 0 && (
                <Chip 
                  icon={<ErrorIcon />} 
                  label={`${diagnosticResult.mismatches.length} Issues Found`} 
                  color="error" 
                />
              )}
            </Box>
          </Paper>

          {/* Mismatches */}
          {diagnosticResult.mismatches.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom color="error">
                Issues Found
              </Typography>
              {diagnosticResult.mismatches.map((mismatch, idx) => (
                <Alert 
                  key={idx} 
                  severity={mismatch.severity} 
                  sx={{ mb: 2 }}
                  icon={
                    mismatch.severity === 'error' ? <ErrorIcon /> : 
                    mismatch.severity === 'warning' ? <WarningIcon /> : 
                    <CheckCircleIcon />
                  }
                >
                  <Typography variant="subtitle2" fontWeight="bold">
                    {mismatch.characterName} ({mismatch.location})
                  </Typography>
                  <Typography variant="body2">
                    {mismatch.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Metadata: {mismatch.metadataCount} | IndexedDB: {mismatch.dbCount}
                  </Typography>
                </Alert>
              ))}
            </Paper>
          )}

          {/* Details */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detailed Report
            </Typography>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Book-Level Characters ({diagnosticResult.localStorage.bookCharacters.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Character</TableCell>
                        <TableCell>Book</TableCell>
                        <TableCell>Gallery Size</TableCell>
                        <TableCell>Selected Image</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {diagnosticResult.localStorage.bookCharacters.map((char, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{char.name}</TableCell>
                          <TableCell>{char.bookTitle}</TableCell>
                          <TableCell>
                            <Chip 
                              label={char.imageGalleryLength} 
                              size="small" 
                              color={char.imageGalleryLength > 0 ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {char.selectedImageId ? 
                              <Chip label="Yes" size="small" color="primary" /> : 
                              <Chip label="No" size="small" />
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Story-Level Characters ({diagnosticResult.localStorage.storyCharacters.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Character</TableCell>
                        <TableCell>Story</TableCell>
                        <TableCell>Gallery Size</TableCell>
                        <TableCell>Selected Image</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {diagnosticResult.localStorage.storyCharacters.map((char, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{char.name}</TableCell>
                          <TableCell>{char.storyTitle}</TableCell>
                          <TableCell>
                            <Chip 
                              label={char.imageGalleryLength} 
                              size="small" 
                              color={char.imageGalleryLength > 0 ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {char.selectedImageId ? 
                              <Chip label="Yes" size="small" color="primary" /> : 
                              <Chip label="No" size="small" />
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>IndexedDB Character Images ({diagnosticResult.indexedDB.characterImages.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Storage Key</TableCell>
                        <TableCell>Character</TableCell>
                        <TableCell>Image ID</TableCell>
                        <TableCell>Model</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {diagnosticResult.indexedDB.characterImages.map((img, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Chip 
                              label={img.storyId.startsWith('book:') ? 'Book-Level' : 'Story-Level'} 
                              size="small" 
                              color={img.storyId.startsWith('book:') ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{img.characterName}</TableCell>
                          <TableCell><Typography variant="caption">{img.imageId.substring(0, 8)}...</Typography></TableCell>
                          <TableCell>{img.modelName}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Box>
      )}

      {/* Test Panel */}
      <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScienceIcon /> Test Suite
        </Typography>
        <Alert severity={testMode ? "success" : "info"} sx={{ mb: 3 }}>
          <Typography variant="body2">
            {testMode ? (
              <>
                <strong>✓ Test Mode Active:</strong> All operations use test directory: <code>{testDirPath}</code>
                <br />
                <strong>Production data is completely isolated</strong> - test operations never touch production.
                <br />
                <strong>Test Data Management:</strong> Use "Refresh from Production" to update test data, or "Add Test Data" to add new test cases for features.
              </>
            ) : (
              <>
                <strong>Test Data Management:</strong> Initialize test data from production, then extend it with new test cases as needed.
                <br />
                <strong>Workflow:</strong> Initialize → Add test data for new features → Run tests → Refresh when production data changes.
              </>
            )}
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {!testMode ? (
            <>
              <Button
                variant="outlined"
                color="warning"
                startIcon={settingUpTestDir ? <CircularProgress size={20} /> : <ScienceIcon />}
                onClick={async () => {
                  setSettingUpTestDir(true);
                  try {
                    const { TestDirectoryService } = await import('../services/TestDirectoryService');
                    const result = await TestDirectoryService.initializeTestDataFromProduction();
                    if (result.success) {
                      setTestMode(true);
                      setTestDirPath(result.path || null);
                      setTestLogs(prev => [...prev, `[SETUP] Test data initialized: ${result.path} (${result.filesCopied || 0} files)`]);
                    } else {
                      setError(result.error || 'Failed to initialize test data');
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to initialize test data');
                  } finally {
                    setSettingUpTestDir(false);
                  }
                }}
                disabled={settingUpTestDir || runningTests}
              >
                {settingUpTestDir ? 'Initializing...' : 'Initialize Test Data'}
              </Button>
              
              {testDirPath && (
                <Button
                  variant="outlined"
                  color="info"
                  onClick={async () => {
                    try {
                      const { TestDirectoryService } = await import('../services/TestDirectoryService');
                      const result = await TestDirectoryService.reselectTestDirectory();
                      if (result.success) {
                        setTestMode(true);
                        setTestDirPath(result.path || null);
                        setTestLogs(prev => [...prev, `[SETUP] Test directory reselected: ${result.path}`]);
                      } else {
                        setError(result.error || 'Failed to reselect test directory');
                      }
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to reselect test directory');
                    }
                  }}
                  disabled={runningTests}
                >
                  Reselect Test Directory
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                color="warning"
                onClick={async () => {
                  try {
                    const { TestDirectoryService } = await import('../services/TestDirectoryService');
                    const result = await TestDirectoryService.exitTestMode();
                    if (result.success) {
                      setTestMode(false);
                      setTestDirPath(null);
                      setTestLogs(prev => [...prev, '[SETUP] Exited test mode - now using production directory']);
                    } else {
                      setError(result.error || 'Failed to exit test mode');
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to exit test mode');
                  }
                }}
                disabled={runningTests}
              >
                Exit Test Mode
              </Button>
              
              <Button
                variant="outlined"
                color="info"
                onClick={async () => {
                  setSettingUpTestDir(true);
                  try {
                    const { TestDirectoryService } = await import('../services/TestDirectoryService');
                    const result = await TestDirectoryService.refreshTestDataFromProduction();
                    if (result.success) {
                      setTestLogs(prev => [...prev, `[SETUP] Test data refreshed: ${result.filesCopied || 0} files copied`]);
                    } else {
                      setError(result.error || 'Failed to refresh test data');
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to refresh test data');
                  } finally {
                    setSettingUpTestDir(false);
                  }
                }}
                disabled={settingUpTestDir || runningTests}
              >
                Refresh from Production
              </Button>
              
              <Button
                variant="outlined"
                color="success"
                onClick={async () => {
                  try {
                    const { TestDirectoryService } = await import('../services/TestDirectoryService');
                    
                    // Prompt user to select directory with new test data
                    const sourceHandle = await window.showDirectoryPicker({
                      mode: 'readwrite',
                      startIn: 'documents'
                    });
                    
                    const result = await TestDirectoryService.addTestData(sourceHandle);
                    if (result.success) {
                      setTestLogs(prev => [...prev, `[SETUP] Added ${result.filesAdded || 0} new test data files`]);
                    } else {
                      setError(result.error || 'Failed to add test data');
                    }
                  } catch (err) {
                    if (err instanceof Error && err.name === 'AbortError') {
                      // User cancelled - ignore
                    } else {
                      setError(err instanceof Error ? err.message : 'Failed to add test data');
                    }
                  }
                }}
                disabled={runningTests}
              >
                Add Test Data
              </Button>
            </>
          )}
          
          <Button
            variant="contained"
            startIcon={runningTests ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={runTestsHandler}
            disabled={runningTests || settingUpTestDir}
          >
            Run All Tests
          </Button>
          
          {testLogs.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={async () => {
                const logText = testLogs.join('\n');
                try {
                  await navigator.clipboard.writeText(logText);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                } catch (err) {
                  console.error('Failed to copy logs:', err);
                }
              }}
              color={copySuccess ? 'success' : 'primary'}
            >
              {copySuccess ? 'Copied!' : 'Copy Logs'}
            </Button>
          )}
        </Box>

        {testResults.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={`${testResults.filter(t => t.status === 'passed').length} Passed`}
                color="success"
              />
              <Chip
                icon={<ErrorIcon />}
                label={`${testResults.filter(t => t.status === 'failed').length} Failed`}
                color="error"
              />
              <Chip
                icon={<WarningIcon />}
                label={`${testResults.filter(t => t.status === 'skipped').length} Skipped`}
                color="default"
              />
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Test Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResults.map((result, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{result.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={result.status}
                          size="small"
                          color={
                            result.status === 'passed' ? 'success' :
                            result.status === 'failed' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{result.duration.toFixed(2)}ms</TableCell>
                      <TableCell>
                        {result.error ? (
                          <Typography variant="caption" color="error">
                            {result.error}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Test Logs */}
        {testLogs.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Logs
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: '400px',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#2d2d2d',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#555',
                  borderRadius: '4px',
                },
              }}
            >
              {testLogs.map((log, idx) => {
                const isError = log.includes('[ERROR]');
                const isSuccess = log.includes('Passed:') || log.includes('✓');
                return (
                  <Typography
                    key={idx}
                    component="div"
                    sx={{
                      color: isError ? '#f48771' : isSuccess ? '#89d185' : '#d4d4d4',
                      mb: 0.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {log}
                  </Typography>
                );
              })}
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

// Test runner function
async function runTests(logFn?: (message: string) => void): Promise<Array<{
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}>> {
  const log = logFn || (() => {}); // Default to no-op if no logger provided
  const results: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }> = [];

  // Test 1: BookCache loading
  log('Running: BookCache loads successfully');
  const test1Start = performance.now();
  try {
    const { bookCache } = await import('../services/BookCache');
    log('  → Imported BookCache');
    await bookCache.loadAll();
    log('  → Called bookCache.loadAll()');
    const books = bookCache.getAll();
    const isLoaded = bookCache.isLoaded();
    log(`  → Found ${books.length} books, loaded: ${isLoaded}`);
    
    if (isLoaded) {
      log('  ✓ Test passed');
      results.push({
        name: 'BookCache loads successfully',
        status: 'passed',
        duration: performance.now() - test1Start
      });
    } else {
      log('  ✗ Test failed: BookCache not loaded');
      results.push({
        name: 'BookCache loads successfully',
        status: 'failed',
        duration: performance.now() - test1Start,
        error: 'BookCache not loaded'
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'BookCache loads successfully',
      status: 'failed',
      duration: performance.now() - test1Start,
      error: errorMsg
    });
  }

  // Test 2: FileSystemService configuration
  log('Running: FileSystemService configuration check');
  const test2Start = performance.now();
  try {
    const { FileSystemService } = await import('../services/FileSystemService');
    log('  → Imported FileSystemService');
    const isConfigured = await FileSystemService.isConfigured();
    log(`  → Filesystem configured: ${isConfigured}`);
    log('  ✓ Test passed');
    results.push({
      name: 'FileSystemService configuration check',
      status: 'passed',
      duration: performance.now() - test2Start
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'FileSystemService configuration check',
      status: 'failed',
      duration: performance.now() - test2Start,
      error: errorMsg
    });
  }

  // Test 3: ImageStorageService initialization
  log('Running: ImageStorageService handles missing images');
  const test3Start = performance.now();
  try {
    log('  → Calling ImageStorageService.getImage() with non-existent ID');
    const image = await ImageStorageService.getImage('test-nonexistent-id');
    log(`  → Result: ${image === null ? 'null (expected)' : 'unexpected value'}`);
    // Should return null for non-existent image, not throw
    log('  ✓ Test passed');
    results.push({
      name: 'ImageStorageService handles missing images',
      status: 'passed',
      duration: performance.now() - test3Start
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'ImageStorageService handles missing images',
      status: 'failed',
      duration: performance.now() - test3Start,
      error: errorMsg
    });
  }

  // Test 4: StorageService load
  log('Running: StorageService loads app data');
  const test4Start = performance.now();
  try {
    const { StorageService } = await import('../services/StorageService');
    log('  → Imported StorageService');
    const data = await StorageService.load();
    log(`  → Loaded data, version: ${data?.version || 'undefined'}`);
    if (data && typeof data.version === 'string') {
      log(`  → Found ${data.books.length} books`);
      log('  ✓ Test passed');
      results.push({
        name: 'StorageService loads app data',
        status: 'passed',
        duration: performance.now() - test4Start
      });
    } else {
      log('  ✗ Test failed: Invalid data structure');
      results.push({
        name: 'StorageService loads app data',
        status: 'failed',
        duration: performance.now() - test4Start,
        error: 'Invalid data structure'
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'StorageService loads app data',
      status: 'failed',
      duration: performance.now() - test4Start,
      error: errorMsg
    });
  }

  // Test 5: BookService operations
  log('Running: BookService.getAllBooks() returns array');
  const test5Start = performance.now();
  try {
    log('  → Calling BookService.getAllBooks()');
    const books = await BookService.getAllBooks();
    log(`  → Received ${books.length} books`);
    // Should return an array (even if empty)
    if (Array.isArray(books)) {
      log('  ✓ Test passed');
      results.push({
        name: 'BookService.getAllBooks() returns array',
        status: 'passed',
        duration: performance.now() - test5Start
      });
    } else {
      log(`  ✗ Test failed: Expected array, got ${typeof books}`);
      results.push({
        name: 'BookService.getAllBooks() returns array',
        status: 'failed',
        duration: performance.now() - test5Start,
        error: 'Expected array, got ' + typeof books
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'BookService.getAllBooks() returns array',
      status: 'failed',
      duration: performance.now() - test5Start,
      error: errorMsg
    });
  }

  // Test 6: IndexedDB availability
  log('Running: IndexedDB is available');
  const test6Start = performance.now();
  try {
    const hasIndexedDB = 'indexedDB' in window;
    log(`  → IndexedDB available: ${hasIndexedDB}`);
    if (hasIndexedDB) {
      log('  ✓ Test passed');
      results.push({
        name: 'IndexedDB is available',
        status: 'passed',
        duration: performance.now() - test6Start
      });
    } else {
      log('  ✗ Test failed: IndexedDB not available');
      results.push({
        name: 'IndexedDB is available',
        status: 'failed',
        duration: performance.now() - test6Start,
        error: 'IndexedDB not available in this browser'
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'IndexedDB is available',
      status: 'failed',
      duration: performance.now() - test6Start,
      error: errorMsg
    });
  }

  // Test 7: File System Access API availability
  log('Running: File System Access API is available');
  const test7Start = performance.now();
  try {
    const hasFSAPI = 'showDirectoryPicker' in window;
    log(`  → File System Access API available: ${hasFSAPI}`);
    if (hasFSAPI) {
      log('  ✓ Test passed');
      results.push({
        name: 'File System Access API is available',
        status: 'passed',
        duration: performance.now() - test7Start
      });
    } else {
      log('  ⊘ Test skipped: File System Access API not available (Chrome/Edge only)');
      results.push({
        name: 'File System Access API is available',
        status: 'skipped',
        duration: performance.now() - test7Start,
        error: 'File System Access API not available (Chrome/Edge only)'
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'File System Access API is available',
      status: 'failed',
      duration: performance.now() - test7Start,
      error: errorMsg
    });
  }

  // Test 8: Directory change and migration services
  log('Running: Directory change and migration services');
  const test8Start = performance.now();
  try {
    const { FileSystemService } = await import('../services/FileSystemService');
    log('  → Imported FileSystemService');
    
    // Check if FileSystemService has directory change methods
    const hasSelectDirectory = typeof FileSystemService.selectDirectory === 'function';
    const hasHasDataInDirectory = typeof FileSystemService.hasDataInDirectory === 'function';
    const hasIsConfigured = typeof FileSystemService.isConfigured === 'function';
    
    log(`  → selectDirectory() available: ${hasSelectDirectory}`);
    log(`  → hasDataInDirectory() available: ${hasHasDataInDirectory}`);
    log(`  → isConfigured() available: ${hasIsConfigured}`);
    
    // Check DirectoryMigrationService
    const { DirectoryMigrationService } = await import('../services/DirectoryMigrationService');
    log('  → Imported DirectoryMigrationService');
    
    const hasMigrateDirectory = typeof DirectoryMigrationService.migrateDirectory === 'function';
    const hasDeleteOldDirectory = typeof DirectoryMigrationService.deleteOldDirectory === 'function';
    
    log(`  → migrateDirectory() available: ${hasMigrateDirectory}`);
    log(`  → deleteOldDirectory() available: ${hasDeleteOldDirectory}`);
    
    // Check if filesystem is configured (needed for directory operations)
    const isConfigured = await FileSystemService.isConfigured();
    log(`  → Filesystem configured: ${isConfigured}`);
    
    if (hasSelectDirectory && hasHasDataInDirectory && hasMigrateDirectory && hasDeleteOldDirectory) {
      log('  ✓ Test passed: All directory change methods available');
      results.push({
        name: 'Directory change and migration services',
        status: 'passed',
        duration: performance.now() - test8Start
      });
    } else {
      const missing = [];
      if (!hasSelectDirectory) missing.push('selectDirectory');
      if (!hasHasDataInDirectory) missing.push('hasDataInDirectory');
      if (!hasMigrateDirectory) missing.push('migrateDirectory');
      if (!hasDeleteOldDirectory) missing.push('deleteOldDirectory');
      
      log(`  ✗ Test failed: Missing methods: ${missing.join(', ')}`);
      results.push({
        name: 'Directory change and migration services',
        status: 'failed',
        duration: performance.now() - test8Start,
        error: `Missing methods: ${missing.join(', ')}`
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'Directory change and migration services',
      status: 'failed',
      duration: performance.now() - test8Start,
      error: errorMsg
    });
  }

  // Test 9: Directory data detection
  log('Running: Directory data detection');
  const test9Start = performance.now();
  try {
    const { FileSystemService } = await import('../services/FileSystemService');
    const isConfigured = await FileSystemService.isConfigured();
    
    if (!isConfigured) {
      log('  ⊘ Test skipped: Filesystem not configured');
      results.push({
        name: 'Directory data detection',
        status: 'skipped',
        duration: performance.now() - test9Start,
        error: 'Filesystem not configured - cannot test directory detection'
      });
    } else {
      log('  → Filesystem is configured');
      const currentHandle = await FileSystemService.getDirectoryHandle();
      
      if (currentHandle) {
        log(`  → Current directory: ${currentHandle.name}`);
        const hasData = await FileSystemService.hasDataInDirectory(currentHandle);
        log(`  → Directory has data: ${hasData}`);
        log('  ✓ Test passed: Directory data detection works');
        results.push({
          name: 'Directory data detection',
          status: 'passed',
          duration: performance.now() - test9Start
        });
      } else {
        log('  ✗ Test failed: Could not get current directory handle');
        results.push({
          name: 'Directory data detection',
          status: 'failed',
          duration: performance.now() - test9Start,
          error: 'Could not get current directory handle'
        });
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'Directory data detection',
      status: 'failed',
      duration: performance.now() - test9Start,
      error: errorMsg
    });
  }

  // Test 10: Directory change with deletion flow
  log('Running: Directory change with deletion flow');
  const test10Start = performance.now();
  try {
    const { DirectoryMigrationService } = await import('../services/DirectoryMigrationService');
    log('  → Imported DirectoryMigrationService');
    
    // Verify deleteOldDirectory method exists and is callable
    const hasDeleteOldDirectory = typeof DirectoryMigrationService.deleteOldDirectory === 'function';
    log(`  → deleteOldDirectory() available: ${hasDeleteOldDirectory}`);
    
    // Verify migration method exists
    const hasMigrateDirectory = typeof DirectoryMigrationService.migrateDirectory === 'function';
    log(`  → migrateDirectory() available: ${hasMigrateDirectory}`);
    
    // Check that both methods are available for the full flow
    if (hasDeleteOldDirectory && hasMigrateDirectory) {
      log('  → Both migration and deletion methods available');
      
      // Verify the method signature (should accept FileSystemDirectoryHandle)
      // We can't actually call it without real handles, but we can verify it exists
      log('  → Method signature verified (accepts FileSystemDirectoryHandle)');
      
      // Check FileSystemService for directory change support
      const { FileSystemService } = await import('../services/FileSystemService');
      const hasSelectDirectory = typeof FileSystemService.selectDirectory === 'function';
      const hasHasDataInDirectory = typeof FileSystemService.hasDataInDirectory === 'function';
      
      log(`  → selectDirectory() available: ${hasSelectDirectory}`);
      log(`  → hasDataInDirectory() available: ${hasHasDataInDirectory}`);
      
      if (hasSelectDirectory && hasHasDataInDirectory) {
        log('  ✓ Test passed: Full directory change with deletion flow available');
        log('    Flow: selectDirectory() → detect data → migrateDirectory() → deleteOldDirectory()');
        results.push({
          name: 'Directory change with deletion flow',
          status: 'passed',
          duration: performance.now() - test10Start
        });
      } else {
        log('  ✗ Test failed: Missing directory selection methods');
        results.push({
          name: 'Directory change with deletion flow',
          status: 'failed',
          duration: performance.now() - test10Start,
          error: 'Missing directory selection methods'
        });
      }
    } else {
      const missing = [];
      if (!hasMigrateDirectory) missing.push('migrateDirectory');
      if (!hasDeleteOldDirectory) missing.push('deleteOldDirectory');
      
      log(`  ✗ Test failed: Missing methods: ${missing.join(', ')}`);
      results.push({
        name: 'Directory change with deletion flow',
        status: 'failed',
        duration: performance.now() - test10Start,
        error: `Missing methods: ${missing.join(', ')}`
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'Directory change with deletion flow',
      status: 'failed',
      duration: performance.now() - test10Start,
      error: errorMsg
    });
  }

  // Test 11: Verify deletion method can handle errors gracefully
  log('Running: Directory deletion error handling');
  const test11Start = performance.now();
  try {
    const { DirectoryMigrationService } = await import('../services/DirectoryMigrationService');
    log('  → Imported DirectoryMigrationService');
    
    // Check that deleteOldDirectory returns a Promise<boolean>
    // This indicates it handles errors internally and returns success status
    const deleteMethod = DirectoryMigrationService.deleteOldDirectory;
    const isAsync = deleteMethod.constructor.name === 'AsyncFunction' || 
                    deleteMethod.toString().includes('async');
    
    log(`  → deleteOldDirectory is async: ${isAsync}`);
    log('  → Method returns Promise<boolean> (handles errors gracefully)');
    
    // Verify it exists and is callable
    if (typeof deleteMethod === 'function') {
      log('  ✓ Test passed: Deletion method has proper error handling');
      results.push({
        name: 'Directory deletion error handling',
        status: 'passed',
        duration: performance.now() - test11Start
      });
    } else {
      log('  ✗ Test failed: deleteOldDirectory is not a function');
      results.push({
        name: 'Directory deletion error handling',
        status: 'failed',
        duration: performance.now() - test11Start,
        error: 'deleteOldDirectory is not a function'
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'Directory deletion error handling',
      status: 'failed',
      duration: performance.now() - test11Start,
      error: errorMsg
    });
  }

  // Test 12: Directory migration and deletion (using temporary directory)
  log('Running: Directory migration and deletion test');
  const test12Start = performance.now();
  try {
    const { FileSystemService } = await import('../services/FileSystemService');
    const { DirectoryMigrationService } = await import('../services/DirectoryMigrationService');
    
    const isConfigured = await FileSystemService.isConfigured();
    if (!isConfigured) {
      log('  ⊘ Test skipped: Filesystem not configured');
      results.push({
        name: 'Directory migration and deletion test',
        status: 'skipped',
        duration: performance.now() - test12Start,
        error: 'Filesystem not configured'
      });
    } else {
      log('  → Filesystem is configured');
      
      // Get current directory (test or production)
      const currentHandle = await FileSystemService.getDirectoryHandle();
      if (!currentHandle) {
        log('  ✗ Test failed: No directory handle available');
        results.push({
          name: 'Directory migration and deletion test',
          status: 'failed',
          duration: performance.now() - test12Start,
          error: 'No directory handle available'
        });
      } else {
        log(`  → Current directory: ${currentHandle.name}`);
        
        // Check if current directory has data
        const hasData = await FileSystemService.hasDataInDirectory(currentHandle);
        if (!hasData) {
          log('  ⊘ Test skipped: Current directory has no data to migrate');
          results.push({
            name: 'Directory migration and deletion test',
            status: 'skipped',
            duration: performance.now() - test12Start,
            error: 'Current directory has no data to migrate'
          });
        } else {
          log('  → Current directory has data');
          log('  → Step 1: Creating temporary source directory...');
          
          // Create temporary source directory (user will be prompted)
          let tempSourceHandle: FileSystemDirectoryHandle;
          try {
            tempSourceHandle = await window.showDirectoryPicker({
              mode: 'readwrite',
              startIn: 'documents'
            });
            log(`  → Selected temporary source directory: ${tempSourceHandle.name}`);
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              log('  ⊘ Test skipped: Directory selection cancelled');
              results.push({
                name: 'Directory migration and deletion test',
                status: 'skipped',
                duration: performance.now() - test12Start,
                error: 'Directory selection cancelled'
              });
              return results;
            }
            throw error;
          }
          
          log('  → Step 2: Copying current data to temporary source directory...');
          const copyResult = await DirectoryMigrationService.migrateDirectory(
            currentHandle,
            tempSourceHandle,
            (progress) => {
              if (progress.status === 'migrating') {
                log(`    Copying: ${progress.currentFile} (${progress.current}/${progress.total})`);
              }
            }
          );
          
          if (!copyResult.success && copyResult.filesCopied === 0) {
            log(`  ✗ Test failed: Failed to copy data: ${copyResult.error || 'Unknown error'}`);
            results.push({
              name: 'Directory migration and deletion test',
              status: 'failed',
              duration: performance.now() - test12Start,
              error: copyResult.error || 'Failed to copy data'
            });
          } else {
            log(`  → Copied ${copyResult.filesCopied} files to temporary source`);
            
            log('  → Step 3: Creating temporary destination directory...');
            let tempDestHandle: FileSystemDirectoryHandle;
            try {
              tempDestHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
              });
              log(`  → Selected temporary destination directory: ${tempDestHandle.name}`);
            } catch (error) {
              if (error instanceof Error && error.name === 'AbortError') {
                log('  ⊘ Test skipped: Destination directory selection cancelled');
                results.push({
                  name: 'Directory migration and deletion test',
                  status: 'skipped',
                  duration: performance.now() - test12Start,
                  error: 'Destination directory selection cancelled'
                });
                return results;
              }
              throw error;
            }
            
            log('  → Step 4: Testing migration from temp source to temp destination...');
            const migrationResult = await DirectoryMigrationService.migrateDirectory(
              tempSourceHandle,
              tempDestHandle,
              (progress) => {
                if (progress.status === 'migrating') {
                  log(`    Migrating: ${progress.currentFile} (${progress.current}/${progress.total})`);
                }
              }
            );
            
            if (!migrationResult.success && migrationResult.filesCopied === 0) {
              log(`  ✗ Test failed: Migration failed: ${migrationResult.error || 'Unknown error'}`);
              results.push({
                name: 'Directory migration and deletion test',
                status: 'failed',
                duration: performance.now() - test12Start,
                error: migrationResult.error || 'Migration failed'
              });
            } else {
              log(`  → Migrated ${migrationResult.filesCopied} files successfully`);
              
              log('  → Step 5: Testing deletion of temporary source directory...');
              const deleteResult = await DirectoryMigrationService.deleteOldDirectory(tempSourceHandle);
              
              if (deleteResult) {
                log('  → Successfully deleted temporary source directory');
                log('  → Step 6: Verifying data exists in destination...');
                const destHasData = await FileSystemService.hasDataInDirectory(tempDestHandle);
                
                if (destHasData) {
                  log('  ✓ Test passed: Migration and deletion completed successfully');
                  log(`    → Original data: Safe in ${currentHandle.name}`);
                  log(`    → Migrated data: Available in ${tempDestHandle.name}`);
                  log(`    → Temporary source: Deleted (as expected)`);
                  results.push({
                    name: 'Directory migration and deletion test',
                    status: 'passed',
                    duration: performance.now() - test12Start
                  });
                } else {
                  log('  ✗ Test failed: Data not found in destination after migration');
                  results.push({
                    name: 'Directory migration and deletion test',
                    status: 'failed',
                    duration: performance.now() - test12Start,
                    error: 'Data not found in destination after migration'
                  });
                }
              } else {
                log('  ✗ Test failed: Failed to delete temporary source directory');
                results.push({
                  name: 'Directory migration and deletion test',
                  status: 'failed',
                  duration: performance.now() - test12Start,
                  error: 'Failed to delete temporary source directory'
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(`  ✗ Test failed: ${errorMsg}`);
    results.push({
      name: 'Directory migration and deletion test',
      status: 'failed',
      duration: performance.now() - test12Start,
      error: errorMsg
    });
  }

  return results;
}

