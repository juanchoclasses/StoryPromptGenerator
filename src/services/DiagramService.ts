/**
 * DiagramService - Renders diagrams to ImageBitmap for compositing
 * 
 * Follows the same pattern as OverlayService's createTextPanel:
 * - Takes content and configuration
 * - Renders to canvas
 * - Returns ImageBitmap for efficient compositing
 * 
 * Usage:
 *   const diagram = await DiagramService.createDiagramPanel(
 *     'graph TD; A-->B;',
 *     { type: 'mermaid', width: 800, height: 600, style: {...} }
 *   );
 *   
 *   // Then composite using OverlayService
 *   const result = await composeImageWithPanel(baseImg, diagram, { x, y });
 */

export type DiagramType = 'mermaid' | 'math' | 'code';
export type BoardStyle = 'blackboard' | 'whiteboard' | 'transparent';
export type BorderStyle = 'none' | 'frame' | 'shadow';

export interface DiagramStyle {
  boardStyle?: BoardStyle;
  borderStyle?: BorderStyle;
  backgroundColor?: string;      // Override board style color
  foregroundColor?: string;      // Text/diagram color
  borderColor?: string;          // Frame color
  borderWidth?: number;          // Frame thickness
  padding?: number;              // Inner padding
  fontSize?: number;             // For code/text
  fontFamily?: string;           // For code/text
}

export interface DiagramPanelOptions {
  type: DiagramType;
  content: string;
  width: number;
  height: number;
  style?: DiagramStyle;
  language?: string;             // For code type
}

export interface DiagramRenderResult {
  success: boolean;
  imageBitmap?: ImageBitmap;     // For compositing
  canvas?: HTMLCanvasElement;    // For inspection/debugging
  error?: string;
}

/**
 * Main service class for diagram rendering
 */
export class DiagramService {
  
  /**
   * Create a diagram panel as ImageBitmap (matches createTextPanel signature)
   * This is the main function used for integration
   */
  static async createDiagramPanel(
    content: string,
    options: DiagramPanelOptions
  ): Promise<ImageBitmap> {
    const result = await this.renderDiagram(options);
    
    if (!result.success || !result.canvas) {
      throw new Error(result.error || 'Failed to render diagram');
    }
    
    // Convert canvas to ImageBitmap (efficient for compositing)
    return await createImageBitmap(result.canvas);
  }
  
