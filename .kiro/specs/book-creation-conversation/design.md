# Design Document - Conversational Book Creation Wizard

## Overview

This document describes the architecture and implementation design for the conversational book creation wizard. The wizard guides users through creating a new book using natural language interaction, AI-powered suggestions, and visual style refinement through iterative image generation.

## Architecture

### Component Hierarchy

```
BookCreationWizard (Main Dialog)
├── WizardProgress (Step indicator)
├── ConversationView (Chat interface)
│   ├── MessageList
│   │   ├── SystemMessage
│   │   ├── UserMessage
│   │   └── AssistantMessage
│   └── MessageInput
│       ├── TextField
│       └── QuickActionButtons
├── StyleGallery (Visual style selection)
│   ├── StyleImageCard[]
│   │   ├── Image
│   │   ├── PromptDisplay
│   │   └── SelectButton
│   └── RefinementPanel
│       ├── SelectedImage
│       ├── PromptEditor
│       └── RegenerateButton
└── SummaryView (Final review)
    ├── BookDetails
    ├── StylePreview
    ├── CharacterList
    └── ConfirmButton
```

### State Management

The wizard uses a centralized state machine with the following structure:

```typescript
interface WizardState {
  // Current step
  currentStep: WizardStep;
  
  // Conversation history
  messages: Message[];
  
  // Book data being built
  bookData: {
    concept?: string;
    title?: string;
    description?: string;
    backgroundSetup?: string;
    style?: BookStyle;
    stylePrompt?: string;
    characters: Character[];
  };
  
  // Style refinement state
  styleRefinement: {
    initialOptions: StyleOption[];
    selectedOption?: StyleOption;
    refinementHistory: RefinementIteration[];
    currentImages: GeneratedImage[];
  };
  
  // UI state
  isProcessing: boolean;
  error: string | null;
}

enum WizardStep {
  WELCOME = 'welcome',
  CONCEPT = 'concept',
  STYLE = 'style',
  CHARACTERS = 'characters',
  SUMMARY = 'summary'
}

interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'suggestion' | 'question' | 'confirmation';
    data?: any;
  };
}

interface StyleOption {
  id: string;
  prompt: string;
  imageUrl: string;
  style: BookStyle;
}

interface RefinementIteration {
  userFeedback: string;
  modifiedPrompt: string;
  generatedImages: GeneratedImage[];
  timestamp: Date;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}
```

### Service Layer

#### BookCreationWizardService

Orchestrates the wizard workflow and coordinates between LLM and image generation services.

```typescript
class BookCreationWizardService {
  // Concept phase
  static async analyzeConcept(concept: string): Promise<ConceptAnalysis>;
  static async generateBookMetadata(concept: string): Promise<BookMetadata>;
  
  // Style phase
  static async generateStyleVariations(concept: string, preferences?: string): Promise<StyleVariation[]>;
  static async generateStyleImages(variations: StyleVariation[]): Promise<StyleOption[]>;
  static async refineStylePrompt(currentPrompt: string, feedback: string, context: string): Promise<string>;
  static async generateRefinedImage(prompt: string, aspectRatio: string): Promise<string>;
  
  // Character phase
  static async suggestCharacterCount(concept: string): Promise<number>;
  static async generateCharacterProfile(name: string, role: string, bookContext: string, style: BookStyle): Promise<Character>;
  static async refineCharacterDescription(character: Character, feedback: string): Promise<Character>;
  
  // Persistence
  static async saveWizardState(state: WizardState): Promise<void>;
  static async loadWizardState(): Promise<WizardState | null>;
  static async clearWizardState(): Promise<void>;
}

interface ConceptAnalysis {
  themes: string[];
  suggestedGenres: string[];
  targetAudience: string;
  visualElements: string[];
}

interface BookMetadata {
  title: string;
  description: string;
  backgroundSetup: string;
}

interface StyleVariation {
  name: string;
  artStyle: string;
  colorPalette: string;
  visualTheme: string;
  characterStyle: string;
  environmentStyle: string;
  prompt: string;
}
```

#### LLMService Integration

Extends existing LLM capabilities for wizard-specific tasks.

