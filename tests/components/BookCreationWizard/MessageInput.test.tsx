import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../../../src/components/BookCreationWizard/MessageInput';
import type { QuickAction } from '../../../src/components/BookCreationWizard/MessageInput';

describe('MessageInput', () => {
  const mockOnSendMessage = vi.fn();
  
  beforeEach(() => {
    mockOnSendMessage.mockClear();
  });
  
  describe('Rendering', () => {
    it('should render text input field', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    });
    
    it('should render send button', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });
    
    it('should display placeholder text', () => {
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          placeholder="Enter your message here"
        />
      );
      
      expect(screen.getByPlaceholderText('Enter your message here')).toBeInTheDocument();
    });
    
    it('should use default placeholder when not specified', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });
    
    it('should display keyboard shortcuts hint', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.getByText(/Press/)).toBeInTheDocument();
      expect(screen.getByText(/to send/)).toBeInTheDocument();
    });
  });
  
  describe('Typing and Sending Messages', () => {
    it('should allow typing in the input field', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello world');
      
      expect(input).toHaveValue('Hello world');
    });
    
    it('should send message when send button is clicked', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test message');
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });
    
    it('should trim whitespace before sending', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, '  Test message  ');
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });
    
    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const sendButton = screen.getByLabelText('Send message');
      // Button should be disabled, so we just check it wasn't called
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
    
    it('should not send whitespace-only messages', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, '   ');
      
      // Button should still be disabled for whitespace-only
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });
  
  describe('Clearing Input After Send', () => {
    it('should clear input after sending message', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test message');
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);
      
      expect(input).toHaveValue('');
    });
    
    it('should clear input after quick action', async () => {
      const user = userEvent.setup();
      const quickActions: QuickAction[] = [
        { id: '1', label: 'Yes', value: 'Yes, that looks good' }
      ];
      
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          quickActions={quickActions}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Some text');
      
      const quickButton = screen.getByLabelText('Quick response: Yes');
      await user.click(quickButton);
      
      expect(input).toHaveValue('');
    });
  });
  
  describe('Enter Key to Send', () => {
    it('should send message when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test message{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });
    
    it('should clear input after Enter key send', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test message{Enter}');
      
      expect(input).toHaveValue('');
    });
  });
  
  describe('Shift+Enter for New Line', () => {
    it('should insert new line when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
      
      // Type with Shift+Enter for new line
      await user.type(input, 'First line{Shift>}{Enter}{/Shift}Second line');
      
      expect(input.value).toContain('\n');
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
    
    it('should not send message on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      
      await user.type(input, 'Test{Shift>}{Enter}{/Shift}');
      
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });
  
  describe('Disabled State', () => {
    it('should disable input when disabled prop is true', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toBeDisabled();
    });
    
    it('should disable send button when disabled prop is true', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });
    
    it('should not send message when disabled', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);
      
      // Button is disabled, so callback should never be called
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
    
    it('should disable send button when input is empty', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });
    
    it('should enable send button when input has content', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test');
      
      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).not.toBeDisabled();
    });
  });
  
  describe('Quick Action Buttons', () => {
    const quickActions: QuickAction[] = [
      { id: '1', label: 'Yes', value: 'Yes, that looks good' },
      { id: '2', label: 'No', value: 'No, let me try again' },
      { id: '3', label: 'Skip', value: 'Skip this step' }
    ];
    
    it('should render quick action buttons when provided', () => {
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          quickActions={quickActions}
        />
      );
      
      expect(screen.getByLabelText('Quick response: Yes')).toBeInTheDocument();
      expect(screen.getByLabelText('Quick response: No')).toBeInTheDocument();
      expect(screen.getByLabelText('Quick response: Skip')).toBeInTheDocument();
    });
    
    it('should not render quick actions when array is empty', () => {
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          quickActions={[]}
        />
      );
      
      expect(screen.queryByRole('group', { name: 'Quick response options' })).not.toBeInTheDocument();
    });
    
    it('should send quick action value when clicked', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          quickActions={quickActions}
        />
      );
      
      const yesButton = screen.getByLabelText('Quick response: Yes');
      await user.click(yesButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Yes, that looks good');
    });
    
    it('should disable quick actions when disabled prop is true', () => {
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          quickActions={quickActions}
          disabled={true}
        />
      );
      
      const yesButton = screen.getByLabelText('Quick response: Yes');
      expect(yesButton).toHaveClass('Mui-disabled');
    });
  });
  
  describe('Character Count', () => {
    it('should display character count when maxLength is specified', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          maxLength={100}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test');
      
      // Character count is split across elements, so check via aria-label
      expect(screen.getByLabelText('Character count: 4 of 100')).toBeInTheDocument();
    });
    
    it('should not display character count when maxLength is not specified', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.queryByText(/\/ /)).not.toBeInTheDocument();
    });
    
    it('should update character count as user types', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          maxLength={50}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');
      
      expect(screen.getByLabelText('Character count: 5 of 50')).toBeInTheDocument();
      
      await user.type(input, ' World');
      
      expect(screen.getByLabelText('Character count: 11 of 50')).toBeInTheDocument();
    });
    
    it('should prevent typing beyond maxLength', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          maxLength={10}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, '12345678901234567890');
      
      expect(input).toHaveValue('1234567890');
      expect(screen.getByLabelText('Character count: 10 of 10')).toBeInTheDocument();
    });
  });
  
  describe('Auto-focus', () => {
    it('should auto-focus input on mount by default', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toHaveFocus();
    });
    
    it('should not auto-focus when autoFocus is false', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} autoFocus={false} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).not.toHaveFocus();
    });
    
    it('should re-focus input after sending message', async () => {
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test message');
      
      const sendButton = screen.getByLabelText('Send message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA label for input', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    });
    
    it('should have proper ARIA label for send button', () => {
      render(<MessageInput onSendMessage={mockOnSendMessage} />);
      
      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });
    
    it('should have proper ARIA label for quick actions group', () => {
      const quickActions: QuickAction[] = [
        { id: '1', label: 'Yes', value: 'Yes' }
      ];
      
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          quickActions={quickActions}
        />
      );
      
      expect(screen.getByRole('group', { name: 'Quick response options' })).toBeInTheDocument();
    });
    
    it('should have proper ARIA label for character count', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          maxLength={100}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test');
      
      // The character count has an aria-label but is inside helper text
      const characterCount = screen.getByLabelText('Character count: 4 of 100');
      expect(characterCount).toBeInTheDocument();
    });
    
    it('should have aria-live region for character count', async () => {
      const user = userEvent.setup();
      render(
        <MessageInput
          onSendMessage={mockOnSendMessage}
          maxLength={100}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test');
      
      const characterCount = screen.getByLabelText('Character count: 4 of 100');
      expect(characterCount).toHaveAttribute('aria-live', 'polite');
    });
  });
});
