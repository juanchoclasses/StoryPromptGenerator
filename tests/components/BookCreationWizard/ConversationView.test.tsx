import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationView } from '../../../src/components/BookCreationWizard/ConversationView';
import type { Message } from '../../../src/types/Wizard';
import type { QuickAction } from '../../../src/components/BookCreationWizard/MessageInput';

describe('ConversationView', () => {
  const mockOnSendMessage = vi.fn();
  const mockOnRetry = vi.fn();
  const mockOnClearConversation = vi.fn();
  
  beforeEach(() => {
    mockOnSendMessage.mockClear();
    mockOnRetry.mockClear();
    mockOnClearConversation.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
  });
  
  const createMessage = (
    id: string,
    role: 'system' | 'user' | 'assistant',
    content: string
  ): Message => ({
    id,
    role,
    content,
    timestamp: new Date('2024-01-01T12:00:00')
  });
  
  describe('Rendering', () => {
    it('should render message list and input', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(
        <ConversationView
          messages={messages}
          onSendMessage={mockOnSendMessage}
        />
      );
      
      expect(screen.getByLabelText('Message list')).toBeInTheDocument();
      expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    });
    
    it('should render messages in the list', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'First message'),
        createMessage('2', 'assistant', 'Second message')
      ];
      
      render(
        <ConversationView
          messages={messages}
          onSendMessage={mockOnSendMessage}
        />
      );
      
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });
    
    it('should use custom placeholder', () => {
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
          placeholder="Enter your response..."
        />
      );
      
      expect(screen.getByPlaceholderText('Enter your response...')).toBeInTheDocument();
    });
    
    it('should render quick actions', () => {
      const quickActions: QuickAction[] = [
        { id: '1', label: 'Yes', value: 'Yes' },
        { id: '2', label: 'No', value: 'No' }
      ];
      
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
          quickActions={quickActions}
        />
      );
      
      expect(screen.getByLabelText('Quick response: Yes')).toBeInTheDocument();
      expect(screen.getByLabelText('Quick response: No')).toBeInTheDocument();
    });
  });
  
  describe('Sending Messages', () => {
    it('should call onSendMessage when user sends a message', async () => {
      const user = userEvent.setup();
      
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test message{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });
    
    it('should call onSendMessage with quick action value', async () => {
      const user = userEvent.setup();
      const quickActions: QuickAction[] = [
        { id: '1', label: 'Yes', value: 'Yes, that works' }
      ];
      
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
          quickActions={quickActions}
        />
      );
      
      const yesButton = screen.getByLabelText('Quick response: Yes');
      await user.click(yesButton);
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('Yes, that works');
    });
  });
  
  describe('Processing State', () => {
    it('should disable input when processing', () => {
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
          isProcessing={true}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toBeDisabled();
    });
    
    it('should show loading indicator when processing', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(
        <ConversationView
          messages={messages}
          onSendMessage={mockOnSendMessage}
          isProcessing={true}
        />
      );
      
      expect(screen.getByLabelText('Processing message')).toBeInTheDocument();
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });
    
    it('should enable input when not processing', () => {
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
          isProcessing={false}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).not.toBeDisabled();
    });
  });
  
  describe('Error Handling', () => {
    it('should display error message', () => {
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
          error="Failed to send message"
        />
      );
      
      expect(screen.getByText('Failed to send message')).toBeInTheDocument();
    });
    
    it('should not display error when error is null', () => {
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
          error={null}
        />
      );
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    
    it('should display retry button when error and onRetry provided', () => {
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
          error="Connection failed"
          onRetry={mockOnRetry}
        />
      );
      
      expect(screen.getByLabelText('Retry')).toBeInTheDocument();
    });
    
    it('should not display retry button when onRetry not provided', () => {
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
          error="Connection failed"
        />
      );
      
      expect(screen.queryByLabelText('Retry')).not.toBeInTheDocument();
    });
    
    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
          error="Connection failed"
          onRetry={mockOnRetry}
        />
      );
      
      const retryButton = screen.getByLabelText('Retry');
      await user.click(retryButton);
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Layout', () => {
    it('should have proper layout structure', () => {
      const { container } = render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );
      
      const conversationContainer = container.querySelector('[role="region"]');
      expect(conversationContainer).toBeInTheDocument();
    });
    
    it('should fill available height', () => {
      const { container } = render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );
      
      const conversationContainer = container.querySelector('[role="region"]');
      expect(conversationContainer).toHaveStyle({ height: '100%' });
    });
  });
  
  describe('Auto-focus', () => {
    it('should auto-focus input when no messages', () => {
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toHaveFocus();
    });
    
    it('should not auto-focus input when messages exist', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(
        <ConversationView
          messages={messages}
          onSendMessage={mockOnSendMessage}
        />
      );
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).not.toHaveFocus();
    });
  });
  
  describe('Integration', () => {
    it('should integrate MessageList and MessageInput correctly', async () => {
      const user = userEvent.setup();
      const messages: Message[] = [
        createMessage('1', 'system', 'Welcome!'),
        createMessage('2', 'user', 'Hello')
      ];
      
      render(
        <ConversationView
          messages={messages}
          onSendMessage={mockOnSendMessage}
        />
      );
      
      // Check messages are displayed
      expect(screen.getByText('Welcome!')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
      
      // Send a new message
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'New message{Enter}');
      
      expect(mockOnSendMessage).toHaveBeenCalledWith('New message');
    });
    
    it('should handle error state while showing messages', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(
        <ConversationView
          messages={messages}
          onSendMessage={mockOnSendMessage}
          error="Network error"
          onRetry={mockOnRetry}
        />
      );
      
      // Both error and messages should be visible
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByLabelText('Retry')).toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA label for conversation container', () => {
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );
      
      expect(screen.getByLabelText('Conversation')).toBeInTheDocument();
    });
    
    it('should have proper role for conversation container', () => {
      render(
        <ConversationView
          messages={[]}
          onSendMessage={mockOnSendMessage}
        />
      );
      
      const container = screen.getByLabelText('Conversation');
      expect(container).toHaveAttribute('role', 'region');
    });
  });
});
