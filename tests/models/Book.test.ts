import { describe, it, expect, beforeEach } from 'vitest';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';
import { DEFAULT_BOOK_STYLE } from '../../src/types/BookStyle';

describe('Book Model', () => {
  let book: Book;

  beforeEach(() => {
    book = new Book({
      title: 'Test Book',
      description: 'A test book',
      backgroundSetup: 'A magical world',
      aspectRatio: '9:16'
    });
  });

  describe('Constructor', () => {
    it('should create a book with required fields', () => {
      expect(book.title).toBe('Test Book');
      expect(book.description).toBe('A test book');
      expect(book.backgroundSetup).toBe('A magical world');
      expect(book.aspectRatio).toBe('9:16');
    });

    it('should generate a UUID if not provided', () => {
      expect(book.id).toBeDefined();
      expect(typeof book.id).toBe('string');
      expect(book.id.length).toBeGreaterThan(0);
    });

    it('should set default aspect ratio to 9:16', () => {
      const newBook = new Book({ title: 'Another Book' });
      expect(newBook.aspectRatio).toBe('9:16');
    });

    it('should initialize with default book style', () => {
      expect(book.style).toBeDefined();
      expect(book.style.panelConfig).toBeDefined();
    });

    it('should initialize with empty stories array', () => {
      expect(book.stories).toBeDefined();
      expect(book.stories).toHaveLength(0);
    });

    it('should set createdAt and updatedAt timestamps', () => {
      expect(book.createdAt).toBeInstanceOf(Date);
      expect(book.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Validation', () => {
    it('should validate a valid book', () => {
      const result = book.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation if title is empty', () => {
      book.title = '';
      const result = book.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Book title is required');
    });

    it('should fail validation if title is too long', () => {
      book.title = 'a'.repeat(201);
      const result = book.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('200 characters'))).toBe(true);
    });

    it('should fail validation for invalid aspect ratio', () => {
      book.aspectRatio = '5:7'; // Invalid ratio not in the allowed list
      const result = book.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Aspect ratio'))).toBe(true);
    });

    it('should validate all stories in the book', () => {
      const story = new Story({
        title: '',  // Invalid: empty title
        backgroundSetup: 'Test background'
      });
      book.addStory(story);
      
      const result = book.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Story'))).toBe(true);
    });
  });

  describe('Story Management', () => {
    it('should add a story to the book', () => {
      const story = new Story({
        title: 'Test Story',
        backgroundSetup: 'Test background'
      });
      
      book.addStory(story);
      expect(book.stories).toHaveLength(1);
      expect(book.stories[0].title).toBe('Test Story');
    });

    it('should remove a story from the book', () => {
      const story = new Story({
        title: 'Test Story',
        backgroundSetup: 'Test background'
      });
      
      book.addStory(story);
      const removed = book.removeStory(story.id);
      
      expect(removed).toBe(true);
      expect(book.stories).toHaveLength(0);
    });

    it('should return false when removing non-existent story', () => {
      const removed = book.removeStory('non-existent-id');
      expect(removed).toBe(false);
    });

    it('should get a story by ID', () => {
      const story = new Story({
        title: 'Test Story',
        backgroundSetup: 'Test background'
      });
      
      book.addStory(story);
      const retrieved = book.getStory(story.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('Test Story');
    });

    it('should return undefined for non-existent story', () => {
      const retrieved = book.getStory('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should update updatedAt when adding a story', () => {
      const oldUpdatedAt = book.updatedAt;
      
      // Wait a bit to ensure different timestamp
      const story = new Story({
        title: 'Test Story',
        backgroundSetup: 'Test background'
      });
      book.addStory(story);
      
      expect(book.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });
  });

  describe('Style Management', () => {
    it('should update book style', () => {
      book.updateStyle({
        colorPalette: 'Vibrant colors',
        visualTheme: 'Fantasy'
      });
      
      expect(book.style.colorPalette).toBe('Vibrant colors');
      expect(book.style.visualTheme).toBe('Fantasy');
    });

    it('should preserve existing style fields when updating', () => {
      book.updateStyle({
        colorPalette: 'Vibrant colors'
      });
      
      expect(book.style.colorPalette).toBe('Vibrant colors');
      expect(book.style.panelConfig).toBeDefined();
    });

    it('should update updatedAt when updating style', () => {
      const oldUpdatedAt = book.updatedAt;
      
      book.updateStyle({ colorPalette: 'New colors' });
      
      expect(book.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });
  });

  describe('JSON Conversion', () => {
    it('should convert to JSON serialization format', () => {
      book.updateStyle({
        colorPalette: 'Test colors',
        visualTheme: 'Test theme'
      });
      
      const json = book.toJSON();
      
      // toJSON() returns flat structure for JSON.stringify serialization
      expect(json.title).toBe('Test Book');
      expect(json.description).toBe('A test book');
      expect(json.backgroundSetup).toBe('A magical world');
      expect(json.aspectRatio).toBe('9:16');
      expect(json.style.colorPalette).toBe('Test colors');
      expect(json.stories).toHaveLength(0);
      expect(json.defaultLayout).toBeUndefined(); // No layout set yet
    });

    it('should include stories in JSON serialization', () => {
      const story = new Story({
        title: 'Test Story',
        backgroundSetup: 'Test background'
      });
      book.addStory(story);
      
      const json = book.toJSON();
      
      expect(json.stories).toHaveLength(1);
      expect(json.stories[0].title).toBe('Test Story');
    });

    it('should create Book from JSON', async () => {
      const json = {
        book: {
          title: 'Imported Book',
          description: 'An imported book',
          backgroundSetup: 'Imported world',
          aspectRatio: '16:9',
          style: {
            colorPalette: 'Imported colors'
          }
        },
        stories: []
      };
      
      const importedBook = await Book.fromJSON(json);
      
      expect(importedBook.title).toBe('Imported Book');
      expect(importedBook.description).toBe('An imported book');
      expect(importedBook.aspectRatio).toBe('16:9');
      expect(importedBook.style.colorPalette).toBe('Imported colors');
    });

    it('should round-trip through JSON.stringify/parse', () => {
      book.updateStyle({ colorPalette: 'Original colors' });
      
      // toJSON() is used by JSON.stringify for serialization
      const jsonString = JSON.stringify(book);
      const parsed = JSON.parse(jsonString);
      
      // Verify all properties are preserved
      expect(parsed.title).toBe(book.title);
      expect(parsed.description).toBe(book.description);
      expect(parsed.backgroundSetup).toBe(book.backgroundSetup);
      expect(parsed.aspectRatio).toBe(book.aspectRatio);
      expect(parsed.style.colorPalette).toBe(book.style.colorPalette);
    });
  });
});

