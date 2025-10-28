/**
 * Aspect ratio options for image generation
 * 
 * Different models support different aspect ratios:
 * - ChatGPT: 1:1, 16:9, 9:16
 * - Gemini: Many more ratios including portrait/landscape variations
 */

export const ASPECT_RATIOS = [
  // Square
  { value: '1:1', label: '1:1 (Square)', category: 'Square' },
  
  // Portrait (taller than wide)
  { value: '2:3', label: '2:3 (Portrait)', category: 'Portrait' },
  { value: '3:4', label: '3:4 (Portrait)', category: 'Portrait' },
  { value: '9:16', label: '9:16 (Portrait)', category: 'Portrait' },
  
  // Landscape (wider than tall)
  { value: '3:2', label: '3:2 (Landscape)', category: 'Landscape' },
  { value: '4:3', label: '4:3 (Landscape)', category: 'Landscape' },
  { value: '16:9', label: '16:9 (Wide Landscape)', category: 'Landscape' },
];

// ChatGPT-specific limitations (only these 3)
export const CHATGPT_ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '9:16'
];

// Gemini supports all ratios
export const GEMINI_ASPECT_RATIOS = ASPECT_RATIOS.map(r => r.value);

