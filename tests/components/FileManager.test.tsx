import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileManager } from '../../src/components/FileManager';
import { BookService } from '../../src/services/BookService';

// Mock BookService
vi.mock('../../src/services/BookService', () => ({
  BookService: {
    getBookCollection: vi.fn(),
    createBook: vi.fn(),
    updateBook: vi.fn(),
    deleteBook: vi.fn(),
    setActiveBook: vi.fn(),
    exportBook: vi.fn(),
    importBook: vi.fn(),
    getBook: vi.fn()
  }
}));

// Mock BookCreationWizard
vi.mock('../../src/components/BookCreationWizard', () => ({
  BookCreationWizard: ({ open, onClose, onComplete }: any) => (
    open ? (
      <div data-testid="book-creation-wizard">
        <button onClick={() => onComplete('test-book-id')}>Complete Wizard</button>
        <button onClick={onClose}>Cancel Wizard</button>
      </div>
    ) : null
  )
}));

// Mock other dependencies
vi.mock('../../src/services/BookExportWithImagesService', () => ({
  BookExportWithImagesService: {
    exportBookWithImages: vi.fn(),
    importBookWithImages: vi.fn(),
    generateExportFilename: vi.fn(),
    downloadBlob: vi.fn()
  }
}));

vi.mock('../../src/components/PanelConfigDialog', () => ({
  PanelConfigDialog: () => null
}));

vi.mock('../../src/components/BookStyleEditor', () => ({
  BookStyleEditor: () => null
}));

vi.mock('../../src/components/SceneLayoutEditor', () => ({
  SceneLayoutEditor: () => null
}));

describe('FileManager - Wizard Integration', () => {
  const mockOnBookSelect = vi.fn();
  const mockOnBookUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (BookService.getBookCollection as any).mockResolvedValue({
      books: [],
      activeBookId: null
    });
  });

  it('should render the wizard button', async () => {
    render(
      <FileManager
        onBookSelect={mockOnBookSelect}
        onBookUpdate={mockOnBookUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('New Book (AI Wizard)')).toBeInTheDocument();
    });
  });

  it('should open wizard when clicking the wizard button', async () => {
    render(
      <FileManager
        onBookSelect={mockOnBookSelect}
        onBookUpdate={mockOnBookUpdate}
      />
    );

    const wizardButton = await screen.findByText('New Book (AI Wizard)');
    fireEvent.click(wizardButton);

    await waitFor(() => {
      expect(screen.getByTestId('book-creation-wizard')).toBeInTheDocument();
    });
  });

  it('should close wizard when cancel is clicked', async () => {
    render(
      <FileManager
        onBookSelect={mockOnBookSelect}
        onBookUpdate={mockOnBookUpdate}
      />
    );

    // Open wizard
    const wizardButton = await screen.findByText('New Book (AI Wizard)');
    fireEvent.click(wizardButton);

    // Wait for wizard to appear
    await waitFor(() => {
      expect(screen.getByTestId('book-creation-wizard')).toBeInTheDocument();
    });

    // Cancel wizard
    const cancelButton = screen.getByText('Cancel Wizard');
    fireEvent.click(cancelButton);

    // Wizard should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('book-creation-wizard')).not.toBeInTheDocument();
    });
  });

  it('should handle wizard completion', async () => {
    (BookService.setActiveBook as any).mockResolvedValue(undefined);
    (BookService.getBookCollection as any).mockResolvedValue({
      books: [{ id: 'test-book-id', title: 'Test Book', storyCount: 0 }],
      activeBookId: 'test-book-id'
    });

    render(
      <FileManager
        onBookSelect={mockOnBookSelect}
        onBookUpdate={mockOnBookUpdate}
      />
    );

    // Open wizard
    const wizardButton = await screen.findByText('New Book (AI Wizard)');
    fireEvent.click(wizardButton);

    // Wait for wizard to appear
    await waitFor(() => {
      expect(screen.getByTestId('book-creation-wizard')).toBeInTheDocument();
    });

    // Complete wizard
    const completeButton = screen.getByText('Complete Wizard');
    fireEvent.click(completeButton);

    // Verify callbacks were called
    await waitFor(() => {
      expect(mockOnBookSelect).toHaveBeenCalledWith('test-book-id');
      expect(mockOnBookUpdate).toHaveBeenCalled();
    });

    // Wizard should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('book-creation-wizard')).not.toBeInTheDocument();
    });
  });

  it('should show manual book creation button', async () => {
    render(
      <FileManager
        onBookSelect={mockOnBookSelect}
        onBookUpdate={mockOnBookUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('New Book (Manual)')).toBeInTheDocument();
    });
  });

  it('should show wizard button in empty state', async () => {
    render(
      <FileManager
        onBookSelect={mockOnBookSelect}
        onBookUpdate={mockOnBookUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create First Book with AI')).toBeInTheDocument();
    });
  });
});
