# Implementation Tasks - Conversational Book Creation Wizard

## Overview

This plan implements a conversational, AI-assisted wizard for creating books with natural language interaction, visual style refinement through iterative image generation, and LLM-powered character creation.

**Key Features:**
- Chat-like interface for natural conversation
- LLM integration (Google Gemini) for suggestions and refinements
- Visual style selection with 3-5 initial variations
- Iterative style refinement with image generation
- Character creation with AI-generated descriptions
- State persistence for resume capability

---

## Tasks

### Phase 1: Foundation & Services

- [x] 1. Create Type Definitions
  - Create `src/types/Wizard.ts`
  - Define `WizardStep` type and constants
  - Define `Message` interface for conversation messages
  - Define `WizardBookData` for book construction state
  - Define `StyleOption` and `GeneratedImage` interfaces
  - Define `RefinementIteration` for style refinement tracking
  - Define `StyleRefinementState` for refinement workflow
  - Define `WizardState` for complete wizard state
  - Define `ConceptAnalysis` and `BookMetadata` from LLM
  - Define `StyleVariation` for LLM style responses
  - Define `PersistedWizardState` for localStorage
  - Define `CharacterProfile` with visual details
  - Define `BookCreationWizardProps` for component props
  - Define `WizardOperationResult` for operation results
  - Add JSDoc comments for all types
  - _Requirements: 1, 2, 3, 4, 5, 6_

- [x] 2. Implement WizardLLMService
  - Create `src/services/WizardLLMService.ts`
  - Implement `generateStructuredPrompt()` for different wizard tasks:
    - Concept analysis prompt
    - Style generation prompt (3-5 variations)
    - Style refinement prompt
    - Character generation prompt
  - Implement response parsing methods:
    - `parseConceptResponse()` - Extract title, description, background, themes
    - `parseStyleResponse()` - Parse array of style variations
    - `parseCharacterResponse()` - Parse character profile
    - `parseRefinementResponse()` - Extract refined prompt
  - Implement `sendMessage()` for conversational interaction
  - Use existing Gemini API integration
  - Handle JSON parsing errors gracefully
  - Include conversation history in context
  - Add retry logic for failed requests
  - _Requirements: 2, 3, 4, 6_

- [x] 2.1 Write unit tests for WizardLLMService
  - Create `tests/services/WizardLLMService.test.ts`
  - Test prompt generation for each task type
  - Test response parsing with valid JSON
  - Test response parsing with invalid JSON (error handling)
  - Test conversation message handling
  - Mock Gemini API calls
  - Test retry logic
  - _Requirements: 2, 3, 4, 6_

- [x] 3. Implement BookCreationWizardService
  - Create `src/services/BookCreationWizardService.ts`
  - Implement concept phase methods:
    - `analyzeConcept()` - Send concept to LLM, return analysis
    - `generateBookMetadata()` - Generate title, description, background
  - Implement style phase methods:
    - `generateStyleVariations()` - Get 3-5 style variations from LLM
    - `generateStyleImages()` - Generate images for each variation
    - `refineStylePrompt()` - Modify prompt based on user feedback
    - `generateRefinedImage()` - Generate image from refined prompt
  - Implement character phase methods:
    - `suggestCharacterCount()` - LLM suggests number of characters
    - `generateCharacterProfile()` - Create detailed character description
    - `refineCharacterDescription()` - Refine based on feedback
  - Implement persistence methods:
    - `saveWizardState()` - Save to localStorage
    - `loadWizardState()` - Load from localStorage
    - `clearWizardState()` - Clear saved state
  - Use `WizardLLMService` for LLM calls
  - Use existing `SceneImageGenerationService` for image generation
  - Use `ImageStorageService` for temporary image storage
  - Handle errors and provide fallbacks
  - _Requirements: 1, 2, 3, 4, 6, 9_

