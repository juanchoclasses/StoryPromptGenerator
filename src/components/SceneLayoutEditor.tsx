import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import type { SceneLayout, LayoutElement } from '../types/Story';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import LayersIcon from '@mui/icons-material/Layers';
import GridOnIcon from '@mui/icons-material/GridOn';

interface SceneLayoutEditorProps {
  open: boolean;
  currentLayout?: SceneLayout;
  bookAspectRatio: string; // e.g., "3:4", "16:9"
  onSave: (layout: SceneLayout) => void;
  onCancel: () => void;
}

type ElementType = 'image' | 'textPanel' | 'diagramPanel';

interface DraggingState {
  type: ElementType;
  startX: number;
  startY: number;
  startElementX: number;
  startElementY: number;
}

interface ResizingState {
  type: ElementType;
  corner: 'nw' | 'ne' | 'sw' | 'se';
  startX: number;
  startY: number;
  startElementX: number;
  startElementY: number;
  startElementWidth: number;
  startElementHeight: number;
}

/**
 * Convert aspect ratio string to canvas dimensions
 * Returns standard dimensions based on the aspect ratio
 */
const getCanvasDimensionsFromAspectRatio = (aspectRatio: string): { width: number; height: number } => {
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
  
  // Use 1080 as the base height for portrait, width as base for landscape
  if (widthRatio < heightRatio) {
    // Portrait (e.g., 3:4, 9:16)
    const width = 1080;
    const height = Math.round((width * heightRatio) / widthRatio);
    return { width, height };
  } else {
    // Landscape or square (e.g., 16:9, 21:9, 1:1)
    const width = 1920;
    const height = Math.round((width * heightRatio) / widthRatio);
    return { width, height };
  }
};

const PRESET_LAYOUTS: Record<string, SceneLayout> = {
  overlay: {
    type: 'overlay',
    canvas: { width: 1920, height: 1080, aspectRatio: '16:9' },
    elements: {
      image: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 1 },
      textPanel: { x: 100, y: 850, width: 1720, height: 180, zIndex: 2 },
      diagramPanel: { x: 100, y: 50, width: 1200, height: 400, zIndex: 3 }
    }
  },
  'comic-sidebyside': {
    type: 'comic-sidebyside',
    canvas: { width: 1920, height: 1080, aspectRatio: '16:9' },
    elements: {
      image: { x: 0, y: 0, width: 960, height: 1080, zIndex: 1 },
      textPanel: { x: 980, y: 540, width: 920, height: 520, zIndex: 2 },
      diagramPanel: { x: 980, y: 20, width: 920, height: 500, zIndex: 3 }
    }
  },
  'comic-vertical': {
    type: 'comic-vertical',
    canvas: { width: 1080, height: 1920, aspectRatio: '9:16' },
    elements: {
      image: { x: 0, y: 0, width: 1080, height: 960, zIndex: 1 },
      textPanel: { x: 20, y: 1440, width: 1040, height: 460, zIndex: 2 },
      diagramPanel: { x: 20, y: 980, width: 1040, height: 440, zIndex: 3 }
    }
  }
};