  /**
   * Render diagram to canvas (internal use)
   */
  static async renderDiagram(options: DiagramPanelOptions): Promise<DiagramRenderResult> {
    try {
      // Validate inputs
      if (!options.content || options.content.trim().length === 0) {
        return {
          success: false,
          error: 'Diagram content is empty'
        };
      }

      // Dispatch to specific renderer
      switch (options.type) {
        case 'mermaid':
          return await this.renderMermaid(options);
        
        case 'math':
          return await this.renderMath(options);
        
        case 'code':
          return await this.renderCode(options);
        
        default:
          return {
            success: false,
            error: `Unknown diagram type: ${options.type}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Render Mermaid diagram
   */
  private static async renderMermaid(options: DiagramPanelOptions): Promise<DiagramRenderResult> {
    try {
      // Check if mermaid is available
      const mermaid = (window as any).mermaid;
      if (!mermaid) {
        return {
          success: false,
          error: 'Mermaid library not loaded. Install: npm install mermaid'
        };
      }

      // Ensure mermaid is initialized
      if (!(mermaid as any).initialized) {
        const style = this.getResolvedStyle(options.style);
        mermaid.initialize({
          startOnLoad: false,
          theme: style.boardStyle === 'blackboard' ? 'dark' : 'default',
          securityLevel: 'loose'
        });
        (mermaid as any).initialized = true;
      }

      // Render mermaid to SVG
      const { svg } = await mermaid.render('diagram-' + Date.now(), options.content);
      
      // Create board canvas
      const canvas = this.createBoardCanvas(options.width, options.height, options.style);
      const ctx = canvas.getContext('2d')!;
      
      // Convert SVG to image and draw on canvas
      const img = await this.svgToImage(svg);
      
      // Calculate scaling to fit with padding
      const style = this.getResolvedStyle(options.style);
      const availableWidth = options.width - style.padding! * 2;
      const availableHeight = options.height - style.padding! * 2;
      const scale = Math.min(availableWidth / img.width, availableHeight / img.height);
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (options.width - scaledWidth) / 2;
      const y = (options.height - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      return {
        success: true,
        canvas
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Mermaid rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Render math equation (simplified - just shows LaTeX as text)
   * TODO: Integrate KaTeX properly if needed
   */
  private static async renderMath(options: DiagramPanelOptions): Promise<DiagramRenderResult> {
    try {
      const canvas = this.createBoardCanvas(options.width, options.height, options.style);
      const ctx = canvas.getContext('2d')!;
      const style = this.getResolvedStyle(options.style);
      
      // For now, just render as text
      ctx.fillStyle = style.foregroundColor!;
      ctx.font = `${style.fontSize}px ${style.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(options.content, options.width / 2, options.height / 2);
      
      return {
        success: true,
        canvas
      };
    } catch (error) {
      return {
        success: false,
        error: `Math rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Render code block
   */
  private static async renderCode(options: DiagramPanelOptions): Promise<DiagramRenderResult> {
    try {
      const canvas = this.createBoardCanvas(options.width, options.height, options.style);
      const ctx = canvas.getContext('2d')!;
      const style = this.getResolvedStyle(options.style);
      
      // Render code lines
      ctx.fillStyle = style.foregroundColor!;
      ctx.font = `${style.fontSize}px ${style.fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      const lines = options.content.split('\n');
      const lineHeight = style.fontSize! * 1.4;
      let y = style.padding!;
      
      lines.forEach(line => {
        if (y + lineHeight < options.height - style.padding!) {
          ctx.fillText(line, style.padding!, y);
          y += lineHeight;
        }
      });
      
      return {
        success: true,
        canvas
      };
    } catch (error) {
      return {
        success: false,
        error: `Code rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Create canvas with board styling (background, border)
   */
  private static createBoardCanvas(width: number, height: number, styleOpts?: DiagramStyle): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    const style = this.getResolvedStyle(styleOpts);
    
    // Background
    ctx.fillStyle = style.backgroundColor!;
    ctx.fillRect(0, 0, width, height);
    
    // Add subtle texture
    if (style.boardStyle !== 'transparent') {
      this.addTexture(ctx, width, height, style.boardStyle!);
    }
    
    // Border
    if (style.borderStyle === 'frame') {
      ctx.strokeStyle = style.borderColor!;
      ctx.lineWidth = style.borderWidth!;
      const offset = style.borderWidth! / 2;
      ctx.strokeRect(offset, offset, width - style.borderWidth!, height - style.borderWidth!);
    }
    
    return canvas;
  }
  
  /**
   * Add texture effect to board
   */
  private static addTexture(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    boardStyle: BoardStyle
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const intensity = boardStyle === 'blackboard' ? 10 : 5;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * intensity;
      data[i] += noise;
      data[i + 1] += noise;
      data[i + 2] += noise;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * Convert SVG string to Image
   */
  private static async svgToImage(svgString: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG'));
      };
      
      img.src = url;
    });
  }
  
  /**
   * Get resolved style with defaults
   */
  private static getResolvedStyle(styleOpts?: DiagramStyle): Required<DiagramStyle> {
    const boardStyle = styleOpts?.boardStyle ?? 'blackboard';
    
    // Default colors based on board style
    let backgroundColor: string;
    let foregroundColor: string;
    let borderColor: string;
    
    switch (boardStyle) {
      case 'blackboard':
        backgroundColor = '#2d3748';
        foregroundColor = '#ffffff';
        borderColor = '#8b7355';
        break;
      case 'whiteboard':
        backgroundColor = '#ffffff';
        foregroundColor = '#000000';
        borderColor = '#c0c0c0';
        break;
      case 'transparent':
        backgroundColor = 'transparent';
        foregroundColor = '#000000';
        borderColor = '#000000';
        break;
    }
    
    return {
      boardStyle,
      borderStyle: styleOpts?.borderStyle ?? 'frame',
      backgroundColor: styleOpts?.backgroundColor ?? backgroundColor,
      foregroundColor: styleOpts?.foregroundColor ?? foregroundColor,
      borderColor: styleOpts?.borderColor ?? borderColor,
      borderWidth: styleOpts?.borderWidth ?? 12,
      padding: styleOpts?.padding ?? 40,
      fontSize: styleOpts?.fontSize ?? 14,
      fontFamily: styleOpts?.fontFamily ?? 'Monaco, Consolas, monospace'
    };
  }
}

/**
 * Helper function to overlay diagram on base image
 * Extends OverlayService functionality
 */
export async function overlayDiagramOnImage(
  baseImageUrl: string,
  diagramContent: string,
  diagramOptions: DiagramPanelOptions,
  position: { x: number; y: number }
): Promise<string> {
  // Dynamically import to avoid circular dependency
  const { loadImage, composeImageWithPanel } = await import('./OverlayService');
  
  // Load base image
  const baseImg = await loadImage(baseImageUrl);
  
  // Create diagram
  const diagramBitmap = await DiagramService.createDiagramPanel(diagramContent, diagramOptions);
  
  // Composite
  return await composeImageWithPanel(baseImg, diagramBitmap, position);
}

export default DiagramService;

