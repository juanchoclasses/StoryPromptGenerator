/**
 * useImageGeneration Hook
 * 
 * Manages image generation state and workflow for scenes.
 * Coordinates with SceneImageGenerationService and ImageStorageService.
 * 
 * Features:
 * - Generation state management
 * - Error handling
 * - Preview data building
 * - Image storage coordination
 * - Scene update coordination
 */

import { useState, useCallback } from 'react';
import type { Scene, Story } from '../types/Story';
import type { Character } from '../models/Story';
import type { PreviewData } from '../components/ImageGenerationPreviewDialog';
import { SceneImageGenerationService } from '../services/SceneImageGenerationService';
import { ImageStorageService } from '../services/ImageStorageService';
import { BookService } from '../services/BookService';
import { DEFAULT_PANEL_CONFIG } from '../types/Book';

export interface UseImageGenerationReturn {
  // State
  isGenerating: boolean;
  generationError: string | null;
  previewData: PreviewData | null;
  
  // Actions
  startGeneration: (modelId: string, promptStrategy?: 'auto' | 'legacy' | 'gemini') => Promise<void>;
  cancelGeneration: () => void;
  clearError: () => void;
  
  // Preview
  buildPreview: (modelId: string, promptStrategy?: 'auto' | 'legacy' | 'gemini') => Promise<PreviewData>;
}

/**
 * Custom hook for managing image generation workflow
 * 
 * @param scene - Current scene being edited
 * @param story - Parent story for context
 * @param onImageStateChange - Callback when image state changes
 * @param onSceneUpdate - Callback when scene is updated
 * @returns Image generation state and actions
 */
