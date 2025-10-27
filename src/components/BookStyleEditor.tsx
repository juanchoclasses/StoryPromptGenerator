import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Slider,
  Tooltip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import type { BookStyle } from '../types/BookStyle';
import type { PanelPosition } from '../types/Book';
import { DEFAULT_PANEL_CONFIG } from '../types/Book';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`style-tabpanel-${index}`}
      aria-labelledby={`style-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

interface BookStyleEditorProps {
  open: boolean;
  onClose: () => void;
  initialStyle?: BookStyle;
  onSave: (style: BookStyle) => void;
}

export const BookStyleEditor: React.FC<BookStyleEditorProps> = ({
  open,
  onClose,
  initialStyle,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [style, setStyle] = useState<BookStyle>({
    colorPalette: initialStyle?.colorPalette || '',
    visualTheme: initialStyle?.visualTheme || '',
    characterStyle: initialStyle?.characterStyle || '',
    environmentStyle: initialStyle?.environmentStyle || '',
    artStyle: initialStyle?.artStyle || '',
    panelConfig: initialStyle?.panelConfig || DEFAULT_PANEL_CONFIG
  });

  useEffect(() => {
    if (initialStyle) {
      setStyle({
        colorPalette: initialStyle.colorPalette || '',
        visualTheme: initialStyle.visualTheme || '',
        characterStyle: initialStyle.characterStyle || '',
        environmentStyle: initialStyle.environmentStyle || '',
        artStyle: initialStyle.artStyle || '',
        panelConfig: initialStyle.panelConfig || DEFAULT_PANEL_CONFIG
      });
    }
  }, [initialStyle, open]);

  const handleSave = () => {
    // Remove empty string values (keep undefined for optional fields)
    const cleanedStyle: BookStyle = {
      colorPalette: style.colorPalette?.trim() || undefined,
      visualTheme: style.visualTheme?.trim() || undefined,
      characterStyle: style.characterStyle?.trim() || undefined,
      environmentStyle: style.environmentStyle?.trim() || undefined,
      artStyle: style.artStyle?.trim() || undefined,
      panelConfig: style.panelConfig
    };
    onSave(cleanedStyle);
    onClose();
  };

  const handleReset = () => {
    if (activeTab === 0) {
      // Reset visual style fields
      setStyle({
        ...style,
        colorPalette: '',
        visualTheme: '',
        characterStyle: '',
        environmentStyle: '',
        artStyle: ''
      });
    } else {
      // Reset panel config
      setStyle({
        ...style,
        panelConfig: DEFAULT_PANEL_CONFIG
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        Book Style Configuration
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Define the visual style that will be applied to all images generated for this book
        </Typography>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} aria-label="style tabs">
          <Tab label="Visual Style" />
          <Tab label="Text Panel Overlay" />
        </Tabs>
      </Box>

      <DialogContent>
        {/* Visual Style Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Tooltip title="Describe the overall color scheme and palette for this book" placement="top">
                <TextField
                  fullWidth
                  label="Color Palette"
                  multiline
                  rows={2}
                  value={style.colorPalette || ''}
                  onChange={(e) => setStyle({ ...style, colorPalette: e.target.value })}
                  placeholder="e.g., Jewel tones with pops of pastel. Emerald greens, ruby reds, sapphire blues..."
                  helperText="Describe the colors that should be used throughout the book"
                />
              </Tooltip>
            </Grid>

            <Grid item xs={12}>
              <Tooltip title="Define the overall visual theme and aesthetic" placement="top">
                <TextField
                  fullWidth
                  label="Visual Theme"
                  multiline
                  rows={2}
                  value={style.visualTheme || ''}
                  onChange={(e) => setStyle({ ...style, visualTheme: e.target.value })}
                  placeholder="e.g., Whimsical, fantastical, educational with a storybook quality"
                  helperText="What is the overall mood and aesthetic of this book?"
                />
              </Tooltip>
            </Grid>

            <Grid item xs={12}>
              <Tooltip title="Describe how characters should look across all images" placement="top">
                <TextField
                  fullWidth
                  label="Character Style"
                  multiline
                  rows={2}
                  value={style.characterStyle || ''}
                  onChange={(e) => setStyle({ ...style, characterStyle: e.target.value })}
                  placeholder="e.g., Exaggerated proportions, expressive features, friendly and approachable"
                  helperText="How should characters be drawn/rendered?"
                />
              </Tooltip>
            </Grid>

            <Grid item xs={12}>
              <Tooltip title="Describe the environment and setting style" placement="top">
                <TextField
                  fullWidth
                  label="Environment Style"
                  multiline
                  rows={2}
                  value={style.environmentStyle || ''}
                  onChange={(e) => setStyle({ ...style, environmentStyle: e.target.value })}
                  placeholder="e.g., Impossible geometry, oversized objects, playful architecture"
                  helperText="How should environments and backgrounds be styled?"
                />
              </Tooltip>
            </Grid>

            <Grid item xs={12}>
              <Tooltip title="Select the art style or rendering technique" placement="top">
                <FormControl fullWidth>
                  <InputLabel>Art Style</InputLabel>
                  <Select
                    value={style.artStyle || ''}
                    onChange={(e) => setStyle({ ...style, artStyle: e.target.value })}
                    label="Art Style"
                  >
                    <MenuItem value="">
                      <em>None specified</em>
                    </MenuItem>
                    <MenuItem value="hand-painted">Hand-painted / Traditional</MenuItem>
                    <MenuItem value="digital">Digital Art</MenuItem>
                    <MenuItem value="watercolor">Watercolor</MenuItem>
                    <MenuItem value="oil-painting">Oil Painting</MenuItem>
                    <MenuItem value="pen-and-ink">Pen and Ink</MenuItem>
                    <MenuItem value="3d-render">3D Render</MenuItem>
                    <MenuItem value="pixel-art">Pixel Art</MenuItem>
                    <MenuItem value="comic-book">Comic Book</MenuItem>
                    <MenuItem value="manga">Manga / Anime</MenuItem>
                    <MenuItem value="storybook">Children's Storybook</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                💡 Tip: These style guidelines will be included in every image generation prompt for this book.
                Be specific but concise for best results.
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Panel Config Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Configure how text panels (scene text overlays) should appear on generated images
              </Typography>
            </Grid>

            {/* Font Settings */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">FONT SETTINGS</Typography>
              </Divider>
            </Grid>

            <Grid item xs={6}>
              <Tooltip title="Choose the font family for text panels">
                <FormControl fullWidth>
                  <InputLabel>Font Family</InputLabel>
                  <Select
                    value={style.panelConfig?.fontFamily || 'Arial'}
                    onChange={(e) => setStyle({
                      ...style,
                      panelConfig: { ...style.panelConfig!, fontFamily: e.target.value }
                    })}
                    label="Font Family"
                  >
                    <MenuItem value="Arial">Arial</MenuItem>
                    <MenuItem value="Helvetica">Helvetica</MenuItem>
                    <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                    <MenuItem value="Georgia">Georgia</MenuItem>
                    <MenuItem value="Courier New">Courier New</MenuItem>
                    <MenuItem value="Comic Sans MS">Comic Sans MS</MenuItem>
                    <MenuItem value="Impact">Impact</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
            </Grid>

            <Grid item xs={6}>
              <Tooltip title="Text size in pixels">
                <TextField
                  fullWidth
                  type="number"
                  label="Font Size (px)"
                  value={style.panelConfig?.fontSize || 16}
                  onChange={(e) => setStyle({
                    ...style,
                    panelConfig: { ...style.panelConfig!, fontSize: parseInt(e.target.value) || 16 }
                  })}
                  inputProps={{ min: 8, max: 72 }}
                />
              </Tooltip>
            </Grid>

            <Grid item xs={12}>
              <Tooltip title="Horizontal alignment of text">
                <FormControl fullWidth>
                  <InputLabel>Text Alignment</InputLabel>
                  <Select
                    value={style.panelConfig?.textAlign || 'center'}
                    onChange={(e) => setStyle({
                      ...style,
                      panelConfig: { ...style.panelConfig!, textAlign: e.target.value as 'left' | 'center' | 'right' }
                    })}
                    label="Text Alignment"
                  >
                    <MenuItem value="left">Left</MenuItem>
                    <MenuItem value="center">Center</MenuItem>
                    <MenuItem value="right">Right</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
            </Grid>

            {/* Panel Dimensions */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">PANEL DIMENSIONS</Typography>
              </Divider>
            </Grid>

            <Grid item xs={12}>
              <Tooltip title="Where the text panel should be positioned on the image">
                <FormControl fullWidth>
                  <InputLabel>Panel Position</InputLabel>
                  <Select
                    value={style.panelConfig?.position || 'bottom-center'}
                    onChange={(e) => setStyle({
                      ...style,
                      panelConfig: { ...style.panelConfig!, position: e.target.value as PanelPosition }
                    })}
                    label="Panel Position"
                  >
                    <MenuItem value="top-left">Top Left</MenuItem>
                    <MenuItem value="top-center">Top Center</MenuItem>
                    <MenuItem value="top-right">Top Right</MenuItem>
                    <MenuItem value="middle-left">Middle Left</MenuItem>
                    <MenuItem value="middle-center">Middle Center</MenuItem>
                    <MenuItem value="middle-right">Middle Right</MenuItem>
                    <MenuItem value="bottom-left">Bottom Left</MenuItem>
                    <MenuItem value="bottom-center">Bottom Center</MenuItem>
                    <MenuItem value="bottom-right">Bottom Right</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Panel Width: {style.panelConfig?.widthPercentage || 80}%
              </Typography>
              <Tooltip title="Width of the text panel as a percentage of image width">
                <Slider
                  value={style.panelConfig?.widthPercentage || 80}
                  onChange={(_, value) => setStyle({
                    ...style,
                    panelConfig: { ...style.panelConfig!, widthPercentage: value as number }
                  })}
                  min={20}
                  max={100}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Tooltip>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={style.panelConfig?.autoHeight || false}
                    onChange={(e) => setStyle({
                      ...style,
                      panelConfig: { ...style.panelConfig!, autoHeight: e.target.checked }
                    })}
                  />
                }
                label="Auto Height (fit text)"
              />
            </Grid>

            {!style.panelConfig?.autoHeight && (
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Panel Height: {style.panelConfig?.heightPercentage || 20}%
                </Typography>
                <Tooltip title="Height of the text panel as a percentage of image height">
                  <Slider
                    value={style.panelConfig?.heightPercentage || 20}
                    onChange={(_, value) => setStyle({
                      ...style,
                      panelConfig: { ...style.panelConfig!, heightPercentage: value as number }
                    })}
                    min={5}
                    max={50}
                    step={5}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Tooltip>
              </Grid>
            )}

            {/* Colors and Styling */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">COLORS & STYLING</Typography>
              </Divider>
            </Grid>

            <Grid item xs={4}>
              <Tooltip title="Background color of the text panel">
                <Box>
                  <Typography variant="body2" gutterBottom>Background</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      type="color"
                      value={style.panelConfig?.backgroundColor || '#000000'}
                      onChange={(e) => setStyle({
                        ...style,
                        panelConfig: { ...style.panelConfig!, backgroundColor: e.target.value }
                      })}
                      sx={{ width: 60 }}
                    />
                    <Typography variant="caption">{style.panelConfig?.backgroundColor || '#000000'}</Typography>
                  </Box>
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={4}>
              <Tooltip title="Color of the text">
                <Box>
                  <Typography variant="body2" gutterBottom>Text Color</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      type="color"
                      value={style.panelConfig?.fontColor || '#FFFFFF'}
                      onChange={(e) => setStyle({
                        ...style,
                        panelConfig: { ...style.panelConfig!, fontColor: e.target.value }
                      })}
                      sx={{ width: 60 }}
                    />
                    <Typography variant="caption">{style.panelConfig?.fontColor || '#FFFFFF'}</Typography>
                  </Box>
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={4}>
              <Tooltip title="Color of the panel border">
                <Box>
                  <Typography variant="body2" gutterBottom>Border Color</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      type="color"
                      value={style.panelConfig?.borderColor || '#FFFFFF'}
                      onChange={(e) => setStyle({
                        ...style,
                        panelConfig: { ...style.panelConfig!, borderColor: e.target.value }
                      })}
                      sx={{ width: 60 }}
                    />
                    <Typography variant="caption">{style.panelConfig?.borderColor || '#FFFFFF'}</Typography>
                  </Box>
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={4}>
              <Tooltip title="Thickness of the border in pixels">
                <TextField
                  fullWidth
                  type="number"
                  label="Border Width (px)"
                  value={style.panelConfig?.borderWidth || 2}
                  onChange={(e) => setStyle({
                    ...style,
                    panelConfig: { ...style.panelConfig!, borderWidth: parseInt(e.target.value) || 0 }
                  })}
                  inputProps={{ min: 0, max: 10 }}
                />
              </Tooltip>
            </Grid>

            <Grid item xs={4}>
              <Tooltip title="Border corner rounding in pixels">
                <TextField
                  fullWidth
                  type="number"
                  label="Border Radius (px)"
                  value={style.panelConfig?.borderRadius || 8}
                  onChange={(e) => setStyle({
                    ...style,
                    panelConfig: { ...style.panelConfig!, borderRadius: parseInt(e.target.value) || 0 }
                  })}
                  inputProps={{ min: 0, max: 50 }}
                />
              </Tooltip>
            </Grid>

            <Grid item xs={4}>
              <Tooltip title="Internal padding around text in pixels">
                <TextField
                  fullWidth
                  type="number"
                  label="Padding (px)"
                  value={style.panelConfig?.padding || 20}
                  onChange={(e) => setStyle({
                    ...style,
                    panelConfig: { ...style.panelConfig!, padding: parseInt(e.target.value) || 0 }
                  })}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Tooltip>
            </Grid>

            {/* Gutters */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">GUTTERS (spacing from edges)</Typography>
              </Divider>
            </Grid>

            <Grid item xs={3}>
              <Tooltip title="Space from top edge">
                <TextField
                  fullWidth
                  type="number"
                  label="Top"
                  value={style.panelConfig?.gutterTop || 0}
                  onChange={(e) => setStyle({
                    ...style,
                    panelConfig: { ...style.panelConfig!, gutterTop: parseInt(e.target.value) || 0 }
                  })}
                  inputProps={{ min: 0, max: 200 }}
                />
              </Tooltip>
            </Grid>

            <Grid item xs={3}>
              <Tooltip title="Space from bottom edge">
                <TextField
                  fullWidth
                  type="number"
                  label="Bottom"
                  value={style.panelConfig?.gutterBottom || 0}
                  onChange={(e) => setStyle({
                    ...style,
                    panelConfig: { ...style.panelConfig!, gutterBottom: parseInt(e.target.value) || 0 }
                  })}
                  inputProps={{ min: 0, max: 200 }}
                />
              </Tooltip>
            </Grid>

            <Grid item xs={3}>
              <Tooltip title="Space from left edge">
                <TextField
                  fullWidth
                  type="number"
                  label="Left"
                  value={style.panelConfig?.gutterLeft || 0}
                  onChange={(e) => setStyle({
                    ...style,
                    panelConfig: { ...style.panelConfig!, gutterLeft: parseInt(e.target.value) || 0 }
                  })}
                  inputProps={{ min: 0, max: 200 }}
                />
              </Tooltip>
            </Grid>

            <Grid item xs={3}>
              <Tooltip title="Space from right edge">
                <TextField
                  fullWidth
                  type="number"
                  label="Right"
                  value={style.panelConfig?.gutterRight || 0}
                  onChange={(e) => setStyle({
                    ...style,
                    panelConfig: { ...style.panelConfig!, gutterRight: parseInt(e.target.value) || 0 }
                  })}
                  inputProps={{ min: 0, max: 200 }}
                />
              </Tooltip>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} color="warning">
          Reset {activeTab === 0 ? 'Style' : 'Panel Config'}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Style
        </Button>
      </DialogActions>
    </Dialog>
  );
};

