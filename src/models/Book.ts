import { v4 as uuidv4 } from 'uuid';
import type { BookStyle } from '../types/BookStyle';
import { DEFAULT_BOOK_STYLE } from '../types/BookStyle';
import { Story } from './Story';

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

    // Validate all stories
    this.stories.forEach((story, index) => {
      const storyValidation = story.validate();
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
   * Convert to JSON export format
   */
  toJSON(): BookExchangeFormat {
    return {
      book: {
        title: this.title,
        description: this.description,
        backgroundSetup: this.backgroundSetup,
        aspectRatio: this.aspectRatio,
        style: this.style
      },
      stories: this.stories.map(story => story.toJSON())
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
      style: data.book.style
    });

    // Add stories
    if (data.stories) {
      const storyPromises = data.stories.map((storyData: any) => StoryClass.fromJSON(storyData));
      book.stories = await Promise.all(storyPromises);
    }

    return book;
  }
}

