import { Book } from '../models/Book';
import { FileSystemService } from './FileSystemService';

/**
 * Version 4.0 storage format
 */
export interface AppData {
  version: string;
  books: Book[];
  activeBookId: string | null;
  lastUpdated: Date;
}

/**
 * Storage key for localStorage
 */
const STORAGE_KEY = 'prompter-app-data-v4';
const VERSION = '4.0.0';

/**
 * StorageService - Handles all localStorage operations for Version 4.0
 * Provides a clean abstraction over localStorage with proper error handling
 */
export class StorageService {
  /**
   * Load app data (filesystem first, then localStorage)
   */
  static async load(): Promise<AppData> {
    try {
      // Try filesystem first (backup/restore scenario)
      const fsConfigured = await FileSystemService.isConfigured();
      if (fsConfigured) {
        const fsBooks = await FileSystemService.loadAllBooksMetadata();
        if (fsBooks.size > 0) {
          // Check if localStorage has data
          const stored = localStorage.getItem(STORAGE_KEY);
          
          if (!stored) {
            // localStorage empty but filesystem has books - restore from filesystem
            console.log('Restoring books from filesystem backup...');
            return await this.loadFromFilesystem(fsBooks);
          }
          
          // Both exist - use localStorage (more recent), but verify filesystem has all books
          const parsed = JSON.parse(stored);
          const localStorageBookIds = new Set((parsed.books || []).map((b: any) => b.id));
          
          // Check if filesystem has books not in localStorage (restore scenario)
          const missingBooks: Book[] = [];
          for (const [bookId, bookJson] of fsBooks.entries()) {
            if (!localStorageBookIds.has(bookId)) {
              try {
                const bookData = JSON.parse(bookJson);
                const book = await this.deserializeBook(bookData);
                missingBooks.push(book);
              } catch (error) {
                console.error(`Failed to parse book ${bookId} from filesystem:`, error);
              }
            }
          }
          
          // If we found missing books, restore them
          if (missingBooks.length > 0) {
            console.log(`Restoring ${missingBooks.length} books from filesystem backup...`);
            parsed.books = parsed.books || [];
            parsed.books.push(...missingBooks.map(b => this.serializeBook(b)));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
        }
      }
      
      // Load from localStorage (primary storage)
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (!stored) {
        // Return empty data structure if nothing stored
        return this.createEmptyData();
      }

      const parsed = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      parsed.lastUpdated = new Date(parsed.lastUpdated);
      
      // Convert books (with nested dates and reconstruct model instances)
      if (parsed.books) {
        parsed.books = await Promise.all(parsed.books.map((bookData: any) => this.deserializeBook(bookData)));
      }
      
      return parsed as AppData;
    } catch (error) {
      console.error('Failed to load app data:', error);
      return this.createEmptyData();
    }
  }

  /**
   * Load app data from filesystem only (restore scenario)
   */
  private static async loadFromFilesystem(fsBooks: Map<string, string>): Promise<AppData> {
    const books: Book[] = [];
    
    for (const [bookId, bookJson] of fsBooks.entries()) {
      try {
        const bookData = JSON.parse(bookJson);
        const book = await this.deserializeBook(bookData);
        books.push(book);
      } catch (error) {
        console.error(`Failed to parse book ${bookId} from filesystem:`, error);
      }
    }
    
    // Save restored books to localStorage
    const restoredData: AppData = {
      version: VERSION,
      books,
      activeBookId: books.length > 0 ? books[0].id : null,
      lastUpdated: new Date()
    };
    
    // Serialize and save to localStorage
    const serialized = JSON.stringify({
      ...restoredData,
      books: books.map(b => this.serializeBook(b))
    });
    localStorage.setItem(STORAGE_KEY, serialized);
    
    return restoredData;
  }

  /**
   * Deserialize a book from JSON data (internal helper)
   */
  private static async deserializeBook(bookData: any): Promise<Book> {
    // Import model classes (safe here, not circular)
    const { Story } = await import('../models/Story.js');
    const { Scene } = await import('../models/Scene.js');
    
    // Reconstruct Story model instances first
    const reconstructedStories = bookData.stories ? bookData.stories.map((storyData: any) => {
      // Reconstruct Scene model instances
      const reconstructedScenes = storyData.scenes ? storyData.scenes.map((sceneData: any) => {
        // Convert scene dates
        sceneData.createdAt = new Date(sceneData.createdAt);
        sceneData.updatedAt = new Date(sceneData.updatedAt);
        
        // Convert image history timestamps
        if (sceneData.imageHistory) {
          sceneData.imageHistory = sceneData.imageHistory.map((img: any) => ({
            ...img,
            timestamp: new Date(img.timestamp)
          }));
        }
        
        return new Scene(sceneData);
      }) : [];
      
      // Convert story dates
      storyData.createdAt = new Date(storyData.createdAt);
      storyData.updatedAt = new Date(storyData.updatedAt);
      storyData.scenes = reconstructedScenes;
      
      return new Story(storyData);
    }) : [];
    
    // Create Book instance without stories (to avoid double-wrapping)
    const { stories, ...bookDataWithoutStories } = bookData;
    const book = new Book(bookDataWithoutStories);
    
    // Assign reconstructed stories directly
    book.stories = reconstructedStories;
    book.createdAt = new Date(bookData.createdAt);
    book.updatedAt = new Date(bookData.updatedAt);
    
    return book;
  }

  /**
   * Serialize a book to JSON format (internal helper)
   */
  private static serializeBook(book: Book): any {
    return {
      id: book.id,
      title: book.title,
      description: book.description,
      backgroundSetup: book.backgroundSetup,
      aspectRatio: book.aspectRatio,
      style: book.style,
      characters: book.characters,
      stories: book.stories.map(story => ({
        id: story.id,
        title: story.title,
        description: story.description,
        backgroundSetup: story.backgroundSetup,
        diagramStyle: story.diagramStyle,
        characters: story.characters,
        elements: story.elements,
        scenes: story.scenes.map(scene => ({
          id: scene.id,
          title: scene.title,
          description: scene.description,
          textPanel: scene.textPanel,
          diagramPanel: scene.diagramPanel,
          characters: scene.characters,
          elements: scene.elements,
          imageHistory: scene.imageHistory,
          createdAt: scene.createdAt,
          updatedAt: scene.updatedAt
        })),
        createdAt: story.createdAt,
        updatedAt: story.updatedAt
      })),
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    };
  }

  /**
   * Save app data to localStorage and auto-export books to filesystem as backup
   */
  static async save(data: AppData): Promise<void> {
    try {
      data.lastUpdated = new Date();
      data.version = VERSION;
      
      // Custom serialization to handle nested model instances
      const toSerialize = {
        ...data,
        books: data.books.map(book => ({
          id: book.id,
          title: book.title,
          description: book.description,
          backgroundSetup: book.backgroundSetup,
          aspectRatio: book.aspectRatio,
          style: book.style,
          characters: book.characters, // Include book-level characters
          stories: book.stories.map(story => ({
            id: story.id,
            title: story.title,
            description: story.description,
            backgroundSetup: story.backgroundSetup,
            diagramStyle: story.diagramStyle, // Include diagram style
            characters: story.characters,
            elements: story.elements,
            scenes: story.scenes.map(scene => ({
              id: scene.id,
              title: scene.title,
              description: scene.description,
              textPanel: scene.textPanel,
              diagramPanel: scene.diagramPanel, // Include diagram panel
              characters: scene.characters,
              elements: scene.elements,
              imageHistory: scene.imageHistory,
              createdAt: scene.createdAt,
              updatedAt: scene.updatedAt
            })),
            createdAt: story.createdAt,
            updatedAt: story.updatedAt
          })),
          createdAt: book.createdAt,
          updatedAt: book.updatedAt
        }))
      };
      
      const serialized = JSON.stringify(toSerialize);
      localStorage.setItem(STORAGE_KEY, serialized);
      
      // Auto-export all books to filesystem as backup (non-blocking)
      this.exportBooksToFilesystem(data.books).catch(error => {
        console.warn('Failed to export books to filesystem (backup only):', error);
        // Don't throw - filesystem backup is optional
      });
    } catch (error) {
      console.error('Failed to save app data to localStorage:', error);
      throw new Error('Failed to save data. Storage quota may be exceeded.');
    }
  }

  /**
   * Export all books to filesystem as backup (internal helper)
   */
  private static async exportBooksToFilesystem(books: Book[]): Promise<void> {
    const fsConfigured = await FileSystemService.isConfigured();
    if (!fsConfigured) {
      return; // Silently skip if filesystem not configured
    }

    // Export each book individually
    for (const book of books) {
      try {
        // Serialize book data
        const bookData = {
          id: book.id,
          title: book.title,
          description: book.description,
          backgroundSetup: book.backgroundSetup,
          aspectRatio: book.aspectRatio,
          style: book.style,
          characters: book.characters,
          stories: book.stories.map(story => ({
            id: story.id,
            title: story.title,
            description: story.description,
            backgroundSetup: story.backgroundSetup,
            diagramStyle: story.diagramStyle,
            characters: story.characters,
            elements: story.elements,
            scenes: story.scenes.map(scene => ({
              id: scene.id,
              title: scene.title,
              description: scene.description,
              textPanel: scene.textPanel,
              diagramPanel: scene.diagramPanel,
              characters: scene.characters,
              elements: scene.elements,
              imageHistory: scene.imageHistory,
              createdAt: scene.createdAt,
              updatedAt: scene.updatedAt
            })),
            createdAt: story.createdAt,
            updatedAt: story.updatedAt
          })),
          createdAt: book.createdAt,
          updatedAt: book.updatedAt
        };
        
        const bookJson = JSON.stringify(bookData, null, 2);
        await FileSystemService.saveBookMetadata(book.id, bookJson);
      } catch (error) {
        console.error(`Failed to export book ${book.id} to filesystem:`, error);
        // Continue with other books
      }
    }
  }

  /**
   * Get a book by ID
   */
  static async getBook(bookId: string): Promise<Book | null> {
    const data = await this.load();
    const bookData = data.books.find(b => b.id === bookId);
    if (!bookData) {
      return null;
    }
    
    // Import Story class to properly instantiate stories
    const { Story: StoryClass } = await import('../models/Story.js');
    
    // Create a proper Book instance
    const book = new Book({
      id: bookData.id,
      title: bookData.title,
      description: bookData.description,
      backgroundSetup: bookData.backgroundSetup,
      aspectRatio: bookData.aspectRatio,
      style: bookData.style,
      characters: bookData.characters || [],
      createdAt: bookData.createdAt,
      updatedAt: bookData.updatedAt
    });
    
    // Properly instantiate Story objects with all their data
    if (bookData.stories) {
      // Import Scene class to properly instantiate scenes
      const { Scene: SceneClass } = await import('../models/Scene.js');
      
      book.stories = (bookData.stories as any[]).map((storyData: any) => {
        // Convert plain scene objects to Scene instances (if not already)
        const sceneInstances = (storyData.scenes || []).map((sceneData: any) => {
          if (sceneData instanceof SceneClass) {
            return sceneData; // Already a Scene instance, don't re-instantiate
          }
          return new SceneClass(sceneData);
        });
        
        return new StoryClass({
          id: storyData.id,
          title: storyData.title,
          description: storyData.description,
          backgroundSetup: storyData.backgroundSetup,
          diagramStyle: storyData.diagramStyle, // Include diagram style
          characters: storyData.characters || [],
          elements: storyData.elements || [],
          scenes: sceneInstances, // Use Scene instances
          createdAt: storyData.createdAt,
          updatedAt: storyData.updatedAt
        });
      });
    }
    
    return book;
  }

  /**
   * Save a book (create or update) - auto-exports to filesystem as backup
   */
  static async saveBook(book: Book): Promise<void> {
    const data = await this.load();
    const index = data.books.findIndex(b => b.id === book.id);
    
    book.updatedAt = new Date();
    
    if (index >= 0) {
      // Update existing book
      data.books[index] = book;
    } else {
      // Add new book
      data.books.push(book);
    }
    
    await this.save(data);
    
    // Also export this specific book to filesystem immediately (non-blocking)
    this.exportBookToFilesystem(book).catch(error => {
      console.warn(`Failed to export book ${book.id} to filesystem (backup only):`, error);
    });
  }

  /**
   * Export a single book to filesystem (internal helper)
   */
  private static async exportBookToFilesystem(book: Book): Promise<void> {
    const fsConfigured = await FileSystemService.isConfigured();
    if (!fsConfigured) {
      return; // Silently skip if filesystem not configured
    }

    try {
      const bookData = this.serializeBook(book);
      const bookJson = JSON.stringify(bookData, null, 2);
      await FileSystemService.saveBookMetadata(book.id, bookJson);
    } catch (error) {
      console.error(`Failed to export book ${book.id} to filesystem:`, error);
      throw error;
    }
  }

  /**
   * Delete a book by ID - also deletes from filesystem backup
   */
  static async deleteBook(bookId: string): Promise<boolean> {
    const data = await this.load();
    const initialLength = data.books.length;
    
    data.books = data.books.filter(b => b.id !== bookId);
    
    if (data.books.length < initialLength) {
      // If deleted book was active, clear active book
      if (data.activeBookId === bookId) {
        data.activeBookId = null;
      }
      
      await this.save(data);
      
      // Also delete from filesystem backup (non-blocking)
      FileSystemService.deleteBookMetadata(bookId).catch(error => {
        console.warn(`Failed to delete book ${bookId} from filesystem backup:`, error);
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Get the active book
   */
  static async getActiveBook(): Promise<Book | null> {
    const data = await this.load();
    
    if (!data.activeBookId) {
      return null;
    }
    
    return data.books.find(b => b.id === data.activeBookId) || null;
  }

  /**
   * Set the active book by ID
   */
  static async setActiveBook(bookId: string | null): Promise<void> {
    const data = await this.load();
    
    if (bookId && !data.books.find(b => b.id === bookId)) {
      throw new Error(`Book with ID ${bookId} not found`);
    }
    
    data.activeBookId = bookId;
    await this.save(data);
  }

  /**
   * Get all books
   */
  static async getAllBooks(): Promise<Book[]> {
    const data = await this.load();
    // Import Story class
    const { Story: StoryClass } = await import('../models/Story.js');
    
    // Return proper Book instances with methods and properly instantiated stories
    return data.books.map(bookData => {
      const book = new Book({
        id: bookData.id,
        title: bookData.title,
        description: bookData.description,
        backgroundSetup: bookData.backgroundSetup,
        aspectRatio: bookData.aspectRatio,
        style: bookData.style,
        characters: bookData.characters || [],
        createdAt: bookData.createdAt,
        updatedAt: bookData.updatedAt
      });
      
      // Properly instantiate Story objects
      if (bookData.stories) {
        book.stories = (bookData.stories as any[]).map((storyData: any) => 
          new StoryClass({
            id: storyData.id,
            title: storyData.title,
            description: storyData.description,
            backgroundSetup: storyData.backgroundSetup,
            characters: storyData.characters || [],
            elements: storyData.elements || [],
            scenes: storyData.scenes || [],
            createdAt: storyData.createdAt,
            updatedAt: storyData.updatedAt
          })
        );
      }
      
      return book;
    });
  }

  /**
   * Get book count
   */
  static async getBookCount(): Promise<number> {
    const data = await this.load();
    return data.books.length;
  }

  /**
   * Check if storage has been initialized (Version 4.0)
   */
  static isInitialized(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return false;
      }
      
      const parsed = JSON.parse(stored);
      return parsed.version === VERSION;
    } catch {
      return false;
    }
  }

  /**
   * Clear all storage (dangerous!)
   */
  static clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('⚠️ All app data cleared');
  }

  /**
   * Export all data as JSON string
   */
  static async exportData(): Promise<string> {
    const data = await this.load();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    bookCount: number;
    totalStories: number;
    totalScenes: number;
    storageSize: number;
    version: string;
  }> {
    const data = await this.load();
    
    let totalStories = 0;
    let totalScenes = 0;
    
    data.books.forEach(book => {
      totalStories += book.stories.length;
      book.stories.forEach(story => {
        totalScenes += story.scenes.length;
      });
    });
    
    const stored = localStorage.getItem(STORAGE_KEY) || '';
    const storageSize = new Blob([stored]).size;
    
    return {
      bookCount: data.books.length,
      totalStories,
      totalScenes,
      storageSize,
      version: data.version
    };
  }

  /**
   * Create an empty data structure
   */
  private static createEmptyData(): AppData {
    return {
      version: VERSION,
      books: [],
      activeBookId: null,
      lastUpdated: new Date()
    };
  }
}

