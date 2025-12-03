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
import { ExpandMore as ExpandMoreIcon, Person as PersonIcon } from '@mui/icons-material';
import type { Character } from '../models/Story';

/**
 * Extended character type that includes optional book-level flag
 * Book-level characters are shared across all stories in a book
 */
export interface AvailableCharacter extends Character {
  isBookLevel?: boolean;
}

export interface SceneCharacterSelectorProps {
  /** List of characters available for selection (from story and/or book) */
  availableCharacters: AvailableCharacter[];
  /** Currently selected character names */
  selectedCharacters: string[];
  /** Callback when selection changes */
  onSelectionChange: (characters: string[]) => void;
}

/**
 * SceneCharacterSelector - A reusable component for selecting characters in a scene
 * 
 * Features:
 * - Multi-select dropdown with character names and descriptions
 * - Book-level character badge indicator
 * - Selected characters summary with removable chips
 * - Handles unknown/invalid character references gracefully
 * - Empty state when no characters available
 */
export const SceneCharacterSelector: React.FC<SceneCharacterSelectorProps> = ({
  availableCharacters,
  selectedCharacters,
  onSelectionChange
}) => {
  /**
   * Handle character selection from dropdown
   */
  const handleCharacterSelection = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const newSelection = typeof value === 'string' ? value.split(',') : value;
    onSelectionChange(newSelection);
  };

  /**
   * Remove a character from selection
   */
  const handleRemoveCharacter = (characterName: string) => {
    const newSelection = selectedCharacters.filter(name => name !== characterName);
    onSelectionChange(newSelection);
  };

  /**
   * Find character by name in available characters
   */
  const findCharacter = (characterName: string): AvailableCharacter | undefined => {
    return availableCharacters.find(c => c.name === characterName);
  };

  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon color="primary" />
          <Typography variant="h6">
            Characters in this Scene ({selectedCharacters.length})
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <FormControl fullWidth>
          <InputLabel>Select Characters</InputLabel>
          <Select
            multiple
            value={selectedCharacters}
            onChange={handleCharacterSelection}
            input={<OutlinedInput label="Select Characters" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((characterName) => {
                  const character = findCharacter(characterName);
                  return character ? (
                    <Chip 
                      key={characterName} 
                      label={character.name} 
                      size="small" 
                      color="primary"
                      variant="filled"
                    />
                  ) : (
                    <Chip 
                      key={characterName} 
                      label={`Unknown (${characterName})`} 
                      size="small" 
                      color="error"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            )}
          >
            {availableCharacters.map((character) => (
              <MenuItem key={character.name} value={character.name}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{character.name}</Typography>
                    {character.isBookLevel && (
                      <Chip 
                        label="Book" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {character.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Selected Characters Summary */}
        {selectedCharacters.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Selected Characters:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {selectedCharacters.map((characterName) => {
                const character = findCharacter(characterName);
                return character ? (
                  <Chip
                    key={characterName}
                    label={character.name}
                    size="small"
                    color="primary"
                    variant="outlined"
                    onDelete={() => handleRemoveCharacter(characterName)}
                  />
                ) : (
                  <Chip
                    key={characterName}
                    label={`Unknown (${characterName})`}
                    size="small"
                    color="error"
                    variant="outlined"
                    onDelete={() => handleRemoveCharacter(characterName)}
                  />
                );
              })}
            </Box>
          </Box>
        )}
        
        {availableCharacters.length === 0 && (
          <Box textAlign="center" py={2}>
            <Typography variant="body2" color="text.secondary">
              No characters available. Add characters to the story's cast first.
            </Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

