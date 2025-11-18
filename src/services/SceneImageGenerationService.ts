/**
 * SceneImageGenerationService - Unified service for complete scene image generation
 * 
 * Single source of truth for:
 * - Loading character reference images
 * - Building prompts with character references
 * - Generating base images with multi-modal API calls
 * - Applying text and diagram overlays
 * - Returning final composited images
 * 
 * Used by both SceneEditor (single scene) and StoriesPanel (batch generation)
 */

import type { Book } from '../models/Book';
import type { Story } from '../models/Story';
import type { Scene } from '../models/Scene';
import type { Character } from '../models/Story';
import type { DiagramStyle, DiagramPanel } from '../types/Story';
import type { PanelConfig } from '../types/Book';
import { ImageGenerationService } from './ImageGenerationService';
import { CharacterImageService } from './CharacterImageService';
import { applyAllOverlays } from './OverlayService';
import { composeSceneWithLayout } from './LayoutCompositionService';
import { formatBookStyleForPrompt } from '../types/BookStyle';
import { DEFAULT_PANEL_CONFIG } from '../types/Book';

interface SceneImageGenerationOptions {
  scene: Scene;
  story: Story;
  book: Book | null;
  model: string;
  aspectRatio?: string;
}

interface CompleteSceneImageOptions extends SceneImageGenerationOptions {
  applyOverlays?: boolean; // Default: true
}

interface CharacterWithLevel extends Character {
  isBookLevel?: boolean;
}

