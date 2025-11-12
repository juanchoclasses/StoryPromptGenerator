import type { Prompt, CreatePromptRequest, UpdatePromptRequest } from '../types/Prompt';
import { FileSystemService } from './FileSystemService';

export class PromptService {
  private static promptsCache: Prompt[] | null = null;

  private static async getStoredPrompts(): Promise<Prompt[]> {
    // Return cached prompts if available
    if (this.promptsCache !== null) {
      return this.promptsCache;
    }

    // Load from filesystem
    const prompts = await FileSystemService.loadPrompts();
    
    // Parse dates
    const parsedPrompts = prompts.map((prompt: any) => ({
      ...prompt,
      createdAt: new Date(prompt.createdAt),
      updatedAt: new Date(prompt.updatedAt)
    }));

    // Cache prompts
    this.promptsCache = parsedPrompts;
    return parsedPrompts;
  }

  private static async savePrompts(prompts: Prompt[]): Promise<void> {
    // Update cache
    this.promptsCache = prompts;

    // Save to filesystem
    await FileSystemService.savePrompts(prompts);
  }

  static async getAllPrompts(): Promise<Prompt[]> {
    return await this.getStoredPrompts();
  }

  static async getPromptById(id: string): Promise<Prompt | null> {
    const prompts = await this.getStoredPrompts();
    return prompts.find(prompt => prompt.id === id) || null;
  }

  static async createPrompt(request: CreatePromptRequest): Promise<Prompt> {
    const prompts = await this.getStoredPrompts();
    const newPrompt: Prompt = {
      id: crypto.randomUUID(),
      ...request,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    prompts.push(newPrompt);
    await this.savePrompts(prompts);
    return newPrompt;
  }

  static async updatePrompt(id: string, request: UpdatePromptRequest): Promise<Prompt | null> {
    const prompts = await this.getStoredPrompts();
    const index = prompts.findIndex(prompt => prompt.id === id);
    
    if (index === -1) return null;
    
    prompts[index] = {
      ...prompts[index],
      ...request,
      updatedAt: new Date()
    };
    
    await this.savePrompts(prompts);
    return prompts[index];
  }

  static async deletePrompt(id: string): Promise<boolean> {
    const prompts = await this.getStoredPrompts();
    const filteredPrompts = prompts.filter(prompt => prompt.id !== id);
    
    if (filteredPrompts.length === prompts.length) {
      return false; // No prompt was found to delete
    }
    
    await this.savePrompts(filteredPrompts);
    return true;
  }

  static async searchPrompts(query: string): Promise<Prompt[]> {
    const prompts = await this.getStoredPrompts();
    const lowerQuery = query.toLowerCase();
    
    return prompts.filter(prompt => 
      prompt.title.toLowerCase().includes(lowerQuery) ||
      prompt.content.toLowerCase().includes(lowerQuery) ||
      prompt.category.toLowerCase().includes(lowerQuery) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  static async getCategories(): Promise<string[]> {
    const prompts = await this.getStoredPrompts();
    const categories = new Set(prompts.map(prompt => prompt.category));
    return Array.from(categories).sort();
  }

  static async getTags(): Promise<string[]> {
    const prompts = await this.getStoredPrompts();
    const tags = new Set(prompts.flatMap(prompt => prompt.tags));
    return Array.from(tags).sort();
  }
} 