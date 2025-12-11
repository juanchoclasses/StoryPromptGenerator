import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SummaryView } from '../../../src/components/BookCreationWizard/SummaryView';
import type { WizardBookData } from '../../../src/types/Wizard';
import type { BookStyle } from '../../../src/types/BookStyle';

describe('SummaryView', () => {
  const mockOnEditSection = vi.fn();
  const mockOnCreateBook = vi.fn();
  
  beforeEach(() => {
    mockOnEditSection.mockClear();
    mockOnCreateBook.mockClear();
  });
  
  const createBookStyle = (): BookStyle => ({
    artStyle: 'watercolor',
    colorPalette: 'warm earth tones',
    visualTheme: 'educational',
    characterStyle: 'simplified shapes',
    environmentStyle: 'abstract geometric'
  });
  
  const createMinimalBookData = (): WizardBookData => ({
    title: 'Test Book',
    characters: []
  });
  
  const createCompleteBookData = (): WizardBookData => ({
    concept: 'A book about algorithms',
    title: 'Algorithm Adventures',
    description: 'Learn algorithms through visual storytelling',
    backgroundSetup: 'A world where algorithms come to life',
    aspectRatio: '3:4',
    style: createBookStyle(),
    stylePrompt: 'watercolor illustration, warm earth tones, educational theme',
    characters: [
      {
        name: 'Alice',
        description: 'A curious student learning about algorithms'
      },
      {
        name: 'Bob',
        description: 'A wise teacher who explains concepts clearly'
      }
    ]
  });
  
  describe('Rendering', () => {
    it('should render book summary header', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText('Review Your Book')).toBeInTheDocument();
      expect(screen.getByText(/Review your book configuration below/)).toBeInTheDocument();
    });
    
    it('should render book details section', () => {
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText('Book Details')).toBeInTheDocument();
      expect(screen.getByText('Algorithm Adventures')).toBeInTheDocument();
      expect(screen.getByText('Learn algorithms through visual storytelling')).toBeInTheDocument();
      expect(screen.getByText('A world where algorithms come to life')).toBeInTheDocument();
    });
    
    it('should render visual style section when style exists', () => {
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText('Visual Style')).toBeInTheDocument();
      expect(screen.getByText(/watercolor illustration/)).toBeInTheDocument();
    });
    
    it('should not render visual style section when style is missing', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.queryByText('Visual Style')).not.toBeInTheDocument();
    });
    
    it('should render characters section when characters exist', () => {
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText('Characters (2)')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('A curious student learning about algorithms')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('A wise teacher who explains concepts clearly')).toBeInTheDocument();
    });
    
    it('should not render characters section when no characters', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.queryByText(/Characters/)).not.toBeInTheDocument();
    });
    
    it('should render aspect ratio when provided', () => {
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText('3:4')).toBeInTheDocument();
    });
    
    it('should render style properties as chips', () => {
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText('Art: watercolor')).toBeInTheDocument();
      expect(screen.getByText('Colors: warm earth tones')).toBeInTheDocument();
      expect(screen.getByText('Theme: educational')).toBeInTheDocument();
    });
    
    it('should render untitled book when title is missing', () => {
      const bookData: WizardBookData = {
        characters: []
      };
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText('Untitled Book')).toBeInTheDocument();
    });
  });
  
  describe('Edit Buttons', () => {
    it('should render edit button for book details', () => {
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const editButtons = screen.getAllByLabelText(/Edit/);
      expect(editButtons.length).toBeGreaterThan(0);
    });
    
    it('should call onEditSection with concept step when editing book details', async () => {
      const user = userEvent.setup();
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const editButton = screen.getByLabelText('Edit book details');
      await user.click(editButton);
      
      expect(mockOnEditSection).toHaveBeenCalledWith('concept');
    });
    
    it('should call onEditSection with style step when editing visual style', async () => {
      const user = userEvent.setup();
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const editButton = screen.getByLabelText('Edit visual style');
      await user.click(editButton);
      
      expect(mockOnEditSection).toHaveBeenCalledWith('style');
    });
    
    it('should call onEditSection with characters step when editing characters', async () => {
      const user = userEvent.setup();
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const editButton = screen.getByLabelText('Edit characters');
      await user.click(editButton);
      
      expect(mockOnEditSection).toHaveBeenCalledWith('characters');
    });
    
    it('should not render edit buttons when onEditSection not provided', () => {
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.queryByLabelText(/Edit/)).not.toBeInTheDocument();
    });
  });
  
  describe('Create Book Button', () => {
    it('should render create book button', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByLabelText('Create book')).toBeInTheDocument();
    });
    
    it('should call onCreateBook when button clicked', async () => {
      const user = userEvent.setup();
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const createButton = screen.getByLabelText('Create book');
      await user.click(createButton);
      
      expect(mockOnCreateBook).toHaveBeenCalledTimes(1);
    });
    
    it('should disable create button when creating', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          isCreating={true}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const createButton = screen.getByLabelText('Creating book...');
      expect(createButton).toBeDisabled();
    });
    
    it('should disable create button when no title', () => {
      const bookData: WizardBookData = {
        characters: []
      };
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const createButton = screen.getByLabelText('Create book');
      expect(createButton).toBeDisabled();
    });
    
    it('should show loading text when creating', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          isCreating={true}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText('Creating Book...')).toBeInTheDocument();
    });
  });
  
  describe('Loading State', () => {
    it('should show loading indicator when creating', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          isCreating={true}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      // CircularProgress should be present
      const button = screen.getByLabelText('Creating book...');
      expect(button).toBeInTheDocument();
    });
    
    it('should not show loading indicator when not creating', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          isCreating={false}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText('Create Book')).toBeInTheDocument();
    });
  });
  
  describe('Error Handling', () => {
    it('should display error message when error exists', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          error="Failed to create book: Network error"
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText('Failed to Create Book')).toBeInTheDocument();
      expect(screen.getByText('Failed to create book: Network error')).toBeInTheDocument();
    });
    
    it('should not display error when error is null', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          error={null}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.queryByText('Failed to Create Book')).not.toBeInTheDocument();
    });
    
    it('should display error as alert', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          error="Something went wrong"
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });
  
  describe('Storage Size Indicator', () => {
    it('should display estimated storage size when provided', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          estimatedSize={1024 * 1024 * 2.5} // 2.5 MB
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText(/Estimated storage size:/)).toBeInTheDocument();
      expect(screen.getByText(/2.5 MB/)).toBeInTheDocument();
    });
    
    it('should format bytes correctly', () => {
      const bookData = createMinimalBookData();
      
      const { rerender } = render(
        <SummaryView
          bookData={bookData}
          estimatedSize={500} // 500 B
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText(/500 B/)).toBeInTheDocument();
      
      rerender(
        <SummaryView
          bookData={bookData}
          estimatedSize={1024 * 50} // 50 KB
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByText(/50.0 KB/)).toBeInTheDocument();
    });
    
    it('should not display storage size when not provided', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.queryByText(/Estimated storage size:/)).not.toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA label for summary container', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByLabelText('Book summary')).toBeInTheDocument();
    });
    
    it('should have proper role for summary container', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const container = screen.getByLabelText('Book summary');
      expect(container).toHaveAttribute('role', 'region');
    });
    
    it('should have proper heading hierarchy', () => {
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const h1 = screen.getByRole('heading', { level: 1, name: 'Review Your Book' });
      expect(h1).toBeInTheDocument();
      
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);
    });
    
    it('should have accessible edit buttons', () => {
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      expect(screen.getByLabelText('Edit book details')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit visual style')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit characters')).toBeInTheDocument();
    });
    
    it('should have accessible create button', () => {
      const bookData = createMinimalBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const createButton = screen.getByLabelText('Create book');
      expect(createButton).toBeInTheDocument();
    });
  });
  
  describe('Responsive Layout', () => {
    it('should have proper layout structure', () => {
      const bookData = createCompleteBookData();
      
      const { container } = render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const summaryContainer = container.querySelector('[role="region"]');
      expect(summaryContainer).toBeInTheDocument();
    });
    
    it('should render all sections in order', () => {
      const bookData = createCompleteBookData();
      
      render(
        <SummaryView
          bookData={bookData}
          onEditSection={mockOnEditSection}
          onCreateBook={mockOnCreateBook}
        />
      );
      
      const sections = [
        screen.getByText('Book Details'),
        screen.getByText('Visual Style'),
        screen.getByText(/Characters/)
      ];
      
      sections.forEach(section => {
        expect(section).toBeInTheDocument();
      });
    });
  });
});
