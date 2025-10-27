import { describe, it, expect, beforeEach } from 'vitest';
import { Story, Character, StoryElement } from '../../src/models/Story';
import { Scene } from '../../src/models/Scene';

describe('Story Model', () => {
  let story: Story;

  beforeEach(() => {
    story = new Story({
      title: 'Test Story',
      backgroundSetup: 'A magical forest',
      description: 'A test story'
    });
  });

  describe('Constructor', () => {
    it('should create a story with required fields', () => {
      expect(story.title).toBe('Test Story');
      expect(story.backgroundSetup).toBe('A magical forest');
      expect(story.description).toBe('A test story');
    });

    it('should generate a UUID if not provided', () => {
      expect(story.id).toBeDefined();
      expect(typeof story.id).toBe('string');
    });

    it('should initialize with empty arrays', () => {
      expect(story.characters).toHaveLength(0);
      expect(story.elements).toHaveLength(0);
      expect(story.scenes).toHaveLength(0);
    });

    it('should set timestamps', () => {
      expect(story.createdAt).toBeInstanceOf(Date);
      expect(story.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Validation', () => {
    it('should validate a valid story', () => {
      const result = story.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation if title is empty', () => {
      story.title = '';
      const result = story.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Story title is required');
    });

    it('should fail validation if backgroundSetup is empty', () => {
      story.backgroundSetup = '';
      const result = story.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Story background setup is required');
    });

    it('should fail validation for duplicate character names', () => {
      story.addCharacter({ name: 'Alice', description: 'First Alice' });
      story.characters.push({ name: 'alice', description: 'Second Alice' }); // Bypass addCharacter check
      
      const result = story.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate character names'))).toBe(true);
    });

    it('should fail validation for duplicate element names', () => {
      story.addElement({ name: 'Sword', description: 'First Sword', category: 'Weapon' });
      story.elements.push({ name: 'sword', description: 'Second Sword', category: 'Weapon' }); // Bypass addElement check
      
      const result = story.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate element names'))).toBe(true);
    });
  });

  describe('Character Management', () => {
    it('should add a character', () => {
      story.addCharacter({ name: 'Alice', description: 'A brave hero' });
      
      expect(story.characters).toHaveLength(1);
      expect(story.characters[0].name).toBe('Alice');
    });

    it('should throw error when adding duplicate character', () => {
      story.addCharacter({ name: 'Alice', description: 'First' });
      
      expect(() => {
        story.addCharacter({ name: 'Alice', description: 'Second' });
      }).toThrow('already exists');
    });

    it('should find character by name (case-insensitive)', () => {
      story.addCharacter({ name: 'Alice', description: 'A brave hero' });
      
      const found = story.findCharacterByName('alice');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Alice');
    });

    it('should rename a character', () => {
      story.addCharacter({ name: 'Alice', description: 'A brave hero' });
      
      story.renameCharacter('Alice', 'Alicia');
      
      expect(story.findCharacterByName('Alice')).toBeUndefined();
      expect(story.findCharacterByName('Alicia')).toBeDefined();
    });

    it('should update scene references when renaming character', () => {
      story.addCharacter({ name: 'Alice', description: 'A brave hero' });
      const scene = new Scene({
        title: 'Test Scene',
        description: 'A test scene',
        characters: ['Alice']
      });
      story.addScene(scene);
      
      story.renameCharacter('Alice', 'Alicia');
      
      expect(story.scenes[0].characters).toContain('Alicia');
      expect(story.scenes[0].characters).not.toContain('Alice');
    });

    it('should throw error when renaming to existing name', () => {
      story.addCharacter({ name: 'Alice', description: 'First' });
      story.addCharacter({ name: 'Bob', description: 'Second' });
      
      expect(() => {
        story.renameCharacter('Alice', 'Bob');
      }).toThrow('already exists');
    });

    it('should delete a character', () => {
      story.addCharacter({ name: 'Alice', description: 'A brave hero' });
      
      const deleted = story.deleteCharacter('Alice');
      
      expect(deleted).toBe(true);
      expect(story.characters).toHaveLength(0);
    });

    it('should remove character from scenes when deleting', () => {
      story.addCharacter({ name: 'Alice', description: 'A brave hero' });
      const scene = new Scene({
        title: 'Test Scene',
        description: 'A test scene',
        characters: ['Alice']
      });
      story.addScene(scene);
      
      story.deleteCharacter('Alice');
      
      expect(story.scenes[0].characters).toHaveLength(0);
    });
  });

  describe('Element Management', () => {
    it('should add an element', () => {
      story.addElement({ name: 'Sword', description: 'A magic sword', category: 'Weapon' });
      
      expect(story.elements).toHaveLength(1);
      expect(story.elements[0].name).toBe('Sword');
    });

    it('should throw error when adding duplicate element', () => {
      story.addElement({ name: 'Sword', description: 'First', category: 'Weapon' });
      
      expect(() => {
        story.addElement({ name: 'Sword', description: 'Second', category: 'Weapon' });
      }).toThrow('already exists');
    });

    it('should find element by name (case-insensitive)', () => {
      story.addElement({ name: 'Sword', description: 'A magic sword', category: 'Weapon' });
      
      const found = story.findElementByName('sword');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Sword');
    });

    it('should rename an element', () => {
      story.addElement({ name: 'Sword', description: 'A magic sword', category: 'Weapon' });
      
      story.renameElement('Sword', 'Magic Blade');
      
      expect(story.findElementByName('Sword')).toBeUndefined();
      expect(story.findElementByName('Magic Blade')).toBeDefined();
    });

    it('should update scene references when renaming element', () => {
      story.addElement({ name: 'Sword', description: 'A magic sword', category: 'Weapon' });
      const scene = new Scene({
        title: 'Test Scene',
        description: 'A test scene',
        elements: ['Sword']
      });
      story.addScene(scene);
      
      story.renameElement('Sword', 'Magic Blade');
      
      expect(story.scenes[0].elements).toContain('Magic Blade');
      expect(story.scenes[0].elements).not.toContain('Sword');
    });

    it('should throw error when renaming to existing name', () => {
      story.addElement({ name: 'Sword', description: 'First', category: 'Weapon' });
      story.addElement({ name: 'Shield', description: 'Second', category: 'Armor' });
      
      expect(() => {
        story.renameElement('Sword', 'Shield');
      }).toThrow('already exists');
    });

    it('should delete an element', () => {
      story.addElement({ name: 'Sword', description: 'A magic sword', category: 'Weapon' });
      
      const deleted = story.deleteElement('Sword');
      
      expect(deleted).toBe(true);
      expect(story.elements).toHaveLength(0);
    });

    it('should remove element from scenes when deleting', () => {
      story.addElement({ name: 'Sword', description: 'A magic sword', category: 'Weapon' });
      const scene = new Scene({
        title: 'Test Scene',
        description: 'A test scene',
        elements: ['Sword']
      });
      story.addScene(scene);
      
      story.deleteElement('Sword');
      
      expect(story.scenes[0].elements).toHaveLength(0);
    });
  });

  describe('Scene Management', () => {
    it('should add a scene', () => {
      const scene = new Scene({
        title: 'Test Scene',
        description: 'A test scene'
      });
      
      story.addScene(scene);
      
      expect(story.scenes).toHaveLength(1);
      expect(story.scenes[0].title).toBe('Test Scene');
    });

    it('should delete a scene', () => {
      const scene = new Scene({
        title: 'Test Scene',
        description: 'A test scene'
      });
      story.addScene(scene);
      
      const deleted = story.deleteScene(scene.id);
      
      expect(deleted).toBe(true);
      expect(story.scenes).toHaveLength(0);
    });

    it('should update updatedAt when adding scene', () => {
      const oldUpdatedAt = story.updatedAt;
      const scene = new Scene({
        title: 'Test Scene',
        description: 'A test scene'
      });
      
      story.addScene(scene);
      
      expect(story.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });
  });

  describe('JSON Conversion', () => {
    it('should convert to JSON export format', () => {
      story.addCharacter({ name: 'Alice', description: 'A brave hero' });
      story.addElement({ name: 'Sword', description: 'A magic sword', category: 'Weapon' });
      
      const json = story.toJSON();
      
      expect(json.story.title).toBe('Test Story');
      expect(json.story.backgroundSetup).toBe('A magical forest');
      expect(json.characters).toHaveLength(1);
      expect(json.elements).toHaveLength(1);
      expect(json.scenes).toHaveLength(0);
    });

    it('should include scenes in JSON export', () => {
      const scene = new Scene({
        title: 'Test Scene',
        description: 'A test scene'
      });
      story.addScene(scene);
      
      const json = story.toJSON();
      
      expect(json.scenes).toHaveLength(1);
      expect(json.scenes[0].title).toBe('Test Scene');
    });

    it('should create Story from JSON', async () => {
      const json = {
        story: {
          title: 'Imported Story',
          backgroundSetup: 'Imported background',
          description: 'Imported description'
        },
        characters: [
          { name: 'Alice', description: 'A hero' }
        ],
        elements: [
          { name: 'Sword', description: 'A weapon', category: 'Weapon' }
        ],
        scenes: []
      };
      
      const imported = await Story.fromJSON(json);
      
      expect(imported.title).toBe('Imported Story');
      expect(imported.characters).toHaveLength(1);
      expect(imported.elements).toHaveLength(1);
    });

    it('should round-trip through JSON', async () => {
      story.addCharacter({ name: 'Alice', description: 'A brave hero' });
      story.addElement({ name: 'Sword', description: 'A magic sword', category: 'Weapon' });
      
      const json = story.toJSON();
      const recreated = await Story.fromJSON(json);
      
      expect(recreated.title).toBe(story.title);
      expect(recreated.backgroundSetup).toBe(story.backgroundSetup);
      expect(recreated.characters).toHaveLength(story.characters.length);
      expect(recreated.elements).toHaveLength(story.elements.length);
    });
  });
});

