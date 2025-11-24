import { describe, it, expect } from 'vitest';
import { LayoutResolver } from '../../src/services/LayoutResolver';
import type { Scene, Story, SceneLayout } from '../../src/types/Story';
import type { Book } from '../../src/types/Book';

// Helper to create a mock layout
const createMockLayout = (type: string): SceneLayout => ({
  type: type as any,
  canvas: {
    width: 1080,
    height: 1440,
    aspectRatio: '3:4'
  },
  elements: {
    image: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 }
  }
});

// Helper to create a mock scene
const createMockScene = (id: string, title: string, layout?: SceneLayout): Scene => ({
  id,
  title,
  description: 'Test scene',
  characters: [],
  elements: [],
  layout,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Helper to create a mock story
const createMockStory = (id: string, title: string, layout?: SceneLayout): Story => ({
  id,
  title,
  backgroundSetup: 'Test story',
  characters: [],
  elements: [],
  scenes: [],
  layout,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Helper to create a mock book
const createMockBook = (id: string, title: string, defaultLayout?: SceneLayout): Book => ({
  id,
  title,
  defaultLayout: defaultLayout as any,
  createdAt: new Date(),
  updatedAt: new Date()
});

describe('LayoutResolver', () => {
  describe('resolveLayout', () => {
    it('should return scene layout when scene has its own layout', () => {
      const sceneLayout = createMockLayout('scene-layout');
      const storyLayout = createMockLayout('story-layout');
      const bookLayout = createMockLayout('book-layout');
      
      const scene = createMockScene('s1', 'Scene 1', sceneLayout);
      const story = createMockStory('st1', 'Story 1', storyLayout);
      const book = createMockBook('b1', 'Book 1', bookLayout);
      
      const result = LayoutResolver.resolveLayout(scene, story, book);
      
      expect(result).toBe(sceneLayout);
      expect(result?.type).toBe('scene-layout');
    });

    it('should return story layout when scene has no layout but story does', () => {
      const storyLayout = createMockLayout('story-layout');
      const bookLayout = createMockLayout('book-layout');
      
      const scene = createMockScene('s1', 'Scene 1'); // No layout
      const story = createMockStory('st1', 'Story 1', storyLayout);
      const book = createMockBook('b1', 'Book 1', bookLayout);
      
      const result = LayoutResolver.resolveLayout(scene, story, book);
      
      expect(result).toBe(storyLayout);
      expect(result?.type).toBe('story-layout');
    });

    it('should return book layout when neither scene nor story has layout', () => {
      const bookLayout = createMockLayout('book-layout');
      
      const scene = createMockScene('s1', 'Scene 1'); // No layout
      const story = createMockStory('st1', 'Story 1'); // No layout
      const book = createMockBook('b1', 'Book 1', bookLayout);
      
      const result = LayoutResolver.resolveLayout(scene, story, book);
      
      expect(result).toBe(bookLayout);
      expect(result?.type).toBe('book-layout');
    });

    it('should return undefined when no layouts are defined at any level', () => {
      const scene = createMockScene('s1', 'Scene 1'); // No layout
      const story = createMockStory('st1', 'Story 1'); // No layout
      const book = createMockBook('b1', 'Book 1'); // No layout
      
      const result = LayoutResolver.resolveLayout(scene, story, book);
      
      expect(result).toBeUndefined();
    });

    it('should handle null story gracefully', () => {
      const bookLayout = createMockLayout('book-layout');
      const scene = createMockScene('s1', 'Scene 1');
      const book = createMockBook('b1', 'Book 1', bookLayout);
      
      const result = LayoutResolver.resolveLayout(scene, null, book);
      
      expect(result).toBe(bookLayout);
    });

    it('should handle null book gracefully', () => {
      const storyLayout = createMockLayout('story-layout');
      const scene = createMockScene('s1', 'Scene 1');
      const story = createMockStory('st1', 'Story 1', storyLayout);
      
      const result = LayoutResolver.resolveLayout(scene, story, null);
      
      expect(result).toBe(storyLayout);
    });

    it('should handle null story and book gracefully', () => {
      const scene = createMockScene('s1', 'Scene 1');
      
      const result = LayoutResolver.resolveLayout(scene, null, null);
      
      expect(result).toBeUndefined();
    });

    it('should prioritize scene layout over story and book', () => {
      const sceneLayout = createMockLayout('scene-layout');
      const storyLayout = createMockLayout('story-layout');
      const bookLayout = createMockLayout('book-layout');
      
      const scene = createMockScene('s1', 'Scene 1', sceneLayout);
      const story = createMockStory('st1', 'Story 1', storyLayout);
      const book = createMockBook('b1', 'Book 1', bookLayout);
      
      const result = LayoutResolver.resolveLayout(scene, story, book);
      
      expect(result?.type).toBe('scene-layout');
    });

    it('should prioritize story layout over book', () => {
      const storyLayout = createMockLayout('story-layout');
      const bookLayout = createMockLayout('book-layout');
      
      const scene = createMockScene('s1', 'Scene 1');
      const story = createMockStory('st1', 'Story 1', storyLayout);
      const book = createMockBook('b1', 'Book 1', bookLayout);
      
      const result = LayoutResolver.resolveLayout(scene, story, book);
      
      expect(result?.type).toBe('story-layout');
    });
  });

  describe('getLayoutSource', () => {
    it('should return "scene" when scene has layout', () => {
      const scene = createMockScene('s1', 'Scene 1', createMockLayout('scene'));
      const story = createMockStory('st1', 'Story 1', createMockLayout('story'));
      const book = createMockBook('b1', 'Book 1', createMockLayout('book'));
      
      const source = LayoutResolver.getLayoutSource(scene, story, book);
      
      expect(source).toBe('scene');
    });

    it('should return "story" when only story has layout', () => {
      const scene = createMockScene('s1', 'Scene 1');
      const story = createMockStory('st1', 'Story 1', createMockLayout('story'));
      const book = createMockBook('b1', 'Book 1', createMockLayout('book'));
      
      const source = LayoutResolver.getLayoutSource(scene, story, book);
      
      expect(source).toBe('story');
    });

    it('should return "book" when only book has layout', () => {
      const scene = createMockScene('s1', 'Scene 1');
      const story = createMockStory('st1', 'Story 1');
      const book = createMockBook('b1', 'Book 1', createMockLayout('book'));
      
      const source = LayoutResolver.getLayoutSource(scene, story, book);
      
      expect(source).toBe('book');
    });

    it('should return "default" when no layouts are defined', () => {
      const scene = createMockScene('s1', 'Scene 1');
      const story = createMockStory('st1', 'Story 1');
      const book = createMockBook('b1', 'Book 1');
      
      const source = LayoutResolver.getLayoutSource(scene, story, book);
      
      expect(source).toBe('default');
    });
  });

  describe('getLayoutSourceDescription', () => {
    it('should return scene description when scene has layout', () => {
      const scene = createMockScene('s1', 'Scene 1', createMockLayout('scene'));
      const story = createMockStory('st1', 'Story 1');
      const book = createMockBook('b1', 'Book 1');
      
      const description = LayoutResolver.getLayoutSourceDescription(scene, story, book);
      
      expect(description).toBe('Scene-specific layout');
    });

    it('should return story description with story title', () => {
      const scene = createMockScene('s1', 'Scene 1');
      const story = createMockStory('st1', 'My Story', createMockLayout('story'));
      const book = createMockBook('b1', 'Book 1');
      
      const description = LayoutResolver.getLayoutSourceDescription(scene, story, book);
      
      expect(description).toBe('Story layout (My Story)');
    });

    it('should return book description with book title', () => {
      const scene = createMockScene('s1', 'Scene 1');
      const story = createMockStory('st1', 'Story 1');
      const book = createMockBook('b1', 'My Book', createMockLayout('book'));
      
      const description = LayoutResolver.getLayoutSourceDescription(scene, story, book);
      
      expect(description).toBe('Book default layout (My Book)');
    });

    it('should return default description when no layouts', () => {
      const scene = createMockScene('s1', 'Scene 1');
      const story = createMockStory('st1', 'Story 1');
      const book = createMockBook('b1', 'Book 1');
      
      const description = LayoutResolver.getLayoutSourceDescription(scene, story, book);
      
      expect(description).toBe('System default (overlay)');
    });
  });

  describe('hasOwnLayout', () => {
    it('should return true when scene has layout', () => {
      const scene = createMockScene('s1', 'Scene 1', createMockLayout('scene'));
      
      expect(LayoutResolver.hasOwnLayout(scene)).toBe(true);
    });

    it('should return false when scene has no layout', () => {
      const scene = createMockScene('s1', 'Scene 1');
      
      expect(LayoutResolver.hasOwnLayout(scene)).toBe(false);
    });
  });

  describe('storyHasLayout', () => {
    it('should return true when story has layout', () => {
      const story = createMockStory('st1', 'Story 1', createMockLayout('story'));
      
      expect(LayoutResolver.storyHasLayout(story)).toBe(true);
    });

    it('should return false when story has no layout', () => {
      const story = createMockStory('st1', 'Story 1');
      
      expect(LayoutResolver.storyHasLayout(story)).toBe(false);
    });

    it('should return false when story is null', () => {
      expect(LayoutResolver.storyHasLayout(null)).toBe(false);
    });
  });

  describe('bookHasDefaultLayout', () => {
    it('should return true when book has default layout', () => {
      const book = createMockBook('b1', 'Book 1', createMockLayout('book'));
      
      expect(LayoutResolver.bookHasDefaultLayout(book)).toBe(true);
    });

    it('should return false when book has no default layout', () => {
      const book = createMockBook('b1', 'Book 1');
      
      expect(LayoutResolver.bookHasDefaultLayout(book)).toBe(false);
    });

    it('should return false when book is null', () => {
      expect(LayoutResolver.bookHasDefaultLayout(null)).toBe(false);
    });
  });
});

