import { Book } from '../models/Book';
import { FileSystemService } from './FileSystemService';
import { bookCache } from './BookCache';

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
 * StorageService - In-memory cache backed by filesystem
 * 
 * ARCHITECTURE (v5.0+):
 * - Primary: BookCache (in-memory) + Filesystem (source of truth)
 * - No localStorage dependency - filesystem-only storage
 * 
 * Benefits:
 * - Faster: No JSON serialization on every operation
 * - More reliable: Filesystem won't be evicted
 * - Better performance: In-memory cache is instant
 * - Easier debugging: All data visible in filesystem
 */
const VERSION = '5.0.0';

export class StorageService {
  /**
   * Load app data from BookCache (which loads from filesystem)
   * Filesystem-only - no localStorage fallback
   */
  static async load(): Promise<AppData> {
    try {
      // Ensure BookCache is loaded (loads from filesystem)
      await bookCache.loadAll();
      
      // Get books from cache
      const books = bookCache.getAll();
      const activeBookId = bookCache.getActiveBookId();
      
      return {
        version: VERSION,
        books,
        activeBookId,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to load app data:', error);
      return this.createEmptyData();
    }
  }


  /**
   * Deserialize a book from JSON data (internal helper)
   * Note: This is now only used internally by BookCache
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
          layout: scene.layout, // Custom layout configuration
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
   * Save app data to BookCache (which saves to filesystem)
   * No longer uses localStorage - filesystem is source of truth
   */
  static async save(data: AppData): Promise<void> {
    try {
      data.lastUpdated = new Date();
      data.version = VERSION;
      
      // Update active book ID in cache
      await bookCache.setActiveBookId(data.activeBookId);
      
      // Save all books to cache (which saves to filesystem)
      // Note: Books are already in cache from individual saveBook() calls
      // This method is mainly for syncing activeBookId
      
      // Ensure all books in data are in cache
      for (const book of data.books) {
        await bookCache.set(book);
      }
      
      console.log(`✓ App data saved: ${data.books.length} books, activeBookId: ${data.activeBookId}`);
    } catch (error) {
      console.error('Failed to save app data:', error);
      throw new Error('Failed to save data.');
    }
  }

  /**
   * Get a book by ID from cache
   */
  static async getBook(bookId: string): Promise<Book | null> {
    // Ensure cache is loaded
    await bookCache.loadAll();
    
    // Get from cache
    return bookCache.get(bookId);
  }

  /**
   * Save a book (create or update) - saves to cache and filesystem
   */
  static async saveBook(book: Book): Promise<void> {
    // Ensure cache is loaded
    await bookCache.loadAll();
    
    // Save to cache (which saves to filesystem)
    await bookCache.set(book);
  }

  /**
   * Delete a book by ID - deletes from cache and filesystem
   */
  static async deleteBook(bookId: string): Promise<boolean> {
    // Ensure cache is loaded
    await bookCache.loadAll();
    
    // Check if book exists
    const book = bookCache.get(bookId);
    if (!book) {
      return false;
    }
    
    // Delete from cache (which deletes from filesystem)
    await bookCache.delete(bookId);
    
    return true;
  }

  /**
   * Get the active book from cache
   */
  static async getActiveBook(): Promise<Book | null> {
    // Ensure cache is loaded
    await bookCache.loadAll();
    
    return bookCache.getActiveBook();
  }

  /**
   * Set the active book by ID
   */
  static async setActiveBook(bookId: string | null): Promise<void> {
    // Ensure cache is loaded
    await bookCache.loadAll();
    
    if (bookId && !bookCache.get(bookId)) {
      throw new Error(`Book with ID ${bookId} not found`);
    }
    
    await bookCache.setActiveBookId(bookId);
  }

  /**
   * Get all books from cache
   */
  static async getAllBooks(): Promise<Book[]> {
    // Ensure cache is loaded
    await bookCache.loadAll();
    
    return bookCache.getAll();
  }

  /**
   * Get book count from cache
   */
  static async getBookCount(): Promise<number> {
    await bookCache.loadAll();
    return bookCache.getAll().length;
  }

  /**
   * Check if storage has been initialized
   */
  static async isInitialized(): Promise<boolean> {
    await bookCache.loadAll();
    return bookCache.isLoaded() && bookCache.getAll().length > 0;
  }

  /**
   * Clear all storage (dangerous!)
   */
  static async clearAll(): Promise<void> {
    // Clear cache
    bookCache.clear();
    
    // Clear filesystem (if configured)
    const fsConfigured = await FileSystemService.isConfigured();
    if (fsConfigured) {
      // Delete all book files
      const books = await FileSystemService.loadAllBooksMetadata();
      for (const bookId of books.keys()) {
        await FileSystemService.deleteBookMetadata(bookId);
      }
    }
    
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
    await bookCache.loadAll();
    const books = bookCache.getAll();
    
    let totalStories = 0;
    let totalScenes = 0;
    
    books.forEach(book => {
      totalStories += book.stories.length;
      book.stories.forEach(story => {
        totalScenes += story.scenes.length;
      });
    });
    
    // Calculate approximate storage size from filesystem
    let storageSize = 0;
    const fsConfigured = await FileSystemService.isConfigured();
    if (fsConfigured) {
      const fsBooks = await FileSystemService.loadAllBooksMetadata();
      for (const bookJson of fsBooks.values()) {
        storageSize += new Blob([bookJson]).size;
      }
    }
    
    return {
      bookCount: books.length,
      totalStories,
      totalScenes,
      storageSize,
      version: VERSION
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

