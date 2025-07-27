import type { StoryData, Story, Scene, Character, SceneItem } from '../types/Story';
import { CURRENT_VERSION } from '../types/Story';
import { MigrationService } from './MigrationService';

const STORAGE_KEY = 'story-data';

export class StoryService {
  private static getStoredData(): StoryData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        version: CURRENT_VERSION,
        stories: [],
        lastUpdated: new Date()
      };
    }
    
    try {
      const rawData = JSON.parse(stored);
      
      // Use migration service to handle version upgrades
      const migrationResult = MigrationService.migrateData(rawData);
      
      if (!migrationResult.success) {
        console.error('Migration failed:', migrationResult.errors);
        // Return default data if migration fails
        return {
          version: CURRENT_VERSION,
          stories: [],
          lastUpdated: new Date()
        };
      }
      
      // If data was migrated, save the migrated version
      if (migrationResult.migrated) {
        console.log('Data migrated successfully to version', CURRENT_VERSION);
        this.saveData(migrationResult.data);
      }
      
      return migrationResult.data;
      
    } catch (error) {
      console.error('Error parsing stored story data:', error);
      return {
        version: CURRENT_VERSION,
        stories: [],
        lastUpdated: new Date()
      };
    }
  }

  private static saveData(data: StoryData): void {
    // Ensure the data has the current version
    const dataToSave = {
      ...data,
      version: CURRENT_VERSION,
      lastUpdated: new Date()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }

  // Story Management
  static getAllStories(): Story[] {
    return this.getStoredData().stories;
  }

  static getStoryById(storyId: string): Story | null {
    const data = this.getStoredData();
    return data.stories.find(story => story.id === storyId) || null;
  }

  static createStory(title: string): Story {
    const data = this.getStoredData();
    const newStory: Story = {
      id: crypto.randomUUID(),
      title,
      backgroundSetup: '',
      cast: [],
      scenes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    data.stories.push(newStory);
    data.lastUpdated = new Date();
    this.saveData(data);
    return newStory;
  }

  static updateStory(storyId: string, updates: Partial<Story>): Story | null {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return null;
    
    data.stories[storyIndex] = {
      ...data.stories[storyIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    data.lastUpdated = new Date();
    this.saveData(data);
    return data.stories[storyIndex];
  }

  static deleteStory(storyId: string): boolean {
    const data = this.getStoredData();
    const initialLength = data.stories.length;
    data.stories = data.stories.filter(story => story.id !== storyId);
    
    if (data.stories.length === initialLength) {
      return false; // No story was found to delete
    }
    
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }

  // Background Setup
  static updateBackgroundSetup(storyId: string, backgroundSetup: string): void {
    this.updateStory(storyId, { backgroundSetup });
  }

  // Scene Management
  static createScene(storyId: string, title: string, description: string = ''): Scene | null {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return null;
    
    const newScene: Scene = {
      id: crypto.randomUUID(),
      title,
      description,
      characterIds: [],
      scenes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    data.stories[storyIndex].scenes.push(newScene);
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return newScene;
  }

  static updateScene(storyId: string, sceneId: string, updates: Partial<Scene>): Scene | null {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return null;
    
    const sceneIndex = data.stories[storyIndex].scenes.findIndex(scene => scene.id === sceneId);
    if (sceneIndex === -1) return null;
    
    data.stories[storyIndex].scenes[sceneIndex] = {
      ...data.stories[storyIndex].scenes[sceneIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return data.stories[storyIndex].scenes[sceneIndex];
  }

  static deleteScene(storyId: string, sceneId: string): boolean {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return false;
    
    const initialLength = data.stories[storyIndex].scenes.length;
    data.stories[storyIndex].scenes = data.stories[storyIndex].scenes.filter(scene => scene.id !== sceneId);
    
    if (data.stories[storyIndex].scenes.length === initialLength) {
      return false; // No scene was found to delete
    }
    
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }

  // Cast Management
  static addCharacterToCast(storyId: string, name: string, description: string): Character | null {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return null;
    
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name,
      description
    };
    
    data.stories[storyIndex].cast.push(newCharacter);
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return newCharacter;
  }

  static updateCharacter(storyId: string, characterId: string, updates: Partial<Character>): Character | null {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return null;
    
    const characterIndex = data.stories[storyIndex].cast.findIndex(char => char.id === characterId);
    if (characterIndex === -1) return null;
    
    data.stories[storyIndex].cast[characterIndex] = {
      ...data.stories[storyIndex].cast[characterIndex],
      ...updates
    };
    
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return data.stories[storyIndex].cast[characterIndex];
  }

  static deleteCharacter(storyId: string, characterId: string): boolean {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return false;
    
    const initialLength = data.stories[storyIndex].cast.length;
    data.stories[storyIndex].cast = data.stories[storyIndex].cast.filter(char => char.id !== characterId);
    
    if (data.stories[storyIndex].cast.length === initialLength) {
      return false; // No character was found to delete
    }
    
    // Remove character from all scenes that reference it
    data.stories[storyIndex].scenes.forEach(scene => {
      scene.characterIds = scene.characterIds.filter(id => id !== characterId);
    });
    
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }

  // Scene Character Management
  static addCharacterToScene(storyId: string, sceneId: string, characterId: string): boolean {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return false;
    
    const sceneIndex = data.stories[storyIndex].scenes.findIndex(scene => scene.id === sceneId);
    if (sceneIndex === -1) return false;
    
    // Check if character exists in cast
    const characterExists = data.stories[storyIndex].cast.some(char => char.id === characterId);
    if (!characterExists) return false;
    
    // Check if character is already in scene
    if (data.stories[storyIndex].scenes[sceneIndex].characterIds.includes(characterId)) {
      return false;
    }
    
    data.stories[storyIndex].scenes[sceneIndex].characterIds.push(characterId);
    data.stories[storyIndex].scenes[sceneIndex].updatedAt = new Date();
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }

  static removeCharacterFromScene(storyId: string, sceneId: string, characterId: string): boolean {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return false;
    
    const sceneIndex = data.stories[storyIndex].scenes.findIndex(scene => scene.id === sceneId);
    if (sceneIndex === -1) return false;
    
    const initialLength = data.stories[storyIndex].scenes[sceneIndex].characterIds.length;
    data.stories[storyIndex].scenes[sceneIndex].characterIds = data.stories[storyIndex].scenes[sceneIndex].characterIds.filter(id => id !== characterId);
    
    if (data.stories[storyIndex].scenes[sceneIndex].characterIds.length === initialLength) {
      return false; // Character was not in scene
    }
    
    data.stories[storyIndex].scenes[sceneIndex].updatedAt = new Date();
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }

  // Scene Item Management
  static addSceneItem(storyId: string, sceneId: string, title: string, description: string): SceneItem | null {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return null;
    
    const sceneIndex = data.stories[storyIndex].scenes.findIndex(scene => scene.id === sceneId);
    if (sceneIndex === -1) return null;
    
    const newSceneItem: SceneItem = {
      id: crypto.randomUUID(),
      title,
      description,
      order: data.stories[storyIndex].scenes[sceneIndex].scenes.length
    };
    
    data.stories[storyIndex].scenes[sceneIndex].scenes.push(newSceneItem);
    data.stories[storyIndex].scenes[sceneIndex].updatedAt = new Date();
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return newSceneItem;
  }

  static updateSceneItem(storyId: string, sceneId: string, itemId: string, updates: Partial<SceneItem>): SceneItem | null {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return null;
    
    const sceneIndex = data.stories[storyIndex].scenes.findIndex(scene => scene.id === sceneId);
    if (sceneIndex === -1) return null;
    
    const itemIndex = data.stories[storyIndex].scenes[sceneIndex].scenes.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;
    
    data.stories[storyIndex].scenes[sceneIndex].scenes[itemIndex] = {
      ...data.stories[storyIndex].scenes[sceneIndex].scenes[itemIndex],
      ...updates
    };
    
    data.stories[storyIndex].scenes[sceneIndex].updatedAt = new Date();
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return data.stories[storyIndex].scenes[sceneIndex].scenes[itemIndex];
  }

  static deleteSceneItem(storyId: string, sceneId: string, itemId: string): boolean {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return false;
    
    const sceneIndex = data.stories[storyIndex].scenes.findIndex(scene => scene.id === sceneId);
    if (sceneIndex === -1) return false;
    
    const initialLength = data.stories[storyIndex].scenes[sceneIndex].scenes.length;
    data.stories[storyIndex].scenes[sceneIndex].scenes = data.stories[storyIndex].scenes[sceneIndex].scenes.filter(item => item.id !== itemId);
    
    if (data.stories[storyIndex].scenes[sceneIndex].scenes.length === initialLength) {
      return false; // No scene item was found to delete
    }
    
    data.stories[storyIndex].scenes[sceneIndex].updatedAt = new Date();
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }
} 