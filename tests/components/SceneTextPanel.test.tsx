import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SceneTextPanel } from '../../src/components/SceneTextPanel';
import { createRef } from 'react';

/**
 * Feature: scene-editor-phase2, Property 2: SceneTextPanel component correctness
 * 
 * Tests validate Requirements 2.1, 2.2, 2.3, 2.4, 2.5:
 * - Component handles text panel editing UI
 * - onChange callback is invoked when text changes
 * - onInsertMacro callback is invoked when macro button is clicked
 * - onPreview callback is invoked when preview button is clicked
 * - Textarea ref is properly maintained for cursor positioning
 */

describe('SceneTextPanel', () => {
  let mockOnTextPanelChange: ReturnType<typeof vi.fn>;
  let mockOnInsertMacro: ReturnType<typeof vi.fn>;
  let mockOnPreview: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnTextPanelChange = vi.fn();
    mockOnInsertMacro = vi.fn();
    mockOnPreview = vi.fn();
  });

  describe('Rendering', () => {
    it('should render with correct title', () => {
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Text Panel (for image overlay)')).toBeInTheDocument();
    });

    it('should render text field', () => {
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i);
      expect(textField).toBeInTheDocument();
    });

    it('should render macro button', () => {
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByRole('button', { name: /Insert Scene Description macro/i })).toBeInTheDocument();
    });

    it('should render preview button', () => {
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByRole('button', { name: /Preview Text Panel/i })).toBeInTheDocument();
    });

    it('should render caption text', () => {
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText(/Text to display on the generated image/i)).toBeInTheDocument();
    });
  });

  describe('Text Content Display', () => {
    it('should display current text content', () => {
      const content = 'This is test text content';
      render(
        <SceneTextPanel
          textPanelContent={content}
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i) as HTMLTextAreaElement;
      expect(textField.value).toBe(content);
    });

    it('should display empty string when content is empty', () => {
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i) as HTMLTextAreaElement;
      expect(textField.value).toBe('');
    });

    it('should display multiline text content', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      render(
        <SceneTextPanel
          textPanelContent={multilineContent}
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i) as HTMLTextAreaElement;
      expect(textField.value).toBe(multilineContent);
    });
  });

  describe('Text Change Handling', () => {
    it('should call onTextPanelChange when text is typed', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i);
      await user.type(textField, 'Hello');

      expect(mockOnTextPanelChange).toHaveBeenCalled();
    });

    it('should call onTextPanelChange with correct value', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i);
      await user.type(textField, 'A');

      // Should be called once with the character
      expect(mockOnTextPanelChange).toHaveBeenCalledTimes(1);
      expect(mockOnTextPanelChange).toHaveBeenCalledWith('A');
    });

    it('should handle text deletion', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneTextPanel
          textPanelContent="Hello"
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i);
      await user.clear(textField);

      expect(mockOnTextPanelChange).toHaveBeenCalledWith('');
    });
  });

  describe('Macro Insertion', () => {
    it('should call onInsertMacro when macro button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const macroButton = screen.getByRole('button', { name: /Insert Scene Description macro/i });
      await user.click(macroButton);

      expect(mockOnInsertMacro).toHaveBeenCalledTimes(1);
    });

    it('should call onInsertMacro with correct macro string', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const macroButton = screen.getByRole('button', { name: /Insert Scene Description macro/i });
      await user.click(macroButton);

      expect(mockOnInsertMacro).toHaveBeenCalledWith('{SceneDescription}');
    });

    it('should allow multiple macro insertions', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const macroButton = screen.getByRole('button', { name: /Insert Scene Description macro/i });
      await user.click(macroButton);
      await user.click(macroButton);
      await user.click(macroButton);

      expect(mockOnInsertMacro).toHaveBeenCalledTimes(3);
    });
  });

  describe('Preview Button', () => {
    it('should call onPreview when preview button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneTextPanel
          textPanelContent="Test content"
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const previewButton = screen.getByRole('button', { name: /Preview Text Panel/i });
      await user.click(previewButton);

      expect(mockOnPreview).toHaveBeenCalledTimes(1);
    });

    it('should allow preview with empty content', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const previewButton = screen.getByRole('button', { name: /Preview Text Panel/i });
      await user.click(previewButton);

      expect(mockOnPreview).toHaveBeenCalledTimes(1);
    });
  });

  describe('Textarea Ref', () => {
    it('should attach ref to textarea when provided', () => {
      const textPanelFieldRef = createRef<HTMLTextAreaElement>();
      
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
          textPanelFieldRef={textPanelFieldRef}
        />
      );

      expect(textPanelFieldRef.current).not.toBeNull();
      expect(textPanelFieldRef.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('should work without ref provided', () => {
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i);
      expect(textField).toBeInTheDocument();
    });

    it('should allow ref to access textarea value', () => {
      const textPanelFieldRef = createRef<HTMLTextAreaElement>();
      const content = 'Test content for ref';
      
      render(
        <SceneTextPanel
          textPanelContent={content}
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
          textPanelFieldRef={textPanelFieldRef}
        />
      );

      expect(textPanelFieldRef.current?.value).toBe(content);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in text', async () => {
      const user = userEvent.setup();
      
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i);
      await user.type(textField, '!@#$%^&*()');

      expect(mockOnTextPanelChange).toHaveBeenCalled();
    });

    it('should handle very long text content', () => {
      const longContent = 'A'.repeat(1000);
      
      render(
        <SceneTextPanel
          textPanelContent={longContent}
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i) as HTMLTextAreaElement;
      expect(textField.value).toBe(longContent);
    });

    it('should handle text with macros already present', () => {
      const contentWithMacro = 'Scene: {SceneDescription}';
      
      render(
        <SceneTextPanel
          textPanelContent={contentWithMacro}
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i) as HTMLTextAreaElement;
      expect(textField.value).toBe(contentWithMacro);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible text field', () => {
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const textField = screen.getByPlaceholderText(/Enter text for image overlay/i);
      expect(textField).toHaveAttribute('aria-invalid', 'false');
    });

    it('should have accessible buttons', () => {
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByRole('button', { name: /Insert Scene Description macro/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Preview Text Panel/i })).toBeInTheDocument();
    });

    it('should have aria-label on macro button', () => {
      render(
        <SceneTextPanel
          textPanelContent=""
          onTextPanelChange={mockOnTextPanelChange}
          onInsertMacro={mockOnInsertMacro}
          onPreview={mockOnPreview}
        />
      );

      const macroButton = screen.getByRole('button', { name: /Insert Scene Description macro/i });
      expect(macroButton).toHaveAttribute('aria-label', 'Insert Scene Description macro');
    });
  });
});
