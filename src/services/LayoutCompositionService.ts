import type { SceneLayout } from '../types/Story';
import { loadImage } from './OverlayService';

/**
 * Compose a scene using layout configuration
 * Creates a canvas with positioned elements according to the layout
 */
export async function composeSceneWithLayout(
  imageDataUrl: string,
  textPanelDataUrl: string | null,
  diagramPanelDataUrl: string | null,
  layout: SceneLayout
): Promise<string> {
  console.log('📐 Composing scene with layout:', layout.type);
  
  // Create canvas with configured dimensions
  const canvas = document.createElement('canvas');
  canvas.width = layout.canvas.width;
  canvas.height = layout.canvas.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Load all images
  const baseImage = await loadImage(imageDataUrl);
  const textPanelImage = textPanelDataUrl ? await loadImage(textPanelDataUrl) : null;
  const diagramPanelImage = diagramPanelDataUrl ? await loadImage(diagramPanelDataUrl) : null;

  // Draw elements in z-index order
  const elements = [
    { type: 'image', img: baseImage, config: layout.elements.image },
    { type: 'textPanel', img: textPanelImage, config: layout.elements.textPanel },
    { type: 'diagramPanel', img: diagramPanelImage, config: layout.elements.diagramPanel }
  ]
    .filter(el => el.img && el.config) // Only include elements that exist
    .sort((a, b) => (a.config?.zIndex || 0) - (b.config?.zIndex || 0)); // Sort by z-index

  // Draw each element
  for (const element of elements) {
    if (!element.img || !element.config) continue;
    
    // Convert percentage-based positions to actual pixels
    const x = Math.round((element.config.x / 100) * canvas.width);
    const y = Math.round((element.config.y / 100) * canvas.height);
    const width = Math.round((element.config.width / 100) * canvas.width);
    const height = Math.round((element.config.height / 100) * canvas.height);
    
    console.log(`  Drawing ${element.type}:`);
    console.log(`    Percentage: (${element.config.x}%, ${element.config.y}%) size ${element.config.width}%x${element.config.height}%`);
    console.log(`    Pixels: (${x}px, ${y}px) size ${width}x${height}px`);
    
    // Ensure image is fully loaded
    await element.img.decode();
    
    // Draw and scale the image to fit the layout dimensions
    ctx.drawImage(
      element.img,
      x,
      y,
      width,
      height
    );
  }

  // Convert to data URL
  return canvas.toDataURL('image/png');
}

/**
 * Generate a text panel as an image
 * Creates a styled panel with the given text
 */
export async function generateTextPanelImage(
  text: string,
  width: number,
  height: number,
  backgroundColor: string = 'rgba(76, 175, 80, 0.9)',
  textColor: string = '#ffffff',
  fontSize: number = 24
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Text
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Word wrap
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > width - 40 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Draw lines
  const lineHeight = fontSize * 1.2;
  const startY = (height - lines.length * lineHeight) / 2 + fontSize / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight);
  });

  return canvas.toDataURL('image/png');
}

