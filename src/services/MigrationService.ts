import type { StoryData, Story, Scene, Character, SceneItem } from '../types/Story';
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

      // Add more migrations here as needed
      // if (this.isVersionOlder(version, '1.1.0')) {
      //   migratedData = this.migrateToV1_1_0(migratedData);
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
        cast: cast,
        scenes: scenes,
        createdAt: new Date(data.lastUpdated || Date.now()),
        updatedAt: new Date()
      };

      return {
        version: '1.0.0',
        stories: [oldStory],
        lastUpdated: new Date()
      };
    }

    // Handle the old multi-story format without version
    if (data.stories !== undefined) {
      return {
        version: '1.0.0',
        stories: data.stories.map((story: any) => this.migrateStoryWithCharacters(story)),
        lastUpdated: new Date(data.lastUpdated || Date.now())
      };
    }

    // Unknown format, return default
    return this.getDefaultData();
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
      scenes: this.migrateSceneItems(scene.scenes || []),
      createdAt: new Date(scene.createdAt || Date.now()),
      updatedAt: new Date(scene.updatedAt || Date.now())
    }));
    
    return { cast, scenes: migratedScenes };
  }







  /**
   * Migrate scene items to current format
   */
  private static migrateSceneItems(sceneItems: any[]): SceneItem[] {
    return sceneItems.map((item: any, index: number) => ({
      id: item.id || crypto.randomUUID(),
      title: item.title || 'Untitled Scene Item',
      description: item.description || '',
      order: item.order !== undefined ? item.order : index
    }));
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
          createdAt: new Date(scene.createdAt || Date.now()),
          updatedAt: new Date(scene.updatedAt || Date.now())
        }))
      }))
    };
  }

  /**
   * Get default data structure
   */
  private static getDefaultData(): StoryData {
    return {
      version: CURRENT_VERSION,
      stories: [],
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