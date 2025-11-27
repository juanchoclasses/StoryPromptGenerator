import { describe, it, expect, beforeEach, vi } from 'vitest';
import { measureTextFit, calculateOptimalHeight } from '../../src/services/TextMeasurementService';
import type { PanelConfig } from '../../src/types/Book';

describe('TextMeasurementService', () => {
  let mockConfig: PanelConfig;
  let mockCanvas: any;
  let mockCtx: any;

  beforeEach(() => {
    mockConfig = {
      fontSize: 24,
      fontFamily: 'Arial',
      widthPercentage: 80,
      heightPercentage: 20,
      padding: 20
    };

    // Mock canvas context
    mockCtx = {
      font: '',
      measureText: vi.fn((text: string) => ({
        width: text.length * 12 // Simple mock: 12px per character
      }))
    };

    // Mock canvas
    mockCanvas = {
      getContext: vi.fn(() => mockCtx)
    };

    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return mockCanvas as any;
      }
      return {} as any;
    });
  });

  describe('measureTextFit', () => {
    it('should measure text that fits', () => {
      const text = 'Short text';
      const imageWidth = 1000;
      const imageHeight = 500;

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      expect(result.fits).toBe(true);
      expect(result.lineCount).toBeGreaterThan(0);
      expect(result.requiredHeight).toBeGreaterThan(0);
    });

    it('should measure text that doesnt fit', () => {
      const text = 'This is a very long text'.repeat(100);
      const imageWidth = 1000;
      const imageHeight = 100; // Small height
      mockConfig.heightPercentage = 10; // Small panel

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      expect(result.fits).toBe(false);
      expect(result.lineCount).toBeGreaterThan(1);
    });

    it('should set font on canvas context', () => {
      const text = 'Test';
      const imageWidth = 1000;
      const imageHeight = 500;

      measureTextFit(text, imageWidth, imageHeight, mockConfig);

      expect(mockCtx.font).toBe('24px Arial');
    });

    it('should calculate panel dimensions correctly', () => {
      const text = 'Test';
      const imageWidth = 1000;
      const imageHeight = 500;
      mockConfig.widthPercentage = 50;

      measureTextFit(text, imageWidth, imageHeight, mockConfig);

      // Panel width should be 50% of 1000 = 500
      // Inner width should be 500 - (20 * 2) = 460
      expect(mockCtx.measureText).toHaveBeenCalled();
    });

    it('should handle empty text', () => {
      const text = '';
      const imageWidth = 1000;
      const imageHeight = 500;

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      // Empty text still counts as 1 line (empty line)
      expect(result.lineCount).toBeGreaterThanOrEqual(0);
      expect(result.fits).toBe(true);
    });

    it('should handle text with newlines', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const imageWidth = 1000;
      const imageHeight = 500;

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      expect(result.lineCount).toBeGreaterThanOrEqual(3);
    });

    it('should handle text with empty lines', () => {
      const text = 'Line 1\n\nLine 3';
      const imageWidth = 1000;
      const imageHeight = 500;

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      // Should include the empty line
      expect(result.lineCount).toBeGreaterThanOrEqual(2);
    });

    it('should wrap long lines', () => {
      // Create text longer than panel width
      const longWord = 'word '.repeat(100);
      const imageWidth = 1000;
      const imageHeight = 500;

      const result = measureTextFit(longWord, imageWidth, imageHeight, mockConfig);

      // Should wrap into multiple lines
      expect(result.lineCount).toBeGreaterThan(1);
    });

    it('should calculate required height correctly', () => {
      const text = 'Test';
      const imageWidth = 1000;
      const imageHeight = 500;
      mockConfig.fontSize = 20;

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      // Line height should be fontSize * 1.3 = 26
      // Required height should be (lineCount * 26) + (padding * 2)
      expect(result.requiredHeight).toBeGreaterThan(0);
      expect(result.requiredHeight).toBe(result.lineCount * Math.round(20 * 1.3) + (mockConfig.padding * 2));
    });

    it('should calculate required height percentage', () => {
      const text = 'Test';
      const imageWidth = 1000;
      const imageHeight = 500;

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      expect(result.requiredHeightPercentage).toBeGreaterThan(0);
      expect(result.requiredHeightPercentage).toBeLessThanOrEqual(100);
    });

    it('should respect padding in calculations', () => {
      const text = 'Test';
      const imageWidth = 1000;
      const imageHeight = 500;
      mockConfig.padding = 50;

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      // Required height should include 2 * padding
      expect(result.requiredHeight).toBeGreaterThanOrEqual(100); // At least padding * 2
    });

    it('should handle different font sizes', () => {
      const text = 'Test';
      const imageWidth = 1000;
      const imageHeight = 500;

      const result1 = measureTextFit(text, imageWidth, imageHeight, { ...mockConfig, fontSize: 10 });
      const result2 = measureTextFit(text, imageWidth, imageHeight, { ...mockConfig, fontSize: 50 });

      // Larger font should require more height
      expect(result2.requiredHeight).toBeGreaterThan(result1.requiredHeight);
    });

    it('should handle different panel sizes', () => {
      const text = 'Test';
      const imageWidth = 1000;
      const imageHeight = 500;

      const result1 = measureTextFit(text, imageWidth, imageHeight, { ...mockConfig, heightPercentage: 10 });
      const result2 = measureTextFit(text, imageWidth, imageHeight, { ...mockConfig, heightPercentage: 50 });

      // Both should calculate same required height, but fit differently
      expect(result1.requiredHeight).toBe(result2.requiredHeight);
      // Larger panel more likely to fit
      if (!result1.fits) {
        // If small panel doesn't fit, large panel might
        // (though with our simple mock, both might fit)
      }
    });

    it('should handle Windows-style line breaks', () => {
      const text = 'Line 1\r\nLine 2\r\nLine 3';
      const imageWidth = 1000;
      const imageHeight = 500;

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      expect(result.lineCount).toBeGreaterThanOrEqual(3);
    });

    it('should trim whitespace in paragraphs', () => {
      const text = '   Test   \n   Another   ';
      const imageWidth = 1000;
      const imageHeight = 500;

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      expect(result.lineCount).toBeGreaterThan(0);
    });

    it('should handle very narrow panels', () => {
      const text = 'Test';
      const imageWidth = 100; // Small width
      const imageHeight = 500;
      mockConfig.widthPercentage = 10; // Very narrow

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      // Should still work, just might have many lines
      expect(result.lineCount).toBeGreaterThan(0);
    });

    it('should round dimensions properly', () => {
      const text = 'Test';
      const imageWidth = 999; // Odd number
      const imageHeight = 555;

      const result = measureTextFit(text, imageWidth, imageHeight, mockConfig);

      // Should handle rounding without errors
      expect(result.requiredHeight).toBeGreaterThan(0);
      expect(Number.isInteger(result.requiredHeight)).toBe(true);
    });
  });

  describe('calculateOptimalHeight', () => {
    it('should return optimal height percentage', () => {
      const text = 'Test text';
      const imageWidth = 1000;
      const imageHeight = 500;

      const optimalHeight = calculateOptimalHeight(text, imageWidth, imageHeight, mockConfig);

      expect(optimalHeight).toBeGreaterThan(0);
      expect(optimalHeight).toBeLessThanOrEqual(100);
    });

    it('should return same as requiredHeightPercentage from measureTextFit', () => {
      const text = 'Test text';
      const imageWidth = 1000;
      const imageHeight = 500;

      const measureResult = measureTextFit(text, imageWidth, imageHeight, mockConfig);
      const optimalHeight = calculateOptimalHeight(text, imageWidth, imageHeight, mockConfig);

      expect(optimalHeight).toBe(measureResult.requiredHeightPercentage);
    });

    it('should handle empty text', () => {
      const text = '';
      const imageWidth = 1000;
      const imageHeight = 500;

      const optimalHeight = calculateOptimalHeight(text, imageWidth, imageHeight, mockConfig);

      expect(optimalHeight).toBeGreaterThanOrEqual(0);
    });

    it('should handle long text', () => {
      const text = 'This is a very long text '.repeat(50);
      const imageWidth = 1000;
      const imageHeight = 500;

      const optimalHeight = calculateOptimalHeight(text, imageWidth, imageHeight, mockConfig);

      // Long text should need significant height
      expect(optimalHeight).toBeGreaterThan(10);
    });

    it('should scale with image size', () => {
      const text = 'Test';

      const small = calculateOptimalHeight(text, 500, 250, mockConfig);
      const large = calculateOptimalHeight(text, 2000, 1000, mockConfig);

      // Percentage should be consistent
      // (though absolute height differs, percentage should be similar for same text)
      expect(small).toBeGreaterThan(0);
      expect(large).toBeGreaterThan(0);
    });
  });
});

