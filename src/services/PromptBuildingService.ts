/**
 * PromptBuildingService - Base class for building image generation prompts
 * 
 * This abstract base class defines the interface for building prompts from story/scene data.
 * Different models may require different prompt structures and strategies.
 * 
 * Derived classes implement specific prompt building strategies:
 * - LegacyPromptBuildingService: Current simple concatenation approach
 * - GeminiPromptBuildingService: Structured approach for Imagen (work surface, layout, components, etc.)
 * - [Future]: Other model-specific strategies as needed
 */

import type { Book } from '../models/Book';
import type { Story } from '../models/Story';
import type { Scene } from '../models/Scene';
import type { Character } from '../models/Story';

/**
 * Character with additional metadata about its level (book or story)
 */
export interface CharacterWithLevel extends Character {
  isBookLevel?: boolean;
}

/**
 * Story element (prop, location, etc.)
 */
export interface StoryElement {
  name: string;
  description: string;
  category?: string;
}

/**
 * Options for scene image prompt building
 */
export interface ScenePromptOptions {
  scene: Scene;
  story: Story;
  book: Book | null;
  characters: CharacterWithLevel[];
  elements: StoryElement[];
  hasReferenceImages: boolean; // Whether any characters have reference images attached
  charactersWithImages?: CharacterWithLevel[]; // Characters that have selected reference images
}

/**
 * Options for character image prompt building
 */
export interface CharacterPromptOptions {
  character: Character;
  storyBackgroundSetup: string;
  book: Book;
  hasReferenceImage: boolean; // Whether a reference image is being provided
}

/**
 * Result of prompt building
 */
export interface PromptBuildingResult {
  prompt: string;
  metadata?: {
    strategy: string; // e.g., "legacy", "gemini", "custom"
    sections?: string[]; // e.g., ["work_surface", "layout", "components"]
    estimatedTokens?: number;
    warnings?: string[];
  };
}

/**
 * Abstract base class for prompt building strategies
 */
export abstract class PromptBuildingService {
  /**
   * Build a prompt for scene image generation
   * 
   * @param options Scene, story, book, and character data
   * @returns Prompt string and metadata
   */
  abstract buildScenePrompt(options: ScenePromptOptions): PromptBuildingResult;

  /**
   * Build a prompt for character image generation
   * 
   * @param options Character, story context, and book style
   * @returns Prompt string and metadata
   */
  abstract buildCharacterPrompt(options: CharacterPromptOptions): PromptBuildingResult;

  /**
   * Get a human-readable name for this prompt building strategy
   */
  abstract getStrategyName(): string;

  /**
   * Get a description of this prompt building strategy
   */
  abstract getStrategyDescription(): string;

  /**
   * Check if this strategy is suitable for a given model
   * 
   * @param modelId Model identifier (e.g., "google/gemini-pro-1.5-flash")
   * @returns True if this strategy is recommended for the model
   */
  abstract isSuitableForModel(modelId: string): boolean;

  /**
   * Helper: Format book style for inclusion in prompts
   */
  protected formatBookStyle(book: Book | null): string {
    if (!book || !book.style) return '';
    
    const style = book.style;
    const parts: string[] = [];
    
    if (style.artStyle) parts.push(`Art Style: ${style.artStyle}`);
    if (style.colorPalette) parts.push(`Color Palette: ${style.colorPalette}`);
    if (style.mood) parts.push(`Mood: ${style.mood}`);
    if (style.artisticInfluences) parts.push(`Influences: ${style.artisticInfluences}`);
    if (style.additionalNotes) parts.push(style.additionalNotes);
    
    return parts.join('\n');
  }

  /**
   * Helper: Replace macros in text (e.g., {{SceneDescription}})
   */
  protected replaceMacros(text: string, macros: Record<string, string>): string {
    let result = text;
    Object.entries(macros).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  /**
   * Helper: Estimate token count (rough approximation)
   * Average English word ≈ 1.3 tokens, 4 chars per word
   */
  protected estimateTokens(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 1.3);
  }
}