```typescript
class WizardLLMService {
  // Structured prompt generation
  static async generateStructuredPrompt(
    task: 'concept' | 'style' | 'character' | 'refinement',
    context: any
  ): Promise<string>;
  
  // Response parsing
  static parseConceptResponse(response: string): ConceptAnalysis & BookMetadata;
  static parseStyleResponse(response: string): StyleVariation[];
  static parseCharacterResponse(response: string): Character;
  static parseRefinementResponse(response: string): string;
  
  // Conversation management
  static async sendMessage(
    message: string,
    conversationHistory: Message[],
    context: WizardState
  ): Promise<string>;
}
```

## Data Flow

### 1. Wizard Entry

```
User clicks "New Book"
  → Open BookCreationWizard dialog
  → Check for saved wizard state
  → If found, offer to resume
  → Initialize wizard state
  → Display welcome message
```

### 2. Concept Phase

```
User describes book concept
  → Send to LLM for analysis
  → Display loading indicator
  → LLM returns concept analysis + metadata suggestions
  → Display suggestions in conversation
  → User can accept, modify, or regenerate
  → Once confirmed, move to style phase
```

**LLM Prompt Structure:**
```
System: You are helping a user create a book for visual storytelling...
Context: [Book creation wizard, concept phase]
Task: Analyze the following book concept and suggest:
1. A compelling title
2. A detailed description
3. Background setup for the story world
4. Key themes and visual elements

User concept: [user input]

Respond in JSON format:
{
  "title": "...",
  "description": "...",
  "backgroundSetup": "...",
  "themes": [...],
  "visualElements": [...]
}
```

### 3. Style Phase

```
User describes style preferences (optional)
  → Send concept + preferences to LLM
  → LLM generates 3-5 style variations
  → For each variation:
      → Build image generation prompt
      → Generate sample image
      → Store prompt with image
  → Display style gallery
  → User selects preferred style
  → Enable refinement conversation
  
Refinement loop:
  User: "Make it more cartoonish"
    → Send feedback + current prompt to LLM
    → LLM modifies prompt
    → Generate new image with modified prompt
    → Display alongside previous images
    → User can continue refining or confirm
```

**Style Generation LLM Prompt:**
```
System: You are a visual style expert helping create consistent book imagery...
Context: Book concept: [concept]
Task: Generate 3-5 distinct visual style variations suitable for this book.

For each style, provide:
- artStyle: (e.g., "hand-painted watercolor", "digital illustration")
- colorPalette: (e.g., "warm earth tones with vibrant accents")
- visualTheme: (e.g., "whimsical and educational")
- characterStyle: (e.g., "simplified shapes, expressive faces")
- environmentStyle: (e.g., "abstract geometric backgrounds")
- prompt: Complete image generation prompt incorporating all style elements

Respond in JSON array format.
```

**Style Refinement LLM Prompt:**
```
System: You are refining an image generation prompt based on user feedback...
Current prompt: [current prompt]
User feedback: [feedback]
Book context: [concept and style]

Task: Modify the prompt to incorporate the user's feedback while maintaining consistency with the book's concept and existing style elements.

Respond with only the modified prompt text.
```

### 4. Character Phase

```
LLM suggests character count based on concept
  → User confirms or adjusts count
  → For each character:
      User provides: name, role, basic description
        → Send to LLM with book context + style
        → LLM generates detailed visual description
        → Display in conversation
        → User can refine through conversation
        → Confirm and move to next character
  → All characters created
  → Move to summary
```

**Character Generation LLM Prompt:**
```
System: You are creating a detailed character profile for visual consistency...
Book context:
- Concept: [concept]
- Style: [style details]
- Existing characters: [other characters]

Character basics:
- Name: [name]
- Role: [role]
- Description: [user description]

Task: Generate a detailed visual description suitable for AI image generation, ensuring:
1. Consistency with book's visual style
2. Distinctive features that differentiate from other characters
3. Specific details about appearance, clothing, and personality traits
4. Description is optimized for image generation prompts

Respond in JSON format:
{
  "name": "...",
  "description": "...",
  "visualDetails": {
    "appearance": "...",
    "clothing": "...",
    "distinctiveFeatures": "..."
  }
}
```

### 5. Summary & Completion

```
Display comprehensive summary:
  - Book title, description, background
  - Visual style with sample image
  - Character list with descriptions
  
User can:
  - Edit any section (returns to that step)
  - Confirm and create book
  
On confirm:
  → Create Book instance
  → Save using FileBasedStorageService
  → Clear wizard state
  → Navigate to book view
```

## UI Components

### BookCreationWizard

Main dialog component managing the wizard flow.

