import { v4 as uuidv4 } from 'uuid';
import type { BookStyle } from '../types/BookStyle';
import { DEFAULT_BOOK_STYLE } from '../types/BookStyle';
import { Story, type Character } from './Story';

/**
 * Validation result from model validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Book export format (for JSON import/export)
 */
export interface BookExchangeFormat {
  book: {
    title: string;
    description?: string;
    backgroundSetup?: string;
    aspectRatio?: string;
    style: BookStyle;
    characters?: Character[]; // Book-level characters
  };
  stories: any[]; // StoryExchangeFormat - avoid circular dependency
}

/**
 * Book model class
 * Represents a complete book with multiple stories and a unified visual style
 */
export class Book {
  id: string;
  title: string;
  description?: string;
  backgroundSetup?: string;
  aspectRatio?: string;
  style: BookStyle;
  defaultLayout?: any; // SceneLayout - Default layout for all scenes in this book (using any to avoid circular dependency)
  characters: Character[]; // Book-level characters shared across all stories
  stories: Story[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Book> & { title: string }) {
    this.id = data.id || uuidv4();
    this.title = data.title;
    this.description = data.description;
    this.backgroundSetup = data.backgroundSetup;
    this.aspectRatio = data.aspectRatio || '9:16';
    this.style = data.style || { ...DEFAULT_BOOK_STYLE };
    this.defaultLayout = data.defaultLayout; // NEW: Book-level default layout
    this.characters = data.characters || []; // Book-level characters
    this.stories = data.stories || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validate the book data
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Book title is required');
    }

    if (this.title && this.title.length > 200) {
      errors.push('Book title must be 200 characters or less');
    }

    if (this.aspectRatio) {
      const validRatios = ['1:1', '2:3', '3:4', '9:16', '3:2', '4:3', '16:9'];
      if (!validRatios.includes(this.aspectRatio)) {
        errors.push(`Aspect ratio must be one of: ${validRatios.join(', ')}`);
      }
    }

    if (this.stories.length === 0) {
      warnings.push('Book has no stories');
    }

    // Validate all stories (pass book-level characters for scene validation)
    this.stories.forEach((story, index) => {
      const storyValidation = story.validate(this.characters);
      if (!storyValidation.isValid) {
        errors.push(`Story ${index + 1} (${story.title}): ${storyValidation.errors.join(', ')}`);
      }
      if (storyValidation.warnings.length > 0) {
        warnings.push(`Story ${index + 1} (${story.title}): ${storyValidation.warnings.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Add a character to the book
   */
  addCharacter(character: Character): void {
    // Check for duplicate name
    if (this.findCharacterByName(character.name)) {
      throw new Error(`Character with name "${character.name}" already exists at book level`);
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
   * Delete a character from the book
   */
  deleteCharacter(name: string): boolean {
    const initialLength = this.characters.length;
    this.characters = this.characters.filter(c => c.name.toLowerCase() !== name.toLowerCase());
    const deleted = this.characters.length < initialLength;
    if (deleted) {
      this.touch();
    }
    return deleted;
  }

  /**
   * Add a story to the book
   */
  addStory(story: Story): void {
    this.stories.push(story);
    this.touch();
  }

  /**
   * Remove a story from the book by ID
   */
  removeStory(storyId: string): boolean {
    const initialLength = this.stories.length;
    this.stories = this.stories.filter(s => s.id !== storyId);
    const removed = this.stories.length < initialLength;
    if (removed) {
      this.touch();
    }
    return removed;
  }

  /**
   * Get a story by ID
   */
  getStory(storyId: string): Story | undefined {
    return this.stories.find(s => s.id === storyId);
  }

  /**
   * Update the book's visual style
   */
  updateStyle(style: Partial<BookStyle>): void {
    this.style = {
      ...this.style,
      ...style
    };
    this.touch();
  }

  /**
   * Update the book's updatedAt timestamp
   */
  private touch(): void {
    this.updatedAt = new Date();
  }

  /**
   * Convert to JSON export format for file export
   * NOTE: This is explicitly called for export, NOT used for storage serialization
   */
  toExportJSON(): BookExchangeFormat {
    return {
      book: {
        title: this.title,
        description: this.description,
        backgroundSetup: this.backgroundSetup,
        aspectRatio: this.aspectRatio,
        style: this.style,
        characters: this.characters || [] // Include book-level characters
      },
      stories: this.stories.map(story => story.toExportJSON())
    };
  }
  
  /**
   * toJSON is used by JSON.stringify for storage - keep flat structure
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      backgroundSetup: this.backgroundSetup,
      aspectRatio: this.aspectRatio,
      style: this.style,
      defaultLayout: this.defaultLayout, // NEW: Include book-level default layout
      characters: this.characters || [],
      stories: this.stories,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a Book instance from JSON export format
   */
  static async fromJSON(data: BookExchangeFormat): Promise<Book> {
    // Import Story class here to avoid circular dependency
    const { Story: StoryClass } = await import('./Story.js');
    
    const book = new Book({
      title: data.book.title,
      description: data.book.description,
      backgroundSetup: data.book.backgroundSetup,
      aspectRatio: data.book.aspectRatio,
      style: data.book.style,
      characters: data.book.characters || [] // Book-level characters
    });

    // Add stories
    if (data.stories) {
      const storyPromises = data.stories.map((storyData: any) => StoryClass.fromJSON(storyData));
      book.stories = await Promise.all(storyPromises);
    }

    return book;
  }
}

