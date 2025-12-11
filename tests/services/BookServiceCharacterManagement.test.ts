/**
 * BookService Character Management Tests
 * 
 * Tests for character promotion/demotion between book and story levels.
 * These are complex operations that involve moving character metadata and images.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BookService } from '../../src/services/BookService';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';
import { Scene } from '../../src/models/Scene';
import { bookCache } from '../../src/services/BookCache';
import { ImageStorageService } from '../../src/services/ImageStorageService';

// Mock the FileSystemService
vi.mock('../../src/services/FileSystemService', () => ({
  FileSystemService: {
    isConfigured: vi.fn(() => Promise.resolve(true)),
    ensureDirectoryExists: vi.fn(() => Promise.resolve()),
    writeJSON: vi.fn(() => Promise.resolve()),
    readJSON: vi.fn(() => Promise.resolve(null)),
    deleteFile: vi.fn(() => Promise.resolve()),
    listFiles: vi.fn(() => Promise.resolve([])),
    loadAllBooksMetadata: vi.fn(() => Promise.resolve(new Map())),
    loadAppMetadata: vi.fn(() => Promise.resolve(null)),
    saveAppMetadata: vi.fn(() => Promise.resolve()),
    deleteBookMetadata: vi.fn(() => Promise.resolve()),
    fileExists: vi.fn(() => Promise.resolve(false)),
  }
}));

// Mock ImageStorageService
vi.mock('../../src/services/ImageStorageService', () => ({
  ImageStorageService: {
    getAllCharacterImages: vi.fn(() => Promise.resolve(new Map())),
    getAllBookCharacterImages: vi.fn(() => Promise.resolve(new Map())),
    storeBookCharacterImage: vi.fn(() => Promise.resolve()),
    storeCharacterImage: vi.fn(() => Promise.resolve()),
    deleteAllCharacterImages: vi.fn(() => Promise.resolve()),
    deleteAllBookCharacterImages: vi.fn(() => Promise.resolve()),
  }
}));

// Mock fetch for blob URL handling
global.fetch = vi.fn((url: string) => {
  const blob = new Blob(['test image data'], { type: 'image/png' });
  return Promise.resolve({
    blob: () => Promise.resolve(blob)
  } as Response);
}) as any;

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('BookService Character Management', () => {
  beforeEach(async () => {
    await bookCache.clear();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await bookCache.clear();
  });

  describe('promoteCharacterToBook()', () => {
    it('should promote character from story to book level', async () => {
      const book = await BookService.createBook('Test Book');
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      story.addCharacter({ name: 'Hero', description: 'Main character' });
      book.addStory(story);
      await BookService.saveBook(book);

      const result = await BookService.promoteCharacterToBook(book.id, story.id, 'Hero');

      expect(result.success).toBe(true);
      
      const updatedBook = await BookService.getBook(book.id);
      expect(updatedBook?.characters).toHaveLength(1);
      expect(updatedBook?.characters[0].name).toBe('Hero');
      expect(updatedBook?.stories[0].characters).toHaveLength(0);
    });

    it('should return error if book not found', async () => {
      const result = await BookService.promoteCharacterToBook(
        'non-existent-book',
        'story-id',
        'Hero'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Book not found');
    });

    it('should return error if story not found', async () => {
      const book = await BookService.createBook('Test Book');

      const result = await BookService.promoteCharacterToBook(
        book.id,
        'non-existent-story',
        'Hero'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Story not found');
    });

    it('should return error if character not found in story', async () => {
      const book = await BookService.createBook('Test Book');
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      book.addStory(story);
      await BookService.saveBook(book);

      const result = await BookService.promoteCharacterToBook(
        book.id,
        story.id,
        'NonExistent'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Character not found in story');
    });

    it('should return error if character already exists at book level', async () => {
      const book = await BookService.createBook('Test Book');
      book.addCharacter({ name: 'Hero', description: 'Book-level character' });
      
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      story.addCharacter({ name: 'Hero', description: 'Story-level character' });
      book.addStory(story);
      await BookService.saveBook(book);

      const result = await BookService.promoteCharacterToBook(book.id, story.id, 'Hero');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists at book level');
    });

    it('should move character images from story to book level', async () => {
      const book = await BookService.createBook('Test Book');
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      story.addCharacter({
        name: 'Hero',
        description: 'Main character',
        imageGallery: [
          { id: 'img-1', modelName: 'model-1', timestamp: new Date() },
          { id: 'img-2', modelName: 'model-2', timestamp: new Date() }
        ]
      });
      book.addStory(story);
      await BookService.saveBook(book);

      // Mock image storage to return some images
      vi.mocked(ImageStorageService.getAllCharacterImages).mockResolvedValue(
        new Map([
          ['img-1', 'blob:url-1'],
          ['img-2', 'blob:url-2']
        ])
      );

      await BookService.promoteCharacterToBook(book.id, story.id, 'Hero');

      // Verify images were stored at book level
      expect(ImageStorageService.storeBookCharacterImage).toHaveBeenCalledTimes(2);
      expect(ImageStorageService.storeBookCharacterImage).toHaveBeenCalledWith(
        book.id,
        'Hero',
        'img-1',
        expect.any(String),
        'unknown'
      );
      expect(ImageStorageService.storeBookCharacterImage).toHaveBeenCalledWith(
        book.id,
        'Hero',
        'img-2',
        expect.any(String),
        'unknown'
      );

      // Verify old images were deleted
      expect(ImageStorageService.deleteAllCharacterImages).toHaveBeenCalledWith(
        story.id,
        'Hero'
      );
    });

    it('should be case-insensitive when finding character', async () => {
      const book = await BookService.createBook('Test Book');
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      story.addCharacter({ name: 'Hero', description: 'Main character' });
      book.addStory(story);
      await BookService.saveBook(book);

      const result = await BookService.promoteCharacterToBook(book.id, story.id, 'hero');

      expect(result.success).toBe(true);
    });
  });

  describe('demoteCharacterToStory()', () => {
    it('should demote character from book to story level (used in 1 story)', async () => {
      const book = await BookService.createBook('Test Book');
      book.addCharacter({ name: 'Hero', description: 'Book-level character' });
      
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      const scene = new Scene({
        title: 'Scene 1',
        textPanel: 'Text',
        characters: ['Hero']
      });
      story.scenes = [scene];
      book.addStory(story);
      await BookService.saveBook(book);

      const result = await BookService.demoteCharacterToStory(book.id, 'Hero');

      expect(result.success).toBe(true);
      
      const updatedBook = await BookService.getBook(book.id);
      expect(updatedBook?.characters).toHaveLength(0);
      expect(updatedBook?.stories[0].characters).toHaveLength(1);
      expect(updatedBook?.stories[0].characters[0].name).toBe('Hero');
    });

    it('should demote character to specified story (used in 0 stories)', async () => {
      const book = await BookService.createBook('Test Book');
      book.addCharacter({ name: 'Hero', description: 'Unused character' });
      
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      book.addStory(story);
      await BookService.saveBook(book);

      const result = await BookService.demoteCharacterToStory(book.id, 'Hero', story.id);

      expect(result.success).toBe(true);
      
      const updatedBook = await BookService.getBook(book.id);
      expect(updatedBook?.characters).toHaveLength(0);
      expect(updatedBook?.stories[0].characters).toHaveLength(1);
    });

    it('should return error if book not found', async () => {
      const result = await BookService.demoteCharacterToStory('non-existent', 'Hero');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Book not found');
    });

    it('should return error if character not found at book level', async () => {
      const book = await BookService.createBook('Test Book');

      const result = await BookService.demoteCharacterToStory(book.id, 'NonExistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Character not found at book level');
    });

    it('should block demotion if character used in 2+ stories', async () => {
      const book = await BookService.createBook('Test Book');
      book.addCharacter({ name: 'Hero', description: 'Popular character' });
      
      const story1 = new Story({ title: 'Story 1', backgroundSetup: 'Setup' });
      const scene1 = new Scene({ title: 'Scene 1', textPanel: 'Text', characters: ['Hero'] });
      story1.scenes = [scene1];
      
      const story2 = new Story({ title: 'Story 2', backgroundSetup: 'Setup' });
      const scene2 = new Scene({ title: 'Scene 2', textPanel: 'Text', characters: ['Hero'] });
      story2.scenes = [scene2];
      
      book.addStory(story1);
      book.addStory(story2);
      await BookService.saveBook(book);

      const result = await BookService.demoteCharacterToStory(book.id, 'Hero');

      expect(result.success).toBe(false);
      expect(result.error).toContain('used in 2 stories');
      expect(result.storiesUsing).toHaveLength(2);
    });

    it('should require target story if character not used anywhere', async () => {
      const book = await BookService.createBook('Test Book');
      book.addCharacter({ name: 'Hero', description: 'Unused character' });
      await BookService.saveBook(book);

      const result = await BookService.demoteCharacterToStory(book.id, 'Hero');

      expect(result.success).toBe(false);
      expect(result.error).toContain('specify a target story');
    });

    it('should return error if target story not found', async () => {
      const book = await BookService.createBook('Test Book');
      book.addCharacter({ name: 'Hero', description: 'Character' });
      await BookService.saveBook(book);

      const result = await BookService.demoteCharacterToStory(
        book.id,
        'Hero',
        'non-existent-story'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target story not found');
    });

    it('should return error if target story already has character with same name', async () => {
      const book = await BookService.createBook('Test Book');
      book.addCharacter({ name: 'Hero', description: 'Book-level character' });
      
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      story.addCharacter({ name: 'Hero', description: 'Story-level character' });
      book.addStory(story);
      await BookService.saveBook(book);

      const result = await BookService.demoteCharacterToStory(book.id, 'Hero', story.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already has a character named');
    });

    it('should move character images from book to story level', async () => {
      const book = await BookService.createBook('Test Book');
      book.addCharacter({ name: 'Hero', description: 'Character' });
      
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      book.addStory(story);
      await BookService.saveBook(book);

      // Mock image storage to return some images
      vi.mocked(ImageStorageService.getAllBookCharacterImages).mockResolvedValue(
        new Map([
          ['img-1', 'blob:url-1'],
          ['img-2', 'blob:url-2']
        ])
      );

      await BookService.demoteCharacterToStory(book.id, 'Hero', story.id);

      // Verify images were stored at story level
      expect(ImageStorageService.storeCharacterImage).toHaveBeenCalledTimes(2);
      expect(ImageStorageService.storeCharacterImage).toHaveBeenCalledWith(
        story.id,
        'Hero',
        'img-1',
        expect.any(String),
        'unknown'
      );

      // Verify old images were deleted
      expect(ImageStorageService.deleteAllBookCharacterImages).toHaveBeenCalledWith(
        book.id,
        'Hero'
      );
    });

    it('should be case-insensitive when finding character', async () => {
      const book = await BookService.createBook('Test Book');
      book.addCharacter({ name: 'Hero', description: 'Character' });
      
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      book.addStory(story);
      await BookService.saveBook(book);

      const result = await BookService.demoteCharacterToStory(book.id, 'hero', story.id);

      expect(result.success).toBe(true);
    });
  });

  describe('Character Promotion/Demotion Integration', () => {
    it('should allow promoting then demoting a character', async () => {
      const book = await BookService.createBook('Test Book');
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      story.addCharacter({ name: 'Hero', description: 'Main character' });
      book.addStory(story);
      await BookService.saveBook(book);

      // Promote to book level
      const promoteResult = await BookService.promoteCharacterToBook(
        book.id,
        story.id,
        'Hero'
      );
      expect(promoteResult.success).toBe(true);

      // Demote back to story level
      const demoteResult = await BookService.demoteCharacterToStory(
        book.id,
        'Hero',
        story.id
      );
      expect(demoteResult.success).toBe(true);

      // Verify final state
      const finalBook = await BookService.getBook(book.id);
      expect(finalBook?.characters).toHaveLength(0);
      expect(finalBook?.stories[0].characters).toHaveLength(1);
    });

    it('should prevent duplicate character after failed promotion', async () => {
      const book = await BookService.createBook('Test Book');
      book.addCharacter({ name: 'Hero', description: 'Book-level' });
      
      const story = new Story({ title: 'Test Story', backgroundSetup: 'Setup' });
      story.addCharacter({ name: 'Hero', description: 'Story-level' });
      book.addStory(story);
      await BookService.saveBook(book);

      // Try to promote (should fail)
      const result = await BookService.promoteCharacterToBook(book.id, story.id, 'Hero');
      expect(result.success).toBe(false);

      // Verify nothing changed
      const unchangedBook = await BookService.getBook(book.id);
      expect(unchangedBook?.characters).toHaveLength(1);
      expect(unchangedBook?.stories[0].characters).toHaveLength(1);
    });
  });
});




