import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssistantMessage } from '../../../src/components/BookCreationWizard/AssistantMessage';
import type { Message } from '../../../src/types/Wizard';

describe('AssistantMessage', () => {
  const createAssistantMessage = (content: string, timestamp?: Date): Message => ({
    id: '1',
    role: 'assistant',
    content,
    timestamp: timestamp || new Date('2024-01-01T14:30:00')
  });
  
  describe('Rendering', () => {
    it('should render the message content', () => {
      const message = createAssistantMessage('I can help you create a book!');
      
      render(<AssistantMessage message={message} />);
      
      expect(screen.getByText('I can help you create a book!')).toBeInTheDocument();
    });
    
    it('should display AI avatar', () => {
      const message = createAssistantMessage('Test message');
      
      render(<AssistantMessage message={message} />);
      
      expect(screen.getByLabelText('AI assistant avatar')).toBeInTheDocument();
    });
    
    it('should display timestamp', () => {
      const message = createAssistantMessage('Message with time', new Date('2024-01-01T14:30:00'));
      
      render(<AssistantMessage message={message} />);
      
      expect(screen.getByText(/2:30 PM/i)).toBeInTheDocument();
    });
    
    it('should render multi-line content', () => {
      const message = createAssistantMessage('First line\nSecond line\nThird line');
      
      render(<AssistantMessage message={message} />);
      
      // Check that all lines are present
      expect(screen.getByText(/First line/)).toBeInTheDocument();
      expect(screen.getByText(/Second line/)).toBeInTheDocument();
      expect(screen.getByText(/Third line/)).toBeInTheDocument();
    });
    
    it('should not render when no message and not loading', () => {
      const { container } = render(<AssistantMessage />);
      
      expect(container.firstChild).toBeNull();
    });
  });
  
  describe('Loading State', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<AssistantMessage isLoading={true} />);
      
      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });
    
    it('should show circular progress when loading', () => {
      render(<AssistantMessage isLoading={true} />);
      
      const progress = document.querySelector('.MuiCircularProgress-root');
      expect(progress).toBeInTheDocument();
    });
    
    it('should have proper ARIA label when loading', () => {
      render(<AssistantMessage isLoading={true} />);
      
      expect(screen.getByLabelText('Assistant is typing')).toBeInTheDocument();
    });
    
    it('should have aria-live region when loading', () => {
      render(<AssistantMessage isLoading={true} />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
    
    it('should show message content when both message and isLoading are provided', () => {
      const message = createAssistantMessage('Actual message');
      
      render(<AssistantMessage message={message} isLoading={true} />);
      
      // Should show the message, not the loading state
      expect(screen.getByText('Actual message')).toBeInTheDocument();
      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument();
    });
  });
  
  describe('Layout', () => {
    it('should be left-aligned', () => {
      const message = createAssistantMessage('Left-aligned message');
      
      const { container } = render(<AssistantMessage message={message} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ display: 'flex', justifyContent: 'flex-start' });
    });
    
    it('should have message bubble styling', () => {
      const message = createAssistantMessage('Styled message');
      
      render(<AssistantMessage message={message} />);
      
      const paper = screen.getByText('Styled message').closest('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });
  
  describe('Rich Content Support', () => {
    it('should render content with inline code', () => {
      const message = createAssistantMessage('Use the `createBook()` function');
      
      render(<AssistantMessage message={message} />);
      
      expect(screen.getByText(/Use the/)).toBeInTheDocument();
      expect(screen.getByText(/createBook\(\)/)).toBeInTheDocument();
    });
    
    it('should handle long content with word wrapping', () => {
      const longContent = 'This is a very long assistant message that should wrap properly when it exceeds the maximum width of the message bubble.';
      const message = createAssistantMessage(longContent);
      
      render(<AssistantMessage message={message} />);
      
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });
  
  describe('Timestamp Formatting', () => {
    it('should format morning time correctly', () => {
      const message = createAssistantMessage('Morning message', new Date('2024-01-01T09:15:00'));
      
      render(<AssistantMessage message={message} />);
      
      expect(screen.getByText(/9:15 AM/i)).toBeInTheDocument();
    });
    
    it('should format afternoon time correctly', () => {
      const message = createAssistantMessage('Afternoon message', new Date('2024-01-01T15:45:00'));
      
      render(<AssistantMessage message={message} />);
      
      expect(screen.getByText(/3:45 PM/i)).toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA role for message', () => {
      const message = createAssistantMessage('Accessible message');
      
      render(<AssistantMessage message={message} />);
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });
    
    it('should have descriptive ARIA label for message', () => {
      const message = createAssistantMessage('Labeled message');
      
      render(<AssistantMessage message={message} />);
      
      expect(screen.getByLabelText('Assistant message')).toBeInTheDocument();
    });
    
    it('should have descriptive ARIA label for timestamp', () => {
      const message = createAssistantMessage('Message', new Date('2024-01-01T14:30:00'));
      
      render(<AssistantMessage message={message} />);
      
      expect(screen.getByLabelText(/Sent at 2:30 PM/i)).toBeInTheDocument();
    });
    
    it('should have proper ARIA role when loading', () => {
      render(<AssistantMessage isLoading={true} />);
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });
});