export function useImageGeneration(
  scene: Scene,
  story: Story,
  onImageStateChange: (imageUrl: string | null, onSave: () => void, onClear: () => void) => void,
  onSceneUpdate: () => void
): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  /**
   * Build preview data for the preview dialog
   */
  const buildPreview = useCallback(async (
    modelId: string,
    promptStrategy?: 'auto' | 'legacy' | 'gemini'
  ): Promise<PreviewData> => {
    const activeBookId = await BookService.getActiveBookId();
    const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
    
    // Calculate aspect ratio
    let aspectRatio: string;
    if (scene?.layout) {
      const canvasWidth = scene.layout.canvas.width;
      const canvasHeight = scene.layout.canvas.height;
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(canvasWidth, canvasHeight);
      const ratioWidth = canvasWidth / divisor;
      const ratioHeight = canvasHeight / divisor;
      aspectRatio = `${ratioWidth}:${ratioHeight}`;
    } else {
      aspectRatio = activeBook?.aspectRatio || '3:4';
    }
    
    // Generate the full prompt with model and strategy
    const selectedCharacterNames = scene.characters || [];
    const selectedElementNames = scene.elements || [];
    
    // Merge book-level and story-level characters
    const bookCharacters = (activeBook?.characters || []).map((c: any) => ({ ...c, isBookLevel: true }));
    const storyCharacters = (story.characters || []).map((c: any) => ({ ...c, isBookLevel: false }));
    const availableCharacters = [...bookCharacters, ...storyCharacters];
    
    const selectedCast = availableCharacters.filter(char => 
      selectedCharacterNames.includes(char.name)
    );
    
    const selectedElements = (story.elements || []).filter(elem => 
      selectedElementNames.includes(elem.name)
    );
    
    // Prepare characters with isBookLevel flag
    const charactersWithLevel = selectedCast.map(char => {
      const charWithImages = char as unknown as Character;
      const isBookLevel = activeBook?.characters?.some((bookChar: any) => bookChar.name === char.name) || false;
      return {
        ...charWithImages,
        isBookLevel
      };
    });
    
    // Prepare elements array
    const elementsForPrompt = selectedElements.map(elem => ({
      name: elem.name,
      description: elem.description
    }));
    
    const prompt = await SceneImageGenerationService.buildScenePrompt(
      scene,
      story,
      activeBook,
      charactersWithLevel,
      elementsForPrompt,
      modelId,
      promptStrategy
    );
    
    // Load character images
    const characterImages: Array<{ name: string; url: string }> = [];
    for (const charName of selectedCharacterNames) {
      let character = story?.characters?.find(c => c.name === charName);
      if (!character && activeBook) {
        character = activeBook.characters?.find((c: any) => c.name === charName);
      }
      
      if (character) {
        const charWithImages = character as unknown as Character;
        if (charWithImages.selectedImageId && charWithImages.imageGallery) {
          const selectedImage = charWithImages.imageGallery.find(img => img.id === charWithImages.selectedImageId);
          if (selectedImage) {
            try {
              const imageUrl = await ImageStorageService.getImage(selectedImage.id);
              if (imageUrl) {
                characterImages.push({
                  name: character.name,
                  url: imageUrl
                });
              }
            } catch (error) {
              console.warn(`Failed to load image for character ${character.name}:`, error);
            }
          }
        }
      }
    }
    
    const preview: PreviewData = {
      sceneTitle: scene?.title || 'Untitled Scene',
      sceneDescription: scene?.description || '',
      prompt,
      characterImages,
      aspectRatio,
      model: modelId
    };
    
    setPreviewData(preview);
    return preview;
  }, [scene, story]);

  /**
   * Start image generation
   */
  const startGeneration = useCallback(async (
    modelId: string,
    promptStrategy?: 'auto' | 'legacy' | 'gemini'
  ) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Get the active book to retrieve aspect ratio and panel config
      const activeBookId = await BookService.getActiveBookId();
      const activeBook = activeBookId ? await BookService.getBook(activeBookId) : null;
      
      // Check if scene has custom layout - if so, calculate aspect ratio from canvas dimensions
      let aspectRatio: string;
      if (scene?.layout) {
        const canvasWidth = scene.layout.canvas.width;
        const canvasHeight = scene.layout.canvas.height;
        // Calculate GCD to get simplest ratio
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(canvasWidth, canvasHeight);
        const ratioWidth = canvasWidth / divisor;
        const ratioHeight = canvasHeight / divisor;
        aspectRatio = `${ratioWidth}:${ratioHeight}`;
        console.log(`🎨 Using aspect ratio from layout canvas: ${canvasWidth}x${canvasHeight} = ${aspectRatio}`);
      } else {
        aspectRatio = activeBook?.aspectRatio || '3:4';
        console.log(`📐 Using book's default aspect ratio: ${aspectRatio}`);
      }
      
      // Generate the complete scene image
      const finalImageUrl = await SceneImageGenerationService.generateCompleteSceneImage({
        scene: scene,
        story: story,
        book: activeBook,
        model: modelId,
        aspectRatio,
        promptStrategy
      });
      
      // Save generated image to scene in local storage
      if (story && scene) {
        const activeBookData = await BookService.getActiveBookData();
        if (activeBookData) {
          // Create new GeneratedImage entry with the model that was used
          const imageId = crypto.randomUUID();
          const newGeneratedImage = {
            id: imageId,
            modelName: modelId,
            timestamp: new Date()
          };
          
          // Store image to filesystem for persistence
          await ImageStorageService.storeImage(
            imageId,
            scene.id,
            finalImageUrl,
            modelId
          );
          
          // Load the image back from filesystem to ensure we're displaying the persisted version
          const persistedImageUrl = await ImageStorageService.getImage(imageId);
          
          const updatedStories = activeBookData.stories.map(s => {
            if (s.id === story.id) {
              const updatedScenes = s.scenes.map(scn => {
                if (scn.id === scene.id) {
                  // Get existing imageHistory or create new array
                  const existingHistory = scn.imageHistory || [];
                  
                  // Add new image to history (keep last 20 images max)
                  const updatedHistory = [...existingHistory, newGeneratedImage].slice(-20);
                  
                  return { 
                    ...scn, 
                    lastGeneratedImage: finalImageUrl, // Keep for backward compatibility
                    imageHistory: updatedHistory,
                    updatedAt: new Date() 
                  };
                }
                return scn;
              });
              return { ...s, scenes: updatedScenes, updatedAt: new Date() };
            }
            return s;
          });
          
          const updatedData = { ...activeBookData, stories: updatedStories };
          await BookService.saveActiveBookData(updatedData);
          
          // Notify parent components
          if (persistedImageUrl) {
            onImageStateChange(persistedImageUrl, () => {}, () => {});
          }
          onSceneUpdate();
        }
      }
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating image:', error);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error');
      setIsGenerating(false);
      throw error;
    }
  }, [scene, story, onImageStateChange, onSceneUpdate]);

  /**
   * Cancel ongoing generation
   * Note: Currently a no-op as we don't have cancellation support in the service
   */
  const cancelGeneration = useCallback(() => {
    // TODO: Implement cancellation when service supports it
    console.log('Cancellation requested (not yet implemented)');
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setGenerationError(null);
  }, []);

  return {
    isGenerating,
    generationError,
    previewData,
    startGeneration,
    cancelGeneration,
    clearError,
    buildPreview
  };
}
