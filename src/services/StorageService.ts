import { Book } from '../models/Book';

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
   * Load app data from localStorage
   */
  static async load(): Promise<AppData> {
    try {
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
        // Import model classes (safe here, not circular)
        const { Story } = await import('../models/Story.js');
        const { Scene } = await import('../models/Scene.js');
        
        parsed.books = parsed.books.map((bookData: any) => {
          // Reconstruct Story model instances
          if (bookData.stories) {
            bookData.stories = bookData.stories.map((storyData: any) => {
              // Reconstruct Scene model instances
              if (storyData.scenes) {
                storyData.scenes = storyData.scenes.map((sceneData: any) => {
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
                });
              }
              
              // Convert story dates
              storyData.createdAt = new Date(storyData.createdAt);
              storyData.updatedAt = new Date(storyData.updatedAt);
              
              return new Story(storyData);
            });
          }
          
          // Create Book instance
          const book = new Book(bookData);
          book.createdAt = new Date(bookData.createdAt);
          book.updatedAt = new Date(bookData.updatedAt);
          
          return book;
        });
      }
      
      return parsed as AppData;
    } catch (error) {
      console.error('Failed to load app data from localStorage:', error);
      return this.createEmptyData();
    }
  }

  /**
   * Save app data to localStorage
   */
  static save(data: AppData): void {
    try {
      data.lastUpdated = new Date();
      data.version = VERSION;
      
      const serialized = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save app data to localStorage:', error);
      throw new Error('Failed to save data. Storage quota may be exceeded.');
    }
  }

  /**
   * Get a book by ID
   */
  static async getBook(bookId: string): Promise<Book | null> {
    const data = await this.load();
    return data.books.find(b => b.id === bookId) || null;
  }

  /**
   * Save a book (create or update)
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
    
    this.save(data);
  }

  /**
   * Delete a book by ID
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
      
      this.save(data);
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
    this.save(data);
  }

  /**
   * Get all books
   */
  static async getAllBooks(): Promise<Book[]> {
    const data = await this.load();
    return data.books;
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
   * Migrate from old version or clear storage
   * For Version 4.0, we're starting fresh (user approved)
   */
  static migrate(): void {
    // Check for old storage keys
    const oldKeys = [
      'book-story-data-v2',
      'book-collection-v1',
      'active-book-id'
    ];
    
    const hasOldData = oldKeys.some(key => 
      Object.keys(localStorage).some(k => k.includes(key))
    );
    
    if (hasOldData) {
      console.log('📦 Detected old storage format. Clearing for Version 4.0...');
      
      // Remove old storage keys
      Object.keys(localStorage).forEach(key => {
        if (oldKeys.some(oldKey => key.includes(oldKey))) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ Old storage cleared. Ready for Version 4.0');
    }
    
    // Initialize fresh storage if not already done
    if (!this.isInitialized()) {
      this.save(this.createEmptyData());
      console.log('✅ Version 4.0 storage initialized');
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

