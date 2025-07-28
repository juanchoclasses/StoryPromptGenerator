

export interface Book {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookMetadata {
  id: string;
  title: string;
  description?: string;
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