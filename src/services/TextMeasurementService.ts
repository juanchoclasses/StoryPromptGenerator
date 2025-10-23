import type { PanelConfig } from '../types/Book';

export interface TextFitResult {
  fits: boolean;
  requiredHeight: number;
  requiredHeightPercentage: number;
  lineCount: number;
}

// Measure text and determine if it fits in the panel
export function measureTextFit(
  text: string,
  imageWidth: number,
  imageHeight: number,
  config: PanelConfig
): TextFitResult {
  // Create a temporary canvas for measurement
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Set font for measurement
  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  
  // Calculate panel dimensions
  const panelWidth = Math.round(imageWidth * (config.widthPercentage / 100));
  const panelHeight = Math.round(imageHeight * (config.heightPercentage / 100));
  const innerWidth = panelWidth - (config.padding * 2);
  
  // Calculate line height
  const lineHeight = Math.round(config.fontSize * 1.3);
  
  // Word-wrap text and count lines (same logic as OverlayService)
  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);
  
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    
    const words = paragraph.split(/\s+/);
    let line = "";
    
    for (const word of words) {
      const test = line ? line + " " + word : word;
      const w = ctx.measureText(test).width;
      if (w <= innerWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  
  const lineCount = lines.length;
  const requiredHeight = (lineCount * lineHeight) + (config.padding * 2);
  const requiredHeightPercentage = Math.ceil((requiredHeight / imageHeight) * 100);
  
  const fits = requiredHeight <= panelHeight;
  
  return {
    fits,
    requiredHeight,
    requiredHeightPercentage,
    lineCount
  };
}

// Calculate optimal height for text to fit
export function calculateOptimalHeight(
  text: string,
  imageWidth: number,
  imageHeight: number,
  config: PanelConfig
): number {
  const result = measureTextFit(text, imageWidth, imageHeight, config);
  return result.requiredHeightPercentage;
}

