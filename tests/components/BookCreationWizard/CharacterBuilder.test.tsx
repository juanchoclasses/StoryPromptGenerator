import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterBuilder } from '../../../src/components/BookCreationWizard/CharacterBuilder';
import type { CharacterProfile } from '../../../src/types/Wizard';
import type { BookStyle } from '../../../src/types/BookStyle';

// Mock ConversationView component
vi.mock('../../../src/components/BookCreationWizard/ConversationView', () => ({
  ConversationView: ({ onSendMessage, messages, isProcessing }: any) => (
    <div data-testid="conversation-view">
      <div data-testid="message-count">{messages.length}</div>
      <div data-testid="is-processing">{isProcessing ? 'true' : 'false'}</div>
      <button onClick={() => onSendMessage('test feedback')}>Send Message</button>
    </div>
  )
}));

describe('CharacterBuilder', () => {
  const mockBookConcept = 'A story about learning algorithms';
  const mockBookStyle: BookStyle = {
    artStyle: 'digital illustration',
    colorPalette: 'vibrant',
    visualTheme: 'educational',
    characterStyle: 'simplified',
    environmentStyle: 'abstract'
  };

  const mockCharacterProfile: CharacterProfile = {
    name: 'Alice',
    description: 'A curious student learning about algorithms',
    visualDetails: {
      appearance: 'Young woman with bright eyes',
      clothing: 'Casual student attire',
      distinctiveFeatures: 'Always carries a notebook'
    }
  };

  let mockOnCharacterConfirmed: ReturnType<typeof vi.fn>;
  let mockOnGenerateDetails: ReturnType<typeof vi.fn>;
  let mockOnRefineDescription: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnCharacterConfirmed = vi.fn();
    mockOnGenerateDetails = vi.fn().mockResolvedValue(mockCharacterProfile);
    mockOnRefineDescription = vi.fn().mockResolvedValue(mockCharacterProfile);
  });

  describe('Rendering', () => {
    it('should render character counter', () => {
      render(
        <CharacterBuilder
          characterCount={3}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByText('Character 1 of 3')).toBeInTheDocument();
    });

    it('should render info alert about character audition', () => {
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByText(/Character images can be generated after book creation/)).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByLabelText(/Character name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Basic character description/i)).toBeInTheDocument();
    });

    it('should render generate details button', () => {
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByRole('button', { name: /Generate character details with AI/i })).toBeInTheDocument();
    });

    it('should render character list sidebar', () => {
      render(
        <CharacterBuilder
          characterCount={3}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();
    });
  });

  describe('Form Input', () => {
    it('should allow typing in name field', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      const nameInput = screen.getByLabelText(/Character name/i);
      await user.type(nameInput, 'Alice');

      expect(nameInput).toHaveValue('Alice');
    });

    it('should allow typing in role field', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      const roleInput = screen.getByLabelText(/Role/i);
      await user.type(roleInput, 'Protagonist');

      expect(roleInput).toHaveValue('Protagonist');
    });

    it('should allow typing in description field', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      const descInput = screen.getByLabelText(/Basic character description/i);
      await user.type(descInput, 'A curious student');

      expect(descInput).toHaveValue('A curious student');
    });

    it('should disable generate button when name is empty', () => {
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      const generateButton = screen.getByRole('button', { name: /Generate character details with AI/i });
      expect(generateButton).toBeDisabled();
    });

    it('should enable generate button when name is provided', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      const nameInput = screen.getByLabelText(/Character name/i);
      await user.type(nameInput, 'Alice');

      const generateButton = screen.getByRole('button', { name: /Generate character details with AI/i });
      expect(generateButton).not.toBeDisabled();
    });
  });

  describe('Generate Details', () => {
    it('should call onGenerateDetails when button clicked', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      const nameInput = screen.getByLabelText(/Character name/i);
      await user.type(nameInput, 'Alice');

      const generateButton = screen.getByRole('button', { name: /Generate character details with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockOnGenerateDetails).toHaveBeenCalledWith('Alice', 'Character', '', []);
      });
    });

    it('should include role and description in generation call', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.type(screen.getByLabelText(/Role/i), 'Protagonist');
      await user.type(screen.getByLabelText(/Basic character description/i), 'A curious student');

      const generateButton = screen.getByRole('button', { name: /Generate character details with AI/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockOnGenerateDetails).toHaveBeenCalledWith(
          'Alice',
          'Protagonist',
          'A curious student',
          []
        );
      });
    });

    it('should show loading state during generation', async () => {
      const user = userEvent.setup();
      let resolveGeneration: (value: CharacterProfile) => void;
      const generationPromise = new Promise<CharacterProfile>((resolve) => {
        resolveGeneration = resolve;
      });
      mockOnGenerateDetails.mockReturnValue(generationPromise);

      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      const generateButton = screen.getByRole('button', { name: /Generate character details with AI/i });
      await user.click(generateButton);

      expect(screen.getByText(/Generating Details.../i)).toBeInTheDocument();

      resolveGeneration!(mockCharacterProfile);
    });

    it('should display generated profile', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText(/A curious student learning about algorithms/)).toBeInTheDocument();
        expect(screen.getByText(/Young woman with bright eyes/)).toBeInTheDocument();
      });
    });

    it('should show refinement conversation after generation', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });
    });

    it('should handle generation errors', async () => {
      const user = userEvent.setup();
      mockOnGenerateDetails.mockRejectedValue(new Error('Generation failed'));

      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(screen.getByText(/Generation failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Refinement', () => {
    it('should allow refining character description', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Generate initial profile
      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      // Send refinement feedback
      const sendButton = screen.getByText('Send Message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnRefineDescription).toHaveBeenCalledWith(
          mockCharacterProfile,
          'test feedback'
        );
      });
    });

    it('should update profile after refinement', async () => {
      const user = userEvent.setup();
      const refinedProfile: CharacterProfile = {
        ...mockCharacterProfile,
        description: 'Updated description'
      };
      mockOnRefineDescription.mockResolvedValue(refinedProfile);

      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Send Message'));

      await waitFor(() => {
        expect(screen.getByText(/Updated description/)).toBeInTheDocument();
      });
    });

    it('should handle refinement errors', async () => {
      const user = userEvent.setup();
      mockOnRefineDescription.mockRejectedValue(new Error('Refinement failed'));

      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Send Message'));

      await waitFor(() => {
        expect(screen.getByText(/Refinement failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Character Confirmation', () => {
    it('should show confirm button after generation', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm character/i })).toBeInTheDocument();
      });
    });

    it('should call onCharacterConfirmed when confirmed', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm character/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Confirm character/i }));

      expect(mockOnCharacterConfirmed).toHaveBeenCalledWith(mockCharacterProfile, 0);
    });

    it('should move to next character after confirmation', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={3}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByText('Character 1 of 3')).toBeInTheDocument();

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm character/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Confirm character/i }));

      await waitFor(() => {
        expect(screen.getByText('Character 2 of 3')).toBeInTheDocument();
      });
    });

    it('should update completed count in sidebar', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={3}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm character/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Confirm character/i }));

      await waitFor(() => {
        expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should disable previous button on first character', () => {
      render(
        <CharacterBuilder
          characterCount={3}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      const prevButton = screen.getByRole('button', { name: /Previous character/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last character', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      const nextButton = screen.getByRole('button', { name: /Next character/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(nextButton).toBeDisabled();
      });
    });

    it('should navigate to next character', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={3}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByText('Character 1 of 3')).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: /Next character/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Character 2 of 3')).toBeInTheDocument();
      });
    });

    it('should navigate to previous character', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={3}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Go to character 2
      await user.click(screen.getByRole('button', { name: /Next character/i }));
      await waitFor(() => {
        expect(screen.getByText('Character 2 of 3')).toBeInTheDocument();
      });

      // Go back to character 1
      const prevButton = screen.getByRole('button', { name: /Previous character/i });
      await user.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('Character 1 of 3')).toBeInTheDocument();
      });
    });

    it('should clear form when navigating to new character', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Fill in character 1
      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.type(screen.getByLabelText(/Role/i), 'Protagonist');

      // Navigate to character 2
      await user.click(screen.getByRole('button', { name: /Next character/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Character name/i)).toHaveValue('');
        expect(screen.getByLabelText(/Role/i)).toHaveValue('');
      });
    });
  });

  describe('Character List', () => {
    it('should display all character slots in sidebar', () => {
      render(
        <CharacterBuilder
          characterCount={3}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByText('Character 1')).toBeInTheDocument();
      expect(screen.getByText('Character 2')).toBeInTheDocument();
      expect(screen.getByText('Character 3')).toBeInTheDocument();
    });

    it('should show completed characters with names', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Complete character 1
      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm character/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /Confirm character/i }));

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });

    it('should allow clicking character in list to navigate', async () => {
      const user = userEvent.setup();
      const existingChars = [mockCharacterProfile];
      
      render(
        <CharacterBuilder
          characterCount={3}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          existingCharacters={existingChars}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Click on character 2 in list
      const character2Button = screen.getByRole('button', { name: /Character 2/ });
      await user.click(character2Button);

      await waitFor(() => {
        expect(screen.getByText('Character 2 of 3')).toBeInTheDocument();
      });
    });

    it('should show edit button for completed characters', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Complete character 1
      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm character/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /Confirm character/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit character 1/i })).toBeInTheDocument();
      });
    });

    it('should show success alert when all characters completed', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={1}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      await user.type(screen.getByLabelText(/Character name/i), 'Alice');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm character/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /Confirm character/i }));

      await waitFor(() => {
        expect(screen.getByText(/All characters completed!/)).toBeInTheDocument();
      });
    });
  });

  describe('Editing Completed Characters', () => {
    it('should load character data when editing', async () => {
      const user = userEvent.setup();
      const existingChars = [mockCharacterProfile];
      
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          existingCharacters={existingChars}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Character 1 should be loaded and displayed in refinement view
      const aliceElements = screen.getAllByText('Alice');
      expect(aliceElements.length).toBeGreaterThan(0);
      // Check for the description in the Paper component
      const descriptions = screen.getAllByText(/A curious student learning about algorithms/);
      expect(descriptions.length).toBeGreaterThan(0);
      // Should show refinement conversation
      expect(screen.getByTestId('conversation-view')).toBeInTheDocument();
    });

    it('should allow editing and re-confirming character', async () => {
      const user = userEvent.setup();
      const existingChars = [mockCharacterProfile];
      
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          existingCharacters={existingChars}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Should show refinement view for existing character
      expect(screen.getByTestId('conversation-view')).toBeInTheDocument();

      // Can refine and confirm again
      await user.click(screen.getByText('Send Message'));
      await waitFor(() => {
        expect(mockOnRefineDescription).toHaveBeenCalled();
      });
    });

    it('should pass existing characters to generation', async () => {
      const user = userEvent.setup();
      const existingChars = [mockCharacterProfile];
      
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          existingCharacters={existingChars}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Navigate to character 2
      await user.click(screen.getByRole('button', { name: /Next character/i }));

      await waitFor(() => {
        expect(screen.getByText('Character 2 of 2')).toBeInTheDocument();
      });

      // Generate character 2
      await user.type(screen.getByLabelText(/Character name/i), 'Bob');
      await user.click(screen.getByRole('button', { name: /Generate character details with AI/i }));

      await waitFor(() => {
        expect(mockOnGenerateDetails).toHaveBeenCalledWith(
          'Bob',
          'Character',
          '',
          [{ name: 'Alice', description: 'A curious student learning about algorithms' }]
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on form fields', () => {
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByLabelText(/Character name/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/Role/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/Basic character description/i)).toHaveAttribute('aria-label');
    });

    it('should have proper ARIA labels on navigation buttons', () => {
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      expect(screen.getByRole('button', { name: /Previous character/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next character/i })).toBeInTheDocument();
    });

    it('should mark name field as required', () => {
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      const nameInput = screen.getByLabelText(/Character name/i);
      expect(nameInput).toHaveAttribute('aria-required', 'true');
    });

    it('should have aria-current on selected character in list', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      const character1Button = screen.getByRole('button', { name: /Character 1/ });
      expect(character1Button).toHaveAttribute('aria-current', 'true');

      await user.click(screen.getByRole('button', { name: /Next character/i }));

      await waitFor(() => {
        const character2Button = screen.getByRole('button', { name: /Character 2/ });
        expect(character2Button).toHaveAttribute('aria-current', 'true');
      });
    });
  });

  describe('Validation', () => {
    it('should show error when trying to generate without name', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Try to generate without name (button should be disabled, but test the logic)
      const nameInput = screen.getByLabelText(/Character name/i);
      await user.type(nameInput, 'A');
      await user.clear(nameInput);

      const generateButton = screen.getByRole('button', { name: /Generate character details with AI/i });
      expect(generateButton).toBeDisabled();
    });

    it('should show error when trying to confirm without generated profile', async () => {
      const user = userEvent.setup();
      render(
        <CharacterBuilder
          characterCount={2}
          bookConcept={mockBookConcept}
          bookStyle={mockBookStyle}
          onCharacterConfirmed={mockOnCharacterConfirmed}
          onGenerateDetails={mockOnGenerateDetails}
          onRefineDescription={mockOnRefineDescription}
        />
      );

      // Confirm button should not be visible before generation
      expect(screen.queryByRole('button', { name: /Confirm character/i })).not.toBeInTheDocument();
    });
  });
});
