# Implementation Tasks - Conversational Book Creation Wizard

## Overview

This document breaks down the implementation of the conversational book creation wizard into discrete, testable tasks. Tasks should be completed in order as later tasks depend on earlier ones.

---

## Phase 1: Foundation & Services

### Task 1: Create Type Definitions

**Status:** not started

**Description:** Define TypeScript types and interfaces for the wizard.

**Files to create:**
- `src/types/Wizard.ts`

**Implementation details:**
- Define `WizardState` interface with all state properties
- Define `WizardStep` enum (WELCOME, CONCEPT, STYLE, CHARACTERS, SUMMARY)
- Define `Message` interface for conversation messages
- Define `StyleOption` interface for style variations
- Define `RefinementIteration` interface for style refinement history
- Define `GeneratedImage` interface for generated images
- Define `ConceptAnalysis` and `BookMetadata` interfaces
- Define `StyleVariation` interface for LLM style responses
- Export all types

**Requirements:** 1, 2, 3, 4, 5, 6

**Subtasks:**
- Create type definitions file
- Add JSDoc comments for all types
- Export types from index

---

### Task 2: Implement WizardLLMService

**Status:** not started

**Description:** Create service for LLM integration with structured prompts and response parsing.

**Files to create:**
- `src/services/WizardLLMService.ts`

**Implementation details:**
- Implement `generateStructuredPrompt()` for different wizard tasks
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

**Requirements:** 2, 3, 4, 6

**Dependencies:** Task 1

**Subtasks:**

#### Task 2.1: Write unit tests for WizardLLMService

**Status:** not started

**Files to create:**
- `tests/services/WizardLLMService.test.ts`

**Test coverage:**
- Test prompt generation for each task type
- Test response parsing with valid JSON
- Test response parsing with invalid JSON (error handling)
- Test conversation message handling
- Mock Gemini API calls
- Test retry logic

---

### Task 3: Implement BookCreationWizardService

**Status:** not started

**Description:** Create orchestration service that coordinates wizard workflow.

**Files to create:**
- `src/services/BookCreationWizardService.ts`

**Implementation details:**
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

**Requirements:** 1, 2, 3, 4, 6, 9

**Dependencies:** Task 1, Task 2

**Subtasks:**

#### Task 3.1: Write unit tests for BookCreationWizardService

**Status:** not started

**Files to create:**
- `tests/services/BookCreationWizardService.test.ts`

**Test coverage:**
- Test concept analysis and metadata generation
- Test style variation generation
- Test style image generation (mock image service)
- Test style refinement workflow
- Test character profile generation
- Test state persistence (save/load/clear)
- Mock WizardLLMService and image generation
- Test error handling for each method

---

## Phase 2: State Management Hooks

### Task 4: Implement useWizardState Hook

**Status:** not started

**Description:** Create custom hook for managing wizard state and step transitions.

**Files to create:**
- `src/hooks/useWizardState.ts`

**Implementation details:**
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

**Requirements:** 1, 5, 9

**Dependencies:** Task 1, Task 3

**Subtasks:**

#### Task 4.1: Write unit tests for useWizardState

**Status:** not started

**Files to create:**
- `tests/hooks/useWizardState.test.ts`

**Test coverage:**
- Test state initialization
- Test step navigation (next, previous, goto)
- Test state updates (book data, messages, processing, error)
- Test auto-save to localStorage (debounced)
- Test loading saved state
- Use React Testing Library hooks testing

---

### Task 5: Implement useWizardConversation Hook

**Status:** not started

**Description:** Create hook for managing conversation flow and LLM interaction.

**Files to create:**
- `src/hooks/useWizardConversation.ts`

**Implementation details:**
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

**Requirements:** 2, 5, 6

**Dependencies:** Task 1, Task 3, Task 4

**Subtasks:**

#### Task 5.1: Write unit tests for useWizardConversation

**Status:** not started

**Files to create:**
- `tests/hooks/useWizardConversation.test.ts`

**Test coverage:**
- Test sending user messages
- Test receiving assistant responses
- Test regenerating responses
- Test clearing conversation
- Test error handling
- Mock BookCreationWizardService
- Test conversation context management

---

### Task 6: Implement useStyleRefinement Hook

**Status:** not started

**Description:** Create hook for managing style refinement workflow.

**Files to create:**
- `src/hooks/useStyleRefinement.ts`

**Implementation details:**
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

**Requirements:** 3, 7

**Dependencies:** Task 1, Task 3

**Subtasks:**

#### Task 6.1: Write unit tests for useStyleRefinement

**Status:** not started

**Files to create:**
- `tests/hooks/useStyleRefinement.test.ts`

**Test coverage:**
- Test generating initial style options
- Test selecting a style
- Test refining style with feedback
- Test refinement history tracking
- Test confirming final style
- Mock image generation service
- Test error handling

