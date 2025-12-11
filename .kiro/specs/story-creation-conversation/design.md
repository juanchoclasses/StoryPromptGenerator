# Design Document - Conversational Story Creation Wizard

## Overview

This document describes the architecture and implementation design for the conversational story creation wizard. The wizard guides users through creating a new story within an existing book using natural language interaction, AI-powered scene generation, and intelligent character/element integration.

## Architecture

### Component Hierarchy

```
StoryCreationWizard (Main Dialog)
├── WizardProgress (Step indicator)
├── BookContextPanel (Shows book info, characters)
│   ├── BookSummary
│   └── CharacterList
├── ConversationView (Chat interface - reuse from BookCreationWizard)
│   ├── MessageList
│   │   ├── SystemMessage
│   │   ├── UserMessage
│   │   └── AssistantMessage
│   └── MessageInput
├── NarrativeArcView (Story structure overview)
│   ├── ArcTimeline
│   └── SceneOutlineCard[]
├── SceneGenerationView (Detailed scene editing)
│   ├── SceneNavigator
│   ├── SceneDetailCard
│   │   ├── SceneHeader (title, description)
│   │   ├── TextPanelEditor
│   │   ├── DiagramPanelEditor
│   │   ├── CharacterSelector
│   │   └── ElementSelector
│   └── SceneRefinementChat
└── StorySummaryView (Final review)
    ├── StoryDetails
    ├── SceneList
    ├── CharacterUsageMap
    ├── ElementList
    ├── LearningObjectivesCoverage
    └── ConfirmButton
```

### State Management

The wizard uses a centralized state machine with the following structure:

```typescript
interface StoryWizardState {
  // Current step
  currentStep: StoryWizardStep;
  
  // Book context (loaded on wizard open)
  bookContext: {
    bookId: string;
    title: string;
    description: string;
    backgroundSetup: string;
    style: BookStyle;
    characters: Character[];
  };
  
  // Conversation history
  messages: Message[];
  
  // Story data being built
  storyData: {
    concept?: string;
    learningObjectives?: string[];
    title?: string;
    description?: string;
    backgroundSetup?: string;
    narrativeArc?: NarrativeArc;
    scenes: GeneratedScene[];
    elements: Element[];
  };
  
  // Current scene being edited (for scene-by-scene refinement)
  activeSceneIndex: number | null;
  
  // UI state
  isProcessing: boolean;
  error: string | null;
}

enum StoryWizardStep {
  WELCOME = 'welcome',
  CONCEPT = 'concept',
  PLANNING = 'planning',
  GENERATION = 'generation',
  SUMMARY = 'summary'
}

interface NarrativeArc {
  totalScenes: number;
  sceneOutlines: SceneOutline[];
}

interface SceneOutline {
  index: number;
  title: string;
  purpose: string; // intro, development, climax, resolution
  learningObjectives: string[]; // Which objectives this scene addresses
  suggestedCharacters: string[]; // Character names
  hasDiagram: boolean;
  diagramType?: 'code' | 'math' | 'pseudocode' | 'flowchart';
}

interface GeneratedScene {
  id: string;
  title: string;
  description: string; // For image generation prompt
  
  // Text panel content
  textPanels: TextPanel[];
  
  // Diagram panel content
  diagramPanels: DiagramPanel[];
  
  // Characters in this scene
  characters: string[]; // Character names from book
  
  // Elements in this scene
  elements: string[]; // Element names
  
  // Generation metadata
  isApproved: boolean;
  refinementHistory: string[];
}

interface TextPanel {
  id: string;
  content: string;
  speaker?: string; // Character name for dialogue
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface DiagramPanel {
  id: string;
  type: 'code' | 'math' | 'pseudocode' | 'text';
  content: string;
  language?: string; // For code: 'python', 'javascript', etc.
  title?: string;
}

interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'suggestion' | 'question' | 'confirmation' | 'scene_preview';
    sceneIndex?: number;
    data?: any;
  };
}
```

### Service Layer

#### StoryCreationWizardService

Orchestrates the story wizard workflow and coordinates between LLM and book services.

