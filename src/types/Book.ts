

export interface Book {
  id: string;
  title: string;
  description?: string;
  aspectRatio?: string; // e.g., "3:4", "16:9", "1:1"
  createdAt: Date;
  updatedAt: Date;
}

export interface BookMetadata {
  id: string;
  title: string;
  description?: string;
  aspectRatio?: string; // e.g., "3:4", "16:9", "1:1"
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