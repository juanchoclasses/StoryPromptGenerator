/**
 * useCharacterManager Hook
 * 
 * Shared character management logic extracted from CastManager and BookCastManager.
 * This hook eliminates ~70% code duplication between story-level and book-level character management.
 * 
 * Provides unified interface for:
 * - Character CRUD operations
 * - Character audition dialog management
 * - Character image gallery management
 * - Character save/load logic
 */

import { useState, useEffect } from 'react';
import { Character } from '../types/Story';
import { Book } from '../models/Book';
import { BookService } from '../services/BookService';

export interface UseCharacterManagerOptions {
  /**
   * Type of character management (story-level or book-level)
   */
  type: 'story' | 'book';
  
  /**
   * Book instance (required for both types)
   */
  book: Book | null;
  
  /**
   * Story ID (required for story-level characters)
   */
  storyId?: string;
  
  /**
   * Callback when characters are updated
   */
  onUpdate: () => void;
}

export interface UseCharacterManagerReturn {
  // State
  characters: Character[];
  openDialog: boolean;
  editingCharacter: Character | null;
  characterName: string;
  characterDescription: string;
  openAuditionDialog: boolean;
  auditionCharacter: Character | null;
  
  // Setters for form fields
  setCharacterName: (name: string) => void;
  setCharacterDescription: (desc: string) => void;
  
  // Actions
  handleAddCharacter: () => void;
  handleEditCharacter: (character: Character) => void;
  handleSaveCharacter: () => Promise<void>;
  handleDeleteCharacter: (characterName: string) => Promise<void>;
  handleCloseDialog: () => void;
  handleOpenAudition: (character: Character) => void;
  handleCloseAudition: () => void;
  handleAuditionUpdate: () => Promise<void>;
}