```typescript
class StoryCreationWizardService {
  // Context loading
  static async loadBookContext(bookId: string): Promise<BookContext>;
  
  // Concept phase
  static async analyzeConcept(
    concept: string, 
    bookContext: BookContext
  ): Promise<ConceptAnalysis>;
  
  static async generateStoryMetadata(
    concept: string,
    learningObjectives: string[],
    bookContext: BookContext
  ): Promise<StoryMetadata>;
  
  // Planning phase
  static async generateNarrativeArc(
    storyMetadata: StoryMetadata,
    bookContext: BookContext
  ): Promise<NarrativeArc>;
  
  static async refineNarrativeArc(
    currentArc: NarrativeArc,
    feedback: string,
    bookContext: BookContext
  ): Promise<NarrativeArc>;
  
  // Generation phase
  static async generateScene(
    sceneOutline: SceneOutline,
    storyContext: StoryContext,
    bookContext: BookContext
  ): Promise<GeneratedScene>;
  
  static async regenerateScene(
    currentScene: GeneratedScene,
    feedback: string,
    storyContext: StoryContext,
    bookContext: BookContext
  ): Promise<GeneratedScene>;
  
  static async refineSceneContent(
    scene: GeneratedScene,
    section: 'text' | 'diagram' | 'characters',
    feedback: string,
    bookContext: BookContext
  ): Promise<GeneratedScene>;
  
  // Element management
  static async suggestElements(
    scenes: GeneratedScene[],
    bookContext: BookContext
  ): Promise<Element[]>;
  
  // Story creation
  static async createStory(
    storyData: StoryData,
    bookId: string
  ): Promise<Story>;
  
  // Persistence
  static async saveWizardState(state: StoryWizardState): Promise<void>;
  static async loadWizardState(): Promise<StoryWizardState | null>;
  static async clearWizardState(): Promise<void>;
}

interface ConceptAnalysis {
  themes: string[];
  suggestedLearningObjectives: string[];
  targetAudience: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  suggestedSceneCount: number;
}

interface StoryMetadata {
  title: string;
  description: string;
  backgroundSetup: string;
  learningObjectives: string[];
  estimatedSceneCount: number;
}

interface StoryContext {
  title: string;
  description: string;
  learningObjectives: string[];
  narrativeArc: NarrativeArc;
  previousScenes: GeneratedScene[]; // For context continuity
}
```

#### StoryLLMService

Extends LLM capabilities for story-specific tasks.

```typescript
class StoryLLMService {
  // Prompt generation
  static buildConceptAnalysisPrompt(
    concept: string,
    bookContext: BookContext
  ): string;
  
  static buildNarrativeArcPrompt(
    storyMetadata: StoryMetadata,
    bookContext: BookContext
  ): string;
  
  static buildSceneGenerationPrompt(
    sceneOutline: SceneOutline,
    storyContext: StoryContext,
    bookContext: BookContext
  ): string;
  
  static buildSceneRefinementPrompt(
    scene: GeneratedScene,
    feedback: string,
    storyContext: StoryContext,
    bookContext: BookContext
  ): string;
  
  // Response parsing
  static parseConceptResponse(response: string): ConceptAnalysis;
  static parseNarrativeArcResponse(response: string): NarrativeArc;
  static parseSceneResponse(response: string): GeneratedScene;
  
  // Conversation management
  static async sendMessage(
    message: string,
    conversationHistory: Message[],
    context: StoryWizardState
  ): Promise<string>;
}
```

## Data Flow

### 1. Wizard Entry

```
User clicks "New Story (AI Wizard)"
  → Get active book ID
  → Load book context (title, description, style, characters)
  → Check for saved wizard state
  → If found, offer to resume
  → Initialize wizard state with book context
  → Display welcome message with book summary
```

### 2. Concept Phase

```
Display book context (characters available, style, background)
  → User describes story concept
  → Send to LLM for analysis with book context
  → Display loading indicator
  → LLM returns concept analysis + suggestions
  → Display suggested learning objectives
  → User confirms/modifies objectives
  → Generate story metadata (title, description)
  → User confirms metadata
  → Move to planning phase
```

