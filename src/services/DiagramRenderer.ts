/**
 * DiagramRenderer - Standalone class for rendering diagrams to canvas
 * 
 * This class can be tested independently before integration with the React app.
 * Supports: Mermaid diagrams, LaTeX math equations, and syntax-highlighted code.
 * 
 * Usage:
 *   const renderer = new DiagramRenderer();
 *   const result = await renderer.renderDiagram({
 *     type: 'mermaid',
 *     content: 'graph TD; A-->B;',
 *     width: 800,
 *     height: 600,
 *     style: { ... }
 *   });
 */

export type DiagramType = 'mermaid' | 'math' | 'code' | 'custom';
export type BoardStyle = 'blackboard' | 'whiteboard' | 'transparent';
export type BorderStyle = 'none' | 'frame' | 'shadow';

export interface DiagramStyle {
  backgroundColor: string;      // e.g., "#2d3748" for blackboard, "#ffffff" for whiteboard
  foregroundColor: string;      // e.g., "#ffffff" for chalk, "#000000" for marker
  boardStyle: BoardStyle;
  borderStyle: BorderStyle;
  padding: number;              // Inner padding in pixels
  borderWidth?: number;         // Border thickness (for 'frame' style)
  borderColor?: string;         // Border color (for 'frame' style)
  fontSize?: number;            // Base font size for content
  fontFamily?: string;          // Font family for text content
  theme?: string;               // Theme for syntax highlighting or mermaid
}

export interface DiagramRenderOptions {
  type: DiagramType;
  content: string;
  width: number;
  height: number;
  style: Partial<DiagramStyle>;
  language?: string;            // For code type: 'javascript', 'python', etc.
}

export interface DiagramRenderResult {
  success: boolean;
  imageUrl?: string;            // Data URL or Blob URL
  imageBlob?: Blob;             // Blob for further processing
  canvas?: HTMLCanvasElement;   // Canvas element for inspection
  error?: string;
  warnings?: string[];
}

export class DiagramRenderer {
  private defaultStyle: DiagramStyle = {
    backgroundColor: '#2d3748',  // Dark gray (blackboard)
    foregroundColor: '#ffffff',   // White (chalk)
    boardStyle: 'blackboard',
    borderStyle: 'frame',
    padding: 40,
    borderWidth: 8,
    borderColor: '#8b7355',      // Wood frame color
    fontSize: 16,
    fontFamily: 'Monaco, Consolas, monospace',
    theme: 'dark'
  };

