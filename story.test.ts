/**
 * Unit tests for story.ts utility
 * 
 * Run with: npm test (you'll need to add vitest or jest to package.json)
 */

import { describe, it, expect } from 'vitest';
import {
  extractCharacterReferences,
  extractElementReferences,
  extractOnlyCharacterReferences,
  validateStoryReferences,
  toImportFormat,
  createStory,
  type StoryDefinition
} from './story';

describe('extractCharacterReferences', () => {
  it('should extract single reference', () => {
    const text = "The {Manager Four} walks into the room.";
    expect(extractCharacterReferences(text)).toEqual(['Manager Four']);
  });

  it('should extract multiple references', () => {
    const text = "{Manager Four} talks to {Manager Three} about the {Speaking Tube}.";
    expect(extractCharacterReferences(text)).toEqual(['Manager Four', 'Manager Three', 'Speaking Tube']);
  });

  it('should handle duplicate references', () => {
    const text = "{Manager Four} says hello. {Manager Four} waves.";
    expect(extractCharacterReferences(text)).toEqual(['Manager Four']);
  });

  it('should return empty array for no references', () => {
    const text = "No references here.";
    expect(extractCharacterReferences(text)).toEqual([]);
  });

  it('should handle nested braces', () => {
    const text = "The {Complex {Name}} is here.";
    expect(extractCharacterReferences(text)).toContain('Complex {Name');
  });
});

describe('extractElementReferences', () => {
  it('should filter only element references', () => {
    const text = "{Manager Four} uses the {Speaking Tube}.";
    const elementNames = ['Speaking Tube', 'Factory Gears'];
    expect(extractElementReferences(text, elementNames)).toEqual(['Speaking Tube']);
  });

  it('should return empty for no elements', () => {
    const text = "{Manager Four} walks around.";
    const elementNames = ['Speaking Tube'];
    expect(extractElementReferences(text, elementNames)).toEqual([]);
  });
});

describe('extractOnlyCharacterReferences', () => {
  it('should separate characters from elements', () => {
    const text = "{Manager Four} uses the {Speaking Tube} to call {Manager Three}.";
    const characterNames = ['Manager Four', 'Manager Three'];
    const elementNames = ['Speaking Tube'];
    
    const result = extractOnlyCharacterReferences(text, characterNames, elementNames);
    expect(result).toEqual(['Manager Four', 'Manager Three']);
    expect(result).not.toContain('Speaking Tube');
  });
});

describe('validateStoryReferences', () => {
  it('should validate a correct story', () => {
    const story: StoryDefinition = {
      story: { title: 'Test', backgroundSetup: 'Test background' },
      characters: [{ name: 'Alice', description: 'A character' }],
      elements: [{ name: 'Sword', description: 'A weapon' }],
      scenes: [{
        title: 'Scene 1',
        description: '{Alice} picks up the {Sword}.'
      }]
    };

    const result = validateStoryReferences(story);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect invalid character reference', () => {
    const story: StoryDefinition = {
      story: { title: 'Test', backgroundSetup: 'Test background' },
      characters: [{ name: 'Alice', description: 'A character' }],
      elements: [],
      scenes: [{
        title: 'Scene 1',
        description: '{Bob} appears.'
      }]
    };

    const result = validateStoryReferences(story);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Bob');
  });

  it('should detect multiple errors', () => {
    const story: StoryDefinition = {
      story: { title: 'Test', backgroundSetup: 'Test background' },
      characters: [],
      elements: [],
      scenes: [
        {
          title: 'Scene 1',
          description: '{Alice} meets {Bob}.'
        },
        {
          title: 'Scene 2',
          description: '{Charlie} arrives.'
        }
      ]
    };

    const result = validateStoryReferences(story);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('toImportFormat', () => {
  it('should convert story to import format', () => {
    const story: StoryDefinition = {
      story: { title: 'Test Story', backgroundSetup: 'A test' },
      characters: [
        { name: 'Alice', description: 'Protagonist' },
        { name: 'Bob', description: 'Sidekick' }
      ],
      elements: [
        { name: 'Sword', description: 'A weapon', category: 'Weapons' }
      ],
      scenes: [{
        title: 'The Meeting',
        description: '{Alice} meets {Bob} and picks up a {Sword}.',
        textPanel: 'A meeting occurs!'
      }]
    };

    const result = toImportFormat(story);
    
    expect(result.story).toEqual(story.story);
    expect(result.characters).toEqual(story.characters);
    expect(result.elements).toEqual(story.elements);
    expect(result.scenes).toHaveLength(1);
    expect(result.scenes[0].characters).toEqual(['Alice', 'Bob']);
    expect(result.scenes[0].elements).toEqual(['Sword']);
  });

  it('should handle scenes with no references', () => {
    const story: StoryDefinition = {
      story: { title: 'Test', backgroundSetup: 'Test' },
      characters: [{ name: 'Alice', description: 'A character' }],
      elements: [],
      scenes: [{
        title: 'Empty Scene',
        description: 'Nothing happens here.'
      }]
    };

    const result = toImportFormat(story);
    expect(result.scenes[0].characters).toEqual([]);
    expect(result.scenes[0].elements).toEqual([]);
  });
});

describe('createStory', () => {
  it('should create a valid story', () => {
    const definition: StoryDefinition = {
      story: { title: 'Test', backgroundSetup: 'Test' },
      characters: [{ name: 'Alice', description: 'A character' }],
      elements: [],
      scenes: [{
        title: 'Scene 1',
        description: '{Alice} walks.'
      }]
    };

    const { story, validation } = createStory(definition);
    expect(story).toEqual(definition);
    expect(validation.valid).toBe(true);
  });

  it('should create story with validation warnings', () => {
    const definition: StoryDefinition = {
      story: { title: 'Test', backgroundSetup: 'Test' },
      characters: [],
      elements: [],
      scenes: [{
        title: 'Scene 1',
        description: '{UnknownCharacter} appears.'
      }]
    };

    const { story, validation } = createStory(definition);
    expect(story).toEqual(definition);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

describe('Integration: Factorial Story Example', () => {
  it('should correctly parse factorial story references', () => {
    const story: StoryDefinition = {
      story: {
        title: "Test Factorial",
        backgroundSetup: "A factory."
      },
      characters: [
        { name: "Manager Four", description: "The top manager" },
        { name: "Manager Three", description: "Middle manager" }
      ],
      elements: [
        { name: "Speaking Tube", description: "Communication device", category: "Machinery" },
        { name: "Factory Gears", description: "Spinning gears", category: "Machinery" }
      ],
      scenes: [
        {
          title: "Level 4",
          description: "{Manager Four} uses the {Speaking Tube} while {Factory Gears} spin. She calls {Manager Three}.",
          textPanel: "Four factorial begins!"
        }
      ]
    };

    const validation = validateStoryReferences(story);
    expect(validation.valid).toBe(true);

    const importFormat = toImportFormat(story);
    expect(importFormat.scenes[0].characters).toEqual(['Manager Four', 'Manager Three']);
    expect(importFormat.scenes[0].elements).toEqual(['Speaking Tube', 'Factory Gears']);
  });
});

