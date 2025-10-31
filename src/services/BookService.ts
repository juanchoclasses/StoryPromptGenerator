import { Book } from '../models/Book';
import { Story, type Character } from '../models/Story';
import { StorageService } from './StorageService';
import type { StoryData } from '../types/Story';
import type { PanelConfig } from '../types/Book';
import { ImageStorageService } from './ImageStorageService';

/**
 * BookService - High-level API for book management
 * Uses StorageService for persistence and Book model for business logic
 */
export class BookService {
  /**
   * Get all books
   */
  static async getAllBooks(): Promise<Book[]> {
    return await StorageService.getAllBooks();
  }

  /**
   * Get book by ID
   */
  static async getBook(bookId: string): Promise<Book | null> {
    return await StorageService.getBook(bookId);
  }

  /**
   * Create a new book
   */
  static async createBook(
    title: string,
    description?: string,
    aspectRatio?: string,
    panelConfig?: PanelConfig,
    backgroundSetup?: string
  ): Promise<Book> {
    const book = new Book({
      title,
      description,
      backgroundSetup,
      aspectRatio: aspectRatio || '9:16',
      style: {
        panelConfig: panelConfig
      }
    });

    // Validate before saving
    const validation = book.validate();
    if (!validation.isValid) {
      throw new Error(`Cannot create book: ${validation.errors.join(', ')}`);
    }

    await StorageService.saveBook(book);

    // Set as active book if it's the first one
    const bookCount = await StorageService.getBookCount();
    if (bookCount === 1) {
      await StorageService.setActiveBook(book.id);
    }

    return book;
  }

  /**
   * Update book metadata
   */
  static async updateBook(bookId: string, updates: Partial<{
    title: string;
    description: string;
    backgroundSetup: string;
    aspectRatio: string;
    panelConfig: PanelConfig;
  }>): Promise<Book | null> {
    const book = await StorageService.getBook(bookId);
    if (!book) return null;

    // Apply updates
    if (updates.title !== undefined) book.title = updates.title;
    if (updates.description !== undefined) book.description = updates.description;
    if (updates.backgroundSetup !== undefined) book.backgroundSetup = updates.backgroundSetup;
    if (updates.aspectRatio !== undefined) book.aspectRatio = updates.aspectRatio;
    if (updates.panelConfig !== undefined) {
      book.updateStyle({ panelConfig: updates.panelConfig });
    }

    // Validate before saving
    const validation = book.validate();
    if (!validation.isValid) {
      throw new Error(`Cannot update book: ${validation.errors.join(', ')}`);
    }

    await StorageService.saveBook(book);
    return book;
  }

  /**
   * Delete a book
   */
  static async deleteBook(bookId: string): Promise<boolean> {
    return await StorageService.deleteBook(bookId);
  }

  /**
   * Get active book ID
   */
  static async getActiveBookId(): Promise<string | null> {
    const activeBook = await StorageService.getActiveBook();
    return activeBook?.id || null;
  }

  /**
   * Get active book
   */
  static async getActiveBook(): Promise<Book | null> {
    return await StorageService.getActiveBook();
  }

  /**
   * Save a book directly (no conversion)
   */
  static async saveBook(book: Book): Promise<void> {
    return await StorageService.saveBook(book);
  }

  /**
   * Set active book
   */
  static async setActiveBook(bookId: string | null): Promise<void> {
    await StorageService.setActiveBook(bookId);
  }

  /**
   * Get book data (for backward compatibility with existing components)
   * Returns StoryData format used by current UI
   */
  static async getBookData(bookId: string): Promise<StoryData | null> {
    const book = await StorageService.getBook(bookId);
    if (!book) return null;

    // Convert Book model to StoryData format
    return {
      version: '4.0.0',
      stories: book.stories.map(story => ({
        id: story.id,
        title: story.title,
        description: story.description,
        backgroundSetup: story.backgroundSetup,
        diagramStyle: story.diagramStyle, // Include diagram style
        scenes: story.scenes.map(scene => ({
          id: scene.id,
          title: scene.title,
          description: scene.description,
          textPanel: scene.textPanel,
          diagramPanel: scene.diagramPanel, // Include diagram panel
          characters: scene.characters || [],
          elements: scene.elements || [],
          characterIds: scene.characters || [], // DEPRECATED: for backward compat
          elementIds: scene.elements || [], // DEPRECATED: for backward compat
          imageHistory: scene.imageHistory || [],
          createdAt: scene.createdAt,
          updatedAt: scene.updatedAt
        })),
        // Add dummy IDs for backward compatibility with old Character type
        characters: story.characters.map(char => ({
          id: char.name, // Use name as ID for backward compatibility
          name: char.name,
          description: char.description,
          imageGallery: char.imageGallery, // Preserve character images (v4.1+)
          selectedImageId: char.selectedImageId // Preserve selected image (v4.1+)
        })),
        // Add dummy IDs for backward compatibility with old StoryElement type
        elements: story.elements.map(elem => ({
          id: elem.name, // Use name as ID for backward compatibility
          name: elem.name,
          description: elem.description,
          category: elem.category
        })),
        characterIds: [], // Deprecated
        elementIds: [], // Deprecated
        createdAt: story.createdAt,
        updatedAt: story.updatedAt
      })),
      // Global characters/elements are deprecated in v4.0
      // They're now stored at story level
      characters: [],
      elements: [],
      lastUpdated: book.updatedAt
    };
  }

