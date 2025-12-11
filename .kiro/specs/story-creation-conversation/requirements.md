# Requirements Document - Conversational Story Creation Wizard

## Introduction

Currently, creating a story within a book requires manually adding scenes one by one, configuring each scene's text panels, diagram panels, characters, and elements individually. This is time-consuming and doesn't leverage AI to help structure educational narratives.

**Goal:** Create a conversational, AI-assisted wizard that guides users through story creation with natural language interaction, intelligent scene generation, and automatic character/element integration from the parent book.

**Current State:**
- User clicks "New Story" → gets empty story with just title/description
- Must manually add each scene one by one
- Must manually configure text panels, diagram panels, characters per scene
- No AI assistance for narrative structure or scene planning
- No guidance on educational storytelling best practices

**Desired State:**
- User clicks "New Story (AI Wizard)" → enters conversational wizard
- AI guides user through defining story concept, learning objectives, and narrative arc
- LLM generates complete scene structure with text, diagrams, and character assignments
- User can refine individual scenes through conversation
- User gets a fully-populated story ready for image generation

**Scope:**
- Conversational wizard for new story creation within an existing book
- Focus on: story concept, learning objectives, scene generation, character assignment
- LLM integration for narrative structure and educational content
- Leverages book's existing characters, style, and background setup

## Glossary

- **Story**: A narrative within a book, consisting of multiple scenes that teach a concept
- **Scene**: A single page/panel with background image, text overlays, diagram overlays, and characters
- **Text Panel**: Narrative text displayed as an overlay on the scene image
- **Diagram Panel**: Educational diagram (code, math, flowchart) displayed as an overlay
- **Learning Objective**: The educational goal the story aims to achieve
- **Narrative Arc**: The story structure (introduction, rising action, climax, resolution)
- **Character Assignment**: Selecting which book characters appear in each scene
- **Element**: Reusable visual element that can appear across scenes (props, objects)

## Requirements

### Requirement 1: Wizard Entry and Context

**User Story:** As a user, I want to start a story creation wizard that understands my book's context, so that generated content fits my existing style and characters.

#### Acceptance Criteria

1. WHEN a user clicks "New Story (AI Wizard)" THEN the system SHALL open the conversational story creation wizard
2. WHEN the wizard opens THEN the system SHALL load the active book's context (title, description, background, style, characters)
3. WHEN the wizard opens THEN the system SHALL display a welcome message explaining the process
4. WHEN the wizard displays book context THEN the system SHALL show available characters with their descriptions
5. WHEN the user cancels the wizard THEN the system SHALL confirm before discarding progress

### Requirement 2: Story Concept and Learning Objectives

**User Story:** As a user, I want to describe my story concept and learning objectives in natural language, so that the AI can help structure appropriate content.

#### Acceptance Criteria

1. WHEN the wizard starts THEN the system SHALL prompt the user to describe their story concept
2. WHEN the user describes their concept THEN the system SHALL ask about specific learning objectives
3. WHEN learning objectives are provided THEN the system SHALL analyze them for clarity and scope
4. WHEN the user submits their concept THEN the system SHALL send it to the LLM with book context
5. WHEN the LLM responds THEN the system SHALL suggest a story title, description, and recommended scene count
6. WHEN suggestions are shown THEN the system SHALL allow the user to accept, modify, or regenerate them

### Requirement 3: Narrative Arc Planning

**User Story:** As a user, I want the AI to help me plan a narrative arc that effectively teaches my learning objectives through storytelling.

#### Acceptance Criteria

1. WHEN learning objectives are confirmed THEN the system SHALL generate a narrative arc outline
2. WHEN the narrative arc is generated THEN the system SHALL show scene-by-scene summary (intro, development, conclusion)
3. WHEN showing the outline THEN the system SHALL indicate which learning objectives each scene addresses
4. WHEN showing the outline THEN the system SHALL suggest which characters are appropriate for each scene
5. WHEN the user wants changes THEN the system SHALL allow conversational refinement of the arc
6. WHEN the user confirms the arc THEN the system SHALL proceed to detailed scene generation

### Requirement 4: Scene Generation

**User Story:** As a user, I want the AI to generate complete scenes with text panels, diagram content, and character assignments based on the narrative arc.

#### Acceptance Criteria

