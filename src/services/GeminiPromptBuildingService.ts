/**
 * GeminiPromptBuildingService - Structured prompting for Gemini Imagen 3 (Nano Banana Pro)
 * 
 * This service implements Google's official prompting guidelines for Nano Banana Pro,
 * built on Gemini 3. According to Google's blog post, the model excels with structured,
 * detailed prompts that go beyond simple descriptions.
 * 
 * Official guidance: https://blog.google/products/gemini/prompting-tips-nano-banana-pro/
 * 
 * Key principles:
 * 1. Move beyond simple prompts - be specific and detailed
 * 2. Include: Subject, Composition, Action, Location, Style
 * 3. Add advanced elements: Camera/lighting, text integration, factual constraints
 * 4. Define reference image roles clearly when using multi-modal input
 * 
 * Benefits over simple concatenation:
 * - Better text rendering and integration
 * - More accurate real-world knowledge application
 * - Professional-grade control over composition and lighting
 * - Consistent character appearance across scenes
 */

import {
  PromptBuildingService,
  type ScenePromptOptions,
  type CharacterPromptOptions,
  type PromptBuildingResult
} from './PromptBuildingService';

export class GeminiPromptBuildingService extends PromptBuildingService {
  /**
   * Build scene prompt using Gemini's structured approach
   * 
   * Structure:
   * 1. Reference images (if any) - define role of each
   * 2. Subject (who/what)
   * 3. Composition (framing, aspect ratio)
   * 4. Action (what's happening)
   * 5. Location (where)
   * 6. Style (aesthetic, camera, lighting)
   * 7. Factual constraints (for accuracy)
   */
  buildScenePrompt(options: ScenePromptOptions): PromptBuildingResult {
    const { scene, story, book, characters, elements, hasReferenceImages, charactersWithImages } = options;
    
    const sections: string[] = [];
    const warnings: string[] = [];

    // 1. REFERENCE IMAGES (if provided)
    // Google guidance: "Clearly define the role of each reference image"
    if (hasReferenceImages && charactersWithImages && charactersWithImages.length > 0) {
      sections.push('reference_images');
      const refSection = this.buildReferenceSection(charactersWithImages);
      warnings.push(`${charactersWithImages.length} reference image(s) provided - character consistency expected`);
    }

    // 2. SUBJECT - Who or what is in the image? Be specific.
    sections.push('subject');
    const subjectSection = this.buildSubjectSection(characters, elements, hasReferenceImages, charactersWithImages);

    // 3. COMPOSITION - How is the shot framed? Include aspect ratio.
    sections.push('composition');
    const compositionSection = this.buildCompositionSection(scene, story);

    // 4. ACTION - What is happening?
    sections.push('action');
    const actionSection = this.buildActionSection(scene);

    // 5. LOCATION - Where does the scene take place?
    sections.push('location');
    const locationSection = this.buildLocationSection(story, scene);

    // 6. STYLE - Overall aesthetic, camera, lighting details
    sections.push('style');
    const styleSection = this.buildStyleSection(book, scene);

    // 7. FACTUAL CONSTRAINTS - For diagrams/infographics
    if (scene.diagramPanel) {
      sections.push('constraints');
      warnings.push('Diagram included - factual accuracy constraints added');
    }

    // 8. TECHNICAL REQUIREMENTS
    sections.push('requirements');

    // Assemble the complete prompt
    let prompt = '';

    // Reference images first (most important per Google)
    if (hasReferenceImages && charactersWithImages && charactersWithImages.length > 0) {
      prompt += `REFERENCE IMAGES:\n`;
      prompt += `I am providing ${charactersWithImages.length} reference image(s). Use them as follows:\n`;
      charactersWithImages.forEach((char, index) => {
        prompt += `• Image ${index + 1}: Shows "${char.name}" - Use this exact character design for ${char.name}'s appearance\n`;
      });
      prompt += `\nMaintain these character designs exactly as shown in the reference images.\n\n`;
      prompt += `---\n\n`;
    }

    // Subject
    prompt += `SUBJECT:\n${subjectSection}\n\n`;

    // Composition
    prompt += `COMPOSITION:\n${compositionSection}\n\n`;

    // Action
    prompt += `ACTION:\n${actionSection}\n\n`;

    // Location
    prompt += `LOCATION:\n${locationSection}\n\n`;

    // Style
    prompt += `STYLE:\n${styleSection}\n\n`;

    // Constraints (for diagrams)
    if (scene.diagramPanel) {
      prompt += `FACTUAL CONSTRAINTS:\n`;
      prompt += `• Ensure scientific/technical accuracy for any diagrams or data visualizations\n`;
      prompt += `• Render text clearly and legibly\n`;
      prompt += `• Maintain professional diagram standards\n\n`;
    }

    // Requirements
    prompt += `REQUIREMENTS:\n`;
    prompt += `• Create a single, cohesive illustration capturing the described scene\n`;
    prompt += `• Ensure all mentioned subjects and elements are visible and recognizable\n`;
    prompt += `• Maintain visual balance and professional composition\n`;
    prompt += `• Apply consistent lighting and style throughout\n`;
    if (hasReferenceImages) {
      prompt += `• ⚠️ CRITICAL: Character appearances must exactly match the reference images\n`;
    }
    prompt += `• Do not include text labels, scene numbers, or watermarks in the generated image\n`;

    return {
      prompt: prompt.trim(),
      metadata: {
        strategy: 'gemini',
        sections,
        estimatedTokens: this.estimateTokens(prompt),
        warnings
      }
    };
  }