---

## Phase 3: UI Components - Shared

### Task 7: Implement WizardProgress Component

**Status:** not started

**Description:** Create step indicator component showing wizard progress.

**Files to create:**
- `src/components/BookCreationWizard/WizardProgress.tsx`

**Implementation details:**
- Display all wizard steps (Welcome, Concept, Style, Characters, Summary)
- Highlight current step
- Show completed steps with checkmark
- Show disabled future steps
- Allow clicking on completed steps to navigate back
- Use Material-UI Stepper component
- Responsive design (horizontal on desktop, vertical on mobile)
- Accessible with ARIA labels

**Requirements:** 1, 10

**Dependencies:** Task 1

**Subtasks:**

#### Task 7.1: Write unit tests for WizardProgress

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/WizardProgress.test.tsx`

**Test coverage:**
- Test rendering all steps
- Test highlighting current step
- Test showing completed steps
- Test navigation on click
- Test disabled future steps
- Test accessibility (ARIA labels)

---

### Task 8: Implement Message Components

**Status:** not started

**Description:** Create message display components for conversation view.

**Files to create:**
- `src/components/BookCreationWizard/SystemMessage.tsx`
- `src/components/BookCreationWizard/UserMessage.tsx`
- `src/components/BookCreationWizard/AssistantMessage.tsx`

**Implementation details:**
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

**Requirements:** 5, 10

**Dependencies:** Task 1

**Subtasks:**

#### Task 8.1: Write unit tests for Message Components

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/SystemMessage.test.tsx`
- `tests/components/BookCreationWizard/UserMessage.test.tsx`
- `tests/components/BookCreationWizard/AssistantMessage.test.tsx`

**Test coverage:**
- Test rendering each message type
- Test displaying content
- Test timestamps
- Test avatars/icons
- Test loading state (AssistantMessage)
- Test accessibility

---

### Task 9: Implement MessageInput Component

**Status:** not started

**Description:** Create input component for user messages.

**Files to create:**
- `src/components/BookCreationWizard/MessageInput.tsx`

**Implementation details:**
- Multi-line text input (TextField)
- Send button (Enter key or click)
- Quick action buttons for common responses (optional)
- Character count indicator
- Disabled state when processing
- Auto-focus on mount
- Clear input after send
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Accessible with proper labels

**Requirements:** 5, 10

**Dependencies:** Task 1

**Subtasks:**

#### Task 9.1: Write unit tests for MessageInput

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/MessageInput.test.tsx`

**Test coverage:**
- Test typing and sending messages
- Test Enter key to send
- Test Shift+Enter for new line
- Test disabled state
- Test clearing input after send
- Test quick action buttons
- Test accessibility

---

### Task 10: Implement MessageList Component

**Status:** not started

**Description:** Create scrollable message list component.

**Files to create:**
- `src/components/BookCreationWizard/MessageList.tsx`

**Implementation details:**
- Scrollable container for messages
- Auto-scroll to bottom on new messages
- Render appropriate message component based on role
- Loading indicator when processing
- Empty state (no messages yet)
- Virtualization for long conversations (optional)
- Smooth scrolling animations
- Accessible with proper ARIA roles

**Requirements:** 5, 7, 10

**Dependencies:** Task 1, Task 8

**Subtasks:**

#### Task 10.1: Write unit tests for MessageList

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/MessageList.test.tsx`

**Test coverage:**
- Test rendering messages
- Test auto-scroll on new messages
- Test loading indicator
- Test empty state
- Test rendering different message types
- Test accessibility

---

### Task 11: Implement ConversationView Component

**Status:** not started

**Description:** Create main conversation interface combining message list and input.

**Files to create:**
- `src/components/BookCreationWizard/ConversationView.tsx`

**Implementation details:**
- Combine MessageList and MessageInput
- Layout: MessageList fills space, MessageInput at bottom
- Pass messages from wizard state
- Handle sending messages via hook
- Show error messages if LLM fails
- Retry button on errors
- Clear conversation button (optional)
- Responsive layout
- Accessible container

**Requirements:** 5, 6, 7, 10

**Dependencies:** Task 1, Task 5, Task 9, Task 10

**Subtasks:**

#### Task 11.1: Write unit tests for ConversationView

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/ConversationView.test.tsx`

**Test coverage:**
- Test rendering message list and input
- Test sending messages
- Test error display and retry
- Test integration with useWizardConversation hook
- Test accessibility

---

## Phase 4: UI Components - Style Selection

### Task 12: Implement StyleImageCard Component

**Status:** not started

**Description:** Create card component for displaying style options.

**Files to create:**
- `src/components/BookCreationWizard/StyleImageCard.tsx`

**Implementation details:**
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

**Requirements:** 3, 7, 10

**Dependencies:** Task 1

**Subtasks:**

#### Task 12.1: Write unit tests for StyleImageCard

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/StyleImageCard.test.tsx`