export function useCharacterManager(options: UseCharacterManagerOptions): UseCharacterManagerReturn {
  const { type, book, storyId, onUpdate } = options;
  
  // State
  const [characters, setCharacters] = useState<Character[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [characterName, setCharacterName] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [openAuditionDialog, setOpenAuditionDialog] = useState(false);
  const [auditionCharacter, setAuditionCharacter] = useState<Character | null>(null);

  // Load characters on mount/update
  useEffect(() => {
    if (!book) {
      setCharacters([]);
      return;
    }

    if (type === 'book') {
      // Book-level characters
      setCharacters(book.characters || []);
    } else {
      // Story-level characters
      const story = book.stories.find(s => s.id === storyId);
      setCharacters(story?.characters || []);
    }
  }, [book, storyId, type]);

  // Add character
  const handleAddCharacter = () => {
    setEditingCharacter(null);
    setCharacterName('');
    setCharacterDescription('');
    setOpenDialog(true);
  };

  // Edit character
  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setCharacterName(character.name);
    setCharacterDescription(character.description);
    setOpenDialog(true);
  };

  // Save character
  const handleSaveCharacter = async () => {
    if (!book) return;

    const trimmedName = characterName.trim();
    if (!trimmedName) return;

    try {
      if (type === 'book') {
        // Book-level character
        if (editingCharacter) {
          // Edit existing
          const updatedCharacters = characters.map(c =>
            c.name === editingCharacter.name
              ? { ...c, name: trimmedName, description: characterDescription }
              : c
          );
          book.characters = updatedCharacters;
        } else {
          // Add new
          book.addCharacter({
            name: trimmedName,
            description: characterDescription,
            imageGallery: []
          });
        }
      } else {
        // Story-level character
        const story = book.stories.find(s => s.id === storyId);
        if (!story) return;

        if (editingCharacter) {
          // Edit existing
          const updatedCharacters = characters.map(c =>
            c.name === editingCharacter.name
              ? { ...c, name: trimmedName, description: characterDescription }
              : c
          );
          story.characters = updatedCharacters;
        } else {
          // Add new
          story.addCharacter({
            name: trimmedName,
            description: characterDescription,
            imageGallery: []
          });
        }
      }

      // Save book
      await BookService.saveBook(book);

      // Update local state
      if (type === 'book') {
        setCharacters(book.characters);
      } else {
        const story = book.stories.find(s => s.id === storyId);
        setCharacters(story?.characters || []);
      }

      setOpenDialog(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to save character:', error);
      alert(`Failed to save character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Delete character
  const handleDeleteCharacter = async (characterName: string) => {
    if (!book) return;

    if (!window.confirm('Are you sure you want to delete this character? This will also remove them from all scenes.')) {
      return;
    }

    try {
      if (type === 'book') {
        // Delete book-level character
        book.deleteCharacter(characterName);
      } else {
        // Delete story-level character
        const story = book.stories.find(s => s.id === storyId);
        if (!story) return;
        
        const updatedCharacters = story.characters.filter(char => char.name !== characterName);
        story.characters = updatedCharacters;
      }

      // Save book
      await BookService.saveBook(book);

      // Update local state
      const updatedCharacters = characters.filter(char => char.name !== characterName);
      setCharacters(updatedCharacters);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete character:', error);
      alert(`Failed to delete character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Open audition dialog
  const handleOpenAudition = (character: Character) => {
    setAuditionCharacter(character);
    setOpenAuditionDialog(true);
  };

  // Close audition dialog
  const handleCloseAudition = () => {
    setOpenAuditionDialog(false);
    setAuditionCharacter(null);
  };

  // Handle audition update (after images are generated)
  const handleAuditionUpdate = async () => {
    console.log(`=== useCharacterManager (${type}): handleAuditionUpdate called ===`);
    console.log('Book:', book?.title);
    console.log('Audition Character:', auditionCharacter?.name);
    console.log('Character imageGallery length:', auditionCharacter?.imageGallery?.length);
    console.log('Character selectedImageId:', auditionCharacter?.selectedImageId);
    
    if (!book || !auditionCharacter) {
      console.warn('Missing book or auditionCharacter, aborting save');
      return;
    }
    
    try {
      if (type === 'book') {
        // Update book-level character
        console.log('Step 1: Finding character in book...');
        const char = book.characters.find(c => c.name === auditionCharacter.name);
        
        if (char) {
          console.log('✓ Character found');
          console.log('  Before update - imageGallery length:', char.imageGallery?.length);
          
          // Update the character directly
          char.imageGallery = auditionCharacter.imageGallery;
          char.selectedImageId = auditionCharacter.selectedImageId;
          
          console.log('  After update - imageGallery length:', char.imageGallery?.length);
          console.log('  After update - selectedImageId:', char.selectedImageId);
        } else {
          console.error('Character not found in book:', auditionCharacter.name);
          return;
        }
      } else {
        // Update story-level character
        console.log('Step 1: Finding story in book...');
        const story = book.stories.find(s => s.id === storyId);
        if (!story) {
          console.error('Story not found in book:', storyId);
          return;
        }
        console.log('✓ Story found');

        console.log('Step 2: Finding character in story...');
        const char = story.characters.find(c => c.name === auditionCharacter.name);
        
        if (char) {
          console.log('✓ Character found');
          console.log('  Before update - imageGallery length:', char.imageGallery?.length);
          
          // Update the character directly
          char.imageGallery = auditionCharacter.imageGallery;
          char.selectedImageId = auditionCharacter.selectedImageId;
          
          console.log('  After update - imageGallery length:', char.imageGallery?.length);
          console.log('  After update - selectedImageId:', char.selectedImageId);
        } else {
          console.error('Character not found in story:', auditionCharacter.name);
          return;
        }
      }

      // Save the book
      console.log('Step 3: Saving book...');
      await BookService.saveBook(book);
      console.log('✓ Book saved');

      // Reload characters from the saved book
      console.log('Step 4: Reloading characters...');
      const updatedBook = await BookService.getActiveBook();
      if (updatedBook) {
        if (type === 'book') {
          const updatedChar = updatedBook.characters.find(c => c.name === auditionCharacter.name);
          if (updatedChar) {
            console.log('  Updated character imageGallery length:', updatedChar.imageGallery?.length);
          }
          setCharacters(updatedBook.characters || []);
        } else {
          const updatedStory = updatedBook.stories.find(s => s.id === storyId);
          if (updatedStory) {
            console.log('  Updated story found, characters:', updatedStory.characters.length);
            const updatedChar = updatedStory.characters.find(c => c.name === auditionCharacter.name);
            if (updatedChar) {
              console.log('  Updated character imageGallery length:', updatedChar.imageGallery?.length);
            }
            setCharacters(updatedStory.characters || []);
          }
        }
      }
      console.log('✓ Characters reloaded');

      // Notify parent to refresh
      console.log('Step 5: Calling onUpdate...');
      onUpdate();
      console.log('✓ onUpdate called');
      
      console.log('=== handleAuditionUpdate Complete! ===');
    } catch (err) {
      console.error('✗✗✗ Failed to save character image changes:', err);
    }
  };

  return {
    // State
    characters,
    openDialog,
    editingCharacter,
    characterName,
    characterDescription,
    openAuditionDialog,
    auditionCharacter,
    
    // Setters
    setCharacterName,
    setCharacterDescription,
    
    // Actions
    handleAddCharacter,
    handleEditCharacter,
    handleSaveCharacter,
    handleDeleteCharacter,
    handleCloseDialog,
    handleOpenAudition,
    handleCloseAudition,
    handleAuditionUpdate,
  };
}

