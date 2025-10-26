import type { Story, Character, StoryElement, Scene } from '../types/Story';

/**
 * Exchange format - matches the JSON import schema
 * This is the portable, human-readable format for stories
 */
export interface StoryExchangeFormat {
  story: {
    title: string;
    backgroundSetup: string;
    description?: string;
  };
  characters: Array<{
    name: string;
    description: string;
  }>;
  elements: Array<{
    name: string;
    description: string;
    category?: string;
  }>;
  scenes: Array<{
    title: string;
    description: string;
    textPanel?: string;
    characters: string[];  // Character names
    elements: string[];    // Element names
  }>;
}

export class StoryExportService {
  /**
   * Convert internal Story format to exchange format (name-based)
   */
  static toExchangeFormat(story: Story): StoryExchangeFormat {
    // Create lookup maps
    const characterMap = new Map<string, Character>();
    story.characters.forEach(char => {
      characterMap.set(char.id, char);
    });
    
    const elementMap = new Map<string, StoryElement>();
    story.elements.forEach(elem => {
      elementMap.set(elem.id, elem);
    });
    
    // Convert to exchange format
    return {
      story: {
        title: story.title,
        backgroundSetup: story.backgroundSetup,
        ...(story.description && { description: story.description })
      },
      characters: story.characters.map(char => ({
        name: char.name,
        description: char.description
      })),
      elements: story.elements.map(elem => ({
        name: elem.name,
        description: elem.description,
        ...(elem.category && { category: elem.category })
      })),
      scenes: story.scenes.map(scene => ({
        title: scene.title,
        description: scene.description,
        ...(scene.textPanel && { textPanel: scene.textPanel }),
        characters: scene.characterIds
          .map(id => characterMap.get(id)?.name)
          .filter((name): name is string => name !== undefined),
        elements: scene.elementIds
          .map(id => elementMap.get(id)?.name)
          .filter((name): name is string => name !== undefined)
      }))
    };
  }
  
  /**
   * Export story to JSON and trigger download
   */
  static downloadStoryAsJson(story: Story): void {
    const exchangeFormat = this.toExchangeFormat(story);
    const jsonString = JSON.stringify(exchangeFormat, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const filename = `${story.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

