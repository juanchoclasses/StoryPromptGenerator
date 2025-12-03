import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneDiagramPanel } from '../../src/components/SceneDiagramPanel';
import type { Scene, Story } from '../../src/types/Story';

/**
 * Feature: scene-editor-phase2, Property 1: SceneDiagramPanel component correctness
 * 
 * Tests validate Requirements 1.1, 1.2, 1.3, 1.4, 1.5:
 * - Component handles all diagram editing UI and logic
 * - UI updates correctly when diagram type changes
 * - Auto-save callback is invoked on content changes
 * - Preview callback is invoked when preview button is clicked
 * - Alert is displayed when story has no diagram style configured
 */

// Helper to open the MUI Select dropdown by finding the combobox with the label
const openSelect = async (user: ReturnType<typeof userEvent.setup>, labelText: string) => {
  // Find all labels with the text (MUI renders it in multiple places)
  const labels = screen.getAllByText(labelText);
  // Find the actual label element (not the legend span)
  const label = labels.find(el => el.tagName === 'LABEL');
  const formControl = label?.closest('.MuiFormControl-root');
  const select = formControl?.querySelector('[role="combobox"]') as HTMLElement;
  if (select) {
    await user.click(select);
  }
};

describe('SceneDiagramPanel', () => {
  // Test data
  const mockScene: Scene = {
    id: 'scene-1',
    title: 'Test Scene',
    description: 'A test scene description',
    characters: [],
    elements: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockStoryWithDiagramStyle: Story = {
    id: 'story-1',
    title: 'Test Story',
    backgroundSetup: 'Test background',
    scenes: [mockScene],
    characters: [],
    elements: [],
    diagramStyle: {
      boardType: 'blackboard',
      position: 'center',
      colors: {
        background: '#000000',
        text: '#ffffff',
        accent: '#00ff00'
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockStoryWithoutDiagramStyle: Story = {
    ...mockStoryWithDiagramStyle,
    diagramStyle: undefined
  };

  let mockOnDiagramChange: ReturnType<typeof vi.fn>;
  let mockOnPreview: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnDiagramChange = vi.fn().mockResolvedValue(undefined);
    mockOnPreview = vi.fn();
  });

  describe('Rendering', () => {
    it('should render with correct title', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText(/Diagram Panel/i)).toBeInTheDocument();
    });

    it('should render diagram type selector', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getAllByText('Diagram Type').length).toBeGreaterThan(0);
    });

    it('should render diagram content text field', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByLabelText(/Mermaid Content/i)).toBeInTheDocument();
    });

    it('should render preview button', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByRole('button', { name: /Preview Diagram/i })).toBeInTheDocument();
    });

    it('should render caption text', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText(/Add a diagram, code block, math equation/i)).toBeInTheDocument();
    });
  });

  describe('Diagram Type Selection', () => {
    it('should display all diagram type options', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      await openSelect(user, 'Diagram Type');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: /Mermaid Diagram/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Math Equation/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Code Block/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Markdown Text/i })).toBeInTheDocument();
    });

    it('should call onDiagramChange when diagram type is changed', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent="test content"
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      await openSelect(user, 'Diagram Type');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const mathOption = screen.getByRole('option', { name: /Math Equation/i });
      await user.click(mathOption);

      expect(mockOnDiagramChange).toHaveBeenCalledWith('test content', 'math', 'javascript');
    });

    it('should show language selector when diagram type is code', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="code"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getAllByText('Programming Language').length).toBeGreaterThan(0);
    });

    it('should not show language selector when diagram type is mermaid', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.queryByText('Programming Language')).not.toBeInTheDocument();
    });

    it('should not show language selector when diagram type is math', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="math"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.queryByText('Programming Language')).not.toBeInTheDocument();
    });

    it('should not show language selector when diagram type is markdown', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="markdown"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.queryByText('Programming Language')).not.toBeInTheDocument();
    });
  });

  describe('Language Selection', () => {
    it('should display all programming language options', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="code"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      await openSelect(user, 'Programming Language');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      expect(screen.getByRole('option', { name: /JavaScript/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Python/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /^Java$/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /TypeScript/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /C\+\+/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /C#/i })).toBeInTheDocument();
    });

    it('should call onDiagramChange when language is changed', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="code"
          diagramContent="console.log('test')"
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      await openSelect(user, 'Programming Language');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const pythonOption = screen.getByRole('option', { name: /Python/i });
      await user.click(pythonOption);

      expect(mockOnDiagramChange).toHaveBeenCalledWith("console.log('test')", 'code', 'python');
    });
  });

  describe('Content Editing', () => {
    it('should call onDiagramChange when content is typed', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByLabelText(/Mermaid Content/i);
      await user.type(textField, 'graph TD');

      expect(mockOnDiagramChange).toHaveBeenCalled();
    });

    it('should display current diagram content', () => {
      const content = 'graph TD\n  A --> B';
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent={content}
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByLabelText(/Mermaid Content/i) as HTMLTextAreaElement;
      expect(textField.value).toBe(content);
    });

    it('should update label based on diagram type', () => {
      const { rerender } = render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByLabelText(/Mermaid Content/i)).toBeInTheDocument();

      rerender(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="math"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByLabelText(/Math Content/i)).toBeInTheDocument();
    });
  });

  describe('Placeholder Text', () => {
    it('should show mermaid placeholder for mermaid type', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByLabelText(/Mermaid Content/i);
      expect(textField).toHaveAttribute('placeholder', expect.stringContaining('graph TD'));
    });

    it('should show math placeholder for math type', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="math"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByLabelText(/Math Content/i);
      expect(textField).toHaveAttribute('placeholder', expect.stringContaining('frac'));
    });

    it('should show code placeholder for code type', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="code"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByLabelText(/Code Content/i);
      expect(textField).toHaveAttribute('placeholder', expect.stringContaining('function factorial'));
    });

    it('should show markdown placeholder for markdown type', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="markdown"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByLabelText(/Markdown Content/i);
      expect(textField).toHaveAttribute('placeholder', expect.stringContaining('# Title'));
    });
  });

  describe('Preview Button', () => {
    it('should call onPreview when preview button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent="graph TD"
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const previewButton = screen.getByRole('button', { name: /Preview Diagram/i });
      await user.click(previewButton);

      expect(mockOnPreview).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration Alert', () => {
    it('should display alert when story has no diagram style', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithoutDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText(/Diagram style.*needs to be configured/i)).toBeInTheDocument();
    });

    it('should not display alert when story has diagram style', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.queryByText(/Diagram style.*needs to be configured/i)).not.toBeInTheDocument();
    });

    it('should display info severity alert', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithoutDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('MuiAlert-standardInfo');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty diagram content', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByLabelText(/Mermaid Content/i) as HTMLTextAreaElement;
      expect(textField.value).toBe('');
    });

    it('should handle multiline diagram content', () => {
      const multilineContent = 'graph TD\n  A[Start] --> B[Process]\n  B --> C[End]';
      
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent={multilineContent}
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByLabelText(/Mermaid Content/i) as HTMLTextAreaElement;
      expect(textField.value).toBe(multilineContent);
    });

    it('should handle special characters in content', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="math"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByLabelText(/Math Content/i);
      await user.type(textField, '\\alpha + \\beta = \\gamma');

      expect(mockOnDiagramChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for all form controls', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="code"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getAllByText('Diagram Type').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Programming Language').length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/Code Content/i)).toBeInTheDocument();
    });

    it('should have accessible button', () => {
      render(
        <SceneDiagramPanel
          scene={mockScene}
          story={mockStoryWithDiagramStyle}
          diagramType="mermaid"
          diagramContent=""
          diagramLanguage="javascript"
          onDiagramChange={mockOnDiagramChange}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByRole('button', { name: /Preview Diagram/i })).toBeInTheDocument();
    });
  });
});
