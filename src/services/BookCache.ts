/**
 * BookCache - In-memory cache for books with filesystem persistence
 * 
 * Stores all books in memory for instant access.
 * Filesystem is the source of truth - all changes are persisted immediately.
 * Provides fast, reliable access without localStorage dependency.
 */

import { Book } from '../models/Book';
import { FileSystemService } from './FileSystemService';

export class BookCache {
  private cache = new Map<string, Book>();
  private activeBookId: string | null = null;
  private loaded = false;
  private loadingPromise: Promise<void> | null = null;

  /**
   * Load all books from filesystem into cache
   * Safe to call multiple times - will only load once
   */
  async loadAll(): Promise<void> {
    // If already loaded, return immediately
    if (this.loaded) {
      return;
    }

    // If currently loading, wait for that promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading
    this.loadingPromise = this.doLoadAll();
    await this.loadingPromise;
    this.loadingPromise = null;
  }

  /**
   * Internal method to actually load books
   */
  private async doLoadAll(): Promise<void> {
    try {
      console.log('📚 Loading books from filesystem into cache...');
      
      const fsConfigured = await FileSystemService.isConfigured();
      if (!fsConfigured) {
        console.log('⚠️ Filesystem not configured - cache will be empty');
        this.loaded = true;
        return;
      }

      const fsBooks = await FileSystemService.loadAllBooksMetadata();
      console.log(`Found ${fsBooks.size} books in filesystem`);

      // Deserialize and cache each book
      for (const [bookId, bookJson] of fsBooks.entries()) {
        try {
          const bookData = JSON.parse(bookJson);
          const book = await this.deserializeBook(bookData);
          this.cache.set(bookId, book);
          console.log(`✓ Loaded book: ${book.title} (${bookId})`);
        } catch (error) {
          console.error(`Failed to parse book ${bookId}:`, error);
        }
      }

      // Load activeBookId from filesystem metadata
      const appMetadata = await FileSystemService.loadAppMetadata();
      if (appMetadata?.activeBookId) {
        this.activeBookId = appMetadata.activeBookId;
      } else if (this.cache.size > 0) {
        // Fallback: use first book if no activeBookId set
        this.activeBookId = Array.from(this.cache.keys())[0];
      }
      
      this.loaded = true;
      console.log(`✓ BookCache loaded: ${this.cache.size} books, activeBookId: ${this.activeBookId}`);
    } catch (error) {
      console.error('Failed to load books into cache:', error);
      this.loaded = true; // Mark as loaded even on error to prevent retry loops
    }
  }

  /**
   * Deserialize a book from JSON data
   */
  private async deserializeBook(bookData: any): Promise<Book> {
    // Import model classes (safe here, not circular)
    const { Story } = await import('../models/Story.js');
    const { Scene } = await import('../models/Scene.js');
    const { DEFAULT_PANEL_CONFIG } = await import('../types/Book.js');
    
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
        
        // Preserve layout field if present
        if (sceneData.layout) {
          console.log(`📐 Scene "${sceneData.title}" has layout:`, sceneData.layout.type);
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
    
    // CRITICAL FIX: Ensure panelConfig is properly merged with defaults
    // When loading from JSON, the style object exists but may be missing nested defaults
    if (bookDataWithoutStories.style) {
      // Deep merge: ensure panelConfig has all default values
      bookDataWithoutStories.style = {
        ...bookDataWithoutStories.style,
        panelConfig: {
          ...DEFAULT_PANEL_CONFIG,
          ...(bookDataWithoutStories.style.panelConfig || {})
        }
      };
      console.log(`📘 Book style loaded with panelConfig:`, bookDataWithoutStories.style.panelConfig);
    }
    
    const book = new Book(bookDataWithoutStories);
    
    // Assign reconstructed stories directly
    book.stories = reconstructedStories;
    book.createdAt = new Date(bookData.createdAt);
    book.updatedAt = new Date(bookData.updatedAt);
    
    return book;
  }

  /**
   * Get a book from cache
   */
  get(bookId: string): Book | null {
    return this.cache.get(bookId) || null;
  }

  /**
   * Get all books from cache
   */
  getAll(): Book[] {
    return Array.from(this.cache.values());
  }

  /**
   * Set a book in cache and save to filesystem
   */
  async set(book: Book): Promise<void> {
    book.updatedAt = new Date();
    
    // Update cache
    this.cache.set(book.id, book);
    
    // Save to filesystem immediately (non-blocking for UI)
    this.saveToFilesystem(book).catch(error => {
      console.error(`Failed to save book ${book.id} to filesystem:`, error);
    });
  }

  /**
   * Save book to filesystem
   */
  private async saveToFilesystem(book: Book): Promise<void> {
    const fsConfigured = await FileSystemService.isConfigured();
    if (!fsConfigured) {
      console.warn('Filesystem not configured - book not persisted');
      return;
    }

    try {
      const bookData = this.serializeBook(book);
      const bookJson = JSON.stringify(bookData, null, 2);
      await FileSystemService.saveBookMetadata(book.id, bookJson);
      console.log(`✓ Book saved to filesystem: ${book.title}`);
    } catch (error) {
      console.error(`Failed to save book ${book.id} to filesystem:`, error);
      throw error;
    }
  }

  /**
   * Serialize a book to JSON format
   */
  private serializeBook(book: Book): any {
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
   * Delete a book from cache and filesystem
   */
  async delete(bookId: string): Promise<void> {
    this.cache.delete(bookId);
    
    // Clear active book if it was deleted
    if (this.activeBookId === bookId) {
      this.activeBookId = null;
    }
    
    // Delete from filesystem
    await FileSystemService.deleteBookMetadata(bookId).catch(error => {
      console.error(`Failed to delete book ${bookId} from filesystem:`, error);
    });
  }

  /**
   * Set active book ID and save to filesystem
   */
  async setActiveBookId(bookId: string | null): Promise<void> {
    this.activeBookId = bookId;
    
    // Save to filesystem metadata
    await FileSystemService.saveAppMetadata({ activeBookId: bookId }).catch(error => {
      console.warn('Failed to save activeBookId to filesystem:', error);
    });
  }

  /**
   * Get active book ID
   */
  getActiveBookId(): string | null {
    return this.activeBookId;
  }

  /**
   * Get active book
   */
  getActiveBook(): Book | null {
    if (!this.activeBookId) {
      return null;
    }
    return this.get(this.activeBookId);
  }

  /**
   * Check if cache is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Clear entire cache (useful for testing)
   */
  clear(): void {
    this.cache.clear();
    this.activeBookId = null;
    this.loaded = false;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    bookCount: number;
    activeBookId: string | null;
    loaded: boolean;
  } {
    return {
      bookCount: this.cache.size,
      activeBookId: this.activeBookId,
      loaded: this.loaded
    };
  }
}

// Singleton instance
export const bookCache = new BookCache();