**Props:**
```typescript
interface BookCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (bookId: string) => void;
}
```

**Key Features:**
- Full-screen dialog for immersive experience
- Progress indicator showing current step
- Persistent state (saves to localStorage on changes)
- Confirmation on cancel if progress exists

### ConversationView

Chat-like interface for natural language interaction.

**Features:**
- Auto-scrolling message list
- Message bubbles with role-based styling
- Loading indicators for LLM processing
- Quick action buttons for common responses
- Text input with send button
- Support for rich content (images, code blocks)

**Message Types:**
- System: Wizard instructions and guidance
- User: User's input messages
- Assistant: LLM responses and suggestions

### StyleGallery

Visual style selection and refinement interface.

**Features:**
- Grid layout of style option cards
- Each card shows:
  - Generated sample image
  - Collapsible prompt text
  - Select button
- Selected style highlighted
- Refinement panel appears when style selected:
  - Large preview of selected image
  - Editable prompt text
  - Refinement conversation input
  - History of refinement iterations
  - Side-by-side comparison view

**Refinement Workflow:**
1. User selects initial style
2. Refinement panel opens
3. User types feedback (e.g., "more cartoonish")
4. System generates new image
5. New image appears alongside original
6. User can continue refining or confirm

### CharacterBuilder

Step-by-step character creation interface.

**Features:**
- Character counter (e.g., "Character 1 of 3")
- Form fields for basic info:
  - Name (required)
  - Role (e.g., "protagonist", "mentor")
  - Basic description (free text)
- LLM-generated detailed description
- Refinement conversation
- Character list showing completed characters
- Navigation between characters

### SummaryView

Final review before book creation.

**Features:**
- Organized sections:
  - Book Details (title, description, background)
  - Visual Style (sample image, style properties)
  - Characters (list with descriptions)
- Edit buttons for each section
- Prominent "Create Book" button
- Estimated storage size indicator

## Technical Considerations

### Image Generation

**Strategy:**
- Use existing `SceneImageGenerationService` for image generation
- Generate style samples at 512x512 or 768x768 for speed
- Use book's aspect ratio for final style confirmation
- Store generated images temporarily during wizard
- Clean up temporary images on wizard completion/cancellation

