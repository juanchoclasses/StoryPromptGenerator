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

