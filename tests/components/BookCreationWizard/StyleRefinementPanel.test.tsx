import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StyleRefinementPanel } from '../../../src/components/BookCreationWizard/StyleRefinementPanel';
import type { StyleOption, RefinementIteration } from '../../../src/types/Wizard';

describe('StyleRefinementPanel', () => {
  // Mock style option
  const mockStyleOption: StyleOption = {
    id: 'style-1',
    name: 'Watercolor Style',
    prompt: 'A beautiful watercolor painting with soft colors and flowing brushstrokes',
    imageUrl: 'https://example.com/style1.jpg',
    style: {
      artStyle: 'watercolor',
      colorPalette: 'soft pastels',
      visualTheme: 'dreamy',
      characterStyle: 'simplified',
      environmentStyle: 'abstract'
    }
  };
  
  // Mock refinement history
  const mockRefinementHistory: RefinementIteration[] = [
    {
      userFeedback: 'Make it more vibrant',
      modifiedPrompt: 'A beautiful watercolor painting with vibrant colors and flowing brushstrokes',
      generatedImages: [{
        id: 'img-1',
        url: 'https://example.com/refined1.jpg',
        prompt: 'A beautiful watercolor painting with vibrant colors and flowing brushstrokes',
        timestamp: new Date('2024-01-01T10:00:00')
      }],
      timestamp: new Date('2024-01-01T10:00:00')
    },
    {
      userFeedback: 'Add more contrast',
      modifiedPrompt: 'A beautiful watercolor painting with vibrant colors, high contrast, and flowing brushstrokes',
      generatedImages: [{
        id: 'img-2',
        url: 'https://example.com/refined2.jpg',
        prompt: 'A beautiful watercolor painting with vibrant colors, high contrast, and flowing brushstrokes',
        timestamp: new Date('2024-01-01T10:05:00')
      }],
      timestamp: new Date('2024-01-01T10:05:00')
    }
  ];
  
  const defaultProps = {
    selectedStyle: mockStyleOption,
    refinementHistory: [],
    isRefining: false,
    error: null,
    onRefine: vi.fn(),
    onConfirm: vi.fn(),
    onRegenerate: vi.fn()
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render the component with selected style', () => {
      render(<StyleRefinementPanel {...defaultProps} />);
      
      expect(screen.getByRole('region', { name: /style refinement panel/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /refine your style/i })).toBeInTheDocument();
      expect(screen.getByAltText(/selected style preview/i)).toHaveAttribute('src', mockStyleOption.imageUrl);
    });
    
    it('should display the current prompt', () => {
      render(<StyleRefinementPanel {...defaultProps} />);
      
      expect(screen.getByText(/current prompt/i)).toBeInTheDocument();
      // Prompt appears in both collapsed and expanded states, use getAllByText
      const promptElements = screen.getAllByText(mockStyleOption.prompt);
      expect(promptElements.length).toBeGreaterThan(0);
    });
    
    it('should show refinement input section', () => {
      render(<StyleRefinementPanel {...defaultProps} />);
      
      expect(screen.getByText(/refine this style/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type your refinement feedback/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apply refinement feedback/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm and use this style/i })).toBeInTheDocument();
    });
  });
  
  describe('Prompt Editor', () => {
    it('should toggle prompt editor when clicking expand button', () => {
      render(<StyleRefinementPanel {...defaultProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle prompt editor/i });
      
      // Initially collapsed - check aria-expanded
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      
      // Expand
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      const textarea = screen.getByLabelText(/current prompt text/i).querySelector('textarea');
      expect(textarea).toHaveValue(mockStyleOption.prompt);
      
      // Collapse
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });
    
    it('should display prompt as read-only in editor', () => {
      render(<StyleRefinementPanel {...defaultProps} />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle prompt editor/i });
      fireEvent.click(toggleButton);
      
      const promptField = screen.getByLabelText(/current prompt text/i);
      // MUI TextField with readOnly prop renders as a div with InputProps.readOnly
      expect(promptField.querySelector('textarea')).toHaveAttribute('readonly');
    });
  });
  
  describe('Refinement Feedback', () => {
    it('should allow typing refinement feedback', () => {
      render(<StyleRefinementPanel {...defaultProps} />);
      
      const feedbackInput = screen.getByPlaceholderText(/type your refinement feedback/i);
      fireEvent.change(feedbackInput, { target: { value: 'Make it more cartoonish' } });
      
      expect(feedbackInput).toHaveValue('Make it more cartoonish');
    });
    
    it('should call onRefine when clicking refine button', () => {
      const onRefine = vi.fn();
      render(<StyleRefinementPanel {...defaultProps} onRefine={onRefine} />);
      
      const feedbackInput = screen.getByPlaceholderText(/type your refinement feedback/i);
      const refineButton = screen.getByRole('button', { name: /apply refinement feedback/i });
      
      fireEvent.change(feedbackInput, { target: { value: 'Make it more cartoonish' } });
      fireEvent.click(refineButton);
      
      expect(onRefine).toHaveBeenCalledWith('Make it more cartoonish');
    });
    
    it('should clear feedback input after sending', () => {
      const onRefine = vi.fn();
      render(<StyleRefinementPanel {...defaultProps} onRefine={onRefine} />);
      
      const feedbackInput = screen.getByPlaceholderText(/type your refinement feedback/i);
      const refineButton = screen.getByRole('button', { name: /apply refinement feedback/i });
      
      fireEvent.change(feedbackInput, { target: { value: 'Make it more cartoonish' } });
      fireEvent.click(refineButton);
      
      expect(feedbackInput).toHaveValue('');
    });
    
    it('should send feedback on Enter key press', () => {
      const onRefine = vi.fn();
      render(<StyleRefinementPanel {...defaultProps} onRefine={onRefine} />);
      
      const feedbackInput = screen.getByPlaceholderText(/type your refinement feedback/i);
      
      fireEvent.change(feedbackInput, { target: { value: 'Make it more cartoonish' } });
      // Use keyDown instead of keyPress for better compatibility
      fireEvent.keyDown(feedbackInput, { key: 'Enter', shiftKey: false });
      
      expect(onRefine).toHaveBeenCalledWith('Make it more cartoonish');
    });
    
    it('should not send feedback on Shift+Enter', () => {
      const onRefine = vi.fn();
      render(<StyleRefinementPanel {...defaultProps} onRefine={onRefine} />);
      
      const feedbackInput = screen.getByPlaceholderText(/type your refinement feedback/i);
      
      fireEvent.change(feedbackInput, { target: { value: 'Make it more cartoonish' } });
      fireEvent.keyPress(feedbackInput, { key: 'Enter', shiftKey: true });
      
      expect(onRefine).not.toHaveBeenCalled();
    });
    
    it('should disable refine button when feedback is empty', () => {
      render(<StyleRefinementPanel {...defaultProps} />);
      
      const refineButton = screen.getByRole('button', { name: /apply refinement feedback/i });
      expect(refineButton).toBeDisabled();
    });
    
    it('should trim whitespace from feedback', () => {
      const onRefine = vi.fn();
      render(<StyleRefinementPanel {...defaultProps} onRefine={onRefine} />);
      
      const feedbackInput = screen.getByPlaceholderText(/type your refinement feedback/i);
      const refineButton = screen.getByRole('button', { name: /apply refinement feedback/i });
      
      fireEvent.change(feedbackInput, { target: { value: '  Make it more cartoonish  ' } });
      fireEvent.click(refineButton);
      
      expect(onRefine).toHaveBeenCalledWith('Make it more cartoonish');
    });
  });
  
  describe('Regenerate', () => {
    it('should call onRegenerate when clicking regenerate button', () => {
      const onRegenerate = vi.fn();
      render(<StyleRefinementPanel {...defaultProps} onRegenerate={onRegenerate} />);
      
      const regenerateButton = screen.getByRole('button', { name: /regenerate with current prompt/i });
      fireEvent.click(regenerateButton);
      
      expect(onRegenerate).toHaveBeenCalled();
    });
  });
  
  describe('Confirm Style', () => {
    it('should call onConfirm when clicking confirm button', () => {
      const onConfirm = vi.fn();
      render(<StyleRefinementPanel {...defaultProps} onConfirm={onConfirm} />);
      
      const confirmButton = screen.getByRole('button', { name: /confirm and use this style/i });
      fireEvent.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalled();
    });
  });
  
  describe('Refinement History', () => {
    it('should show history toggle button when refinements exist', () => {
      render(<StyleRefinementPanel {...defaultProps} refinementHistory={mockRefinementHistory} />);
      
      expect(screen.getByRole('button', { name: /toggle refinement history/i })).toBeInTheDocument();
    });
    
    it('should not show history toggle button when no refinements', () => {
      render(<StyleRefinementPanel {...defaultProps} refinementHistory={[]} />);
      
      expect(screen.queryByRole('button', { name: /toggle refinement history/i })).not.toBeInTheDocument();
    });
    
    it('should toggle history display when clicking history button', () => {
      render(<StyleRefinementPanel {...defaultProps} refinementHistory={mockRefinementHistory} />);
      
      const historyButton = screen.getByRole('button', { name: /toggle refinement history/i });
      
      // Initially hidden
      expect(screen.queryByText(/refinement history/i)).not.toBeVisible();
      
      // Show history
      fireEvent.click(historyButton);
      expect(screen.getByText(/refinement history \(2\)/i)).toBeVisible();
      expect(screen.getByText(/make it more vibrant/i)).toBeInTheDocument();
      expect(screen.getByText(/add more contrast/i)).toBeInTheDocument();
    });
    
    it('should display refinement iterations in history', () => {
      render(<StyleRefinementPanel {...defaultProps} refinementHistory={mockRefinementHistory} />);
      
      const historyButton = screen.getByRole('button', { name: /toggle refinement history/i });
      fireEvent.click(historyButton);
      
      expect(screen.getByText(/iteration 1/i)).toBeInTheDocument();
      expect(screen.getByText(/iteration 2/i)).toBeInTheDocument();
      expect(screen.getByText(/make it more vibrant/i)).toBeInTheDocument();
      expect(screen.getByText(/add more contrast/i)).toBeInTheDocument();
    });
  });
  
  describe('Comparison View', () => {
    it('should show comparison toggle button when multiple refinements exist', () => {
      render(<StyleRefinementPanel {...defaultProps} refinementHistory={mockRefinementHistory} />);
      
      expect(screen.getByRole('button', { name: /toggle comparison view/i })).toBeInTheDocument();
    });
    
    it('should not show comparison toggle button with only one refinement', () => {
      render(<StyleRefinementPanel {...defaultProps} refinementHistory={[mockRefinementHistory[0]]} />);
      
      expect(screen.queryByRole('button', { name: /toggle comparison view/i })).not.toBeInTheDocument();
    });
    
    it('should toggle comparison view when clicking compare button', () => {
      render(<StyleRefinementPanel {...defaultProps} refinementHistory={mockRefinementHistory} />);
      
      const compareButton = screen.getByRole('button', { name: /toggle comparison view/i });
      
      // Initially single view - "Current Prompt" text exists but not "Previous" or "Current" labels
      expect(screen.queryByText(/^previous$/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/^current$/i)).not.toBeInTheDocument();
      
      // Show comparison
      fireEvent.click(compareButton);
      expect(screen.getByText(/^previous$/i)).toBeInTheDocument();
      expect(screen.getByText(/^current$/i)).toBeInTheDocument();
    });
    
    it('should display previous and current images in comparison view', () => {
      render(<StyleRefinementPanel {...defaultProps} refinementHistory={mockRefinementHistory} />);
      
      const compareButton = screen.getByRole('button', { name: /toggle comparison view/i });
      fireEvent.click(compareButton);
      
      const previousImage = screen.getByAltText(/previous style iteration/i);
      const currentImage = screen.getByAltText(/current style/i);
      
      expect(previousImage).toHaveAttribute('src', mockRefinementHistory[0].generatedImages[0].url);
      expect(currentImage).toHaveAttribute('src', mockRefinementHistory[1].generatedImages[0].url);
    });
  });
  
  describe('Loading State', () => {
    it('should disable all buttons when refining', () => {
      render(<StyleRefinementPanel {...defaultProps} isRefining={true} />);
      
      expect(screen.getByRole('button', { name: /regenerate with current prompt/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /confirm and use this style/i })).toBeDisabled();
      expect(screen.getByPlaceholderText(/type your refinement feedback/i)).toBeDisabled();
    });
    
    it('should show loading indicator when refining', () => {
      render(<StyleRefinementPanel {...defaultProps} isRefining={true} />);
      
      expect(screen.getByRole('status', { name: /generating refined image/i })).toBeInTheDocument();
    });
    
    it('should change refine button text when refining', () => {
      render(<StyleRefinementPanel {...defaultProps} isRefining={true} />);
      
      expect(screen.getByRole('button', { name: /apply refinement feedback/i })).toHaveTextContent(/refining/i);
    });
  });
  
  describe('Error Handling', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to generate refined image';
      render(<StyleRefinementPanel {...defaultProps} error={errorMessage} />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(errorMessage);
    });
    
    it('should not display error alert when error is null', () => {
      render(<StyleRefinementPanel {...defaultProps} error={null} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StyleRefinementPanel {...defaultProps} />);
      
      expect(screen.getByRole('region', { name: /style refinement panel/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/refinement feedback input/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /regenerate with current prompt/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /apply refinement feedback/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm and use this style/i })).toBeInTheDocument();
    });
    
    it('should have proper ARIA pressed state for toggle buttons', () => {
      render(<StyleRefinementPanel {...defaultProps} refinementHistory={mockRefinementHistory} />);
      
      const historyButton = screen.getByRole('button', { name: /toggle refinement history/i });
      expect(historyButton).toHaveAttribute('aria-pressed', 'false');
      
      fireEvent.click(historyButton);
      expect(historyButton).toHaveAttribute('aria-pressed', 'true');
    });
    
    it('should have proper alt text for images', () => {
      render(<StyleRefinementPanel {...defaultProps} />);
      
      expect(screen.getByAltText(/selected style preview/i)).toBeInTheDocument();
    });
  });
});
