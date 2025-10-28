/**
 * CharacterImageService - Generate and manage character images
 * 
 * Handles character image generation with book/story context,
 * storage in IndexedDB, and retrieval for scene prompts.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Character, CharacterImage } from '../models/Story';
import type { Book } from '../models/Book';
import { ImageGenerationService } from './ImageGenerationService';
import { ImageStorageService } from './ImageStorageService';
import { formatBookStyleForPrompt } from '../types/BookStyle';

export class CharacterImageService {
  /**
   * Build prompt for character image generation
   * Includes book style, story context, and white background requirement
   */
  static buildCharacterPrompt(
    character: Character,
    storyBackgroundSetup: string,
    book: Book
  ): string {
    const bookStylePrompt = formatBookStyleForPrompt(book.style);
    
    return `
${bookStylePrompt}

Story Context:
${storyBackgroundSetup}

Character to Generate:
Name: ${character.name}
Description: ${character.description}

IMPORTANT REQUIREMENTS:
1. Generate this character on a plain white background
2. The character should be clearly visible and well-lit against the white background
3. Focus on capturing the character's unique features and personality as described
4. The character should be centered in the image
5. Show the full character or a clear portrait view

Do not include any text, labels, or scene elements in the image.
`.trim();
  }

  /**
   * Generate a character image
   * @returns CharacterImage object with metadata (url will be loaded separately)
   */
  static async generateCharacterImage(
    character: Character,
    storyId: string,
    storyBackgroundSetup: string,
    book: Book,
    model: string,
    aspectRatio: string = '1:1'
  ): Promise<CharacterImage> {
    // Build the prompt
    const prompt = this.buildCharacterPrompt(character, storyBackgroundSetup, book);

    // Generate the image
    const imageUrl = await ImageGenerationService.generateImage(prompt, model, aspectRatio);

    // Create character image metadata
    const imageId = uuidv4();
    const characterImage: CharacterImage = {
      id: imageId,
      url: imageUrl,
      model,
      prompt,
      timestamp: new Date(),
    };

    // Store in IndexedDB
    await ImageStorageService.storeCharacterImage(
      storyId,
      character.name,
      imageId,
      imageUrl,
      model
    );

    return characterImage;
  }

  /**
   * Load a character image from IndexedDB
   * @returns Blob URL or null if not found
   */
  static async loadCharacterImage(
    storyId: string,
    characterName: string,
    imageId: string
  ): Promise<string | null> {
    return await ImageStorageService.getCharacterImage(storyId, characterName, imageId);
  }

  /**
   * Load all images for a character
   * @returns Map of imageId -> blobUrl
   */
  static async loadCharacterGallery(
    storyId: string,
    characterName: string
  ): Promise<Map<string, string>> {
    return await ImageStorageService.getAllCharacterImages(storyId, characterName);
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
    if (!character.imageGallery) {
      character.imageGallery = [];
    }
    
    // Limit gallery size to 10 images (configurable)
    const MAX_GALLERY_SIZE = 10;
    if (character.imageGallery.length >= MAX_GALLERY_SIZE) {
      console.warn(`Character ${character.name} has reached maximum gallery size (${MAX_GALLERY_SIZE})`);
      // Remove oldest image
      character.imageGallery.shift();
    }
    
    character.imageGallery.push(characterImage);
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
   * Load selected character image URL from IndexedDB
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

