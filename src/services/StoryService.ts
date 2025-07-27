import type { StoryData, Scene, Character, SceneItem } from '../types/Story';

const STORAGE_KEY = 'story-data';

export class StoryService {
  private static getStoredData(): StoryData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        backgroundSetup: '',
        scenes: [],
        lastUpdated: new Date()
      };
    }
    
    try {
      const data = JSON.parse(stored);
      return {
        ...data,
        lastUpdated: new Date(data.lastUpdated),
        scenes: data.scenes.map((scene: any) => ({
          ...scene,
          createdAt: new Date(scene.createdAt),
          updatedAt: new Date(scene.updatedAt)
        }))
      };
    } catch (error) {
      console.error('Error parsing stored story data:', error);
      return {
        backgroundSetup: '',
        scenes: [],
        lastUpdated: new Date()
      };
    }
  }

  private static saveData(data: StoryData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  static getStoryData(): StoryData {
    return this.getStoredData();
  }

  static updateBackgroundSetup(backgroundSetup: string): void {
    const data = this.getStoredData();
    data.backgroundSetup = backgroundSetup;
    data.lastUpdated = new Date();
    this.saveData(data);
  }

  static createScene(title: string): Scene {
    const data = this.getStoredData();
    const newScene: Scene = {
      id: crypto.randomUUID(),
      title,
      characters: [],
      scenes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    data.scenes.push(newScene);
    data.lastUpdated = new Date();
    this.saveData(data);
    return newScene;
  }

  static updateScene(sceneId: string, updates: Partial<Scene>): Scene | null {
    const data = this.getStoredData();
    const sceneIndex = data.scenes.findIndex(scene => scene.id === sceneId);
    
    if (sceneIndex === -1) return null;
    
    data.scenes[sceneIndex] = {
      ...data.scenes[sceneIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    data.lastUpdated = new Date();
    this.saveData(data);
    return data.scenes[sceneIndex];
  }

  static deleteScene(sceneId: string): boolean {
    const data = this.getStoredData();
    const initialLength = data.scenes.length;
    data.scenes = data.scenes.filter(scene => scene.id !== sceneId);
    
    if (data.scenes.length === initialLength) {
      return false; // No scene was found to delete
    }
    
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }

  static addCharacterToScene(sceneId: string, name: string, description: string): Character | null {
    const data = this.getStoredData();
    const sceneIndex = data.scenes.findIndex(scene => scene.id === sceneId);
    
    if (sceneIndex === -1) return null;
    
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name,
      description
    };
    
    data.scenes[sceneIndex].characters.push(newCharacter);
    data.scenes[sceneIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return newCharacter;
  }

  static updateCharacter(sceneId: string, characterId: string, updates: Partial<Character>): Character | null {
    const data = this.getStoredData();
    const sceneIndex = data.scenes.findIndex(scene => scene.id === sceneId);
    
    if (sceneIndex === -1) return null;
    
    const characterIndex = data.scenes[sceneIndex].characters.findIndex(char => char.id === characterId);
    if (characterIndex === -1) return null;
    
    data.scenes[sceneIndex].characters[characterIndex] = {
      ...data.scenes[sceneIndex].characters[characterIndex],
      ...updates
    };
    
    data.scenes[sceneIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return data.scenes[sceneIndex].characters[characterIndex];
  }

  static deleteCharacter(sceneId: string, characterId: string): boolean {
    const data = this.getStoredData();
    const sceneIndex = data.scenes.findIndex(scene => scene.id === sceneId);
    
    if (sceneIndex === -1) return false;
    
    const initialLength = data.scenes[sceneIndex].characters.length;
    data.scenes[sceneIndex].characters = data.scenes[sceneIndex].characters.filter(char => char.id !== characterId);
    
    if (data.scenes[sceneIndex].characters.length === initialLength) {
      return false; // No character was found to delete
    }
    
    data.scenes[sceneIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }

  static addSceneItem(sceneId: string, title: string, description: string): SceneItem | null {
    const data = this.getStoredData();
    const sceneIndex = data.scenes.findIndex(scene => scene.id === sceneId);
    
    if (sceneIndex === -1) return null;
    
    const newSceneItem: SceneItem = {
      id: crypto.randomUUID(),
      title,
      description,
      order: data.scenes[sceneIndex].scenes.length
    };
    
    data.scenes[sceneIndex].scenes.push(newSceneItem);
    data.scenes[sceneIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return newSceneItem;
  }

  static updateSceneItem(sceneId: string, itemId: string, updates: Partial<SceneItem>): SceneItem | null {
    const data = this.getStoredData();
    const sceneIndex = data.scenes.findIndex(scene => scene.id === sceneId);
    
    if (sceneIndex === -1) return null;
    
    const itemIndex = data.scenes[sceneIndex].scenes.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;
    
    data.scenes[sceneIndex].scenes[itemIndex] = {
      ...data.scenes[sceneIndex].scenes[itemIndex],
      ...updates
    };
    
    data.scenes[sceneIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return data.scenes[sceneIndex].scenes[itemIndex];
  }

  static deleteSceneItem(sceneId: string, itemId: string): boolean {
    const data = this.getStoredData();
    const sceneIndex = data.scenes.findIndex(scene => scene.id === sceneId);
    
    if (sceneIndex === -1) return false;
    
    const initialLength = data.scenes[sceneIndex].scenes.length;
    data.scenes[sceneIndex].scenes = data.scenes[sceneIndex].scenes.filter(item => item.id !== itemId);
    
    if (data.scenes[sceneIndex].scenes.length === initialLength) {
      return false; // No scene item was found to delete
    }
    
    data.scenes[sceneIndex].updatedAt = new Date();
    data.lastUpdated = new Date();
    this.saveData(data);
    return true;
  }
} 