export class SceneImageGenerationService {
  /**
   * Convert blob URL to base64 data URL
   */
  private static async blobUrlToDataUrl(blobUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = blobUrl;
    });
  }

  /**
   * Load character reference images for a scene
   * Returns array of base64 data URLs ready for API
   */
  private static async loadCharacterReferenceImages(
    characters: CharacterWithLevel[],
    storyId: string,
    bookId: string | undefined
  ): Promise<string[]> {
    const referenceImages: string[] = [];
    
    for (const character of characters) {
      if (character.selectedImageId && character.imageGallery) {
        const selectedImage = character.imageGallery.find(img => img.id === character.selectedImageId);
        if (selectedImage) {
          try {
            // Determine if book-level or story-level character
            const storageStoryId = character.isBookLevel ? `book:${bookId}` : storyId;
            const imageUrl = await CharacterImageService.loadCharacterImage(
              storageStoryId,
              character.name,
              character.selectedImageId
            );
            
            if (imageUrl) {
              // Convert blob URL to data URL for API
              const dataUrl = await this.blobUrlToDataUrl(imageUrl);
              referenceImages.push(dataUrl);
            }
          } catch (err) {
            console.error(`Failed to load reference image for ${character.name}:`, err);
          }
        }
      }
    }
    
    return referenceImages;
  }

  /**
   * Replace macros in text
   */
  private static replaceMacros(text: string, macros: Record<string, string>): string {
    let result = text;
    Object.entries(macros).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }

  /**
   * Build prompt for scene image generation
   * Includes character descriptions and reference image notes
   */
  private static buildScenePrompt(
    scene: Scene,
    story: Story,
    book: Book | null,
    characters: CharacterWithLevel[],
    elements: Array<{ name: string; description: string }>
  ): string {
    const macros = {
      'SceneDescription': scene.description || ''
    };

    let prompt = `Create an illustration with the following requirements:\n\n`;
    
    // Book Style - visual guidelines for the entire book
    if (book?.style) {
      const styleText = formatBookStyleForPrompt(book.style);
      if (styleText) {
        prompt += `## BOOK-WIDE VISUAL STYLE (apply to all elements):\n${styleText}\n\n`;
      }
    }
    
    // Book Background Setup - applies to all stories/scenes in this book
    if (book?.backgroundSetup) {
      prompt += `## BOOK-WIDE VISUAL WORLD (applies to all scenes):\n${book.backgroundSetup}\n\n`;
    }
    
    // Story Background Setup - specific context for this story
    if (story.backgroundSetup) {
      prompt += `## STORY CONTEXT (specific to this narrative):\n${story.backgroundSetup}\n\n`;
    }
    
    // Scene Description - what happens in this specific chapter/scene
    prompt += `## THIS SCENE (Chapter/Illustration Details):\n${scene.description}\n\n`;
    
    // Characters in scene
    if (characters.length > 0) {
      prompt += `## Characters in this Scene\n`;
      for (const character of characters) {
        const characterDescription = this.replaceMacros(character.description, macros);
        prompt += `[Character Definition: ${character.name}]\n${characterDescription}\n`;
        
        // Include character image reference if available
        if (character.selectedImageId && character.imageGallery) {
          const selectedImage = character.imageGallery.find(img => img.id === character.selectedImageId);
          if (selectedImage) {
            prompt += `\nREFERENCE IMAGE PROVIDED: A reference image of ${character.name} is included with this request.`;
            prompt += `\nPlease maintain exact visual consistency with this character's appearance shown in the reference image.`;
            prompt += `\nIMPORTANT: Match ALL visual characteristics from the reference image - appearance, style, colors, proportions, and distinctive features.`;
            prompt += `\nThe character should look identical to the reference, just in this new scene and context.`;
          }
        }
        prompt += `\n\n`;
      }
    }
    
    // Elements in scene
    if (elements.length > 0) {
      prompt += `## Elements in this Scene\n`;
      elements.forEach(element => {
        const elementDescription = this.replaceMacros(element.description, macros);
        prompt += `[Object Definition: ${element.name}]\n${elementDescription}\n\n`;
      });
    }

    return prompt;
  }

  /**
   * Get image dimensions from aspect ratio string
   */
  private static getImageDimensionsFromAspectRatio(aspectRatio: string): { width: number; height: number } {
    switch (aspectRatio) {
      case '1:1':
        return { width: 1024, height: 1024 };
      case '2:3':
        return { width: 1024, height: 1536 };
      case '3:4':
        return { width: 1024, height: 1365 };
      case '9:16':
        return { width: 1024, height: 1792 };
      case '3:2':
        return { width: 1536, height: 1024 };
      case '4:3':
        return { width: 1365, height: 1024 };
      case '16:9':
        return { width: 1792, height: 1024 };
      default:
        return { width: 1024, height: 1365 };
    }
  }

  /**
   * Get diagram style for a scene
   * Checks multiple sources in order of priority:
   * 1. scene.diagramPanel.style (legacy format from import)
   * 2. story.diagramStyle (preferred location)
   */
  private static getDiagramStyle(scene: Scene, story: Story): DiagramStyle | null {
    // Check if scene has diagram panel with embedded style (legacy format)
    if (scene.diagramPanel && (scene.diagramPanel as any).style) {
      return (scene.diagramPanel as any).style;
    }
    
    // Check story-level diagram style (preferred)
    if (story.diagramStyle) {
      return story.diagramStyle;
    }
    
    return null;
  }

  /**
   * Generate base image for a scene with character reference images
   * Does NOT apply overlays - use generateCompleteSceneImage for that
   */
  static async generateSceneImage(options: SceneImageGenerationOptions): Promise<string> {
    const { scene, story, book, model, aspectRatio = '3:4' } = options;

    // Get character and element names from scene (support both new and legacy formats)
    const characterNames = scene.characters || scene.characterIds || [];
    const elementNames = scene.elements || scene.elementIds || [];
    
    // Merge book-level and story-level characters
    const allCharacters: CharacterWithLevel[] = [
      ...(book?.characters || []).map(char => ({ ...char, isBookLevel: true })),
      ...story.characters.map(char => ({ ...char, isBookLevel: false }))
    ];
    
    // Filter to get characters in this scene
    const sceneCharacters = allCharacters.filter(char => characterNames.includes(char.name));
    
    // Get elements for this scene
    const sceneElements = story.elements.filter(elem => elementNames.includes(elem.name));
    
    // Load character reference images
    const referenceImages = await this.loadCharacterReferenceImages(
      sceneCharacters,
      story.id,
      book?.id
    );
    
    // Build prompt
    const prompt = this.buildScenePrompt(scene, story, book, sceneCharacters, sceneElements);
    
    // Generate image
    const result = await ImageGenerationService.generateImage({
      prompt,
      aspectRatio,
      model,
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined
    });
    
    if (!result.success || !result.imageUrl) {
      throw new Error(result.error || 'Failed to generate image');
    }
    
    return result.imageUrl;
  }

  /**
   * UNIFIED METHOD: Generate complete scene image with all overlays applied
   * 
   * This is the single source of truth for generating scene images.
   * Both SceneEditor and batch generation should use this method.
   * 
   * Steps:
   * 1. Generate base image with character references
   * 2. Apply text panel overlay (if scene.textPanel exists)
   * 3. Apply diagram panel overlay (if scene.diagramPanel exists)
   * 4. Return final composited image
   */
  static async generateCompleteSceneImage(options: CompleteSceneImageOptions): Promise<string> {
    const { scene, story, book, model, aspectRatio = '3:4', applyOverlays = true } = options;
    
    // Step 1: Generate base image
    console.log(`🎨 Generating base image for scene: "${scene.title}"`);
    const baseImageUrl = await this.generateSceneImage({
      scene,
      story,
      book,
      model,
      aspectRatio
    });
    
    // If overlays not requested, return base image
    if (!applyOverlays) {
      return baseImageUrl;
    }
    
    // Step 2: Check for overlays
    const hasTextPanel = scene.textPanel && scene.textPanel.trim();
    const hasDiagramPanel = scene.diagramPanel && scene.diagramPanel.content && scene.diagramPanel.content.trim();
    
    if (!hasTextPanel && !hasDiagramPanel) {
      console.log('✓ No overlays needed, returning base image');
      return baseImageUrl;
    }
    
    // Step 3: Apply overlays
    console.log(`🖼️  Applying overlays to scene: "${scene.title}"`);
    if (hasTextPanel) {
      console.log('  - Text panel: YES');
    }
    if (hasDiagramPanel) {
      console.log('  - Diagram panel: YES');
    }
    
    try {
      const imageDimensions = this.getImageDimensionsFromAspectRatio(aspectRatio);
      
      // CHECK IF SCENE HAS CUSTOM LAYOUT
      if (scene.layout) {
        console.log('🎨 Using custom layout:', scene.layout.type);
        return await this.applyCustomLayout(baseImageUrl, scene, story, book);
      }
      
      // FALL BACK TO DEFAULT OVERLAY APPROACH
      console.log('🎨 Using default overlay approach');
      const overlayOptions: any = {
        imageWidth: imageDimensions.width,
        imageHeight: imageDimensions.height
      };
      
      // Add text panel if present
      if (hasTextPanel) {
        const macros = { 'SceneDescription': scene.description };
        const panelText = this.replaceMacros(scene.textPanel!, macros);
        const panelConfig: PanelConfig = book?.style?.panelConfig || DEFAULT_PANEL_CONFIG;
        
        overlayOptions.textPanel = {
          text: panelText,
          config: panelConfig
        };
      }
      
      // Add diagram panel if present
      if (hasDiagramPanel) {
        // Get diagram style from scene or story (handles both formats)
        const diagramStyle = this.getDiagramStyle(scene, story);
        
        if (diagramStyle) {
          // Extract just the DiagramPanel fields (remove embedded style if present)
          const diagramPanel: DiagramPanel = {
            type: scene.diagramPanel.type,
            content: scene.diagramPanel.content,
            language: scene.diagramPanel.language
          };
          
          overlayOptions.diagramPanel = {
            panel: diagramPanel,
            style: diagramStyle
          };
        } else {
          console.warn('⚠️  Scene has diagramPanel but no diagramStyle found (checked scene.diagramPanel.style and story.diagramStyle)');
        }
      }
      
      // Apply all overlays at once
      const finalImageUrl = await applyAllOverlays(baseImageUrl, overlayOptions);
      console.log('✓ Overlays applied successfully');
      
      return finalImageUrl;
    } catch (overlayError) {
      console.error('❌ Error applying overlays:', overlayError);
      console.warn('⚠️  Returning base image without overlays');
      // Return base image if overlay fails
      return baseImageUrl;
    }
  }

  /**
   * Apply custom layout to scene
   * Renders panels separately and composes them according to layout configuration
   */
  private static async applyCustomLayout(
    baseImageUrl: string,
    scene: Scene,
    story: Story,
    book: Book | null
  ): Promise<string> {
    const { createTextPanel } = await import('./OverlayService');
    const { renderDiagramToCanvas } = await import('./DiagramRenderService');
    
    const layout = scene.layout!;
    let textPanelDataUrl: string | null = null;
    let diagramPanelDataUrl: string | null = null;

    // Render text panel if present
    if (scene.textPanel && layout.elements.textPanel) {
      console.log('  Rendering text panel for layout...');
      const macros = { 'SceneDescription': scene.description };
      const panelText = this.replaceMacros(scene.textPanel, macros);
      const panelConfig: PanelConfig = book?.style?.panelConfig || DEFAULT_PANEL_CONFIG;
      
      try {
        const textPanelBitmap = await createTextPanel(panelText, {
          width: layout.elements.textPanel.width,
          height: layout.elements.textPanel.height,
          bgColor: panelConfig.backgroundColor,
          borderColor: panelConfig.borderColor,
          borderWidth: panelConfig.borderWidth,
          borderRadius: panelConfig.borderRadius,
          padding: panelConfig.padding,
          fontFamily: panelConfig.fontFamily,
          fontSize: panelConfig.fontSize,
          fontColor: panelConfig.textColor,
          textAlign: panelConfig.textAlign as CanvasTextAlign
        });
        
        // Convert ImageBitmap to data URL
        const canvas = document.createElement('canvas');
        canvas.width = textPanelBitmap.width;
        canvas.height = textPanelBitmap.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(textPanelBitmap, 0, 0);
          textPanelDataUrl = canvas.toDataURL('image/png');
          console.log('  ✓ Text panel rendered');
        }
      } catch (error) {
        console.error('  ❌ Failed to render text panel:', error);
      }
    }

    // Render diagram panel if present
    if (scene.diagramPanel && layout.elements.diagramPanel) {
      console.log('  Rendering diagram panel for layout...');
      const diagramStyle = this.getDiagramStyle(scene, story);
      
      if (diagramStyle) {
        const diagramPanel: DiagramPanel = {
          type: scene.diagramPanel.type,
          content: scene.diagramPanel.content,
          language: scene.diagramPanel.language
        };
        
        try {
          const diagramCanvas = await renderDiagramToCanvas(
            diagramPanel,
            diagramStyle,
            layout.elements.diagramPanel.width,
            layout.elements.diagramPanel.height
          );
          
          diagramPanelDataUrl = diagramCanvas.toDataURL('image/png');
          console.log('  ✓ Diagram panel rendered');
        } catch (error) {
          console.error('  ❌ Failed to render diagram panel:', error);
        }
      }
    }

    // Compose all elements according to layout
    console.log('  Composing scene with custom layout...');
    const composedImageUrl = await composeSceneWithLayout(
      baseImageUrl,
      textPanelDataUrl,
      diagramPanelDataUrl,
      layout
    );
    console.log('  ✓ Scene composed with custom layout');
    
    return composedImageUrl;
  }
}

