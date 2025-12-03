import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneCharacterSelector } from '../../src/components/SceneCharacterSelector';
import type { Character } from '../../src/models/Story';

// Helper to open the MUI Select dropdown
const openSelect = async (user: ReturnType<typeof userEvent.setup>) => {
  // MUI Select uses a div with role="combobox"
  const select = screen.getByRole('combobox');
  await user.click(select);
};

describe('SceneCharacterSelector', () => {
  // Test data
  const mockCharacters: Character[] = [
    { 
      name: 'Alice', 
      description: 'The protagonist of our story',
      imageGallery: []
    },
    { 
      name: 'Bob', 
      description: 'A friendly sidekick',
      imageGallery: []
    },
    { 
      name: 'Charlie', 
      description: 'The mysterious villain',
      imageGallery: []
    }
  ];

  // Book-level characters have isBookLevel flag
  const mockCharactersWithBookLevel: (Character & { isBookLevel?: boolean })[] = [
    { 
      name: 'Alice', 
      description: 'The protagonist',
      imageGallery: [],
      isBookLevel: false
    },
    { 
      name: 'GlobalHero', 
      description: 'A book-level character',
      imageGallery: [],
      isBookLevel: true
    }
  ];

  let mockOnSelectionChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSelectionChange = vi.fn();
  });

  describe('Rendering', () => {
    it('should render accordion with correct title', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/Characters in this Scene/i)).toBeInTheDocument();
    });

    it('should display character count in title', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={['Alice', 'Bob']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });

    it('should display zero count when no characters selected', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/\(0\)/)).toBeInTheDocument();
    });

    it('should show empty state when no characters available', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={[]}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/No characters available/i)).toBeInTheDocument();
      expect(screen.getByText(/Add characters to the story/i)).toBeInTheDocument();
    });

    it('should render Select Characters dropdown', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // MUI Select uses role="combobox"
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Dropdown Display', () => {
    it('should display all available characters in dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown
      await openSelect(user);

      // Check all characters are listed (in listbox)
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('should display character descriptions in dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown
      await openSelect(user);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Check descriptions are shown
      expect(screen.getByText('The protagonist of our story')).toBeInTheDocument();
      expect(screen.getByText('A friendly sidekick')).toBeInTheDocument();
    });

    it('should show Book badge for book-level characters', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharactersWithBookLevel}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown
      await openSelect(user);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Check book badge is shown
      expect(screen.getByText('Book')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onSelectionChange when character is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown and select Alice
      await openSelect(user);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Click on Alice option
      const aliceOption = screen.getByRole('option', { name: /Alice/i });
      await user.click(aliceOption);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['Alice']);
    });

    it('should support multiple character selection', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={['Alice']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown and select Bob (Alice already selected)
      await openSelect(user);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      const bobOption = screen.getByRole('option', { name: /Bob/i });
      await user.click(bobOption);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['Alice', 'Bob']);
    });

    it('should call onSelectionChange when character is deselected', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={['Alice', 'Bob']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown and click Alice to deselect
      await openSelect(user);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      const aliceOption = screen.getByRole('option', { name: /Alice/i });
      await user.click(aliceOption);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['Bob']);
    });
  });

  describe('Selected Characters Display', () => {
    it('should display selected characters as chips in select', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={['Alice', 'Bob']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Chips should be visible in the select display
      const chips = screen.getAllByRole('button', { name: /Alice|Bob/i });
      expect(chips.length).toBeGreaterThan(0);
    });

    it('should show Selected Characters summary section', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={['Alice']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText('Selected Characters:')).toBeInTheDocument();
    });

    it('should not show summary section when no characters selected', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.queryByText('Selected Characters:')).not.toBeInTheDocument();
    });

    it('should show Unknown chip for invalid character references', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={['Alice', 'NonExistentCharacter']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // The unknown chip text appears in format "Unknown (name)"
      // Use getAllByText since it may appear in both select display and summary
      const unknownChips = screen.getAllByText((content) => 
        content.includes('Unknown') && content.includes('NonExistentCharacter')
      );
      expect(unknownChips.length).toBeGreaterThan(0);
    });
  });

  describe('Chip Removal', () => {
    it('should remove character when chip delete is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={['Alice', 'Bob']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Find the summary section
      const summarySection = screen.getByText('Selected Characters:').parentElement;
      
      // Find the Alice chip and its delete button (SVG icon)
      const aliceChip = within(summarySection!).getByText('Alice').closest('.MuiChip-root');
      const deleteButton = aliceChip!.querySelector('svg[data-testid="CancelIcon"]') || 
                          aliceChip!.querySelector('.MuiChip-deleteIcon');
      
      if (deleteButton) {
        await user.click(deleteButton);
        expect(mockOnSelectionChange).toHaveBeenCalledWith(['Bob']);
      } else {
        // Fallback: click the chip's delete area
        const deleteIcon = within(aliceChip as HTMLElement).getByRole('button', { hidden: true });
        await user.click(deleteIcon);
        expect(mockOnSelectionChange).toHaveBeenCalledWith(['Bob']);
      }
    });

    it('should remove unknown character when chip delete is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={['Alice', 'UnknownChar']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Find the Unknown chips - may appear in multiple places
      // Look in the summary section specifically
      const summarySection = screen.getByText('Selected Characters:').parentElement;
      const unknownChips = within(summarySection!).getAllByText((content) => 
        content.includes('Unknown') && content.includes('UnknownChar')
      );
      
      // Get the chip element from the first match
      const unknownChip = unknownChips[0].closest('.MuiChip-root');
      const deleteButton = unknownChip!.querySelector('svg[data-testid="CancelIcon"]') || 
                          unknownChip!.querySelector('.MuiChip-deleteIcon');
      
      if (deleteButton) {
        await user.click(deleteButton);
        expect(mockOnSelectionChange).toHaveBeenCalledWith(['Alice']);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty available characters list', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={[]}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Should not crash and show empty message
      expect(screen.getByText(/No characters available/i)).toBeInTheDocument();
    });

    it('should handle all characters selected', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={['Alice', 'Bob', 'Charlie']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
    });

    it('should handle characters with special characters in names', () => {
      const specialCharacters: Character[] = [
        { name: "O'Brien", description: 'Has apostrophe', imageGallery: [] },
        { name: 'Dr. Smith', description: 'Has period', imageGallery: [] }
      ];

      render(
        <SceneCharacterSelector
          availableCharacters={specialCharacters}
          selectedCharacters={["O'Brien"]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
    });

    it('should handle character with empty description', async () => {
      const user = userEvent.setup();
      const noDescChars: Character[] = [
        { name: 'NoDesc', description: '', imageGallery: [] }
      ];

      render(
        <SceneCharacterSelector
          availableCharacters={noDescChars}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown - should not crash
      await openSelect(user);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      expect(screen.getByText('NoDesc')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible combobox for select', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // MUI Select uses role="combobox"
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should expand accordion by default', () => {
      render(
        <SceneCharacterSelector
          availableCharacters={mockCharacters}
          selectedCharacters={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Accordion content (the combobox) should be visible
      expect(screen.getByRole('combobox')).toBeVisible();
    });
  });
});

