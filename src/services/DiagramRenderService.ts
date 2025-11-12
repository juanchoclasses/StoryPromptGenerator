/**
 * DiagramRenderService
 * 
 * Renders diagrams (Mermaid, Math, Code, Markdown) onto blackboard/whiteboard backgrounds
 * and returns them as ImageBitmap for compositing onto scene images.
 * 
 * Based on tested prototype in test-diagram-renderer.html
 */

import mermaid from 'mermaid';
import katex from 'katex';
import hljs from 'highlight.js';
import { marked } from 'marked';
import html2canvas from 'html2canvas';
import type { DiagramPanel, DiagramStyle, BoardStyle } from '../types/Story';

/**
 * Initialize libraries on first use
 */
let initialized = false;

function initializeLibraries(): void {
  if (initialized) return;

  // Initialize Mermaid
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      primaryColor: '#ffffff',
      primaryTextColor: '#000000',
      primaryBorderColor: '#000000',
      lineColor: '#000000',
      secondaryColor: '#ffffff',
      tertiaryColor: '#ffffff'
    }
  });

  initialized = true;
}

/**
 * Get syntax highlighting colors based on board style
 */
function getSyntaxHighlightingCSS(boardStyle: BoardStyle): string {
  if (boardStyle === 'blackboard') {
    // Bright chalk colors for dark background
    return `
      .hljs-keyword { color: #ff6b9d !important; }
      .hljs-function { color: #5fff87 !important; }
      .hljs-string { color: #ffff5f !important; }
      .hljs-comment { color: #87ceeb !important; }
      .hljs-number { color: #d787ff !important; }
      .hljs-literal { color: #d787ff !important; }
      .hljs-built_in { color: #5fdfff !important; }
      .hljs-title { color: #5fff87 !important; }
      .hljs-class { color: #5fdfff !important; }
      .hljs-type { color: #5fdfff !important; }
      .hljs-params { color: #ffaf5f !important; }
      .hljs-attr { color: #5fff87 !important; }
      .hljs-variable { color: #ffffff !important; }
      .hljs-punctuation { color: #ffffff !important; }
      .hljs-operator { color: #ff6b9d !important; }
      .hljs-doctag { color: #5fdfff !important; }
      .hljs-meta { color: #5fdfff !important; }
      .hljs-name { color: #5fff87 !important; }
      .hljs-tag { color: #ff6b9d !important; }
    `;
  } else {
    // Dark marker colors for white background
    return `
      .hljs-keyword { color: #d73a49 !important; }
      .hljs-function { color: #005cc5 !important; }
      .hljs-string { color: #22863a !important; }
      .hljs-comment { color: #6a737d !important; }
      .hljs-number { color: #6f42c1 !important; }
      .hljs-literal { color: #6f42c1 !important; }
      .hljs-built_in { color: #005cc5 !important; }
      .hljs-title { color: #6f42c1 !important; }
      .hljs-class { color: #d73a49 !important; }
      .hljs-type { color: #005cc5 !important; }
      .hljs-params { color: #e36209 !important; }
      .hljs-attr { color: #005cc5 !important; }
      .hljs-variable { color: #24292e !important; }
      .hljs-punctuation { color: #24292e !important; }
      .hljs-operator { color: #d73a49 !important; }
      .hljs-doctag { color: #6a737d !important; }
      .hljs-meta { color: #6a737d !important; }
      .hljs-name { color: #22863a !important; }
      .hljs-tag { color: #d73a49 !important; }
    `;
  }
}

/**
 * Render a Mermaid diagram to canvas
 */
