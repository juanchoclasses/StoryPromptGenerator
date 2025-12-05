/**
 * SlugService - Generate filesystem-safe slugs from titles
 * 
 * Converts titles into URL-safe identifiers suitable for directory and file names.
 * Handles edge cases like empty titles, special characters, and conflicts.
 */
export class SlugService {
  /**
   * Generate a filesystem-safe slug from a title
   * 
   * @param title - The title to convert to a slug
   * @param fallbackPrefix - Prefix to use if title is empty/invalid (default: 'item')
   * @returns A slug (lowercase, hyphens, no special chars, max 50 chars)
   * 
   * @example
   * generateSlug("My Story Title") // "my-story-title"
   * generateSlug("Hello!!! World???") // "hello-world"
   * generateSlug("") // "item-a1b2c3d4" (with UUID)
   */
  static generateSlug(title: string, fallbackPrefix: string = 'item'): string {
    // Handle empty or whitespace-only titles
    if (!title || title.trim().length === 0) {
      return `${fallbackPrefix}-${this.generateShortUUID()}`;
    }
    
    // Convert to slug format
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '')     // Remove special characters
      .replace(/-+/g, '-')            // Collapse multiple hyphens
      .replace(/^-|-$/g, '')          // Trim leading/trailing hyphens
      .substring(0, 50);              // Limit to 50 characters
    
    // If slug is empty after processing (e.g., title was only special chars)
    if (slug.length === 0) {
      return `${fallbackPrefix}-${this.generateShortUUID()}`;
    }
    
    return slug;
  }
  
  /**
   * Generate a unique slug by appending numeric suffixes if conflicts exist
   * 
   * @param baseSlug - The base slug to make unique
   * @param existingSlugs - Set of slugs that already exist
   * @returns A unique slug (e.g., "story", "story-1", "story-2")
   * 
   * @example
   * generateUniqueSlug("story", new Set(["story"])) // "story-1"
   * generateUniqueSlug("story", new Set(["story", "story-1"])) // "story-2"
   */
  static generateUniqueSlug(baseSlug: string, existingSlugs: Set<string>): string {
    let slug = baseSlug;
    let counter = 1;
    
    // Keep incrementing counter until we find a unique slug
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }
  
  /**
   * Generate a short UUID (first 8 characters)
   * Used as fallback for empty/invalid titles
   * 
   * @returns 8-character UUID segment
   */
  private static generateShortUUID(): string {
    return crypto.randomUUID().slice(0, 8);
  }
}
