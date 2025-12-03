import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { StoryElement } from '../types/Story';

export interface SceneElementSelectorProps {
  /** List of elements available for selection (from story) */
  availableElements: StoryElement[];
  /** Currently selected element IDs */
  selectedElements: string[];
  /** Callback when selection changes */
  onSelectionChange: (elementIds: string[]) => void;
}

/**
 * SceneElementSelector - A reusable component for selecting elements in a scene
 * 
 * Features:
 * - Multi-select dropdown with element names and descriptions
 * - Category badges for elements
 * - Selected elements summary with removable chips
 * - Handles unknown/invalid element references gracefully
 * - Empty state when no elements available
 * 
 * **Feature: scene-editor-refactoring, Property 2: SceneElementSelector component correctness**
 */
export const SceneElementSelector: React.FC<SceneElementSelectorProps> = ({
  availableElements,
  selectedElements,
  onSelectionChange
}) => {
  /**
   * Handle element selection from dropdown
   */
  const handleElementSelection = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const newSelection = typeof value === 'string' ? value.split(',') : value;
    onSelectionChange(newSelection);
  };

  /**
   * Remove an element from selection
   */
  const handleRemoveElement = (elementId: string) => {
    const newSelection = selectedElements.filter(id => id !== elementId);
    onSelectionChange(newSelection);
  };

  /**
   * Find element by ID in available elements
   */
  const findElement = (elementId: string): StoryElement | undefined => {
    return availableElements.find(e => e.id === elementId);
  };

  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6">
            Elements in this Scene ({selectedElements.length})
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <FormControl fullWidth>
          <InputLabel>Select Elements</InputLabel>
          <Select
            multiple
            value={selectedElements}
            onChange={handleElementSelection}
            input={<OutlinedInput label="Select Elements" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((elementId) => {
                  const element = findElement(elementId);
                  return element ? (
                    <Chip 
                      key={elementId} 
                      label={element.name} 
                      size="small" 
                      color="secondary"
                      variant="filled"
                    />
                  ) : (
                    <Chip 
                      key={elementId} 
                      label={`Unknown (${elementId.slice(0, 8)}...)`} 
                      size="small" 
                      color="error"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            )}
          >
            {availableElements.map((element) => (
              <MenuItem key={element.id} value={element.id}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{element.name}</Typography>
                    {element.category && (
                      <Chip 
                        label={element.category} 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {element.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Selected Elements Summary */}
        {selectedElements.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="secondary" gutterBottom>
              Selected Elements:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {selectedElements.map((elementId) => {
                const element = findElement(elementId);
                return element ? (
                  <Chip
                    key={elementId}
                    label={element.name}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    onDelete={() => handleRemoveElement(elementId)}
                  />
                ) : (
                  <Chip
                    key={elementId}
                    label={`Unknown (${elementId.slice(0, 8)}...)`}
                    size="small"
                    color="error"
                    variant="outlined"
                    onDelete={() => handleRemoveElement(elementId)}
                  />
                );
              })}
            </Box>
          </Box>
        )}
        
        {availableElements.length === 0 && (
          <Box textAlign="center" py={2}>
            <Typography variant="body2" color="text.secondary">
              No elements available. Add elements to the story's elements first.
            </Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