**Concept Analysis LLM Prompt:**
```
System: You are helping create an educational story for a visual book...

Book Context:
- Title: [book title]
- Description: [book description]
- Background: [background setup]
- Visual Style: [style description]
- Available Characters: [character list with descriptions]

User's Story Concept: [user input]

Task: Analyze this concept and suggest:
1. Clear learning objectives (3-5 specific, measurable goals)
2. Recommended scene count (typically 6-12 for a complete story)
3. Story title that fits the book's theme
4. Story description for the book's context
5. How to leverage the available characters

Respond in JSON format:
{
  "learningObjectives": [...],
  "suggestedSceneCount": N,
  "title": "...",
  "description": "...",
  "characterUsageSuggestions": {...}
}
```

### 3. Planning Phase

```
User confirms story metadata
  → Send to LLM for narrative arc generation
  → LLM generates scene-by-scene outline
  → Display narrative arc timeline
  → For each scene outline show:
      - Title and purpose
      - Learning objectives addressed
      - Suggested characters
      - Whether it needs diagrams
  → User can request changes
  → Refinement through conversation
  → User confirms arc
  → Move to generation phase
```

**Narrative Arc LLM Prompt:**
```
System: You are planning an educational story with a clear narrative arc...

Story Context:
- Title: [story title]
- Description: [story description]
- Learning Objectives: [objectives]
- Scene Count: [N]

Book Context:
- Background: [background setup]
- Characters: [character list]
- Visual Style: [style - affects scene descriptions]

Task: Create a narrative arc with [N] scenes. For each scene provide:
1. Title (short, descriptive)
2. Purpose (introduction/development/climax/resolution)
3. Which learning objectives it addresses
4. Which characters should appear
5. Whether a diagram is needed and what type
6. Brief description of what happens

Ensure:
- Natural story progression
- All learning objectives are covered
- Characters are used consistently
- Diagram complexity matches audience level

Respond in JSON format:
{
  "sceneOutlines": [
    {
      "index": 0,
      "title": "...",
      "purpose": "introduction",
      "learningObjectives": ["objective 1"],
      "suggestedCharacters": ["Character A", "Character B"],
      "hasDiagram": false,
      "summary": "..."
    },
    ...
  ]
}
```

### 4. Generation Phase

```
For each scene in narrative arc:
  → Generate detailed scene content
  → Display scene preview:
      - Title and description
      - Text panels with dialogue
      - Diagram panels (if any)
      - Character assignments
  → User can:
      - Approve scene
      - Request refinement via conversation
      - Edit content directly
  → Store approved scenes
  → Show progress through all scenes
  
Element collection:
  → After all scenes generated
  → Analyze scenes for needed elements
  → Present suggested elements
  → User approves/modifies
  → Move to summary
```

**Scene Generation LLM Prompt:**
```
System: You are generating a detailed scene for an educational visual story...

Story Context:
- Title: [story title]
- Learning Objectives: [objectives]
- Previous Scenes: [summaries of scenes 1 through N-1]

Scene Outline:
- Index: [N]
- Title: [scene title]
- Purpose: [purpose]
- Learning Objectives: [objectives for this scene]
- Characters: [suggested characters]
- Has Diagram: [yes/no]
- Diagram Type: [code/math/pseudocode if applicable]

Book Context:
- Visual Style: [style description]
- Characters: [full character descriptions]
- Background: [background setup]

Task: Generate complete scene content:
1. Scene description (for image generation - describe the visual scene)
2. Text panels (narrative and dialogue)
3. Diagram panels (if needed - actual code/math content)
4. Final character list

For text panels:
- Include speaker attribution for dialogue
- Keep each panel concise (2-4 sentences)
- Maintain character voice based on descriptions

For diagram panels:
- Generate syntactically correct content
- Match complexity to learning objectives
- Include brief explanatory comments

Respond in JSON format:
{
  "title": "...",
  "description": "...",
  "textPanels": [
    { "content": "...", "speaker": "Character Name" },
    { "content": "...", "speaker": null }
  ],
  "diagramPanels": [
    { "type": "code", "language": "python", "content": "...", "title": "..." }
  ],
  "characters": ["Character A", "Character B"],
  "elements": ["lamp", "blackboard"]
}
```

