import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StyleGallery } from '../../../src/components/BookCreationWizard/StyleGallery';
import * as useStyleRefinementModule from '../../../src/hooks/useStyleRefinement';
import type { StyleOption, StyleRefinementState } from '../../../src/types/Wizard';

// Mock the useStyleRefinement hook
vi.mock('../../../src/hooks/useStyleRefinement');

// Mock child components
vi.mock('../../../src/components/BookCreationWizard/StyleImageCard', () => ({
  StyleImageCard: ({ styleOption, onSelect }: any) => (
    <div
      data-testid={`style-card-${styleOption.id}`}
      onClick={() => onSelect?.(styleOption)}
      role="button"
    >
      {styleOption.name}
    </div>
  )
}));

vi.mock('../../../src/components/BookCreationWizard/StyleRefinementPanel', () => ({
  StyleRefinementPanel: ({ selectedStyle, onConfirm, onRefine, onRegenerate }: any) => (
    <div data-testid="refinement-panel">
      <div>Refining: {selectedStyle.name}</div>
      <button onClick={() => onRefine?.('test feedback')}>Refine</button>
      <button onClick={() => onRegenerate?.()}>Regenerate</button>
      <button onClick={() => onConfirm?.()}>Confirm</button>
    </div>
  )
}));

describe('StyleGallery', () => {
  // Sample style options for testing
  const mockStyleOptions: StyleOption[] = [
    {
      id: 'style-1',
      name: 'Watercolor Dreams',
      prompt: 'watercolor style, soft colors',
      imageUrl: 'http://example.com/style1.jpg',
      style: {
        artStyle: 'watercolor',
        colorPalette: 'soft pastels',
        visualTheme: 'dreamy',
        characterStyle: 'simplified',
        environmentStyle: 'abstract'
      }
    },
    {
      id: 'style-2',
      name: 'Bold Comics',
      prompt: 'comic book style, vibrant colors',
      imageUrl: 'http://example.com/style2.jpg',
      style: {
        artStyle: 'comic book',
        colorPalette: 'vibrant primary colors',
        visualTheme: 'energetic',
        characterStyle: 'bold outlines',
        environmentStyle: 'dynamic'
      }
    },
    {
      id: 'style-3',
      name: 'Minimalist Modern',
      prompt: 'minimalist style, clean lines',
      imageUrl: 'http://example.com/style3.jpg',
      style: {
        artStyle: 'minimalist',
        colorPalette: 'monochrome with accents',
        visualTheme: 'clean',
        characterStyle: 'geometric',
        environmentStyle: 'simple'
      }
    }
  ];
  
  // Default mock implementation
  const defaultMockRefinementState: StyleRefinementState = {
    initialOptions: [],
    selectedOption: undefined,
    refinementHistory: [],
    currentImages: [],
    isRefining: false
  };
  
  const mockGenerateInitialStyles = vi.fn();
  const mockSelectStyle = vi.fn();
  const mockRefineStyle = vi.fn();
  const mockConfirmStyle = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
      refinementState: defaultMockRefinementState,
      generateInitialStyles: mockGenerateInitialStyles,
      selectStyle: mockSelectStyle,
      refineStyle: mockRefineStyle,
      confirmStyle: mockConfirmStyle,
      isGenerating: false,
      error: null
    });
  });
  
  describe('Initial Generation', () => {
    it('should auto-generate styles on mount when autoGenerate is true', async () => {
      mockGenerateInitialStyles.mockResolvedValue(undefined);
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={true}
        />
      );
      
      await waitFor(() => {
        expect(mockGenerateInitialStyles).toHaveBeenCalledWith(
          'A book about space exploration',
          undefined,
          '3:4'
        );
      });
    });
    
    it('should not auto-generate styles when autoGenerate is false', () => {
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(mockGenerateInitialStyles).not.toHaveBeenCalled();
    });
    
    it('should pass preferences and aspectRatio to generateInitialStyles', async () => {
      mockGenerateInitialStyles.mockResolvedValue(undefined);
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          preferences="vibrant colors, futuristic"
          aspectRatio="16:9"
          autoGenerate={true}
        />
      );
      
      await waitFor(() => {
        expect(mockGenerateInitialStyles).toHaveBeenCalledWith(
          'A book about space exploration',
          'vibrant colors, futuristic',
          '16:9'
        );
      });
    });
    
    it('should show loading state while generating initial styles', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: defaultMockRefinementState,
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: true,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Generating Style Options')).toBeInTheDocument();
      expect(screen.getByText(/Creating 3-5 unique visual styles/)).toBeInTheDocument();
    });
  });
  
  describe('Style Gallery Display', () => {
    it('should display style cards in a grid', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getByTestId('style-card-style-1')).toBeInTheDocument();
      expect(screen.getByTestId('style-card-style-2')).toBeInTheDocument();
      expect(screen.getByTestId('style-card-style-3')).toBeInTheDocument();
      
      expect(screen.getByText('Watercolor Dreams')).toBeInTheDocument();
      expect(screen.getByText('Bold Comics')).toBeInTheDocument();
      expect(screen.getByText('Minimalist Modern')).toBeInTheDocument();
    });
    
    it('should show header with title and description', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getByText('Choose Your Visual Style')).toBeInTheDocument();
      expect(screen.getByText(/Select a style that matches your vision/)).toBeInTheDocument();
    });
    
    it('should show "Generate More Options" button when styles exist', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getByText("Don't see what you're looking for?")).toBeInTheDocument();
      expect(screen.getByLabelText('Generate more style options')).toBeInTheDocument();
    });
    
    it('should show empty state when no styles are generated', () => {
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getByText('No Styles Generated Yet')).toBeInTheDocument();
      expect(screen.getByLabelText('Generate initial styles')).toBeInTheDocument();
    });
  });
  
  describe('Style Selection', () => {
    it('should call selectStyle when a style card is clicked', async () => {
      const user = userEvent.setup();
      
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      const styleCard = screen.getByTestId('style-card-style-1');
      await user.click(styleCard);
      
      expect(mockSelectStyle).toHaveBeenCalledWith('style-1');
    });
    
    it('should show refinement panel when a style is selected', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions,
          selectedOption: mockStyleOptions[0]
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getByTestId('refinement-panel')).toBeInTheDocument();
      expect(screen.getByText('Refining: Watercolor Dreams')).toBeInTheDocument();
      expect(screen.queryByTestId('style-card-style-1')).not.toBeInTheDocument();
    });
    
    it('should show back button when refinement panel is displayed', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions,
          selectedOption: mockStyleOptions[0]
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getByLabelText('Back to style gallery')).toBeInTheDocument();
    });
    
    it('should return to gallery when back button is clicked', async () => {
      const user = userEvent.setup();
      
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions,
          selectedOption: mockStyleOptions[0]
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      const backButton = screen.getByLabelText('Back to style gallery');
      await user.click(backButton);
      
      expect(mockSelectStyle).toHaveBeenCalledWith('');
    });
  });
  
  describe('Style Refinement', () => {
    it('should call refineStyle when refine button is clicked', async () => {
      const user = userEvent.setup();
      mockRefineStyle.mockResolvedValue(undefined);
      
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions,
          selectedOption: mockStyleOptions[0]
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          aspectRatio="16:9"
          autoGenerate={false}
        />
      );
      
      const refineButton = screen.getByText('Refine');
      await user.click(refineButton);
      
      expect(mockRefineStyle).toHaveBeenCalledWith(
        'test feedback',
        'A book about space exploration',
        '16:9'
      );
    });
    
    it('should call refineStyle with regenerate feedback when regenerate is clicked', async () => {
      const user = userEvent.setup();
      mockRefineStyle.mockResolvedValue(undefined);
      
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions,
          selectedOption: mockStyleOptions[0]
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      const regenerateButton = screen.getByText('Regenerate');
      await user.click(regenerateButton);
      
      expect(mockRefineStyle).toHaveBeenCalledWith(
        'regenerate with same prompt',
        'A book about space exploration',
        '3:4'
      );
    });
    
    it('should call confirmStyle and onStyleConfirmed when confirm is clicked', async () => {
      const user = userEvent.setup();
      const mockOnStyleConfirmed = vi.fn();
      const confirmedStyle = mockStyleOptions[0];
      
      mockConfirmStyle.mockReturnValue(confirmedStyle);
      
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions,
          selectedOption: mockStyleOptions[0]
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          onStyleConfirmed={mockOnStyleConfirmed}
          autoGenerate={false}
        />
      );
      
      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);
      
      expect(mockConfirmStyle).toHaveBeenCalled();
      expect(mockOnStyleConfirmed).toHaveBeenCalledWith(confirmedStyle);
    });
  });
  
  describe('Error Handling', () => {
    it('should show error alert when generation fails initially', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: defaultMockRefinementState,
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: 'Failed to connect to image generation service'
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      expect(screen.getByText('Failed to Generate Styles')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to image generation service')).toBeInTheDocument();
    });
    
    it('should show retry button on error', async () => {
      const user = userEvent.setup();
      mockGenerateInitialStyles.mockResolvedValue(undefined);
      
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: defaultMockRefinementState,
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: 'Failed to connect to image generation service'
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      const retryButton = screen.getByLabelText('Retry generating styles');
      await user.click(retryButton);
      
      expect(mockGenerateInitialStyles).toHaveBeenCalled();
    });
    
    it('should show error in gallery view when refinement fails', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: 'Refinement failed'
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      // Error should be displayed in gallery view
      expect(screen.getByText('Refinement failed')).toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels for main regions', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getByRole('region', { name: 'Style gallery' })).toBeInTheDocument();
    });
    
    it('should have proper ARIA label for loading state', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: defaultMockRefinementState,
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: true,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getByLabelText('Generating style options')).toBeInTheDocument();
    });
    
    it('should have proper button labels', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      expect(screen.getByLabelText('Generate more style options')).toBeInTheDocument();
    });
  });
  
  describe('Responsive Layout', () => {
    it('should render grid container with proper spacing', () => {
      vi.mocked(useStyleRefinementModule.useStyleRefinement).mockReturnValue({
        refinementState: {
          ...defaultMockRefinementState,
          initialOptions: mockStyleOptions
        },
        generateInitialStyles: mockGenerateInitialStyles,
        selectStyle: mockSelectStyle,
        refineStyle: mockRefineStyle,
        confirmStyle: mockConfirmStyle,
        isGenerating: false,
        error: null
      });
      
      const { container } = render(
        <StyleGallery
          concept="A book about space exploration"
          autoGenerate={false}
        />
      );
      
      // Check that Grid container exists
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