**Test coverage:**
- Test rendering image and details
- Test select button click
- Test selected state styling
- Test collapsible prompt section
- Test loading state
- Test error state
- Test accessibility

---

### Task 13: Implement StyleRefinementPanel Component

**Status:** not started

**Description:** Create panel for refining selected style through conversation.

**Files to create:**
- `src/components/BookCreationWizard/StyleRefinementPanel.tsx`

**Implementation details:**
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

**Requirements:** 3, 5, 7, 10

**Dependencies:** Task 1, Task 6

**Subtasks:**

#### Task 13.1: Write unit tests for StyleRefinementPanel

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/StyleRefinementPanel.test.tsx`

**Test coverage:**
- Test displaying selected style
- Test editing prompt
- Test sending refinement feedback
- Test regenerating image
- Test refinement history
- Test comparison view
- Test confirming style
- Test accessibility

---

### Task 14: Implement StyleGallery Component

**Status:** not started

**Description:** Create gallery component for style selection and refinement.

**Files to create:**
- `src/components/BookCreationWizard/StyleGallery.tsx`

**Implementation details:**
- Grid layout of StyleImageCard components
- Generate initial styles on mount
- Handle style selection
- Show StyleRefinementPanel when style selected
- Loading state (generating initial styles)
- Error handling (generation failures)
- "Generate More Options" button (optional)
- Responsive grid (1-3 columns based on screen size)
- Accessible navigation

**Requirements:** 3, 7, 10

**Dependencies:** Task 1, Task 6, Task 12, Task 13

**Subtasks:**

#### Task 14.1: Write unit tests for StyleGallery

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/StyleGallery.test.tsx`

**Test coverage:**
- Test generating initial styles
- Test displaying style cards
- Test selecting a style
- Test showing refinement panel
- Test error handling
- Test responsive layout
- Test accessibility

---

## Phase 5: UI Components - Character Creation

### Task 15: Implement CharacterBuilder Component

**Status:** not started

**Description:** Create component for step-by-step character creation.

**Files to create:**
- `src/components/BookCreationWizard/CharacterBuilder.tsx`

**Implementation details:**
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

**Requirements:** 4, 5, 7, 10

**Dependencies:** Task 1, Task 3, Task 5

**Subtasks:**

#### Task 15.1: Write unit tests for CharacterBuilder

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/CharacterBuilder.test.tsx`

**Test coverage:**
- Test form input handling
- Test generating character details
- Test refining descriptions
- Test confirming characters
- Test navigation between characters
- Test editing completed characters
- Test validation (required fields)
- Test accessibility

---

## Phase 6: UI Components - Summary & Main Dialog

### Task 16: Implement SummaryView Component

**Status:** not started

**Description:** Create final review component before book creation.

**Files to create:**
- `src/components/BookCreationWizard/SummaryView.tsx`

**Implementation details:**
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

**Requirements:** 7, 8, 10

**Dependencies:** Task 1, Task 4

**Subtasks:**

#### Task 16.1: Write unit tests for SummaryView

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/SummaryView.test.tsx`

**Test coverage:**
- Test displaying all book details
- Test edit buttons navigation
- Test create book button
- Test loading state
- Test error handling
- Test accessibility

---

### Task 17: Implement BookCreationWizard Main Component

**Status:** not started

**Description:** Create main wizard dialog that orchestrates all components.

**Files to create:**
- `src/components/BookCreationWizard/BookCreationWizard.tsx`
- `src/components/BookCreationWizard/index.ts`

**Implementation details:**
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

**Requirements:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

**Dependencies:** All previous tasks

**Subtasks:**

#### Task 17.1: Write unit tests for BookCreationWizard

**Status:** not started

**Files to create:**
- `tests/components/BookCreationWizard/BookCreationWizard.test.tsx`

**Test coverage:**
- Test rendering wizard dialog
- Test step navigation
- Test rendering correct component for each step
- Test resume from saved state
- Test cancel confirmation
- Test book creation on completion
- Test error handling
- Test accessibility

---

## Phase 7: Integration & Polish

### Task 18: Integrate Wizard into Main App

**Status:** not started

**Description:** Add wizard to main application and wire up "New Book" button.

**Files to modify:**
- `src/App.tsx` (or wherever "New Book" button is)
- Main book management component

**Implementation details:**
- Import BookCreationWizard component
- Add state for wizard open/closed
- Wire "New Book" button to open wizard
- Handle wizard completion:
  - Refresh book list
  - Navigate to new book
  - Show success message
- Handle wizard cancellation
- Ensure wizard doesn't interfere with existing book creation flow (if any)

**Requirements:** 1, 8

**Dependencies:** Task 17

---

### Task 19: Add Wizard Entry Point to Navigation

