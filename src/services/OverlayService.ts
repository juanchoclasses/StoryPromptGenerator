// overlay.ts
type PanelOptions = {
  width: number;            // panel width in pixels
  height: number;           // panel height in pixels
  bgColor: string;          // background fill (e.g., "#ffffffcc")
  borderColor: string;      // border stroke color
  borderWidth: number;      // border thickness in px
  borderRadius: number;     // rounded corner radius
  padding: number;          // inner padding for text
  fontFamily: string;       // CSS font family (must be loaded)
  fontSize: number;         // in px
  fontColor: string;         // text color
  lineHeight?: number;      // optional, defaults to 1.3 * fontSize
  textAlign?: CanvasTextAlign; // 'left' | 'center' | 'right'
};

type CompositeOptions = {
  x: number;                // top-left x on the base image
  y: number;                // top-left y on the base image
};

// Utility: load an <img> from a URL or object URL
export async function loadImage(src: string): Promise<HTMLImageElement> {
  await document.fonts.ready; // ensure page fonts are available
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // needed if drawing CORS images
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Draw a rounded rectangle path on a 2D context
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

// Word-wrap text into lines that fit a max width, preserving explicit line breaks
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  
  // First split on explicit line breaks to preserve them
  const paragraphs = text.split(/\r?\n/);
  
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      // Preserve empty lines
      lines.push("");
      continue;
    }
    
    // Word-wrap this paragraph
    const words = paragraph.split(/\s+/);
    let line = "";
    
    for (const word of words) {
      const test = line ? line + " " + word : word;
      const w = ctx.measureText(test).width;
      if (w <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  
  return lines;
}

// Create a text panel as an ImageBitmap (fast to draw onto another canvas)
export async function createTextPanel(
  text: string,
  opts: PanelOptions
): Promise<ImageBitmap> {
  const {
    width,
    height,
    bgColor,
    borderColor,
    borderWidth,
    borderRadius,
    padding,
    fontFamily,
    fontSize,
    fontColor,
    lineHeight = Math.round(fontSize * 1.3),
    textAlign = "left",
  } = opts;

  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d")!;
  ctx.save();

  // Background + border as rounded rect
  roundedRectPath(ctx, 0.5, 0.5, width - 1, height - 1, borderRadius);
  ctx.fillStyle = bgColor;
  ctx.fill();
  if (borderWidth > 0) {
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
  }

  // Text
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fontColor;
  ctx.textAlign = textAlign;
  ctx.textBaseline = "top";

  const innerX = padding;
  const innerY = padding;
  const innerW = width - padding * 2;
  const lines = wrapText(ctx, text, innerW);
  let y = innerY;

  for (const line of lines) {
    const lineWidth = ctx.measureText(line).width;
    let x = innerX;
    if (textAlign === "center") x = innerX + (innerW - lineWidth) / 2;
    if (textAlign === "right") x = innerX + innerW - lineWidth;
    ctx.fillText(line, x, y);
    y += lineHeight;
    if (y + lineHeight > height - padding) break; // clip if overflow
  }

  ctx.restore();
  return await createImageBitmap(c);
}

// Composite panel onto base image and return a Blob URL to display
export async function composeImageWithPanel(
  baseImg: HTMLImageElement,
  panel: ImageBitmap,
  at: CompositeOptions,
  outputType: "image/png" | "image/jpeg" = "image/png",
  quality?: number
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = baseImg.naturalWidth;
  canvas.height = baseImg.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(baseImg, 0, 0);
  ctx.drawImage(panel, at.x, at.y);

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, outputType, quality)
  );
  if (!blob) throw new Error("Failed to export image.");
  return URL.createObjectURL(blob);
}

// Helper function to composite text panel onto an image data URL
export async function overlayTextOnImage(
  imageDataUrl: string,
  text: string,
  imageWidth: number,
  imageHeight: number,
  config?: {
    fontFamily?: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
    widthPercentage?: number;
    heightPercentage?: number;
    position?: string;
    backgroundColor?: string;
    fontColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    gutterTop?: number;
    gutterBottom?: number;
    gutterLeft?: number;
    gutterRight?: number;
  }
): Promise<string> {
  // Load the base image
  const baseImg = await loadImage(imageDataUrl);
  
  // Use actual image dimensions from loaded image
  const actualImageWidth = baseImg.naturalWidth;
  const actualImageHeight = baseImg.naturalHeight;
  
  // Use provided config or defaults
  const widthPercent = config?.widthPercentage ?? 100;
  const heightPercent = config?.heightPercentage ?? 15;
  const position = config?.position ?? 'bottom-center';
  
  // Calculate panel dimensions based on ACTUAL image size
  const panelWidth = Math.round(actualImageWidth * (widthPercent / 100));
  const panelHeight = Math.round(actualImageHeight * (heightPercent / 100));
  
  // Create text panel with provided or default styling
  const panel = await createTextPanel(text, {
    width: panelWidth,
    height: panelHeight,
    bgColor: config?.backgroundColor ?? "#000000cc",
    borderColor: config?.borderColor ?? "#ffffff",
    borderWidth: config?.borderWidth ?? 2,
    borderRadius: config?.borderRadius ?? 8,
    padding: config?.padding ?? 20,
    fontFamily: config?.fontFamily ?? "Arial, sans-serif",
    fontSize: config?.fontSize ?? Math.round(panelHeight / 6),
    fontColor: config?.fontColor ?? "#ffffff",
    lineHeight: config?.fontSize ? Math.round(config.fontSize * 1.3) : Math.round(panelHeight / 5),
    textAlign: (config?.textAlign as CanvasTextAlign) ?? "center"
  });
  
  // Get gutter values (default to 0)
  const gutterTop = config?.gutterTop ?? 0;
  const gutterBottom = config?.gutterBottom ?? 0;
  const gutterLeft = config?.gutterLeft ?? 0;
  const gutterRight = config?.gutterRight ?? 0;
  
  // Calculate position based on config using ACTUAL image dimensions
  let x = 0;
  let y = 0;
  
  // Horizontal positioning
  if (position.includes('left')) {
    x = gutterLeft;
  } else if (position.includes('right')) {
    x = actualImageWidth - panelWidth - gutterRight;
  } else if (position.includes('center')) {
    // Center with consideration for asymmetric gutters
    x = gutterLeft + (actualImageWidth - panelWidth - gutterLeft - gutterRight) / 2;
  }
  
  // Vertical positioning
  if (position.includes('top')) {
    y = gutterTop;
  } else if (position.includes('bottom')) {
    y = actualImageHeight - panelHeight - gutterBottom;
  } else if (position.includes('middle')) {
    // Middle with consideration for asymmetric gutters
    y = gutterTop + (actualImageHeight - panelHeight - gutterTop - gutterBottom) / 2;
  }
  
  const compositeOptions: CompositeOptions = { x, y };
  
  // Composite and return new image URL
  return await composeImageWithPanel(baseImg, panel, compositeOptions);
}

export type { PanelOptions, CompositeOptions };

