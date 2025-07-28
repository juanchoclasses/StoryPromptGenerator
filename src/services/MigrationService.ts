import type { StoryData, Story, Scene, Character } from '../types/Story';
import { CURRENT_VERSION } from '../types/Story';

export interface MigrationResult {
  success: boolean;
  data: StoryData;
  migrated: boolean;
  errors: string[];
}

export class MigrationService {
  /**
   * Migrates data from any version to the current version
   */
  static migrateData(data: any): MigrationResult {
    const result: MigrationResult = {
      success: false,
      data: this.getDefaultData(),
      migrated: false,
      errors: []
    };

    try {
      // If no version, assume it's the oldest version (pre-versioning)
      const version = data.version || '0.0.0';
      
      if (version === CURRENT_VERSION) {
        // Already current version
        result.data = this.parseCurrentVersion(data);
        result.success = true;
        return result;
      }

      // Migrate through versions
      let migratedData = data;
      
      if (this.isVersionOlder(version, '1.0.0')) {
        migratedData = this.migrateToV1_0_0(migratedData);
        result.migrated = true;
      }

      if (this.isVersionOlder(version, '2.0.0')) {
        migratedData = this.migrateToV2_0_0(migratedData);
        result.migrated = true;
      }

      // Add more migrations here as needed
      // if (this.isVersionOlder(version, '2.1.0')) {
      //   migratedData = this.migrateToV2_1_0(migratedData);
      //   result.migrated = true;
      // }

      result.data = this.parseCurrentVersion(migratedData);
      result.success = true;
      
    } catch (error) {
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Migration error:', error);
    }

    return result;
  }

  /**
   * Migrate from pre-versioning to v1.0.0
   */
  private static migrateToV1_0_0(data: any): any {
    // Handle the old single-story format
    if (data.backgroundSetup !== undefined && data.scenes !== undefined) {
      // This is the old single-story format
      const { cast, scenes } = this.migrateScenesWithCharacters(data.scenes || []);
      
      const oldStory: Story = {
        id: crypto.randomUUID(),
        title: 'Migrated Story',
        backgroundSetup: data.backgroundSetup || '',
        scenes: scenes,
        createdAt: new Date(data.lastUpdated || Date.now()),
        updatedAt: new Date()
      };

      return {
        version: '1.0.0',
        stories: [oldStory],
        characters: cast, // Move characters to global level
        elements: [], // Initialize empty global elements array
        lastUpdated: new Date()
      };
    }

    // Handle the old multi-story format without version
    if (data.stories !== undefined) {
      // Collect all characters and elements from all stories
      const allCharacters: Character[] = [];
      const allElements: StoryElement[] = [];
      const migratedStories: Story[] = [];

      data.stories.forEach((story: any) => {
        // Extract characters and elements directly from the story
        if (story.cast && Array.isArray(story.cast)) {
          allCharacters.push(...story.cast);
        }
        if (story.elements && Array.isArray(story.elements)) {
          allElements.push(...story.elements);
        }
        
        // Create story without cast and elements
        const { cast: _cast, elements: _elements, ...storyWithoutCast } = story;
        migratedStories.push({
          ...storyWithoutCast,
          createdAt: new Date(story.createdAt || Date.now()),
          updatedAt: new Date(story.updatedAt || Date.now())
        });
      });

      return {
        version: '1.0.0',
        stories: migratedStories,
        characters: allCharacters,
        elements: allElements,
        lastUpdated: new Date(data.lastUpdated || Date.now())
      };
    }

    // Unknown format, return default
    return this.getDefaultData();
  }

