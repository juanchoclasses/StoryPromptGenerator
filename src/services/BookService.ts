import { Book } from '../models/Book';
import { Story } from '../models/Story';
import { StorageService } from './StorageService';
import type { StoryData } from '../types/Story';
import type { PanelConfig } from '../types/Book';

/**
 * BookService - High-level API for book management
 * Uses StorageService for persistence and Book model for business logic
 */
export class BookService {
  /**
   * Initialize storage (run migration if needed)
   */
  static initialize(): void {
    StorageService.migrate();
  }

  /**
   * Get all books
   */
  static async getAllBooks(): Promise<Book[]> {
    return await StorageService.getAllBooks();
  }

  /**
   * Get book by ID
   */
  static async getBook(bookId: string): Promise<Book | null> {
    return await StorageService.getBook(bookId);
  }

  /**
   * Create a new book
   */
  static async createBook(
    title: string,
    description?: string,
    aspectRatio?: string,
    panelConfig?: PanelConfig,
    backgroundSetup?: string
  ): Promise<Book> {
    const book = new Book({
      title,
      description,
      backgroundSetup,
      aspectRatio: aspectRatio || '9:16',
      style: {
        panelConfig: panelConfig
      }
    });

    // Validate before saving
    const validation = book.validate();
    if (!validation.isValid) {
      throw new Error(`Cannot create book: ${validation.errors.join(', ')}`);
    }

    await StorageService.saveBook(book);

    // Set as active book if it's the first one
    const bookCount = await StorageService.getBookCount();
    if (bookCount === 1) {
      await StorageService.setActiveBook(book.id);
    }

    return book;
  }

  /**
   * Update book metadata
   */
  static async updateBook(bookId: string, updates: Partial<{
    title: string;
    description: string;
    backgroundSetup: string;
    aspectRatio: string;
    panelConfig: PanelConfig;
  }>): Promise<Book | null> {
    const book = await StorageService.getBook(bookId);
    if (!book) return null;

    // Apply updates
    if (updates.title !== undefined) book.title = updates.title;
    if (updates.description !== undefined) book.description = updates.description;
    if (updates.backgroundSetup !== undefined) book.backgroundSetup = updates.backgroundSetup;
    if (updates.aspectRatio !== undefined) book.aspectRatio = updates.aspectRatio;
    if (updates.panelConfig !== undefined) {
      book.updateStyle({ panelConfig: updates.panelConfig });
    }

    // Validate before saving
    const validation = book.validate();
    if (!validation.isValid) {
      throw new Error(`Cannot update book: ${validation.errors.join(', ')}`);
    }

    await StorageService.saveBook(book);
    return book;
  }

  /**
   * Delete a book
   */
  static async deleteBook(bookId: string): Promise<boolean> {
    return await StorageService.deleteBook(bookId);
  }

  /**
   * Get active book ID
   */
  static async getActiveBookId(): Promise<string | null> {
    const activeBook = await StorageService.getActiveBook();
    return activeBook?.id || null;
  }

  /**
   * Get active book
   */
  static async getActiveBook(): Promise<Book | null> {
    return await StorageService.getActiveBook();
  }

  /**
   * Set active book
   */
  static async setActiveBook(bookId: string | null): Promise<void> {
    await StorageService.setActiveBook(bookId);
  }

  /**
   * Get book data (for backward compatibility with existing components)
   * Returns StoryData format used by current UI
   */
  static async getBookData(bookId: string): Promise<StoryData | null> {
    const book = await StorageService.getBook(bookId);
    if (!book) return null;

    // Convert Book model to StoryData format
    return {
      version: '4.0.0',
      stories: book.stories.map(story => ({
        id: story.id,
        title: story.title,
        description: story.description,
        backgroundSetup: story.backgroundSetup,
        scenes: story.scenes.map(scene => ({
          id: scene.id,
          title: scene.title,
          description: scene.description,
          textPanel: scene.textPanel,
          characters: scene.characters || [],
          elements: scene.elements || [],
          characterIds: scene.characters || [], // DEPRECATED: for backward compat
          elementIds: scene.elements || [], // DEPRECATED: for backward compat
          imageHistory: scene.imageHistory || [],
          createdAt: scene.createdAt,
          updatedAt: scene.updatedAt
        })),
        // Add dummy IDs for backward compatibility with old Character type
        characters: story.characters.map(char => ({
          id: char.name, // Use name as ID for backward compatibility
          name: char.name,
          description: char.description
        })),
        // Add dummy IDs for backward compatibility with old StoryElement type
        elements: story.elements.map(elem => ({
          id: elem.name, // Use name as ID for backward compatibility
          name: elem.name,
          description: elem.description,
          category: elem.category
        })),
        characterIds: [], // Deprecated
        elementIds: [], // Deprecated
        createdAt: story.createdAt,
        updatedAt: story.updatedAt
      })),
      // Global characters/elements are deprecated in v4.0
      // They're now stored at story level
      characters: [],
      elements: [],
      lastUpdated: book.updatedAt
    };
  }

