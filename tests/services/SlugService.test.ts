/**
 * SlugService Tests
 * 
 * Tests for the SlugService class which generates filesystem-safe slugs from titles.
 */

import { describe, it, expect } from 'vitest';
import { SlugService } from '../../src/services/SlugService';

describe('SlugService', () => {
  describe('generateSlug', () => {
    it('should convert basic title to lowercase with hyphens', () => {
      const slug = SlugService.generateSlug('My Story Title');
      expect(slug).toBe('my-story-title');
    });

    it('should remove special characters', () => {
      const slug = SlugService.generateSlug('Hello!!! World???');
      expect(slug).toBe('hello-world');
    });

    it('should replace multiple spaces with single hyphens', () => {
      const slug = SlugService.generateSlug('  Multiple   Spaces  ');
      expect(slug).toBe('multiple-spaces');
    });

    it('should collapse multiple hyphens into one', () => {
      const slug = SlugService.generateSlug('Title---With---Hyphens');
      expect(slug).toBe('title-with-hyphens');
    });

    it('should remove leading and trailing hyphens', () => {
      const slug = SlugService.generateSlug('-Title-');
      expect(slug).toBe('title');
    });

    it('should limit slug to 50 characters', () => {
      const longTitle = 'This is a very long title that should be truncated to fifty characters maximum';
      const slug = SlugService.generateSlug(longTitle);
      
      expect(slug.length).toBeLessThanOrEqual(50);
      // "this-is-a-very-long-title-that-should-be-truncated" is exactly 50 chars
      expect(slug).toBe('this-is-a-very-long-title-that-should-be-truncated');
    });

    it('should handle empty string with fallback', () => {
      const slug = SlugService.generateSlug('', 'book');
      
      expect(slug).toMatch(/^book-[a-f0-9]{8}$/);
    });

    it('should handle whitespace-only string with fallback', () => {
      const slug = SlugService.generateSlug('   ', 'story');
      
      expect(slug).toMatch(/^story-[a-f0-9]{8}$/);
    });

    it('should handle title with only special characters', () => {
      const slug = SlugService.generateSlug('!@#$%^&*()', 'book');
      
      expect(slug).toMatch(/^book-[a-f0-9]{8}$/);
    });

    it('should use default fallback prefix when not specified', () => {
      const slug = SlugService.generateSlug('');
      
      expect(slug).toMatch(/^item-[a-f0-9]{8}$/);
    });

    it('should handle mixed case and numbers', () => {
      const slug = SlugService.generateSlug('Chapter 123 ABC');
      expect(slug).toBe('chapter-123-abc');
    });

    it('should handle unicode characters by removing them', () => {
      const slug = SlugService.generateSlug('Hello 世界 World');
      expect(slug).toBe('hello-world');
    });
  });

  describe('generateUniqueSlug', () => {
    it('should return base slug when no conflicts exist', () => {
      const existingSlugs = new Set(['other-story', 'another-story']);
      const slug = SlugService.generateUniqueSlug('new-story', existingSlugs);
      
      expect(slug).toBe('new-story');
    });

    it('should append -1 when base slug conflicts', () => {
      const existingSlugs = new Set(['story']);
      const slug = SlugService.generateUniqueSlug('story', existingSlugs);
      
      expect(slug).toBe('story-1');
    });

    it('should append -2 when story and story-1 exist', () => {
      const existingSlugs = new Set(['story', 'story-1']);
      const slug = SlugService.generateUniqueSlug('story', existingSlugs);
      
      expect(slug).toBe('story-2');
    });

    it('should find next available number in sequence', () => {
      const existingSlugs = new Set(['story', 'story-1', 'story-2', 'story-3']);
      const slug = SlugService.generateUniqueSlug('story', existingSlugs);
      
      expect(slug).toBe('story-4');
    });

    it('should handle empty set of existing slugs', () => {
      const existingSlugs = new Set<string>();
      const slug = SlugService.generateUniqueSlug('story', existingSlugs);
      
      expect(slug).toBe('story');
    });

    it('should handle slug that already has a number', () => {
      const existingSlugs = new Set(['story-1']);
      const slug = SlugService.generateUniqueSlug('story-1', existingSlugs);
      
      expect(slug).toBe('story-1-1');
    });
  });

  describe('Integration scenarios', () => {
    it('should generate unique slugs for multiple stories with same title', () => {
      const existingSlugs = new Set<string>();
      const title = 'My Story';
      
      const slug1 = SlugService.generateSlug(title);
      existingSlugs.add(slug1);
      
      const slug2 = SlugService.generateUniqueSlug(
        SlugService.generateSlug(title),
        existingSlugs
      );
      existingSlugs.add(slug2);
      
      const slug3 = SlugService.generateUniqueSlug(
        SlugService.generateSlug(title),
        existingSlugs
      );
      
      expect(slug1).toBe('my-story');
      expect(slug2).toBe('my-story-1');
      expect(slug3).toBe('my-story-2');
    });

    it('should handle book and story slug generation workflow', () => {
      // Simulate creating a book
      const bookSlug = SlugService.generateSlug('My Book', 'book');
      expect(bookSlug).toBe('my-book');
      
      // Simulate creating stories within the book
      const storySlugs = new Set<string>();
      
      const story1 = SlugService.generateUniqueSlug(
        SlugService.generateSlug('Chapter 1', 'story'),
        storySlugs
      );
      storySlugs.add(story1);
      
      const story2 = SlugService.generateUniqueSlug(
        SlugService.generateSlug('Chapter 2', 'story'),
        storySlugs
      );
      storySlugs.add(story2);
      
      expect(story1).toBe('chapter-1');
      expect(story2).toBe('chapter-2');
      expect(storySlugs.size).toBe(2);
    });
  });
});
