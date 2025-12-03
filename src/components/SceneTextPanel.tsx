import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Tooltip
} from '@mui/material';
import {
  Code as CodeIcon,
  TextFields as TextFieldsIcon
} from '@mui/icons-material';

/**
 * Props for the SceneTextPanel component
 */
export interface SceneTextPanelProps {
  /** Current text panel content */
  textPanelContent: string;
  /** Callback when text changes */
  onTextPanelChange: (content: string) => void;
  /** Callback to insert macro at cursor position */
  onInsertMacro: (macro: string) => void;
  /** Callback when preview is requested */
  onPreview: () => void;
  /** Ref for textarea to manage cursor position */
  textPanelFieldRef?: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * SceneTextPanel Component
 * 
 * Handles text panel editing with macro support including:
 * - Text content editing with monospace font
 * - Macro insertion buttons (e.g., {SceneDescription})
 * - Preview button
 * - Cursor position management for macro insertion
 * - Helpful caption about macro usage
 */
export const SceneTextPanel: React.FC<SceneTextPanelProps> = ({
  textPanelContent,
  onTextPanelChange,
  onInsertMacro,
  onPreview,
  textPanelFieldRef
}) => {
  return (
    <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <TextFieldsIcon color="primary" />
          <Typography variant="h6">
            Text Panel (for image overlay)
          </Typography>
        </Box>
        <Tooltip title="Insert Scene Description macro">
          <Button
            size="small"
            startIcon={<CodeIcon />}
            onClick={() => onInsertMacro('{SceneDescription}')}
            variant="outlined"
          >
            {'{SceneDescription}'}
          </Button>
        </Tooltip>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Text to display on the generated image. Use macros like {'{SceneDescription}'} for dynamic content.
      </Typography>

      <TextField
        inputRef={textPanelFieldRef}
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        placeholder="Enter text for image overlay... Use {SceneDescription} to insert scene description."
        value={textPanelContent}
        onChange={(e) => onTextPanelChange(e.target.value)}
        sx={{ 
          bgcolor: 'white',
          '& .MuiInputBase-root': {
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }
        }}
      />
      
      <Button
        variant="outlined"
        color="primary"
        onClick={onPreview}
        sx={{ mt: 2 }}
      >
        Preview Text Panel
      </Button>
    </Box>
  );
};