async function renderMermaid(
  content: string,
  style: DiagramStyle,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  initializeLibraries();

  // Render Mermaid to SVG
  // Generate a valid CSS ID (no dots allowed)
  const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const { svg } = await mermaid.render(id, content);

  // DEBUG: Log SVG for inspection
  console.log('=== MERMAID SVG OUTPUT ===');
  console.log(svg);
  console.log('=== RENDER DIMENSIONS ===');
  console.log('Panel dimensions:', width, 'x', height);

  // Create temporary container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = width + 'px';
  tempContainer.style.height = height + 'px';
  tempContainer.style.minWidth = width + 'px';
  tempContainer.style.maxWidth = width + 'px';
  tempContainer.style.minHeight = height + 'px';
  tempContainer.style.maxHeight = height + 'px';
  tempContainer.style.backgroundColor = style.backgroundColor;
  tempContainer.style.padding = style.padding + 'px';
  tempContainer.style.boxSizing = 'border-box';
  tempContainer.style.border = `${style.borderWidth}px solid ${style.borderColor}`;
  tempContainer.style.display = 'flex';
  tempContainer.style.alignItems = 'center';
  tempContainer.style.justifyContent = 'center';
  tempContainer.style.overflow = 'hidden';
  tempContainer.innerHTML = svg;

  document.body.appendChild(tempContainer);

  // Add CSS to constrain SVG to fit within container (prevents overflow)
  const svgElement = tempContainer.querySelector('svg');
  if (svgElement) {
    // Calculate max dimensions (accounting for padding and border)
    const maxWidth = width - (style.padding * 2) - (style.borderWidth * 2);
    const maxHeight = height - (style.padding * 2) - (style.borderWidth * 2);
    
    // Get the SVG's natural dimensions from viewBox or width/height attributes
    const viewBox = svgElement.getAttribute('viewBox');
    let svgNaturalWidth: number;
    let svgNaturalHeight: number;
    
    if (viewBox) {
      const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
      svgNaturalWidth = vbWidth;
      svgNaturalHeight = vbHeight;
    } else {
      // Fallback: try to get from attributes before we remove them
      const widthAttr = svgElement.getAttribute('width');
      const heightAttr = svgElement.getAttribute('height');
      svgNaturalWidth = widthAttr && widthAttr !== '100%' ? parseFloat(widthAttr) : 800;
      svgNaturalHeight = heightAttr && heightAttr !== '100%' ? parseFloat(heightAttr) : 600;
    }
    
    // Calculate scale to fit within available space while maintaining aspect ratio
    const scaleX = maxWidth / svgNaturalWidth;
    const scaleY = maxHeight / svgNaturalHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Calculate final dimensions
    const finalWidth = Math.floor(svgNaturalWidth * scale);
    const finalHeight = Math.floor(svgNaturalHeight * scale);
    
    console.log('SVG natural size:', svgNaturalWidth, 'x', svgNaturalHeight);
    console.log('Available space:', maxWidth, 'x', maxHeight);
    console.log('Scale factor:', scale);
    console.log('Final SVG size:', finalWidth, 'x', finalHeight);
    
    // Remove ALL size-related attributes and inline styles to prevent interference
    svgElement.removeAttribute('width');
    svgElement.removeAttribute('height');
    svgElement.removeAttribute('style');
    
    // Set explicit size via CSS - this overrides everything
    svgElement.style.width = finalWidth + 'px';
    svgElement.style.height = finalHeight + 'px';
    svgElement.style.maxWidth = 'none';
    svgElement.style.maxHeight = 'none';
    svgElement.style.display = 'block';
    svgElement.style.margin = '0 auto';
    
    // Force layout update and check actual size
    const rect = svgElement.getBoundingClientRect();
    console.log('SVG actual rendered size:', rect.width, 'x', rect.height);
  }

  try {
    // Convert to canvas using html2canvas
    const canvas = await html2canvas(tempContainer, {
      width: width,
      height: height,
      backgroundColor: null,
      scale: 2
    });

    console.log('html2canvas output:', canvas.width, 'x', canvas.height);
    console.log('Expected (with scale 2):', width * 2, 'x', height * 2);

    return canvas;
  } finally {
    document.body.removeChild(tempContainer);
  }
}

/**
 * Render LaTeX math equations to canvas
 */