- [x] 3.1 Write unit tests for BookCreationWizardService
  - Create `tests/services/BookCreationWizardService.test.ts`
  - Test concept analysis and metadata generation
  - Test style variation generation
  - Test style image generation (mock image service)
  - Test style refinement workflow
  - Test character profile generation
  - Test state persistence (save/load/clear)
  - Mock WizardLLMService and image generation
  - Test error handling for each method
  - _Requirements: 1, 2, 3, 4, 6, 9_

### Phase 2: State Management Hooks

- [x] 4. Implement useWizardState Hook
  - Create `src/hooks/useWizardState.ts`
  - Initialize wizard state with default values
  - Implement step navigation:
    - `goToStep(step: WizardStep)` - Navigate to specific step
    - `nextStep()` - Move to next step
    - `previousStep()` - Go back to previous step
  - Implement state updates:
    - `updateBookData(data: Partial<BookData>)` - Update book data
    - `addMessage(message: Message)` - Add conversation message
    - `setProcessing(isProcessing: boolean)` - Set loading state
    - `setError(error: string | null)` - Set error state
  - Auto-save state to localStorage on changes (debounced)
  - Load saved state on initialization
  - Return state and update functions
  - _Requirements: 1, 5, 9_

- [x] 4.1 Write unit tests for useWizardState
  - Create `tests/hooks/useWizardState.test.ts`
  - Test state initialization
  - Test step navigation (next, previous, goto)
  - Test state updates (book data, messages, processing, error)
  - Test auto-save to localStorage (debounced)
  - Test loading saved state
  - Use React Testing Library hooks testing
  - _Requirements: 1, 5, 9_

- [x] 5. Implement useWizardConversation Hook
  - Create `src/hooks/useWizardConversation.ts`
  - Implement `sendMessage(content: string)` - Send user message
    - Add user message to conversation
    - Call appropriate service method based on current step
    - Add assistant response to conversation
    - Handle loading state
    - Handle errors
  - Implement `regenerateResponse()` - Regenerate last LLM response
  - Implement `clearConversation()` - Clear message history
  - Use `BookCreationWizardService` for LLM calls
  - Manage conversation context (last N messages)
  - Return conversation state and actions
  - _Requirements: 2, 5, 6_

- [x] 5.1 Write unit tests for useWizardConversation
  - Create `tests/hooks/useWizardConversation.test.ts`
  - Test sending user messages
  - Test receiving assistant responses
  - Test regenerating responses
  - Test clearing conversation
  - Test error handling
  - Mock BookCreationWizardService
  - Test conversation context management
  - _Requirements: 2, 5, 6_

- [x] 6. Implement useStyleRefinement Hook
  - Create `src/hooks/useStyleRefinement.ts`
  - Implement `generateInitialStyles(concept: string, preferences?: string)` - Generate 3-5 style options
  - Implement `selectStyle(styleId: string)` - Select a style option
  - Implement `refineStyle(feedback: string)` - Refine selected style
    - Call LLM to modify prompt
    - Generate new image
    - Add to refinement history
    - Update current images
  - Implement `confirmStyle()` - Finalize style selection
  - Manage refinement history
  - Handle image generation state
  - Return refinement state and actions
  - _Requirements: 3, 7_

- [x] 6.1 Write unit tests for useStyleRefinement
  - Create `tests/hooks/useStyleRefinement.test.ts`
  - Test generating initial style options
  - Test selecting a style
  - Test refining style with feedback
  - Test refinement history tracking
  - Test confirming final style
  - Mock image generation service
  - Test error handling
  - _Requirements: 3, 7_

### Phase 3: UI Components - Shared

- [x] 7. Implement WizardProgress Component
  - Create `src/components/BookCreationWizard/WizardProgress.tsx`
  - Display all wizard steps (Welcome, Concept, Style, Characters, Summary)
  - Highlight current step
  - Show completed steps with checkmark
  - Show disabled future steps
  - Allow clicking on completed steps to navigate back
  - Use Material-UI Stepper component
  - Responsive design (horizontal on desktop, vertical on mobile)
  - Accessible with ARIA labels
  - _Requirements: 1, 10_

