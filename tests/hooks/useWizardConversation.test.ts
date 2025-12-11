import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardConversation } from '../../src/hooks/useWizardConversation';
import { WizardSteps } from '../../src/types/Wizard';
import type { Message } from '../../src/types/Wizard';
import { BookCreationWizardService } from '../../src/services/BookCreationWizardService';

// Mock the BookCreationWizardService
vi.mock('../../src/services/BookCreationWizardService', () => ({
  BookCreationWizardService: {
    sendConversationMessage: vi.fn()
  }
}));

describe('useWizardConversation', () => {
  let messages: Message[];
  let onAddMessage: ReturnType<typeof vi.fn>;
  let onSetProcessing: ReturnType<typeof vi.fn>;
  let onSetError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    messages = [];
    onAddMessage = vi.fn((msg: Message) => {
      messages.push(msg);
    });
    onSetProcessing = vi.fn();
    onSetError = vi.fn();
    
    vi.clearAllMocks();
  });

  describe('Sending Messages', () => {
    it('should send a user message and receive assistant response', async () => {
      const mockResponse = 'This is a helpful response';
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError,
          concept: 'Test concept'
        })
      );

      await act(async () => {
        await result.current.sendMessage('Hello, I need help');
      });

      // Should add user message
      expect(onAddMessage).toHaveBeenCalledTimes(2); // User + Assistant
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hello, I need help');

      // Should add assistant response
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe(mockResponse);

      // Should manage processing state
      expect(onSetProcessing).toHaveBeenCalledWith(true);
      expect(onSetProcessing).toHaveBeenCalledWith(false);

      // Should clear errors
      expect(onSetError).toHaveBeenCalledWith(null);
    });

    it('should not send empty messages', async () => {
      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError
        })
      );

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(onAddMessage).not.toHaveBeenCalled();
      expect(BookCreationWizardService.sendConversationMessage).not.toHaveBeenCalled();
    });

    it('should trim message content', async () => {
      const mockResponse = 'Response';
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError
        })
      );

      await act(async () => {
        await result.current.sendMessage('  Hello  ');
      });

      expect(messages[0].content).toBe('Hello');
    });
  });

  describe('Step-Specific Behavior', () => {
    it('should send concept context for CONCEPT step', async () => {
      const mockResponse = 'Concept response';
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError,
          concept: 'My book concept'
        })
      );

      await act(async () => {
        await result.current.sendMessage('Help me refine this');
      });

      expect(BookCreationWizardService.sendConversationMessage).toHaveBeenCalledWith(
        'Help me refine this',
        expect.any(Array),
        expect.objectContaining({ concept: 'My book concept' })
      );
    });

    it('should send style context for STYLE step', async () => {
      const mockResponse = 'Style response';
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.STYLE,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError,
          concept: 'My concept',
          stylePrompt: 'Current style prompt'
        })
      );

      await act(async () => {
        await result.current.sendMessage('What about colors?');
      });

      expect(BookCreationWizardService.sendConversationMessage).toHaveBeenCalledWith(
        'What about colors?',
        expect.any(Array),
        expect.objectContaining({
          concept: 'My concept',
          stylePrompt: 'Current style prompt'
        })
      );
    });

    it('should handle WELCOME step', async () => {
      const mockResponse = 'Welcome response';
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.WELCOME,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError
        })
      );

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(BookCreationWizardService.sendConversationMessage).toHaveBeenCalled();
    });

    it('should handle CHARACTERS step', async () => {
      const mockResponse = 'Character response';
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CHARACTERS,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError,
          concept: 'My concept'
        })
      );

      await act(async () => {
        await result.current.sendMessage('Tell me about characters');
      });

      expect(BookCreationWizardService.sendConversationMessage).toHaveBeenCalled();
    });

    it('should handle SUMMARY step', async () => {
      const mockResponse = 'Summary response';
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.SUMMARY,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError,
          concept: 'My concept'
        })
      );

      await act(async () => {
        await result.current.sendMessage('Looks good');
      });

      expect(BookCreationWizardService.sendConversationMessage).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError
        })
      );

      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      // Should set error
      expect(onSetError).toHaveBeenCalledWith('Service error');

      // Should add error message to conversation
      expect(messages[messages.length - 1].role).toBe('assistant');
      expect(messages[messages.length - 1].content).toContain('error');
      expect(messages[messages.length - 1].metadata?.type).toBe('error');

      // Should reset processing state
      expect(onSetProcessing).toHaveBeenCalledWith(false);
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError
        })
      );

      await act(async () => {
        await result.current.sendMessage('Test');
      });

      expect(onSetError).toHaveBeenCalledWith('Failed to send message');
    });
  });

  describe('Conversation Context', () => {
    it('should provide conversation context', () => {
      const existingMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'First message',
          timestamp: new Date()
        },
        {
          id: '2',
          role: 'assistant',
          content: 'First response',
          timestamp: new Date()
        }
      ];

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages: existingMessages,
          onAddMessage,
          onSetProcessing,
          onSetError
        })
      );

      const context = result.current.getConversationContext();
      expect(context).toHaveLength(2);
      expect(context[0].content).toBe('First message');
    });

    it('should limit context to last 20 messages', () => {
      const manyMessages: Message[] = Array.from({ length: 30 }, (_, i) => ({
        id: `${i}`,
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i}`,
        timestamp: new Date()
      }));

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages: manyMessages,
          onAddMessage,
          onSetProcessing,
          onSetError
        })
      );

      const context = result.current.getConversationContext();
      expect(context).toHaveLength(20);
      expect(context[0].content).toBe('Message 10'); // Last 20 messages
    });

    it('should pass context to service', async () => {
      const existingMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Previous message',
          timestamp: new Date()
        }
      ];

      const mockResponse = 'Response';
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages: existingMessages,
          onAddMessage: (msg) => existingMessages.push(msg),
          onSetProcessing,
          onSetError
        })
      );

      await act(async () => {
        await result.current.sendMessage('New message');
      });

      expect(BookCreationWizardService.sendConversationMessage).toHaveBeenCalledWith(
        'New message',
        expect.arrayContaining([
          expect.objectContaining({ content: 'Previous message' })
        ]),
        expect.any(Object)
      );
    });

    it('should include the new user message in conversation context sent to service', async () => {
      // Regression test: Ensure the current user message is included in the context
      // This prevents the bug where LLM doesn't see the user's actual message
      const existingMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'First message',
          timestamp: new Date()
        },
        {
          id: '2',
          role: 'assistant',
          content: 'First response',
          timestamp: new Date()
        }
      ];

      const mockResponse = 'Response acknowledging character names';
      vi.mocked(BookCreationWizardService.sendConversationMessage).mockResolvedValue(mockResponse);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CHARACTERS,
          messages: existingMessages,
          onAddMessage: (msg) => existingMessages.push(msg),
          onSetProcessing,
          onSetError,
          concept: 'A steampunk western story'
        })
      );

      await act(async () => {
        await result.current.sendMessage('Call the professor Professor Investogator and the students Carl, Karla, Pietor, and Petra');
      });

      // Verify the service was called with context that includes BOTH:
      // 1. Previous messages
      // 2. The NEW user message we just sent
      const callArgs = vi.mocked(BookCreationWizardService.sendConversationMessage).mock.calls[0];
      const contextArray = callArgs[1];
      
      // The context array gets mutated because existingMessages is mutated
      // What matters is that it contains the new user message at the time of the call
      expect(contextArray.length).toBeGreaterThanOrEqual(3);
      
      // Verify it contains the previous messages
      expect(contextArray).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'First message'
          }),
          expect.objectContaining({
            role: 'assistant',
            content: 'First response'
          })
        ])
      );
      
      // CRITICAL: Verify the context includes the NEW user message
      // This is the regression test - without the fix, this message would be missing
      expect(contextArray).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'Call the professor Professor Investogator and the students Carl, Karla, Pietor, and Petra'
          })
        ])
      );
      
      // Verify the concept context was also passed
      expect(callArgs[2]).toMatchObject({
        concept: 'A steampunk western story'
      });
    });
  });

  describe('Regenerate Response', () => {
    it('should regenerate last response', async () => {
      const mockResponse1 = 'First response';
      const mockResponse2 = 'Regenerated response';
      vi.mocked(BookCreationWizardService.sendConversationMessage)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError
        })
      );

      // Send initial message
      await act(async () => {
        await result.current.sendMessage('Original message');
      });

      expect(messages).toHaveLength(2);
      expect(messages[1].content).toBe(mockResponse1);

      // Regenerate
      await act(async () => {
        await result.current.regenerateResponse();
      });

      // Should have sent the same user message again
      expect(BookCreationWizardService.sendConversationMessage).toHaveBeenCalledTimes(2);
      expect(messages[messages.length - 1].content).toBe(mockResponse2);
    });

    it('should handle regenerate with no previous message', async () => {
      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError
        })
      );

      await act(async () => {
        await result.current.regenerateResponse();
      });

      expect(onSetError).toHaveBeenCalledWith('No message to regenerate');
      expect(BookCreationWizardService.sendConversationMessage).not.toHaveBeenCalled();
    });
  });

  describe('Clear Conversation', () => {
    it('should clear conversation state', () => {
      const { result } = renderHook(() =>
        useWizardConversation({
          currentStep: WizardSteps.CONCEPT,
          messages,
          onAddMessage,
          onSetProcessing,
          onSetError
        })
      );

      act(() => {
        result.current.clearConversation();
      });

      expect(onSetError).toHaveBeenCalledWith(null);
    });
  });
});