async function renderMath(
  content: string,
  style: DiagramStyle,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {

  // Create temporary container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = width + 'px';
  tempContainer.style.height = height + 'px';
  tempContainer.style.backgroundColor = style.backgroundColor;
  tempContainer.style.padding = style.padding + 'px';
  tempContainer.style.boxSizing = 'border-box';
  tempContainer.style.border = `${style.borderWidth}px solid ${style.borderColor}`;
  tempContainer.style.color = style.foregroundColor;
  tempContainer.style.fontSize = style.fontSize + 'px';
  tempContainer.style.overflow = 'auto';

  document.body.appendChild(tempContainer);

  try {
    // Render each line as a KaTeX equation
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        const mathDiv = document.createElement('div');
        mathDiv.style.margin = '20px 0';
        mathDiv.style.textAlign = 'center';
        try {
          katex.render(line, mathDiv, {
            displayMode: true,
            throwOnError: false,
            output: 'html'
          });
        } catch {
          mathDiv.textContent = line;
        }
        tempContainer.appendChild(mathDiv);
      }
    });

    // Convert to canvas
    const canvas = await html2canvas(tempContainer, {
      width: width,
      height: height,
      backgroundColor: null,
      scale: 2
    });

    return canvas;
  } finally {
    document.body.removeChild(tempContainer);
  }
}

/**
 * Render code with syntax highlighting to canvas
 */