- [x] 7.1 Write unit tests for WizardProgress
  - Create `tests/components/BookCreationWizard/WizardProgress.test.tsx`
  - Test rendering all steps
  - Test highlighting current step
  - Test showing completed steps
  - Test navigation on click
  - Test disabled future steps
  - Test accessibility (ARIA labels)
  - _Requirements: 1, 10_

- [x] 8. Implement Message Components
  - Create `src/components/BookCreationWizard/SystemMessage.tsx`
  - Create `src/components/BookCreationWizard/UserMessage.tsx`
  - Create `src/components/BookCreationWizard/AssistantMessage.tsx`
  - `SystemMessage`: Display system instructions/guidance
    - Light background, info icon
    - Centered or full-width layout
  - `UserMessage`: Display user's messages
    - Right-aligned bubble
    - User avatar/icon
    - Timestamp
  - `AssistantMessage`: Display AI responses
    - Left-aligned bubble
    - AI avatar/icon
    - Timestamp
    - Support for rich content (markdown, code blocks)
    - Loading state (typing indicator)
  - Use Material-UI components
  - Consistent styling with theme
  - Accessible with proper ARIA roles
  - _Requirements: 5, 10_

- [x] 8.1 Write unit tests for Message Components
  - Create `tests/components/BookCreationWizard/SystemMessage.test.tsx`
  - Create `tests/components/BookCreationWizard/UserMessage.test.tsx`
  - Create `tests/components/BookCreationWizard/AssistantMessage.test.tsx`
  - Test rendering each message type
  - Test displaying content
  - Test timestamps
  - Test avatars/icons
  - Test loading state (AssistantMessage)
  - Test accessibility
  - _Requirements: 5, 10_

- [x] 9. Implement MessageInput Component
  - Create `src/components/BookCreationWizard/MessageInput.tsx`
  - Multi-line text input (TextField)
  - Send button (Enter key or click)
  - Quick action buttons for common responses (optional)
  - Character count indicator
  - Disabled state when processing
  - Auto-focus on mount
  - Clear input after send
  - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
  - Accessible with proper labels
  - _Requirements: 5, 10_

- [x] 9.1 Write unit tests for MessageInput
  - Create `tests/components/BookCreationWizard/MessageInput.test.tsx`
  - Test typing and sending messages
  - Test Enter key to send
  - Test Shift+Enter for new line
  - Test disabled state
  - Test clearing input after send
  - Test quick action buttons
  - Test accessibility
  - _Requirements: 5, 10_

- [x] 10. Implement MessageList Component
  - Create `src/components/BookCreationWizard/MessageList.tsx`
  - Scrollable container for messages
  - Auto-scroll to bottom on new messages
  - Render appropriate message component based on role
  - Loading indicator when processing
  - Empty state (no messages yet)
  - Virtualization for long conversations (optional)
  - Smooth scrolling animations
  - Accessible with proper ARIA roles
  - _Requirements: 5, 7, 10_

- [x] 10.1 Write unit tests for MessageList
  - Create `tests/components/BookCreationWizard/MessageList.test.tsx`
  - Test rendering messages
  - Test auto-scroll on new messages
  - Test loading indicator
  - Test empty state
  - Test rendering different message types
  - Test accessibility
  - _Requirements: 5, 7, 10_

- [ ] 11. Implement ConversationView Component
  - Create `src/components/BookCreationWizard/ConversationView.tsx`
  - Combine MessageList and MessageInput
  - Layout: MessageList fills space, MessageInput at bottom
  - Pass messages from wizard state
  - Handle sending messages via hook
  - Show error messages if LLM fails
  - Retry button on errors
  - Clear conversation button (optional)
  - Responsive layout
  - Accessible container
  - _Requirements: 5, 6, 7, 10_