  /**
   * Build character prompt using Gemini's structured approach
   * 
   * For character generation on white background (for character auditions)
   */
  buildCharacterPrompt(options: CharacterPromptOptions): PromptBuildingResult {
    const { character, storyBackgroundSetup, book, hasReferenceImage } = options;
    
    const sections: string[] = ['subject', 'composition', 'location', 'style', 'requirements'];
    const warnings: string[] = [];

    let prompt = '';

    // Reference image (if provided)
    if (hasReferenceImage) {
      sections.unshift('reference_image');
      prompt += `REFERENCE IMAGE:\n`;
      prompt += `I am providing a reference image. Use it as inspiration for this character's appearance,\n`;
      prompt += `maintaining consistency with the reference style and key features.\n\n`;
      prompt += `---\n\n`;
      warnings.push('Reference image provided - consistency expected');
    }

    // Subject
    prompt += `SUBJECT:\n`;
    prompt += `Generate a character named "${character.name}".\n`;
    prompt += `Character description: ${character.description || 'A character'}\n`;
    if (storyBackgroundSetup && storyBackgroundSetup.trim()) {
      prompt += `\nStory context: ${storyBackgroundSetup}\n`;
    }
    prompt += `\n`;

    // Composition
    prompt += `COMPOSITION:\n`;
    prompt += `• Portrait or full-body view, centered in frame\n`;
    prompt += `• 1:1 square aspect ratio (character audition format)\n`;
    prompt += `• Character should be clearly visible with good framing\n\n`;

    // Location
    prompt += `LOCATION:\n`;
    prompt += `• Plain white background\n`;
    prompt += `• Studio-style setup with even, professional lighting\n`;
    prompt += `• No scene elements, props, or environmental details\n\n`;

    // Style
    const bookStyle = this.formatBookStyle(book);
    prompt += `STYLE:\n`;
    if (bookStyle) {
      prompt += `${bookStyle}\n`;
    } else {
      prompt += `• Professional character illustration\n`;
    }
    prompt += `• Clean, well-lit character on white background\n`;
    prompt += `• Focus on character's distinctive features and personality\n`;
    if (hasReferenceImage) {
      prompt += `• Maintain consistency with reference image style\n`;
    }
    prompt += `\n`;

    // Requirements
    prompt += `REQUIREMENTS:\n`;
    prompt += `• Generate character on a pure white background (#FFFFFF)\n`;
    prompt += `• Character should be well-lit and clearly visible\n`;
    prompt += `• Capture the character's unique features and personality\n`;
    prompt += `• Center the character in the image\n`;
    prompt += `• No text, labels, scene elements, or additional characters\n`;
    if (hasReferenceImage) {
      prompt += `• Maintain consistency with the provided reference image\n`;
    }

    return {
      prompt: prompt.trim(),
      metadata: {
        strategy: 'gemini',
        sections,
        estimatedTokens: this.estimateTokens(prompt),
        warnings
      }
    };
  }