**Status:** not started

**Description:** Update UI to make wizard easily discoverable.

**Files to modify:**
- Main navigation/toolbar component
- Book list component

**Implementation details:**
- Update "New Book" button styling/text to indicate wizard
- Add tooltip: "Create a new book with AI assistance"
- Consider adding wizard icon
- Ensure button is prominent and accessible
- Update any existing "New Book" flows to use wizard

**Requirements:** 1, 10

**Dependencies:** Task 18

---

### Task 20: Implement Cleanup for Temporary Images

**Status:** not started

**Description:** Add cleanup logic for temporary images generated during wizard.

**Files to modify:**
- `src/services/BookCreationWizardService.ts`
- `src/hooks/useWizardState.ts`

**Implementation details:**
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

**Requirements:** 9

**Dependencies:** Task 3, Task 4, Task 17

---

### Task 21: Add Error Recovery and Retry Logic

**Status:** not started

**Description:** Enhance error handling with user-friendly recovery options.

**Files to modify:**
- `src/services/WizardLLMService.ts`
- `src/services/BookCreationWizardService.ts`
- All wizard components

**Implementation details:**
- Implement exponential backoff for LLM retries
- Add "Retry" buttons on error states
- Add "Skip" options for optional steps
- Add "Manual Input" fallback when LLM fails
- Show clear error messages with actionable steps
- Log errors for debugging
- Never block user progress on errors
- Preserve user's work even on errors

**Requirements:** 6, 10

**Dependencies:** Task 2, Task 3, All component tasks

---

### Task 22: Performance Optimization

**Status:** not started

**Description:** Optimize wizard performance for smooth user experience.

**Files to modify:**
- All wizard components
- All wizard hooks

**Implementation details:**
- Add lazy loading for wizard components
- Implement debouncing for state persistence (500ms)
- Implement debouncing for prompt editing (1000ms)
- Add image loading optimization (progressive loading)
- Implement message history limit (last 50 messages)
- Add memoization for expensive computations
- Optimize re-renders with React.memo
- Add loading skeletons for better perceived performance
- Profile and optimize any performance bottlenecks

**Requirements:** 7, 9

**Dependencies:** All previous tasks

---

### Task 23: Accessibility Audit and Fixes

**Status:** not started

**Description:** Ensure wizard meets WCAG AA accessibility standards.

**Files to modify:**
- All wizard components

**Implementation details:**
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

**Requirements:** 10

**Dependencies:** All component tasks

---

### Task 24: End-to-End Testing

**Status:** not started

**Description:** Create comprehensive end-to-end tests for wizard flow.

**Files to create:**
- `tests/e2e/BookCreationWizard.e2e.test.ts` (or similar)

**Implementation details:**
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

**Requirements:** All requirements

**Dependencies:** All previous tasks

---

### Task 25: Documentation and Examples

**Status:** not started

**Description:** Create documentation for wizard usage and development.

**Files to create:**
- `src/components/BookCreationWizard/README.md`
- Update main project README

**Implementation details:**
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

**Requirements:** All requirements

**Dependencies:** All previous tasks

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

### Manual Testing Checklist
- [ ] Complete wizard flow (happy path)
- [ ] Resume from saved state
- [ ] Cancel with confirmation
- [ ] Style refinement (multiple iterations)
- [ ] Character creation (multiple characters)
- [ ] Edit from summary view
- [ ] Error handling (LLM failures)
- [ ] Error handling (image generation failures)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Mobile responsive design
- [ ] Performance (no lag during typing)
- [ ] Book creation and navigation

---

## Deployment Checklist

Before marking this feature as complete:

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] E2E tests passing
- [ ] Manual testing completed
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Code review completed
- [ ] No console errors or warnings
- [ ] Works in all supported browsers
- [ ] Works on mobile devices
- [ ] LLM costs estimated and acceptable
- [ ] Image generation costs estimated and acceptable

---

## Notes

- Tasks should be completed in order as dependencies are listed
- Each task should be tested before moving to the next
- Keep commits small and focused on individual tasks
- Update this document as tasks are completed
- Add notes about any deviations from the plan
- Track any new issues or enhancements discovered during implementation

---

## Estimated Timeline

- Phase 1 (Foundation): 2-3 days
- Phase 2 (Hooks): 2-3 days
- Phase 3 (Shared UI): 2-3 days
- Phase 4 (Style UI): 2-3 days
- Phase 5 (Character UI): 1-2 days
- Phase 6 (Summary & Main): 2-3 days
- Phase 7 (Integration & Polish): 2-3 days

**Total: 13-20 days** (depending on complexity and testing thoroughness)

This is an estimate and may vary based on:
- LLM integration complexity
- Image generation performance
- Unexpected technical challenges
- Testing and bug fixing time
- Code review and iteration cycles
