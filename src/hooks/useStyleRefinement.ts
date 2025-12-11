import { useState, useCallback } from 'react';
import type {
  StyleOption,
  GeneratedImage,
  RefinementIteration,
  StyleRefinementState
} from '../types/Wizard';
import { BookCreationWizardService } from '../services/BookCreationWizardService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Return type for useStyleRefinement hook
 */
export interface UseStyleRefinementReturn {
  // State
  refinementState: StyleRefinementState;
  
  // Actions
  generateInitialStyles: (concept: string, preferences?: string, aspectRatio?: string) => Promise<void>;
  selectStyle: (styleId: string) => void;
  refineStyle: (feedback: string, concept: string, aspectRatio?: string) => Promise<void>;
  confirmStyle: () => StyleOption | null;
  
  // Status
  isGenerating: boolean;
  error: string | null;
}

/**
 * Custom hook for managing style refinement workflow
 * 
 * Handles the complete style selection and refinement process:
 * 1. Generate 3-5 initial style variations with sample images
 * 2. Allow user to select a preferred style
 * 3. Enable iterative refinement through conversational feedback
 * 4. Track refinement history
 * 5. Finalize style selection
 * 
 * @returns Style refinement state and actions
 */
export function useStyleRefinement(): UseStyleRefinementReturn {
  const [refinementState, setRefinementState] = useState<StyleRefinementState>({
    initialOptions: [],
    selectedOption: undefined,
    refinementHistory: [],
    currentImages: [],
    isRefining: false
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate initial style options (3-5 variations)
   */
  const generateInitialStyles = useCallback(async (
    concept: string,
    preferences?: string,
    aspectRatio: string = '3:4'
  ): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Step 1: Generate style variations from LLM
      const variations = await BookCreationWizardService.generateStyleVariations(
        concept,
        preferences
      );
      
      // Step 2: Generate sample images for each variation
      const styleOptions = await BookCreationWizardService.generateStyleImages(
        variations,
        aspectRatio
      );
      
      // Update state with initial options
      setRefinementState(prev => ({
        ...prev,
        initialOptions: styleOptions,
        selectedOption: undefined,
        refinementHistory: [],
        currentImages: []
      }));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate style options';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Select a style option from the initial variations
   */
  const selectStyle = useCallback((styleId: string) => {
    setRefinementState(prev => {
      const selected = prev.initialOptions.find(option => option.id === styleId);
      
      if (!selected) {
        console.warn(`Style option ${styleId} not found`);
        return prev;
      }
      
      // Initialize current images with the selected style's image
      const currentImages: GeneratedImage[] = [{
        id: selected.id,
        url: selected.imageUrl,
        prompt: selected.prompt,
        timestamp: new Date()
      }];
      
      return {
        ...prev,
        selectedOption: selected,
        currentImages,
        refinementHistory: [] // Reset refinement history when selecting new style
      };
    });
    
    setError(null);
  }, []);

  /**
   * Refine the selected style based on user feedback
   */
  const refineStyle = useCallback(async (
    feedback: string,
    concept: string,
    aspectRatio: string = '3:4'
  ): Promise<void> => {
    // Validate that a style is selected
    if (!refinementState.selectedOption) {
      const errorMessage = 'No style selected for refinement';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    
    setRefinementState(prev => ({ ...prev, isRefining: true }));
    setError(null);
    
    try {
      // Get the current prompt (either from last refinement or original selection)
      const currentPrompt = refinementState.refinementHistory.length > 0
        ? refinementState.refinementHistory[refinementState.refinementHistory.length - 1].modifiedPrompt
        : refinementState.selectedOption.prompt;
      
      // Step 1: Use LLM to modify the prompt based on feedback
      const modifiedPrompt = await BookCreationWizardService.refineStylePrompt(
        currentPrompt,
        feedback,
        concept
      );
      
      // Step 2: Generate new image with the modified prompt
      const imageUrl = await BookCreationWizardService.generateRefinedImage(
        modifiedPrompt,
        aspectRatio
      );
      
      // Create generated image object
      const generatedImage: GeneratedImage = {
        id: uuidv4(),
        url: imageUrl,
        prompt: modifiedPrompt,
        timestamp: new Date()
      };
      
      // Create refinement iteration
      const iteration: RefinementIteration = {
        userFeedback: feedback,
        modifiedPrompt,
        generatedImages: [generatedImage],
        timestamp: new Date()
      };
      
      // Update state with new refinement
      setRefinementState(prev => ({
        ...prev,
        refinementHistory: [...prev.refinementHistory, iteration],
        currentImages: [generatedImage], // Replace current images with new refinement
        isRefining: false
      }));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refine style';
      setError(errorMessage);
      setRefinementState(prev => ({ ...prev, isRefining: false }));
      throw err;
    }
  }, [refinementState.selectedOption, refinementState.refinementHistory]);

  /**
   * Confirm and finalize the style selection
   * Returns the final style option with the refined prompt if refinements were made
   */
  const confirmStyle = useCallback((): StyleOption | null => {
    if (!refinementState.selectedOption) {
      setError('No style selected to confirm');
      return null;
    }
    
    // If refinements were made, create a new StyleOption with the final refined prompt
    if (refinementState.refinementHistory.length > 0) {
      const lastRefinement = refinementState.refinementHistory[refinementState.refinementHistory.length - 1];
      const lastImage = lastRefinement.generatedImages[0];
      
      return {
        ...refinementState.selectedOption,
        prompt: lastRefinement.modifiedPrompt,
        imageUrl: lastImage.url
      };
    }
    
    // No refinements, return the original selection
    return refinementState.selectedOption;
  }, [refinementState.selectedOption, refinementState.refinementHistory]);

  return {
    refinementState,
    generateInitialStyles,
    selectStyle,
    refineStyle,
    confirmStyle,
    isGenerating,
    error
  };
}
