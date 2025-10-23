import type { Book, BookCollection, PanelConfig } from '../types/Book';
import type { StoryData } from '../types/Story';
import { CURRENT_VERSION } from '../types/Story';
import { MigrationService } from './MigrationService';

const BOOK_METADATA_KEY = 'book-metadata';
const BOOK_DATA_PREFIX = 'book-story-data-v2-';

export class BookService {
  /**
   * Get the collection of all books
   */
  static getBookCollection(): BookCollection {
    const stored = localStorage.getItem(BOOK_METADATA_KEY);
    if (!stored) {
      return {
        books: [],
        activeBookId: null,
        lastUpdated: new Date()
      };
    }

    try {
      const data = JSON.parse(stored);
      return {
        books: data.books?.map((book: Record<string, unknown>) => ({
          ...book,
          createdAt: new Date((book.createdAt as string | number) || Date.now()),
          updatedAt: new Date((book.updatedAt as string | number) || Date.now())
        })) || [],
        activeBookId: data.activeBookId || null,
        lastUpdated: new Date(data.lastUpdated || Date.now())
      };
    } catch (error) {
      console.error('Error parsing book collection:', error);
      return {
        books: [],
        activeBookId: null,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Save the book collection
   */
  private static saveBookCollection(collection: BookCollection): void {
    localStorage.setItem(BOOK_METADATA_KEY, JSON.stringify({
      ...collection,
      lastUpdated: new Date()
    }));
  }

  /**
   * Get book data by ID
   */
  static getBookData(bookId: string): StoryData | null {
    const stored = localStorage.getItem(`${BOOK_DATA_PREFIX}${bookId}`);
    if (!stored) return null;

    try {
      const rawData = JSON.parse(stored);
      
      // Use migration service to handle version upgrades
      const migrationResult = MigrationService.migrateData(rawData);
      
      if (!migrationResult.success) {
        console.error('Migration failed:', migrationResult.errors);
        return null;
      }
      
      // If data was migrated, save the migrated version
      if (migrationResult.migrated) {
        console.log('Book data migrated successfully to version', CURRENT_VERSION);
        this.saveBookData(bookId, migrationResult.data);
      }
      
      return migrationResult.data;
    } catch (error) {
      console.error('Error parsing book data:', error);
      return null;
    }
  }

  /**
   * Save book data
   */
  static saveBookData(bookId: string, data: StoryData): void {
    const dataToSave = {
      ...data,
      version: CURRENT_VERSION,
      lastUpdated: new Date()
    };
    localStorage.setItem(`${BOOK_DATA_PREFIX}${bookId}`, JSON.stringify(dataToSave));
  }

  /**
   * Create a new book
   */
  static createBook(title: string, description?: string, aspectRatio?: string, panelConfig?: PanelConfig): Book {
    const collection = this.getBookCollection();
    const newBook: Book = {
      id: crypto.randomUUID(),
      title,
      description,
      aspectRatio: aspectRatio || '9:16', // Default to 9:16 portrait (ChatGPT compatible)
      panelConfig,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Initialize empty book data
    const emptyBookData: StoryData = {
      version: CURRENT_VERSION,
      stories: [],
      characters: [],
      elements: [],
      lastUpdated: new Date()
    };

    // Save book data
    this.saveBookData(newBook.id, emptyBookData);

    // Add to collection
    collection.books.push({
      ...newBook,
      storyCount: 0,
      characterCount: 0,
      elementCount: 0
    });

    // Set as active book if it's the first one
    if (collection.books.length === 1) {
      collection.activeBookId = newBook.id;
    }

    this.saveBookCollection(collection);
    return newBook;
  }

  /**
   * Update book metadata
   */
  static updateBook(bookId: string, updates: Partial<Book>): Book | null {
    const collection = this.getBookCollection();
    const bookIndex = collection.books.findIndex(book => book.id === bookId);
    
    if (bookIndex === -1) return null;
    
    collection.books[bookIndex] = {
      ...collection.books[bookIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveBookCollection(collection);
    return collection.books[bookIndex];
  }

  /**
   * Delete a book
   */
  static deleteBook(bookId: string): boolean {
    const collection = this.getBookCollection();
    const bookIndex = collection.books.findIndex(book => book.id === bookId);
    
    if (bookIndex === -1) return false;
    
    // Remove from collection
    collection.books.splice(bookIndex, 1);
    
    // Clear active book if it was the deleted one
    if (collection.activeBookId === bookId) {
      collection.activeBookId = collection.books.length > 0 ? collection.books[0].id : null;
    }
    
    // Remove book data from localStorage
    localStorage.removeItem(`${BOOK_DATA_PREFIX}${bookId}`);
    
    this.saveBookCollection(collection);
    return true;
  }

  /**
   * Set active book
   */
  static setActiveBook(bookId: string): boolean {
    const collection = this.getBookCollection();
    const bookExists = collection.books.some(book => book.id === bookId);
    
    if (!bookExists) return false;
    
    collection.activeBookId = bookId;
    this.saveBookCollection(collection);
    return true;
  }

  /**
   * Get active book ID
   */
  static getActiveBookId(): string | null {
    const collection = this.getBookCollection();
    return collection.activeBookId;
  }

  /**
   * Get active book data
   */
  static getActiveBookData(): StoryData | null {
    const activeBookId = this.getActiveBookId();
    if (!activeBookId) return null;
    return this.getBookData(activeBookId);
  }

  /**
   * Save active book data
   */
  static saveActiveBookData(data: StoryData): boolean {
    const activeBookId = this.getActiveBookId();
    if (!activeBookId) return false;
    
    this.saveBookData(activeBookId, data);
    this.updateBookStats(activeBookId, data);
    return true;
  }

  /**
   * Update book statistics
   */
  private static updateBookStats(bookId: string, data: StoryData): void {
    const collection = this.getBookCollection();
    const bookIndex = collection.books.findIndex(book => book.id === bookId);
    
    if (bookIndex === -1) return;
    
    collection.books[bookIndex] = {
      ...collection.books[bookIndex],
      storyCount: data.stories.length,
      characterCount: data.characters.length,
      elementCount: data.elements.length,
      updatedAt: new Date()
    };
    
    this.saveBookCollection(collection);
  }

  /**
   * Update book statistics for a specific book
   */
  static updateBookStatistics(bookId: string, data: StoryData): void {
    this.updateBookStats(bookId, data);
  }

  /**
   * Export book data
   */
  static exportBook(bookId: string): string | null {
    const bookData = this.getBookData(bookId);
    if (!bookData) return null;
    
    const collection = this.getBookCollection();
    const book = collection.books.find(b => b.id === bookId);
    
    return JSON.stringify({
      book: book,
      data: bookData
    }, null, 2);
  }

  /**
   * Import book data
   */
  static importBook(importData: string): Book | null {
    try {
      const parsed = JSON.parse(importData);
      const { book, data } = parsed;
      
      if (!book || !data) return null;
      
      // Create new book with imported data
      const newBook = this.createBook(book.title, book.description);
      
      // Save imported data
      this.saveBookData(newBook.id, data);
      
      // Set as active book
      this.setActiveBook(newBook.id);
      
      return newBook;
    } catch (error) {
      console.error('Error importing book:', error);
      return null;
    }
  }
} 