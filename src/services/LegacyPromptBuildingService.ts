/**
 * LegacyPromptBuildingService - Current simple concatenation approach
 * 
 * This service implements the original prompt building strategy used in the codebase.
 * It concatenates information in a straightforward manner:
 * 1. Reference image instructions (if applicable)
 * 2. Book style
 * 3. Background setup
 * 4. Characters
 * 5. Elements
 * 6. Scene description
 * 7. Technical requirements
 * 
 * This approach works but doesn't follow structured prompt engineering principles
 * like those required by Gemini Imagen.
 */

import {
  PromptBuildingService,
  type ScenePromptOptions,
  type CharacterPromptOptions,
  type PromptBuildingResult
} from './PromptBuildingService';

export class LegacyPromptBuildingService extends PromptBuildingService {
  /**
   * Build scene prompt using the legacy concatenation approach
   */
  buildScenePrompt(options: ScenePromptOptions): PromptBuildingResult {
    const { scene, story, book, characters, elements, hasReferenceImages, charactersWithImages } = options;
    
    const macros = {
      'SceneDescription': scene.description || ''
    };

    let prompt = `Create an illustration with the following requirements:\n\n`;
    
    // ⭐ CRITICAL: Put reference image instructions at the very top if we have any
    if (hasReferenceImages && charactersWithImages && charactersWithImages.length > 0) {
      prompt += `!!! CRITICAL INSTRUCTION - REFERENCE IMAGES ATTACHED !!!\n\n`;
      prompt += `You MUST base character appearances on the ${charactersWithImages.length} reference image(s) provided below.\n`;
      prompt += `These images show exactly how the characters should look.\n`;
      prompt += `Do NOT deviate from these character designs.\n`;
      prompt += `The reference images are:\n`;
      charactersWithImages.forEach((char, index) => {
        prompt += `${index + 1}. ${char.name} - Use this exact character design\n`;
      });
      prompt += `\nAll other aspects of the scene (background, setting, composition, mood) should follow the description below,\n`;
      prompt += `but the character appearances MUST match the reference images exactly.\n\n`;
      prompt += `---\n\n`;
    }

    // Add book style if available
    const bookStyle = this.formatBookStyle(book);
    if (bookStyle) {
      prompt += `Visual Style:\n${bookStyle}\n\n`;
    }

    // Add background setup (story context)
    if (story.backgroundSetup) {
      prompt += `Story Context:\n${story.backgroundSetup}\n\n`;
    }

    // Add characters in the scene
    if (characters.length > 0) {
      prompt += `Characters in this scene:\n`;
      characters.forEach(char => {
        const level = char.isBookLevel ? ' (book-level character)' : '';
        const hasImage = char.selectedImageId ? ' [REFERENCE IMAGE PROVIDED - USE THIS DESIGN]' : '';
        prompt += `- ${char.name}${level}${hasImage}: ${char.description}\n`;
      });
      prompt += `\n`;
    }

    // Add elements in the scene
    if (elements.length > 0) {
      prompt += `Scene Elements:\n`;
      elements.forEach(elem => {
        const category = elem.category ? ` (${elem.category})` : '';
        prompt += `- ${elem.name}${category}: ${elem.description}\n`;
      });
      prompt += `\n`;
    }

    // Add scene description with macro replacement
    const processedDescription = this.replaceMacros(scene.description, macros);
    prompt += `Scene Description:\n${processedDescription}\n\n`;

    // Add technical requirements
    prompt += `Requirements:\n`;
    prompt += `1. Create a single, cohesive illustration that captures the scene described above\n`;
    prompt += `2. Ensure all characters and elements mentioned are visible and recognizable\n`;
    prompt += `3. The image should have good composition and visual balance\n`;
    prompt += `4. Maintain consistent art style throughout\n`;
    
    if (hasReferenceImages) {
      prompt += `5. ⚠️ MOST IMPORTANT: Character appearances MUST exactly match the reference images provided\n`;
    }

    prompt += `\nDo not include any text, labels, or scene numbers in the generated image.`;

    return {
      prompt: prompt.trim(),
      metadata: {
        strategy: 'legacy',
        sections: ['reference_instructions', 'book_style', 'story_context', 'characters', 'elements', 'scene_description', 'requirements'],
        estimatedTokens: this.estimateTokens(prompt),
        warnings: [
          'Legacy prompt format: Simple concatenation without structured sections',
          hasReferenceImages ? 'Reference images used - character consistency expected' : undefined
        ].filter(Boolean) as string[]
      }
    };
  }

  /**
   * Build character prompt using the legacy approach
   */
  buildCharacterPrompt(options: CharacterPromptOptions): PromptBuildingResult {
    const { character, storyBackgroundSetup, book, hasReferenceImage } = options;
    
    let prompt = '';
    
    // Add book style if available
    const bookStyle = this.formatBookStyle(book);
    if (bookStyle) {
      prompt += `${bookStyle}\n\n`;
    }
    
    // Reference image note if provided
    if (hasReferenceImage) {
      prompt += `!!! REFERENCE IMAGE PROVIDED !!!\n`;
      prompt += `Use the attached reference image as inspiration for this character's appearance.\n`;
      prompt += `The generated character should be consistent with the reference style and features.\n\n`;
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
    prompt += `5. Show the full character or a clear portrait view\n`;
    if (hasReferenceImage) {
      prompt += `6. ⚠️ IMPORTANT: Maintain consistency with the reference image provided\n`;
    }
    prompt += `\nDo not include any text, labels, or scene elements in the image.`;
    
    return {
      prompt: prompt.trim(),
      metadata: {
        strategy: 'legacy',
        sections: ['book_style', 'reference_note', 'character_details', 'requirements'],
        estimatedTokens: this.estimateTokens(prompt),
        warnings: hasReferenceImage ? ['Reference image provided - consistency expected'] : []
      }
    };
  }

  /**
   * Get strategy name
   */
  getStrategyName(): string {
    return 'Legacy Concatenation';
  }

  /**
   * Get strategy description
   */
  getStrategyDescription(): string {
    return 'Simple concatenation of scene elements. Works for most models but not optimized for structured prompt requirements.';
  }

  /**
   * Check if suitable for model
   * Legacy strategy works as fallback for all models
   */
  isSuitableForModel(modelId: string): boolean {
    // Legacy strategy is universal - works as fallback for any model
    // But it's not optimal for models that prefer structured prompts (like Gemini Imagen)
    return !modelId.includes('gemini') && !modelId.includes('imagen');
  }
}

