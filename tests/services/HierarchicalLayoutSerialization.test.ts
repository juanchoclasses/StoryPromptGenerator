import { describe, it, expect, beforeEach } from 'vitest';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';
import { Scene } from '../../src/models/Scene';
import type { SceneLayout } from '../../src/types/Story';

// Helper to create a mock layout
const createMockLayout = (type: string): SceneLayout => ({
  type: type as any,
  canvas: {
    width: 1080,
    height: 1440,
    aspectRatio: '3:4'
  },
  elements: {
    image: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
    textPanel: { x: 5, y: 78, width: 90, height: 17, zIndex: 2 }
  }
});

describe('Hierarchical Layout Serialization', () => {
  describe('Book with defaultLayout', () => {
    it('should serialize and deserialize book with defaultLayout', () => {
      const bookLayout = createMockLayout('book-default');
      const book = new Book({
        id: 'b1',
        title: 'Test Book',
        defaultLayout: bookLayout as any
      });

      // Serialize to JSON
      const json = JSON.stringify(book);
      const parsed = JSON.parse(json);

      // Verify defaultLayout is preserved
      expect(parsed.defaultLayout).toBeDefined();
      expect(parsed.defaultLayout.type).toBe('book-default');
      expect(parsed.defaultLayout.canvas.aspectRatio).toBe('3:4');
      expect(parsed.defaultLayout.elements.image).toBeDefined();
      expect(parsed.defaultLayout.elements.textPanel).toBeDefined();
    });

    it('should handle book without defaultLayout', () => {
      const book = new Book({
        id: 'b1',
        title: 'Test Book'
      });

      const json = JSON.stringify(book);
      const parsed = JSON.parse(json);

      // defaultLayout should be undefined or not present
      expect(parsed.defaultLayout).toBeUndefined();
    });

    it('should preserve defaultLayout through round-trip serialization', () => {
      const bookLayout = createMockLayout('book-default');
      const book = new Book({
        id: 'b1',
        title: 'Test Book',
        defaultLayout: bookLayout as any
      });

      // Round trip
      const json = JSON.stringify(book);
      const parsed = JSON.parse(json);
      const reconstructed = new Book(parsed);

      expect(reconstructed.defaultLayout).toBeDefined();
      expect((reconstructed.defaultLayout as any).type).toBe('book-default');
    });
  });

  describe('Story with layout', () => {
    it('should serialize and deserialize story with layout', () => {
      const storyLayout = createMockLayout('story-layout');
      const story = new Story({
        id: 's1',
        title: 'Test Story',
        backgroundSetup: 'Test',
        layout: storyLayout
      });

      const json = JSON.stringify(story);
      const parsed = JSON.parse(json);

      expect(parsed.layout).toBeDefined();
      expect(parsed.layout.type).toBe('story-layout');
      expect(parsed.layout.canvas.aspectRatio).toBe('3:4');
    });

    it('should handle story without layout', () => {
      const story = new Story({
        id: 's1',
        title: 'Test Story',
        backgroundSetup: 'Test'
      });

      const json = JSON.stringify(story);
      const parsed = JSON.parse(json);

      expect(parsed.layout).toBeUndefined();
    });

    it('should preserve story layout through round-trip serialization', () => {
      const storyLayout = createMockLayout('story-layout');
      const story = new Story({
        id: 's1',
        title: 'Test Story',
        backgroundSetup: 'Test',
        layout: storyLayout
      });

      const json = JSON.stringify(story);
      const parsed = JSON.parse(json);
      const reconstructed = new Story(parsed);

      expect(reconstructed.layout).toBeDefined();
      expect(reconstructed.layout?.type).toBe('story-layout');
    });
  });

  describe('Scene with layout (existing)', () => {
    it('should continue to serialize and deserialize scene with layout', () => {
      const sceneLayout = createMockLayout('scene-layout');
      const scene = new Scene({
        id: 'sc1',
        title: 'Test Scene',
        description: 'Test',
        layout: sceneLayout
      });

      const json = JSON.stringify(scene);
      const parsed = JSON.parse(json);

      expect(parsed.layout).toBeDefined();
      expect(parsed.layout.type).toBe('scene-layout');
    });
  });

  describe('Full hierarchy serialization', () => {
    it('should serialize book with all three layout levels', () => {
      const bookLayout = createMockLayout('book-default');
      const storyLayout = createMockLayout('story-layout');
      const sceneLayout = createMockLayout('scene-layout');

      const scene = new Scene({
        id: 'sc1',
        title: 'Test Scene',
        description: 'Test',
        layout: sceneLayout
      });

      const story = new Story({
        id: 's1',
        title: 'Test Story',
        backgroundSetup: 'Test',
        layout: storyLayout,
        scenes: [scene]
      });

      const book = new Book({
        id: 'b1',
        title: 'Test Book',
        defaultLayout: bookLayout as any,
        stories: [story]
      });

      const json = JSON.stringify(book);
      const parsed = JSON.parse(json);

      // Verify all three levels are preserved
      expect(parsed.defaultLayout.type).toBe('book-default');
      expect(parsed.stories[0].layout.type).toBe('story-layout');
      expect(parsed.stories[0].scenes[0].layout.type).toBe('scene-layout');
    });

    it('should handle mixed presence of layouts', () => {
      const storyLayout = createMockLayout('story-layout');

      const sceneWithLayout = new Scene({
        id: 'sc1',
        title: 'Scene With Layout',
        description: 'Test',
        layout: createMockLayout('scene-layout')
      });

      const sceneWithoutLayout = new Scene({
        id: 'sc2',
        title: 'Scene Without Layout',
        description: 'Test'
      });

      const story = new Story({
        id: 's1',
        title: 'Test Story',
        backgroundSetup: 'Test',
        layout: storyLayout,
        scenes: [sceneWithLayout, sceneWithoutLayout]
      });

      const book = new Book({
        id: 'b1',
        title: 'Test Book',
        // No defaultLayout
        stories: [story]
      });

      const json = JSON.stringify(book);
      const parsed = JSON.parse(json);

      expect(parsed.defaultLayout).toBeUndefined();
      expect(parsed.stories[0].layout.type).toBe('story-layout');
      expect(parsed.stories[0].scenes[0].layout.type).toBe('scene-layout');
      expect(parsed.stories[0].scenes[1].layout).toBeUndefined();
    });
  });

  describe('Backward compatibility', () => {
    it('should handle old books without defaultLayout field', () => {
      const oldBookData = {
        id: 'b1',
        title: 'Old Book',
        stories: [],
        createdAt: new Date(),
        updatedAt: new Date()
        // No defaultLayout field
      };

      const book = new Book(oldBookData);
      expect(book.defaultLayout).toBeUndefined();
    });

    it('should handle old stories without layout field', () => {
      const oldStoryData = {
        id: 's1',
        title: 'Old Story',
        backgroundSetup: 'Test',
        scenes: [],
        characters: [],
        elements: [],
        createdAt: new Date(),
        updatedAt: new Date()
        // No layout field
      };

      const story = new Story(oldStoryData);
      expect(story.layout).toBeUndefined();
    });

    it('should not break existing scene layouts', () => {
      const sceneLayout = createMockLayout('scene-layout');
      const oldSceneData = {
        id: 'sc1',
        title: 'Old Scene',
        description: 'Test',
        layout: sceneLayout,
        characters: [],
        elements: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const scene = new Scene(oldSceneData);
      expect(scene.layout).toBeDefined();
      expect(scene.layout?.type).toBe('scene-layout');
    });
  });
});