export const SceneLayoutEditor: React.FC<SceneLayoutEditorProps> = ({
  open,
  currentLayout,
  bookAspectRatio,
  onSave,
  onCancel
}) => {
  // Calculate canvas dimensions from book's aspect ratio
  const canvasDimensions = getCanvasDimensionsFromAspectRatio(bookAspectRatio);
  
  // Helper functions to convert between percentages and preview pixels
  const PREVIEW_WIDTH = 800;
  const scale = PREVIEW_WIDTH / canvasDimensions.width;
  const previewHeight = canvasDimensions.height * scale;
  
  const percentToPreview = (percentValue: number, dimension: 'width' | 'height'): number => {
    const canvasSize = dimension === 'width' ? canvasDimensions.width : canvasDimensions.height;
    const pixels = (percentValue / 100) * canvasSize;
    return Math.round(pixels * scale);
  };
  
  const previewToPercent = (previewPixels: number, dimension: 'width' | 'height'): number => {
    const actualPixels = previewPixels / scale;
    const canvasSize = dimension === 'width' ? canvasDimensions.width : canvasDimensions.height;
    return (actualPixels / canvasSize) * 100;
  };
  
  // Initialize layout with book's aspect ratio if no current layout exists
  const getInitialLayout = (): SceneLayout => {
    if (currentLayout) {
      // If layout exists, just update canvas dimensions (percentages stay the same)
      return {
        ...currentLayout,
        canvas: {
          ...currentLayout.canvas,
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          aspectRatio: bookAspectRatio
        },
        // Keep existing percentage-based elements
        elements: {
          image: currentLayout.elements.image || { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          textPanel: currentLayout.elements.textPanel,
          diagramPanel: currentLayout.elements.diagramPanel
        }
      };
    } else {
      // Create new overlay layout with book's aspect ratio
      // All values are percentages (0-100)
      return {
        type: 'overlay',
        canvas: {
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          aspectRatio: bookAspectRatio
        },
        elements: {
          image: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          textPanel: { 
            x: 5,
            y: 78,
            width: 90,
            height: 17,
            zIndex: 2
          },
          diagramPanel: {
            x: 5,
            y: 5,
            width: 60,
            height: 40,
            zIndex: 3
          }
        }
      };
    }
  };
  
  const [layout, setLayout] = useState<SceneLayout>(getInitialLayout());
  const [selectedElement, setSelectedElement] = useState<ElementType | null>(null);
  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [resizing, setResizing] = useState<ResizingState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Update layout when currentLayout or bookAspectRatio changes
  useEffect(() => {
    setLayout(getInitialLayout());
  }, [currentLayout, bookAspectRatio]);

  const applyPreset = (presetName: string) => {
    const preset = PRESET_LAYOUTS[presetName];
    if (preset) {
      // Convert preset from absolute pixels to percentages
      const convertToPercentages = (el: LayoutElement, canvasW: number, canvasH: number): LayoutElement => ({
        x: (el.x / canvasW) * 100,
        y: (el.y / canvasH) * 100,
        width: (el.width / canvasW) * 100,
        height: (el.height / canvasH) * 100,
        zIndex: el.zIndex
      });
      
      const adaptedPreset: SceneLayout = {
        type: preset.type,
        canvas: {
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          aspectRatio: bookAspectRatio
        },
        elements: {
          image: preset.elements.image 
            ? convertToPercentages(preset.elements.image, preset.canvas.width, preset.canvas.height)
            : { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          textPanel: preset.elements.textPanel
            ? convertToPercentages(preset.elements.textPanel, preset.canvas.width, preset.canvas.height)
            : undefined,
          diagramPanel: preset.elements.diagramPanel
            ? convertToPercentages(preset.elements.diagramPanel, preset.canvas.width, preset.canvas.height)
            : undefined
        }
      };
      
      setLayout(adaptedPreset);
      setSelectedElement(null);
    }
  };

  const updateElement = (type: ElementType, updates: Partial<LayoutElement>) => {
    setLayout(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [type]: prev.elements[type] ? { ...prev.elements[type]!, ...updates } : undefined
      }
    }));
  };

  const toggleElement = (type: 'textPanel' | 'diagramPanel') => {
    if (layout.elements[type]) {
      // Remove element
      const newElements = { ...layout.elements };
      delete newElements[type];
      setLayout(prev => ({ ...prev, elements: newElements }));
      if (selectedElement === type) {
        setSelectedElement(null);
      }
    } else {
      // Add element with default position (percentages)
      const defaultElement: LayoutElement = {
        x: type === 'textPanel' ? 5 : 10,
        y: type === 'textPanel' ? 78 : 10,
        width: type === 'textPanel' ? 90 : 40,
        height: type === 'textPanel' ? 17 : 30,
        zIndex: type === 'textPanel' ? 2 : 3
      };
      setLayout(prev => ({
        ...prev,
        elements: { ...prev.elements, [type]: defaultElement }
      }));
    }
  };

  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent, type: ElementType) => {
    if (!layout.elements[type]) return;
    e.stopPropagation();
    
    const element = layout.elements[type]!;
    setSelectedElement(type);
    setDragging({
      type,
      startX: e.clientX,
      startY: e.clientY,
      startElementX: element.x,
      startElementY: element.y
    });
  };

  // Mouse handlers for resizing
  const handleResizeMouseDown = (
    e: React.MouseEvent,
    type: ElementType,
    corner: 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    if (!layout.elements[type]) return;
    e.stopPropagation();
    
    const element = layout.elements[type]!;
    setSelectedElement(type);
    setResizing({
      type,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startElementX: element.x,
      startElementY: element.y,
      startElementWidth: element.width,
      startElementHeight: element.height
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        // Convert preview pixel movement to percentage movement
        const dxPreview = e.clientX - dragging.startX;
        const dyPreview = e.clientY - dragging.startY;
        const dxPercent = previewToPercent(dxPreview, 'width');
        const dyPercent = previewToPercent(dyPreview, 'height');
        
        const el = layout.elements[dragging.type];
        if (!el) return;
        
        const newX = Math.max(0, Math.min(100 - el.width, dragging.startElementX + dxPercent));
        const newY = Math.max(0, Math.min(100 - el.height, dragging.startElementY + dyPercent));
        
        updateElement(dragging.type, { x: newX, y: newY });
      } else if (resizing) {
        // Convert preview pixel movement to percentage movement
        const dxPreview = e.clientX - resizing.startX;
        const dyPreview = e.clientY - resizing.startY;
        const dxPercent = previewToPercent(dxPreview, 'width');
        const dyPercent = previewToPercent(dyPreview, 'height');
        
        let newX = resizing.startElementX;
        let newY = resizing.startElementY;
        let newWidth = resizing.startElementWidth;
        let newHeight = resizing.startElementHeight;

        // Update based on corner
        if (resizing.corner.includes('w')) {
          newX = resizing.startElementX + dxPercent;
          newWidth = resizing.startElementWidth - dxPercent;
        } else if (resizing.corner.includes('e')) {
          newWidth = resizing.startElementWidth + dxPercent;
        }

        if (resizing.corner.includes('n')) {
          newY = resizing.startElementY + dyPercent;
          newHeight = resizing.startElementHeight - dyPercent;
        } else if (resizing.corner.includes('s')) {
          newHeight = resizing.startElementHeight + dyPercent;
        }

        // Constraints (in percentages)
        const minSizePercent = 5; // minimum 5% of canvas
        newWidth = Math.max(minSizePercent, newWidth);
        newHeight = Math.max(minSizePercent, newHeight);
        newX = Math.max(0, Math.min(100 - newWidth, newX));
        newY = Math.max(0, Math.min(100 - newHeight, newY));

        updateElement(resizing.type, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        });
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setResizing(null);
    };

    if (dragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, resizing, scale, layout.canvas]);

  const renderElement = (type: ElementType, label: string, color: string) => {
    const element = layout.elements[type];
    if (!element) return null;

    const isSelected = selectedElement === type;
    
    // Convert percentages to preview pixels for display
    const leftPx = percentToPreview(element.x, 'width');
    const topPx = percentToPreview(element.y, 'height');
    const widthPx = percentToPreview(element.width, 'width');
    const heightPx = percentToPreview(element.height, 'height');

    return (
      <Box
        key={type}
        onMouseDown={(e) => handleMouseDown(e, type)}
        sx={{
          position: 'absolute',
          left: leftPx,
          top: topPx,
          width: widthPx,
          height: heightPx,
          backgroundColor: color,
          border: isSelected ? '2px solid #1976d2' : '1px solid #666',
          borderRadius: '4px',
          cursor: 'move',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: element.zIndex,
          '&:hover': {
            borderColor: '#1976d2'
          }
        }}
      >
        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
          {label}
        </Typography>

        {/* Resize handles */}
        {isSelected && (
          <>
            {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
              <Box
                key={corner}
                onMouseDown={(e) => handleResizeMouseDown(e, type, corner)}
                sx={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  backgroundColor: '#1976d2',
                  border: '1px solid #fff',
                  borderRadius: '50%',
                  cursor: `${corner}-resize`,
                  zIndex: 100,
                  ...(corner.includes('n') ? { top: -5 } : { bottom: -5 }),
                  ...(corner.includes('w') ? { left: -5 } : { right: -5 })
                }}
              />
            ))}
          </>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xl" fullWidth>
      <DialogTitle>Scene Layout Editor</DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Left Panel - Presets and Controls */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Presets
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  startIcon={<LayersIcon />}
                  variant={layout.type === 'overlay' ? 'contained' : 'outlined'}
                  onClick={() => applyPreset('overlay')}
                >
                  Overlay (Current Style)
                </Button>
                <Button
                  startIcon={<ViewModuleIcon />}
                  variant={layout.type === 'comic-sidebyside' ? 'contained' : 'outlined'}
                  onClick={() => applyPreset('comic-sidebyside')}
                >
                  Comic Side-by-Side
                </Button>
                <Button
                  startIcon={<ViewDayIcon />}
                  variant={layout.type === 'comic-vertical' ? 'contained' : 'outlined'}
                  onClick={() => applyPreset('comic-vertical')}
                >
                  Comic Vertical
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Canvas Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Canvas dimensions are set by the book's aspect ratio and cannot be changed here.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <TextField
                  label="Width"
                  value={layout.canvas.width}
                  fullWidth
                  margin="dense"
                  size="small"
                  disabled
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Height"
                  value={layout.canvas.height}
                  fullWidth
                  margin="dense"
                  size="small"
                  disabled
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Aspect Ratio"
                  value={layout.canvas.aspectRatio}
                  fullWidth
                  margin="dense"
                  size="small"
                  disabled
                  InputProps={{ readOnly: true }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Elements
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant={layout.elements.textPanel ? 'contained' : 'outlined'}
                  color={layout.elements.textPanel ? 'primary' : 'inherit'}
                  onClick={() => toggleElement('textPanel')}
                >
                  {layout.elements.textPanel ? 'Remove' : 'Add'} Text Panel
                </Button>
                <Button
                  variant={layout.elements.diagramPanel ? 'contained' : 'outlined'}
                  color={layout.elements.diagramPanel ? 'primary' : 'inherit'}
                  onClick={() => toggleElement('diagramPanel')}
                >
                  {layout.elements.diagramPanel ? 'Remove' : 'Add'} Diagram Panel
                </Button>
              </Box>

              {selectedElement && layout.elements[selectedElement] && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {selectedElement === 'image'
                      ? 'Image'
                      : selectedElement === 'textPanel'
                      ? 'Text Panel'
                      : 'Diagram Panel'}{' '}
                    Properties
                  </Typography>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    All values are percentages (0-100) of canvas dimensions
                  </Typography>
                  <TextField
                    label="X (%)"
                    type="number"
                    value={Math.round(layout.elements[selectedElement]!.x * 10) / 10}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      updateElement(selectedElement, { x: Math.max(0, Math.min(100, val)) });
                    }}
                    fullWidth
                    margin="dense"
                    size="small"
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                  <TextField
                    label="Y (%)"
                    type="number"
                    value={Math.round(layout.elements[selectedElement]!.y * 10) / 10}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      updateElement(selectedElement, { y: Math.max(0, Math.min(100, val)) });
                    }}
                    fullWidth
                    margin="dense"
                    size="small"
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                  <TextField
                    label="Width (%)"
                    type="number"
                    value={Math.round(layout.elements[selectedElement]!.width * 10) / 10}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 5;
                      updateElement(selectedElement, { width: Math.max(5, Math.min(100, val)) });
                    }}
                    fullWidth
                    margin="dense"
                    size="small"
                    inputProps={{ min: 5, max: 100, step: 0.1 }}
                  />
                  <TextField
                    label="Height (%)"
                    type="number"
                    value={Math.round(layout.elements[selectedElement]!.height * 10) / 10}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 5;
                      updateElement(selectedElement, { height: Math.max(5, Math.min(100, val)) });
                    }}
                    fullWidth
                    margin="dense"
                    size="small"
                    inputProps={{ min: 5, max: 100, step: 0.1 }}
                  />
                </>
              )}
            </Paper>
          </Grid>

          {/* Right Panel - Canvas Preview */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Layout Preview
              </Typography>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Drag elements to reposition, drag corners to resize. Click to select.
              </Typography>
              <Box
                ref={canvasRef}
                sx={{
                  position: 'relative',
                  width: PREVIEW_WIDTH,
                  height: previewHeight,
                  backgroundColor: '#e0e0e0',
                  border: '2px solid #ccc',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  margin: '0 auto',
                  mt: 2
                }}
                onClick={() => setSelectedElement(null)}
              >
                {renderElement('image', 'AI Generated Image', 'rgba(100, 100, 100, 0.7)')}
                {renderElement('textPanel', 'Text Panel', 'rgba(76, 175, 80, 0.7)')}
                {renderElement('diagramPanel', 'Diagram Panel', 'rgba(33, 150, 243, 0.7)')}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(layout)} variant="contained" color="primary">
          Save Layout
        </Button>
      </DialogActions>
    </Dialog>
  );
};