  /**
   * Get active book data (for backward compatibility)
   */
  static async getActiveBookData(): Promise<StoryData | null> {
    const activeBookId = await this.getActiveBookId();
    if (!activeBookId) return null;
    return this.getBookData(activeBookId);
  }

  /**
   * Save book data (for backward compatibility with existing components)
   * Converts StoryData format to Book model and saves
   */
  static async saveBookData(bookId: string, data: StoryData): Promise<void> {
    // Import Scene class for proper reconstruction
    const { Scene: SceneClass } = await import('../models/Scene.js');
    
    const book = await StorageService.getBook(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }

    // Update stories from data with properly reconstructed scenes
    book.stories = data.stories.map(storyData => {
      // Convert plain scene objects to Scene instances
      const sceneInstances = (storyData.scenes || []).map(sceneData => {
        if (sceneData instanceof SceneClass) {
          return sceneData; // Already a Scene instance
        }
        return new SceneClass(sceneData); // Convert plain object to Scene instance
      });
      
      return new Story({
        id: storyData.id,
        title: storyData.title,
        description: storyData.description,
        backgroundSetup: storyData.backgroundSetup,
        characters: storyData.characters || [],
        elements: storyData.elements || [],
        scenes: sceneInstances,
        createdAt: storyData.createdAt,
        updatedAt: storyData.updatedAt
      });
    });

    // Validate before saving
    const validation = book.validate();
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Book validation warnings:', validation.warnings);
    }
    if (!validation.isValid) {
      throw new Error(`Cannot save book: ${validation.errors.join(', ')}`);
    }

    await StorageService.saveBook(book);
  }

  /**
   * Save active book data (for backward compatibility)
   */
  static async saveActiveBookData(data: StoryData): Promise<boolean> {
    const activeBookId = await this.getActiveBookId();
    if (!activeBookId) return false;

    try {
      await this.saveBookData(activeBookId, data);
      return true;
    } catch (error) {
      console.error('Failed to save active book data:', error);
      return false;
    }
  }

  /**
   * Update book statistics (for backward compatibility)
   * Note: In v4.0, statistics are calculated on-demand
   * @deprecated This method is no longer needed in v4.0
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async updateBookStatistics(..._args: unknown[]): Promise<void> {
    // Statistics are now calculated on-demand from the book's stories
    // This method is kept for backward compatibility but doesn't need to do anything
    return;
  }

  /**
   * Export book data as JSON string
   */
  static async exportBook(bookId: string): Promise<string | null> {
    const book = await StorageService.getBook(bookId);
    if (!book) return null;

    const exportData = book.toJSON();
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import book data from JSON string
   */
  static async importBook(importData: string): Promise<Book | null> {
    try {
      const parsed = JSON.parse(importData);

      // Use Book.fromJSON to properly reconstruct the book
      const book = await Book.fromJSON(parsed);

      // Validate before saving
      const validation = book.validate();
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('Imported book has validation warnings:', validation.warnings);
      }
      if (!validation.isValid) {
        throw new Error(`Cannot import book: ${validation.errors.join(', ')}`);
      }

      // Generate new ID for imported book to avoid conflicts
      book.id = crypto.randomUUID();

      await StorageService.saveBook(book);

      // Set as active book
      await StorageService.setActiveBook(book.id);

      return book;
    } catch (error) {
      console.error('Error importing book:', error);
      return null;
    }
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
    return await StorageService.getStorageStats();
  }

  /**
   * Get book collection (for backward compatibility with FileManager)
   */
  static async getBookCollection(): Promise<{
    books: Array<{
      id: string;
      title: string;
      description?: string;
      storyCount: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    activeBookId: string | null;
    lastUpdated: Date;
  }> {
    const books = await StorageService.getAllBooks();
    const activeBook = await StorageService.getActiveBook();
    const appData = await StorageService.load();

    return {
      books: books.map(book => ({
        id: book.id,
        title: book.title,
        description: book.description,
        storyCount: book.stories.length,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt
      })),
      activeBookId: activeBook?.id || null,
      lastUpdated: appData.lastUpdated
    };
  }
}
