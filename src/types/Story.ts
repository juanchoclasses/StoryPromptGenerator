export interface Character {
  id: string;
  name: string;
  description: string;
}

export interface StoryElement {
  id: string;
  name: string;
  description: string;
  category?: string; // Optional category for organization
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  textPanel?: string; // Text to overlay on generated image (supports macros)
  lastGeneratedImage?: string; // Data URL of last generated image
  characterIds: string[]; // References to characters in the story's cast
  elementIds: string[]; // References to elements in the story's elements
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  description?: string; // Optional for backward compatibility
  backgroundSetup: string;
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryData {
  version: string;
  stories: Story[];
  characters: Character[]; // Global characters shared across all stories
  elements: StoryElement[]; // Global elements shared across all stories
  lastUpdated: Date;
}

// Current version of the data structure
export const CURRENT_VERSION = '2.0.0'; 