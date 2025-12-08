/**
 * BookCreationWizardService - Orchestrates the book creation wizard workflow
 * 
 * This service coordinates between:
 * - WizardLLMService for AI-powered suggestions
 * - SceneImageGenerationService for style sample generation
 * - ImageStorageService for temporary image storage
 * - localStorage for wizard state persistence
 * 
 * Handles:
 * - Concept analysis and book metadata generation
 * - Style variation generation with sample images
 * - Style refinement through iterative feedback
 * - Character profile generation
 * - Wizard state persistence
 */

import { WizardLLMService, type WizardLLMContext } from './WizardLLMService';
import { ImageGenerationService } from './ImageGenerationService';
import { ImageStorageService } from './ImageStorageService';
import type {
  ConceptAnalysis,
  BookMetadata,
  StyleVariation,
  StyleOption,
  CharacterProfile,
  WizardState,
  PersistedWizardState,
  GeneratedImage,
  Message
} from '../types/Wizard';
import type { BookStyle } from '../types/BookStyle';
import { v4 as uuidv4 } from 'uuid';

const WIZARD_STATE_KEY = 'bookCreationWizardState';
const WIZARD_STATE_VERSION = 1;

export class BookCreationWizardService {
  // ========================================
  // Concept Phase Methods
  // ========================================

  /**
   * Analyze user's book concept and generate metadata
   */
  static async analyzeConcept(concept: string): Promise<ConceptAnalysis & BookMetadata> {
    const context: WizardLLMContext = {
      concept
    };

    // Make LLM request
    const result = await WizardLLMService.makeStructuredRequest('concept', context);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to analyze concept');
    }

    // Parse response
    const parsed = WizardLLMService.parseConceptResponse(result.data);
    
    if (!parsed.success || !parsed.data) {
      throw new Error(parsed.error || 'Failed to parse concept response');
    }

