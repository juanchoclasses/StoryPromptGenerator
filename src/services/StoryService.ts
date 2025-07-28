import type { StoryData, Story, Scene, Character, StoryElement } from '../types/Story';
import { CURRENT_VERSION } from '../types/Story';
import { MigrationService } from './MigrationService';

const STORAGE_KEY = 'story-data-v2';

export class StoryService {
  private static getStoredData(): StoryData {
    // First check for new storage key
    const stored = localStorage.getItem(STORAGE_KEY);
    
    // If no data in new key, check for old key and migrate
    if (!stored) {
      const oldStored = localStorage.getItem('story-data');
      if (oldStored) {
        console.log('Found old data, migrating to new storage key...');
        try {
          const oldData = JSON.parse(oldStored);
          console.log('Old data structure:', JSON.stringify(oldData, null, 2));
          
          const migrationResult = MigrationService.migrateData(oldData);
          console.log('Migration result:', migrationResult);
          
          if (migrationResult.success) {
            // Save migrated data to new storage key
            this.saveData(migrationResult.data);
            console.log('Data migrated successfully from old storage key');
            console.log('Migrated data structure:', JSON.stringify(migrationResult.data, null, 2));
            return migrationResult.data;
          } else {
            console.error('Migration from old storage failed:', migrationResult.errors);
          }
        } catch (error) {
          console.error('Error migrating old data:', error);
        }
      }
      
      // Return default data if no old data found or migration failed
      return {
        version: CURRENT_VERSION,
        stories: [],
        characters: [],
        elements: [],
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
          characters: [],
          elements: [],
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
        characters: [],
        elements: [],
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
    const data = this.getStoredData();
    return data.stories;
  }

  static getStoryById(storyId: string): Story | null {
    const data = this.getStoredData();
    const story = data.stories.find(story => story.id === storyId);
    return story || null;
  }

  static createStory(title: string): Story {
    const data = this.getStoredData();
    const newStory: Story = {
      id: crypto.randomUUID(),
      title,
      backgroundSetup: '',
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
      elementIds: [],
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

  // Character Management (Global)
  static addCharacterToCast(name: string, description: string): Character | null {
    const data = this.getStoredData();
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name,
      description
    };
    
    data.characters.push(newCharacter);
    data.lastUpdated = new Date();
    this.saveData(data);
    return newCharacter;
  }

  static updateCharacter(characterId: string, updates: Partial<Character>): Character | null {
    const data = this.getStoredData();
    const characterIndex = data.characters.findIndex(char => char.id === characterId);
    
    if (characterIndex === -1) return null;
    
    data.characters[characterIndex] = {
      ...data.characters[characterIndex],
      ...updates
    };
    
    data.lastUpdated = new Date();
    this.saveData(data);
    return data.characters[characterIndex];
  }

  static deleteCharacter(characterId: string): boolean {
    const data = this.getStoredData();
    const characterIndex = data.characters.findIndex(char => char.id === characterId);
    
    if (characterIndex === -1) return false;
    
    // Remove character from all scenes that reference it
    data.stories.forEach(story => {
      story.scenes.forEach(scene => {
        scene.characterIds = scene.characterIds.filter(id => id !== characterId);
      });
    });
    
    data.characters.splice(characterIndex, 1);
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }

  static getAllCharacters(): Character[] {
    const data = this.getStoredData();
    return data.characters || [];
  }

  // Scene Character Management
  static addCharacterToScene(storyId: string, sceneId: string, characterId: string): boolean {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return false;
    
    const sceneIndex = data.stories[storyIndex].scenes.findIndex(scene => scene.id === sceneId);
    if (sceneIndex === -1) return false;
    
    // Check if character exists in global characters
    const characterExists = data.characters.some(char => char.id === characterId);
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

  // Element Management (Global)
  static addElementToStory(name: string, description: string, category?: string): StoryElement | null {
    const data = this.getStoredData();
    const newElement: StoryElement = {
      id: crypto.randomUUID(),
      name,
      description,
      category
    };
    
    data.elements.push(newElement);
    data.lastUpdated = new Date();
    this.saveData(data);
    return newElement;
  }

  static updateElement(elementId: string, updates: Partial<StoryElement>): StoryElement | null {
    const data = this.getStoredData();
    const elementIndex = data.elements.findIndex(element => element.id === elementId);
    
    if (elementIndex === -1) return null;
    
    data.elements[elementIndex] = {
      ...data.elements[elementIndex],
      ...updates
    };
    
    data.lastUpdated = new Date();
    this.saveData(data);
    return data.elements[elementIndex];
  }

  static deleteElement(elementId: string): boolean {
    const data = this.getStoredData();
    const elementIndex = data.elements.findIndex(element => element.id === elementId);
    
    if (elementIndex === -1) return false;
    
    // Remove element from all scenes that reference it
    data.stories.forEach(story => {
      story.scenes.forEach(scene => {
        scene.elementIds = scene.elementIds.filter(id => id !== elementId);
      });
    });
    
    data.elements.splice(elementIndex, 1);
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }

  static getAllElements(): StoryElement[] {
    const data = this.getStoredData();
    return data.elements || [];
  }

  // Element Scene Management
  static addElementToScene(storyId: string, sceneId: string, elementId: string): boolean {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return false;
    
    const sceneIndex = data.stories[storyIndex].scenes.findIndex(scene => scene.id === sceneId);
    if (sceneIndex === -1) return false;
    
    // Check if element exists in global elements
    const elementExists = data.elements.some(element => element.id === elementId);
    if (!elementExists) return false;
    
    // Check if element is already in scene
    if (data.stories[storyIndex].scenes[sceneIndex].elementIds.includes(elementId)) {
      return false; // Element already in scene
    }
    
    data.stories[storyIndex].scenes[sceneIndex].elementIds.push(elementId);
    data.stories[storyIndex].scenes[sceneIndex].updatedAt = new Date();
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }

  static removeElementFromScene(storyId: string, sceneId: string, elementId: string): boolean {
    const data = this.getStoredData();
    const storyIndex = data.stories.findIndex(story => story.id === storyId);
    
    if (storyIndex === -1) return false;
    
    const sceneIndex = data.stories[storyIndex].scenes.findIndex(scene => scene.id === sceneId);
    if (sceneIndex === -1) return false;
    
    const initialLength = data.stories[storyIndex].scenes[sceneIndex].elementIds.length;
    data.stories[storyIndex].scenes[sceneIndex].elementIds = data.stories[storyIndex].scenes[sceneIndex].elementIds.filter(id => id !== elementId);
    
    if (data.stories[storyIndex].scenes[sceneIndex].elementIds.length === initialLength) {
      return false; // Element was not in scene
    }
    
    data.stories[storyIndex].scenes[sceneIndex].updatedAt = new Date();
    data.stories[storyIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }


} 