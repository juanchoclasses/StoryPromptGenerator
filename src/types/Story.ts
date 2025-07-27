export interface Character {
  id: string;
  name: string;
  description: string;
}

export interface SceneItem {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Scene {
  id: string;
  title: string;
  characters: Character[];
  scenes: SceneItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryData {
  backgroundSetup: string;
  scenes: Scene[];
  lastUpdated: Date;
} 