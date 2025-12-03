import { useState, useCallback, useEffect } from 'react';
import type { Scene, Story } from '../types/Story';
import { BookService } from '../services/BookService';

export interface UseSceneEditorReturn {
  // Scene state
  sceneTitle: string;
  sceneDescription: string;
  textPanelContent: string;
  selectedCharacters: string[];
  selectedElements: string[];
  
  // Handlers
  handleTitleChange: (title: string) => void;
  handleDescriptionChange: (description: string) => void;
  handleTextPanelChange: (content: string) => void;
  handleCharacterSelectionChange: (characters: string[]) => void;
  handleElementSelectionChange: (elements: string[]) => void;
  handleInsertMacro: (macro: string, cursorPosition: number) => string;
  
  // Save operation
  saveScene: () => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
}

/**
 * Custom hook for managing scene editing state and operations
 * 
 * @param story - The parent story containing the scene
 * @param scene - The scene being edited (null if no scene selected)
 * @param onSceneUpdate - Callback to trigger when scene is updated
 * @returns Scene editing state and handlers
 */
export function useSceneEditor(
  story: Story | null,
  scene: Scene | null,
  onSceneUpdate: () => void
): UseSceneEditorReturn {
  const [sceneTitle, setSceneTitle] = useState(scene?.title || '');
  const [sceneDescription, setSceneDescription] = useState(scene?.description || '');
  const [textPanelContent, setTextPanelContent] = useState(scene?.textPanel || '');
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>(
    scene?.characters || scene?.characterIds || []
  );
  const [selectedElements, setSelectedElements] = useState<string[]>(
    scene?.elements || scene?.elementIds || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync state when scene changes
  useEffect(() => {
    if (scene) {
      setSceneTitle(scene.title || '');
      setSceneDescription(scene.description || '');
      setTextPanelContent(scene.textPanel || '');
      setSelectedCharacters(scene.characters || scene.characterIds || []);
      setSelectedElements(scene.elements || scene.elementIds || []);
    } else {
      setSceneTitle('');
      setSceneDescription('');
      setTextPanelContent('');
      setSelectedCharacters([]);
      setSelectedElements([]);
    }
  }, [scene]);

  /**
   * Handle scene title change
   */
  const handleTitleChange = useCallback(async (newTitle: string) => {
    setSceneTitle(newTitle);
    
    // Auto-save the scene title
    if (story && scene) {
      try {
        const activeBookData = await BookService.getActiveBookData();
        if (!activeBookData) return;
        
        const updatedStories = activeBookData.stories.map(s => {
          if (s.id === story.id) {
            const updatedScenes = s.scenes.map(sc => {
              if (sc.id === scene.id) {
                return { ...sc, title: newTitle, updatedAt: new Date() };
              }
              return sc;
            });
            return { ...s, scenes: updatedScenes, updatedAt: new Date() };
          }
          return s;
        });
        
        const updatedData = { ...activeBookData, stories: updatedStories };
        await BookService.saveActiveBookData(updatedData);
        onSceneUpdate();
      } catch (error) {
        console.error('Failed to save title:', error);
        setSaveError(error instanceof Error ? error.message : 'Failed to save title');
      }
    }
  }, [story, scene, onSceneUpdate]);

  /**
   * Handle scene description change
   */
  const handleDescriptionChange = useCallback(async (newDescription: string) => {
    setSceneDescription(newDescription);
    
    // Auto-save the scene description
    if (story && scene) {
      try {
        const activeBookData = await BookService.getActiveBookData();
        if (!activeBookData) return;
        
        const updatedStories = activeBookData.stories.map(s => {
          if (s.id === story.id) {
            const updatedScenes = s.scenes.map(sc => {
              if (sc.id === scene.id) {
                return { ...sc, description: newDescription, updatedAt: new Date() };
              }
              return sc;
            });
            return { ...s, scenes: updatedScenes, updatedAt: new Date() };
          }
          return s;
        });
        
        const updatedData = { ...activeBookData, stories: updatedStories };
        await BookService.saveActiveBookData(updatedData);
        onSceneUpdate();
      } catch (error) {
        console.error('Failed to save description:', error);
        setSaveError(error instanceof Error ? error.message : 'Failed to save description');
      }
    }
  }, [story, scene, onSceneUpdate]);

  /**
   * Handle text panel content change
   */
  const handleTextPanelChange = useCallback(async (newContent: string) => {
    setTextPanelContent(newContent);
    
    // Auto-save the text panel (but don't trigger full refresh)
    if (story && scene) {
      try {
        const activeBookData = await BookService.getActiveBookData();
        if (!activeBookData) return;
        
        const updatedStories = activeBookData.stories.map(s => {
          if (s.id === story.id) {
            const updatedScenes = s.scenes.map(sc => {
              if (sc.id === scene.id) {
                return { ...sc, textPanel: newContent, updatedAt: new Date() };
              }
              return sc;
            });
            return { ...s, scenes: updatedScenes, updatedAt: new Date() };
          }
          return s;
        });
        
        const updatedData = { ...activeBookData, stories: updatedStories };
        await BookService.saveActiveBookData(updatedData);
        // Don't call onSceneUpdate() here - it causes the scene to reload and clears the input
      } catch (error) {
        console.error('Failed to save text panel:', error);
        setSaveError(error instanceof Error ? error.message : 'Failed to save text panel');
      }
    }
  }, [story, scene]);

  /**
   * Handle character selection change
   */
  const handleCharacterSelectionChange = useCallback(async (characterNames: string[]) => {
    setSelectedCharacters(characterNames);
    
    if (story && scene) {
      try {
        const activeBookData = await BookService.getActiveBookData();
        if (!activeBookData) return;
        
        const updatedStories = activeBookData.stories.map(s => {
          if (s.id === story.id) {
            const updatedScenes = s.scenes.map(sc => {
              if (sc.id === scene.id) {
                return { 
                  ...sc, 
                  characters: characterNames,
                  characterIds: characterNames, // Backward compat
                  updatedAt: new Date() 
                };
              }
              return sc;
            });
            return { ...s, scenes: updatedScenes, updatedAt: new Date() };
          }
          return s;
        });
        
        const updatedData = { ...activeBookData, stories: updatedStories };
        await BookService.saveActiveBookData(updatedData);
        onSceneUpdate();
      } catch (error) {
        console.error('Failed to save character selection:', error);
        setSaveError(error instanceof Error ? error.message : 'Failed to save character selection');
      }
    }
  }, [story, scene, onSceneUpdate]);

  /**
   * Handle element selection change
   */
  const handleElementSelectionChange = useCallback(async (elementNames: string[]) => {
    setSelectedElements(elementNames);
    
    if (story && scene) {
      try {
        const activeBookData = await BookService.getActiveBookData();
        if (!activeBookData) return;
        
        const updatedStories = activeBookData.stories.map(s => {
          if (s.id === story.id) {
            const updatedScenes = s.scenes.map(sc => {
              if (sc.id === scene.id) {
                return { 
                  ...sc, 
                  elements: elementNames,
                  elementIds: elementNames, // Backward compat
                  updatedAt: new Date() 
                };
              }
              return sc;
            });
            return { ...s, scenes: updatedScenes, updatedAt: new Date() };
          }
          return s;
        });
        
        const updatedData = { ...activeBookData, stories: updatedStories };
        await BookService.saveActiveBookData(updatedData);
        onSceneUpdate();
      } catch (error) {
        console.error('Failed to save element selection:', error);
        setSaveError(error instanceof Error ? error.message : 'Failed to save element selection');
      }
    }
  }, [story, scene, onSceneUpdate]);

  /**
   * Insert a macro into the text panel at the specified cursor position
   * Returns the new text content with the macro inserted
   */
  const handleInsertMacro = useCallback((macro: string, cursorPosition: number): string => {
    const text = textPanelContent;
    const newText = text.substring(0, cursorPosition) + macro + text.substring(cursorPosition);
    setTextPanelContent(newText);
    
    // Trigger auto-save
    if (story && scene) {
      BookService.getActiveBookData().then(activeBookData => {
        if (!activeBookData) return;
        
        const updatedStories = activeBookData.stories.map(s => {
          if (s.id === story.id) {
            const updatedScenes = s.scenes.map(sc => {
              if (sc.id === scene.id) {
                return { ...sc, textPanel: newText, updatedAt: new Date() };
              }
              return sc;
            });
            return { ...s, scenes: updatedScenes, updatedAt: new Date() };
          }
          return s;
        });
        
        const updatedData = { ...activeBookData, stories: updatedStories };
        BookService.saveActiveBookData(updatedData).then(() => {
          onSceneUpdate();
        }).catch(error => {
          console.error('Failed to save after macro insertion:', error);
          setSaveError(error instanceof Error ? error.message : 'Failed to save after macro insertion');
        });
      }).catch(error => {
        console.error('Failed to get book data:', error);
        setSaveError(error instanceof Error ? error.message : 'Failed to get book data');
      });
    }
    
    return newText;
  }, [textPanelContent, story, scene, onSceneUpdate]);

  /**
   * Save all scene changes
   */
  const saveScene = useCallback(async () => {
    if (!story || !scene) {
      setSaveError('No scene selected');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const activeBookData = await BookService.getActiveBookData();
      if (!activeBookData) {
        throw new Error('Failed to get active book data');
      }

      const updatedStories = activeBookData.stories.map(s => {
        if (s.id === story.id) {
          const updatedScenes = s.scenes.map(sc => {
            if (sc.id === scene.id) {
              return {
                ...sc,
                title: sceneTitle,
                description: sceneDescription,
                textPanel: textPanelContent,
                characters: selectedCharacters,
                characterIds: selectedCharacters, // Backward compat
                elements: selectedElements,
                elementIds: selectedElements, // Backward compat
                updatedAt: new Date()
              };
            }
            return sc;
          });
          return { ...s, scenes: updatedScenes, updatedAt: new Date() };
        }
        return s;
      });

      const updatedData = { ...activeBookData, stories: updatedStories };
      await BookService.saveActiveBookData(updatedData);
      onSceneUpdate();
    } catch (error) {
      console.error('Failed to save scene:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save scene');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [story, scene, sceneTitle, sceneDescription, textPanelContent, selectedCharacters, selectedElements, onSceneUpdate]);

  return {
    sceneTitle,
    sceneDescription,
    textPanelContent,
    selectedCharacters,
    selectedElements,
    handleTitleChange,
    handleDescriptionChange,
    handleTextPanelChange,
    handleCharacterSelectionChange,
    handleElementSelectionChange,
    handleInsertMacro,
    saveScene,
    isSaving,
    saveError
  };
}
