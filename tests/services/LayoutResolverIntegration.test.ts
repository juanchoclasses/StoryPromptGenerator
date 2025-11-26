import { describe, it, expect } from 'vitest';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';
import { Scene } from '../../src/models/Scene';
import { LayoutResolver } from '../../src/services/LayoutResolver';
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
    image: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 }
  }
});

describe('LayoutResolver Integration Tests', () => {
  describe('Real-world scenario: Book with multiple stories and scenes', () => {
    it('should resolve layouts correctly in a complex book structure', () => {
      // Create a book with default layout
      const bookLayout = createMockLayout('book-default');
      const book = new Book({
        id: 'b1',
        title: 'My Book',
        defaultLayout: bookLayout as any
      });

      // Story 1: Has its own layout
      const story1Layout = createMockLayout('story1-layout');
      const story1 = new Story({
        id: 's1',
        title: 'Story 1',
        backgroundSetup: 'Test',
        layout: story1Layout
      });

      // Scene 1.1: Uses story layout (no scene layout)
      const scene1_1 = new Scene({
        id: 'sc1_1',
        title: 'Scene 1.1',
        description: 'Test'
      });

      // Scene 1.2: Has its own layout (overrides story)
      const scene1_2Layout = createMockLayout('scene1_2-layout');
      const scene1_2 = new Scene({
        id: 'sc1_2',
        title: 'Scene 1.2',
        description: 'Test',
        layout: scene1_2Layout
      });

      story1.scenes = [scene1_1, scene1_2];

      // Story 2: No story layout (will use book default)
      const story2 = new Story({
        id: 's2',
        title: 'Story 2',
        backgroundSetup: 'Test'
      });

      // Scene 2.1: Uses book layout (no scene or story layout)
      const scene2_1 = new Scene({
        id: 'sc2_1',
        title: 'Scene 2.1',
        description: 'Test'
      });

      // Scene 2.2: Has its own layout (overrides book)
      const scene2_2Layout = createMockLayout('scene2_2-layout');
      const scene2_2 = new Scene({
        id: 'sc2_2',
        title: 'Scene 2.2',
        description: 'Test',
        layout: scene2_2Layout
      });

      story2.scenes = [scene2_1, scene2_2];

      book.stories = [story1, story2];

      // Test Scene 1.1: Should use story1 layout
      const layout1_1 = LayoutResolver.resolveLayout(scene1_1, story1, book);
      expect(layout1_1?.type).toBe('story1-layout');
      expect(LayoutResolver.getLayoutSource(scene1_1, story1, book)).toBe('story');

      // Test Scene 1.2: Should use scene1_2 layout (overrides story)
      const layout1_2 = LayoutResolver.resolveLayout(scene1_2, story1, book);
      expect(layout1_2?.type).toBe('scene1_2-layout');
      expect(LayoutResolver.getLayoutSource(scene1_2, story1, book)).toBe('scene');

      // Test Scene 2.1: Should use book layout (no story layout)
      const layout2_1 = LayoutResolver.resolveLayout(scene2_1, story2, book);
      expect(layout2_1?.type).toBe('book-default');
      expect(LayoutResolver.getLayoutSource(scene2_1, story2, book)).toBe('book');

      // Test Scene 2.2: Should use scene2_2 layout (overrides book)
      const layout2_2 = LayoutResolver.resolveLayout(scene2_2, story2, book);
      expect(layout2_2?.type).toBe('scene2_2-layout');
      expect(LayoutResolver.getLayoutSource(scene2_2, story2, book)).toBe('scene');
    });

    it('should handle book without default layout', () => {
      const book = new Book({
        id: 'b1',
        title: 'Book Without Layout'
      });

      const story = new Story({
        id: 's1',
        title: 'Story',
        backgroundSetup: 'Test'
      });

      const scene = new Scene({
        id: 'sc1',
        title: 'Scene',
        description: 'Test'
      });

      story.scenes = [scene];
      book.stories = [story];

      const layout = LayoutResolver.resolveLayout(scene, story, book);
      expect(layout).toBeUndefined();
      expect(LayoutResolver.getLayoutSource(scene, story, book)).toBe('default');
    });

    it('should work with serialization round-trip', () => {
      // Create a book with all three layout levels
      const bookLayout = createMockLayout('book-layout');
      const storyLayout = createMockLayout('story-layout');
      const sceneLayout = createMockLayout('scene-layout');

      const scene = new Scene({
        id: 'sc1',
        title: 'Scene',
        description: 'Test',
        layout: sceneLayout
      });

      const story = new Story({
        id: 's1',
        title: 'Story',
        backgroundSetup: 'Test',
        layout: storyLayout,
        scenes: [scene]
      });

      const book = new Book({
        id: 'b1',
        title: 'Book',
        defaultLayout: bookLayout as any,
        stories: [story]
      });

      // Serialize and deserialize
      const json = JSON.stringify(book);
      const parsed = JSON.parse(json);
      const reconstructedBook = new Book(parsed);

      // Reconstruct stories and scenes
      reconstructedBook.stories = parsed.stories.map((s: any) => {
        const story = new Story(s);
        story.scenes = s.scenes.map((sc: any) => new Scene(sc));
        return story;
      });

      // Test that layouts are preserved after round-trip
      const reconstructedScene = reconstructedBook.stories[0].scenes[0];
      const reconstructedStory = reconstructedBook.stories[0];

      const layout = LayoutResolver.resolveLayout(
        reconstructedScene,
        reconstructedStory,
        reconstructedBook
      );

      expect(layout?.type).toBe('scene-layout');
      expect(LayoutResolver.getLayoutSource(reconstructedScene, reconstructedStory, reconstructedBook)).toBe('scene');

      // Test story layout
      const sceneWithoutLayout = new Scene({
        id: 'sc2',
        title: 'Scene 2',
        description: 'Test'
      });
      reconstructedStory.scenes.push(sceneWithoutLayout);

      const storyLayoutResolved = LayoutResolver.resolveLayout(
        sceneWithoutLayout,
        reconstructedStory,
        reconstructedBook
      );

      expect(storyLayoutResolved?.type).toBe('story-layout');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty book (no stories)', () => {
      const bookLayout = createMockLayout('book-layout');
      const book = new Book({
        id: 'b1',
        title: 'Empty Book',
        defaultLayout: bookLayout as any
      });

      // No stories, so we test with null story
      const scene = new Scene({
        id: 'sc1',
        title: 'Orphan Scene',
        description: 'Test'
      });

      const layout = LayoutResolver.resolveLayout(scene, null, book);
      expect(layout?.type).toBe('book-layout');
    });

    it('should handle scene with undefined layout property', () => {
      const scene = new Scene({
        id: 'sc1',
        title: 'Scene',
        description: 'Test'
        // layout explicitly not set
      });

      const story = new Story({
        id: 's1',
        title: 'Story',
        backgroundSetup: 'Test'
      });

      const book = new Book({
        id: 'b1',
        title: 'Book'
      });

      expect(scene.layout).toBeUndefined();
      expect(story.layout).toBeUndefined();
      expect(book.defaultLayout).toBeUndefined();

      const layout = LayoutResolver.resolveLayout(scene, story, book);
      expect(layout).toBeUndefined();
    });
  });
});