- [ ] 11.1 Write unit tests for ConversationView
  - Create `tests/components/BookCreationWizard/ConversationView.test.tsx`
  - Test rendering message list and input
  - Test sending messages
  - Test error display and retry
  - Test integration with useWizardConversation hook
  - Test accessibility
  - _Requirements: 5, 6, 7, 10_

### Phase 4: UI Components - Style Selection

- [ ] 12. Implement StyleImageCard Component
  - Create `src/components/BookCreationWizard/StyleImageCard.tsx`
  - Display generated style image
  - Show style name/description
  - Collapsible prompt text section
  - Select button
  - Selected state (highlighted border)
  - Loading state (skeleton)
  - Error state (failed to generate)
  - Hover effects
  - Responsive sizing
  - Accessible with proper labels
  - _Requirements: 3, 7, 10_

- [ ] 12.1 Write unit tests for StyleImageCard
  - Create `tests/components/BookCreationWizard/StyleImageCard.test.tsx`
  - Test rendering image and details
  - Test select button click
  - Test selected state styling
  - Test collapsible prompt section
  - Test loading state
  - Test error state
  - Test accessibility
  - _Requirements: 3, 7, 10_

- [ ] 13. Implement StyleRefinementPanel Component
  - Create `src/components/BookCreationWizard/StyleRefinementPanel.tsx`
  - Large preview of selected style image
  - Editable prompt text area
  - Refinement conversation input
  - "Regenerate" button
  - Refinement history display
  - Side-by-side comparison view (current vs previous)
  - Loading state during generation
  - Error handling
  - "Confirm Style" button
  - Responsive layout
  - Accessible controls
  - _Requirements: 3, 5, 7, 10_

- [ ] 13.1 Write unit tests for StyleRefinementPanel
  - Create `tests/components/BookCreationWizard/StyleRefinementPanel.test.tsx`
  - Test displaying selected style
  - Test editing prompt
  - Test sending refinement feedback
  - Test regenerating image
  - Test refinement history
  - Test comparison view
  - Test confirming style
  - Test accessibility
  - _Requirements: 3, 5, 7, 10_

- [ ] 14. Implement StyleGallery Component
  - Create `src/components/BookCreationWizard/StyleGallery.tsx`
  - Grid layout of StyleImageCard components
  - Generate initial styles on mount
  - Handle style selection
  - Show StyleRefinementPanel when style selected
  - Loading state (generating initial styles)
  - Error handling (generation failures)
  - "Generate More Options" button (optional)
  - Responsive grid (1-3 columns based on screen size)
  - Accessible navigation
  - _Requirements: 3, 7, 10_

- [ ] 14.1 Write unit tests for StyleGallery
  - Create `tests/components/BookCreationWizard/StyleGallery.test.tsx`
  - Test generating initial styles
  - Test displaying style cards
  - Test selecting a style
  - Test showing refinement panel
  - Test error handling
  - Test responsive layout
  - Test accessibility
  - _Requirements: 3, 7, 10_

### Phase 5: UI Components - Character Creation

- [ ] 15. Implement CharacterBuilder Component
  - Create `src/components/BookCreationWizard/CharacterBuilder.tsx`
  - Character counter display (e.g., "Character 1 of 3")
  - Form fields:
    - Name (required, TextField)
    - Role (TextField with suggestions)
    - Basic description (multiline TextField)
  - "Generate Details" button
  - Display LLM-generated detailed description
  - Refinement conversation for description
  - "Confirm Character" button
  - "Next Character" / "Previous Character" navigation
  - List of completed characters (sidebar or bottom)
  - Edit completed characters
  - Loading state during LLM generation
  - Error handling
  - Responsive layout
  - Accessible form controls
  - _Requirements: 4, 5, 7, 10_

