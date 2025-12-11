import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Home as WelcomeIcon,
  Lightbulb as ConceptIcon,
  Palette as StyleIcon,
  People as CharactersIcon,
  CheckCircle as SummaryIcon
} from '@mui/icons-material';
import type { WizardStep } from '../../types/Wizard';

/**
 * Props for WizardProgress component
 */
export interface WizardProgressProps {
  /** Current active step */
  currentStep: WizardStep;
  
  /** Completed steps that can be navigated back to */
  completedSteps: WizardStep[];
  
  /** Callback when a completed step is clicked */
  onStepClick?: (step: WizardStep) => void;
}

/**
 * Step configuration with labels and icons
 */
const WIZARD_STEPS: Array<{
  id: WizardStep;
  label: string;
  icon: React.ReactElement;
}> = [
  {
    id: 'welcome',
    label: 'Welcome',
    icon: <WelcomeIcon />
  },
  {
    id: 'concept',
    label: 'Concept',
    icon: <ConceptIcon />
  },
  {
    id: 'style',
    label: 'Style',
    icon: <StyleIcon />
  },
  {
    id: 'characters',
    label: 'Characters',
    icon: <CharactersIcon />
  },
  {
    id: 'summary',
    label: 'Summary',
    icon: <SummaryIcon />
  }
];

/**
 * WizardProgress Component
 * 
 * Displays progress through the book creation wizard with a stepper interface.
 * Shows current step, completed steps with checkmarks, and allows navigation
 * back to completed steps.
 * 
 * Features:
 * - Responsive design (horizontal on desktop, vertical on mobile)
 * - Accessible with ARIA labels
 * - Visual feedback for current, completed, and disabled steps
 * - Click navigation for completed steps
 */
export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  completedSteps,
  onStepClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Get the index of the current step
  const currentStepIndex = WIZARD_STEPS.findIndex(step => step.id === currentStep);
  
  /**
   * Check if a step is completed
   */
  const isStepCompleted = (stepId: WizardStep): boolean => {
    return completedSteps.includes(stepId);
  };
  
  /**
   * Check if a step is clickable (completed and has click handler)
   */
  const isStepClickable = (stepId: WizardStep): boolean => {
    return isStepCompleted(stepId) && !!onStepClick;
  };
  
  /**
   * Handle step click
   */
  const handleStepClick = (stepId: WizardStep) => {
    if (isStepClickable(stepId)) {
      onStepClick?.(stepId);
    }
  };
  
  return (
    <Box
      sx={{
        width: '100%',
        py: 2,
        px: { xs: 1, sm: 3 }
      }}
      role="navigation"
      aria-label="Wizard progress"
    >
      <Stepper
        activeStep={currentStepIndex}
        orientation={isMobile ? 'vertical' : 'horizontal'}
        sx={{
          '& .MuiStepLabel-root': {
            cursor: 'default'
          }
        }}
      >
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = isStepCompleted(step.id);
          const isClickable = isStepClickable(step.id);
          const isCurrent = step.id === currentStep;
          
          return (
            <Step
              key={step.id}
              completed={isCompleted}
              disabled={index > currentStepIndex && !isCompleted}
            >
              {isClickable ? (
                <StepButton
                  onClick={() => handleStepClick(step.id)}
                  icon={step.icon}
                  aria-label={`Go back to ${step.label} step`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {step.label}
                </StepButton>
              ) : (
                <StepLabel
                  icon={step.icon}
                  aria-label={`${step.label} step${isCurrent ? ' (current)' : ''}${isCompleted ? ' (completed)' : ''}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {step.label}
                </StepLabel>
              )}
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};
