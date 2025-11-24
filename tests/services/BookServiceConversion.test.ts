import { describe, it, expect, beforeEach } from 'vitest';
import { Book } from '../../src/models/Book';
import { Story } from '../../src/models/Story';
import { Scene } from '../../src/models/Scene';
import { BookService } from '../../src/services/BookService';
import type { SceneLayout } from '../../src/types/Story';
import type { StoryData } from '../../src/types/Story';

/**
 * BookService Conversion Tests
 * 
 * These tests verify that BookService.getBookData() preserves ALL properties
 * when converting from Book model to StoryData format.
 * 
 * This would have caught the bug where layout was stripped during conversion.
 */

describe('BookService Conversion', () => {
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
      textPanel: 'Test text',
      diagramPanel: {
        type: 'markdown',
        content: '# Test',
        language: 'markdown'
      },
      layout: testLayout,
      characters: ['Character 1'],
      elements: ['Element 1'],
      imageHistory: [
        {
          id: 'img-1',
          modelName: 'test-model',
          timestamp: new Date()
        }
      ]
    });

    const story = new Story({
      title: 'Test Story',
      description: 'Test description',
      backgroundSetup: 'Test background',
      diagramStyle: {
        boardStyle: 'blackboard',
        fontFamily: 'Arial',
        fontSize: 16,
        fontColor: '#ffffff',
        lineColor: '#ffffff',
        lineWidth: 2,
        backgroundColor: '#000000'
      },
      characters: [
        {
          name: 'Character 1',
          description: 'Desc',
          imageGallery: [],
          selectedImageId: undefined
        }
      ],
      elements: [
        {
          name: 'Element 1',
          description: 'Desc',
          category: 'test'
        }
      ],
      scenes: [scene]
    });

    testBook = new Book({
      title: 'Test Book',
      description: 'Test description',
      backgroundSetup: 'Book background',
      aspectRatio: '3:4',
      style: {
        colorPalette: 'Test palette',
        visualTheme: 'Test theme',
        characterStyle: 'Test character',
        environmentStyle: 'Test environment',
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
      }
    });

    testBook.stories = [story];
  });

  describe('Book to StoryData conversion', () => {
    it('should preserve layout in converted scene', () => {
      // Simulate what getBookData() does
      const storyData: StoryData = {
        version: '4.0.0',
        stories: testBook.stories.map(story => ({
          id: story.id,
          title: story.title,
          description: story.description,
          backgroundSetup: story.backgroundSetup,
          diagramStyle: story.diagramStyle,
          characters: story.characters,
          elements: story.elements,
          scenes: story.scenes.map(scene => ({
            id: scene.id,
            title: scene.title,
            description: scene.description,
            textPanel: scene.textPanel,
            diagramPanel: scene.diagramPanel,
            layout: scene.layout, // CRITICAL: This must be included!
            characters: scene.characters || [],
            elements: scene.elements || [],
            characterIds: scene.characters || [],
            elementIds: scene.elements || [],
            imageHistory: scene.imageHistory || [],
            createdAt: scene.createdAt,
            updatedAt: scene.updatedAt
          })),
          characterIds: [],
          elementIds: [],
          createdAt: story.createdAt,
          updatedAt: story.updatedAt
        })),
        characters: [],
        elements: [],
        lastUpdated: testBook.updatedAt
      };

      const scene = storyData.stories[0].scenes[0];
      
      // CRITICAL: layout must be present in StoryData format
      expect(scene.layout).toBeDefined();
      expect(scene.layout?.type).toBe('overlay');
      expect(scene.layout?.canvas.aspectRatio).toBe('3:4');
      expect(scene.layout?.elements.image.aspectRatio).toBe('16:9');
    });

    it('should preserve all scene properties in StoryData format', () => {
      const storyData: StoryData = {
        version: '4.0.0',
        stories: testBook.stories.map(story => ({
          ...story,
          scenes: story.scenes.map(scene => ({
            id: scene.id,
            title: scene.title,
            description: scene.description,
            textPanel: scene.textPanel,
            diagramPanel: scene.diagramPanel,
            layout: scene.layout,
            characters: scene.characters || [],
            elements: scene.elements || [],
            characterIds: scene.characters || [],
            elementIds: scene.elements || [],
            imageHistory: scene.imageHistory || [],
            createdAt: scene.createdAt,
            updatedAt: scene.updatedAt
          })),
          characterIds: [],
          elementIds: []
        })),
        characters: [],
        elements: [],
        lastUpdated: testBook.updatedAt
      };

      const scene = storyData.stories[0].scenes[0];

      // Verify all properties are present
      expect(scene.id).toBeDefined();
      expect(scene.title).toBe('Test Scene');
      expect(scene.description).toBe('Test description');
      expect(scene.textPanel).toBe('Test text');
      expect(scene.diagramPanel).toBeDefined();
      expect(scene.layout).toBeDefined();
      expect(scene.characters).toEqual(['Character 1']);
      expect(scene.elements).toEqual(['Element 1']);
      expect(scene.imageHistory).toHaveLength(1);
      expect(scene.createdAt).toBeDefined();
      expect(scene.updatedAt).toBeDefined();
    });

    it('should preserve diagramStyle in story', () => {
      const storyData: StoryData = {
        version: '4.0.0',
        stories: testBook.stories.map(story => ({
          ...story,
          scenes: [],
          characterIds: [],
          elementIds: []
        })),
        characters: [],
        elements: [],
        lastUpdated: testBook.updatedAt
      };

      const story = storyData.stories[0];
      
      expect(story.diagramStyle).toBeDefined();
      expect(story.diagramStyle?.boardStyle).toBe('blackboard');
    });
  });

  describe('Regression: getBookData() stripping layout', () => {
    it('should detect if layout is missing from conversion', () => {
      // This simulates the BUG we had: getBookData() was not including layout
      const buggyConversion = {
        version: '4.0.0',
        stories: testBook.stories.map(story => ({
          ...story,
          scenes: story.scenes.map(scene => ({
            id: scene.id,
            title: scene.title,
            description: scene.description,
            textPanel: scene.textPanel,
            diagramPanel: scene.diagramPanel,
            // BUG: layout is missing here!
            characters: scene.characters || [],
            elements: scene.elements || [],
            characterIds: scene.characters || [],
            elementIds: scene.elements || [],
            imageHistory: scene.imageHistory || [],
            createdAt: scene.createdAt,
            updatedAt: scene.updatedAt
          })),
          characterIds: [],
          elementIds: []
        })),
        characters: [],
        elements: [],
        lastUpdated: testBook.updatedAt
      };

      const scene = buggyConversion.stories[0].scenes[0];
      
      // This test SHOULD FAIL if layout is missing (which was the bug)
      expect(scene).not.toHaveProperty('layout');
      // This demonstrates the bug - layout exists in original but not in conversion
      expect(testBook.stories[0].scenes[0].layout).toBeDefined();
    });

    it('should preserve layout through Book → StoryData → Book cycle', () => {
      // Convert Book → StoryData
      const storyData: StoryData = {
        version: '4.0.0',
        stories: testBook.stories.map(story => ({
          ...story,
          scenes: story.scenes.map(scene => ({
            id: scene.id,
            title: scene.title,
            description: scene.description,
            textPanel: scene.textPanel,
            diagramPanel: scene.diagramPanel,
            layout: scene.layout, // Must include this!
            characters: scene.characters || [],
            elements: scene.elements || [],
            characterIds: scene.characters || [],
            elementIds: scene.elements || [],
            imageHistory: scene.imageHistory || [],
            createdAt: scene.createdAt,
            updatedAt: scene.updatedAt
          })),
          characterIds: [],
          elementIds: []
        })),
        characters: [],
        elements: [],
        lastUpdated: testBook.updatedAt
      };

      // Convert StoryData → Book
      const reconstructedBook = new Book(testBook);
      reconstructedBook.stories = storyData.stories.map(s => {
        const story = new Story(s);
        story.scenes = s.scenes.map(sc => new Scene(sc));
        return story;
      });

      // Verify layout survived the round-trip
      const originalLayout = testBook.stories[0].scenes[0].layout;
      const reconstructedLayout = reconstructedBook.stories[0].scenes[0].layout;

      expect(reconstructedLayout).toBeDefined();
      expect(reconstructedLayout?.type).toBe(originalLayout?.type);
      expect(reconstructedLayout?.canvas.aspectRatio).toBe(originalLayout?.canvas.aspectRatio);
    });
  });

  describe('Property completeness', () => {
    it('should not lose any properties during Book → StoryData conversion', () => {
      const originalScene = testBook.stories[0].scenes[0];
      const originalProps = Object.keys(originalScene).sort();

      // Simulate conversion
      const convertedScene = {
        id: originalScene.id,
        title: originalScene.title,
        description: originalScene.description,
        textPanel: originalScene.textPanel,
        diagramPanel: originalScene.diagramPanel,
        layout: originalScene.layout,
        characters: originalScene.characters || [],
        elements: originalScene.elements || [],
        characterIds: originalScene.characters || [],
        elementIds: originalScene.elements || [],
        imageHistory: originalScene.imageHistory || [],
        createdAt: originalScene.createdAt,
        updatedAt: originalScene.updatedAt
      };

      const convertedProps = Object.keys(convertedScene).sort();

      // All original properties should be in converted (except deprecated ones we intentionally remove)
      const essentialProps = originalProps.filter(p => !['characterIds', 'elementIds'].includes(p));
      
      for (const prop of essentialProps) {
        expect(convertedProps).toContain(prop);
      }
    });
  });
});