  /**
   * Migrate from v1.0.0 to v2.0.0 (global characters/elements)
   */
  private static migrateToV2_0_0(data: any): any {
    console.log('Migrating from v1.0.0 to v2.0.0 (global characters/elements)...');
    
    // Collect all characters and elements from all stories
    const allCharacters: Character[] = [];
    const allElements: StoryElement[] = [];
    const migratedStories: Story[] = [];

    data.stories.forEach((story: any) => {
      // Extract characters and elements directly from the story
      if (story.cast && Array.isArray(story.cast)) {
        allCharacters.push(...story.cast);
      }
      if (story.elements && Array.isArray(story.elements)) {
        allElements.push(...story.elements);
      }
      
      // Create story without cast and elements
      const { cast: _cast, elements: _elements, ...storyWithoutCast } = story;
      migratedStories.push({
        ...storyWithoutCast,
        createdAt: new Date(story.createdAt || Date.now()),
        updatedAt: new Date(story.updatedAt || Date.now())
      });
    });

    return {
      version: '2.0.0',
      stories: migratedStories,
      characters: allCharacters,
      elements: allElements,
      lastUpdated: new Date(data.lastUpdated || Date.now())
    };
  }



  /**
   * Migrate a story with characters to current format
   */
  private static migrateStoryWithCharacters(story: any): Story {
    const { cast, scenes } = this.migrateScenesWithCharacters(story.scenes || []);
    
    return {
      id: story.id || crypto.randomUUID(),
      title: story.title || 'Untitled Story',
      description: story.description || '',
      backgroundSetup: story.backgroundSetup || '',
      cast: cast,
      elements: [], // Initialize empty elements array
      scenes: scenes,
      createdAt: new Date(story.createdAt || Date.now()),
      updatedAt: new Date(story.updatedAt || Date.now())
    };
  }

  /**
   * Migrate scenes with characters to global cast
   */
  private static migrateScenesWithCharacters(scenes: any[]): { cast: Character[], scenes: Scene[] } {
    const cast: Character[] = [];
    const characterIdMap = new Map<string, string>(); // old ID -> new ID mapping
    
    // First pass: collect all unique characters and create new IDs
    scenes.forEach((scene: any) => {
      if (scene.characters) {
        scene.characters.forEach((character: any) => {
          if (!characterIdMap.has(character.id)) {
            const newId = crypto.randomUUID();
            characterIdMap.set(character.id, newId);
            cast.push({
              id: newId,
              name: character.name || 'Unnamed Character',
              description: character.description || ''
            });
          }
        });
      }
    });
    
    // Second pass: create scenes with character ID references
    const migratedScenes = scenes.map((scene: any) => ({
      id: scene.id || crypto.randomUUID(),
      title: scene.title || 'Untitled Scene',
      description: scene.description || '',
      characterIds: scene.characters ? scene.characters.map((char: any) => characterIdMap.get(char.id) || '') : [],
      elementIds: [], // Initialize empty elementIds array
      createdAt: new Date(scene.createdAt || Date.now()),
      updatedAt: new Date(scene.updatedAt || Date.now())
    }));
    
    return { cast, scenes: migratedScenes };
  }









  /**
   * Parse current version data with proper date handling
   */
  private static parseCurrentVersion(data: any): StoryData {
    return {
      version: data.version || CURRENT_VERSION,
      lastUpdated: new Date(data.lastUpdated || Date.now()),
      stories: data.stories.map((story: any) => ({
        ...story,
        createdAt: new Date(story.createdAt || Date.now()),
        updatedAt: new Date(story.updatedAt || Date.now()),
        scenes: story.scenes.map((scene: any) => ({
          ...scene,
          elementIds: scene.elementIds || [], // Ensure elementIds array exists
          createdAt: new Date(scene.createdAt || Date.now()),
          updatedAt: new Date(scene.updatedAt || Date.now())
        }))
      })),
      characters: data.characters || [],
      elements: data.elements || []
    };
  }



  /**
   * Get default data structure
   */
  private static getDefaultData(): StoryData {
    return {
      version: CURRENT_VERSION,
      stories: [],
      characters: [],
      elements: [],
      lastUpdated: new Date()
    };
  }

  /**
   * Compare version strings
   */
  private static isVersionOlder(currentVersion: string, targetVersion: string): boolean {
    const current = currentVersion.split('.').map(Number);
    const target = targetVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(current.length, target.length); i++) {
      const currentPart = current[i] || 0;
      const targetPart = target[i] || 0;
      
      if (currentPart < targetPart) return true;
      if (currentPart > targetPart) return false;
    }
    
    return false; // Versions are equal
  }
} 