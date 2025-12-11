import { useState, useCallback, useEffect, useRef } from 'react';
import type { 
  WizardState, 
  WizardStep, 
  Message, 
  WizardBookData,
  PersistedWizardState 
} from '../types/Wizard';
import { WizardSteps } from '../types/Wizard';

const STORAGE_KEY = 'wizard-state';
const STORAGE_VERSION = 1;
const DEBOUNCE_DELAY = 500; // ms

/**
 * Step order for navigation
 */
const STEP_ORDER: WizardStep[] = [
  WizardSteps.WELCOME,
  WizardSteps.CONCEPT,
  WizardSteps.STYLE,
  WizardSteps.CHARACTERS,
  WizardSteps.SUMMARY
];

/**
 * Create initial wizard state
 */
function createInitialState(): WizardState {
  return {
    currentStep: WizardSteps.WELCOME,
    messages: [],
    bookData: {
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
  };
}

/**
 * Load wizard state from localStorage
 */
function loadStateFromStorage(): WizardState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const persisted: PersistedWizardState = JSON.parse(stored);
    
    // Check version compatibility
    if (persisted.version !== STORAGE_VERSION) {
      console.warn('Wizard state version mismatch, starting fresh');
      return null;
    }

    // Deserialize dates
    const state = persisted.state;
    state.messages = state.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
    
    state.styleRefinement.refinementHistory = state.styleRefinement.refinementHistory.map(iteration => ({
      ...iteration,
      timestamp: new Date(iteration.timestamp),
      generatedImages: iteration.generatedImages.map(img => ({
        ...img,
        timestamp: new Date(img.timestamp)
      }))
    }));
    
    state.styleRefinement.currentImages = state.styleRefinement.currentImages.map(img => ({
      ...img,
      timestamp: new Date(img.timestamp)
    }));

    return state;
  } catch (error) {
    console.error('Failed to load wizard state:', error);
    return null;
  }
}

/**
 * Save wizard state to localStorage
 */
function saveStateToStorage(state: WizardState, temporaryImages: string[] = []): void {
  try {
    const persisted: PersistedWizardState = {
      version: STORAGE_VERSION,
      timestamp: new Date(),
      state,
      temporaryImages
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch (error) {
    console.error('Failed to save wizard state:', error);
  }
}

/**
 * Clear wizard state from localStorage
 */
function clearStateFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear wizard state:', error);
  }
}

/**
 * Return type for useWizardState hook
 */
export interface UseWizardStateReturn {
  // State
  state: WizardState;
  
  // Step navigation
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // State updates
  updateBookData: (data: Partial<WizardBookData>) => void;
  addMessage: (message: Message) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Persistence
  clearState: () => void;
  hasSavedState: boolean;
}

/**
 * Custom hook for managing wizard state
 * 
 * Provides centralized state management for the book creation wizard,
 * including step navigation, state updates, and automatic persistence
 * to localStorage.
 * 
 * @returns Wizard state and update functions
 */
export function useWizardState(): UseWizardStateReturn {
  // Load initial state from localStorage or create new
  const [state, setState] = useState<WizardState>(() => {
    const savedState = loadStateFromStorage();
    return savedState || createInitialState();
  });
  
  const [hasSavedState] = useState(() => {
    return loadStateFromStorage() !== null;
  });

  // Track temporary images for cleanup
  const temporaryImagesRef = useRef<string[]>([]);
  
  // Debounce timer for auto-save
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Debounced save to localStorage
   */
  const debouncedSave = useCallback((currentState: WizardState) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      saveStateToStorage(currentState, temporaryImagesRef.current);
    }, DEBOUNCE_DELAY);
  }, []);

  /**
   * Auto-save state changes to localStorage
   */
  useEffect(() => {
    debouncedSave(state);
    
    // Cleanup on unmount
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [state, debouncedSave]);

  /**
   * Navigate to a specific step
   */
  const goToStep = useCallback((step: WizardStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      error: null // Clear errors on navigation
    }));
  }, []);

  /**
   * Move to the next step
   */
  const nextStep = useCallback(() => {
    setState(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep);
      const nextIndex = Math.min(currentIndex + 1, STEP_ORDER.length - 1);
      return {
        ...prev,
        currentStep: STEP_ORDER[nextIndex],
        error: null
      };
    });
  }, []);

  /**
   * Go back to the previous step
   */
  const previousStep = useCallback(() => {
    setState(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return {
        ...prev,
        currentStep: STEP_ORDER[prevIndex],
        error: null
      };
    });
  }, []);

  /**
   * Update book data
   */
  const updateBookData = useCallback((data: Partial<WizardBookData>) => {
    setState(prev => ({
      ...prev,
      bookData: {
        ...prev.bookData,
        ...data,
        // Ensure characters array is preserved if not explicitly updated
        characters: data.characters !== undefined ? data.characters : prev.bookData.characters
      }
    }));
  }, []);

  /**
   * Add a message to the conversation
   */
  const addMessage = useCallback((message: Message) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  }, []);

  /**
   * Set processing state
   */
  const setProcessing = useCallback((isProcessing: boolean) => {
    setState(prev => ({
      ...prev,
      isProcessing
    }));
  }, []);

  /**
   * Set error state
   */
  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error
    }));
  }, []);

  /**
   * Clear wizard state
   */
  const clearState = useCallback(() => {
    clearStateFromStorage();
    setState(createInitialState());
    temporaryImagesRef.current = [];
  }, []);

  return {
    state,
    goToStep,
    nextStep,
    previousStep,
    updateBookData,
    addMessage,
    setProcessing,
    setError,
    clearState,
    hasSavedState
  };
}
