# Requirements Document - Conversational Book Creation Wizard

## Introduction

Currently, creating a new book requires manually filling out forms and navigating multiple screens. This creates friction and doesn't guide users through best practices for defining their book's style and characters.

**Goal:** Create a conversational, AI-assisted wizard that guides users through book creation with natural language interaction, intelligent suggestions, and real-time feedback.

**Current State:**
- User clicks "New Book" → gets empty book with default settings
- Must manually configure style, characters, and other settings
- No guidance on best practices
- No AI assistance for character development

**Desired State:**
- User clicks "New Book" → enters conversational wizard
- AI guides user through defining book concept, style, and characters
- LLM provides suggestions and refinements
- User gets a fully-configured book ready for story creation

**Scope:**
- Conversational wizard for new book creation
- Focus on: book concept, visual style, and character definition
- LLM integration for suggestions and refinements
- Story wizard is out of scope (separate feature)

## Glossary

- **Wizard**: A multi-step guided interface that walks users through a process
- **Conversational UI**: Chat-like interface where user and system exchange messages
- **LLM**: Large Language Model (e.g., Google Gemini) used for AI assistance
- **Book Style**: Visual style settings including art style, color palette, mood, and panel configuration
- **Character Profile**: Name, description, visual appearance, and role in the story
- **Book Concept**: High-level description of what the book is about

## Requirements

### Requirement 1: Wizard Entry and Navigation

**User Story:** As a user, I want to start a conversational wizard when creating a new book, so that I'm guided through the setup process.

#### Acceptance Criteria

1. WHEN a user clicks "New Book" THEN the system SHALL open the conversational book creation wizard
2. WHEN the wizard opens THEN the system SHALL display a welcome message explaining the process
3. WHEN the user is in the wizard THEN the system SHALL show progress indicators for each step
4. WHEN the user completes a step THEN the system SHALL allow navigation back to previous steps
5. WHEN the user cancels the wizard THEN the system SHALL confirm before discarding progress

### Requirement 2: Book Concept Definition

**User Story:** As a user, I want to describe my book concept in natural language, so that the AI can help me refine it.

#### Acceptance Criteria

1. WHEN the wizard starts THEN the system SHALL prompt the user to describe their book concept
2. WHEN the user enters a book concept THEN the system SHALL accept free-form text input
3. WHEN the user submits their concept THEN the system SHALL send it to the LLM for analysis
4. WHEN the LLM responds THEN the system SHALL display suggestions for title, description, and background setup
5. WHEN suggestions are shown THEN the system SHALL allow the user to accept, modify, or regenerate them

### Requirement 3: Visual Style Configuration

**User Story:** As a user, I want to iteratively refine my book's visual style through conversation and image examples, so that I can get exactly the look I want.

#### Acceptance Criteria

1. WHEN the concept is defined THEN the system SHALL prompt the user about visual style preferences
2. WHEN the user describes their style preferences THEN the system SHALL use the LLM to generate 3-5 distinct style variations
3. WHEN style variations are generated THEN the system SHALL generate sample images for each style option
4. WHEN sample images are ready THEN the system SHALL display them in a gallery with their corresponding style prompts visible
5. WHEN the user selects an image THEN the system SHALL mark it as the current selection and enable conversational refinement
6. WHEN the user provides refinement feedback (e.g., "make it more cartoonish", "less saturated colors") THEN the system SHALL use the LLM to modify the prompt accordingly
7. WHEN a prompt is refined THEN the system SHALL generate a new sample image showing the refinement
8. WHEN new refinement images are generated THEN the system SHALL display them alongside the original for comparison
9. WHEN the user is satisfied THEN the system SHALL allow them to confirm the final style
10. WHEN the user confirms a style THEN the system SHALL save both the style configuration and the final refined prompt to the book

**Note:** This iterative refinement process may generate multiple images as the user explores different variations. This investment ensures the book's visual foundation is correct before story creation begins.

### Requirement 4: Character Creation

**User Story:** As a user, I want to define my book's characters conversationally, so that I can quickly build a cast with rich descriptions.

#### Acceptance Criteria