  /**
   * Get active book data (for backward compatibility)
   */
  static async getActiveBookData(): Promise<StoryData | null> {
    const activeBookId = await this.getActiveBookId();
    if (!activeBookId) return null;
    return this.getBookData(activeBookId);
  }

  /**
   * Save book data (for backward compatibility with existing components)
   * Converts StoryData format to Book model and saves
   */
  static async saveBookData(bookId: string, data: StoryData): Promise<void> {
    // Import Scene class for proper reconstruction
    const { Scene: SceneClass } = await import('../models/Scene.js');
    
    console.log('📥 BookService.saveBookData received data with', data.stories.length, 'stories');
    data.stories.forEach((story, idx) => {
      console.log(`📖 Story ${idx}:`, story.title, 'with', story.scenes?.length || 0, 'scenes');
      story.scenes?.forEach((scene, sceneIdx) => {
        console.log(`  📄 Scene ${sceneIdx}:`, {
          id: scene.id,
          title: scene.title,
          hasDiagramPanel: !!scene.diagramPanel,
          diagramPanel: scene.diagramPanel
        });
      });
    });
    
    const book = await StorageService.getBook(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }

    // Update stories from data with properly reconstructed scenes
    book.stories = data.stories.map(storyData => {
      // Convert plain scene objects to Scene instances
      const sceneInstances = (storyData.scenes || []).map((sceneData, idx) => {
        console.log(`🔧 Processing scene ${idx}:`, {
          id: sceneData.id,
          title: sceneData.title,
          hasDiagramPanel: !!sceneData.diagramPanel,
          diagramPanel: sceneData.diagramPanel,
          isInstance: sceneData instanceof SceneClass
        });
        
        if (sceneData instanceof SceneClass) {
          console.log(`✓ Scene ${idx} is already a Scene instance`);
          return sceneData; // Already a Scene instance
        }
        
        const newScene = new SceneClass(sceneData); // Convert plain object to Scene instance
        console.log(`🆕 Created new Scene instance for ${idx}:`, {
          id: newScene.id,
          title: newScene.title,
          hasDiagramPanel: !!newScene.diagramPanel,
          diagramPanel: newScene.diagramPanel
        });
        return newScene;
      });
      
      return new Story({
        id: storyData.id,
        title: storyData.title,
        description: storyData.description,
        backgroundSetup: storyData.backgroundSetup,
        diagramStyle: storyData.diagramStyle, // Include diagram style
        characters: storyData.characters || [],
        elements: storyData.elements || [],
        scenes: sceneInstances,
        createdAt: storyData.createdAt,
        updatedAt: storyData.updatedAt
      });
    });

    // Validate before saving
    const validation = book.validate();
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Book validation warnings:', validation.warnings);
    }
    if (!validation.isValid) {
      throw new Error(`Cannot save book: ${validation.errors.join(', ')}`);
    }

