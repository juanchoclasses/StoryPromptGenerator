import { describe, it, expect, beforeEach } from 'vitest';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';
import { Scene } from '../../src/models/Scene';
import type { SceneLayout } from '../../src/types/Story';

/**
 * Serialization/Deserialization Tests
 * 
 * These tests ensure that when we save and load a Book, ALL properties are preserved.
 * This prevents bugs like the layout persistence issue where properties were lost during save/load cycles.
 */

describe('Book Serialization', () => {
  let testBook: Book;
  let testStory: Story;
  let testScene: Scene;
  let testLayout: SceneLayout;

  beforeEach(() => {
    // Create a test layout
    testLayout = {
      type: 'overlay',
      canvas: {
        width: 1080,
        height: 1440,
        aspectRatio: '3:4'
      },
      elements: {
        image: {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
          aspectRatio: '16:9' // Test optional aspectRatio
        },
        textPanel: {
          x: 5,
          y: 78,
          width: 90,
          height: 17,
          zIndex: 2
        },
        diagramPanel: {
          x: 5,
          y: 5,
          width: 60,
          height: 40,
          zIndex: 3
        }
      }
    };

    // Create a test scene with all possible properties
    testScene = new Scene({
      title: 'Test Scene',
      description: 'Test scene description',
      textPanel: 'Test text panel content',
      diagramPanel: {
        type: 'markdown',
        content: '# Test Diagram',
        language: 'markdown'
      },
      layout: testLayout,
      characters: ['Character 1', 'Character 2'],
      elements: ['Element 1', 'Element 2'],
      imageHistory: [
        {
          id: 'test-image-1',
          modelName: 'test-model',
          timestamp: new Date('2024-01-01')
        }
      ]
    });

    // Create a test story
    testStory = new Story({
      title: 'Test Story',
      description: 'Test story description',
      backgroundSetup: 'Test background',
      diagramStyle: {
        boardStyle: 'blackboard',
        fontFamily: 'Comic Sans MS',
        fontSize: 16,
        fontColor: '#ffffff',
        lineColor: '#ffffff',
        lineWidth: 2,
        backgroundColor: '#000000'
      },
      characters: [
        {
          name: 'Character 1',
          description: 'Character 1 description',
          imageGallery: [
            {
              id: 'char-img-1',
              url: '',
              model: 'test-model',
              prompt: 'test prompt',
              timestamp: new Date('2024-01-01')
            }
          ],
          selectedImageId: 'char-img-1'
        },
        {
          name: 'Character 2',
          description: 'Character 2 description'
        }
      ],
      elements: [
        {
          name: 'Element 1',
          description: 'Element 1 description',
          category: 'test-category'
        },
        {
          name: 'Element 2',
          description: 'Element 2 description'
        }
      ],
      scenes: [testScene]
    });

    // Create a test book
    testBook = new Book({
      title: 'Test Book',
      description: 'Test book description',
      backgroundSetup: 'Test book background',
      aspectRatio: '3:4',
      style: {
        colorPalette: 'Test palette',
        visualTheme: 'Test theme',
        characterStyle: 'Test character style',
        environmentStyle: 'Test environment style',
        artStyle: 'comic-book',
        panelConfig: {
          fontFamily: 'Arial',
          fontSize: 24,
          textAlign: 'center',
          widthPercentage: 90,
          heightPercentage: 15,
          autoHeight: false,
          position: 'bottom-center',
          backgroundColor: '#000000cc',
          fontColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 2,
          borderRadius: 8,
          padding: 20,
          gutterTop: 0,
          gutterBottom: 0,
          gutterLeft: 0,
          gutterRight: 0
        }
      },
      characters: [
        {
          name: 'Book Character',
          description: 'Book-level character',
          imageGallery: [],
          selectedImageId: undefined
        }
      ]
    });

    testBook.stories = [testStory];
  });

  describe('JSON.stringify/parse round-trip', () => {
    it('should preserve all Book properties', () => {
      // Serialize
      const json = JSON.stringify(testBook);
      const parsed = JSON.parse(json);

      // Verify top-level properties
      expect(parsed.id).toBe(testBook.id);
      expect(parsed.title).toBe(testBook.title);
      expect(parsed.description).toBe(testBook.description);
      expect(parsed.backgroundSetup).toBe(testBook.backgroundSetup);
      expect(parsed.aspectRatio).toBe(testBook.aspectRatio);
      expect(parsed.style).toBeDefined();
      expect(parsed.style.artStyle).toBe('comic-book');
      expect(parsed.characters).toHaveLength(1);
      expect(parsed.stories).toHaveLength(1);
    });

    it('should preserve all Story properties', () => {
      const json = JSON.stringify(testBook);
      const parsed = JSON.parse(json);
      const story = parsed.stories[0];

      expect(story.id).toBe(testStory.id);
      expect(story.title).toBe(testStory.title);
      expect(story.description).toBe(testStory.description);
      expect(story.backgroundSetup).toBe(testStory.backgroundSetup);
      expect(story.diagramStyle).toBeDefined();
      expect(story.diagramStyle.boardStyle).toBe('blackboard');
      expect(story.characters).toHaveLength(2);
      expect(story.elements).toHaveLength(2);
      expect(story.scenes).toHaveLength(1);
    });

    it('should preserve all Scene properties including layout', () => {
      const json = JSON.stringify(testBook);
      const parsed = JSON.parse(json);
      const scene = parsed.stories[0].scenes[0];

      expect(scene.id).toBe(testScene.id);
      expect(scene.title).toBe(testScene.title);
      expect(scene.description).toBe(testScene.description);
      expect(scene.textPanel).toBe(testScene.textPanel);
      expect(scene.diagramPanel).toBeDefined();
      expect(scene.diagramPanel.type).toBe('markdown');
      
      // CRITICAL: Verify layout is preserved
      expect(scene.layout).toBeDefined();
      expect(scene.layout.type).toBe('overlay');
      expect(scene.layout.canvas.aspectRatio).toBe('3:4');
      expect(scene.layout.elements.image.aspectRatio).toBe('16:9');
      
      expect(scene.characters).toEqual(['Character 1', 'Character 2']);
      expect(scene.elements).toEqual(['Element 1', 'Element 2']);
      expect(scene.imageHistory).toHaveLength(1);
    });

    it('should preserve nested layout structure completely', () => {
      const json = JSON.stringify(testBook);
      const parsed = JSON.parse(json);
      const layout = parsed.stories[0].scenes[0].layout;

      // Verify canvas
      expect(layout.canvas.width).toBe(1080);
      expect(layout.canvas.height).toBe(1440);
      expect(layout.canvas.aspectRatio).toBe('3:4');

      // Verify image element
      expect(layout.elements.image.x).toBe(0);
      expect(layout.elements.image.y).toBe(0);
      expect(layout.elements.image.width).toBe(100);
      expect(layout.elements.image.height).toBe(100);
      expect(layout.elements.image.zIndex).toBe(1);
      expect(layout.elements.image.aspectRatio).toBe('16:9');

      // Verify text panel
      expect(layout.elements.textPanel).toBeDefined();
      expect(layout.elements.textPanel.x).toBe(5);
      expect(layout.elements.textPanel.y).toBe(78);
      expect(layout.elements.textPanel.width).toBe(90);
      expect(layout.elements.textPanel.height).toBe(17);
      expect(layout.elements.textPanel.zIndex).toBe(2);

      // Verify diagram panel
      expect(layout.elements.diagramPanel).toBeDefined();
      expect(layout.elements.diagramPanel.x).toBe(5);
      expect(layout.elements.diagramPanel.y).toBe(5);
      expect(layout.elements.diagramPanel.width).toBe(60);
      expect(layout.elements.diagramPanel.height).toBe(40);
      expect(layout.elements.diagramPanel.zIndex).toBe(3);
    });

    it('should preserve character image galleries', () => {
      const json = JSON.stringify(testBook);
      const parsed = JSON.parse(json);
      const character = parsed.stories[0].characters[0];

      expect(character.name).toBe('Character 1');
      expect(character.imageGallery).toHaveLength(1);
      expect(character.imageGallery[0].id).toBe('char-img-1');
      expect(character.selectedImageId).toBe('char-img-1');
    });

    it('should handle scenes without optional properties', () => {
      // Create a minimal scene
      const minimalScene = new Scene({
        title: 'Minimal Scene',
        description: 'Minimal description'
      });

      testStory.scenes.push(minimalScene);

      const json = JSON.stringify(testBook);
      const parsed = JSON.parse(json);
      const scene = parsed.stories[0].scenes[1];

      expect(scene.title).toBe('Minimal Scene');
      expect(scene.textPanel).toBeUndefined();
      expect(scene.diagramPanel).toBeUndefined();
      expect(scene.layout).toBeUndefined();
      expect(scene.characters).toEqual([]);
      expect(scene.elements).toEqual([]);
    });
  });

  describe('Property completeness checks', () => {
    it('should not lose any Scene properties during serialization', () => {
      const originalKeys = Object.keys(testScene).sort();
      
      const json = JSON.stringify(testScene);
      const parsed = JSON.parse(json);
      const parsedKeys = Object.keys(parsed).sort();

      // All original keys should be present in parsed object
      for (const key of originalKeys) {
        expect(parsedKeys).toContain(key);
      }
    });

    it('should not lose any Story properties during serialization', () => {
      const originalKeys = Object.keys(testStory).sort();
      
      const json = JSON.stringify(testStory);
      const parsed = JSON.parse(json);
      const parsedKeys = Object.keys(parsed).sort();

      // All original keys should be present in parsed object
      for (const key of originalKeys) {
        expect(parsedKeys).toContain(key);
      }
    });

    it('should not lose any Book properties during serialization', () => {
      const originalKeys = Object.keys(testBook).sort();
      
      const json = JSON.stringify(testBook);
      const parsed = JSON.parse(json);
      const parsedKeys = Object.keys(parsed).sort();

      // All original keys should be present in parsed object
      for (const key of originalKeys) {
        expect(parsedKeys).toContain(key);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined optional properties', () => {
      const scene = new Scene({
        title: 'Test',
        description: 'Test',
        textPanel: undefined,
        diagramPanel: undefined,
        layout: undefined
      });

      const json = JSON.stringify(scene);
      const parsed = JSON.parse(json);

      // undefined values are not serialized by JSON.stringify
      expect(parsed.textPanel).toBeUndefined();
      expect(parsed.diagramPanel).toBeUndefined();
      expect(parsed.layout).toBeUndefined();
    });

    it('should handle empty arrays', () => {
      const scene = new Scene({
        title: 'Test',
        description: 'Test',
        characters: [],
        elements: []
      });

      const json = JSON.stringify(scene);
      const parsed = JSON.parse(json);

      expect(parsed.characters).toEqual([]);
      expect(parsed.elements).toEqual([]);
    });

    it('should handle Date objects', () => {
      const now = new Date();
      const scene = new Scene({
        title: 'Test',
        description: 'Test',
        createdAt: now,
        updatedAt: now
      });

      const json = JSON.stringify(scene);
      const parsed = JSON.parse(json);

      // Dates are serialized as ISO strings
      expect(parsed.createdAt).toBe(now.toISOString());
      expect(parsed.updatedAt).toBe(now.toISOString());
    });
  });

  describe('Regression tests for known bugs', () => {
    it('should NOT lose layout property (regression test for layout persistence bug)', () => {
      // This test specifically checks for the bug where layout was lost during save/load
      const sceneWithLayout = new Scene({
        title: 'Scene with Layout',
        description: 'Test',
        layout: testLayout
      });

      // Simulate save/load cycle
      const json = JSON.stringify(sceneWithLayout);
      const reloaded = JSON.parse(json);

      // CRITICAL: Layout must be present after reload
      expect(reloaded.layout).toBeDefined();
      expect(reloaded.layout.type).toBe('overlay');
      expect(reloaded.layout.canvas.aspectRatio).toBe('3:4');
    });

    it('should preserve image element aspectRatio (regression test)', () => {
      const sceneWithLayout = new Scene({
        title: 'Scene with Layout',
        description: 'Test',
        layout: testLayout
      });

      const json = JSON.stringify(sceneWithLayout);
      const reloaded = JSON.parse(json);

      // CRITICAL: Image element's aspectRatio must be preserved
      expect(reloaded.layout.elements.image.aspectRatio).toBe('16:9');
    });
  });
});