**Cost Management:**
- Limit initial style variations to 3-5 images
- Allow unlimited refinement iterations (user's choice)
- Show estimated cost/token usage (if applicable)
- Warn user before generating expensive operations

### LLM Integration

**Prompt Engineering:**
- Use structured prompts with clear JSON response formats
- Include conversation history for context
- Implement retry logic for parsing failures
- Fallback to manual input if LLM unavailable

**Response Parsing:**
- Robust JSON parsing with error handling
- Validation of required fields
- Graceful degradation if parsing fails
- User can always manually edit suggestions

### State Persistence

**localStorage Schema:**
```typescript
interface PersistedWizardState {
  version: number;
  timestamp: Date;
  state: WizardState;
  temporaryImages: string[]; // Image IDs to clean up
}
```

**Persistence Strategy:**
- Save state after each significant action
- Debounce saves during typing
- Include version for migration support
- Offer resume on wizard open
- Clear state on completion or explicit cancel

### Error Handling

**LLM Errors:**
- Network failures: Retry with exponential backoff
- Rate limits: Show wait time, allow manual input
- Invalid responses: Log error, allow manual editing
- Timeout: Cancel request, allow retry

**Image Generation Errors:**
- Failed generation: Show error, allow retry
- Invalid images: Skip and regenerate
- Storage errors: Warn user, continue without image

**User Experience:**
- Never block user progress on errors
- Always provide manual input fallback
- Clear error messages with actionable steps
- Preserve user's work even on errors

## File Structure

```
src/
├── components/
│   ├── BookCreationWizard/
│   │   ├── BookCreationWizard.tsx          # Main wizard dialog
│   │   ├── WizardProgress.tsx              # Step indicator
│   │   ├── ConversationView.tsx            # Chat interface
│   │   ├── MessageList.tsx                 # Message display
│   │   ├── MessageInput.tsx                # User input
│   │   ├── StyleGallery.tsx                # Style selection
│   │   ├── StyleImageCard.tsx              # Style option card
│   │   ├── StyleRefinementPanel.tsx        # Refinement interface
│   │   ├── CharacterBuilder.tsx            # Character creation
│   │   ├── SummaryView.tsx                 # Final review
│   │   └── index.ts                        # Exports
│   └── ...
├── services/
│   ├── BookCreationWizardService.ts        # Wizard orchestration
│   ├── WizardLLMService.ts                 # LLM integration
│   └── ...
├── hooks/
│   ├── useWizardState.ts                   # State management
│   ├── useWizardConversation.ts            # Conversation logic
│   ├── useStyleRefinement.ts               # Style refinement
│   └── ...
└── types/
    ├── Wizard.ts                           # Wizard type definitions
    └── ...
```

## Testing Strategy

### Unit Tests

**Services:**
- `BookCreationWizardService`: Mock LLM and image generation
- `WizardLLMService`: Test prompt generation and parsing
- State persistence: Test save/load/clear operations

**Hooks:**
- `useWizardState`: Test state transitions
- `useWizardConversation`: Test message handling
- `useStyleRefinement`: Test refinement workflow

### Integration Tests

**Wizard Flow:**
- Complete wizard flow from start to finish
- Resume from saved state
- Cancel with confirmation
- Error recovery scenarios

**Component Integration:**
- ConversationView with message handling
- StyleGallery with image generation
- CharacterBuilder with LLM integration

### Manual Testing

**User Experience:**
- Natural conversation flow
- Visual style refinement iterations
- Character creation workflow
- Summary and confirmation
- Error handling and recovery

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:**
   - Load wizard components only when opened
   - Defer image generation until needed
   - Lazy load LLM service

2. **Debouncing:**
   - Debounce state persistence (500ms)
   - Debounce prompt editing (1000ms)
   - Throttle scroll events

3. **Caching:**
   - Cache LLM responses for identical inputs
   - Cache generated images during session
   - Reuse style variations if user goes back

4. **Progressive Enhancement:**
   - Show UI immediately, load data async
   - Display partial results as they arrive
   - Stream LLM responses if supported

### Resource Management

**Memory:**
- Limit message history to last 50 messages
- Clean up temporary images on step completion
- Release image URLs when no longer displayed

**Network:**
- Batch LLM requests when possible
- Compress images before storage
- Cancel pending requests on navigation

## Accessibility

### Keyboard Navigation

- Tab through all interactive elements
- Enter to send messages
- Escape to close dialogs
- Arrow keys for gallery navigation

### Screen Readers

- Proper ARIA labels on all controls
- Announce message arrivals
- Describe image content
- Status updates for loading states

### Visual Accessibility

- High contrast mode support
- Sufficient color contrast (WCAG AA)
- Focus indicators on all interactive elements
- Scalable text (respects browser zoom)

## Future Enhancements

### Phase 2 Features

- **Templates:** Pre-configured book types (educational, fiction, etc.)
- **Import:** Start wizard from existing book or template
- **Collaboration:** Share wizard state with others
- **Advanced Style:** More granular style controls
- **Character Images:** Generate character images during wizard
- **Story Wizard:** Similar conversational flow for story creation

### Technical Improvements

- **Streaming:** Stream LLM responses for faster feedback
- **Offline:** Cache LLM responses for offline editing
- **Analytics:** Track wizard completion rates and drop-off points
- **A/B Testing:** Test different conversation flows
- **Localization:** Multi-language support

## Requirements Mapping

This design addresses all requirements from the requirements document:

- **Req 1 (Navigation):** BookCreationWizard with WizardProgress
- **Req 2 (Concept):** ConversationView + WizardLLMService
- **Req 3 (Style):** StyleGallery + StyleRefinementPanel
- **Req 4 (Characters):** CharacterBuilder + LLM integration
- **Req 5 (Conversation):** ConversationView with natural language
- **Req 6 (LLM):** WizardLLMService with structured prompts
- **Req 7 (Feedback):** Real-time previews in all components
- **Req 8 (Completion):** SummaryView with confirmation
- **Req 9 (Persistence):** useWizardState with localStorage
- **Req 10 (Accessibility):** ARIA labels, keyboard nav, high contrast

## Open Questions

1. **Image Generation Model:** Which model should be default for style samples? (Gemini, DALL-E, etc.)
2. **Cost Limits:** Should we implement hard limits on image generation count?
3. **Conversation Length:** How many messages before we summarize/compress history?
4. **Style Variations:** Should we allow user to request more than 5 initial options?
5. **Character Limit:** Should we enforce a maximum number of characters per book?

These questions should be answered during implementation based on user feedback and technical constraints.
