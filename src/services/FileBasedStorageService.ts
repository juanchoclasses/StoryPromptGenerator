import { Book } from '../models/Book';
import { SlugService } from './SlugService';
import { FileSystemService } from './FileSystemService';
import { ElectronFileSystemService } from './ElectronFileSystemService';

/**
 * FileBasedStorageService - Handle reading/writing books in directory format
 * 
 * Stores each book as a directory with:
 * - book.json (metadata)
 * - stories/ directory with individual story files
 * 
 * Directory structure:
 * prompter-cache/books/{book-slug}/
 *   ├── book.json
 *   └── stories/
 *       ├── {story-slug-1}.json
 *       ├── {story-slug-2}.json
 *       └── ...
 */
export class FileBasedStorageService {
  private static readonly BOOKS_BASE_PATH = 'prompter-cache/books';

  /**
   * Save book to directory structure
   * 
   * @param book - Book to save
   * @returns Success status with optional error message
   */
  static async saveBook(book: Book): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate book slug from title
      const bookSlug = SlugService.generateSlug(book.title, 'book');
      const bookPath = `${this.BOOKS_BASE_PATH}/${bookSlug}`;
      const storiesPath = `${bookPath}/stories`;

      // Create directories
      if (FileSystemService.isElectron()) {
        await ElectronFileSystemService.createDirectory(bookPath);
        await ElectronFileSystemService.createDirectory(storiesPath);
      } else {
        // Browser mode - use File System Access API
        const parentHandle = await FileSystemService.getDirectoryHandle();
        if (!parentHandle || !('getDirectoryHandle' in parentHandle)) {
          return {
            success: false,
            error: 'No directory selected. Please select a save directory in Settings.'
          };
        }

        // Create prompter-cache/books structure
        const cacheHandle = await parentHandle.getDirectoryHandle('prompter-cache', { create: true });
        const booksHandle = await cacheHandle.getDirectoryHandle('books', { create: true });
        const bookHandle = await booksHandle.getDirectoryHandle(bookSlug, { create: true });
        await bookHandle.getDirectoryHandle('stories', { create: true });
      }

      // Clean book-level character data - remove transient url fields from imageGallery
      const cleanedBookCharacters = book.characters.map(char => ({
        ...char,
        imageGallery: char.imageGallery?.map(img => ({
          id: img.id,
          model: img.model,
          prompt: img.prompt,
          timestamp: img.timestamp,
          width: img.width,
          height: img.height
          // Exclude url - it's transient and loaded from filesystem on demand
        }))
      }));

      // Prepare book metadata (exclude stories)
      const bookData = {
        id: book.id,
        title: book.title,
        description: book.description,
        backgroundSetup: book.backgroundSetup,
        aspectRatio: book.aspectRatio,
        style: book.style,
        defaultLayout: book.defaultLayout,
        characters: cleanedBookCharacters,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt
      };

      // Save book.json
      const bookJsonPath = `${bookPath}/book.json`;
      const bookJsonContent = JSON.stringify(bookData, null, 2);
      
