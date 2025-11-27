import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PromptService } from '../../src/services/PromptService';
import { FileSystemService } from '../../src/services/FileSystemService';
import type { Prompt, CreatePromptRequest, UpdatePromptRequest } from '../../src/types/Prompt';

// Mock FileSystemService
vi.mock('../../src/services/FileSystemService', () => ({
  FileSystemService: {
    loadPrompts: vi.fn(),
    savePrompts: vi.fn()
  }
}));

describe('PromptService', () => {
  const mockPrompts: Prompt[] = [
    {
      id: '1',
      title: 'Test Prompt 1',
      content: 'Content 1',
      category: 'Testing',
      tags: ['test', 'sample'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      title: 'Test Prompt 2',
      content: 'Content 2',
      category: 'Development',
      tags: ['dev', 'code'],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    }
  ];

  beforeEach(() => {
    // Clear cache before each test by accessing the private property
    (PromptService as any).promptsCache = null;
    
    // Setup default mock behavior
    vi.mocked(FileSystemService.loadPrompts).mockResolvedValue(mockPrompts);
    vi.mocked(FileSystemService.savePrompts).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPrompts', () => {
    it('should return all prompts', async () => {
      const prompts = await PromptService.getAllPrompts();
      
      expect(prompts).toHaveLength(2);
      expect(prompts[0].title).toBe('Test Prompt 1');
      expect(prompts[1].title).toBe('Test Prompt 2');
    });

    it('should load prompts from filesystem on first call', async () => {
      await PromptService.getAllPrompts();
      
      expect(FileSystemService.loadPrompts).toHaveBeenCalledTimes(1);
    });

    it('should use cache on subsequent calls', async () => {
      await PromptService.getAllPrompts();
      await PromptService.getAllPrompts();
      await PromptService.getAllPrompts();
      
      // Should only load once
      expect(FileSystemService.loadPrompts).toHaveBeenCalledTimes(1);
    });

    it('should parse dates correctly', async () => {
      const prompts = await PromptService.getAllPrompts();
      
      expect(prompts[0].createdAt).toBeInstanceOf(Date);
      expect(prompts[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getPromptById', () => {
    it('should return prompt by id', async () => {
      const prompt = await PromptService.getPromptById('1');
      
      expect(prompt).toBeDefined();
      expect(prompt?.id).toBe('1');
      expect(prompt?.title).toBe('Test Prompt 1');
    });

    it('should return null for non-existent id', async () => {
      const prompt = await PromptService.getPromptById('nonexistent');
      
      expect(prompt).toBeNull();
    });
  });

  describe('createPrompt', () => {
    it('should create a new prompt', async () => {
      const request: CreatePromptRequest = {
        title: 'New Prompt',
        content: 'New Content',
        category: 'New Category',
        tags: ['new', 'prompt']
      };

      const newPrompt = await PromptService.createPrompt(request);
      
      expect(newPrompt.id).toBeDefined();
      expect(newPrompt.title).toBe('New Prompt');
      expect(newPrompt.content).toBe('New Content');
      expect(newPrompt.category).toBe('New Category');
      expect(newPrompt.tags).toEqual(['new', 'prompt']);
      expect(newPrompt.createdAt).toBeInstanceOf(Date);
      expect(newPrompt.updatedAt).toBeInstanceOf(Date);
    });

    it('should save prompts to filesystem', async () => {
      const request: CreatePromptRequest = {
        title: 'New Prompt',
        content: 'New Content',
        category: 'New Category',
        tags: ['new']
      };

      await PromptService.createPrompt(request);
      
      expect(FileSystemService.savePrompts).toHaveBeenCalledTimes(1);
      const savedPrompts = vi.mocked(FileSystemService.savePrompts).mock.calls[0][0];
      expect(savedPrompts).toHaveLength(3); // Original 2 + new 1
    });

    it('should update cache after creation', async () => {
      const request: CreatePromptRequest = {
        title: 'New Prompt',
        content: 'New Content',
        category: 'New Category',
        tags: ['new']
      };

      await PromptService.createPrompt(request);
      
      // Get all prompts should use cache, not load again
      const prompts = await PromptService.getAllPrompts();
      expect(prompts).toHaveLength(3);
      expect(FileSystemService.loadPrompts).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe('updatePrompt', () => {
    it('should update an existing prompt', async () => {
      const request: UpdatePromptRequest = {
        title: 'Updated Title',
        content: 'Updated Content'
      };

      const updated = await PromptService.updatePrompt('1', request);
      
      expect(updated).toBeDefined();
      expect(updated?.id).toBe('1');
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.content).toBe('Updated Content');
      expect(updated?.category).toBe('Testing'); // Unchanged
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent prompt', async () => {
      const request: UpdatePromptRequest = {
        title: 'Updated Title'
      };

      const updated = await PromptService.updatePrompt('nonexistent', request);
      
      expect(updated).toBeNull();
    });

    it('should save prompts to filesystem', async () => {
      const request: UpdatePromptRequest = {
        title: 'Updated Title'
      };

      await PromptService.updatePrompt('1', request);
      
      expect(FileSystemService.savePrompts).toHaveBeenCalledTimes(1);
    });

    it('should update cache after update', async () => {
      const request: UpdatePromptRequest = {
        title: 'Updated Title'
      };

      await PromptService.updatePrompt('1', request);
      
      // Get prompt should return updated data from cache
      const prompt = await PromptService.getPromptById('1');
      expect(prompt?.title).toBe('Updated Title');
      expect(FileSystemService.loadPrompts).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe('deletePrompt', () => {
    it('should delete an existing prompt', async () => {
      const deleted = await PromptService.deletePrompt('1');
      
      expect(deleted).toBe(true);
      expect(FileSystemService.savePrompts).toHaveBeenCalledTimes(1);
      
      const savedPrompts = vi.mocked(FileSystemService.savePrompts).mock.calls[0][0];
      expect(savedPrompts).toHaveLength(1); // One removed
      expect(savedPrompts[0].id).toBe('2');
    });

    it('should return false for non-existent prompt', async () => {
      const deleted = await PromptService.deletePrompt('nonexistent');
      
      expect(deleted).toBe(false);
      expect(FileSystemService.savePrompts).not.toHaveBeenCalled();
    });

    it('should update cache after deletion', async () => {
      await PromptService.deletePrompt('1');
      
      const prompts = await PromptService.getAllPrompts();
      expect(prompts).toHaveLength(1);
      expect(prompts[0].id).toBe('2');
      expect(FileSystemService.loadPrompts).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe('searchPrompts', () => {
    it('should search by title', async () => {
      const results = await PromptService.searchPrompts('Prompt 1');
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should search by content', async () => {
      const results = await PromptService.searchPrompts('Content 2');
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should search by category', async () => {
      const results = await PromptService.searchPrompts('testing');
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should search by tags', async () => {
      const results = await PromptService.searchPrompts('code');
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should be case insensitive', async () => {
      const results = await PromptService.searchPrompts('DEVELOPMENT');
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should return multiple matches', async () => {
      const results = await PromptService.searchPrompts('test');
      
      expect(results).toHaveLength(2); // Matches both by tag/category
    });

    it('should return empty array for no matches', async () => {
      const results = await PromptService.searchPrompts('nonexistent');
      
      expect(results).toHaveLength(0);
    });
  });

  describe('getCategories', () => {
    it('should return all unique categories', async () => {
      const categories = await PromptService.getCategories();
      
      expect(categories).toHaveLength(2);
      expect(categories).toContain('Testing');
      expect(categories).toContain('Development');
    });

    it('should return sorted categories', async () => {
      const categories = await PromptService.getCategories();
      
      expect(categories).toEqual(['Development', 'Testing']);
    });

    it('should handle empty prompts list', async () => {
      vi.mocked(FileSystemService.loadPrompts).mockResolvedValue([]);
      (PromptService as any).promptsCache = null;
      
      const categories = await PromptService.getCategories();
      
      expect(categories).toHaveLength(0);
    });

    it('should deduplicate categories', async () => {
      const duplicatePrompts = [
        ...mockPrompts,
        { ...mockPrompts[0], id: '3', title: 'Another Test' }
      ];
      vi.mocked(FileSystemService.loadPrompts).mockResolvedValue(duplicatePrompts);
      (PromptService as any).promptsCache = null;
      
      const categories = await PromptService.getCategories();
      
      expect(categories).toHaveLength(2);
    });
  });

  describe('getTags', () => {
    it('should return all unique tags', async () => {
      const tags = await PromptService.getTags();
      
      expect(tags).toHaveLength(4);
      expect(tags).toContain('test');
      expect(tags).toContain('sample');
      expect(tags).toContain('dev');
      expect(tags).toContain('code');
    });

    it('should return sorted tags', async () => {
      const tags = await PromptService.getTags();
      
      expect(tags).toEqual(['code', 'dev', 'sample', 'test']);
    });

    it('should handle empty prompts list', async () => {
      vi.mocked(FileSystemService.loadPrompts).mockResolvedValue([]);
      (PromptService as any).promptsCache = null;
      
      const tags = await PromptService.getTags();
      
      expect(tags).toHaveLength(0);
    });

    it('should deduplicate tags', async () => {
      const duplicatePrompts = [
        ...mockPrompts,
        { ...mockPrompts[0], id: '3', tags: ['test', 'new'] }
      ];
      vi.mocked(FileSystemService.loadPrompts).mockResolvedValue(duplicatePrompts);
      (PromptService as any).promptsCache = null;
      
      const tags = await PromptService.getTags();
      
      expect(tags).toHaveLength(5); // test, sample, dev, code, new
    });

    it('should flatten nested tag arrays', async () => {
      const tags = await PromptService.getTags();
      
      // Should be a flat array, not nested
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.every(tag => typeof tag === 'string')).toBe(true);
    });
  });
});

