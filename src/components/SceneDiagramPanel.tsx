import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';
import type { Scene, Story } from '../types/Story';

/**
 * Props for the SceneDiagramPanel component
 */
export interface SceneDiagramPanelProps {
  /** Current scene being edited */
  scene: Scene;
  /** Parent story for diagram style configuration */
  story: Story;
  /** Current diagram type */
  diagramType: 'mermaid' | 'math' | 'code' | 'markdown';
  /** Current diagram content */
  diagramContent: string;
  /** Programming language for code blocks */
  diagramLanguage: string;
  /** Callback when diagram changes (includes auto-save) */
  onDiagramChange: (content: string, type: string, language?: string) => Promise<void>;
  /** Callback when preview is requested */
  onPreview: () => void;
}

/**
 * SceneDiagramPanel Component
 * 
 * Handles all diagram panel editing functionality including:
 * - Diagram type selection (mermaid, math, code, markdown)
 * - Language selection for code blocks
 * - Diagram content editing with monospace font
 * - Preview button
 * - Auto-save on change
 * - Configuration alert when diagram style not set
 */
export const SceneDiagramPanel: React.FC<SceneDiagramPanelProps> = ({
  story,
  diagramType,
  diagramContent,
  diagramLanguage,
  onDiagramChange,
  onPreview
}) => {
  /**
   * Get placeholder text based on diagram type
   */
  const getPlaceholder = (): string => {
    switch (diagramType) {
      case 'mermaid':
        return 'graph TD\n    A[Start] --> B[Process]\n    B --> C[End]';
      case 'math':
        return 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
      case 'code':
        return 'function factorial(n) {\n  return n <= 1 ? 1 : n * factorial(n - 1);\n}';
      case 'markdown':
        return '# Title\n\n- **Bold** text\n- *Italic* text';
      default:
        return '';
    }
  };

  /**
   * Get label text based on diagram type
   */
  const getLabel = (): string => {
    return `${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} Content`;
  };

  return (
    <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.100' }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <ImageIcon color="secondary" />
        <Typography variant="h6">
          Diagram Panel (optional blackboard/whiteboard overlay)
        </Typography>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Add a diagram, code block, math equation, or markdown text overlay on your image.
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Diagram Type</InputLabel>
        <Select
          value={diagramType}
          label="Diagram Type"
          onChange={(e) => onDiagramChange(diagramContent, e.target.value, diagramLanguage)}
        >
          <MenuItem value="mermaid">Mermaid Diagram</MenuItem>
          <MenuItem value="math">Math Equation (LaTeX)</MenuItem>
          <MenuItem value="code">Code Block</MenuItem>
          <MenuItem value="markdown">Markdown Text</MenuItem>
        </Select>
      </FormControl>

      {diagramType === 'code' && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Programming Language</InputLabel>
          <Select
            value={diagramLanguage}
            label="Programming Language"
            onChange={(e) => onDiagramChange(diagramContent, diagramType, e.target.value)}
          >
            <MenuItem value="javascript">JavaScript</MenuItem>
            <MenuItem value="python">Python</MenuItem>
            <MenuItem value="java">Java</MenuItem>
            <MenuItem value="typescript">TypeScript</MenuItem>
            <MenuItem value="cpp">C++</MenuItem>
            <MenuItem value="csharp">C#</MenuItem>
          </Select>
        </FormControl>
      )}

      <TextField
        fullWidth
        multiline
        rows={6}
        variant="outlined"
        label={getLabel()}
        placeholder={getPlaceholder()}
        value={diagramContent}
        onChange={(e) => onDiagramChange(e.target.value, diagramType, diagramLanguage)}
        sx={{ 
          bgcolor: 'white',
          '& .MuiInputBase-root': {
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }
        }}
      />
      
      <Button
        variant="outlined"
        color="primary"
        onClick={onPreview}
        sx={{ mt: 2 }}
      >
        Preview Diagram
      </Button>
      
      {!story?.diagramStyle && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Note: Diagram style (colors, position, board type) needs to be configured at the story level.
          Click the ⚙️ icon next to the story in the Stories panel to configure it.
        </Alert>
      )}
    </Box>
  );
};