1. WHEN style is configured THEN the system SHALL ask how many characters the book needs
2. WHEN the user specifies character count THEN the system SHALL guide creation of each character
3. WHEN creating a character THEN the system SHALL prompt for name, role, and basic description
4. WHEN character basics are entered THEN the system SHALL use the LLM to generate detailed visual descriptions
5. WHEN character descriptions are generated THEN the system SHALL allow the user to refine them through conversation


### Requirement 5: Conversational Interaction

**User Story:** As a user, I want to interact with the wizard through natural conversation, so that the process feels intuitive and flexible.

#### Acceptance Criteria

1. WHEN the user sends a message THEN the system SHALL display it in a chat-like interface
2. WHEN the system responds THEN the system SHALL display messages with appropriate formatting
3. WHEN the LLM is processing THEN the system SHALL show a loading indicator
4. WHEN the user asks for clarification THEN the system SHALL provide helpful explanations
5. WHEN the user wants to change something THEN the system SHALL allow conversational edits without restarting

### Requirement 6: LLM Integration

**User Story:** As a developer, I want the wizard to use LLM capabilities intelligently, so that users get high-quality suggestions.

#### Acceptance Criteria

1. WHEN calling the LLM THEN the system SHALL use structured prompts with clear instructions
2. WHEN the LLM responds THEN the system SHALL parse responses into structured data
3. WHEN LLM calls fail THEN the system SHALL handle errors gracefully and allow manual input
4. WHEN generating suggestions THEN the system SHALL include book context in the prompt
5. WHEN the user refines something THEN the system SHALL send the refinement request with previous context

### Requirement 7: Real-time Feedback

**User Story:** As a user, I want to see how my choices affect the book, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN a book property is set THEN the system SHALL show a preview of how it will be used
2. WHEN characters are defined THEN the system SHALL display a summary of the cast
3. WHEN style is configured THEN the system SHALL show example prompts that will be generated
4. WHEN the user makes changes THEN the system SHALL update previews in real-time
5. WHEN the wizard is complete THEN the system SHALL show a final summary before creating the book

### Requirement 8: Wizard Completion

**User Story:** As a user, I want to review and finalize my book setup, so that I can start creating stories with confidence.

#### Acceptance Criteria

1. WHEN all steps are complete THEN the system SHALL display a comprehensive summary
2. WHEN the summary is shown THEN the system SHALL allow editing any section
3. WHEN the user confirms THEN the system SHALL create the book with all configured settings
4. WHEN the book is created THEN the system SHALL navigate to the book view
5. WHEN the book is created THEN the system SHALL save it using the file-based storage format

### Requirement 9: Progress Persistence

**User Story:** As a user, I want my progress saved if I close the wizard, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN the user makes progress THEN the system SHALL save wizard state to local storage
2. WHEN the user closes the wizard THEN the system SHALL preserve their progress
3. WHEN the user reopens the wizard THEN the system SHALL offer to resume from where they left off
4. WHEN the user completes or cancels THEN the system SHALL clear the saved wizard state
5. WHEN wizard state is corrupted THEN the system SHALL start fresh and log the error

### Requirement 10: Accessibility and UX

**User Story:** As a user, I want the wizard to be easy to use and accessible, so that I can focus on creativity.

#### Acceptance Criteria

1. WHEN displaying messages THEN the system SHALL use clear, conversational language
2. WHEN showing options THEN the system SHALL provide quick-select buttons alongside text input
3. WHEN errors occur THEN the system SHALL explain what went wrong and how to fix it
4. WHEN the wizard is long THEN the system SHALL allow skipping optional steps
5. WHEN the user is stuck THEN the system SHALL provide helpful hints and examples

## Out of Scope

The following features are explicitly OUT OF SCOPE for this initial implementation:

- ❌ Story creation wizard (separate feature)
- ❌ Character image generation during wizard (characters created without images initially)
- ❌ Multi-user collaboration on book creation
- ❌ Templates or presets for common book types
- ❌ Import from external sources during wizard
- ❌ Advanced style customization (use existing style editor after creation)

**Note:** Visual style configuration DOES include sample image generation to help users select their preferred style, but character images are not generated during the wizard.

These can be added later as enhancements.
