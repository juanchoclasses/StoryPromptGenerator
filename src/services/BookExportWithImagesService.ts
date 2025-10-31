/**
 * BookExportWithImagesService - Export and import books with all associated images
 * 
 * This service bundles a book's JSON data along with all its images (scene images
 * and character audition images) into a ZIP file for portability across computers.
 */

import JSZip from 'jszip';
import { BookService } from './BookService';
import { ImageStorageService } from './ImageStorageService';
import { Book } from '../models/Book';

/**
 * Manifest file to track what's included in the export
 */
interface ExportManifest {
  version: string;
  exportDate: string;
  bookId: string;
  bookTitle: string;
  sceneImageCount: number;
  characterImageCount: number;
  stories: {
    storyId: string;
    title: string;
    characters: string[];
  }[];
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  success: boolean;
  blob?: Blob;
  error?: string;
  stats?: {
    sceneImages: number;
    characterImages: number;
    totalSize: number;
  };
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean;
  bookId?: string;
  error?: string;
  warnings?: string[];
  stats?: {
    sceneImages: number;
    characterImages: number;
  };
}

export class BookExportWithImagesService {
  private static readonly MANIFEST_FILE = 'manifest.json';
  private static readonly BOOK_DATA_FILE = 'book-data.json';
  private static readonly SCENE_IMAGES_DIR = 'scene-images/';
  private static readonly CHARACTER_IMAGES_DIR = 'character-images/';
  private static readonly VERSION = '1.0.0';

