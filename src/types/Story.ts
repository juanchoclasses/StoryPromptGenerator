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

export type DiagramType = 'mermaid' | 'math' | 'code' | 'markdown';

export type BoardStyle = 'blackboard' | 'whiteboard';

export interface DiagramPanel {
  type: DiagramType; // Type of diagram content
  content: string; // The actual diagram content (Mermaid syntax, LaTeX, code, markdown)
  language?: string; // For code blocks: 'javascript', 'python', 'java', etc.
}

export interface DiagramStyle {
  boardStyle: BoardStyle; // Blackboard or whiteboard appearance
  backgroundColor: string; // Background color (e.g., '#2d3748' for blackboard, '#ffffff' for whiteboard)
  foregroundColor: string; // Text/diagram color (e.g., '#ffffff' for blackboard, '#24292e' for whiteboard)
  position: 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  widthPercentage: number; // 0-100, percentage of image width
  heightPercentage: number; // 0-100, percentage of image height
  autoScale?: boolean; // If true, automatically scale panel to fit diagram content (ignores heightPercentage)
  borderColor: string; // Frame/border color (e.g., '#8b7355' for wooden frame)
  borderWidth: number; // Border thickness in pixels
  padding: number; // Inner padding in pixels
  fontSize: number; // Base font size for text-based diagrams
  gutterTop: number; // Top margin from image edge in pixels
  gutterBottom: number; // Bottom margin from image edge in pixels
  gutterLeft: number; // Left margin from image edge in pixels
  gutterRight: number; // Right margin from image edge in pixels
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  textPanel?: string; // Text to overlay on generated image (supports macros)
  diagramPanel?: DiagramPanel; // Optional diagram to overlay on generated image
  lastGeneratedImage?: string; // DEPRECATED: Kept for backward compatibility
  imageHistory?: GeneratedImage[]; // Array of all generated images for this scene
  // v4.0: Use names instead of IDs for better readability
  characters: string[]; // Character names (not IDs)
  elements: string[]; // Element names (not IDs)
  // DEPRECATED fields for backward compatibility
  characterIds?: string[]; // DEPRECATED: Use 'characters' instead
  elementIds?: string[]; // DEPRECATED: Use 'elements' instead
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  description?: string; // Optional for backward compatibility
  backgroundSetup: string;
  diagramStyle?: DiagramStyle; // Optional diagram style configuration for all scenes in this story
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

// Default diagram style configuration (blackboard style)
export const DEFAULT_DIAGRAM_STYLE: DiagramStyle = {
  boardStyle: 'blackboard',
  backgroundColor: '#2d3748', // Dark gray blackboard
  foregroundColor: '#ffffff', // White chalk
  position: 'top-right',
  widthPercentage: 35,
  heightPercentage: 30,
  borderColor: '#8b7355', // Wooden frame
  borderWidth: 12,
  padding: 40,
  fontSize: 18,
  gutterTop: 20,
  gutterBottom: 20,
  gutterLeft: 20,
  gutterRight: 20
};

// Alternative whiteboard style
export const WHITEBOARD_DIAGRAM_STYLE: DiagramStyle = {
  boardStyle: 'whiteboard',
  backgroundColor: '#ffffff', // White board
  foregroundColor: '#24292e', // Dark gray/black markers
  position: 'top-right',
  widthPercentage: 35,
  heightPercentage: 30,
  borderColor: '#8b7355', // Wooden frame
  borderWidth: 12,
  padding: 40,
  fontSize: 18,
  gutterTop: 20,
  gutterBottom: 20,
  gutterLeft: 20,
  gutterRight: 20
};

// Current version of the data structure
export const CURRENT_VERSION = '3.0.0'; 