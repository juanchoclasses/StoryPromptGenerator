
export type PanelPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'middle-left' 
  | 'middle-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

export interface PanelConfig {
  fontFamily: string;           // e.g., "Arial", "Georgia", "Courier New"
  fontSize: number;             // in pixels
  textAlign: 'left' | 'center' | 'right';
  widthPercentage: number;      // 0-100, percentage of image width
  heightPercentage: number;     // 0-100, percentage of image height
  position: PanelPosition;      // where on the image to place the panel
  backgroundColor: string;      // hex color, e.g., "#000000cc"
  fontColor: string;            // hex color, e.g., "#ffffff"
  borderColor: string;          // hex color, e.g., "#ffffff"
  borderWidth: number;          // in pixels
  borderRadius: number;         // in pixels for rounded corners
  padding: number;              // inner padding in pixels
}

export interface Book {
  id: string;
  title: string;
  description?: string;
  aspectRatio?: string; // e.g., "3:4", "16:9", "1:1"
  panelConfig?: PanelConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookMetadata {
  id: string;
  title: string;
  description?: string;
  aspectRatio?: string; // e.g., "3:4", "16:9", "1:1"
  panelConfig?: PanelConfig;
  createdAt: Date;
  updatedAt: Date;
  storyCount: number;
  characterCount: number;
  elementCount: number;
}

export interface BookCollection {
  books: BookMetadata[];
  activeBookId: string | null;
  lastUpdated: Date;
}

// Default panel configuration
export const DEFAULT_PANEL_CONFIG: PanelConfig = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 24,
  textAlign: 'center',
  widthPercentage: 100,
  heightPercentage: 15,
  position: 'bottom-center',
  backgroundColor: '#000000cc',
  fontColor: '#ffffff',
  borderColor: '#ffffff',
  borderWidth: 2,
  borderRadius: 8,
  padding: 20
}; 