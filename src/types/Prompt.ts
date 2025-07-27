export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromptRequest {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface UpdatePromptRequest {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
} 