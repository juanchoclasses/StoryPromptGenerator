# Story Definition Guide

This guide explains how to define stories programmatically using the `story.ts` utility for better maintainability and testability.

## Why Use TypeScript for Story Definitions?

1. **Type Safety**: Catch errors at compile time
2. **Testability**: Write unit tests for your story structure
3. **Refactoring**: Easier to update character/element names
4. **Auto-completion**: IDE support for story structure
5. **Validation**: Automatic checking of character/element references

## Basic Syntax

### Character and Element References

Use `{CharacterName}` or `{ElementName}` in scene descriptions to automatically link them:

```typescript
const scene = {
  title: "The Meeting",
  description: "{Alice} picks up the {Magic Sword} and greets {Bob}."
};
```

This will automatically:
- Extract character references: `["Alice", "Bob"]`
- Extract element references: `["Magic Sword"]`
- Validate that these exist in your character/element lists

## Creating a Story

### 1. Define Your Story Structure

```typescript
import { StoryDefinition, createStory, toImportFormat } from './story';

const myStory: StoryDefinition = {
  story: {
    title: "My Story Title",
    backgroundSetup: "Setting and world description..."
  },
  
  characters: [
    {
      name: "Alice",
      description: "A brave adventurer with red hair..."
    },
    {
      name: "Bob",
      description: "A wise wizard in blue robes..."
    }
  ],
  
  elements: [
    {
      name: "Magic Sword",
      description: "An ancient blade that glows...",
      category: "Weapons"
    }
  ],
  
  scenes: [
    {
      title: "Scene 1",
      description: "{Alice} meets {Bob} in the forest. They find a {Magic Sword} hidden in a stone.",
      textPanel: "The adventure begins!\nOur heroes meet for the first time."
    }
  ]
};
```

### 2. Validate and Export

```typescript
// Create with validation
export const { story, validation } = createStory(myStory);

// Check validation results
if (!validation.valid) {
  console.error('Story validation failed:', validation.errors);
}

// Convert to import format
export const myStoryImport = toImportFormat(story);
```

### 3. Generate JSON for Import

```typescript
// In a separate script file (e.g., generate-story.ts)
import { factorialStoryImport } from './factorial-story';
import fs from 'fs';

fs.writeFileSync(
  'factorial-story.json',
  JSON.stringify(factorialStoryImport, null, 2)
);
```

## Testing Your Story

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { validateStoryReferences } from './story';
import { myStory } from './my-story';

describe('My Story', () => {
  it('should have valid character references', () => {
    const validation = validateStoryReferences(myStory);
    expect(validation.valid).toBe(true);
  });

  it('should have all required scenes', () => {
    expect(myStory.scenes).toHaveLength(5);
  });

  it('should reference all characters', () => {
    const characterNames = myStory.characters.map(c => c.name);
    // Add custom validation logic
  });
});
```

### Running Tests

```bash
# Install dependencies first
npm install

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Advantages Over JSON/Markdown

### Before (JSON):
```json
{
  "scenes": [{
    "description": "Manager Four uses the Speaking Tube",
    "characters": ["Manager Four"],
    "elements": ["Speaking Tube"]
  }]
}
```

**Problems:**
- Character/element arrays must be manually kept in sync
- No validation until import
- Typos cause silent failures
- Hard to refactor names

### After (TypeScript):
```typescript
{
  scenes: [{
    description: "{Manager Four} uses the {Speaking Tube}"
  }]
}
```

**Benefits:**
- ✅ References extracted automatically
- ✅ Validated at definition time
- ✅ Find all uses of a character with IDE search
- ✅ Rename refactoring works across all scenes
- ✅ Human-readable and parseable

## API Reference

### `extractCharacterReferences(text: string): string[]`
Extract all `{Reference}` patterns from text.

### `validateStoryReferences(story: StoryDefinition): { valid: boolean, errors: string[] }`
Check that all references exist in character/element lists.

### `toImportFormat(story: StoryDefinition): any`
Convert TypeScript story to JSON import format.

### `createStory(definition: StoryDefinition)`
Create and validate a story, returns `{ story, validation }`.

## Example: Factorial Story

See `factorial-story.ts` for a complete example of a story using this system.

## Best Practices

1. **Always use `{References}`** for characters and elements
2. **Run validation** before exporting to JSON
3. **Write tests** for your story structure
4. **Use descriptive names** that match how they appear in text
5. **Group related elements** by category

## Migration from JSON/Markdown

To convert existing stories:

1. Copy character/element definitions from JSON
2. Rewrite scene descriptions to use `{Reference}` syntax
3. Run validation to catch any issues
4. Export to JSON for import

## Future Enhancements

Potential additions to this system:
- Macro expansion (e.g., `{SceneDescription}`)
- Story composition (combine multiple stories)
- Character relationship graphs
- Timeline validation
- Automated prompt generation
- Visual story editor integration

