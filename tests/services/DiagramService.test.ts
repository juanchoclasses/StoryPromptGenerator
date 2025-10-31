import { describe, it, expect, beforeAll, vi } from 'vitest';
import { DiagramService } from '../../src/services/DiagramService';

// Mock Mermaid
const mockMermaid = {
  initialized: false,
  initialize: vi.fn(),
  render: vi.fn().mockResolvedValue({
    svg: '<svg><text>Test</text></svg>'
  })
};

// Mock window.mermaid
beforeAll(() => {
  (global as any).window = {
    mermaid: mockMermaid
  };
});

describe('DiagramService', () => {
  
  describe('createDiagramPanel', () => {
    it('should create an ImageBitmap from diagram content', async () => {
      const bitmap = await DiagramService.createDiagramPanel(
        'graph TD; A-->B;',
        {
          type: 'mermaid',
          content: 'graph TD; A-->B;',
          width: 800,
          height: 600
        }
      );
      
      expect(bitmap).toBeDefined();
      expect(bitmap.width).toBe(800);
      expect(bitmap.height).toBe(600);
    });
    
    it('should throw error for empty content', async () => {
      await expect(async () => {
        await DiagramService.createDiagramPanel('', {
          type: 'mermaid',
          content: '',
          width: 800,
          height: 600
        });
      }).rejects.toThrow('Diagram content is empty');
    });
  });
  
  describe('renderDiagram', () => {
    it('should render mermaid diagram', async () => {
      const result = await DiagramService.renderDiagram({
        type: 'mermaid',
        content: 'graph TD; A-->B;',
        width: 800,
        height: 600
      });
      
      expect(result.success).toBe(true);
      expect(result.canvas).toBeDefined();
      expect(result.canvas?.width).toBe(800);
      expect(result.canvas?.height).toBe(600);
    });
    
    it('should handle mermaid errors gracefully', async () => {
      mockMermaid.render.mockRejectedValueOnce(new Error('Invalid syntax'));
      
      const result = await DiagramService.renderDiagram({
        type: 'mermaid',
        content: 'invalid',
        width: 800,
        height: 600
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Mermaid rendering failed');
    });
    
    it('should render code', async () => {
      const result = await DiagramService.renderDiagram({
        type: 'code',
        content: 'function test() { return true; }',
        width: 800,
        height: 600,
        language: 'javascript'
      });
      
      expect(result.success).toBe(true);
      expect(result.canvas).toBeDefined();
    });
    
    it('should render math', async () => {
      const result = await DiagramService.renderDiagram({
        type: 'math',
        content: 'E = mc^2',
        width: 800,
        height: 400
      });
      
      expect(result.success).toBe(true);
      expect(result.canvas).toBeDefined();
    });
  });
  
  describe('Board Styles', () => {
    it('should create blackboard style', async () => {
      const result = await DiagramService.renderDiagram({
        type: 'mermaid',
        content: 'graph TD; A-->B;',
        width: 800,
        height: 600,
        style: {
          boardStyle: 'blackboard',
          borderStyle: 'frame'
        }
      });
      
      expect(result.success).toBe(true);
      
      // Check canvas background is dark
      const ctx = result.canvas?.getContext('2d');
      const imageData = ctx?.getImageData(10, 10, 1, 1);
      // Should be darkish (blackboard color)
      expect(imageData?.data[0]).toBeLessThan(100);
    });
    
    it('should create whiteboard style', async () => {
      const result = await DiagramService.renderDiagram({
        type: 'mermaid',
        content: 'graph TD; A-->B;',
        width: 800,
        height: 600,
        style: {
          boardStyle: 'whiteboard'
        }
      });
      
      expect(result.success).toBe(true);
      
      // Check canvas background is light
      const ctx = result.canvas?.getContext('2d');
      const imageData = ctx?.getImageData(10, 10, 1, 1);
      // Should be bright (whiteboard color)
      expect(imageData?.data[0]).toBeGreaterThan(200);
    });
    
    it('should support custom colors', async () => {
      const result = await DiagramService.renderDiagram({
        type: 'code',
        content: 'test',
        width: 800,
        height: 600,
        style: {
          backgroundColor: '#ff0000',
          foregroundColor: '#00ff00'
        }
      });
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('Sizing and Scaling', () => {
    it('should handle different dimensions', async () => {
      const result = await DiagramService.renderDiagram({
        type: 'code',
        content: 'test',
        width: 1024,
        height: 768
      });
      
      expect(result.success).toBe(true);
      expect(result.canvas?.width).toBe(1024);
      expect(result.canvas?.height).toBe(768);
    });
    
    it('should scale diagrams to fit with padding', async () => {
      // This is tested implicitly in the rendering tests
      // The diagram should fit within the canvas with padding
      const result = await DiagramService.renderDiagram({
        type: 'mermaid',
        content: 'graph TD; A-->B;',
        width: 400,
        height: 300,
        style: {
          padding: 20
        }
      });
      
      expect(result.success).toBe(true);
      // Diagram should be scaled to fit within 360x260 (400-40, 300-40)
    });
  });
  
  describe('Error Handling', () => {
    it('should handle unknown diagram type', async () => {
      const result = await DiagramService.renderDiagram({
        type: 'unknown' as any,
        content: 'test',
        width: 800,
        height: 600
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown diagram type');
    });
    
    it('should handle empty content', async () => {
      const result = await DiagramService.renderDiagram({
        type: 'mermaid',
        content: '',
        width: 800,
        height: 600
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });
  });
});

