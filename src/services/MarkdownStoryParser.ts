export interface ParsedCharacter {
  name: string;
  description: string;
}

export interface ParsedScene {
  title: string;
  description: string;
  characterNames: string[];
  elementNames: string[];
}

export interface ParsedStanza {
  title: string;
  content: string;
}

export interface ParsedStoryBundle {
  characters: ParsedCharacter[];
  scenes: ParsedScene[];
  stanzas: ParsedStanza[];
}

export class MarkdownStoryParser {
  /**
   * Parse characters from factorial-characters.md
   * Expected format:
   * ## Character Name (optional subtitle)
   * **Name:** Display Name
   * **Description:**
   * Character description text...
   */
  static parseCharacters(markdown: string): ParsedCharacter[] {
    const characters: ParsedCharacter[] = [];
    
    // Split by ## headers (but not # or ###)
    const sections = markdown.split(/\n## /).filter(s => s.trim());
    
    for (const section of sections) {
      // Skip the main title section
      if (section.startsWith('#') || section.startsWith('Factorial Factory Characters')) {
        continue;
      }
      
      // Extract name from header (before any parenthesis or newline)
      const headerMatch = section.match(/^([^\n(]+)/);
      if (!headerMatch) continue;
      
      let name = headerMatch[1].trim();
      
      // Look for **Name:** field to get the actual name
      const nameFieldMatch = section.match(/\*\*Name:\*\*\s*([^\n]+)/);
      if (nameFieldMatch) {
        name = nameFieldMatch[1].trim();
      }
      
      // Extract description (everything after **Description:**)
      const descMatch = section.match(/\*\*Description:\*\*\s*\n([\s\S]+?)(?=\n\*\*Role:|$)/);
      let description = '';
      
      if (descMatch) {
        description = descMatch[1].trim();
      } else {
        // If no **Description:** field, take everything after the name line
        const lines = section.split('\n').slice(1);
        description = lines.join('\n').trim();
      }
      
      // Clean up description - remove **Role:** section if present
      description = description.replace(/\*\*Role:\*\*[\s\S]*$/, '').trim();
      
      if (name && description) {
        characters.push({ name, description });
      }
    }
    
    return characters;
  }

  /**
   * Parse scenes from factorial-scenes.md
   * Expected format:
   * ## Scene N: Title
   * **Title:** Scene Title
   * **Description:**
   * Scene description...
   */
  static parseScenes(markdown: string): ParsedScene[] {
    const scenes: ParsedScene[] = [];
    
    // Split by ## headers
    const sections = markdown.split(/\n## /).filter(s => s.trim());
    
    for (const section of sections) {
      // Skip the main title section
      if (section.startsWith('#') || section.startsWith('Factorial Factory Scenes')) {
        continue;
      }
      
      // Extract title from header or **Title:** field
      let title = '';
      const headerMatch = section.match(/^Scene \d+:\s*([^\n]+)/);
      if (headerMatch) {
        title = headerMatch[1].trim();
      } else {
        const titleFieldMatch = section.match(/\*\*Title:\*\*\s*([^\n]+)/);
        if (titleFieldMatch) {
          title = titleFieldMatch[1].trim();
        }
      }
      
      // Extract description
      const descMatch = section.match(/\*\*Description:\*\*\s*\n([\s\S]+?)(?=\n---|\n##|$)/);
      let description = '';
      
      if (descMatch) {
        description = descMatch[1].trim();
      } else {
        // Take everything after the first line
        const lines = section.split('\n').slice(1);
        description = lines.join('\n').trim();
      }
      
      // Extract character names mentioned in the description
      const characterNames: string[] = [];
      
      // Look for "Manager" followed by a name
      const managerMatches = description.matchAll(/Manager\s+(\w+)/gi);
      for (const match of managerMatches) {
        const charName = `Manager ${match[1]}`;
        if (!characterNames.includes(charName)) {
          characterNames.push(charName);
        }
      }
      
      // Also check in the title
      const titleManagerMatch = title.match(/Manager\s+(\w+)/i);
      if (titleManagerMatch) {
        const charName = `Manager ${titleManagerMatch[1]}`;
        if (!characterNames.includes(charName)) {
          characterNames.push(charName);
        }
      }
      
      // Look for "Professor" or other character types
      if (description.match(/Professor\s+\w+/i) || title.match(/Professor/i)) {
        characterNames.push('Professor Factorial');
      }
      
      // Extract element names (machines, locations, props)
      const elementNames: string[] = [];
      
      // Multiplication machines
      if (description.match(/multiplication\s+machine/i) || description.match(/Calc-U-Tron/i)) {
        const levelMatch = title.match(/Level\s+(\d+)/i) || description.match(/Level\s+(\d+)/i);
        if (levelMatch) {
          elementNames.push(`Multiplication Machine (Level ${levelMatch[1]})`);
        } else {
          elementNames.push('Multiplication Machine');
        }
      }
      
      // Speaking tubes
      if (description.match(/speaking\s+tube/i)) {
        elementNames.push('Speaking Tube');
      }
      
      // Return tubes
      if (description.match(/return\s+tube/i)) {
        elementNames.push('Return Tube');
      }
      
      // Conveyor belts
      if (description.match(/conveyor\s+belt/i)) {
        elementNames.push('Conveyor Belt');
      }
      
      // Gears
      if (description.match(/gear/i)) {
        elementNames.push('Factory Gears');
      }
      
      // Order ticket
      if (description.match(/order\s+ticket/i)) {
        elementNames.push('Order Ticket');
      }
      
      // Base case sign/pedestal
      if (description.match(/base\s+case/i) || description.match(/golden\s+pedestal/i)) {
        elementNames.push('Base Case Pedestal');
      }
      
      // Factory levels/floors
      const levelMatch = title.match(/Level\s+(\d+)/i);
      if (levelMatch) {
        elementNames.push(`Factory Level ${levelMatch[1]}`);
      }
      
      if (title && description) {
        scenes.push({ title, description, characterNames, elementNames });
      }
    }
    
    return scenes;
  }

  /**
   * Parse stanzas from factorial-poem.md
   * Expected format:
   * ## Stanza N: Title (optional)
   * Poem text...
   */
  static parseStanzas(markdown: string): ParsedStanza[] {
    const stanzas: ParsedStanza[] = [];
    
    // Split by ## headers
    const sections = markdown.split(/\n## /).filter(s => s.trim());
    
    for (const section of sections) {
      // Skip the main title section
      if (section.startsWith('#')) {
        continue;
      }
      
      // Extract title from header
      let title = '';
      const headerMatch = section.match(/^([^\n]+)/);
      if (headerMatch) {
        title = headerMatch[1].trim();
      }
      
      // Extract content (everything after the header)
      const lines = section.split('\n').slice(1);
      const content = lines.join('\n').trim();
      
      if (title && content) {
        stanzas.push({ title, content });
      }
    }
    
    return stanzas;
  }

  /**
   * Parse all three files and return a complete bundle
   */
  static parseStoryBundle(
    charactersMarkdown: string,
    scenesMarkdown: string,
    poemMarkdown: string
  ): ParsedStoryBundle {
    return {
      characters: this.parseCharacters(charactersMarkdown),
      scenes: this.parseScenes(scenesMarkdown),
      stanzas: this.parseStanzas(poemMarkdown)
    };
  }

  /**
   * Helper to read file contents
   */
  static async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
}

