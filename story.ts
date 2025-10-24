/**
 * Story Definition Utility
 * 
 * This file provides utilities for defining stories programmatically
 * with automatic character and element reference extraction.
 * 
 * Usage:
 * 1. Define characters using `{CharacterName}` in descriptions
 * 2. Define elements using `{ElementName}` in descriptions
 * 3. Export story data that can be imported into the application
 */

export interface StoryCharacter {
  name: string;
  description: string;
}

export interface StoryElement {
  name: string;
  description: string;
  category?: string;
}

export interface StoryScene {
  title: string;
  description: string;
  textPanel?: string;
}

export interface StoryDefinition {
  story: {
    title: string;
    backgroundSetup: string;
  };
  characters: StoryCharacter[];
  elements: StoryElement[];
  scenes: StoryScene[];
}

/**
 * Extract character references from text in the format {CharacterName}
 */
export function extractCharacterReferences(text: string): string[] {
  const matches = text.matchAll(/\{([^}]+)\}/g);
  const references: string[] = [];
  
  for (const match of matches) {
    const ref = match[1].trim();
    if (!references.includes(ref)) {
      references.push(ref);
    }
  }
  
  return references;
}

/**
 * Extract element references from text in the format {ElementName}
 * Elements are distinguished from characters by checking against the element list
 */
export function extractElementReferences(text: string, elementNames: string[]): string[] {
  const allReferences = extractCharacterReferences(text);
  return allReferences.filter(ref => elementNames.includes(ref));
}

/**
 * Extract only character references (excluding elements)
 */
export function extractOnlyCharacterReferences(
  text: string,
  characterNames: string[],
  elementNames: string[]
): string[] {
  const allReferences = extractCharacterReferences(text);
  // Remove element references
  const withoutElements = allReferences.filter(ref => !elementNames.includes(ref));
  // Only include valid character names
  return withoutElements.filter(ref => characterNames.includes(ref));
}

/**
 * Validate that all references in scenes exist in character/element lists
 */
export function validateStoryReferences(story: StoryDefinition): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const characterNames = story.characters.map(c => c.name);
  const elementNames = story.elements.map(e => e.name);
  
  story.scenes.forEach((scene, index) => {
    const references = extractCharacterReferences(scene.description);
    
    references.forEach(ref => {
      if (!characterNames.includes(ref) && !elementNames.includes(ref)) {
        errors.push(
          `Scene ${index + 1} ("${scene.title}"): Reference {${ref}} not found in characters or elements`
        );
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Convert a StoryDefinition to the JSON import format
 * This processes {Reference} syntax into character/element arrays
 */
export function toImportFormat(story: StoryDefinition): any {
  const characterNames = story.characters.map(c => c.name);
  const elementNames = story.elements.map(e => e.name);
  
  const scenes = story.scenes.map(scene => {
    const allReferences = extractCharacterReferences(scene.description);
    const characters = allReferences.filter(ref => characterNames.includes(ref));
    const elements = allReferences.filter(ref => elementNames.includes(ref));
    
    return {
      title: scene.title,
      description: scene.description,
      characters,
      elements,
      textPanel: scene.textPanel || ''
    };
  });
  
  return {
    story: story.story,
    characters: story.characters,
    elements: story.elements,
    scenes
  };
}

/**
 * Helper to create a story definition with validation
 */
export function createStory(definition: StoryDefinition): {
  story: StoryDefinition;
  validation: ReturnType<typeof validateStoryReferences>;
} {
  const validation = validateStoryReferences(definition);
  
  if (!validation.valid) {
    console.warn('Story validation warnings:', validation.errors);
  }
  
  return {
    story: definition,
    validation
  };
}

