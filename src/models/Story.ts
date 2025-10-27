import { v4 as uuidv4 } from 'uuid';
import { Scene } from './Scene';
import { ValidationResult } from './Book';

/**
 * Character in a story (name-based, no ID)
 */
export interface Character {
  name: string;
  description: string;
}

/**
 * Element in a story (name-based, no ID)
 */
export interface StoryElement {
  name: string;
  description: string;
  category?: string;
}

/**
 * Story export format (for JSON import/export)
 */
export interface StoryExchangeFormat {
  story: {
    title: string;
    backgroundSetup: string;
    description?: string;
  };
  characters: Character[];
  elements: StoryElement[];
  scenes: any[]; // SceneExchangeFormat - avoid circular dependency
}

/**
 * Story model class
 * Represents a story with characters, elements, and scenes
 * Uses name-based references instead of IDs for simplicity
 */
export class Story {
  id: string;
  title: string;
  description?: string;
  backgroundSetup: string;
  characters: Character[];
  elements: StoryElement[];
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Story> & { title: string; backgroundSetup: string }) {
    this.id = data.id || uuidv4();
    this.title = data.title;
    this.description = data.description;
    this.backgroundSetup = data.backgroundSetup;
    this.characters = data.characters || [];
    this.elements = data.elements || [];
    this.scenes = data.scenes || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validate the story data
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Story title is required');
    }

    if (!this.backgroundSetup || this.backgroundSetup.trim().length === 0) {
      errors.push('Story background setup is required');
    }

    // Check for duplicate character names
    const characterNames = this.characters.map(c => c.name.toLowerCase());
    const duplicateCharacters = characterNames.filter((name, index) => 
      characterNames.indexOf(name) !== index
    );
    if (duplicateCharacters.length > 0) {
      errors.push(`Duplicate character names: ${[...new Set(duplicateCharacters)].join(', ')}`);
    }

    // Check for duplicate element names
    const elementNames = this.elements.map(e => e.name.toLowerCase());
    const duplicateElements = elementNames.filter((name, index) => 
      elementNames.indexOf(name) !== index
    );
    if (duplicateElements.length > 0) {
      errors.push(`Duplicate element names: ${[...new Set(duplicateElements)].join(', ')}`);
    }

    // Validate all scenes
    this.scenes.forEach((scene, index) => {
      const sceneValidation = scene.validate(this);
      if (!sceneValidation.isValid) {
        errors.push(`Scene ${index + 1} (${scene.title}): ${sceneValidation.errors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Add a character to the story
   */
  addCharacter(character: Character): void {
    // Check for duplicate name
    if (this.findCharacterByName(character.name)) {
      throw new Error(`Character with name "${character.name}" already exists`);
    }
    this.characters.push(character);
    this.touch();
  }

  /**
   * Find a character by name (case-insensitive)
   */
  findCharacterByName(name: string): Character | undefined {
    return this.characters.find(c => c.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Rename a character and update all scene references
   */
  renameCharacter(oldName: string, newName: string): void {
    const character = this.findCharacterByName(oldName);
    if (!character) {
      throw new Error(`Character "${oldName}" not found`);
    }

    // Check if new name already exists
    if (oldName.toLowerCase() !== newName.toLowerCase() && this.findCharacterByName(newName)) {
      throw new Error(`Character with name "${newName}" already exists`);
    }

    // Update character name
    character.name = newName;

    // Update all scene references
    this.scenes.forEach(scene => {
      scene.characters = scene.characters.map(name =>
        name.toLowerCase() === oldName.toLowerCase() ? newName : name
      );
    });

    this.touch();
  }

  /**
   * Delete a character and remove from all scenes
   */
  deleteCharacter(name: string): boolean {
    const initialLength = this.characters.length;
    this.characters = this.characters.filter(c => c.name.toLowerCase() !== name.toLowerCase());
    const deleted = this.characters.length < initialLength;

    if (deleted) {
      // Remove from all scenes
      this.scenes.forEach(scene => {
        scene.characters = scene.characters.filter(n => n.toLowerCase() !== name.toLowerCase());
      });
      this.touch();
    }

    return deleted;
  }

  /**
   * Add an element to the story
   */
  addElement(element: StoryElement): void {
    // Check for duplicate name
    if (this.findElementByName(element.name)) {
      throw new Error(`Element with name "${element.name}" already exists`);
    }
    this.elements.push(element);
    this.touch();
  }

  /**
   * Find an element by name (case-insensitive)
   */
  findElementByName(name: string): StoryElement | undefined {
    return this.elements.find(e => e.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Rename an element and update all scene references
   */
  renameElement(oldName: string, newName: string): void {
    const element = this.findElementByName(oldName);
    if (!element) {
      throw new Error(`Element "${oldName}" not found`);
    }

    // Check if new name already exists
    if (oldName.toLowerCase() !== newName.toLowerCase() && this.findElementByName(newName)) {
      throw new Error(`Element with name "${newName}" already exists`);
    }

    // Update element name
    element.name = newName;

    // Update all scene references
    this.scenes.forEach(scene => {
      scene.elements = scene.elements.map(name =>
        name.toLowerCase() === oldName.toLowerCase() ? newName : name
      );
    });

    this.touch();
  }

  /**
   * Delete an element and remove from all scenes
   */
  deleteElement(name: string): boolean {
    const initialLength = this.elements.length;
    this.elements = this.elements.filter(e => e.name.toLowerCase() !== name.toLowerCase());
    const deleted = this.elements.length < initialLength;

    if (deleted) {
      // Remove from all scenes
      this.scenes.forEach(scene => {
        scene.elements = scene.elements.filter(n => n.toLowerCase() !== name.toLowerCase());
      });
      this.touch();
    }

    return deleted;
  }

  /**
   * Add a scene to the story
   */
  addScene(scene: Scene): void {
    this.scenes.push(scene);
    this.touch();
  }

  /**
   * Delete a scene by ID
   */
  deleteScene(sceneId: string): boolean {
    const initialLength = this.scenes.length;
    this.scenes = this.scenes.filter(s => s.id !== sceneId);
    const deleted = this.scenes.length < initialLength;
    if (deleted) {
      this.touch();
    }
    return deleted;
  }

  /**
   * Update the story's updatedAt timestamp
   */
  private touch(): void {
    this.updatedAt = new Date();
  }

  /**
   * Convert to JSON export format
   */
  toJSON(): StoryExchangeFormat {
    return {
      story: {
        title: this.title,
        backgroundSetup: this.backgroundSetup,
        description: this.description
      },
      characters: this.characters.map(c => ({ ...c })),
      elements: this.elements.map(e => ({ ...e })),
      scenes: this.scenes.map(scene => scene.toJSON())
    };
  }

  /**
   * Create a Story instance from JSON export format
   */
  static fromJSON(data: StoryExchangeFormat): Story {
    // Import Scene class here to avoid circular dependency
    const { Scene: SceneClass } = require('./Scene');
    
    const story = new Story({
      title: data.story.title,
      backgroundSetup: data.story.backgroundSetup,
      description: data.story.description,
      characters: data.characters || [],
      elements: data.elements || []
    });

    // Add scenes
    if (data.scenes) {
      story.scenes = data.scenes.map((sceneData: any) => SceneClass.fromJSON(sceneData));
    }

    return story;
  }
}

