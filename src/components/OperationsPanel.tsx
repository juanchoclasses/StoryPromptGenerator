/**
 * OperationsPanel - Storage diagnostics and maintenance operations
 */

import React, { useState } from 'react';
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
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { BookService } from '../services/BookService';
import { ImageStorageService } from '../services/ImageStorageService';
import type { Character } from '../models/Story';

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
      
      // 2. Check IndexedDB
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
            message: `Character has ${imagesInDB.length} images in IndexedDB but 0 in metadata`,
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
            message: `Character has ${char.imageGalleryLength} images in metadata but 0 in IndexedDB`,
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
            message: `Count mismatch: ${char.imageGalleryLength} in metadata, ${imagesInDB.length} in IndexedDB`,
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
            message: `Character has ${imagesInDB.length} images in IndexedDB but 0 in metadata`,
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
          
          // Get all images from IndexedDB
          const imageMap = await ImageStorageService.getAllBookCharacterImages(
            details.bookId,
            characterName
          );
          
          // Rebuild imageGallery from IndexedDB
          character.imageGallery = details.imageIds.map(imageId => ({
            id: imageId,
            url: '', // Will be loaded from IndexedDB on demand
            model: 'unknown',
            prompt: '',
            timestamp: new Date()
          }));
          
          console.log(`  Rebuilt gallery with ${character.imageGallery.length} images`);
          
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
                character.imageGallery = details.imageIds.map(imageId => ({
                  id: imageId,
                  url: '',
                  model: 'unknown',
                  prompt: '',
                  timestamp: new Date()
                }));
                
                console.log(`  Rebuilt gallery with ${character.imageGallery.length} images`);
                
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
      console.log('=== Rebuilding Galleries from IndexedDB ===');
      
      const books = await BookService.getAllBooks();
      let fixedCount = 0;
      
      for (const book of books) {
        console.log(`Processing book: ${book.title}`);
        
        for (const character of book.characters) {
          console.log(`  Checking ${character.name}...`);
          
          // Get actual images from IndexedDB for this character
          const imageMap = await ImageStorageService.getAllBookCharacterImages(
            book.id,
            character.name
          );
          
          if (imageMap.size === 0) {
            console.log(`    No images in IndexedDB`);
            continue;
          }
          
          console.log(`    Found ${imageMap.size} images in IndexedDB`);
          
          // Rebuild imageGallery with actual IDs from IndexedDB
          const actualImageIds = Array.from(imageMap.keys());
          character.imageGallery = actualImageIds.map(imageId => ({
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
          
          console.log(`    Rebuilt gallery with ${character.imageGallery.length} actual images`);
          fixedCount++;
        }
        
        // Save book
        await BookService.saveBook(book);
      }
      
      setFixResult(`✅ Rebuilt ${fixedCount} character galleries with actual image IDs from IndexedDB`);
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
          Diagnostic and maintenance tools for storage systems (localStorage and IndexedDB)
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
          
          {diagnosticResult && diagnosticResult.mismatches.length > 0 && (
            <>
              <Button
                variant="contained"
                color="warning"
                startIcon={fixing ? <CircularProgress size={20} /> : <BuildIcon />}
                onClick={fixMissingMetadata}
                disabled={running || fixing || remapping || rebuildingGalleries}
              >
                Fix Missing Metadata
              </Button>
              
              <Button
                variant="contained"
                color="secondary"
                startIcon={remapping ? <CircularProgress size={20} /> : <BuildIcon />}
                onClick={remapImageKeys}
                disabled={running || fixing || remapping || rebuildingGalleries}
              >
                Remap Image Keys
              </Button>
              
              <Button
                variant="contained"
                color="error"
                startIcon={rebuildingGalleries ? <CircularProgress size={20} /> : <BuildIcon />}
                onClick={rebuildGalleriesFromDB}
                disabled={running || fixing || remapping || rebuildingGalleries}
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
    </Box>
  );
};