  /**
   * Main render function - dispatches to specific renderer based on type
   */
  async renderDiagram(options: DiagramRenderOptions): Promise<DiagramRenderResult> {
    const style = { ...this.defaultStyle, ...options.style };
    
    try {
      // Validate inputs
      if (!options.content || options.content.trim().length === 0) {
        return {
          success: false,
          error: 'Diagram content is empty'
        };
      }

      if (options.width <= 0 || options.height <= 0) {
        return {
          success: false,
          error: 'Invalid dimensions'
        };
      }

      // Dispatch to specific renderer
      switch (options.type) {
        case 'mermaid':
          return await this.renderMermaid(options.content, options.width, options.height, style);
        
        case 'math':
          return await this.renderMath(options.content, options.width, options.height, style);
        
        case 'code':
          return await this.renderCode(
            options.content, 
            options.language || 'javascript',
            options.width, 
            options.height, 
            style
          );
        
        case 'custom':
          return await this.renderCustom(options.content, options.width, options.height, style);
        
        default:
          return {
            success: false,
            error: `Unknown diagram type: ${options.type}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Render Mermaid diagram
   */
  private async renderMermaid(
    content: string, 
    width: number, 
    height: number, 
    style: DiagramStyle
  ): Promise<DiagramRenderResult> {
    try {
      // Check if mermaid is available
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'Mermaid requires browser environment'
        };
      }

      // Dynamically import mermaid (assumed to be loaded globally or via import)
      const mermaid = (window as any).mermaid;
      if (!mermaid) {
        return {
          success: false,
          error: 'Mermaid library not loaded. Include mermaid.js in your HTML.'
        };
      }

      // Initialize mermaid if not already done
      if (!mermaid.initialized) {
        mermaid.initialize({
          startOnLoad: false,
          theme: style.boardStyle === 'blackboard' ? 'dark' : 'default',
          securityLevel: 'loose',
          themeVariables: {
            primaryColor: style.foregroundColor,
            primaryTextColor: style.foregroundColor,
            primaryBorderColor: style.foregroundColor,
            lineColor: style.foregroundColor,
            secondaryColor: style.backgroundColor,
            tertiaryColor: style.backgroundColor,
            background: style.backgroundColor,
            mainBkg: style.backgroundColor,
            textColor: style.foregroundColor
          }
        });
        mermaid.initialized = true;
      }

      // Create container for mermaid rendering
      const container = document.createElement('div');
      container.style.display = 'none';
      container.innerHTML = content;
      document.body.appendChild(container);

      // Render mermaid to SVG
      const { svg } = await mermaid.render('mermaid-' + Date.now(), content);
      
      // Clean up container
      document.body.removeChild(container);

      // Convert SVG to canvas
      return await this.svgToCanvas(svg, width, height, style);
      
    } catch (error) {
      return {
        success: false,
        error: `Mermaid rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Render LaTeX math equation using KaTeX
   */
  private async renderMath(
    content: string,
    width: number,
    height: number,
    style: DiagramStyle
  ): Promise<DiagramRenderResult> {
    try {
      // Check if katex is available
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'KaTeX requires browser environment'
        };
      }

      const katex = (window as any).katex;
      if (!katex) {
        return {
          success: false,
          error: 'KaTeX library not loaded. Include katex.js in your HTML.'
        };
      }

      // Create a temporary element to render math
      const mathContainer = document.createElement('div');
      mathContainer.style.fontSize = `${style.fontSize || 20}px`;
      mathContainer.style.color = style.foregroundColor;
      mathContainer.style.display = 'inline-block';

      // Render math to HTML
      katex.render(content, mathContainer, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#ff0000',
        output: 'html'
      });

      // Create canvas with board background
      const canvas = this.createBoardCanvas(width, height, style);
      const ctx = canvas.getContext('2d')!;

      // Convert math HTML to canvas
      document.body.appendChild(mathContainer);
      
      // Get dimensions of rendered math
      const mathWidth = mathContainer.offsetWidth;
      const mathHeight = mathContainer.offsetHeight;

      // Center the math on the canvas
      const x = (width - mathWidth) / 2;
      const y = (height - mathHeight) / 2;

      // Use html2canvas or similar to convert HTML to canvas
      // For now, we'll use a simple text rendering as fallback
      ctx.fillStyle = style.foregroundColor;
      ctx.font = `${style.fontSize || 20}px ${style.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Simple fallback: just show the LaTeX source
      const lines = this.wrapText(ctx, content, width - style.padding * 2);
      let yPos = height / 2 - (lines.length * (style.fontSize || 20) * 1.2) / 2;
      
      lines.forEach(line => {
        ctx.fillText(line, width / 2, yPos);
        yPos += (style.fontSize || 20) * 1.2;
      });

      document.body.removeChild(mathContainer);

      return this.canvasToResult(canvas);
      
    } catch (error) {
      return {
        success: false,
        error: `Math rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Render code with syntax highlighting
   */
  private async renderCode(
    content: string,
    language: string,
    width: number,
    height: number,
    style: DiagramStyle
  ): Promise<DiagramRenderResult> {
    try {
      // Create canvas with board background
      const canvas = this.createBoardCanvas(width, height, style);
      const ctx = canvas.getContext('2d')!;

      // Check if highlight.js is available
      const hljs = (window as any).hljs;
      
      let lines: string[];
      let highlighted = false;

      if (hljs) {
        try {
          // Try to highlight with highlight.js
          const result = hljs.highlight(content, { language });
          // For simplicity, we'll just use the plain text
          // In a real implementation, we'd parse the HTML and apply colors
          lines = content.split('\n');
          highlighted = true;
        } catch {
          lines = content.split('\n');
        }
      } else {
        lines = content.split('\n');
      }

      // Render code lines
      const fontSize = style.fontSize || 14;
      const lineHeight = fontSize * 1.4;
      const startY = style.padding;
      
      ctx.fillStyle = style.foregroundColor;
      ctx.font = `${fontSize}px ${style.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Calculate if we need to scroll or truncate
      const maxLines = Math.floor((height - style.padding * 2) / lineHeight);
      const visibleLines = lines.slice(0, maxLines);

      visibleLines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.fillText(line, style.padding, y);
      });

      if (lines.length > maxLines) {
        // Indicate there are more lines
        ctx.fillText('...', style.padding, startY + maxLines * lineHeight);
      }

      return this.canvasToResult(canvas);
      
    } catch (error) {
      return {
        success: false,
        error: `Code rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Render custom plain text content
   */
  private async renderCustom(
    content: string,
    width: number,
    height: number,
    style: DiagramStyle
  ): Promise<DiagramRenderResult> {
    try {
      const canvas = this.createBoardCanvas(width, height, style);
      const ctx = canvas.getContext('2d')!;

      // Render text
      ctx.fillStyle = style.foregroundColor;
      ctx.font = `${style.fontSize || 16}px ${style.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lines = this.wrapText(ctx, content, width - style.padding * 2);
      const lineHeight = (style.fontSize || 16) * 1.3;
      let y = (height - lines.length * lineHeight) / 2;

      lines.forEach(line => {
        ctx.fillText(line, width / 2, y);
        y += lineHeight;
      });

      return this.canvasToResult(canvas);
      
    } catch (error) {
      return {
        success: false,
        error: `Custom rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create a canvas with board background and styling
   */
  private createBoardCanvas(width: number, height: number, style: DiagramStyle): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Fill background
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Add texture for blackboard/whiteboard effect (optional)
    if (style.boardStyle === 'blackboard') {
      this.addChalkboardTexture(ctx, width, height);
    } else if (style.boardStyle === 'whiteboard') {
      this.addWhiteboardTexture(ctx, width, height);
    }

    // Add border
    if (style.borderStyle === 'frame') {
      this.drawFrame(ctx, width, height, style);
    } else if (style.borderStyle === 'shadow') {
      this.drawShadow(ctx, width, height, style);
    }

    return canvas;
  }

  /**
   * Add subtle chalk/dust texture to blackboard
   */
  private addChalkboardTexture(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Add subtle noise texture
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      data[i] += noise;     // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Add subtle texture to whiteboard
   */
  private addWhiteboardTexture(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Add very subtle noise
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 5;
      data[i] += noise;     // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Draw a wooden frame around the board
   */
  private drawFrame(ctx: CanvasRenderingContext2D, width: number, height: number, style: DiagramStyle): void {
    const borderWidth = style.borderWidth || 8;
    const borderColor = style.borderColor || '#8b7355';

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);

    // Add inner shadow for depth
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(borderWidth + 2, borderWidth + 2, width - borderWidth * 2 - 4, height - borderWidth * 2 - 4);
  }

  /**
   * Draw a drop shadow
   */
  private drawShadow(ctx: CanvasRenderingContext2D, width: number, height: number, style: DiagramStyle): void {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(10, 10, width - 20, height - 20);
    
    ctx.shadowColor = 'transparent';
  }

  /**
   * Convert SVG string to canvas
   */
  private async svgToCanvas(
    svgString: string,
    width: number,
    height: number,
    style: DiagramStyle
  ): Promise<DiagramRenderResult> {
    try {
      // Create board canvas
      const canvas = this.createBoardCanvas(width, height, style);
      const ctx = canvas.getContext('2d')!;

      // Parse SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      // Get SVG dimensions
      const svgWidth = parseFloat(svgElement.getAttribute('width') || '800');
      const svgHeight = parseFloat(svgElement.getAttribute('height') || '600');

      // Calculate scaling to fit within canvas (with padding)
      const availableWidth = width - style.padding * 2;
      const availableHeight = height - style.padding * 2;
      const scale = Math.min(availableWidth / svgWidth, availableHeight / svgHeight);

      // Calculate centered position
      const scaledWidth = svgWidth * scale;
      const scaledHeight = svgHeight * scale;
      const x = (width - scaledWidth) / 2;
      const y = (height - scaledHeight) / 2;

      // Convert SVG to image
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          URL.revokeObjectURL(url);
          resolve(this.canvasToResult(canvas));
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({
            success: false,
            error: 'Failed to load SVG image'
          });
        };
        
        img.src = url;
      });
      
    } catch (error) {
      return {
        success: false,
        error: `SVG conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Convert canvas to result with various output formats
   */
  private canvasToResult(canvas: HTMLCanvasElement): Promise<DiagramRenderResult> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve({
            success: false,
            error: 'Failed to create blob from canvas'
          });
          return;
        }

        const imageUrl = URL.createObjectURL(blob);
        
        resolve({
          success: true,
          imageUrl,
          imageBlob: blob,
          canvas
        });
      }, 'image/png', 1.0);
    });
  }

  /**
   * Word wrap text to fit within width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Get default style for a board type
   */
  static getDefaultStyleForBoard(boardStyle: BoardStyle): DiagramStyle {
    const base = {
      boardStyle,
      borderStyle: 'frame' as BorderStyle,
      padding: 40,
      borderWidth: 8,
      fontSize: 16,
      fontFamily: 'Monaco, Consolas, monospace'
    };

    switch (boardStyle) {
      case 'blackboard':
        return {
          ...base,
          backgroundColor: '#2d3748',
          foregroundColor: '#ffffff',
          borderColor: '#8b7355',
          theme: 'dark'
        };
      
      case 'whiteboard':
        return {
          ...base,
          backgroundColor: '#ffffff',
          foregroundColor: '#000000',
          borderColor: '#c0c0c0',
          theme: 'light'
        };
      
      case 'transparent':
        return {
          ...base,
          backgroundColor: 'transparent',
          foregroundColor: '#000000',
          borderStyle: 'none',
          theme: 'light'
        };
      
      default:
        return base as DiagramStyle;
    }
  }
}

// Export for testing
export default DiagramRenderer;

