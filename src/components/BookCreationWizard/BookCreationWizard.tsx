import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Backdrop
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { WizardProgress } from './WizardProgress';
import { ConversationView } from './ConversationView';
import { StyleGallery } from './StyleGallery';
import { CharacterBuilder } from './CharacterBuilder';
import { SummaryView } from './SummaryView';
import { useWizardState } from '../../hooks/useWizardState';
import { useWizardConversation } from '../../hooks/useWizardConversation';
import { BookCreationWizardService } from '../../services/BookCreationWizardService';
import type { BookCreationWizardProps, StyleOption, CharacterProfile, Message } from '../../types/Wizard';
import { WizardSteps } from '../../types/Wizard';
import { v4 as uuidv4 } from 'uuid';

/**
 * BookCreationWizard Component
 * 
 * Main wizard dialog for creating books with AI assistance.
 * 
 * Features:
 * - Full-screen dialog with step-by-step wizard
 * - WizardProgress indicator at top
 * - Step-specific content rendering
 * - Resume from saved state
 * - Confirmation on cancel with progress
 * - Book creation and persistence
 * - Error boundary and loading states
 * - Responsive layout
 * - Accessible with ARIA attributes
 */
export const BookCreationWizard: React.FC<BookCreationWizardProps> = ({
  open,
  onClose,
  onComplete
}) => {
  // Wizard state management
  const {
    state,
    goToStep,
    nextStep,
    updateBookData,
    addMessage,
    setProcessing,
    setError,
    clearState,
    hasSavedState
  } = useWizardState();

  // Conversation management
  const {
    sendMessage
  } = useWizardConversation({
    currentStep: state.currentStep,
    messages: state.messages,
    onAddMessage: addMessage,
    onSetProcessing: setProcessing,
    onSetError: setError,
    concept: state.bookData.concept,
    stylePrompt: state.bookData.stylePrompt
  });

  // Local UI state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<typeof WizardSteps[keyof typeof WizardSteps][]>([]);
  const [hasAutoDetectedCharacters, setHasAutoDetectedCharacters] = useState(false);

  /**
   * Check for saved state on mount
   */
  useEffect(() => {
    if (open && hasSavedState && state.currentStep !== WizardSteps.WELCOME) {
      setShowResumeDialog(true);
    }
  }, [open, hasSavedState]);

  /**
   * Auto-detect characters when entering Characters step
   */
  useEffect(() => {
    const autoDetectCharacters = async () => {
      // Only auto-detect once when entering the Characters step
      if (
        state.currentStep === WizardSteps.CHARACTERS &&
        !hasAutoDetectedCharacters &&
        state.bookData.characters.length === 0 &&
        state.messages.length > 0
      ) {
        setHasAutoDetectedCharacters(true);
        setProcessing(true);

        try {
          const extractedCharacters = await BookCreationWizardService.extractCharactersFromConversation(
            state.messages,
            {
              title: state.bookData.title,
              description: state.bookData.description,
              backgroundSetup: state.bookData.backgroundSetup
            }
          );

          if (extractedCharacters.length > 0) {
            // Convert extracted characters to CharacterProfile format
            const characterProfiles: CharacterProfile[] = extractedCharacters.map(char => ({
              name: char.name,
              description: char.description,
              visualDetails: {
                appearance: '',
                clothing: '',
                distinctiveFeatures: ''
              }
            }));

            // Update book data with extracted characters
            updateBookData({
              characters: characterProfiles
            });

            // Add system message
            const message: Message = {
              id: uuidv4(),
              role: 'system',
              content: `✅ **Found ${extractedCharacters.length} character${extractedCharacters.length > 1 ? 's' : ''} from your conversation:**

${extractedCharacters.map(c => `• **${c.name}** - ${c.role}`).join('\n')}

You can edit these or add more characters below.`,
              timestamp: new Date(),
              metadata: { type: 'success' }
            };
            addMessage(message);
          }
        } catch (error) {
          console.error('Failed to auto-detect characters:', error);
          // Silently fail - user can still add characters manually
        } finally {
          setProcessing(false);
        }
      }
    };

    autoDetectCharacters();
  }, [state.currentStep, state.messages, state.bookData.characters.length, hasAutoDetectedCharacters, state.bookData.title, state.bookData.description, state.bookData.backgroundSetup, updateBookData, addMessage, setProcessing]);

  /**
   * Add welcome message when wizard opens
   */
  useEffect(() => {
    if (open && state.messages.length === 0) {
      const welcomeMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `Welcome to the Book Creation Wizard! 🎨

I'll help you create a new book with AI-powered assistance. We'll work together to:

1. **Define your concept** - Tell me about your book idea
2. **Choose a visual style** - Select and refine the perfect look
3. **Create characters** - Build your cast with detailed descriptions
4. **Review and create** - Finalize your book

Let's get started! What kind of book would you like to create?`,
        timestamp: new Date(),
        metadata: { type: 'suggestion' }
      };
      addMessage(welcomeMessage);
    }
  }, [open, state.messages.length]);

  /**
   * Handle resume from saved state
   */
  const handleResume = useCallback(() => {
    setShowResumeDialog(false);
    // State is already loaded, just continue
  }, []);

  /**
   * Handle start fresh
   */
  const handleStartFresh = useCallback(() => {
    clearState();
    setShowResumeDialog(false);
    setCompletedSteps([]);
  }, [clearState]);

  /**
   * Handle close with confirmation if progress exists
   */
  const handleClose = useCallback(() => {
    // Check if there's any progress
    const hasProgress = 
      state.bookData.concept ||
      state.bookData.title ||
      state.styleRefinement.initialOptions.length > 0 ||
      state.bookData.characters.length > 0;

    if (hasProgress && !showCancelConfirm) {
      setShowCancelConfirm(true);
    } else {
      setShowCancelConfirm(false);
      onClose();
    }
  }, [state, showCancelConfirm, onClose]);

  /**
   * Handle confirmed cancel
   */
  const handleConfirmCancel = useCallback(async () => {
    // Clean up wizard state
    await BookCreationWizardService.clearWizardState();
    clearState();
    setShowCancelConfirm(false);
    setCompletedSteps([]);
    onClose();
  }, [clearState, onClose]);

  /**
   * Analyze concept from conversation and extract book metadata
   */
  const handleAnalyzeConcept = useCallback(async () => {
    setProcessing(true);
    setError(null);

    try {
      // Get the conversation text (last few messages)
      const conversationText = state.messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map(m => m.content)
        .join('\n\n');

      if (!conversationText.trim()) {
        setError('Please describe your book concept first');
        setProcessing(false);
        return;
      }

      // Analyze concept using LLM
      const analysis = await BookCreationWizardService.analyzeConcept(conversationText);

      // Update book data with extracted metadata
      updateBookData({
        concept: conversationText,
        title: analysis.title,
        description: analysis.description,
        backgroundSetup: analysis.backgroundSetup
      });

      // Add system message confirming extraction
      const confirmMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `✅ **Book concept analyzed!**

**Title:** ${analysis.title}
**Description:** ${analysis.description}

${analysis.backgroundSetup ? `**Setting:** ${analysis.backgroundSetup}\n\n` : ''}Ready to move on to style selection?`,
        timestamp: new Date(),
        metadata: { type: 'success' }
      };
      addMessage(confirmMessage);

      setProcessing(false);
    } catch (error) {
      console.error('Failed to analyze concept:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze concept');
      setProcessing(false);
    }
  }, [state.messages, updateBookData, addMessage, setProcessing, setError]);

  /**
   * Handle concept completion
   */
  const handleConceptComplete = useCallback(() => {
    if (!state.bookData.title) {
      setError('Please analyze your concept first by clicking "Analyze Concept"');
      return;
    }
    
    setCompletedSteps(prev => [...prev, WizardSteps.CONCEPT]);
    nextStep();
  }, [state.bookData.title, nextStep, setError]);

  /**
   * Handle style confirmation
   */
  const handleStyleConfirmed = useCallback((styleOption: StyleOption) => {
    updateBookData({
      style: styleOption.style,
      stylePrompt: styleOption.prompt
    });
    
    setCompletedSteps(prev => [...prev, WizardSteps.STYLE]);
    nextStep();
  }, [updateBookData, nextStep]);

  /**
   * Handle character confirmation
   */
  const handleCharacterConfirmed = useCallback((character: CharacterProfile, index: number) => {
    const updatedCharacters = [...state.bookData.characters];
    updatedCharacters[index] = character;
    
    updateBookData({ characters: updatedCharacters });
  }, [state.bookData.characters, updateBookData]);

  /**
   * Handle generate character details
   */
  const handleGenerateCharacterDetails = useCallback(async (
    name: string,
    role: string,
    basicDescription: string,
    existingCharacters: Array<{ name: string; description: string }>
  ): Promise<CharacterProfile> => {
    return await BookCreationWizardService.generateCharacterProfile(
      name,
      role,
      basicDescription,
      state.bookData.concept || '',
      state.bookData.style || {} as any,
      existingCharacters
    );
  }, [state.bookData.concept, state.bookData.style]);

  /**
   * Handle refine character description
   */
  const handleRefineCharacterDescription = useCallback(async (
    character: CharacterProfile,
    feedback: string
  ): Promise<CharacterProfile> => {
    return await BookCreationWizardService.refineCharacterDescription(
      character,
      feedback,
      state.bookData.concept || ''
    );
  }, [state.bookData.concept]);

  /**
   * Handle manual character detection
   */
  const handleDetectCharacters = useCallback(async () => {
    setProcessing(true);

    try {
      const extractedCharacters = await BookCreationWizardService.extractCharactersFromConversation(
        state.messages,
        {
          title: state.bookData.title,
          description: state.bookData.description,
          backgroundSetup: state.bookData.backgroundSetup
        }
      );

      if (extractedCharacters.length > 0) {
        // Convert extracted characters to CharacterProfile format
        const characterProfiles: CharacterProfile[] = extractedCharacters.map(char => ({
          name: char.name,
          description: char.description,
          visualDetails: {
            appearance: '',
            clothing: '',
            distinctiveFeatures: ''
          }
        }));

        // Update book data with extracted characters
        updateBookData({
          characters: characterProfiles
        });

        // Add success message
        const message: Message = {
          id: uuidv4(),
          role: 'system',
          content: `✅ **Found ${extractedCharacters.length} character${extractedCharacters.length > 1 ? 's' : ''} from your conversation:**

${extractedCharacters.map(c => `• **${c.name}** - ${c.role}`).join('\n')}

You can edit these or add more characters below.`,
          timestamp: new Date(),
          metadata: { type: 'success' }
        };
        addMessage(message);
      } else {
        // No characters found
        const message: Message = {
          id: uuidv4(),
          role: 'system',
          content: 'No characters were detected in the conversation. You can add them manually below.',
          timestamp: new Date(),
          metadata: { type: 'info' }
        };
        addMessage(message);
      }
    } catch (error) {
      console.error('Failed to detect characters:', error);
      setError(error instanceof Error ? error.message : 'Failed to detect characters');
    } finally {
      setProcessing(false);
    }
  }, [state.messages, state.bookData.title, state.bookData.description, state.bookData.backgroundSetup, updateBookData, addMessage, setProcessing, setError]);

  /**
   * Handle characters complete
   */
  const handleCharactersComplete = useCallback(() => {
    setCompletedSteps(prev => [...prev, WizardSteps.CHARACTERS]);
    nextStep();
  }, [nextStep]);

  /**
   * Handle book creation
   */
  const handleCreateBook = useCallback(async () => {
    setIsCreatingBook(true);
    setError(null);

    try {
      // Create book data
      const bookData = {
        title: state.bookData.title || 'Untitled Book',
        description: state.bookData.description,
        backgroundSetup: state.bookData.backgroundSetup,
        aspectRatio: state.bookData.aspectRatio || '3:4',
        style: state.bookData.style || {} as any,
        characters: state.bookData.characters.map(char => ({
          name: char.name,
          description: char.description,
          imageGallery: []
        })),
        stories: []
      };

      // Use BookService to create book (saves to both storage systems)
      const { BookService } = await import('../../services/BookService');
      const book = await BookService.createBook(bookData);

      // Clear wizard state
      await BookCreationWizardService.clearWizardState();
      clearState();
      setCompletedSteps([]);

      // Call completion callback
      onComplete(book.id);
    } catch (error) {
      console.error('Failed to create book:', error);
      setError(error instanceof Error ? error.message : 'Failed to create book');
    } finally {
      setIsCreatingBook(false);
    }
  }, [state.bookData, clearState, onComplete, setError]);

  /**
   * Render step content based on current step
   */
  const renderStepContent = () => {
    switch (state.currentStep) {
      case WizardSteps.WELCOME:
      case WizardSteps.CONCEPT:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
            <ConversationView
              messages={state.messages}
              isProcessing={state.isProcessing}
              onSendMessage={sendMessage}
              error={state.error}
              placeholder="Describe your book concept..."
            />
            
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 2 }}>
              {!state.bookData.title && state.messages.length > 2 && (
                <Button
                  variant="outlined"
                  onClick={handleAnalyzeConcept}
                  disabled={state.isProcessing}
                  size="large"
                  sx={{ flex: 1 }}
                  aria-label="Analyze concept and extract book details"
                >
                  {state.isProcessing ? 'Analyzing...' : 'Analyze Concept'}
                </Button>
              )}
              
              {state.bookData.title && (
                <Button
                  variant="contained"
                  onClick={handleConceptComplete}
                  fullWidth
                  size="large"
                  aria-label="Continue to style selection"
                >
                  Continue to Style Selection →
                </Button>
              )}
            </Box>
          </Box>
        );

      case WizardSteps.STYLE:
        return (
          <StyleGallery
            concept={state.bookData.concept || ''}
            preferences={state.bookData.description}
            aspectRatio={state.bookData.aspectRatio || '3:4'}
            onStyleConfirmed={handleStyleConfirmed}
            autoGenerate={true}
          />
        );

      case WizardSteps.CHARACTERS:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
            <CharacterBuilder
              characterCount={3} // Default to 3 characters
              bookConcept={state.bookData.concept || ''}
              bookStyle={state.bookData.style || {} as any}
              existingCharacters={state.bookData.characters}
              onCharacterConfirmed={handleCharacterConfirmed}
              onGenerateDetails={handleGenerateCharacterDetails}
              onRefineDescription={handleRefineCharacterDescription}
              onDetectCharacters={handleDetectCharacters}
            />
            
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button
                variant="contained"
                onClick={handleCharactersComplete}
                fullWidth
                size="large"
                disabled={state.bookData.characters.length === 0}
                aria-label="Continue to summary"
              >
                Continue to Summary →
              </Button>
            </Box>
          </Box>
        );

      case WizardSteps.SUMMARY:
        return (
          <SummaryView
            bookData={state.bookData}
            isCreating={isCreatingBook}
            error={state.error}
            onEditSection={goToStep}
            onCreateBook={handleCreateBook}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Main wizard dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        aria-labelledby="book-creation-wizard-title"
        aria-describedby="book-creation-wizard-description"
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Header with progress */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2
              }}
            >
              <Typography
                id="book-creation-wizard-title"
                variant="h5"
                component="h1"
              >
                Create New Book
              </Typography>
              
              <Button
                onClick={handleClose}
                startIcon={<CloseIcon />}
                aria-label="Close wizard"
              >
                Close
              </Button>
            </Box>
            
            <WizardProgress
              currentStep={state.currentStep}
              completedSteps={completedSteps}
              onStepClick={goToStep}
            />
          </Box>

          {/* Step content */}
          <DialogContent
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 0
            }}
          >
            <Box
              id="book-creation-wizard-description"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {renderStepContent()}
            </Box>
          </DialogContent>
        </Box>

        {/* Loading overlay */}
        <Backdrop
          open={state.isProcessing || isCreatingBook}
          sx={{
            position: 'absolute',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="h6" color="white">
              {isCreatingBook ? 'Creating your book...' : 'Processing...'}
            </Typography>
          </Box>
        </Backdrop>
      </Dialog>

      {/* Resume dialog */}
      <Dialog
        open={showResumeDialog}
        onClose={() => setShowResumeDialog(false)}
        aria-labelledby="resume-dialog-title"
      >
        <Box sx={{ p: 3 }}>
          <Typography id="resume-dialog-title" variant="h6" gutterBottom>
            Resume Previous Session?
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            You have an unfinished book creation session. Would you like to continue where you left off?
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button
              onClick={handleStartFresh}
              variant="outlined"
              aria-label="Start fresh"
            >
              Start Fresh
            </Button>
            <Button
              onClick={handleResume}
              variant="contained"
              aria-label="Resume session"
            >
              Resume
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        aria-labelledby="cancel-dialog-title"
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <WarningIcon color="warning" />
            <Typography id="cancel-dialog-title" variant="h6">
              Discard Progress?
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            You have unsaved progress in the wizard. If you close now, your work will be lost.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Your progress is automatically saved. You can safely close and resume later.
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setShowCancelConfirm(false)}
              variant="outlined"
              aria-label="Continue working"
            >
              Continue Working
            </Button>
            <Button
              onClick={handleConfirmCancel}
              variant="contained"
              color="error"
              aria-label="Discard and close"
            >
              Discard & Close
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};
