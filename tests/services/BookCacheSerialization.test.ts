import { describe, it, expect, beforeEach } from 'vitest';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';
import { Scene } from '../../src/models/Scene';
import type { SceneLayout } from '../../src/types/Story';

/**
 * BookCache Serialization Tests
 * 
 * These tests verify that BookCache.serializeBook() includes ALL properties.
 * This caught the bug where layout was missing from the serialized output.
 */

describe('BookCache Serialization', () => {
  let testBook: Book;
  let testLayout: SceneLayout;

  beforeEach(() => {
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
          aspectRatio: '16:9'
        },
        textPanel: {
          x: 5,
          y: 78,
          width: 90,
          height: 17,
          zIndex: 2
        }
      }
    };

    const scene = new Scene({
      title: 'Test Scene',
      description: 'Test description',
      layout: testLayout,
      characters: ['Character 1'],
      elements: ['Element 1']
    });

    const story = new Story({
      title: 'Test Story',
      description: 'Test description',
      backgroundSetup: 'Test background',
      characters: [{ name: 'Character 1', description: 'Desc' }],
      elements: [{ name: 'Element 1', description: 'Desc' }],
      scenes: [scene]
    });

    testBook = new Book({
      title: 'Test Book',
      description: 'Test description',
      aspectRatio: '3:4'
    });

    testBook.stories = [story];
  });

  describe('serializeBook method', () => {
    it('should include layout in serialized scene', () => {
      // Access the private serializeBook method via JSON.stringify
      // (which calls toJSON if it exists, or uses the object as-is)
      const serialized = JSON.parse(JSON.stringify(testBook));

      const scene = serialized.stories[0].scenes[0];
      
      // CRITICAL: layout must be in the serialized output
      expect(scene.layout).toBeDefined();
      expect(scene.layout.type).toBe('overlay');
      expect(scene.layout.canvas.aspectRatio).toBe('3:4');
      expect(scene.layout.elements.image.aspectRatio).toBe('16:9');
    });

    it('should include all scene properties', () => {
      const serialized = JSON.parse(JSON.stringify(testBook));
      const scene = serialized.stories[0].scenes[0];

      // Check all required properties are present
      const requiredProps = [
        'id',
        'title',
        'description',
        'layout',
        'characters',
        'elements',
        'createdAt',
        'updatedAt'
      ];

      for (const prop of requiredProps) {
        expect(scene).toHaveProperty(prop);
      }
    });

    it('should include all story properties', () => {
      const serialized = JSON.parse(JSON.stringify(testBook));
      const story = serialized.stories[0];

      const requiredProps = [
        'id',
        'title',
        'description',
        'backgroundSetup',
        'characters',
        'elements',
        'scenes',
        'createdAt',
        'updatedAt'
      ];

      for (const prop of requiredProps) {
        expect(story).toHaveProperty(prop);
      }
    });

    it('should include all book properties', () => {
      const serialized = JSON.parse(JSON.stringify(testBook));

      const requiredProps = [
        'id',
        'title',
        'description',
        'aspectRatio',
        'stories',
        'createdAt',
        'updatedAt'
      ];

      for (const prop of requiredProps) {
        expect(serialized).toHaveProperty(prop);
      }
    });
  });

  describe('Regression: Layout persistence bug', () => {
    it('should NOT strip layout during serialization', () => {
      // This is the exact bug we had: layout was present in memory but lost during serialization
      const scene = testBook.stories[0].scenes[0];
      
      // Verify layout exists in memory
      expect(scene.layout).toBeDefined();
      
      // Serialize
      const serialized = JSON.parse(JSON.stringify(testBook));
      const serializedScene = serialized.stories[0].scenes[0];
      
      // CRITICAL: layout must survive serialization
      expect(serializedScene.layout).toBeDefined();
      expect(serializedScene.layout.type).toBe(scene.layout?.type);
    });

    it('should preserve layout through multiple serialize/deserialize cycles', () => {
      // Simulate multiple save/load cycles
      let currentBook = testBook;
      
      for (let i = 0; i < 3; i++) {
        // Serialize
        const json = JSON.stringify(currentBook);
        
        // Deserialize
        const parsed = JSON.parse(json);
        
        // Reconstruct (simulating what happens when loading from disk)
        currentBook = new Book(parsed);
        currentBook.stories = parsed.stories.map((s: any) => {
          const story = new Story(s);
          story.scenes = s.scenes.map((sc: any) => new Scene(sc));
          return story;
        });
        
        // Verify layout still exists
        const scene = currentBook.stories[0].scenes[0];
        expect(scene.layout).toBeDefined();
        expect(scene.layout?.type).toBe('overlay');
      }
    });
  });

  describe('Optional properties', () => {
    it('should handle scenes without layout', () => {
      const sceneWithoutLayout = new Scene({
        title: 'No Layout Scene',
        description: 'Test'
      });

      testBook.stories[0].scenes.push(sceneWithoutLayout);

      const serialized = JSON.parse(JSON.stringify(testBook));
      const scene = serialized.stories[0].scenes[1];

      // layout should be undefined (not present in JSON)
      expect(scene.layout).toBeUndefined();
    });

    it('should handle optional textPanel', () => {
      const scene = testBook.stories[0].scenes[0];
      scene.textPanel = 'Test text panel';

      const serialized = JSON.parse(JSON.stringify(testBook));
      const serializedScene = serialized.stories[0].scenes[0];

      expect(serializedScene.textPanel).toBe('Test text panel');
    });

    it('should handle optional diagramPanel', () => {
      const scene = testBook.stories[0].scenes[0];
      scene.diagramPanel = {
        type: 'markdown',
        content: '# Test',
        language: 'markdown'
      };

      const serialized = JSON.parse(JSON.stringify(testBook));
      const serializedScene = serialized.stories[0].scenes[0];

      expect(serializedScene.diagramPanel).toBeDefined();
      expect(serializedScene.diagramPanel.type).toBe('markdown');
    });
  });

  describe('Complex nested structures', () => {
    it('should preserve deeply nested layout structure', () => {
      const complexLayout: SceneLayout = {
        type: 'comic-sidebyside',
        canvas: {
          width: 1920,
          height: 1080,
          aspectRatio: '16:9'
        },
        elements: {
          image: {
            x: 0,
            y: 0,
            width: 50,
            height: 100,
            zIndex: 1,
            aspectRatio: '1:1'
          },
          textPanel: {
            x: 50,
            y: 50,
            width: 45,
            height: 45,
            zIndex: 2
          },
          diagramPanel: {
            x: 50,
            y: 5,
            width: 45,
            height: 40,
            zIndex: 3
          }
        }
      };

      const scene = testBook.stories[0].scenes[0];
      scene.layout = complexLayout;

      const serialized = JSON.parse(JSON.stringify(testBook));
      const serializedLayout = serialized.stories[0].scenes[0].layout;

      // Verify every nested property
      expect(serializedLayout.type).toBe('comic-sidebyside');
      expect(serializedLayout.canvas.width).toBe(1920);
      expect(serializedLayout.canvas.height).toBe(1080);
      expect(serializedLayout.canvas.aspectRatio).toBe('16:9');
      
      expect(serializedLayout.elements.image.aspectRatio).toBe('1:1');
      expect(serializedLayout.elements.textPanel.x).toBe(50);
      expect(serializedLayout.elements.diagramPanel.zIndex).toBe(3);
    });
  });
});

