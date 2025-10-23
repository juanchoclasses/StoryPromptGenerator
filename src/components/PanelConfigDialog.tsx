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
  Grid,
  Typography,
  Box,
  Slider
} from '@mui/material';
import type { PanelConfig, PanelPosition } from '../types/Book';
import { DEFAULT_PANEL_CONFIG } from '../types/Book';

interface PanelConfigDialogProps {
  open: boolean;
  onClose: () => void;
  initialConfig?: PanelConfig;
  onSave: (config: PanelConfig) => void;
}

export const PanelConfigDialog: React.FC<PanelConfigDialogProps> = ({
  open,
  onClose,
  initialConfig,
  onSave
}) => {
  const [config, setConfig] = useState<PanelConfig>(initialConfig || DEFAULT_PANEL_CONFIG);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    } else {
      setConfig(DEFAULT_PANEL_CONFIG);
    }
  }, [initialConfig, open]);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleReset = () => {
    setConfig(DEFAULT_PANEL_CONFIG);
  };

  const fontOptions = [
    'Arial, sans-serif',
    'Georgia, serif',
    'Times New Roman, serif',
    'Courier New, monospace',
    'Comic Sans MS, cursive',
    'Impact, fantasy',
    'Verdana, sans-serif',
    'Trebuchet MS, sans-serif'
  ];

  const positionOptions: { value: PanelPosition; label: string }[] = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'middle-left', label: 'Middle Left' },
    { value: 'middle-right', label: 'Middle Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configure Text Panel Overlay</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Font Family */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Font Family</InputLabel>
                <Select
                  value={config.fontFamily}
                  label="Font Family"
                  onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
                >
                  {fontOptions.map((font) => (
                    <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                      {font.split(',')[0]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Font Size */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Font Size (px)"
                type="number"
                value={config.fontSize}
                onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) })}
                inputProps={{ min: 8, max: 100 }}
              />
            </Grid>

            {/* Text Alignment */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Text Alignment</InputLabel>
                <Select
                  value={config.textAlign}
                  label="Text Alignment"
                  onChange={(e) => setConfig({ ...config, textAlign: e.target.value as 'left' | 'center' | 'right' })}
                >
                  <MenuItem value="left">Left</MenuItem>
                  <MenuItem value="center">Center</MenuItem>
                  <MenuItem value="right">Right</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Position */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Position</InputLabel>
                <Select
                  value={config.position}
                  label="Position"
                  onChange={(e) => setConfig({ ...config, position: e.target.value as PanelPosition })}
                >
                  {positionOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Width Percentage */}
            <Grid item xs={12}>
              <Typography gutterBottom>Width: {config.widthPercentage}%</Typography>
              <Slider
                value={config.widthPercentage}
                onChange={(_, value) => setConfig({ ...config, widthPercentage: value as number })}
                min={10}
                max={100}
                marks={[
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' }
                ]}
              />
            </Grid>

            {/* Height Percentage */}
            <Grid item xs={12}>
              <Typography gutterBottom>Height: {config.heightPercentage}%</Typography>
              <Slider
                value={config.heightPercentage}
                onChange={(_, value) => setConfig({ ...config, heightPercentage: value as number })}
                min={5}
                max={50}
                marks={[
                  { value: 10, label: '10%' },
                  { value: 20, label: '20%' },
                  { value: 30, label: '30%' },
                  { value: 50, label: '50%' }
                ]}
              />
            </Grid>

            {/* Background Color */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Background Color"
                value={config.backgroundColor}
                onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                type="color"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        backgroundColor: config.backgroundColor,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        mr: 1
                      }}
                    />
                  )
                }}
              />
            </Grid>

            {/* Font Color */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Font Color"
                value={config.fontColor}
                onChange={(e) => setConfig({ ...config, fontColor: e.target.value })}
                type="color"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        backgroundColor: config.fontColor,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        mr: 1
                      }}
                    />
                  )
                }}
              />
            </Grid>

            {/* Border Color */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Border Color"
                value={config.borderColor}
                onChange={(e) => setConfig({ ...config, borderColor: e.target.value })}
                type="color"
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        backgroundColor: config.borderColor,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        mr: 1
                      }}
                    />
                  )
                }}
              />
            </Grid>

            {/* Border Width */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Border Width (px)"
                type="number"
                value={config.borderWidth}
                onChange={(e) => setConfig({ ...config, borderWidth: Number(e.target.value) })}
                inputProps={{ min: 0, max: 20 }}
              />
            </Grid>

            {/* Border Radius */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Border Radius (px)"
                type="number"
                value={config.borderRadius}
                onChange={(e) => setConfig({ ...config, borderRadius: Number(e.target.value) })}
                inputProps={{ min: 0, max: 50 }}
              />
            </Grid>

            {/* Padding */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Padding (px)"
                type="number"
                value={config.padding}
                onChange={(e) => setConfig({ ...config, padding: Number(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} color="warning">
          Reset to Default
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