async function renderCode(
  content: string,
  language: string,
  style: DiagramStyle,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {

  // Create style element for syntax highlighting
  const styleElement = document.createElement('style');
  styleElement.textContent = getSyntaxHighlightingCSS(style.boardStyle);
  document.head.appendChild(styleElement);

  // Create temporary container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = width + 'px';
  tempContainer.style.height = height + 'px';
  tempContainer.style.backgroundColor = style.backgroundColor;
  tempContainer.style.padding = style.padding + 'px';
  tempContainer.style.boxSizing = 'border-box';
  tempContainer.style.border = `${style.borderWidth}px solid ${style.borderColor}`;
  tempContainer.style.overflow = 'auto';

  document.body.appendChild(tempContainer);

  try {
    // Create pre and code elements
    const pre = document.createElement('pre');
    pre.style.margin = '0';
    pre.style.padding = '0';
    pre.style.background = 'transparent';
    pre.style.fontSize = style.fontSize + 'px';
    pre.style.lineHeight = '1.4';

    const code = document.createElement('code');
    code.className = `language-${language}`;
    code.textContent = content;
    code.style.fontFamily = '"Monaco", "Consolas", "Courier New", monospace';

    pre.appendChild(code);
    tempContainer.appendChild(pre);

    // Apply syntax highlighting
    hljs.highlightElement(code);

    // Convert to canvas
    const canvas = await html2canvas(tempContainer, {
      width: width,
      height: height,
      backgroundColor: null,
      scale: 2
    });

    return canvas;
  } finally {
    document.body.removeChild(tempContainer);
    document.head.removeChild(styleElement);
  }
}

/**
 * Render markdown to canvas
 */
async function renderMarkdown(
  content: string,
  style: DiagramStyle,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {

  // Create temporary container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = width + 'px';
  tempContainer.style.height = height + 'px';
  tempContainer.style.backgroundColor = style.backgroundColor;
  tempContainer.style.padding = style.padding + 'px';
  tempContainer.style.boxSizing = 'border-box';
  tempContainer.style.border = `${style.borderWidth}px solid ${style.borderColor}`;
  tempContainer.style.color = style.foregroundColor;
  tempContainer.style.fontSize = style.fontSize + 'px';
  tempContainer.style.fontFamily = 'Arial, sans-serif';
  tempContainer.style.lineHeight = '1.6';
  tempContainer.style.overflow = 'auto';

  document.body.appendChild(tempContainer);

  try {
    // Parse and render markdown
    tempContainer.innerHTML = marked.parse(content) as string;

    // Style the rendered markdown
    tempContainer.querySelectorAll('h1').forEach(el => {
      (el as HTMLElement).style.fontSize = (style.fontSize * 1.8) + 'px';
      (el as HTMLElement).style.marginTop = '0';
      (el as HTMLElement).style.marginBottom = '20px';
      (el as HTMLElement).style.fontWeight = 'bold';
    });
    tempContainer.querySelectorAll('h2').forEach(el => {
      (el as HTMLElement).style.fontSize = (style.fontSize * 1.4) + 'px';
      (el as HTMLElement).style.marginTop = '20px';
      (el as HTMLElement).style.marginBottom = '15px';
      (el as HTMLElement).style.fontWeight = 'bold';
    });
    tempContainer.querySelectorAll('h3').forEach(el => {
      (el as HTMLElement).style.fontSize = (style.fontSize * 1.2) + 'px';
      (el as HTMLElement).style.marginTop = '15px';
      (el as HTMLElement).style.marginBottom = '10px';
      (el as HTMLElement).style.fontWeight = 'bold';
    });
    tempContainer.querySelectorAll('ul, ol').forEach(el => {
      (el as HTMLElement).style.marginLeft = '30px';
      (el as HTMLElement).style.marginBottom = '15px';
    });
    tempContainer.querySelectorAll('li').forEach(el => {
      (el as HTMLElement).style.marginBottom = '8px';
    });
    tempContainer.querySelectorAll('strong').forEach(el => {
      (el as HTMLElement).style.fontWeight = 'bold';
    });
    tempContainer.querySelectorAll('em').forEach(el => {
      (el as HTMLElement).style.fontStyle = 'italic';
    });
    tempContainer.querySelectorAll('p').forEach(el => {
      (el as HTMLElement).style.marginBottom = '15px';
    });

    // Convert to canvas
    const canvas = await html2canvas(tempContainer, {
      width: width,
      height: height,
      backgroundColor: null,
      scale: 2
    });

    return canvas;
  } finally {
    document.body.removeChild(tempContainer);
  }
}

/**
 * Main function to render a diagram panel to canvas
 * Returns a canvas that can be composited onto an image
 */
export async function renderDiagramToCanvas(
  diagramPanel: DiagramPanel,
  diagramStyle: DiagramStyle,
  targetWidth: number = 800,
  targetHeight: number = 600
): Promise<HTMLCanvasElement> {
  try {
    switch (diagramPanel.type) {
      case 'mermaid':
        return await renderMermaid(diagramPanel.content, diagramStyle, targetWidth, targetHeight);
      
      case 'math':
        return await renderMath(diagramPanel.content, diagramStyle, targetWidth, targetHeight);
      
      case 'code':
        return await renderCode(
          diagramPanel.content,
          diagramPanel.language || 'javascript',
          diagramStyle,
          targetWidth,
          targetHeight
        );
      
      case 'markdown':
        return await renderMarkdown(diagramPanel.content, diagramStyle, targetWidth, targetHeight);
      
      default:
        throw new Error(`Unknown diagram type: ${diagramPanel.type}`);
    }
  } catch (error) {
    console.error('Error rendering diagram:', error);
    throw error;
  }
}

/**
 * Convert canvas to data URL for storage/display
 */
export function canvasToDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Convert canvas to ImageBitmap for efficient compositing
 */
export async function canvasToImageBitmap(canvas: HTMLCanvasElement): Promise<ImageBitmap> {
  return await createImageBitmap(canvas);
}

/**
 * Measure the natural size of diagram content before scaling
 * Returns the natural dimensions needed to fit the content
 */
export async function measureDiagramNaturalSize(
  diagramPanel: DiagramPanel,
  diagramStyle: DiagramStyle,
  maxWidth: number
): Promise<{ width: number; height: number }> {
  initializeLibraries();
  
  try {
    // Create a temporary container to render the diagram content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.maxWidth = maxWidth + 'px';
    tempContainer.style.padding = diagramStyle.padding + 'px';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.border = `${diagramStyle.borderWidth}px solid transparent`;
    
    document.body.appendChild(tempContainer);
    
    try {
      switch (diagramPanel.type) {
        case 'mermaid': {
          // Render Mermaid to get natural SVG size
          const id = `measure-mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const { svg } = await mermaid.render(id, diagramPanel.content);
          tempContainer.innerHTML = svg;
          
          const svgElement = tempContainer.querySelector('svg');
          if (svgElement) {
            // Get natural dimensions from viewBox or attributes
            const viewBox = svgElement.getAttribute('viewBox');
            let naturalWidth: number;
            let naturalHeight: number;
            
            if (viewBox) {
              const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
              naturalWidth = vbWidth;
              naturalHeight = vbHeight;
            } else {
              const widthAttr = svgElement.getAttribute('width');
              const heightAttr = svgElement.getAttribute('height');
              naturalWidth = widthAttr && widthAttr !== '100%' ? parseFloat(widthAttr) : 800;
              naturalHeight = heightAttr && heightAttr !== '100%' ? parseFloat(heightAttr) : 600;
            }
            
            // Account for padding and border
            const totalPadding = (diagramStyle.padding * 2) + (diagramStyle.borderWidth * 2);
            
            // Scale to fit within maxWidth if necessary
            const finalWidth = Math.min(naturalWidth + totalPadding, maxWidth);
            let finalHeight = naturalHeight + totalPadding;
            
            if (naturalWidth + totalPadding > maxWidth) {
              const scale = (maxWidth - totalPadding) / naturalWidth;
              finalHeight = (naturalHeight * scale) + totalPadding;
            }
            
            return { width: Math.ceil(finalWidth), height: Math.ceil(finalHeight) };
          }
          break;
        }
        
        case 'math': {
          // Render math equations to measure
          tempContainer.style.fontSize = diagramStyle.fontSize + 'px';
          tempContainer.style.width = maxWidth + 'px';
          
          const lines = diagramPanel.content.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              const mathDiv = document.createElement('div');
              mathDiv.style.margin = '20px 0';
              mathDiv.style.textAlign = 'center';
              try {
                katex.render(line, mathDiv, {
                  displayMode: true,
                  throwOnError: false,
                  output: 'html'
                });
              } catch {
                mathDiv.textContent = line;
              }
              tempContainer.appendChild(mathDiv);
            }
          });
          
          // Measure the rendered content
          const rect = tempContainer.getBoundingClientRect();
          return { 
            width: Math.ceil(Math.min(rect.width, maxWidth)), 
            height: Math.ceil(rect.height) 
          };
        }
        
        case 'code': {
          // Create code block to measure
          tempContainer.style.fontSize = diagramStyle.fontSize + 'px';
          tempContainer.style.width = maxWidth + 'px';
          tempContainer.style.whiteSpace = 'pre';
          tempContainer.style.fontFamily = '"Monaco", "Consolas", "Courier New", monospace';
          tempContainer.style.lineHeight = '1.4';
          
          const pre = document.createElement('pre');
          pre.style.margin = '0';
          pre.style.padding = '0';
          const code = document.createElement('code');
          code.textContent = diagramPanel.content;
          pre.appendChild(code);
          tempContainer.appendChild(pre);
          
          const rect = tempContainer.getBoundingClientRect();
          return { 
            width: Math.ceil(Math.min(rect.width, maxWidth)), 
            height: Math.ceil(rect.height) 
          };
        }
        
        case 'markdown': {
          // Render markdown to measure
          tempContainer.style.fontSize = diagramStyle.fontSize + 'px';
          tempContainer.style.width = maxWidth + 'px';
          tempContainer.style.lineHeight = '1.6';
          tempContainer.style.fontFamily = 'Arial, sans-serif';
          
          tempContainer.innerHTML = marked.parse(diagramPanel.content) as string;
          
          const rect = tempContainer.getBoundingClientRect();
          return { 
            width: Math.ceil(Math.min(rect.width, maxWidth)), 
            height: Math.ceil(rect.height) 
          };
        }
      }
      
      // Default fallback
      return { width: maxWidth, height: 600 };
    } finally {
      document.body.removeChild(tempContainer);
    }
  } catch (error) {
    console.error('Error measuring diagram size:', error);
    // Return reasonable defaults on error
    return { width: maxWidth, height: 600 };
  }
}

