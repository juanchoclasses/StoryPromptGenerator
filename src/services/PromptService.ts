import type { Prompt, CreatePromptRequest, UpdatePromptRequest } from '../types/Prompt';

const STORAGE_KEY = 'story-prompts';

export class PromptService {
  private static getStoredPrompts(): Prompt[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const prompts = JSON.parse(stored);
      return prompts.map((prompt: any) => ({
        ...prompt,
        createdAt: new Date(prompt.createdAt),
        updatedAt: new Date(prompt.updatedAt)
      }));
    } catch (error) {
      console.error('Error parsing stored prompts:', error);
      return [];
    }
  }

  private static savePrompts(prompts: Prompt[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }

  static getAllPrompts(): Prompt[] {
    return this.getStoredPrompts();
  }

  static getPromptById(id: string): Prompt | null {
    const prompts = this.getStoredPrompts();
    return prompts.find(prompt => prompt.id === id) || null;
  }

  static createPrompt(request: CreatePromptRequest): Prompt {
    const prompts = this.getStoredPrompts();
    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      ...request,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    prompts.push(newPrompt);
    this.savePrompts(prompts);
    return newPrompt;
  }

  static updatePrompt(id: string, request: UpdatePromptRequest): Prompt | null {
    const prompts = this.getStoredPrompts();
    const index = prompts.findIndex(prompt => prompt.id === id);
    
    if (index === -1) return null;
    
    prompts[index] = {
      ...prompts[index],
      ...request,
      updatedAt: new Date()
    };
    
    this.savePrompts(prompts);
    return prompts[index];
  }

  static deletePrompt(id: string): boolean {
    const prompts = this.getStoredPrompts();
    const filteredPrompts = prompts.filter(prompt => prompt.id !== id);
    
    if (filteredPrompts.length === prompts.length) {
      return false; // No prompt was found to delete
    }
    
    this.savePrompts(filteredPrompts);
    return true;
  }

  static searchPrompts(query: string): Prompt[] {
    const prompts = this.getStoredPrompts();
    const lowerQuery = query.toLowerCase();
    
    return prompts.filter(prompt => 
      prompt.title.toLowerCase().includes(lowerQuery) ||
      prompt.content.toLowerCase().includes(lowerQuery) ||
      prompt.category.toLowerCase().includes(lowerQuery) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  static getCategories(): string[] {
    const prompts = this.getStoredPrompts();
    const categories = new Set(prompts.map(prompt => prompt.category));
    return Array.from(categories).sort();
  }

  static getTags(): string[] {
    const prompts = this.getStoredPrompts();
    const tags = new Set(prompts.flatMap(prompt => prompt.tags));
    return Array.from(tags).sort();
  }
} 