    await StorageService.saveBook(book);
  }

  /**
   * Save active book data (for backward compatibility)
   */
  static async saveActiveBookData(data: StoryData): Promise<boolean> {
    const activeBookId = await this.getActiveBookId();
    if (!activeBookId) return false;

    try {
      await this.saveBookData(activeBookId, data);
      return true;
    } catch (error) {
      console.error('Failed to save active book data:', error);
      return false;
    }
  }

  /**
   * Update book statistics (for backward compatibility)
   * Note: In v4.0, statistics are calculated on-demand
   * @deprecated This method is no longer needed in v4.0
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async updateBookStatistics(..._args: unknown[]): Promise<void> {
    // Statistics are now calculated on-demand from the book's stories
    // This method is kept for backward compatibility but doesn't need to do anything
    return;
  }

  /**
   * Export book data as JSON string
   */
  static async exportBook(bookId: string): Promise<string | null> {
    const book = await StorageService.getBook(bookId);
    if (!book) return null;

    const exportData = book.toExportJSON();
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import book data from JSON string
   */
  static async importBook(importData: string): Promise<Book | null> {
    try {
      const parsed = JSON.parse(importData);

      // Use Book.fromJSON to properly reconstruct the book
      const book = await Book.fromJSON(parsed);

      // Validate before saving
      const validation = book.validate();
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('Imported book has validation warnings:', validation.warnings);
      }
      if (!validation.isValid) {
        throw new Error(`Cannot import book: ${validation.errors.join(', ')}`);
      }

      // Generate new ID for imported book to avoid conflicts
      book.id = crypto.randomUUID();

      await StorageService.saveBook(book);

      // Set as active book
      await StorageService.setActiveBook(book.id);

      return book;
    } catch (error) {
      console.error('Error importing book:', error);
      return null;
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    bookCount: number;
    totalStories: number;
    totalScenes: number;
    storageSize: number;
    version: string;
  }> {
    return await StorageService.getStorageStats();
  }

  /**
   * Import a Book instance directly (used by BookExportWithImagesService)
   * This method accepts an already-constructed Book instance and saves it
   */
  static async importBookInstance(book: Book): Promise<Book> {
    // Validate before saving
    const validation = book.validate();
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Imported book has validation warnings:', validation.warnings);
    }
    if (!validation.isValid) {
      throw new Error(`Cannot import book: ${validation.errors.join(', ')}`);
    }

    // Generate new ID for imported book to avoid conflicts
    book.id = crypto.randomUUID();

    await StorageService.saveBook(book);

    // Set as active book
    await StorageService.setActiveBook(book.id);

    return book;
  }

  /**
   * Get book collection (for backward compatibility with FileManager)
   */
  static async getBookCollection(): Promise<{
    books: Array<{
      id: string;
      title: string;
      description?: string;
      storyCount: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    activeBookId: string | null;
    lastUpdated: Date;
  }> {
    const books = await StorageService.getAllBooks();
    const activeBook = await StorageService.getActiveBook();
    const appData = await StorageService.load();

    return {
      books: books.map(book => ({
        id: book.id,
        title: book.title,
        description: book.description,
        storyCount: book.stories.length,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt
      })),
      activeBookId: activeBook?.id || null,
      lastUpdated: appData.lastUpdated
    };
  }

  // ========================================
  // Character Management (Book/Story Level)
  // ========================================

  /**
   * Get usage information for a character across all stories in a book
   * Returns which stories use this character in their scenes
   */
  static getCharacterUsageInBook(book: Book, characterName: string): {
    storiesUsing: Array<{ id: string; title: string; sceneCount: number }>;
    totalSceneCount: number;
  } {
    const storiesUsing: Array<{ id: string; title: string; sceneCount: number }> = [];
    let totalSceneCount = 0;

    for (const story of book.stories) {
      const scenesWithCharacter = story.scenes.filter(scene =>
        scene.characters.some(c => c.toLowerCase() === characterName.toLowerCase())
      );

      if (scenesWithCharacter.length > 0) {
        storiesUsing.push({
          id: story.id,
          title: story.title,
          sceneCount: scenesWithCharacter.length
        });
        totalSceneCount += scenesWithCharacter.length;
      }
    }

    return { storiesUsing, totalSceneCount };
  }

  /**
   * Promote a character from story-level to book-level
   * Moves the character and all its images from a specific story to the book
   * 
   * @param bookId Book ID
   * @param storyId Story ID where the character currently exists
   * @param characterName Character name to promote
   * @returns true if successful, false if character not found or already exists at book level
   */
  static async promoteCharacterToBook(
    bookId: string,
    storyId: string,
    characterName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const book = await StorageService.getBook(bookId);
      if (!book) {
        return { success: false, error: 'Book not found' };
      }

      const story = book.stories.find(s => s.id === storyId);
      if (!story) {
        return { success: false, error: 'Story not found' };
      }

      // Find character in story
      const character = story.characters.find((c: any) => c.name.toLowerCase() === characterName.toLowerCase());
      if (!character) {
        return { success: false, error: 'Character not found in story' };
      }

      // Check if character already exists at book level BEFORE modifying anything
      if (book.findCharacterByName(characterName)) {
        console.error(`Character "${characterName}" already exists at book level`);
        return { success: false, error: `Character "${characterName}" already exists at book level` };
      }

      // Move character images from story to book level
      // Get all character images for this story character
      const characterImages = await ImageStorageService.getAllCharacterImages(storyId, characterName);
      
      console.log(`Promoting character "${characterName}" from story "${story.title}" to book "${book.title}"`);
      console.log(`Found ${characterImages.size} character images to move`);

      // Store each image at book level
      for (const [imageId, blobUrl] of characterImages.entries()) {
        // Fetch the blob from the blob URL
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        const newBlobUrl = URL.createObjectURL(blob);
        
        // Store at book level (model name is preserved in metadata if needed)
        await ImageStorageService.storeBookCharacterImage(bookId, characterName, imageId, newBlobUrl, 'unknown');
        
        // Clean up temporary blob URL
        URL.revokeObjectURL(newBlobUrl);
      }

      // Add character to book
      console.log('Adding character to book.characters array...');
      book.characters.push(character);
      console.log('Book now has', book.characters.length, 'characters');

      // Remove character from story
      story.characters = story.characters.filter((c: any) => c.name.toLowerCase() !== characterName.toLowerCase());
      console.log('Story now has', story.characters.length, 'characters');

      // Save book
      console.log('Saving book to storage...');
      await StorageService.saveBook(book);
      console.log('Book saved successfully');

      // IMPORTANT: Only delete from story level AFTER everything else succeeded
      // This ensures we don't lose images if the save fails
      await ImageStorageService.deleteAllCharacterImages(storyId, characterName);
      console.log('✓ Deleted old images from story level');

      console.log(`✓ Successfully promoted character "${characterName}" to book level`);
      return { success: true };
    } catch (error) {
      console.error('Error promoting character to book:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Demote a character from book-level to story-level
   * Only allowed if character is used in 0 or 1 story
   * 
   * @param bookId Book ID
   * @param characterName Character name to demote
   * @param targetStoryId Optional: specific story to move to (required if used in 0 stories)
   * @returns Result object with success status and optional error message
   */
  static async demoteCharacterToStory(
    bookId: string,
    characterName: string,
    targetStoryId?: string
  ): Promise<{ success: boolean; error?: string; storiesUsing?: Array<{ id: string; title: string }> }> {
    try {
      const book = await StorageService.getBook(bookId);
      if (!book) {
        return { success: false, error: 'Book not found' };
      }

      // Find character in book
      const character = book.findCharacterByName(characterName);
      if (!character) {
        return { success: false, error: 'Character not found at book level' };
      }

      // Check usage
      const usage = this.getCharacterUsageInBook(book, characterName);

      // Block if used in 2+ stories
      if (usage.storiesUsing.length > 1) {
        return {
          success: false,
          error: `Cannot demote "${characterName}". Character is used in ${usage.storiesUsing.length} stories. Remove from other stories first.`,
          storiesUsing: usage.storiesUsing.map(s => ({ id: s.id, title: s.title }))
        };
      }

      // Determine target story
      let targetStory: Story | undefined;
      
      if (usage.storiesUsing.length === 1) {
        // Used in one story - move to that story
        targetStory = book.stories.find(s => s.id === usage.storiesUsing[0].id);
      } else if (targetStoryId) {
        // Not used anywhere but target specified
        targetStory = book.stories.find(s => s.id === targetStoryId);
      } else {
        return {
          success: false,
          error: 'Character is not used in any story. Please specify a target story.'
        };
      }

      if (!targetStory) {
        return { success: false, error: 'Target story not found' };
      }

      // Check if target story already has this character
      if (targetStory.characters.find(c => c.name.toLowerCase() === characterName.toLowerCase())) {
        return {
          success: false,
          error: `Story "${targetStory.title}" already has a character named "${characterName}"`
        };
      }

      console.log(`Demoting character "${characterName}" from book to story "${targetStory.title}"`);

      // Move character images from book to story level
      const characterImages = await ImageStorageService.getAllBookCharacterImages(bookId, characterName);
      console.log(`Found ${characterImages.size} character images to move`);

      // Store each image at story level
      for (const [imageId, blobUrl] of characterImages.entries()) {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        const newBlobUrl = URL.createObjectURL(blob);
        
        await ImageStorageService.storeCharacterImage(targetStory.id, characterName, imageId, newBlobUrl, 'unknown');
        
        URL.revokeObjectURL(newBlobUrl);
      }

      // Delete from book level
      await ImageStorageService.deleteAllBookCharacterImages(bookId, characterName);

      // Add character to target story
      targetStory.characters.push(character);

      // Remove character from book
      book.deleteCharacter(characterName);

      // Save book
      await StorageService.saveBook(book);

      console.log(`✓ Successfully demoted character "${characterName}" to story level`);
      return { success: true };
    } catch (error) {
      console.error('Error demoting character to story:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