      if (FileSystemService.isElectron()) {
        await ElectronFileSystemService.writeFile(bookJsonPath, bookJsonContent);
      } else {
        // Browser mode
        const parentHandle = await FileSystemService.getDirectoryHandle();
        if (!parentHandle || !('getDirectoryHandle' in parentHandle)) {
          return { success: false, error: 'Directory handle lost' };
        }
        
        const cacheHandle = await parentHandle.getDirectoryHandle('prompter-cache', { create: false });
        const booksHandle = await cacheHandle.getDirectoryHandle('books', { create: false });
        const bookHandle = await booksHandle.getDirectoryHandle(bookSlug, { create: false });
        
        const fileHandle = await bookHandle.getFileHandle('book.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(bookJsonContent);
        await writable.close();
      }

      // Save each story with unique slugs
      const existingSlugs = new Set<string>();
      for (const story of book.stories) {
        const baseSlug = SlugService.generateSlug(story.title, 'story');
        const uniqueSlug = SlugService.generateUniqueSlug(baseSlug, existingSlugs);
        existingSlugs.add(uniqueSlug);

        // Clean character data - remove transient url fields from imageGallery
        const cleanedCharacters = story.characters.map(char => ({
          ...char,
          imageGallery: char.imageGallery?.map(img => ({
            id: img.id,
            model: img.model,
            prompt: img.prompt,
            timestamp: img.timestamp,
            width: img.width,
            height: img.height
            // Exclude url - it's transient and loaded from filesystem on demand
          }))
        }));

        const storyData = {
          id: story.id,
          title: story.title,
          description: story.description,
          backgroundSetup: story.backgroundSetup,
          diagramStyle: story.diagramStyle,
          layout: story.layout,
          characters: cleanedCharacters,
          elements: story.elements,
          scenes: story.scenes,
          createdAt: story.createdAt,
          updatedAt: story.updatedAt
        };

        const storyJsonPath = `${storiesPath}/${uniqueSlug}.json`;
        const storyJsonContent = JSON.stringify(storyData, null, 2);

        if (FileSystemService.isElectron()) {
          await ElectronFileSystemService.writeFile(storyJsonPath, storyJsonContent);
        } else {
          // Browser mode
          const parentHandle = await FileSystemService.getDirectoryHandle();
          if (!parentHandle || !('getDirectoryHandle' in parentHandle)) {
            return { success: false, error: 'Directory handle lost' };
          }
          
          const cacheHandle = await parentHandle.getDirectoryHandle('prompter-cache', { create: false });
          const booksHandle = await cacheHandle.getDirectoryHandle('books', { create: false });
          const bookHandle = await booksHandle.getDirectoryHandle(bookSlug, { create: false });
          const storiesHandle = await bookHandle.getDirectoryHandle('stories', { create: false });
          
          const fileHandle = await storiesHandle.getFileHandle(`${uniqueSlug}.json`, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(storyJsonContent);
          await writable.close();
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving book to directory format:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save book'
      };
    }
  }

  /**
   * Load book from directory structure
   * 
   * @param bookSlugOrId - Book slug or ID to load
   * @returns Book instance or null if not found
   */
  static async loadBook(bookSlugOrId: string): Promise<Book | null> {
    try {
      // Try loading by slug first
      let bookJsonPath = `${this.BOOKS_BASE_PATH}/${bookSlugOrId}/book.json`;
      let bookJsonContent: string | null = null;
      let bookSlug = bookSlugOrId;

      if (FileSystemService.isElectron()) {
        // Try by slug
        const exists = await ElectronFileSystemService.fileExists(bookJsonPath);
        if (exists) {
          bookJsonContent = await ElectronFileSystemService.readFile(bookJsonPath);
        }

        // If not found, search all directories for matching book ID
        if (!bookJsonContent) {
          const { directories } = await ElectronFileSystemService.listDirectory(this.BOOKS_BASE_PATH);
          
          for (const dir of directories) {
            const testPath = `${this.BOOKS_BASE_PATH}/${dir}/book.json`;
            const testExists = await ElectronFileSystemService.fileExists(testPath);
            
            if (testExists) {
              const testContent = await ElectronFileSystemService.readFile(testPath);
              if (testContent) {
                const testData = JSON.parse(testContent);
                if (testData.id === bookSlugOrId) {
                  bookJsonContent = testContent;
                  bookSlug = dir;
                  bookJsonPath = testPath;
                  break;
                }
              }
            }
          }
        }
      } else {
        // Browser mode
        const parentHandle = await FileSystemService.getDirectoryHandle();
        if (!parentHandle || !('getDirectoryHandle' in parentHandle)) {
          return null;
        }

        try {
          const cacheHandle = await parentHandle.getDirectoryHandle('prompter-cache', { create: false });
          const booksHandle = await cacheHandle.getDirectoryHandle('books', { create: false });
          
          // Try by slug
          try {
            const bookHandle = await booksHandle.getDirectoryHandle(bookSlugOrId, { create: false });
            const fileHandle = await bookHandle.getFileHandle('book.json', { create: false });
            const file = await fileHandle.getFile();
            bookJsonContent = await file.text();
            bookSlug = bookSlugOrId;
          } catch {
            // Not found by slug, search by ID
            // @ts-ignore - values() is an async iterator but TypeScript doesn't recognize it
            for await (const entry of booksHandle.values()) {
              if (entry.kind === 'directory') {
                try {
                  const dirHandle = await booksHandle.getDirectoryHandle(entry.name, { create: false });
                  const fileHandle = await dirHandle.getFileHandle('book.json', { create: false });
                  const file = await fileHandle.getFile();
                  const content = await file.text();
                  const data = JSON.parse(content);
                  
                  if (data.id === bookSlugOrId) {
                    bookJsonContent = content;
                    bookSlug = entry.name;
                    break;
                  }
                } catch {
                  // Skip this directory
                  continue;
                }
              }
            }
          }
        } catch {
          return null;
        }
      }

      if (!bookJsonContent) {
        return null;
      }

      const bookData = JSON.parse(bookJsonContent);

      // Load all story files
      const stories = [];
      const storiesPath = `${this.BOOKS_BASE_PATH}/${bookSlug}/stories`;

      if (FileSystemService.isElectron()) {
        const { files } = await ElectronFileSystemService.listDirectory(storiesPath);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const storyPath = `${storiesPath}/${file}`;
            const storyContent = await ElectronFileSystemService.readFile(storyPath);
            
            if (storyContent) {
              stories.push(JSON.parse(storyContent));
            }
          }
        }
      } else {
        // Browser mode
        const parentHandle = await FileSystemService.getDirectoryHandle();
        if (parentHandle && 'getDirectoryHandle' in parentHandle) {
          try {
            const cacheHandle = await parentHandle.getDirectoryHandle('prompter-cache', { create: false });
            const booksHandle = await cacheHandle.getDirectoryHandle('books', { create: false });
            const bookHandle = await booksHandle.getDirectoryHandle(bookSlug, { create: false });
            const storiesHandle = await bookHandle.getDirectoryHandle('stories', { create: false });
            
            // @ts-ignore - values() is an async iterator but TypeScript doesn't recognize it
            for await (const entry of storiesHandle.values()) {
              if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                const fileHandle = await storiesHandle.getFileHandle(entry.name, { create: false });
                const file = await fileHandle.getFile();
                const content = await file.text();
                stories.push(JSON.parse(content));
              }
            }
          } catch {
            // Stories directory doesn't exist or error reading
          }
        }
      }

