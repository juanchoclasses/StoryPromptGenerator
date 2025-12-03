/**
 * CharacterImageService - Generate and manage character images
 * 
 * Handles character image generation with book/story context,
 * storage in filesystem, and retrieval for scene prompts.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Character, CharacterImage } from '../models/Story';
import type { Book } from '../models/Book';
import { ImageGenerationService } from './ImageGenerationService';
import { ImageStorageService } from './ImageStorageService';
import { formatBookStyleForPrompt } from '../types/BookStyle';
import { LegacyPromptBuildingService } from './LegacyPromptBuildingService';
import { GeminiPromptBuildingService } from './GeminiPromptBuildingService';
import type { PromptBuildingService as IPromptBuildingService } from './PromptBuildingService';

export class CharacterImageService {
  /**
   * Select the appropriate prompt building strategy based on model
   */
  private static selectPromptStrategy(model: string, strategyOption?: 'auto' | 'legacy' | 'gemini'): IPromptBuildingService {
    // If strategy is explicitly specified, use it
    if (strategyOption === 'legacy') {
      return new LegacyPromptBuildingService();
    }
    if (strategyOption === 'gemini') {
      return new GeminiPromptBuildingService();
    }
    
    // Auto-detect based on model
    const geminiStrategy = new GeminiPromptBuildingService();
    if (geminiStrategy.isSuitableForModel(model)) {
      console.log(`🎯 Auto-selected Gemini prompt strategy for character generation with model: ${model}`);
      return geminiStrategy;
    }
    
    // Default to legacy
    console.log(`📝 Using legacy prompt strategy for character generation with model: ${model}`);
    return new LegacyPromptBuildingService();
  }

  /**
   * Build prompt for character image generation using pluggable strategy
   * Includes book style, story context, and white background requirement
   * 
   * @param character Character to generate
   * @param storyBackgroundSetup Story context
   * @param book Book for style
   * @param model Model identifier for strategy selection
   * @param hasReferenceImage Whether a reference image is provided
   * @param promptStrategy Optional: 'auto' (default), 'legacy', or 'gemini'
   * @returns Prompt string
   */
  static buildCharacterPrompt(
    character: Character,
    storyBackgroundSetup: string,
    book: Book,
    model?: string,
    hasReferenceImage: boolean = false,
    promptStrategy?: 'auto' | 'legacy' | 'gemini'
  ): string {
    // If model is provided, use the new pluggable strategy system
    if (model) {
      const strategy = this.selectPromptStrategy(model, promptStrategy);
      
      const result = strategy.buildCharacterPrompt({
        character,
        storyBackgroundSetup,
        book,
        hasReferenceImage
      });
      
      // Log metadata for debugging
      if (result.metadata) {
        console.log(`📋 Character Prompt Strategy: ${result.metadata.strategy}`);
        console.log(`📊 Estimated tokens: ${result.metadata.estimatedTokens}`);
        if (result.metadata.warnings && result.metadata.warnings.length > 0) {
          console.log(`⚠️  Warnings:`, result.metadata.warnings);
        }
      }
      
      return result.prompt;
    }
    
    // LEGACY PATH: Keep old logic for backward compatibility
    return this.buildCharacterPromptLegacy(character, storyBackgroundSetup, book);
  }

  /**
   * Legacy prompt building method (preserved for backward compatibility)
   * @deprecated Use buildCharacterPrompt with model parameter instead
   */
  private static buildCharacterPromptLegacy(
    character: Character,
    storyBackgroundSetup: string,
    book: Book
  ): string {
    const bookStylePrompt = book.style ? formatBookStyleForPrompt(book.style) : '';
    
    let prompt = '';
    
    // Add book style if available
    if (bookStylePrompt && bookStylePrompt.trim()) {
      prompt += `${bookStylePrompt}\n\n`;
    }
    
    // Character details (required)
    prompt += `Character to Generate:\n`;
    prompt += `Name: ${character.name}\n`;
    prompt += `Description: ${character.description || 'A character'}\n\n`;
    
    // Requirements
    prompt += `IMPORTANT REQUIREMENTS:\n`;
    prompt += `1. Generate this character on a plain white background\n`;
    prompt += `2. The character should be clearly visible and well-lit against the white background\n`;
    prompt += `3. Focus on capturing the character's unique features and personality as described\n`;
    prompt += `4. The character should be centered in the image\n`;
    prompt += `5. Show the full character or a clear portrait view\n\n`;
    prompt += `Do not include any text, labels, or scene elements in the image.`;
    
    return prompt.trim();
  }

  /**
   * Generate a character image
   * @param referenceImage Optional base64 data URL of reference image to include in generation
   * @param promptStrategy Optional: 'auto' (default), 'legacy', or 'gemini'
   * @returns CharacterImage object with metadata (url will be loaded separately)
   */
  static async generateCharacterImage(
    character: Character,
    storyId: string,
    storyBackgroundSetup: string,
    book: Book,
    model: string,
    aspectRatio: string = '1:1',
    referenceImage?: string | null,
    promptStrategy?: 'auto' | 'legacy' | 'gemini'
  ): Promise<CharacterImage> {
    // Build the prompt using pluggable strategy
    const prompt = this.buildCharacterPrompt(
      character,
      storyBackgroundSetup,
      book,
      model, // Pass model for strategy selection
      !!referenceImage, // Has reference image
      promptStrategy // Pass user's strategy choice
    );

    // Validate prompt is not empty
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Failed to generate prompt: Character description is required');
    }

    // Prepare reference images array if provided
    const referenceImages = referenceImage ? [referenceImage] : undefined;

    // Generate the image
    const result = await ImageGenerationService.generateImage({
      prompt,
      model,
      aspectRatio,
      referenceImages
    });

    // Check for errors
    if (!result.success || !result.imageUrl) {
      console.error('Image generation failed:', result.error);
      throw new Error(result.error || 'Failed to generate image');
    }

    console.log('✓ Image generated successfully, URL length:', result.imageUrl.length);

    // Create character image metadata
    const imageId = uuidv4();
    const characterImage: CharacterImage = {
      id: imageId,
      url: result.imageUrl,
      model,
      prompt,
      timestamp: new Date(),
    };

    console.log('✓ Character image metadata created:', { id: imageId, model, urlPreview: result.imageUrl.substring(0, 50) });

    // Store to filesystem
    try {
      await ImageStorageService.storeCharacterImage(
        storyId,
        character.name,
        imageId,
        result.imageUrl,
        model
      );
      console.log('✓ Image stored to filesystem successfully');
    } catch (error) {
      console.error('✗ Failed to store image to filesystem:', error);
      throw error;
    }

    return characterImage;
  }

  /**
   * Load a character image from filesystem
   * @param storyId Story ID (or "book:{bookId}" for book-level characters)
   * @param characterName Character name
   * @param imageId Image ID
   * @returns Blob URL or null if not found
   */
  static async loadCharacterImage(
    storyId: string,
    characterName: string,
    imageId: string
  ): Promise<string | null> {
    // Check if this is a book-level character (storyId starts with "book:")
    if (storyId.startsWith('book:')) {
      const bookId = storyId.replace('book:', '');
      return await ImageStorageService.getBookCharacterImage(bookId, characterName, imageId);
    } else {
      return await ImageStorageService.getCharacterImage(storyId, characterName, imageId);
    }
  }

  /**
   * Load all images for a character
   * @param storyId Story ID (or "book:{bookId}" for book-level characters)
   * @param characterName Character name
   * @param character Character object (optional, used to get imageIds from imageGallery)
   * @returns Map of imageId -> blobUrl
   */
  static async loadCharacterGallery(
    storyId: string,
    characterName: string,
    character?: { imageGallery?: Array<{ id: string }> }
  ): Promise<Map<string, string>> {
    // Extract imageIds from character.imageGallery if available
    const imageIds = character?.imageGallery?.map(img => img.id);
    
    // Check if this is a book-level character (storyId starts with "book:")
    if (storyId.startsWith('book:')) {
      const bookId = storyId.replace('book:', '');
      const images = await ImageStorageService.getAllBookCharacterImages(bookId, characterName, imageIds);
      
      // Auto-cleanup stale references if character object provided
      // Note: This modifies the character object in place - caller should save the book/story after
      if (character && imageIds && imageIds.length > 0 && images.size < imageIds.length) {
        // Some images are missing - clean up stale references
        const removed = await this.cleanupStaleImageReferences(character as Character, storyId);
        if (removed > 0) {
          console.log(`⚠️ Auto-cleaned ${removed} stale image reference(s) for "${characterName}". Save the book/story to persist this change.`);
        }
      }
      
      return images;
    } else {
      const images = await ImageStorageService.getAllCharacterImages(storyId, characterName, imageIds);
      
      // Auto-cleanup stale references if character object provided
      // Note: This modifies the character object in place - caller should save the book/story after
      if (character && imageIds && imageIds.length > 0 && images.size < imageIds.length) {
        // Some images are missing - clean up stale references
        const removed = await this.cleanupStaleImageReferences(character as Character, storyId);
        if (removed > 0) {
          console.log(`⚠️ Auto-cleaned ${removed} stale image reference(s) for "${characterName}". Save the book/story to persist this change.`);
        }
      }
      
      return images;
    }
  }

  /**
   * Delete a character image
   */
  static async deleteCharacterImage(
    storyId: string,
    characterName: string,
    imageId: string
  ): Promise<void> {
    await ImageStorageService.deleteCharacterImage(storyId, characterName, imageId);
  }

  /**
   * Set selected character image
   * Updates the character's selectedImageId in the book data
   * @param character Character to update (will be modified in place)
   * @param imageId Image ID to select, or undefined to clear selection
   */
  static setSelectedCharacterImage(
    character: Character,
    imageId: string | undefined
  ): void {
    character.selectedImageId = imageId;
  }

  /**
   * Add generated image to character's gallery
   * @param character Character to update (will be modified in place)
   * @param characterImage CharacterImage to add
   */
  static addImageToGallery(
    character: Character,
    characterImage: CharacterImage
  ): void {
    console.log(`Adding image to ${character.name}'s gallery:`, characterImage.id);
    
    if (!character.imageGallery) {
      character.imageGallery = [];
      console.log(`  Created new imageGallery array for ${character.name}`);
    }
    
    // Limit gallery size to 10 images (configurable)
    const MAX_GALLERY_SIZE = 10;
    if (character.imageGallery.length >= MAX_GALLERY_SIZE) {
      console.warn(`Character ${character.name} has reached maximum gallery size (${MAX_GALLERY_SIZE})`);
      // Remove oldest image
      const removed = character.imageGallery.shift();
      console.log(`  Removed oldest image:`, removed?.id);
    }
    
    character.imageGallery.push(characterImage);
    console.log(`✓ Image added to gallery. New gallery size: ${character.imageGallery.length}`);
  }

  /**
   * Remove image from character's gallery
   * @param character Character to update (will be modified in place)
   * @param imageId Image ID to remove
   */
  static removeImageFromGallery(
    character: Character,
    imageId: string
  ): void {
    if (!character.imageGallery) return;
    
    character.imageGallery = character.imageGallery.filter(img => img.id !== imageId);
    
    // Clear selection if selected image was removed
    if (character.selectedImageId === imageId) {
      character.selectedImageId = undefined;
    }
  }

  /**
   * Clean up stale image references from character's gallery
   * Removes references to images that don't exist in filesystem
   * @param character Character to update (will be modified in place)
   * @param storyId Story ID (or "book:{bookId}" for book-level characters)
   * @returns Number of stale references removed
   */
  static async cleanupStaleImageReferences(
    character: Character,
    storyId: string
  ): Promise<number> {
    if (!character.imageGallery || character.imageGallery.length === 0) {
      return 0;
    }

    const beforeCount = character.imageGallery.length;
    const imageIds = character.imageGallery.map(img => img.id);
    
    // Check filesystem directly for each image (don't use loadCharacterGallery to avoid recursion)
    const existingImageIds = new Set<string>();
    for (const imageId of imageIds) {
      const exists = await this.loadCharacterImage(storyId, character.name, imageId);
      if (exists) {
        existingImageIds.add(imageId);
      }
    }
    
    // Filter out images that don't exist
    character.imageGallery = character.imageGallery.filter(img => existingImageIds.has(img.id));
    const removedCount = beforeCount - character.imageGallery.length;
    
    // Clear selection if selected image was removed
    if (character.selectedImageId && !existingImageIds.has(character.selectedImageId)) {
      // Select first available image, or clear selection
      character.selectedImageId = character.imageGallery.length > 0 
        ? character.imageGallery[0].id 
        : undefined;
    }
    
    if (removedCount > 0) {
      console.log(`✓ Cleaned up ${removedCount} stale image reference(s) for character "${character.name}"`);
      console.log(`  Remaining images: ${character.imageGallery.length}`);
    }
    
    return removedCount;
  }

  /**
   * Get selected character image from gallery
   * @returns CharacterImage or undefined if no image selected
   */
  static getSelectedImage(character: Character): CharacterImage | undefined {
    if (!character.imageGallery || !character.selectedImageId) {
      return undefined;
    }
    
    return character.imageGallery.find(img => img.id === character.selectedImageId);
  }

  /**
   * Load selected character image URL from filesystem
   * @param storyId Story ID (or "book:{bookId}" for book-level characters)
   * @param character Character object
   * @returns Blob URL or null
   */
  static async loadSelectedCharacterImageUrl(
    storyId: string,
    character: Character
  ): Promise<string | null> {
    if (!character.selectedImageId) {
      return null;
    }
    
    return await this.loadCharacterImage(storyId, character.name, character.selectedImageId);
  }
}

