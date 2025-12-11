import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserMessage } from '../../../src/components/BookCreationWizard/UserMessage';
import type { Message } from '../../../src/types/Wizard';

describe('UserMessage', () => {
  const createUserMessage = (content: string, timestamp?: Date): Message => ({
    id: '1',
    role: 'user',
    content,
    timestamp: timestamp || new Date('2024-01-01T14:30:00')
  });
  
  describe('Rendering', () => {
    it('should render the message content', () => {
      const message = createUserMessage('Hello, I want to create a book!');
      
      render(<UserMessage message={message} />);
      
      expect(screen.getByText('Hello, I want to create a book!')).toBeInTheDocument();
    });
    
    it('should display user avatar', () => {
      const message = createUserMessage('Test message');
      
      render(<UserMessage message={message} />);
      
      expect(screen.getByLabelText('User avatar')).toBeInTheDocument();
    });
    
    it('should display timestamp', () => {
      const message = createUserMessage('Message with time', new Date('2024-01-01T14:30:00'));
      
      render(<UserMessage message={message} />);
      
      // Check for timestamp (format: "2:30 PM")
      expect(screen.getByText(/2:30 PM/i)).toBeInTheDocument();
    });
    
    it('should render multi-line content', () => {
      const message = createUserMessage('First line\nSecond line\nThird line');
      
      render(<UserMessage message={message} />);
      
      // Check that all lines are present
      expect(screen.getByText(/First line/)).toBeInTheDocument();
      expect(screen.getByText(/Second line/)).toBeInTheDocument();
      expect(screen.getByText(/Third line/)).toBeInTheDocument();
    });
    
    it('should handle long content with word wrapping', () => {
      const longContent = 'This is a very long user message that should wrap properly when it exceeds the maximum width of the message bubble.';
      const message = createUserMessage(longContent);
      
      render(<UserMessage message={message} />);
      
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });
  
  describe('Layout', () => {
    it('should be right-aligned', () => {
      const message = createUserMessage('Right-aligned message');
      
      const { container } = render(<UserMessage message={message} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ display: 'flex', justifyContent: 'flex-end' });
    });
    
    it('should have message bubble styling', () => {
      const message = createUserMessage('Styled message');
      
      render(<UserMessage message={message} />);
      
      const paper = screen.getByText('Styled message').closest('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });
  
  describe('Timestamp Formatting', () => {
    it('should format morning time correctly', () => {
      const message = createUserMessage('Morning message', new Date('2024-01-01T09:15:00'));
      
      render(<UserMessage message={message} />);
      
      expect(screen.getByText(/9:15 AM/i)).toBeInTheDocument();
    });
    
    it('should format afternoon time correctly', () => {
      const message = createUserMessage('Afternoon message', new Date('2024-01-01T15:45:00'));
      
      render(<UserMessage message={message} />);
      
      expect(screen.getByText(/3:45 PM/i)).toBeInTheDocument();
    });
    
    it('should format midnight correctly', () => {
      const message = createUserMessage('Midnight message', new Date('2024-01-01T00:00:00'));
      
      render(<UserMessage message={message} />);
      
      expect(screen.getByText(/12:00 AM/i)).toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const message = createUserMessage('Accessible message');
      
      render(<UserMessage message={message} />);
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });
    
    it('should have descriptive ARIA label for message', () => {
      const message = createUserMessage('Labeled message');
      
      render(<UserMessage message={message} />);
      
      expect(screen.getByLabelText('User message')).toBeInTheDocument();
    });
    
    it('should have descriptive ARIA label for timestamp', () => {
      const message = createUserMessage('Message', new Date('2024-01-01T14:30:00'));
      
      render(<UserMessage message={message} />);
      
      expect(screen.getByLabelText(/Sent at 2:30 PM/i)).toBeInTheDocument();
    });
  });
});
