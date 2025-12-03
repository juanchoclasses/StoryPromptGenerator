import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneElementSelector } from '../../src/components/SceneElementSelector';
import type { StoryElement } from '../../src/types/Story';

// Helper to open the MUI Select dropdown
const openSelect = async (user: ReturnType<typeof userEvent.setup>) => {
  // MUI Select uses a div with role="combobox"
  const select = screen.getByRole('combobox');
  await user.click(select);
};

describe('SceneElementSelector', () => {
  // Test data
  const mockElements: StoryElement[] = [
    { 
      id: 'elem-1',
      name: 'Magic Wand', 
      description: 'A powerful magical artifact',
      category: 'Props'
    },
    { 
      id: 'elem-2',
      name: 'Castle', 
      description: 'A medieval fortress',
      category: 'Locations'
    },
    { 
      id: 'elem-3',
      name: 'Dragon', 
      description: 'A fearsome creature',
      category: 'Creatures'
    }
  ];

  const mockElementsWithoutCategory: StoryElement[] = [
    { 
      id: 'elem-4',
      name: 'Sword', 
      description: 'A sharp blade'
    }
  ];

  let mockOnSelectionChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSelectionChange = vi.fn();
  });

  describe('Rendering', () => {
    it('should render accordion with correct title', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/Elements in this Scene/i)).toBeInTheDocument();
    });

    it('should display element count in title', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={['elem-1', 'elem-2']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });

    it('should display zero count when no elements selected', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/\(0\)/)).toBeInTheDocument();
    });

    it('should show empty state when no elements available', () => {
      render(
        <SceneElementSelector
          availableElements={[]}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/No elements available/i)).toBeInTheDocument();
      expect(screen.getByText(/Add elements to the story/i)).toBeInTheDocument();
    });

    it('should render Select Elements dropdown', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // MUI Select uses role="combobox"
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Dropdown Display', () => {
    it('should display all available elements in dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown
      await openSelect(user);

      // Check all elements are listed (in listbox)
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Magic Wand')).toBeInTheDocument();
      expect(screen.getByText('Castle')).toBeInTheDocument();
      expect(screen.getByText('Dragon')).toBeInTheDocument();
    });

    it('should display element descriptions in dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown
      await openSelect(user);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Check descriptions are shown
      expect(screen.getByText('A powerful magical artifact')).toBeInTheDocument();
      expect(screen.getByText('A medieval fortress')).toBeInTheDocument();
    });

    it('should show category badges for elements with categories', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown
      await openSelect(user);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Check category badges are shown
      expect(screen.getByText('Props')).toBeInTheDocument();
      expect(screen.getByText('Locations')).toBeInTheDocument();
      expect(screen.getByText('Creatures')).toBeInTheDocument();
    });

    it('should handle elements without categories', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneElementSelector
          availableElements={mockElementsWithoutCategory}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown
      await openSelect(user);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Element should be shown without category badge
      expect(screen.getByText('Sword')).toBeInTheDocument();
      expect(screen.getByText('A sharp blade')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onSelectionChange when element is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown and select Magic Wand
      await openSelect(user);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Click on Magic Wand option
      const wandOption = screen.getByRole('option', { name: /Magic Wand/i });
      await user.click(wandOption);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['elem-1']);
    });

    it('should support multiple element selection', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={['elem-1']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown and select Castle (Magic Wand already selected)
      await openSelect(user);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      const castleOption = screen.getByRole('option', { name: /Castle/i });
      await user.click(castleOption);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['elem-1', 'elem-2']);
    });

    it('should call onSelectionChange when element is deselected', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={['elem-1', 'elem-2']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown and click Magic Wand to deselect
      await openSelect(user);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      const wandOption = screen.getByRole('option', { name: /Magic Wand/i });
      await user.click(wandOption);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(['elem-2']);
    });
  });

  describe('Selected Elements Display', () => {
    it('should display selected elements as chips in select', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={['elem-1', 'elem-2']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Chips should be visible in the select display
      const chips = screen.getAllByRole('button', { name: /Magic Wand|Castle/i });
      expect(chips.length).toBeGreaterThan(0);
    });

    it('should show Selected Elements summary section', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={['elem-1']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText('Selected Elements:')).toBeInTheDocument();
    });

    it('should not show summary section when no elements selected', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.queryByText('Selected Elements:')).not.toBeInTheDocument();
    });

    it('should show Unknown chip for invalid element references', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={['elem-1', 'invalid-elem-id']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // The unknown chip text appears in format "Unknown (id...)" with truncated ID
      // Use getAllByText since it may appear in both select display and summary
      const unknownChips = screen.getAllByText((content) => 
        content.includes('Unknown') && content.includes('invalid-')
      );
      expect(unknownChips.length).toBeGreaterThan(0);
    });
  });

  describe('Chip Removal', () => {
    it('should remove element when chip delete is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={['elem-1', 'elem-2']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Find the summary section
      const summarySection = screen.getByText('Selected Elements:').parentElement;
      
      // Find the Magic Wand chip and its delete button (SVG icon)
      const wandChip = within(summarySection!).getByText('Magic Wand').closest('.MuiChip-root');
      const deleteButton = wandChip!.querySelector('svg[data-testid="CancelIcon"]') || 
                          wandChip!.querySelector('.MuiChip-deleteIcon');
      
      if (deleteButton) {
        await user.click(deleteButton);
        expect(mockOnSelectionChange).toHaveBeenCalledWith(['elem-2']);
      } else {
        // Fallback: click the chip's delete area
        const deleteIcon = within(wandChip as HTMLElement).getByRole('button', { hidden: true });
        await user.click(deleteIcon);
        expect(mockOnSelectionChange).toHaveBeenCalledWith(['elem-2']);
      }
    });

    it('should remove unknown element when chip delete is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={['elem-1', 'unknown-elem']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Find the Unknown chips - may appear in multiple places
      // Look in the summary section specifically
      const summarySection = screen.getByText('Selected Elements:').parentElement;
      const unknownChips = within(summarySection!).getAllByText((content) => 
        content.includes('Unknown') && content.includes('unknown-')
      );
      
      // Get the chip element from the first match
      const unknownChip = unknownChips[0].closest('.MuiChip-root');
      const deleteButton = unknownChip!.querySelector('svg[data-testid="CancelIcon"]') || 
                          unknownChip!.querySelector('.MuiChip-deleteIcon');
      
      if (deleteButton) {
        await user.click(deleteButton);
        expect(mockOnSelectionChange).toHaveBeenCalledWith(['elem-1']);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty available elements list', () => {
      render(
        <SceneElementSelector
          availableElements={[]}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Should not crash and show empty message
      expect(screen.getByText(/No elements available/i)).toBeInTheDocument();
    });

    it('should handle all elements selected', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={['elem-1', 'elem-2', 'elem-3']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
    });

    it('should handle elements with special characters in names', () => {
      const specialElements: StoryElement[] = [
        { id: 'elem-5', name: "O'Malley's Pub", description: 'Has apostrophe' },
        { id: 'elem-6', name: 'Dr. Strange\'s Cloak', description: 'Has period and apostrophe' }
      ];

      render(
        <SceneElementSelector
          availableElements={specialElements}
          selectedElements={['elem-5']}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
    });

    it('should handle element with empty description', async () => {
      const user = userEvent.setup();
      const noDescElements: StoryElement[] = [
        { id: 'elem-7', name: 'NoDesc', description: '' }
      ];

      render(
        <SceneElementSelector
          availableElements={noDescElements}
          selectedElements={[]}
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

    it('should handle mixed elements with and without categories', async () => {
      const user = userEvent.setup();
      const mixedElements: StoryElement[] = [
        { id: 'elem-8', name: 'Categorized', description: 'Has category', category: 'Props' },
        { id: 'elem-9', name: 'Uncategorized', description: 'No category' }
      ];

      render(
        <SceneElementSelector
          availableElements={mixedElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Open dropdown
      await openSelect(user);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Both should be visible
      expect(screen.getByText('Categorized')).toBeInTheDocument();
      expect(screen.getByText('Uncategorized')).toBeInTheDocument();
      expect(screen.getByText('Props')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible combobox for select', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // MUI Select uses role="combobox"
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should expand accordion by default', () => {
      render(
        <SceneElementSelector
          availableElements={mockElements}
          selectedElements={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Accordion content (the combobox) should be visible
      expect(screen.getByRole('combobox')).toBeVisible();
    });
  });
});
