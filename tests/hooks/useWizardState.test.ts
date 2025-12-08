import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWizardState } from '../../src/hooks/useWizardState';
import { WizardSteps } from '../../src/types/Wizard';
import type { Message } from '../../src/types/Wizard';

describe('useWizardState', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('State Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useWizardState());

      expect(result.current.state.currentStep).toBe(WizardSteps.WELCOME);
      expect(result.current.state.messages).toEqual([]);
      expect(result.current.state.bookData.characters).toEqual([]);
      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.error).toBe(null);
      expect(result.current.hasSavedState).toBe(false);
    });

    it('should load saved state from localStorage', () => {
      // Setup saved state
      const savedState = {
        version: 1,
        timestamp: new Date(),
        state: {
          currentStep: WizardSteps.CONCEPT,
          messages: [
            {
              id: '1',
              role: 'user' as const,
              content: 'Test message',
              timestamp: new Date()
            }
          ],
          bookData: {
            concept: 'Test concept',
            characters: []
          },
          styleRefinement: {
            initialOptions: [],
            refinementHistory: [],
            currentImages: [],
            isRefining: false
          },
          isProcessing: false,
          error: null
        },
        temporaryImages: []
      };
      localStorage.setItem('wizard-state', JSON.stringify(savedState));

      const { result } = renderHook(() => useWizardState());

      expect(result.current.state.currentStep).toBe(WizardSteps.CONCEPT);
      expect(result.current.state.messages).toHaveLength(1);
      expect(result.current.state.bookData.concept).toBe('Test concept');
      expect(result.current.hasSavedState).toBe(true);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('wizard-state', 'invalid json');

      const { result } = renderHook(() => useWizardState());

      // Should fall back to initial state
      expect(result.current.state.currentStep).toBe(WizardSteps.WELCOME);
      expect(result.current.hasSavedState).toBe(false);
    });

    it('should handle version mismatch', () => {
      const savedState = {
        version: 999, // Wrong version
        timestamp: new Date(),
        state: {
          currentStep: WizardSteps.CONCEPT,
          messages: [],
          bookData: { characters: [] },
          styleRefinement: {
            initialOptions: [],
            refinementHistory: [],
            currentImages: [],
            isRefining: false
          },
          isProcessing: false,
          error: null
        },
        temporaryImages: []
      };
      localStorage.setItem('wizard-state', JSON.stringify(savedState));

      const { result } = renderHook(() => useWizardState());

      // Should start fresh due to version mismatch
      expect(result.current.state.currentStep).toBe(WizardSteps.WELCOME);
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to a specific step', () => {
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.goToStep(WizardSteps.STYLE);
      });

      expect(result.current.state.currentStep).toBe(WizardSteps.STYLE);
    });

    it('should move to next step', () => {
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.state.currentStep).toBe(WizardSteps.CONCEPT);

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.state.currentStep).toBe(WizardSteps.STYLE);
    });

    it('should not go beyond last step', () => {
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.goToStep(WizardSteps.SUMMARY);
      });

      act(() => {
        result.current.nextStep();
      });

      // Should stay at SUMMARY
      expect(result.current.state.currentStep).toBe(WizardSteps.SUMMARY);
    });

    it('should move to previous step', () => {
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.goToStep(WizardSteps.STYLE);
      });

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.state.currentStep).toBe(WizardSteps.CONCEPT);
    });

    it('should not go before first step', () => {
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.previousStep();
      });

      // Should stay at WELCOME
      expect(result.current.state.currentStep).toBe(WizardSteps.WELCOME);
    });

    it('should clear error on navigation', () => {
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.state.error).toBe('Test error');

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.state.error).toBe(null);
    });
  });

  describe('State Updates', () => {
    it('should update book data', () => {
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.updateBookData({
          title: 'Test Book',
          description: 'Test Description'
        });
      });

      expect(result.current.state.bookData.title).toBe('Test Book');
      expect(result.current.state.bookData.description).toBe('Test Description');
    });

    it('should preserve characters array when updating other book data', () => {
      const { result } = renderHook(() => useWizardState());

      const testCharacter = {
        id: '1',
        name: 'Test Character',
        description: 'A test character'
      };

      act(() => {
        result.current.updateBookData({
          characters: [testCharacter]
        });
      });

      act(() => {
        result.current.updateBookData({
          title: 'New Title'
        });
      });

      expect(result.current.state.bookData.characters).toHaveLength(1);
      expect(result.current.state.bookData.title).toBe('New Title');
    });

    it('should add messages to conversation', () => {
      const { result } = renderHook(() => useWizardState());

      const message: Message = {
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date()
      };

      act(() => {
        result.current.addMessage(message);
      });

      expect(result.current.state.messages).toHaveLength(1);
      expect(result.current.state.messages[0]).toEqual(message);
    });

    it('should add multiple messages in order', () => {
      const { result } = renderHook(() => useWizardState());

      const message1: Message = {
        id: '1',
        role: 'user',
        content: 'First',
        timestamp: new Date()
      };

      const message2: Message = {
        id: '2',
        role: 'assistant',
        content: 'Second',
        timestamp: new Date()
      };

      act(() => {
        result.current.addMessage(message1);
        result.current.addMessage(message2);
      });

      expect(result.current.state.messages).toHaveLength(2);
      expect(result.current.state.messages[0].content).toBe('First');
      expect(result.current.state.messages[1].content).toBe('Second');
    });

    it('should set processing state', () => {
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.setProcessing(true);
      });

      expect(result.current.state.isProcessing).toBe(true);

      act(() => {
        result.current.setProcessing(false);
      });

      expect(result.current.state.isProcessing).toBe(false);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.state.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.state.error).toBe(null);
    });
  });

  describe('State Persistence', () => {
    it('should auto-save state to localStorage', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.updateBookData({ title: 'Test Book' });
      });

      // Fast-forward past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const saved = localStorage.getItem('wizard-state');
      expect(saved).toBeTruthy();
      
      if (saved) {
        const parsed = JSON.parse(saved);
        expect(parsed.state.bookData.title).toBe('Test Book');
      }

      vi.useRealTimers();
    });

    it('should debounce multiple rapid updates', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.updateBookData({ title: 'Title 1' });
        result.current.updateBookData({ title: 'Title 2' });
        result.current.updateBookData({ title: 'Title 3' });
      });

      // Fast-forward past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      const saved = localStorage.getItem('wizard-state');
      expect(saved).toBeTruthy();
      
      if (saved) {
        const parsed = JSON.parse(saved);
        // Should only save the final state
        expect(parsed.state.bookData.title).toBe('Title 3');
      }

      vi.useRealTimers();
    });

    it('should clear state from localStorage', () => {
      const { result } = renderHook(() => useWizardState());

      act(() => {
        result.current.updateBookData({ title: 'Test' });
      });

      act(() => {
        result.current.clearState();
      });

      expect(localStorage.getItem('wizard-state')).toBe(null);
      expect(result.current.state.currentStep).toBe(WizardSteps.WELCOME);
      expect(result.current.state.bookData.title).toBeUndefined();
    });
  });
});
