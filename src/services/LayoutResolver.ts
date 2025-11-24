import type { Scene, Story, SceneLayout } from '../types/Story';
import type { Book } from '../types/Book';

/**
 * LayoutResolver - Handles hierarchical layout resolution
 * 
 * Layout Priority (highest to lowest):
 * 1. Scene-specific layout (scene.layout)
 * 2. Story-level layout (story.layout)
 * 3. Book-level default layout (book.defaultLayout)
 * 4. System default (overlay with full-screen image)
 */
export class LayoutResolver {
  /**
   * Resolve the effective layout for a scene
   * Follows the inheritance chain: scene → story → book → system default
   */
  static resolveLayout(
    scene: Scene,
    story: Story | null,
    book: Book | null
  ): SceneLayout | undefined {
    // 1. Check scene-specific layout (highest priority)
    if (scene.layout) {
      console.log(`📐 Using scene-specific layout for "${scene.title}"`);
      return scene.layout;
    }

    // 2. Check story-level layout
    if (story?.layout) {
      console.log(`📐 Using story-level layout for scene "${scene.title}" (from story "${story.title}")`);
      return story.layout;
    }

    // 3. Check book-level default layout
    if (book?.defaultLayout) {
      console.log(`📐 Using book-level default layout for scene "${scene.title}" (from book "${book.title}")`);
      return book.defaultLayout as SceneLayout;
    }

    // 4. No layout defined at any level - return undefined
    // The caller will use system defaults
    console.log(`📐 No layout defined for scene "${scene.title}" - using system defaults`);
    return undefined;
  }

  /**
   * Get a description of where the layout is coming from (for UI display)
   */
  static getLayoutSource(
    scene: Scene,
    story: Story | null,
    book: Book | null
  ): 'scene' | 'story' | 'book' | 'default' {
    if (scene.layout) return 'scene';
    if (story?.layout) return 'story';
    if (book?.defaultLayout) return 'book';
    return 'default';
  }

  /**
   * Get a human-readable description of the layout source
   */
  static getLayoutSourceDescription(
    scene: Scene,
    story: Story | null,
    book: Book | null
  ): string {
    const source = this.getLayoutSource(scene, story, book);
    
    switch (source) {
      case 'scene':
        return `Scene-specific layout`;
      case 'story':
        return `Story layout (${story?.title || 'Unknown'})`;
      case 'book':
        return `Book default layout (${book?.title || 'Unknown'})`;
      case 'default':
        return `System default (overlay)`;
    }
  }

  /**
   * Check if a scene has its own layout (not inherited)
   */
  static hasOwnLayout(scene: Scene): boolean {
    return !!scene.layout;
  }

  /**
   * Check if a story has its own layout
   */
  static storyHasLayout(story: Story | null): boolean {
    return !!story?.layout;
  }

  /**
   * Check if a book has a default layout
   */
  static bookHasDefaultLayout(book: Book | null): boolean {
    return !!book?.defaultLayout;
  }
}