    return parsed.data;
  }

  /**
   * Generate book metadata from concept
   * (Convenience method that calls analyzeConcept and extracts metadata)
   */
  static async generateBookMetadata(concept: string): Promise<BookMetadata> {
    const analysis = await this.analyzeConcept(concept);
    
    return {
      title: analysis.title,
      description: analysis.description,
      backgroundSetup: analysis.backgroundSetup
    };
  }

  // ========================================
  // Style Phase Methods
  // ========================================

  /**
   * Generate 3-5 style variations based on concept
   */
  static async generateStyleVariations(
    concept: string,
    preferences?: string
  ): Promise<StyleVariation[]> {
    const context: WizardLLMContext = {
      concept,
      stylePreferences: preferences
    };

    // Make LLM request
    const result = await WizardLLMService.makeStructuredRequest('style', context);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate style variations');
    }

    // Parse response
    const parsed = WizardLLMService.parseStyleResponse(result.data);
    
    if (!parsed.success || !parsed.data) {
      throw new Error(parsed.error || 'Failed to parse style response');
    }

    return parsed.data;
  }

  /**
   * Generate sample images for style variations
   * Returns StyleOption objects with generated images
   */
  static async generateStyleImages(
    variations: StyleVariation[],
    aspectRatio: string = '3:4'
  ): Promise<StyleOption[]> {
    const styleOptions: StyleOption[] = [];

    for (const variation of variations) {
      try {
        console.log(`Generating sample image for style: ${variation.name}`);
        
        // Generate image using the variation's prompt
        const result = await ImageGenerationService.generateImage({
          prompt: variation.prompt,
          aspectRatio,
          model: undefined // Use default model from settings
        });

        if (!result.success || !result.imageUrl) {
          console.error(`Failed to generate image for ${variation.name}:`, result.error);
          continue;
        }

        // Convert variation to BookStyle
        const style: BookStyle = {
          artStyle: variation.artStyle,
          colorPalette: variation.colorPalette,
          visualTheme: variation.visualTheme,
          characterStyle: variation.characterStyle,
          environmentStyle: variation.environmentStyle
        };

        // Create style option
        const styleOption: StyleOption = {
          id: uuidv4(),
          name: variation.name,
          prompt: variation.prompt,
          imageUrl: result.imageUrl,
          style
        };

        styleOptions.push(styleOption);
        console.log(`✓ Generated sample image for: ${variation.name}`);
      } catch (error) {
        console.error(`Error generating image for ${variation.name}:`, error);
        // Continue with other variations
      }
    }

    if (styleOptions.length === 0) {
      throw new Error('Failed to generate any style sample images');
    }

    return styleOptions;
  }

  /**
   * Refine style prompt based on user feedback
   */
  static async refineStylePrompt(
    currentPrompt: string,
    feedback: string,
    context: string
  ): Promise<string> {
    const llmContext: WizardLLMContext = {
      concept: context,
      currentStylePrompt: currentPrompt,
      stylePreferences: feedback
    };

    // Make LLM request
    const result = await WizardLLMService.makeStructuredRequest('refinement', llmContext);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to refine style prompt');
    }

    // Parse response
    const parsed = WizardLLMService.parseRefinementResponse(result.data);
    
    if (!parsed.success || !parsed.data) {
      throw new Error(parsed.error || 'Failed to parse refinement response');
    }

    return parsed.data;
  }

  /**
   * Generate refined image from modified prompt
   */
  static async generateRefinedImage(
    prompt: string,
    aspectRatio: string = '3:4'
  ): Promise<string> {
    const result = await ImageGenerationService.generateImage({
      prompt,
      aspectRatio,
      model: undefined // Use default model from settings
    });

    if (!result.success || !result.imageUrl) {
      throw new Error(result.error || 'Failed to generate refined image');
    }

    return result.imageUrl;
  }

  // ========================================
  // Conversation Methods
  // ========================================

  /**
   * Send a conversational message and get LLM response
   * Used for general wizard conversation at any step
   */
  static async sendConversationMessage(
    userMessage: string,
    conversationHistory: Message[],
    context: { concept?: string; stylePrompt?: string }
  ): Promise<string> {
    const llmContext: WizardLLMContext = {
      concept: context.concept,
      currentStylePrompt: context.stylePrompt,
      conversationHistory
    };

    // Make LLM request for conversation
    const result = await WizardLLMService.makeStructuredRequest('conversation', llmContext);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get conversation response');
    }

    // For conversation, the response is plain text
    return result.data;
  }

  // ========================================
  // Character Phase Methods
  // ========================================

  /**
   * Suggest number of characters based on concept
   * (Simple heuristic for now, could be LLM-powered in future)
   */
  static async suggestCharacterCount(concept: string): Promise<number> {
    // Simple heuristic: suggest 2-4 characters based on concept length
    // Could be enhanced with LLM analysis in the future
    const wordCount = concept.split(/\s+/).length;
    
    if (wordCount < 20) {
      return 2; // Simple concept, fewer characters
    } else if (wordCount < 50) {
      return 3; // Medium concept
    } else {
      return 4; // Complex concept, more characters
    }
  }

  /**
   * Generate detailed character profile
   */
  static async generateCharacterProfile(
    name: string,
    role: string,
    basicDescription: string,
    bookContext: string,
    _style: BookStyle,
    existingCharacters?: Array<{ name: string; description: string }>
  ): Promise<CharacterProfile> {
    const context: WizardLLMContext = {
      concept: bookContext,
      characterInfo: {
        name,
        role,
        basicDescription
      },
      existingCharacters
    };

    // Make LLM request
    const result = await WizardLLMService.makeStructuredRequest('character', context);
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to generate character profile');
    }

    // Parse response
    const parsed = WizardLLMService.parseCharacterResponse(result.data);
    
    if (!parsed.success || !parsed.data) {
      throw new Error(parsed.error || 'Failed to parse character response');
    }

    return parsed.data;
  }

  /**
   * Refine character description based on feedback
   */
  static async refineCharacterDescription(
    character: CharacterProfile,
    feedback: string,
    bookContext: string
  ): Promise<CharacterProfile> {
    // For character refinement, we can reuse the character generation
    // with the feedback incorporated into the basic description
    const refinedBasicDescription = `${character.description}\n\nUser feedback: ${feedback}`;
    
    return this.generateCharacterProfile(
      character.name,
      'Character', // Role not needed for refinement
      refinedBasicDescription,
      bookContext,
      {} as BookStyle // Style not needed for refinement
    );
  }

  // ========================================
  // Persistence Methods
  // ========================================

  /**
   * Save wizard state to localStorage
   */
  static async saveWizardState(state: WizardState): Promise<void> {
    try {
      // Collect temporary image IDs
      const temporaryImages: string[] = [];
      
      // Add style option images
      state.styleRefinement.initialOptions.forEach(option => {
        if (option.imageUrl.startsWith('blob:')) {
          // Extract ID from blob URL if possible, or use option ID
          temporaryImages.push(option.id);
        }
      });
      
      // Add refinement iteration images
      state.styleRefinement.refinementHistory.forEach(iteration => {
        iteration.generatedImages.forEach(img => {
          temporaryImages.push(img.id);
        });
      });
      
      // Add current images
      state.styleRefinement.currentImages.forEach(img => {
        temporaryImages.push(img.id);
      });

      const persistedState: PersistedWizardState = {
        version: WIZARD_STATE_VERSION,
        timestamp: new Date(),
        state,
        temporaryImages
      };

      localStorage.setItem(WIZARD_STATE_KEY, JSON.stringify(persistedState));
      console.log('✓ Wizard state saved to localStorage');
    } catch (error) {
      console.error('Failed to save wizard state:', error);
      throw new Error('Failed to save wizard state');
    }
  }

  /**
   * Load wizard state from localStorage
   */
  static async loadWizardState(): Promise<WizardState | null> {
    try {
      const stored = localStorage.getItem(WIZARD_STATE_KEY);
      
      if (!stored) {
        return null;
      }

      const persisted: PersistedWizardState = JSON.parse(stored);
      
      // Check version compatibility
      if (persisted.version !== WIZARD_STATE_VERSION) {
        console.warn('Wizard state version mismatch, clearing state');
        await this.clearWizardState();
        return null;
      }

      // Convert date strings back to Date objects
      persisted.state.messages = persisted.state.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      console.log('✓ Wizard state loaded from localStorage');
      return persisted.state;
    } catch (error) {
      console.error('Failed to load wizard state:', error);
      // Clear corrupted state
      await this.clearWizardState();
      return null;
    }
  }

  /**
   * Clear wizard state from localStorage
   */
  static async clearWizardState(): Promise<void> {
    try {
      // Get temporary images before clearing
      const stored = localStorage.getItem(WIZARD_STATE_KEY);
      
      if (stored) {
        const persisted: PersistedWizardState = JSON.parse(stored);
        
        // Clean up temporary images
        if (persisted.temporaryImages && persisted.temporaryImages.length > 0) {
          console.log(`Cleaning up ${persisted.temporaryImages.length} temporary images`);
          
          for (const imageId of persisted.temporaryImages) {
            try {
              await ImageStorageService.deleteImage(imageId);
            } catch (error) {
              console.warn(`Failed to delete temporary image ${imageId}:`, error);
            }
          }
        }
      }

      localStorage.removeItem(WIZARD_STATE_KEY);
      console.log('✓ Wizard state cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear wizard state:', error);
      // Force remove even if cleanup fails
      localStorage.removeItem(WIZARD_STATE_KEY);
    }
  }

  /**
   * Store temporary wizard image
   * (Used for style samples and refinement iterations)
   */
  static async storeTemporaryImage(
    imageUrl: string,
    prompt: string
  ): Promise<GeneratedImage> {
    const imageId = uuidv4();
    
    try {
      // Store image with wizard-specific metadata
      await ImageStorageService.storeImage(
        imageId,
        'wizard-temp', // Use special scene ID for wizard images
        imageUrl,
        'wizard-style-sample'
      );

      const generatedImage: GeneratedImage = {
        id: imageId,
        url: imageUrl,
        prompt,
        timestamp: new Date()
      };

      return generatedImage;
    } catch (error) {
      console.error('Failed to store temporary wizard image:', error);
      // Return image with URL even if storage fails
      return {
        id: imageId,
        url: imageUrl,
        prompt,
        timestamp: new Date()
      };
    }
  }

  /**
   * Clean up temporary wizard images
   * Called on wizard completion or cancellation
   */
  static async cleanupTemporaryImages(imageIds: string[]): Promise<void> {
    console.log(`Cleaning up ${imageIds.length} temporary wizard images`);
    
    for (const imageId of imageIds) {
      try {
        await ImageStorageService.deleteImage(imageId);
      } catch (error) {
        console.warn(`Failed to delete temporary image ${imageId}:`, error);
      }
    }
    
    console.log('✓ Temporary images cleaned up');
  }
}
