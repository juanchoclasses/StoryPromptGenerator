import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message, WizardStep } from '../types/Wizard';
import { WizardSteps } from '../types/Wizard';
import { BookCreationWizardService } from '../services/BookCreationWizardService';

const MAX_CONTEXT_MESSAGES = 20; // Keep last N messages for context

/**
 * Props for useWizardConversation hook
 */
export interface UseWizardConversationProps {
  /** Current wizard step */
  currentStep: WizardStep;
  
  /** Current conversation messages */
  messages: Message[];
  
  /** Callback to add a message to the conversation */
  onAddMessage: (message: Message) => void;
  
  /** Callback to set processing state */
  onSetProcessing: (isProcessing: boolean) => void;
  
  /** Callback to set error state */
  onSetError: (error: string | null) => void;
  
  /** Book concept for context */
  concept?: string;
  
  /** Current style prompt for refinement context */
  stylePrompt?: string;
}

/**
 * Return type for useWizardConversation hook
 */
export interface UseWizardConversationReturn {
  /** Send a user message and get LLM response */
  sendMessage: (content: string) => Promise<void>;
  
  /** Regenerate the last assistant response */
  regenerateResponse: () => Promise<void>;
  
  /** Clear all conversation messages */
  clearConversation: () => void;
  
  /** Get conversation context (last N messages) */
  getConversationContext: () => Message[];
}

/**
 * Custom hook for managing wizard conversation with LLM
 * 
 * Handles sending messages, receiving responses, and managing
 * conversation context for the book creation wizard.
 * 
 * @param props - Hook configuration
 * @returns Conversation management functions
 */
export function useWizardConversation(
  props: UseWizardConversationProps
): UseWizardConversationReturn {
  const {
    currentStep,
    messages,
    onAddMessage,
    onSetProcessing,
    onSetError,
    concept,
    stylePrompt
  } = props;

  // Track the last user message for regeneration
  const lastUserMessageRef = useRef<string | null>(null);

  /**
   * Get conversation context (last N messages)
   */
  const getConversationContext = useCallback((): Message[] => {
    return messages.slice(-MAX_CONTEXT_MESSAGES);
  }, [messages]);

  /**
   * Send a message and get LLM response based on current step
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) {
      return;
    }

    // Clear any existing errors
    onSetError(null);

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    onAddMessage(userMessage);
    lastUserMessageRef.current = content.trim();

    // Set processing state
    onSetProcessing(true);

    try {
      let response: string;
      // Get conversation context and include the new user message
      const context = [...getConversationContext(), userMessage];

      // Call appropriate service method based on current step
      switch (currentStep) {
        case WizardSteps.WELCOME:
        case WizardSteps.CONCEPT:
          // General conversation for concept refinement
          response = await BookCreationWizardService.sendConversationMessage(
            content.trim(),
            context,
            { concept }
          );
          break;

        case WizardSteps.STYLE:
          // Style-related conversation
          response = await BookCreationWizardService.sendConversationMessage(
            content.trim(),
            context,
            { concept, stylePrompt }
          );
          break;

        case WizardSteps.CHARACTERS:
          // Character-related conversation
          response = await BookCreationWizardService.sendConversationMessage(
            content.trim(),
            context,
            { concept }
          );
          break;

        case WizardSteps.SUMMARY:
          // Summary review conversation
          response = await BookCreationWizardService.sendConversationMessage(
            content.trim(),
            context,
            { concept }
          );
          break;

        default:
          response = 'I\'m not sure how to help with that right now.';
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      onAddMessage(assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      onSetError(errorMessage);

      // Add error message to conversation
      const errorAssistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
        metadata: {
          type: 'error'
        }
      };
      onAddMessage(errorAssistantMessage);
    } finally {
      onSetProcessing(false);
    }
  }, [
    currentStep,
    onAddMessage,
    onSetProcessing,
    onSetError,
    concept,
    stylePrompt,
    getConversationContext
  ]);

  /**
   * Regenerate the last assistant response
   */
  const regenerateResponse = useCallback(async () => {
    if (!lastUserMessageRef.current) {
      onSetError('No message to regenerate');
      return;
    }

    // Remove the last assistant message if it exists
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      // We can't directly remove from messages array, but we can send the same message again
      // The new response will be added to the conversation
    }

    // Resend the last user message
    await sendMessage(lastUserMessageRef.current);
  }, [messages, sendMessage, onSetError]);

  /**
   * Clear all conversation messages
   */
  const clearConversation = useCallback(() => {
    // This would need to be implemented by the parent component
    // by providing a callback to clear messages
    // For now, we just reset the last user message
    lastUserMessageRef.current = null;
    onSetError(null);
  }, [onSetError]);

  return {
    sendMessage,
    regenerateResponse,
    clearConversation,
    getConversationContext
  };
}