      // Reconstruct Book object
      return new Book({
        ...bookData,
        stories
      });
    } catch (error) {
      console.error('Error loading book from directory format:', error);
      return null;
    }
  }

  /**
   * Check if a book exists in directory format
   * 
   * @param bookSlugOrId - Book slug or ID to check
   * @returns true if book.json exists in directory format
   */
  static async isDirectoryFormat(bookSlugOrId: string): Promise<boolean> {
    try {
      const bookJsonPath = `${this.BOOKS_BASE_PATH}/${bookSlugOrId}/book.json`;
      
      if (FileSystemService.isElectron()) {
        return await ElectronFileSystemService.fileExists(bookJsonPath);
      } else {
        // Browser mode
        const parentHandle = await FileSystemService.getDirectoryHandle();
        if (!parentHandle || !('getDirectoryHandle' in parentHandle)) {
          return false;
        }

        try {
          const cacheHandle = await parentHandle.getDirectoryHandle('prompter-cache', { create: false });
          const booksHandle = await cacheHandle.getDirectoryHandle('books', { create: false });
          const bookHandle = await booksHandle.getDirectoryHandle(bookSlugOrId, { create: false });
          await bookHandle.getFileHandle('book.json', { create: false });
          return true;
        } catch {
          return false;
        }
      }
    } catch {
      return false;
    }
  }
}
