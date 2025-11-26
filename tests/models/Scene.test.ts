import { describe, it, expect, beforeEach } from 'vitest';
import { Scene, GeneratedImage } from '../../src/models/Scene';
import { Story } from '../../src/models/Story';

describe('Scene Model', () => {
  let scene: Scene;
  let story: Story;

  beforeEach(() => {
    story = new Story({
      title: 'Test Story',
      backgroundSetup: 'A magical forest'
    });
    
    story.addCharacter({ name: 'Alice', description: 'A brave hero' });
    story.addCharacter({ name: 'Bob', description: 'A wise wizard' });
    story.addElement({ name: 'Sword', description: 'A magic sword', category: 'Weapon' });
    story.addElement({ name: 'Castle', description: 'A grand castle', category: 'Location' });

    scene = new Scene({
      title: 'Test Scene',
      description: 'A test scene description'
    });
  });

  describe('Constructor', () => {
    it('should create a scene with required fields', () => {
      expect(scene.title).toBe('Test Scene');
      expect(scene.description).toBe('A test scene description');
    });

    it('should generate a UUID if not provided', () => {
      expect(scene.id).toBeDefined();
      expect(typeof scene.id).toBe('string');
    });

    it('should initialize with empty arrays', () => {
      expect(scene.characters).toHaveLength(0);
      expect(scene.elements).toHaveLength(0);
      expect(scene.imageHistory).toHaveLength(0);
    });

    it('should set timestamps', () => {
      expect(scene.createdAt).toBeInstanceOf(Date);
      expect(scene.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept optional textPanel', () => {
      const sceneWithPanel = new Scene({
        title: 'Scene with Panel',
        description: 'Description',
        textPanel: 'Panel text'
      });
      
      expect(sceneWithPanel.textPanel).toBe('Panel text');
    });
  });

  describe('Validation', () => {
    it('should validate a valid scene', () => {
      const result = scene.validate(story);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation if title is empty', () => {
      scene.title = '';
      const result = scene.validate(story);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scene title is required');
    });

    it('should fail validation if description is empty', () => {
      scene.description = '';
      const result = scene.validate(story);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scene description is required');
    });

    it('should fail validation for invalid character reference', () => {
      scene.addCharacter('NonExistentCharacter');
      const result = scene.validate(story);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Character "NonExistentCharacter" not found'))).toBe(true);
    });

    it('should fail validation for invalid element reference', () => {
      scene.addElement('NonExistentElement');
      const result = scene.validate(story);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Element "NonExistentElement" not found'))).toBe(true);
    });

    it('should pass validation for valid character references', () => {
      scene.addCharacter('Alice');
      scene.addCharacter('Bob');
      const result = scene.validate(story);
      expect(result.isValid).toBe(true);
    });

    it('should pass validation for valid element references', () => {
      scene.addElement('Sword');
      scene.addElement('Castle');
      const result = scene.validate(story);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Character Management', () => {
    it('should add a character by name', () => {
      scene.addCharacter('Alice');
      
      expect(scene.characters).toHaveLength(1);
      expect(scene.characters).toContain('Alice');
    });

    it('should not add duplicate character', () => {
      scene.addCharacter('Alice');
      scene.addCharacter('Alice');
      
      expect(scene.characters).toHaveLength(1);
    });

    it('should remove a character by name', () => {
      scene.addCharacter('Alice');
      const removed = scene.removeCharacter('Alice');
      
      expect(removed).toBe(true);
      expect(scene.characters).toHaveLength(0);
    });

    it('should return false when removing non-existent character', () => {
      const removed = scene.removeCharacter('NonExistent');
      expect(removed).toBe(false);
    });

    it('should be case-insensitive when removing character', () => {
      scene.addCharacter('Alice');
      const removed = scene.removeCharacter('alice');
      
      expect(removed).toBe(true);
      expect(scene.characters).toHaveLength(0);
    });

    it('should update updatedAt when adding character', () => {
      const oldUpdatedAt = scene.updatedAt;
      scene.addCharacter('Alice');
      
      expect(scene.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });
  });

  describe('Element Management', () => {
    it('should add an element by name', () => {
      scene.addElement('Sword');
      
      expect(scene.elements).toHaveLength(1);
      expect(scene.elements).toContain('Sword');
    });

    it('should not add duplicate element', () => {
      scene.addElement('Sword');
      scene.addElement('Sword');
      
      expect(scene.elements).toHaveLength(1);
    });

    it('should remove an element by name', () => {
      scene.addElement('Sword');
      const removed = scene.removeElement('Sword');
      
      expect(removed).toBe(true);
      expect(scene.elements).toHaveLength(0);
    });

    it('should return false when removing non-existent element', () => {
      const removed = scene.removeElement('NonExistent');
      expect(removed).toBe(false);
    });

    it('should be case-insensitive when removing element', () => {
      scene.addElement('Sword');
      const removed = scene.removeElement('sword');
      
      expect(removed).toBe(true);
      expect(scene.elements).toHaveLength(0);
    });

    it('should update updatedAt when adding element', () => {
      const oldUpdatedAt = scene.updatedAt;
      scene.addElement('Sword');
      
      expect(scene.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });
  });

  describe('Image History Management', () => {
    it('should add generated image to history', () => {
      const image: GeneratedImage = {
        id: 'img-1',
        modelName: 'test-model',
        timestamp: new Date()
      };
      
      scene.addGeneratedImage(image);
      
      expect(scene.imageHistory).toHaveLength(1);
      expect(scene.imageHistory?.[0].id).toBe('img-1');
    });

    it('should get latest image', () => {
      const image1: GeneratedImage = {
        id: 'img-1',
        modelName: 'test-model',
        timestamp: new Date(2024, 0, 1)
      };
      const image2: GeneratedImage = {
        id: 'img-2',
        modelName: 'test-model',
        timestamp: new Date(2024, 0, 2)
      };
      
      scene.addGeneratedImage(image1);
      scene.addGeneratedImage(image2);
      
      const latest = scene.getLatestImage();
      expect(latest?.id).toBe('img-2');
    });

    it('should return undefined for latest image when no images exist', () => {
      const latest = scene.getLatestImage();
      expect(latest).toBeUndefined();
    });

    it('should delete an image by ID', () => {
      const image: GeneratedImage = {
        id: 'img-1',
        modelName: 'test-model',
        timestamp: new Date()
      };
      
      scene.addGeneratedImage(image);
      const deleted = scene.deleteImage('img-1');
      
      expect(deleted).toBe(true);
      expect(scene.imageHistory).toHaveLength(0);
    });

    it('should return false when deleting non-existent image', () => {
      const deleted = scene.deleteImage('non-existent');
      expect(deleted).toBe(false);
    });

    it('should update updatedAt when adding image', () => {
      const oldUpdatedAt = scene.updatedAt;
      const image: GeneratedImage = {
        id: 'img-1',
        modelName: 'test-model',
        timestamp: new Date()
      };
      
      scene.addGeneratedImage(image);
      
      expect(scene.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });
  });

  describe('JSON Conversion', () => {
    it('should convert to JSON export format', () => {
      scene.addCharacter('Alice');
      scene.addElement('Sword');
      scene.textPanel = 'Panel text';
      
      const json = scene.toJSON();
      
      expect(json.title).toBe('Test Scene');
      expect(json.description).toBe('A test scene description');
      expect(json.textPanel).toBe('Panel text');
      expect(json.characters).toContain('Alice');
      expect(json.elements).toContain('Sword');
    });

    it('should include all properties in JSON serialization', () => {
      const image: GeneratedImage = {
        id: 'img-1',
        modelName: 'test-model',
        timestamp: new Date()
      };
      scene.addGeneratedImage(image);
      
      const json = scene.toJSON();
      
      // toJSON() includes all properties for proper serialization
      expect(json.id).toBeDefined();
      expect(json.title).toBe('Test Scene');
      expect(json.imageHistory).toHaveLength(1);
      expect(json.imageHistory[0].id).toBe('img-1');
    });

    it('should create Scene from JSON', () => {
      const json = {
        title: 'Imported Scene',
        description: 'Imported description',
        textPanel: 'Imported panel',
        characters: ['Alice', 'Bob'],
        elements: ['Sword', 'Castle']
      };
      
      const imported = Scene.fromJSON(json);
      
      expect(imported.title).toBe('Imported Scene');
      expect(imported.description).toBe('Imported description');
      expect(imported.textPanel).toBe('Imported panel');
      expect(imported.characters).toHaveLength(2);
      expect(imported.elements).toHaveLength(2);
    });

    it('should round-trip through JSON', () => {
      scene.addCharacter('Alice');
      scene.addElement('Sword');
      scene.textPanel = 'Panel text';
      
      const json = scene.toJSON();
      const recreated = Scene.fromJSON(json);
      
      expect(recreated.title).toBe(scene.title);
      expect(recreated.description).toBe(scene.description);
      expect(recreated.textPanel).toBe(scene.textPanel);
      expect(recreated.characters).toEqual(scene.characters);
      expect(recreated.elements).toEqual(scene.elements);
    });
  });
});

