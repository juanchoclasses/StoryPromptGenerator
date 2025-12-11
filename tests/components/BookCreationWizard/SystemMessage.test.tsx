import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemMessage } from '../../../src/components/BookCreationWizard/SystemMessage';
import type { Message } from '../../../src/types/Wizard';

describe('SystemMessage', () => {
  const createSystemMessage = (content: string): Message => ({
    id: '1',
    role: 'system',
    content,
    timestamp: new Date('2024-01-01T12:00:00')
  });
  
  describe('Rendering', () => {
    it('should render the message content', () => {
      const message = createSystemMessage('Welcome to the wizard!');
      
      render(<SystemMessage message={message} />);
      
      expect(screen.getByText('Welcome to the wizard!')).toBeInTheDocument();
    });
    
    it('should display info icon', () => {
      const message = createSystemMessage('System message');
      
      render(<SystemMessage message={message} />);
      
      // Check for the info icon (it's marked as aria-hidden)
      const icon = document.querySelector('[data-testid="InfoIcon"]');
      expect(icon).toBeInTheDocument();
    });
    
    it('should render multi-line content', () => {
      const message = createSystemMessage('Line 1\nLine 2\nLine 3');
      
      render(<SystemMessage message={message} />);
      
      // Check that all lines are present
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 2/)).toBeInTheDocument();
      expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    });
    
    it('should render long content', () => {
      const longContent = 'This is a very long system message that contains a lot of text to test how the component handles longer content. It should wrap properly and maintain readability.';
      const message = createSystemMessage(longContent);
      
      render(<SystemMessage message={message} />);
      
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });
  
  describe('Styling', () => {
    it('should have centered layout', () => {
      const message = createSystemMessage('Centered message');
      
      const { container } = render(<SystemMessage message={message} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ display: 'flex', justifyContent: 'center' });
    });
    
    it('should have light background styling', () => {
      const message = createSystemMessage('Styled message');
      
      render(<SystemMessage message={message} />);
      
      // The Paper component should be present
      const paper = screen.getByText('Styled message').closest('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const message = createSystemMessage('Accessible message');
      
      render(<SystemMessage message={message} />);
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeInTheDocument();
    });
    
    it('should have descriptive ARIA label', () => {
      const message = createSystemMessage('Labeled message');
      
      render(<SystemMessage message={message} />);
      
      expect(screen.getByLabelText('System message')).toBeInTheDocument();
    });
    
    it('should hide decorative icon from screen readers', () => {
      const message = createSystemMessage('Message with icon');
      
      render(<SystemMessage message={message} />);
      
      const icon = document.querySelector('[data-testid="InfoIcon"]');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