  /**
   * Export a book with all its images to a ZIP file
   */
  static async exportBookWithImages(bookId: string): Promise<ExportResult> {
    try {
      console.log('Starting export for book:', bookId);
      
      // Get the book data
      const book = await BookService.getBook(bookId);
      if (!book) {
        return {
          success: false,
          error: 'Book not found'
        };
      }

      // Create a new ZIP file
      const zip = new JSZip();
      
      // Track statistics
      let sceneImageCount = 0;
      let characterImageCount = 0;
      const imageIdToFilename = new Map<string, string>();
      
      // Collect all scene images
      console.log('Collecting scene images...');
      for (const story of book.stories) {
        for (const scene of story.scenes) {
          if (scene.imageHistory && scene.imageHistory.length > 0) {
            for (const img of scene.imageHistory) {
              try {
                // Get image from IndexedDB
                const blobUrl = await ImageStorageService.getImage(img.id);
                if (blobUrl) {
                  // Fetch the blob from the blob URL
                  const response = await fetch(blobUrl);
                  const blob = await response.blob();
                  
                  // Add to ZIP with organized path
                  const filename = `${this.SCENE_IMAGES_DIR}${img.id}.png`;
                  zip.file(filename, blob);
                  imageIdToFilename.set(img.id, filename);
                  sceneImageCount++;
                  
                  console.log(`Added scene image: ${img.id}`);
                } else {
                  console.warn(`Scene image not found in storage: ${img.id}`);
                }
              } catch (error) {
                console.error(`Error processing scene image ${img.id}:`, error);
              }
            }
          }
        }
      }

      // Collect all character audition images (story-level)
      console.log('Collecting story-level character images...');
      for (const story of book.stories) {
        for (const character of story.characters) {
          if (character.imageGallery && character.imageGallery.length > 0) {
            for (const img of character.imageGallery) {
              try {
                // Get image from IndexedDB
                const blobUrl = await ImageStorageService.getCharacterImage(
                  story.id,
                  character.name,
                  img.id
                );
                if (blobUrl) {
                  // Fetch the blob from the blob URL
                  const response = await fetch(blobUrl);
                  const blob = await response.blob();
                  
                  // Add to ZIP with organized path
                  // Include story ID and character name in path for organization
                  const filename = `${this.CHARACTER_IMAGES_DIR}${story.id}/${character.name}/${img.id}.png`;
                  zip.file(filename, blob);
                  imageIdToFilename.set(`${story.id}:${character.name}:${img.id}`, filename);
                  characterImageCount++;
                  
                  console.log(`Added story character image: ${character.name}/${img.id}`);
                } else {
                  console.warn(`Character image not found in storage: ${character.name}/${img.id}`);
                }
              } catch (error) {
                console.error(`Error processing character image ${character.name}/${img.id}:`, error);
              }
            }
          }
        }
      }

      // Collect book-level character images
      console.log('Collecting book-level character images...');
      if (book.characters && book.characters.length > 0) {
        for (const character of book.characters) {
          if (character.imageGallery && character.imageGallery.length > 0) {
            for (const img of character.imageGallery) {
              try {
                // Get image from IndexedDB (book-level uses 'book:' prefix)
                const blobUrl = await ImageStorageService.getBookCharacterImage(
                  book.id,
                  character.name,
                  img.id
                );
                if (blobUrl) {
                  // Fetch the blob from the blob URL
                  const response = await fetch(blobUrl);
                  const blob = await response.blob();
                  
                  // Add to ZIP with organized path (use 'book' as the directory name)
                  const filename = `${this.CHARACTER_IMAGES_DIR}book/${character.name}/${img.id}.png`;
                  zip.file(filename, blob);
                  imageIdToFilename.set(`book:${book.id}:${character.name}:${img.id}`, filename);
                  characterImageCount++;
                  
                  console.log(`Added book character image: ${character.name}/${img.id}`);
                } else {
                  console.warn(`Book character image not found in storage: ${character.name}/${img.id}`);
                }
              } catch (error) {
                console.error(`Error processing book character image ${character.name}/${img.id}:`, error);
              }
            }
          }
        }
      }

      // Create manifest
      const manifest: ExportManifest = {
        version: this.VERSION,
        exportDate: new Date().toISOString(),
        bookId: book.id,
        bookTitle: book.title,
        sceneImageCount,
        characterImageCount,
        stories: book.stories.map(story => ({
          storyId: story.id,
          title: story.title,
          characters: story.characters.map(c => c.name)
        }))
      };

      // Add manifest to ZIP
      zip.file(this.MANIFEST_FILE, JSON.stringify(manifest, null, 2));

      // Add book data to ZIP
      const bookJson = book.toExportJSON();
      zip.file(this.BOOK_DATA_FILE, JSON.stringify(bookJson, null, 2));

      console.log('Generating ZIP file...');
      // Generate the ZIP blob
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      console.log('Export complete:', {
        sceneImages: sceneImageCount,
        characterImages: characterImageCount,
        totalSize: zipBlob.size
      });

      return {
        success: true,
        blob: zipBlob,
        stats: {
          sceneImages: sceneImageCount,
          characterImages: characterImageCount,
          totalSize: zipBlob.size
        }
      };
    } catch (error) {
      console.error('Error exporting book with images:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during export'
      };
    }
  }

