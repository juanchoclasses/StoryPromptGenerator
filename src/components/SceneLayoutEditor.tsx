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
  
  // Initialize layout with book's aspect ratio if no current layout exists
  const getInitialLayout = (): SceneLayout => {
    if (currentLayout) {
      // If layout exists, update its canvas dimensions to match book's aspect ratio
      return {
        ...currentLayout,
        canvas: {
          ...currentLayout.canvas,
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          aspectRatio: bookAspectRatio
        },
        // Scale element positions/sizes proportionally if canvas size changed
        elements: {
          image: currentLayout.elements.image
            ? {
                ...currentLayout.elements.image,
                width: canvasDimensions.width,
                height: canvasDimensions.height
              }
            : { x: 0, y: 0, width: canvasDimensions.width, height: canvasDimensions.height, zIndex: 1 },
          textPanel: currentLayout.elements.textPanel,
          diagramPanel: currentLayout.elements.diagramPanel
        }
      };
    } else {
      // Create new overlay layout with book's aspect ratio
      return {
        type: 'overlay',
        canvas: {
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          aspectRatio: bookAspectRatio
        },
        elements: {
          image: { x: 0, y: 0, width: canvasDimensions.width, height: canvasDimensions.height, zIndex: 1 },
          textPanel: { 
            x: Math.round(canvasDimensions.width * 0.05),
            y: Math.round(canvasDimensions.height * 0.78),
            width: Math.round(canvasDimensions.width * 0.9),
            height: Math.round(canvasDimensions.height * 0.17),
            zIndex: 2
          },
          diagramPanel: {
            x: Math.round(canvasDimensions.width * 0.05),
            y: Math.round(canvasDimensions.height * 0.05),
            width: Math.round(canvasDimensions.width * 0.6),
            height: Math.round(canvasDimensions.height * 0.4),
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

  // Calculate scale factor for preview
  const PREVIEW_WIDTH = 800;
  const scale = PREVIEW_WIDTH / layout.canvas.width;
  const previewHeight = layout.canvas.height * scale;

  // Update layout when currentLayout or bookAspectRatio changes
  useEffect(() => {
    setLayout(getInitialLayout());
  }, [currentLayout, bookAspectRatio]);

  const applyPreset = (presetName: string) => {
    const preset = PRESET_LAYOUTS[presetName];
    if (preset) {
      // Deep copy preset and adapt to book's aspect ratio
      const adaptedPreset = JSON.parse(JSON.stringify(preset)) as SceneLayout;
      adaptedPreset.canvas = {
        width: canvasDimensions.width,
        height: canvasDimensions.height,
        aspectRatio: bookAspectRatio
      };
      
      // Scale all element positions and sizes proportionally
      const scaleX = canvasDimensions.width / preset.canvas.width;
      const scaleY = canvasDimensions.height / preset.canvas.height;
      
      if (adaptedPreset.elements.image) {
        adaptedPreset.elements.image = {
          x: 0,
          y: 0,
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          zIndex: 1
        };
      }
      
      if (adaptedPreset.elements.textPanel) {
        const tp = preset.elements.textPanel!;
        adaptedPreset.elements.textPanel = {
          x: Math.round(tp.x * scaleX),
          y: Math.round(tp.y * scaleY),
          width: Math.round(tp.width * scaleX),
          height: Math.round(tp.height * scaleY),
          zIndex: tp.zIndex
        };
      }
      
      if (adaptedPreset.elements.diagramPanel) {
        const dp = preset.elements.diagramPanel!;
        adaptedPreset.elements.diagramPanel = {
          x: Math.round(dp.x * scaleX),
          y: Math.round(dp.y * scaleY),
          width: Math.round(dp.width * scaleX),
          height: Math.round(dp.height * scaleY),
          zIndex: dp.zIndex
        };
      }
      
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
      // Add element with default position
      const defaultElement: LayoutElement = {
        x: 100,
        y: 100,
        width: 400,
        height: 300,
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
        const dx = (e.clientX - dragging.startX) / scale;
        const dy = (e.clientY - dragging.startY) / scale;
        updateElement(dragging.type, {
          x: Math.max(0, Math.min(layout.canvas.width - (layout.elements[dragging.type]?.width || 0), dragging.startElementX + dx)),
          y: Math.max(0, Math.min(layout.canvas.height - (layout.elements[dragging.type]?.height || 0), dragging.startElementY + dy))
        });
      } else if (resizing) {
        const dx = (e.clientX - resizing.startX) / scale;
        const dy = (e.clientY - resizing.startY) / scale;
        
        let newX = resizing.startElementX;
        let newY = resizing.startElementY;
        let newWidth = resizing.startElementWidth;
        let newHeight = resizing.startElementHeight;

        // Update based on corner
        if (resizing.corner.includes('w')) {
          newX = resizing.startElementX + dx;
          newWidth = resizing.startElementWidth - dx;
        } else if (resizing.corner.includes('e')) {
          newWidth = resizing.startElementWidth + dx;
        }

        if (resizing.corner.includes('n')) {
          newY = resizing.startElementY + dy;
          newHeight = resizing.startElementHeight - dy;
        } else if (resizing.corner.includes('s')) {
          newHeight = resizing.startElementHeight + dy;
        }

        // Constraints
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);
        newX = Math.max(0, Math.min(layout.canvas.width - newWidth, newX));
        newY = Math.max(0, Math.min(layout.canvas.height - newHeight, newY));

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

    return (
      <Box
        key={type}
        onMouseDown={(e) => handleMouseDown(e, type)}
        sx={{
          position: 'absolute',
          left: element.x * scale,
          top: element.y * scale,
          width: element.width * scale,
          height: element.height * scale,
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
                  <TextField
                    label="X"
                    type="number"
                    value={Math.round(layout.elements[selectedElement]!.x)}
                    onChange={(e) =>
                      updateElement(selectedElement, { x: parseInt(e.target.value) || 0 })
                    }
                    fullWidth
                    margin="dense"
                    size="small"
                  />
                  <TextField
                    label="Y"
                    type="number"
                    value={Math.round(layout.elements[selectedElement]!.y)}
                    onChange={(e) =>
                      updateElement(selectedElement, { y: parseInt(e.target.value) || 0 })
                    }
                    fullWidth
                    margin="dense"
                    size="small"
                  />
                  <TextField
                    label="Width"
                    type="number"
                    value={Math.round(layout.elements[selectedElement]!.width)}
                    onChange={(e) =>
                      updateElement(selectedElement, { width: parseInt(e.target.value) || 50 })
                    }
                    fullWidth
                    margin="dense"
                    size="small"
                  />
                  <TextField
                    label="Height"
                    type="number"
                    value={Math.round(layout.elements[selectedElement]!.height)}
                    onChange={(e) =>
                      updateElement(selectedElement, { height: parseInt(e.target.value) || 50 })
                    }
                    fullWidth
                    margin="dense"
                    size="small"
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