1. WHEN the narrative arc is confirmed THEN the system SHALL generate detailed content for each scene
2. WHEN generating a scene THEN the system SHALL create:
   - Scene title
   - Scene description (for image generation)
   - Text panel content (narrative text with speaker attribution)
   - Diagram panel content (if applicable - code, math, flowcharts)
   - Character list (selected from book's characters)
   - Element list (props/objects needed)
3. WHEN scenes are generated THEN the system SHALL display them for review
4. WHEN showing generated scenes THEN the system SHALL allow scene-by-scene refinement
5. WHEN the user requests changes THEN the system SHALL regenerate specific scenes while maintaining narrative coherence
6. WHEN all scenes are approved THEN the system SHALL proceed to summary

### Requirement 5: Character and Element Integration

**User Story:** As a user, I want the wizard to intelligently use my book's characters and suggest new elements, so that my story is visually consistent.

#### Acceptance Criteria

1. WHEN generating scenes THEN the system SHALL only assign characters that exist in the book
2. WHEN a scene needs a character THEN the system SHALL select the most appropriate based on description and role
3. WHEN generating dialogue THEN the system SHALL match character voice/personality from their description
4. WHEN a scene needs elements THEN the system SHALL suggest elements with descriptions
5. WHEN elements are suggested THEN the system SHALL allow the user to approve, modify, or remove them
6. WHEN the story is complete THEN the system SHALL add approved elements to the story's element list

### Requirement 6: Diagram Content Generation

**User Story:** As a user, I want the AI to generate appropriate diagram content (code, math, pseudocode) that supports the learning objectives.

#### Acceptance Criteria

1. WHEN a scene teaches code concepts THEN the system SHALL generate syntactically correct code snippets
2. WHEN a scene teaches math concepts THEN the system SHALL generate properly formatted equations
3. WHEN a scene teaches algorithms THEN the system SHALL generate step-by-step pseudocode
4. WHEN generating diagrams THEN the system SHALL match complexity to the target audience
5. WHEN showing diagram content THEN the system SHALL allow direct editing
6. WHEN the user modifies diagrams THEN the system SHALL validate syntax (for code) where possible

### Requirement 7: Conversational Refinement

**User Story:** As a user, I want to refine any part of the generated story through natural conversation, without restarting the process.

#### Acceptance Criteria

1. WHEN the user asks to change something THEN the system SHALL understand context from conversation history
2. WHEN refining a scene THEN the system SHALL maintain consistency with other scenes
3. WHEN the user says "make it shorter" or "add more detail" THEN the system SHALL adjust appropriately
4. WHEN the user wants to add/remove scenes THEN the system SHALL update the narrative arc accordingly
5. WHEN changes affect multiple scenes THEN the system SHALL offer to regenerate affected scenes
6. WHEN the user is stuck THEN the system SHALL provide helpful suggestions and examples

### Requirement 8: Story Preview and Summary

**User Story:** As a user, I want to see a complete preview of my story before creating it, so that I can make final adjustments.

#### Acceptance Criteria

1. WHEN all scenes are complete THEN the system SHALL display a comprehensive summary
2. WHEN the summary is shown THEN the system SHALL display:
   - Story title and description
   - Scene count with titles
   - Characters used across all scenes
   - Elements defined for the story
   - Learning objectives coverage map
3. WHEN the summary is shown THEN the system SHALL allow editing any section
4. WHEN the user clicks a section to edit THEN the system SHALL return to that step
5. WHEN the user confirms THEN the system SHALL create the story with all content

### Requirement 9: Story Creation and Integration

**User Story:** As a user, I want the wizard to create a properly formatted story that integrates seamlessly with my book.

#### Acceptance Criteria

1. WHEN the user confirms the story THEN the system SHALL create a Story object with all scenes
2. WHEN creating the story THEN the system SHALL use the book's existing style settings
3. WHEN creating scenes THEN the system SHALL properly format text panels and diagram panels
4. WHEN the story is created THEN the system SHALL add it to the active book
5. WHEN the story is created THEN the system SHALL navigate to the story editor
6. WHEN the story is created THEN the system SHALL show a success message with next steps

### Requirement 10: Progress Persistence

**User Story:** As a user, I want my progress saved if I close the wizard, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN the user makes progress THEN the system SHALL save wizard state to local storage
2. WHEN the user closes the wizard THEN the system SHALL preserve their progress
3. WHEN the user reopens the wizard THEN the system SHALL offer to resume from where they left off
4. WHEN resuming THEN the system SHALL restore all conversation history and generated content
5. WHEN the user completes or cancels THEN the system SHALL clear the saved wizard state

### Requirement 11: LLM Integration

**User Story:** As a developer, I want the wizard to use LLM capabilities intelligently for educational content generation.

#### Acceptance Criteria

1. WHEN calling the LLM THEN the system SHALL include full book context (style, characters, background)
2. WHEN generating scenes THEN the system SHALL use structured prompts with clear output formats
3. WHEN the LLM responds THEN the system SHALL parse responses into structured scene data
4. WHEN LLM calls fail THEN the system SHALL handle errors gracefully and allow manual input
5. WHEN generating educational content THEN the system SHALL validate accuracy where possible
6. WHEN the user refines content THEN the system SHALL send refinement requests with full context

### Requirement 12: Accessibility and UX

**User Story:** As a user, I want the wizard to be easy to use and accessible, so that I can focus on creating great educational content.

#### Acceptance Criteria

1. WHEN displaying content THEN the system SHALL use clear, conversational language
2. WHEN showing options THEN the system SHALL provide quick-select buttons alongside text input
3. WHEN showing scene previews THEN the system SHALL use expandable/collapsible sections
4. WHEN errors occur THEN the system SHALL explain what went wrong and how to fix it
5. WHEN the wizard has many scenes THEN the system SHALL provide easy navigation between them
6. WHEN the user is unfamiliar THEN the system SHALL provide example prompts and templates

## Out of Scope

The following features are explicitly OUT OF SCOPE for this initial implementation:

- ❌ Image generation during wizard (images generated after story creation)
- ❌ Character creation within story wizard (use book's existing characters)
- ❌ Multi-story generation (one story at a time)
- ❌ Import from external documents during wizard
- ❌ Collaborative story creation
- ❌ Voice input for conversation
- ❌ Real-time scene layout editing (use existing layout editor after creation)

These can be added later as enhancements.

## User Flow Summary

```
1. Entry
   └── Click "New Story (AI Wizard)"
   └── Load book context (characters, style, background)
   └── Display welcome with book summary

2. Concept Phase
   └── User describes story concept
   └── User specifies learning objectives
   └── AI suggests title, description, scene count
   └── User confirms or refines

3. Planning Phase
   └── AI generates narrative arc outline
   └── Shows scene summaries with character suggestions
   └── User refines arc through conversation
   └── User confirms structure

4. Generation Phase
   └── AI generates each scene in detail
   └── For each scene: title, description, text, diagrams, characters
   └── User reviews and refines each scene
   └── User can request regeneration or manual edits

5. Review Phase
   └── Display complete story summary
   └── Show learning objectives coverage
   └── Allow final edits
   └── User confirms creation

6. Completion
   └── Create story in book
   └── Navigate to story editor
   └── Show success with next steps (generate images)
```

## Example Interaction

**Wizard:** "Welcome to the Story Creation Wizard! I see you're creating a story for 'The Pump Station Problem' - a book about linear algebra in a steampunk setting. You have 5 characters available: Professor Investogator, Carl, Karla, Pietor, and Petra. What story would you like to create?"

**User:** "I want to teach how to solve systems of linear equations using the pump station as a real-world example. The students need to figure out the right flow rates for 3 interconnected pipes."

**Wizard:** "Great concept! For teaching systems of linear equations, I suggest:

**Title:** 'Balancing the Flow'  
**Description:** When the pump station's pipes fall out of balance, our young scientists must use systems of equations to find the perfect flow rates.

**Learning Objectives:**
1. Understand how real-world problems become equations
2. Set up a system of 3 linear equations
3. Solve using substitution or elimination
4. Verify solutions in the original context

**Recommended scenes:** 8-10 scenes

Does this capture what you're looking for, or would you like to adjust anything?"

**User:** "Perfect! Let's go with 8 scenes."

**Wizard:** "Here's my suggested narrative arc:

**Scene 1 (Introduction):** Nighttime alarm - pump station failing  
**Scene 2 (Problem Setup):** Professor explains the 3-pipe system  
**Scene 3 (Math Translation):** Carl and Karla identify the variables  
**Scene 4 (Equation Building):** Team writes the first equation  
**Scene 5 (System Formation):** Complete system of 3 equations  
**Scene 6 (Solution Method):** Pietor demonstrates elimination  
**Scene 7 (Calculation):** Petra solves for each variable  
**Scene 8 (Resolution):** Apply solution, station balanced!

Each scene will include dialogue, diagrams, and the appropriate characters. Ready to generate the detailed scenes?"

