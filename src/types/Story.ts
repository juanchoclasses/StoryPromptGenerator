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
  description: string;
  characterIds: string[]; // References to characters in the story's cast
  scenes: SceneItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  description?: string; // Optional for backward compatibility
  backgroundSetup: string;
  cast: Character[]; // Global cast of characters for the story
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryData {
  version: string;
  stories: Story[];
  lastUpdated: Date;
}

// Current version of the data structure
export const CURRENT_VERSION = '1.0.0'; 