- [ ] 15.1 Write unit tests for CharacterBuilder
  - Create `tests/components/BookCreationWizard/CharacterBuilder.test.tsx`
  - Test form input handling
  - Test generating character details
  - Test refining descriptions
  - Test confirming characters
  - Test navigation between characters
  - Test editing completed characters
  - Test validation (required fields)
  - Test accessibility
  - _Requirements: 4, 5, 7, 10_

### Phase 6: UI Components - Summary & Main Dialog

- [ ] 16. Implement SummaryView Component
  - Create `src/components/BookCreationWizard/SummaryView.tsx`
  - Organized sections:
    - Book Details (title, description, background)
    - Visual Style (sample image, style properties)
    - Characters (list with descriptions)
  - Edit button for each section (returns to that step)
  - Prominent "Create Book" button
  - Estimated storage size indicator (optional)
  - Loading state during book creation
  - Error handling
  - Responsive layout
  - Accessible with proper headings and navigation
  - _Requirements: 7, 8, 10_

- [ ] 16.1 Write unit tests for SummaryView
  - Create `tests/components/BookCreationWizard/SummaryView.test.tsx`
  - Test displaying all book details
  - Test edit buttons navigation
  - Test create book button
  - Test loading state
  - Test error handling
  - Test accessibility
  - _Requirements: 7, 8, 10_

- [ ] 17. Implement BookCreationWizard Main Component
  - Create `src/components/BookCreationWizard/BookCreationWizard.tsx`
  - Create `src/components/BookCreationWizard/index.ts`
  - Full-screen dialog (Material-UI Dialog)
  - WizardProgress at top
  - Render appropriate component based on current step:
    - WELCOME: Welcome message + ConversationView
    - CONCEPT: ConversationView for concept discussion
    - STYLE: StyleGallery
    - CHARACTERS: CharacterBuilder
    - SUMMARY: SummaryView
  - Handle wizard state with useWizardState hook
  - Check for saved state on mount, offer to resume
  - Confirmation dialog on cancel if progress exists
  - Handle book creation on completion:
    - Create Book instance
    - Save using FileBasedStorageService
    - Clear wizard state
    - Call onComplete callback
  - Error boundary for error handling
  - Loading overlay during async operations
  - Responsive layout
  - Accessible with proper ARIA attributes
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10_

- [ ] 17.1 Write unit tests for BookCreationWizard
  - Create `tests/components/BookCreationWizard/BookCreationWizard.test.tsx`
  - Test rendering wizard dialog
  - Test step navigation
  - Test rendering correct component for each step
  - Test resume from saved state
  - Test cancel confirmation
  - Test book creation on completion
  - Test error handling
  - Test accessibility
  - _Requirements: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10_

### Phase 7: Integration & Polish

- [ ] 18. Integrate Wizard into Main App
  - Modify `src/App.tsx` (or main book management component)
  - Import BookCreationWizard component
  - Add state for wizard open/closed
  - Wire "New Book" button to open wizard
  - Handle wizard completion:
    - Refresh book list
    - Navigate to new book
    - Show success message
  - Handle wizard cancellation
  - _Requirements: 1, 8_

- [ ] 19. Add Wizard Entry Point to Navigation
  - Update main navigation/toolbar component
  - Update book list component
  - Update "New Book" button styling/text to indicate wizard
  - Add tooltip: "Create a new book with AI assistance"
  - Consider adding wizard icon
  - Ensure button is prominent and accessible
  - _Requirements: 1, 10_

- [ ] 20. Implement Cleanup for Temporary Images
  - Modify `src/services/BookCreationWizardService.ts`
  - Modify `src/hooks/useWizardState.ts`
  - Track temporary image IDs in wizard state
  - On wizard completion:
    - Keep final style image
    - Delete all other temporary images
  - On wizard cancellation:
    - Delete all temporary images
  - On wizard resume:
    - Validate temporary images still exist
    - Clean up orphaned images
  - Add cleanup utility function
  - Handle cleanup errors gracefully
  - _Requirements: 9_