### 5. Summary & Completion

```
Display comprehensive summary:
  - Story title, description
  - Scene list with titles
  - Characters used (with usage count)
  - Elements defined
  - Learning objectives coverage matrix
  
User can:
  - Edit any section (returns to that step)
  - Confirm and create story
  
On confirm:
  → Transform GeneratedScenes to Scene format
  → Create Story object
  → Add elements to story
  → Save story to book
  → Clear wizard state
  → Navigate to story editor
  → Show success with "Generate Images" prompt
```

## UI Components

### StoryCreationWizard

Main dialog component managing the story wizard flow.

**Props:**
```typescript
interface StoryCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (storyId: string) => void;
  bookId: string;
}
```

**Key Features:**
- Full-screen dialog for immersive experience
- Book context sidebar (collapsible)
- Progress indicator showing current step
- Persistent state (saves to localStorage on changes)
- Confirmation on cancel if progress exists

### BookContextPanel

Displays the active book's context for reference during story creation.

**Features:**
- Book title and description
- Visual style summary
- Character cards with descriptions
- Collapsible to maximize workspace
- Character quick-reference during scene editing

### NarrativeArcView

Visual representation of the story structure.

**Features:**
- Timeline visualization of scenes
- Color-coded by scene purpose (intro, development, etc.)
- Learning objectives mapping
- Drag-to-reorder scenes (optional)
- Click to jump to scene in generation phase
- Expand/collapse scene details

### SceneGenerationView

Detailed view for editing individual scenes.

**Features:**
- Scene navigator (prev/next, jump to scene)
- Progress indicator (Scene 3 of 8)
- Collapsible sections:
  - Scene description (for image prompt)
  - Text panels (editable, reorderable)
  - Diagram panels (syntax-highlighted editor)
  - Characters (checkboxes from book characters)
  - Elements (add/remove)
- Refinement chat input
- Approve/Regenerate buttons
- Copy prompt button (for scene description)

### TextPanelEditor

Editor for scene narrative and dialogue.

