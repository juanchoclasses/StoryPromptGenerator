import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WizardProgress } from '../../../src/components/BookCreationWizard/WizardProgress';
import type { WizardStep } from '../../../src/types/Wizard';

describe('WizardProgress', () => {
  const allSteps: WizardStep[] = ['welcome', 'concept', 'style', 'characters', 'summary'];
  
  describe('Rendering', () => {
    it('should render all wizard steps', () => {
      render(
        <WizardProgress
          currentStep="welcome"
          completedSteps={[]}
        />
      );
      
      // Check that all step labels are rendered
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getByText('Concept')).toBeInTheDocument();
      expect(screen.getByText('Style')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });
    
    it('should highlight the current step', () => {
      render(
        <WizardProgress
          currentStep="concept"
          completedSteps={['welcome']}
        />
      );
      
      // The current step should have aria-current="step"
      const conceptStep = screen.getByLabelText(/Concept step \(current\)/i);
      expect(conceptStep).toBeInTheDocument();
    });
    
    it('should show completed steps with checkmarks', () => {
      render(
        <WizardProgress
          currentStep="style"
          completedSteps={['welcome', 'concept']}
        />
      );
      
      // Completed steps should be marked as completed in ARIA labels
      expect(screen.getByLabelText(/Welcome step \(completed\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Concept step \(completed\)/i)).toBeInTheDocument();
    });
    
    it('should show future steps as disabled', () => {
      render(
        <WizardProgress
          currentStep="concept"
          completedSteps={['welcome']}
        />
      );
      
      // Future steps should not be clickable (no buttons for them)
      const styleButton = screen.queryByRole('button', { name: /Style/i });
      const charactersButton = screen.queryByRole('button', { name: /Characters/i });
      const summaryButton = screen.queryByRole('button', { name: /Summary/i });
      
      // Future steps should not be buttons
      expect(styleButton).not.toBeInTheDocument();
      expect(charactersButton).not.toBeInTheDocument();
      expect(summaryButton).not.toBeInTheDocument();
      
      // But the labels should still be visible
      expect(screen.getByText('Style')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });
  });
  
  describe('Navigation', () => {
    it('should allow clicking on completed steps to navigate back', async () => {
      const user = userEvent.setup();
      const onStepClick = vi.fn();
      
      render(
        <WizardProgress
          currentStep="style"
          completedSteps={['welcome', 'concept']}
          onStepClick={onStepClick}
        />
      );
      
      // Click on a completed step
      const welcomeButton = screen.getByRole('button', { name: /Go back to Welcome step/i });
      await user.click(welcomeButton);
      
      expect(onStepClick).toHaveBeenCalledWith('welcome');
    });
    
    it('should not allow clicking on the current step', () => {
      const onStepClick = vi.fn();
      
      render(
        <WizardProgress
          currentStep="concept"
          completedSteps={['welcome']}
          onStepClick={onStepClick}
        />
      );
      
      // Current step should not be a button
      const conceptStep = screen.queryByRole('button', { name: /Go back to Concept step/i });
      expect(conceptStep).not.toBeInTheDocument();
    });
    
    it('should not allow clicking on future steps', () => {
      const onStepClick = vi.fn();
      
      render(
        <WizardProgress
          currentStep="concept"
          completedSteps={['welcome']}
          onStepClick={onStepClick}
        />
      );
      
      // Future steps should not be buttons
      const styleButton = screen.queryByRole('button', { name: /Go back to Style step/i });
      const charactersButton = screen.queryByRole('button', { name: /Go back to Characters step/i });
      const summaryButton = screen.queryByRole('button', { name: /Go back to Summary step/i });
      
      expect(styleButton).not.toBeInTheDocument();
      expect(charactersButton).not.toBeInTheDocument();
      expect(summaryButton).not.toBeInTheDocument();
    });
    
    it('should not make steps clickable when onStepClick is not provided', () => {
      render(
        <WizardProgress
          currentStep="style"
          completedSteps={['welcome', 'concept']}
        />
      );
      
      // Even completed steps should not be buttons without onStepClick
      const welcomeButton = screen.queryByRole('button', { name: /Go back to Welcome step/i });
      const conceptButton = screen.queryByRole('button', { name: /Go back to Concept step/i });
      
      expect(welcomeButton).not.toBeInTheDocument();
      expect(conceptButton).not.toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels for navigation', () => {
      render(
        <WizardProgress
          currentStep="concept"
          completedSteps={['welcome']}
        />
      );
      
      // Check for navigation landmark
      const nav = screen.getByRole('navigation', { name: /Wizard progress/i });
      expect(nav).toBeInTheDocument();
    });
    
    it('should mark current step with aria-current', () => {
      render(
        <WizardProgress
          currentStep="style"
          completedSteps={['welcome', 'concept']}
        />
      );
      
      // Current step should have aria-current="step"
      const currentStep = screen.getByLabelText(/Style step \(current\)/i);
      expect(currentStep).toHaveAttribute('aria-current', 'step');
    });
    
    it('should have descriptive ARIA labels for each step', () => {
      render(
        <WizardProgress
          currentStep="concept"
          completedSteps={['welcome']}
          onStepClick={vi.fn()}
        />
      );
      
      // Check for descriptive labels
      expect(screen.getByLabelText(/Go back to Welcome step/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Concept step \(current\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Style step/i)).toBeInTheDocument();
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle being on the first step', () => {
      render(
        <WizardProgress
          currentStep="welcome"
          completedSteps={[]}
        />
      );
      
      expect(screen.getByLabelText(/Welcome step \(current\)/i)).toBeInTheDocument();
    });
    
    it('should handle being on the last step', () => {
      render(
        <WizardProgress
          currentStep="summary"
          completedSteps={['welcome', 'concept', 'style', 'characters']}
        />
      );
      
      expect(screen.getByLabelText(/Summary step \(current\)/i)).toBeInTheDocument();
    });
    
    it('should handle all steps completed', () => {
      render(
        <WizardProgress
          currentStep="summary"
          completedSteps={allSteps}
        />
      );
      
      // All steps should be marked as completed
      allSteps.forEach(step => {
        const stepLabel = step.charAt(0).toUpperCase() + step.slice(1);
        const stepElement = screen.getByText(stepLabel);
        expect(stepElement).toBeInTheDocument();
      });
    });
  });
});
