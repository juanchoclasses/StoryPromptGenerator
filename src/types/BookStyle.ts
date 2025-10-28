import type { PanelConfig } from './Book';
import { DEFAULT_PANEL_CONFIG } from './Book';

/**
 * BookStyle defines the visual style guidelines that apply to all stories in a book.
 * This ensures consistent visual appearance across all generated images in the book.
 */
export interface BookStyle {
  // Visual style guidance
  colorPalette?: string;         // Description of colors to use (e.g., "Jewel tones with pastels")
  visualTheme?: string;          // Overall visual theme/aesthetic (e.g., "Whimsical, educational")
  characterStyle?: string;       // How characters should look (e.g., "Exaggerated proportions, expressive")
  environmentStyle?: string;     // How environments should look (e.g., "Impossible geometry, oversized materials")
  artStyle?: string;             // Art style (e.g., "hand-painted", "digital", "watercolor")
  
  // Panel configuration (for text overlays)
  panelConfig?: PanelConfig;
}

/**
 * Default book style configuration
 */
export const DEFAULT_BOOK_STYLE: BookStyle = {
  colorPalette: undefined,
  visualTheme: undefined,
  characterStyle: undefined,
  environmentStyle: undefined,
  artStyle: undefined,
  panelConfig: DEFAULT_PANEL_CONFIG
};

/**
 * Creates a book style prompt section for image generation
 */
export function formatBookStyleForPrompt(style: BookStyle): string {
  const parts: string[] = [];
  
  if (style.visualTheme) {
    parts.push(`Visual Theme: ${style.visualTheme}`);
  }
  
  if (style.artStyle) {
    parts.push(`Art Style: ${style.artStyle}`);
  }
  
  if (style.colorPalette) {
    parts.push(`Color Palette: ${style.colorPalette}`);
  }
  
  if (style.characterStyle) {
    parts.push(`Character Style: ${style.characterStyle}`);
  }
  
  if (style.environmentStyle) {
    parts.push(`Environment Style: ${style.environmentStyle}`);
  }
  
  return parts.length > 0 ? parts.join('\n') : '';
}