**Features:**
- Rich text input
- Speaker dropdown (from scene's characters + Narrator)
- Position selector (optional)
- Add/remove panels
- Reorder panels
- Preview formatting

### DiagramPanelEditor

Editor for code, math, and pseudocode content.

**Features:**
- Syntax highlighting (CodeMirror or Monaco)
- Language selector for code
- Math preview for equations
- Title/caption field
- Validate syntax button
- Format/prettify button

### StorySummaryView

Final review before story creation.

**Features:**
- Organized sections matching wizard steps
- Edit buttons returning to specific steps
- Learning objectives checklist (which scenes cover what)
- Character usage summary
- Element list with edit capability
- Prominent "Create Story" button
- Loading state during creation
- Success state with next steps

## Technical Considerations

### Reusing Book Wizard Components

Several components can be reused from the Book Creation Wizard:

**Reusable as-is:**
- `MessageList`
- `MessageInput`
- `SystemMessage`, `UserMessage`, `AssistantMessage`
- `WizardProgress` (with different steps)

**Needs adaptation:**
- `ConversationView` - Add scene context sidebar
- `SummaryView` - Different sections for story

**New components needed:**
- `BookContextPanel`
- `NarrativeArcView`
- `SceneGenerationView`
- `SceneDetailCard`
- `TextPanelEditor`
- `DiagramPanelEditor`

### Scene Data Transformation

Transform wizard's `GeneratedScene` to the app's `Scene` format on creation:

```typescript
function transformToScene(generated: GeneratedScene, index: number): Scene {
  return {
    id: crypto.randomUUID(),
    title: generated.title,
    description: generated.description,
    sceneNumber: index + 1,
    
    // Transform text panels
    textPanels: generated.textPanels.map(tp => ({
      id: crypto.randomUUID(),
      content: tp.content,
      speaker: tp.speaker,
      style: { position: tp.position || 'bottom' }
    })),
    
    // Transform diagram panels
    diagramPanels: generated.diagramPanels.map(dp => ({
      id: crypto.randomUUID(),
      type: dp.type,
      content: dp.content,
      language: dp.language,
      title: dp.title
    })),
    
    // Character names (will be matched to book characters)
    characters: generated.characters,
    
    // Elements
    elements: generated.elements,
    
    // Image generation (empty initially)
    imageHistory: [],
    
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
```

### LLM Context Management

**Challenge:** LLM context window limits with many scenes.

**Solution:**
- For scene generation: Include full context for current scene, summaries for previous scenes
- For refinement: Include current scene detail + adjacent scenes summary
- Compress older conversation messages to summaries
- Track token usage and warn user if approaching limits

### Diagram Content Validation

**Code validation:**
- Use lightweight syntax checkers (e.g., esprima for JS, basic Python parser)
- Don't block on validation errors, just warn
- Offer "format code" button

**Math validation:**
- Basic LaTeX/KaTeX syntax check
- Preview rendering to catch errors visually

### State Persistence

**localStorage Schema:**
```typescript
interface PersistedStoryWizardState {
  version: number;
  timestamp: Date;
  bookId: string;
  state: StoryWizardState;
}
```

**Persistence Strategy:**
- Save state after each significant action
- Debounce saves during typing (500ms)
- Include version for migration support
- Validate bookId still exists on resume
- Clear state on completion or explicit cancel

### Error Handling

**LLM Errors:**
- Network failures: Retry with exponential backoff
- Rate limits: Show wait time, allow manual input
- Invalid responses: Log error, show raw response, allow manual editing
- Timeout: Cancel request, allow retry or skip to manual

**Scene Generation Errors:**
- Failed generation: Show error, allow retry or manual entry
- Partial generation: Show what was generated, allow completion
- Inconsistent content: Warn but allow user to proceed

**Story Creation Errors:**
- Validation failures: Show specific errors, allow fixes
- Save failures: Retry, offer export as backup

## File Structure

```
src/
├── components/
│   ├── StoryCreationWizard/
│   │   ├── StoryCreationWizard.tsx      # Main wizard dialog
│   │   ├── BookContextPanel.tsx          # Book info sidebar
│   │   ├── NarrativeArcView.tsx          # Story structure view
│   │   ├── SceneGenerationView.tsx       # Scene editing view
│   │   ├── SceneDetailCard.tsx           # Individual scene card
│   │   ├── SceneNavigator.tsx            # Prev/next navigation
│   │   ├── TextPanelEditor.tsx           # Text panel editing
│   │   ├── DiagramPanelEditor.tsx        # Diagram/code editing
│   │   ├── StorySummaryView.tsx          # Final review
│   │   ├── LearningObjectivesMap.tsx     # Objectives coverage
│   │   └── index.ts                      # Exports
│   └── BookCreationWizard/               # Reuse components from here
│       ├── ConversationView.tsx
│       ├── MessageList.tsx
│       ├── MessageInput.tsx
│       ├── WizardProgress.tsx
│       └── ...
├── services/
│   ├── StoryCreationWizardService.ts     # Wizard orchestration
│   ├── StoryLLMService.ts                # LLM integration
│   └── ...
├── hooks/
│   ├── useStoryWizardState.ts            # State management
│   ├── useStoryWizardConversation.ts     # Conversation logic
│   ├── useSceneGeneration.ts             # Scene generation
│   └── ...
└── types/
    ├── StoryWizard.ts                    # Wizard type definitions
    └── ...
```

## Testing Strategy

### Unit Tests

**Services:**
- `StoryCreationWizardService`: Mock LLM, test all generation methods
- `StoryLLMService`: Test prompt generation and parsing
- Scene transformation: Test GeneratedScene → Scene conversion

**Hooks:**
- `useStoryWizardState`: Test state transitions
- `useStoryWizardConversation`: Test message handling
- `useSceneGeneration`: Test generation workflow

### Integration Tests

**Wizard Flow:**
- Complete wizard flow from start to finish
- Resume from saved state
- Cancel with confirmation
- Error recovery scenarios
- Scene refinement iterations

**Component Integration:**
- NarrativeArcView with scene navigation
- SceneGenerationView with editors
- BookContextPanel with character selection

### Manual Testing

**User Experience:**
- Natural conversation flow
- Scene generation quality
- Diagram content accuracy
- Character consistency across scenes
- Navigation between scenes
- Summary and confirmation

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:**
   - Load wizard components only when opened
   - Defer scene content until viewed
   - Lazy load code editors

2. **Debouncing:**
   - Debounce state persistence (500ms)
   - Debounce text editing (1000ms)
   - Throttle scroll events

3. **Caching:**
   - Cache LLM responses for identical inputs
   - Cache parsed scene content
   - Reuse narrative arc if user goes back

4. **Progressive Generation:**
   - Generate scenes one at a time
   - Show progress during batch operations
   - Allow viewing completed scenes while others generate

### Resource Management

**Memory:**
- Limit conversation history to last 30 messages
- Summarize old messages for context
- Clean up editor instances when switching scenes

**Network:**
- Batch LLM requests where possible
- Cancel pending requests on navigation
- Implement request deduplication

## Accessibility

### Keyboard Navigation

- Tab through all interactive elements
- Enter to send messages
- Arrow keys for scene navigation
- Escape to close dialogs
- Shortcuts for common actions (Ctrl+Enter to approve scene)

### Screen Readers

- Proper ARIA labels on all controls
- Announce scene changes
- Announce generation progress
- Describe diagram content

### Visual Accessibility

- High contrast mode support
- Sufficient color contrast (WCAG AA)
- Focus indicators on all interactive elements
- Scalable text (respects browser zoom)

## Future Enhancements

### Phase 2 Features

- **Templates:** Pre-built narrative arcs for common educational patterns
- **Scene Cloning:** Copy structure from existing stories
- **Batch Refinement:** Refine multiple scenes at once
- **Character Dialogue Styles:** AI learns character voice from examples
- **Export to Outline:** Export narrative arc as planning document
- **Collaborative Editing:** Multiple users refine simultaneously

### Technical Improvements

- **Streaming:** Stream scene generation for faster feedback
- **Offline:** Cache LLM responses for offline editing
- **Analytics:** Track generation quality and user refinement patterns
- **A/B Testing:** Test different prompts for better results
- **Custom Models:** Allow users to specify preferred LLM

## Requirements Mapping

This design addresses all requirements from the requirements document:

- **Req 1 (Entry & Context):** StoryCreationWizard with BookContextPanel
- **Req 2 (Concept & Objectives):** ConversationView + ConceptAnalysis
- **Req 3 (Narrative Arc):** NarrativeArcView with refinement
- **Req 4 (Scene Generation):** SceneGenerationView + editors
- **Req 5 (Character Integration):** BookContextPanel + CharacterSelector
- **Req 6 (Diagram Generation):** DiagramPanelEditor + validation
- **Req 7 (Refinement):** SceneRefinementChat + conversation
- **Req 8 (Preview & Summary):** StorySummaryView
- **Req 9 (Creation & Integration):** Scene transformation + BookService
- **Req 10 (Persistence):** useStoryWizardState with localStorage
- **Req 11 (LLM Integration):** StoryLLMService with structured prompts
- **Req 12 (Accessibility):** ARIA labels, keyboard nav, high contrast

## Open Questions

1. **Scene Count Limits:** Should we enforce a maximum number of scenes? (Suggested: 20)
2. **Diagram Complexity:** How complex should generated diagrams be? User preference or auto-detect?
3. **Character Voice:** Should we analyze existing stories to learn character dialogue patterns?
4. **Batch vs Sequential:** Should scenes generate all at once or one at a time with approval?
5. **Element Images:** Should we prompt user to generate element images after story creation?
6. **Layout Integration:** Should wizard suggest layouts, or always use book/story defaults?

These questions should be answered during implementation based on user feedback and technical constraints.

