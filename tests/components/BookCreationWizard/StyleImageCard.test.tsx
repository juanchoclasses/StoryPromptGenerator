import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StyleImageCard } from '../../../src/components/BookCreationWizard/StyleImageCard';
import type { StyleOption } from '../../../src/types/Wizard';

describe('StyleImageCard', () => {
  const mockStyleOption: StyleOption = {
    id: 'style-1',
    name: 'Watercolor Dreams',
    prompt: 'A beautiful watercolor style with soft edges and flowing colors',
    imageUrl: 'https://example.com/style1.jpg',
    style: {
      artStyle: 'Watercolor illustration',
      colorPalette: 'Soft pastels with vibrant accents',
      visualTheme: 'Dreamy and whimsical',
      characterStyle: 'Simplified shapes with expressive faces',
      environmentStyle: 'Abstract flowing backgrounds'
    }
  };
  
  describe('Rendering', () => {
    it('should render style image and details', () => {
      render(<StyleImageCard styleOption={mockStyleOption} />);
      
      // Check image
      const image = screen.getByAltText('Watercolor Dreams style preview');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockStyleOption.imageUrl);
      
      // Check name
      expect(screen.getByText('Watercolor Dreams')).toBeInTheDocument();
      
      // Check art style
      expect(screen.getByText('Watercolor illustration')).toBeInTheDocument();
      
      // Check color palette
      expect(screen.getByText(/Colors: Soft pastels with vibrant accents/)).toBeInTheDocument();
    });
    
    it('should render select button', () => {
      render(<StyleImageCard styleOption={mockStyleOption} />);
      
      const selectButton = screen.getByRole('button', { name: /Select Watercolor Dreams style/i });
      expect(selectButton).toBeInTheDocument();
      expect(selectButton).toHaveTextContent('Select Style');
    });
    
    it('should not render when no style option provided', () => {
      const { container } = render(<StyleImageCard />);
      expect(container.firstChild).toBeNull();
    });
  });
  
  describe('Select Button', () => {
    it('should call onSelect when select button is clicked', () => {
      const onSelect = vi.fn();
      render(<StyleImageCard styleOption={mockStyleOption} onSelect={onSelect} />);
      
      const selectButton = screen.getByRole('button', { name: /Select Watercolor Dreams style/i });
      fireEvent.click(selectButton);
      
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(mockStyleOption);
    });
    
    it('should not call onSelect when no handler provided', () => {
      render(<StyleImageCard styleOption={mockStyleOption} />);
      
      const selectButton = screen.getByRole('button', { name: /Select Watercolor Dreams style/i });
      // Should not throw error
      fireEvent.click(selectButton);
    });
  });
  
  describe('Selected State', () => {
    it('should show selected styling when isSelected is true', () => {
      render(<StyleImageCard styleOption={mockStyleOption} isSelected={true} />);
      
      // Check for selected indicator
      expect(screen.getByLabelText('Selected')).toBeInTheDocument();
      
      // Check button shows selected state
      const button = screen.getByRole('button', { name: /Style selected/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Selected');
      expect(button).toBeDisabled();
      
      // Check card has aria-selected
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-selected', 'true');
    });
    
    it('should not show selected styling when isSelected is false', () => {
      render(<StyleImageCard styleOption={mockStyleOption} isSelected={false} />);
      
      // No selected indicator
      expect(screen.queryByLabelText('Selected')).not.toBeInTheDocument();
      
      // Button is not disabled
      const button = screen.getByRole('button', { name: /Select Watercolor Dreams style/i });
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent('Select Style');
      
      // Check card aria-selected
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-selected', 'false');
    });
  });
  
  describe('Collapsible Prompt Section', () => {
    it('should initially hide prompt details', () => {
      render(<StyleImageCard styleOption={mockStyleOption} />);
      
      // Prompt text should not be visible initially
      expect(screen.queryByText(mockStyleOption.prompt)).not.toBeInTheDocument();
    });
    
    it('should expand prompt details when expand button is clicked', () => {
      render(<StyleImageCard styleOption={mockStyleOption} />);
      
      const expandButton = screen.getByRole('button', { name: /Show prompt details/i });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(expandButton);
      
      // Prompt should now be visible
      expect(screen.getByText(mockStyleOption.prompt)).toBeInTheDocument();
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });
    
    it('should collapse prompt details when expand button is clicked again', async () => {
      render(<StyleImageCard styleOption={mockStyleOption} />);
      
      const expandButton = screen.getByRole('button', { name: /Show prompt details/i });
      
      // Expand
      fireEvent.click(expandButton);
      expect(screen.getByText(mockStyleOption.prompt)).toBeInTheDocument();
      
      // Collapse
      fireEvent.click(expandButton);
      
      // Wait for collapse animation to complete
      await waitFor(() => {
        expect(screen.queryByText(mockStyleOption.prompt)).not.toBeInTheDocument();
      });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    });
  });
  
  describe('Loading State', () => {
    it('should show skeleton when isLoading is true', () => {
      render(<StyleImageCard isLoading={true} />);
      
      // Check for loading status
      expect(screen.getByRole('status', { name: /Loading style option/i })).toBeInTheDocument();
      
      // Should not show actual content
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });
    
    it('should not show skeleton when isLoading is false', () => {
      render(<StyleImageCard styleOption={mockStyleOption} isLoading={false} />);
      
      // Should show actual content
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.queryByRole('status', { name: /Loading style option/i })).not.toBeInTheDocument();
    });
  });
  
  describe('Error State', () => {
    it('should show error message when error prop is provided', () => {
      const errorMessage = 'Failed to generate image';
      render(<StyleImageCard error={errorMessage} />);
      
      // Check for error alert
      expect(screen.getByRole('alert', { name: /Failed to generate style/i })).toBeInTheDocument();
      expect(screen.getByText('Failed to generate')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    it('should not show error when no error prop', () => {
      render(<StyleImageCard styleOption={mockStyleOption} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText('Failed to generate')).not.toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StyleImageCard styleOption={mockStyleOption} />);
      
      // Card has proper label
      const card = screen.getByRole('article', { name: /Style option: Watercolor Dreams/i });
      expect(card).toBeInTheDocument();
      
      // Image has alt text
      const image = screen.getByAltText('Watercolor Dreams style preview');
      expect(image).toBeInTheDocument();
      
      // Buttons have labels
      expect(screen.getByRole('button', { name: /Select Watercolor Dreams style/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Show prompt details/i })).toBeInTheDocument();
    });
    
    it('should have proper ARIA attributes for selected state', () => {
      render(<StyleImageCard styleOption={mockStyleOption} isSelected={true} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-selected', 'true');
      
      const button = screen.getByRole('button', { name: /Style selected/i });
      expect(button).toBeDisabled();
    });
    
    it('should have proper ARIA attributes for expand button', () => {
      render(<StyleImageCard styleOption={mockStyleOption} />);
      
      const expandButton = screen.getByRole('button', { name: /Show prompt details/i });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
