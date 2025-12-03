import { describe, it, expect } from 'vitest';
import { MarkdownStoryParser } from '../../src/services/MarkdownStoryParser';

describe('MarkdownStoryParser', () => {
  describe('parseCharacters', () => {
    it('should parse basic character format', () => {
      const markdown = `
# Characters

## Alice
**Name:** Alice Wonder
**Description:**
A brave hero who loves adventures
`;
      
      const characters = MarkdownStoryParser.parseCharacters(markdown);
      
      expect(characters).toHaveLength(1);
      expect(characters[0].name).toBe('Alice Wonder');
      expect(characters[0].description).toBe('A brave hero who loves adventures');
    });

    it('should parse character without Name field', () => {
      const markdown = `
## Bob the Builder
**Description:**
A skilled craftsman
`;
      
      const characters = MarkdownStoryParser.parseCharacters(markdown);
      
      expect(characters).toHaveLength(1);
      expect(characters[0].name).toBe('Bob the Builder');
    });

    it('should parse description without Description field', () => {
      const markdown = `
## Charlie
A mysterious character who appears in the shadows
`;
      
      const characters = MarkdownStoryParser.parseCharacters(markdown);
      
      expect(characters).toHaveLength(1);
      expect(characters[0].name).toBe('Charlie');
      expect(characters[0].description).toBe('A mysterious character who appears in the shadows');
    });

    it('should remove Role section from description', () => {
      const markdown = `
## Dave
**Description:**
A wizard with great power
**Role:** Mentor
`;
      
      const characters = MarkdownStoryParser.parseCharacters(markdown);
      
      expect(characters).toHaveLength(1);
      expect(characters[0].description).toBe('A wizard with great power');
      expect(characters[0].description).not.toContain('Role:');
    });

    it('should skip main title section', () => {
      const markdown = `
# Factorial Factory Characters

## Alice
**Description:**
A hero
`;
      
      const characters = MarkdownStoryParser.parseCharacters(markdown);
      
      expect(characters).toHaveLength(1);
      expect(characters[0].name).toBe('Alice');
    });

    it('should handle multiple characters', () => {
      const markdown = `
## Alice
**Description:**
Hero

## Bob
**Description:**
Sidekick

## Charlie
**Description:**
Villain
`;
      
      const characters = MarkdownStoryParser.parseCharacters(markdown);
      
      expect(characters).toHaveLength(3);
      expect(characters[0].name).toBe('Alice');
      expect(characters[1].name).toBe('Bob');
      expect(characters[2].name).toBe('Charlie');
    });

    it('should handle character name with subtitle in parentheses', () => {
      const markdown = `
## Manager Alpha (The First Manager)
**Name:** Manager Alpha
**Description:**
The original manager
`;
      
      const characters = MarkdownStoryParser.parseCharacters(markdown);
      
      expect(characters).toHaveLength(1);
      expect(characters[0].name).toBe('Manager Alpha');
    });

    it('should handle empty markdown', () => {
      const characters = MarkdownStoryParser.parseCharacters('');
      expect(characters).toHaveLength(0);
    });

    it('should skip sections without both name and description', () => {
      const markdown = `
## Alice
**Description:**
A hero

## 

## Bob
No description field
`;
      
      const characters = MarkdownStoryParser.parseCharacters(markdown);
      
      expect(characters).toHaveLength(2);
    });
  });

  describe('parseScenes', () => {
    it('should parse basic scene format', () => {
      const markdown = `
# Scenes

## Scene 1: The Beginning
**Title:** The Beginning
**Description:**
Our hero starts their journey with Manager Alpha
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].title).toBe('The Beginning');
      expect(scenes[0].description).toContain('Our hero starts their journey');
    });

    it('should extract title from Scene N: format', () => {
      const markdown = `
## Scene 2: The Challenge
**Description:**
A difficult test
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].title).toBe('The Challenge');
    });

    it('should extract title from Title field', () => {
      const markdown = `
## Something
**Title:** The Real Title
**Description:**
The scene description
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].title).toBe('The Real Title');
    });

    it('should extract character names from Manager pattern', () => {
      const markdown = `
## Scene 1: Meeting
**Description:**
Manager Alpha and Manager Beta discuss the plan with Manager Gamma
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].characterNames).toContain('Manager Alpha');
      expect(scenes[0].characterNames).toContain('Manager Beta');
      expect(scenes[0].characterNames).toContain('Manager Gamma');
    });

    it('should extract Manager from title', () => {
      const markdown = `
## Scene 1: Manager Alpha Arrives
**Description:**
The scene begins
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].characterNames).toContain('Manager Alpha');
    });

    it('should detect Professor Factorial', () => {
      const markdown = `
## Scene 1: The Lecture
**Description:**
Professor Factorial explains the concept
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].characterNames).toContain('Professor Factorial');
    });

    it('should extract element: Multiplication Machine', () => {
      const markdown = `
## Scene 1: Level 3
**Description:**
The multiplication machine whirs to life
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].elementNames).toContain('Multiplication Machine (Level 3)');
    });

    it('should extract Multiplication Machine without level', () => {
      const markdown = `
## Scene 1: The Machine
**Description:**
The multiplication machine operates
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].elementNames).toContain('Multiplication Machine');
    });

    it('should extract element: Speaking Tube', () => {
      const markdown = `
## Scene 1: Communication
**Description:**
They use the speaking tube to communicate
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].elementNames).toContain('Speaking Tube');
    });

    it('should extract element: Return Tube', () => {
      const markdown = `
## Scene 1: Return
**Description:**
The result comes back through the return tube
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].elementNames).toContain('Return Tube');
    });

    it('should extract element: Conveyor Belt', () => {
      const markdown = `
## Scene 1: Transport
**Description:**
Items move on the conveyor belt
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].elementNames).toContain('Conveyor Belt');
    });

    it('should extract element: Factory Gears', () => {
      const markdown = `
## Scene 1: Machinery
**Description:**
The gears turn smoothly
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].elementNames).toContain('Factory Gears');
    });

    it('should extract element: Order Ticket', () => {
      const markdown = `
## Scene 1: The Order
**Description:**
The order ticket arrives
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].elementNames).toContain('Order Ticket');
    });

    it('should extract element: Base Case Pedestal', () => {
      const markdown = `
## Scene 1: The Foundation
**Description:**
The golden pedestal marks the base case
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].elementNames).toContain('Base Case Pedestal');
    });

    it('should extract Factory Level from title', () => {
      const markdown = `
## Scene 1: Level 5 Operations
**Description:**
Work continues on the fifth floor
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].elementNames).toContain('Factory Level 5');
    });

    it('should skip main title section', () => {
      const markdown = `
# Factorial Factory Scenes

## Scene 1: Test
**Description:**
A test scene
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].title).toBe('Test');
    });

    it('should handle empty markdown', () => {
      const scenes = MarkdownStoryParser.parseScenes('');
      expect(scenes).toHaveLength(0);
    });

    it('should not duplicate character names', () => {
      const markdown = `
## Scene 1: Manager Alpha Meets Manager Alpha
**Description:**
Manager Alpha talks to themselves somehow
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      // Should only have one instance of Manager Alpha
      const alphaCount = scenes[0].characterNames.filter(n => n === 'Manager Alpha').length;
      expect(alphaCount).toBe(1);
    });

    it('should detect Calc-U-Tron as multiplication machine', () => {
      const markdown = `
## Scene 1: The Machine
**Description:**
The Calc-U-Tron processes numbers
`;
      
      const scenes = MarkdownStoryParser.parseScenes(markdown);
      
      expect(scenes).toHaveLength(1);
      expect(scenes[0].elementNames).toContain('Multiplication Machine');
    });
  });

  describe('parseStanzas', () => {
    it('should parse basic stanza format', () => {
      const markdown = `
# Poem

## Stanza 1: The Beginning
In a factory tall and bright
Where numbers dance in morning light
`;
      
      const stanzas = MarkdownStoryParser.parseStanzas(markdown);
      
      expect(stanzas).toHaveLength(1);
      expect(stanzas[0].title).toBe('Stanza 1: The Beginning');
      expect(stanzas[0].content).toContain('In a factory tall');
    });

    it('should parse multiple stanzas', () => {
      const markdown = `
## Stanza 1
First verse
Second line

## Stanza 2
Third verse
Fourth line

## Stanza 3
Fifth verse
Sixth line
`;
      
      const stanzas = MarkdownStoryParser.parseStanzas(markdown);
      
      expect(stanzas).toHaveLength(3);
      expect(stanzas[0].title).toBe('Stanza 1');
      expect(stanzas[1].title).toBe('Stanza 2');
      expect(stanzas[2].title).toBe('Stanza 3');
    });

    it('should preserve line breaks in content', () => {
      const markdown = `
## Stanza 1
Line one
Line two
Line three
`;
      
      const stanzas = MarkdownStoryParser.parseStanzas(markdown);
      
      expect(stanzas).toHaveLength(1);
      expect(stanzas[0].content).toBe('Line one\nLine two\nLine three');
    });

    it('should skip main title section starting with #', () => {
      const markdown = `
# The Factorial Poem

## Stanza 1
Content here
`;
      
      const stanzas = MarkdownStoryParser.parseStanzas(markdown);
      
      expect(stanzas).toHaveLength(1);
      expect(stanzas[0].title).toBe('Stanza 1');
    });

    it('should handle empty markdown', () => {
      const stanzas = MarkdownStoryParser.parseStanzas('');
      expect(stanzas).toHaveLength(0);
    });

    it('should skip stanzas without content', () => {
      const markdown = `
## Stanza 1
Good content

## Empty Stanza

## Stanza 2
More content
`;
      
      const stanzas = MarkdownStoryParser.parseStanzas(markdown);
      
      expect(stanzas).toHaveLength(2);
      expect(stanzas[0].title).toBe('Stanza 1');
      expect(stanzas[1].title).toBe('Stanza 2');
    });
  });

  describe('parseStoryBundle', () => {
    it('should parse all three markdown types', () => {
      const charactersMarkdown = `
## Alice
**Description:**
A hero
`;

      const scenesMarkdown = `
## Scene 1: The Start
**Description:**
The beginning
`;

      const poemMarkdown = `
## Stanza 1
Roses are red
`;
      
      const bundle = MarkdownStoryParser.parseStoryBundle(
        charactersMarkdown,
        scenesMarkdown,
        poemMarkdown
      );
      
      expect(bundle.characters).toHaveLength(1);
      expect(bundle.scenes).toHaveLength(1);
      expect(bundle.stanzas).toHaveLength(1);
    });

    it('should handle empty inputs', () => {
      const bundle = MarkdownStoryParser.parseStoryBundle('', '', '');
      
      expect(bundle.characters).toHaveLength(0);
      expect(bundle.scenes).toHaveLength(0);
      expect(bundle.stanzas).toHaveLength(0);
    });
  });
});


