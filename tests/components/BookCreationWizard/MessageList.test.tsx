import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MessageList } from '../../../src/components/BookCreationWizard/MessageList';
import type { Message } from '../../../src/types/Wizard';

describe('MessageList', () => {
  // Mock scrollIntoView
  beforeEach(() => {
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
  
  describe('Rendering Messages', () => {
    it('should render system messages', () => {
      const messages: Message[] = [
        createMessage('1', 'system', 'Welcome to the wizard!')
      ];
      
      render(<MessageList messages={messages} />);
      
      expect(screen.getByText('Welcome to the wizard!')).toBeInTheDocument();
    });
    
    it('should render user messages', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'I want to create a book')
      ];
      
      render(<MessageList messages={messages} />);
      
      expect(screen.getByText('I want to create a book')).toBeInTheDocument();
    });
    
    it('should render assistant messages', () => {
      const messages: Message[] = [
        createMessage('1', 'assistant', 'Great! Let me help you with that.')
      ];
      
      render(<MessageList messages={messages} />);
      
      expect(screen.getByText('Great! Let me help you with that.')).toBeInTheDocument();
    });
    
    it('should render multiple messages in order', () => {
      const messages: Message[] = [
        createMessage('1', 'system', 'Welcome!'),
        createMessage('2', 'user', 'Hello'),
        createMessage('3', 'assistant', 'Hi there!')
      ];
      
      render(<MessageList messages={messages} />);
      
      expect(screen.getByText('Welcome!')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
    
    it('should render different message types correctly', () => {
      const messages: Message[] = [
        createMessage('1', 'system', 'System message'),
        createMessage('2', 'user', 'User message'),
        createMessage('3', 'assistant', 'Assistant message')
      ];
      
      render(<MessageList messages={messages} />);
      
      // Check that all message types are rendered
      expect(screen.getByLabelText('System message')).toBeInTheDocument();
      expect(screen.getByLabelText('User message')).toBeInTheDocument();
      expect(screen.getByLabelText('Assistant message')).toBeInTheDocument();
    });
  });
  
  describe('Empty State', () => {
    it('should display empty state when no messages', () => {
      render(<MessageList messages={[]} />);
      
      expect(screen.getByText('No messages yet. Start the conversation!')).toBeInTheDocument();
    });
    
    it('should not display empty state when messages exist', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(<MessageList messages={messages} />);
      
      expect(screen.queryByText('No messages yet. Start the conversation!')).not.toBeInTheDocument();
    });
    
    it('should not display empty state when processing', () => {
      render(<MessageList messages={[]} isProcessing={true} />);
      
      expect(screen.queryByText('No messages yet. Start the conversation!')).not.toBeInTheDocument();
    });
  });
  
  describe('Loading Indicator', () => {
    it('should display loading indicator when processing', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(<MessageList messages={messages} isProcessing={true} />);
      
      expect(screen.getByLabelText('Processing message')).toBeInTheDocument();
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });
    
    it('should not display loading indicator when not processing', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(<MessageList messages={messages} isProcessing={false} />);
      
      expect(screen.queryByLabelText('Processing message')).not.toBeInTheDocument();
      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
    });
    
    it('should display loading indicator with empty messages', () => {
      render(<MessageList messages={[]} isProcessing={true} />);
      
      expect(screen.getByLabelText('Processing message')).toBeInTheDocument();
    });
  });
  
  describe('Auto-scroll', () => {
    it('should have scrollable container', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Message 1'),
        createMessage('2', 'user', 'Message 2'),
        createMessage('3', 'user', 'Message 3')
      ];
      
      const { container } = render(<MessageList messages={messages} />);
      
      const scrollContainer = container.querySelector('[role="log"]');
      expect(scrollContainer).toBeInTheDocument();
    });
    
    it('should call scrollIntoView when new messages are added', async () => {
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
      
      const messages: Message[] = [
        createMessage('1', 'user', 'Message 1')
      ];
      
      const { rerender } = render(<MessageList messages={messages} />);
      
      // Add a new message
      const updatedMessages: Message[] = [
        ...messages,
        createMessage('2', 'user', 'Message 2')
      ];
      
      rerender(<MessageList messages={updatedMessages} />);
      
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });
    
    it('should not auto-scroll when autoScroll is false', async () => {
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
      
      const messages: Message[] = [
        createMessage('1', 'user', 'Message 1')
      ];
      
      const { rerender } = render(<MessageList messages={messages} autoScroll={false} />);
      
      // Add a new message
      const updatedMessages: Message[] = [
        ...messages,
        createMessage('2', 'user', 'Message 2')
      ];
      
      rerender(<MessageList messages={updatedMessages} autoScroll={false} />);
      
      // Wait a bit to ensure it doesn't scroll
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });
    
    it('should scroll when processing state changes', async () => {
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
      
      const messages: Message[] = [
        createMessage('1', 'user', 'Message 1')
      ];
      
      const { rerender } = render(<MessageList messages={messages} isProcessing={false} />);
      
      // Change processing state
      rerender(<MessageList messages={messages} isProcessing={true} />);
      
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA role for message list', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(<MessageList messages={messages} />);
      
      expect(screen.getByRole('log')).toBeInTheDocument();
    });
    
    it('should have proper ARIA label for message list', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(<MessageList messages={messages} />);
      
      expect(screen.getByLabelText('Message list')).toBeInTheDocument();
    });
    
    it('should have aria-live attribute', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(<MessageList messages={messages} />);
      
      const messageList = screen.getByRole('log');
      expect(messageList).toHaveAttribute('aria-live', 'polite');
    });
    
    it('should have proper ARIA label for loading indicator', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(<MessageList messages={messages} isProcessing={true} />);
      
      expect(screen.getByLabelText('Processing message')).toBeInTheDocument();
    });
    
    it('should have proper role for loading indicator', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello')
      ];
      
      render(<MessageList messages={messages} isProcessing={true} />);
      
      const loadingIndicator = screen.getByLabelText('Processing message');
      expect(loadingIndicator).toHaveAttribute('role', 'status');
    });
  });
  
  describe('Message Updates', () => {
    it('should update when messages change', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'First message')
      ];
      
      const { rerender } = render(<MessageList messages={messages} />);
      
      expect(screen.getByText('First message')).toBeInTheDocument();
      
      const updatedMessages: Message[] = [
        createMessage('1', 'user', 'First message'),
        createMessage('2', 'assistant', 'Second message')
      ];
      
      rerender(<MessageList messages={updatedMessages} />);
      
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });
    
    it('should handle message removal', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Message 1'),
        createMessage('2', 'user', 'Message 2')
      ];
      
      const { rerender } = render(<MessageList messages={messages} />);
      
      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();
      
      const updatedMessages: Message[] = [
        createMessage('1', 'user', 'Message 1')
      ];
      
      rerender(<MessageList messages={updatedMessages} />);
      
      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.queryByText('Message 2')).not.toBeInTheDocument();
    });
  });
});
