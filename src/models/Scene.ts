import { v4 as uuidv4 } from 'uuid';
import type { Story } from './Story';
import type { ValidationResult } from './Book';
import type { DiagramPanel } from '../types/Story';

/**
 * Generated image metadata (URL stored in IndexedDB)
 */
export interface GeneratedImage {
  id: string;
  modelName: string;
  timestamp: Date;
  promptHash?: string;
}

/**
 * Element position and size in the layout
 */
export interface LayoutElement {
  x: number;        // pixels from left
  y: number;        // pixels from top
  width: number;    // pixels
  height: number;   // pixels
  zIndex: number;   // stacking order
}

/**
 * Scene layout configuration for positioning image and panels
 */
export interface SceneLayout {
  type: 'overlay' | 'comic-sidebyside' | 'comic-vertical' | 'custom';
  canvas: {
    width: number;       // total canvas width in pixels
    height: number;      // total canvas height in pixels
    aspectRatio: string; // e.g., "16:9", "3:4", "21:9"
  };
  elements: {
    image: LayoutElement;
    textPanel?: LayoutElement;
    diagramPanel?: LayoutElement;
  };
}

/**
 * Scene export format (for JSON import/export)
 */
export interface SceneExchangeFormat {
  title: string;
  description: string;
  textPanel?: string;
  diagramPanel?: DiagramPanel; // Optional diagram to overlay on image
  layout?: SceneLayout; // Optional custom layout configuration
  characters: string[];  // Character names (not IDs)
  elements: string[];    // Element names (not IDs)
  imageHistory?: GeneratedImage[]; // Generated images for this scene
}

/**
 * Scene model class
 * Represents a single scene in a story
 * Uses name-based references to characters and elements
 */
export class Scene {
  id: string;
  title: string;
  description: string;
  textPanel?: string;
  diagramPanel?: DiagramPanel;
  layout?: SceneLayout;
  characters: string[];  // Character names
  elements: string[];    // Element names
  imageHistory?: GeneratedImage[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Scene> & { title: string; description: string }) {
    this.id = data.id || uuidv4();
    this.title = data.title;
    this.description = data.description;
    this.textPanel = data.textPanel;
    this.diagramPanel = data.diagramPanel;
    this.layout = data.layout;
    this.characters = data.characters || [];
    this.elements = data.elements || [];
    this.imageHistory = data.imageHistory || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validate the scene data
   * Requires a reference to the parent story to validate character/element references
   * Can optionally accept book-level characters to allow validation of book-level character references
   */
  validate(story: Story, bookCharacters?: Array<{ name: string }>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Scene title is required');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('Scene description is required');
    }

    if (this.characters.length === 0 && this.elements.length === 0) {
      warnings.push('Scene has no characters or elements');
    }

    // Validate character references (check both story-level and book-level)
    this.characters.forEach(charName => {
      const inStory = story.findCharacterByName(charName);
      const inBook = bookCharacters?.find(c => c.name.toLowerCase() === charName.toLowerCase());
      
      if (!inStory && !inBook) {
        errors.push(`Character "${charName}" not found in story or book`);
      }
    });

    // Validate element references
    this.elements.forEach(elemName => {
      if (!story.findElementByName(elemName)) {
        errors.push(`Element "${elemName}" not found in story`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Add a character to the scene by name
   */
  addCharacter(name: string): void {
    if (!this.characters.includes(name)) {
      this.characters.push(name);
      this.touch();
    }
  }

  /**
   * Remove a character from the scene by name
   */
  removeCharacter(name: string): boolean {
    const initialLength = this.characters.length;
    this.characters = this.characters.filter(n => n.toLowerCase() !== name.toLowerCase());
    const removed = this.characters.length < initialLength;
    if (removed) {
      this.touch();
    }
    return removed;
  }

  /**
   * Add an element to the scene by name
   */
  addElement(name: string): void {
    if (!this.elements.includes(name)) {
      this.elements.push(name);
      this.touch();
    }
  }

  /**
   * Remove an element from the scene by name
   */
  removeElement(name: string): boolean {
    const initialLength = this.elements.length;
    this.elements = this.elements.filter(n => n.toLowerCase() !== name.toLowerCase());
    const removed = this.elements.length < initialLength;
    if (removed) {
      this.touch();
    }
    return removed;
  }

  /**
   * Add a generated image to the history
   */
  addGeneratedImage(image: GeneratedImage): void {
    if (!this.imageHistory) {
      this.imageHistory = [];
    }
    this.imageHistory.push(image);
    this.touch();
  }

  /**
   * Get the most recent generated image
   */
  getLatestImage(): GeneratedImage | undefined {
    if (!this.imageHistory || this.imageHistory.length === 0) {
      return undefined;
    }
    return this.imageHistory[this.imageHistory.length - 1];
  }

  /**
   * Delete an image from history by ID
   */
  deleteImage(imageId: string): boolean {
    if (!this.imageHistory) {
      return false;
    }
    const initialLength = this.imageHistory.length;
    this.imageHistory = this.imageHistory.filter(img => img.id !== imageId);
    const deleted = this.imageHistory.length < initialLength;
    if (deleted) {
      this.touch();
    }
    return deleted;
  }

  /**
   * Update the scene's updatedAt timestamp
   */
  private touch(): void {
    this.updatedAt = new Date();
  }

  /**
   * Convert to JSON export format for file export
   */
  toExportJSON(): SceneExchangeFormat {
    return {
      title: this.title,
      description: this.description,
      textPanel: this.textPanel,
      diagramPanel: this.diagramPanel,
      layout: this.layout,
      characters: [...this.characters],
      elements: [...this.elements],
      imageHistory: this.imageHistory ? [...this.imageHistory] : []
    };
  }

  /**
   * toJSON is used by JSON.stringify for storage - keep all fields including id
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      textPanel: this.textPanel,
      diagramPanel: this.diagramPanel,
      layout: this.layout,
      characters: this.characters,
      elements: this.elements,
      imageHistory: this.imageHistory,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a Scene instance from JSON export format
   */
  static fromJSON(data: SceneExchangeFormat): Scene {
    return new Scene({
      title: data.title,
      description: data.description,
      textPanel: data.textPanel,
      diagramPanel: data.diagramPanel,
      layout: data.layout,
      characters: data.characters || [],
      elements: data.elements || [],
      imageHistory: data.imageHistory || []
    });
  }
}

// Explicit re-exports to ensure module resolution
export type { GeneratedImage, LayoutElement, SceneLayout, SceneExchangeFormat };
