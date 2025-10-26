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

export interface GeneratedImage {
  id: string;
  url?: string; // DEPRECATED: Blob URLs stored in localStorage are ephemeral. Use ImageStorageService.getImage(id) instead.
  modelName: string; // AI model used to generate this image
  timestamp: Date;
  promptHash?: string; // Optional: hash of prompt to detect changes
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  textPanel?: string; // Text to overlay on generated image (supports macros)
  lastGeneratedImage?: string; // DEPRECATED: Kept for backward compatibility
  imageHistory?: GeneratedImage[]; // Array of all generated images for this scene
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
  characters: Character[]; // Characters specific to this story
  elements: StoryElement[]; // Elements specific to this story
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryData {
  version: string;
  stories: Story[];
  characters: Character[]; // DEPRECATED: Kept for backward compatibility with v2.0.0
  elements: StoryElement[]; // DEPRECATED: Kept for backward compatibility with v2.0.0
  lastUpdated: Date;
}

// Current version of the data structure
export const CURRENT_VERSION = '3.0.0'; 