- [ ] 21. Add Error Recovery and Retry Logic
  - Modify `src/services/WizardLLMService.ts`
  - Modify `src/services/BookCreationWizardService.ts`
  - Modify all wizard components
  - Implement exponential backoff for LLM retries
  - Add "Retry" buttons on error states
  - Add "Skip" options for optional steps
  - Add "Manual Input" fallback when LLM fails
  - Show clear error messages with actionable steps
  - Log errors for debugging
  - Never block user progress on errors
  - Preserve user's work even on errors
  - _Requirements: 6, 10_

- [ ] 22. Performance Optimization
  - Modify all wizard components and hooks
  - Add lazy loading for wizard components
  - Implement debouncing for state persistence (500ms)
  - Implement debouncing for prompt editing (1000ms)
  - Add image loading optimization (progressive loading)
  - Implement message history limit (last 50 messages)
  - Add memoization for expensive computations
  - Optimize re-renders with React.memo
  - Add loading skeletons for better perceived performance
  - Profile and optimize any performance bottlenecks
  - _Requirements: 7, 9_

- [ ] 23. Accessibility Audit and Fixes
  - Audit all wizard components
  - Add proper ARIA labels to all interactive elements
  - Ensure keyboard navigation works throughout wizard
  - Test with screen reader (VoiceOver/NVDA)
  - Ensure sufficient color contrast (4.5:1 for text)
  - Add focus indicators to all focusable elements
  - Ensure form validation errors are announced
  - Add skip links for long content
  - Test with keyboard only (no mouse)
  - Add alt text to all images
  - Ensure loading states are announced
  - Test with browser zoom (up to 200%)
  - _Requirements: 10_

- [ ] 24. End-to-End Testing
  - Create `tests/e2e/BookCreationWizard.e2e.test.ts`
  - Test complete wizard flow from start to finish
  - Test resume from saved state
  - Test cancel with confirmation
  - Test error recovery scenarios
  - Test style refinement iterations
  - Test character creation workflow
  - Test editing from summary view
  - Test book creation and navigation
  - Mock LLM and image generation services
  - Use realistic test data
  - Test on different screen sizes (responsive)
  - _Requirements: All_

- [ ] 25. Documentation and Examples
  - Create `src/components/BookCreationWizard/README.md`
  - Update main project README
  - Document wizard architecture and components
  - Document service APIs
  - Document hook usage
  - Add code examples for common scenarios
  - Document LLM prompt templates
  - Document state persistence format
  - Add troubleshooting guide
  - Document accessibility features
  - Add screenshots/GIFs of wizard flow
  - Document future enhancement ideas
  - _Requirements: All_

---

## Progress Summary

**Completed:** 1 / 25 tasks (4%)

**Phase 1 (Foundation):** 1/4 complete
**Phase 2 (Hooks):** 0/3 complete
**Phase 3 (Shared UI):** 0/5 complete
**Phase 4 (Style UI):** 0/3 complete
**Phase 5 (Character UI):** 0/1 complete
**Phase 6 (Summary & Main):** 0/2 complete
**Phase 7 (Integration):** 0/8 complete

---

## Testing Summary

### Unit Tests
- Services: WizardLLMService, BookCreationWizardService
- Hooks: useWizardState, useWizardConversation, useStyleRefinement
- Components: All wizard components

### Integration Tests
- Wizard flow integration
- Component interactions
- Service coordination

### E2E Tests
- Complete wizard workflows
- Error scenarios
- Resume functionality

---

## Estimated Timeline

- Phase 1 (Foundation): 2-3 days
- Phase 2 (Hooks): 2-3 days
- Phase 3 (Shared UI): 2-3 days
- Phase 4 (Style UI): 2-3 days
- Phase 5 (Character UI): 1-2 days
- Phase 6 (Summary & Main): 2-3 days
- Phase 7 (Integration & Polish): 2-3 days

**Total: 13-20 days**