  /**
   * Import a book with all its images from a ZIP file
   */
  static async importBookWithImages(zipBlob: Blob): Promise<ImportResult> {
    try {
      console.log('Starting import from ZIP file...');
      
      // Load the ZIP file
      const zip = await JSZip.loadAsync(zipBlob);
      
      // Verify manifest exists
      const manifestFile = zip.file(this.MANIFEST_FILE);
      if (!manifestFile) {
        return {
          success: false,
          error: 'Invalid export file: manifest.json not found'
        };
      }

      // Read manifest
      const manifestContent = await manifestFile.async('string');
      const manifest: ExportManifest = JSON.parse(manifestContent);
      console.log('Manifest loaded:', manifest);

      // Verify book data exists
      const bookDataFile = zip.file(this.BOOK_DATA_FILE);
      if (!bookDataFile) {
        return {
          success: false,
          error: 'Invalid export file: book-data.json not found'
        };
      }

      // Read book data
      const bookDataContent = await bookDataFile.async('string');
      const bookData = JSON.parse(bookDataContent);
      console.log('Original stories from export:', bookData.stories.map((s: any) => ({ 
        title: s.story.title,
        id: s.story.id || 'no-id-in-export' 
      })));
      
      // Import the book (this creates a new book with a new ID)
      const newBook = await Book.fromJSON(bookData);
      
      // AUTO-MIGRATION: Promote characters that are used across multiple stories to book level
      console.log('\n=== Auto-migration: Analyzing character usage ===');
      const characterUsage = new Map<string, Set<string>>(); // character name -> set of story titles
      
      // Analyze which characters appear in which stories
      for (const story of newBook.stories) {
        for (const scene of story.scenes) {
          for (const charName of scene.characters || []) {
            if (!characterUsage.has(charName)) {
              characterUsage.set(charName, new Set());
            }
            characterUsage.get(charName)!.add(story.title);
          }
        }
      }
      
      // Find characters used across multiple stories
      const charactersToPromote: string[] = [];
      for (const [charName, storyTitles] of characterUsage.entries()) {
        if (storyTitles.size > 1) {
          charactersToPromote.push(charName);
          console.log(`  Character "${charName}" used in ${storyTitles.size} stories:`, Array.from(storyTitles));
        }
      }
      
      // Promote these characters to book level
      if (charactersToPromote.length > 0) {
        console.log(`\nPromoting ${charactersToPromote.length} characters to book level...`);
        
        for (const charName of charactersToPromote) {
          // Find the character in any story (prefer first story)
          let foundCharacter = null;
          let sourceStory = null;
          
          for (const story of newBook.stories) {
            const char = story.characters.find(c => c.name.toLowerCase() === charName.toLowerCase());
            if (char) {
              foundCharacter = char;
              sourceStory = story;
              break;
            }
          }
          
          if (foundCharacter && sourceStory) {
            console.log(`  Promoting "${foundCharacter.name}" from story "${sourceStory.title}"...`);
            
            // Add to book level (if not already there)
            if (!newBook.characters.find(c => c.name.toLowerCase() === foundCharacter.name.toLowerCase())) {
              newBook.characters.push(foundCharacter);
              console.log(`    ✓ Added to book.characters`);
            } else {
              console.log(`    ℹ Already exists at book level`);
            }
            
            // Remove from all stories
            for (const story of newBook.stories) {
              const index = story.characters.findIndex(c => c.name.toLowerCase() === foundCharacter.name.toLowerCase());
              if (index >= 0) {
                story.characters.splice(index, 1);
                console.log(`    ✓ Removed from story "${story.title}"`);
              }
            }
          } else {
            console.warn(`  ✗ Character "${charName}" referenced in scenes but not found in any story characters`);
          }
        }
      } else {
        console.log('  No characters need promotion (none used across multiple stories)');
      }
      console.log('=== Auto-migration complete ===\n');
      
      // Create mapping from old story IDs to new story IDs
      // We'll match by title since IDs change on import
      const storyIdMapping = new Map<string, string>();
      
      // Extract old IDs from ZIP manifest or character image paths
      const allCharacterImageFiles = Object.keys(zip.files).filter(
        filename => filename.startsWith(this.CHARACTER_IMAGES_DIR) && filename.endsWith('.png')
      );
      
      // Build set of old story IDs from the ZIP structure
      const oldStoryIds = new Set<string>();
      for (const filename of allCharacterImageFiles) {
        const pathParts = filename.replace(this.CHARACTER_IMAGES_DIR, '').split('/');
        if (pathParts.length === 3) {
          const [oldStoryId] = pathParts;
          oldStoryIds.add(oldStoryId);
        }
      }
      
      console.log('Old story IDs found in ZIP:', Array.from(oldStoryIds));
      console.log('New story IDs in imported book:', newBook.stories.map(s => ({ title: s.title, id: s.id })));
      
      // For each old story ID, find matching story in manifest and map to new ID
      for (const oldStoryId of oldStoryIds) {
        // Find story in manifest with this ID
        const manifestStory = manifest.stories.find(s => s.storyId === oldStoryId);
        if (manifestStory) {
          // Find corresponding story in new book by title
          const newStory = newBook.stories.find(s => s.title === manifestStory.title);
          if (newStory) {
            storyIdMapping.set(oldStoryId, newStory.id);
            console.log(`Mapped old story ID ${oldStoryId} (${manifestStory.title}) -> new ID ${newStory.id}`);
          } else {
            console.warn(`Could not find story with title "${manifestStory.title}" in imported book`);
          }
        }
      }
      
      // Clear all stale blob URLs from the imported data
      // These URLs from the export won't work in the new browser profile
      console.log('Clearing stale image URLs...');
      for (const story of newBook.stories) {
        // Clear scene image URLs
        for (const scene of story.scenes) {
          if (scene.imageHistory) {
            for (const img of scene.imageHistory) {
              delete (img as any).url; // Remove stale blob URL if present
            }
          }
        }
        
        // Clear character image URLs
        for (const character of story.characters) {
          if (character.imageGallery) {
            for (const img of character.imageGallery) {
              delete img.url; // Remove stale blob URL
            }
          }
        }
      }
      console.log('✓ Stale URLs cleared');
      
      // Track statistics and warnings
      let sceneImageCount = 0;
      let characterImageCount = 0;
      const warnings: string[] = [];

      // Import scene images
      console.log('Importing scene images...');
      const sceneImagesFolder = zip.folder(this.SCENE_IMAGES_DIR.replace(/\/$/, ''));
      if (sceneImagesFolder) {
        const sceneImageFiles = Object.keys(zip.files).filter(
          filename => filename.startsWith(this.SCENE_IMAGES_DIR) && filename.endsWith('.png')
        );
        
        for (const filename of sceneImageFiles) {
          try {
            const file = zip.file(filename);
            if (file) {
              const blob = await file.async('blob');
              
              // Extract image ID from filename
              const imageId = filename.replace(this.SCENE_IMAGES_DIR, '').replace('.png', '');
              
              // Find which scene this image belongs to
              let foundScene = false;
              for (const story of newBook.stories) {
                for (const scene of story.scenes) {
                  if (scene.imageHistory?.some(img => img.id === imageId)) {
                    // Store image in IndexedDB
                    const blobUrl = URL.createObjectURL(blob);
                    await ImageStorageService.storeImage(
                      imageId,
                      scene.id,
                      blobUrl,
                      scene.imageHistory.find(img => img.id === imageId)?.modelName || 'unknown'
                    );
                    URL.revokeObjectURL(blobUrl);
                    sceneImageCount++;
                    foundScene = true;
                    console.log(`Imported scene image: ${imageId}`);
                    break;
                  }
                }
                if (foundScene) break;
              }
              
              if (!foundScene) {
                warnings.push(`Scene image ${imageId} found in ZIP but not referenced in book data`);
              }
            }
          } catch (error) {
            console.error(`Error importing scene image from ${filename}:`, error);
            warnings.push(`Failed to import scene image from ${filename}`);
          }
        }
      }

      // Import character images
      console.log('Importing character images...');
      const characterImageFiles = Object.keys(zip.files).filter(
        filename => filename.startsWith(this.CHARACTER_IMAGES_DIR) && filename.endsWith('.png')
      );
      console.log(`Found ${characterImageFiles.length} character image files in ZIP`);
      
      for (const filename of characterImageFiles) {
        try {
          const file = zip.file(filename);
          if (file) {
            const blob = await file.async('blob');
            console.log(`Processing ${filename} (${blob.size} bytes)`);
            
            // Parse filename: character-images/OLD_STORY_ID/characterName/imageId.png
            const pathParts = filename.replace(this.CHARACTER_IMAGES_DIR, '').split('/');
            if (pathParts.length === 3) {
              const [oldStoryId, characterName, imageFile] = pathParts;
              const imageId = imageFile.replace('.png', '');
              console.log(`  Looking for OLD story ID ${oldStoryId}, character ${characterName}, image ${imageId}`);
              
              // Map old story ID to new story ID
              const newStoryId = storyIdMapping.get(oldStoryId);
              if (!newStoryId) {
                console.warn(`  ✗ No mapping found for old story ID ${oldStoryId}`);
                warnings.push(`Story ${oldStoryId} not found for character image ${characterName}/${imageId}`);
                continue;
              }
              
              console.log(`  Mapped to NEW story ID: ${newStoryId}`);
              
              // Check if character was promoted to book level during auto-migration
              const bookLevelCharacter = newBook.characters?.find(c => c.name.toLowerCase() === characterName.toLowerCase());
              
              if (bookLevelCharacter) {
                // Character is at book level now - store image there
                console.log(`  ✓ Found character at BOOK level: ${bookLevelCharacter.name}`);
                console.log(`    Character has ${bookLevelCharacter.imageGallery?.length || 0} images in gallery`);
                if (bookLevelCharacter.imageGallery?.some(img => img.id === imageId)) {
                  console.log(`  ✓ Image ${imageId} found in character gallery`);
                  const blobUrl = URL.createObjectURL(blob);
                  console.log(`  Storing in IndexedDB with BOOK key: book:${newBook.id}:${bookLevelCharacter.name}:${imageId}`);
                  await ImageStorageService.storeBookCharacterImage(
                    newBook.id,
                    bookLevelCharacter.name,
                    imageId,
                    blobUrl,
                    bookLevelCharacter.imageGallery.find(img => img.id === imageId)?.model || 'unknown'
                  );
                  URL.revokeObjectURL(blobUrl);
                  characterImageCount++;
                  console.log(`  ✓ Imported character image at book level: ${characterName}/${imageId}`);
                } else {
                  const galleryIds = bookLevelCharacter.imageGallery?.map(img => img.id).join(', ') || 'none';
                  console.warn(`  ✗ Image ${imageId} not found in gallery. Gallery IDs: ${galleryIds}`);
                  warnings.push(`Character image ${characterName}/${imageId} found in ZIP but not referenced in book data`);
                }
              } else {
                // Character is still at story level
                const story = newBook.stories.find(s => s.id === newStoryId);
                if (story) {
                  console.log(`  ✓ Found story: ${story.title}`);
                  const character = story.characters.find(c => c.name === characterName);
                  if (character) {
                    console.log(`  ✓ Found character at story level: ${character.name}`);
                    console.log(`    Character has ${character.imageGallery?.length || 0} images in gallery`);
                    if (character.imageGallery?.some(img => img.id === imageId)) {
                      console.log(`  ✓ Image ${imageId} found in character gallery`);
                      // Store image in IndexedDB with the NEW story ID
                      const blobUrl = URL.createObjectURL(blob);
                      console.log(`  Storing in IndexedDB with key: ${story.id}:${character.name}:${imageId}`);
                      await ImageStorageService.storeCharacterImage(
                        story.id, // Use new story ID
                        character.name,
                        imageId,
                        blobUrl,
                        character.imageGallery.find(img => img.id === imageId)?.model || 'unknown'
                      );
                      URL.revokeObjectURL(blobUrl);
                      characterImageCount++;
                      console.log(`  ✓ Imported character image: ${characterName}/${imageId}`);
                    } else {
                      const galleryIds = character.imageGallery?.map(img => img.id).join(', ') || 'none';
                      console.warn(`  ✗ Image ${imageId} not found in gallery. Gallery IDs: ${galleryIds}`);
                      warnings.push(`Character image ${characterName}/${imageId} found in ZIP but not referenced in book data`);
                    }
                  } else {
                    console.warn(`  ✗ Character ${characterName} not found in story. Available: ${story.characters.map(c => c.name).join(', ')}`);
                    warnings.push(`Character ${characterName} not found in story ${story.title}`);
                  }
                } else {
                  console.warn(`  ✗ Story with NEW ID ${newStoryId} not found. This should not happen!`);
                  warnings.push(`Story ${newStoryId} not found for character image ${characterName}/${imageId}`);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error importing character image from ${filename}:`, error);
          warnings.push(`Failed to import character image from ${filename}`);
        }
      }

      // Import book-level character images
      console.log('\nImporting book-level character images...');
      const bookCharacterImageFiles = characterImageFiles.filter(f => f.includes('/book/'));
      console.log(`Found ${bookCharacterImageFiles.length} book-level character images`);
      
      for (const filename of bookCharacterImageFiles) {
        try {
          const file = zip.file(filename);
          if (file) {
            const blob = await file.async('blob');
            console.log(`Processing ${filename} (${blob.size} bytes)`);
            
            // Parse filename: character-images/book/characterName/imageId.png
            const pathParts = filename.replace(this.CHARACTER_IMAGES_DIR, '').split('/');
            if (pathParts.length === 3 && pathParts[0] === 'book') {
              const [_, characterName, imageFile] = pathParts;
              const imageId = imageFile.replace('.png', '');
              console.log(`  Looking for book character ${characterName}, image ${imageId}`);
              
              // Find the character at book level
              const character = newBook.characters?.find(c => c.name === characterName);
              if (character) {
                console.log(`  ✓ Found book character: ${character.name}`);
                console.log(`    Character has ${character.imageGallery?.length || 0} images in gallery`);
                if (character.imageGallery?.some(img => img.id === imageId)) {
                  console.log(`  ✓ Image ${imageId} found in character gallery`);
                  // Store image in IndexedDB with book-level key
                  const blobUrl = URL.createObjectURL(blob);
                  console.log(`  Storing in IndexedDB with key: book:${newBook.id}:${character.name}:${imageId}`);
                  await ImageStorageService.storeBookCharacterImage(
                    newBook.id,
                    character.name,
                    imageId,
                    blobUrl,
                    character.imageGallery.find(img => img.id === imageId)?.model || 'unknown'
                  );
                  URL.revokeObjectURL(blobUrl);
                  characterImageCount++;
                  console.log(`  ✓ Imported book character image: ${characterName}/${imageId}`);
                } else {
                  const galleryIds = character.imageGallery?.map(img => img.id).join(', ') || 'none';
                  console.warn(`  ✗ Image ${imageId} not found in gallery. Gallery IDs: ${galleryIds}`);
                  warnings.push(`Book character image ${characterName}/${imageId} found in ZIP but not referenced in book data`);
                }
              } else {
                console.warn(`  ✗ Book character ${characterName} not found. Available: ${newBook.characters?.map(c => c.name).join(', ') || 'none'}`);
                warnings.push(`Book character ${characterName} not found`);
              }
            }
          }
        } catch (error) {
          console.error(`Error importing book character image from ${filename}:`, error);
          warnings.push(`Failed to import book character image from ${filename}`);
        }
      }

      // Save the book to storage
      await BookService.importBookInstance(newBook);

      console.log('Import complete:', {
        sceneImages: sceneImageCount,
        characterImages: characterImageCount,
        warnings: warnings.length
      });

      return {
        success: true,
        bookId: newBook.id,
        stats: {
          sceneImages: sceneImageCount,
          characterImages: characterImageCount
        },
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      console.error('Error importing book with images:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during import'
      };
    }
  }

  /**
   * Download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate a safe filename for a book export
   */
  static generateExportFilename(bookTitle: string): string {
    const sanitized = bookTitle
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${sanitized}_${timestamp}.zip`;
  }
}