  /**
   * Build subject section (who/what is in the image)
   */
  private buildSubjectSection(
    characters: any[],
    elements: any[],
    hasReferenceImages: boolean,
    charactersWithImages?: any[]
  ): string {
    let section = '';

    if (characters.length > 0) {
      section += 'Characters:\n';
      characters.forEach(char => {
        const hasRefImage = hasReferenceImages && 
                           charactersWithImages?.some(c => c.name === char.name);
        const refNote = hasRefImage ? ' [Reference image provided]' : '';
        const level = char.isBookLevel ? ' (recurring character)' : '';
        section += `• ${char.name}${level}${refNote}: ${char.description}\n`;
      });
    }

    if (elements.length > 0) {
      if (characters.length > 0) section += '\n';
      section += 'Scene elements:\n';
      elements.forEach(elem => {
        const category = elem.category ? ` (${elem.category})` : '';
        section += `• ${elem.name}${category}: ${elem.description}\n`;
      });
    }

    return section.trim();
  }

  /**
   * Build composition section (framing, aspect ratio)
   */
  private buildCompositionSection(scene: any, story: any): string {
    let section = '';

    // Try to infer composition from scene description
    section += `• Create a well-composed scene with balanced framing\n`;
    
    // Add aspect ratio if specified in scene layout
    if (scene.layout?.canvas?.aspectRatio) {
      section += `• Aspect ratio: ${scene.layout.canvas.aspectRatio}\n`;
    }

    // Additional composition notes
    section += `• Ensure all subjects and elements are clearly visible\n`;
    section += `• Use professional cinematographic principles for shot composition\n`;

    return section.trim();
  }

  /**
   * Build action section (what is happening)
   */
  private buildActionSection(scene: any): string {
    // Extract action from scene description
    // The scene description contains both action and description
    return scene.description || 'A moment captured in this scene';
  }

  /**
   * Build location section (where)
   */
  private buildLocationSection(story: any, scene: any): string {
    // Location comes from story background setup and scene description
    return story.backgroundSetup || 'A setting appropriate to the scene';
  }

  /**
   * Build style section (aesthetic, camera, lighting)
   */
  private buildStyleSection(book: any, scene: any): string {
    let section = '';

    // Book style
    const bookStyle = this.formatBookStyle(book);
    if (bookStyle) {
      section += `Visual style:\n${bookStyle}\n\n`;
    }

    // Camera and lighting details (professional cinematographic approach)
    section += `Camera and lighting:\n`;
    section += `• Professional cinematography with appropriate depth of field\n`;
    section += `• Lighting that enhances mood and visibility\n`;
    section += `• Color grading consistent with the overall style\n`;

    return section.trim();
  }

  /**
   * Build reference images section
   */
  private buildReferenceSection(charactersWithImages: any[]): string {
    let section = `The following reference images are provided:\n`;
    charactersWithImages.forEach((char, index) => {
      section += `${index + 1}. ${char.name} - Use this character design exactly\n`;
    });
    return section.trim();
  }

  /**
   * Get strategy name
   */
  getStrategyName(): string {
    return 'Gemini Imagen 3 (Nano Banana Pro)';
  }

  /**
   * Get strategy description
   */
  getStrategyDescription(): string {
    return 'Structured prompting optimized for Gemini Imagen 3 (Nano Banana Pro). Uses Google\'s recommended format: Subject → Composition → Action → Location → Style → Constraints. Achieves professional results with advanced text rendering, real-world knowledge, and studio-quality control.';
  }

  /**
   * Check if suitable for model
   */
  isSuitableForModel(modelId: string): boolean {
    const geminiModels = ['gemini', 'imagen', 'nano-banana', 'nanobanana'];
    return geminiModels.some(model => modelId.toLowerCase().includes(model));
  }
}

