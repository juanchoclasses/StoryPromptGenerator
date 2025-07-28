#!/usr/bin/env node

// Test script to verify migration preserves existing data
const fs = require('fs');

// Simulate old data structure with characters in stories
const oldData = {
  version: '0.9.0',
  stories: [
    {
      id: 'story1',
      title: 'Test Story 1',
      backgroundSetup: 'Test background',
      cast: [
        {
          id: 'char1',
          name: 'Test Character 1',
          description: 'A test character'
        },
        {
          id: 'char2', 
          name: 'Test Character 2',
          description: 'Another test character'
        }
      ],
      elements: [
        {
          id: 'elem1',
          name: 'Test Element 1',
          description: 'A test element',
          category: 'Props'
        }
      ],
      scenes: [
        {
          id: 'scene1',
          title: 'Test Scene',
          description: 'A test scene',
          characterIds: ['char1'],
          elementIds: ['elem1'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'story2',
      title: 'Test Story 2', 
      backgroundSetup: 'Another background',
      cast: [
        {
          id: 'char3',
          name: 'Test Character 3',
          description: 'A third test character'
        }
      ],
      elements: [],
      scenes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  lastUpdated: new Date()
};

console.log('Old data structure:');
console.log('- Stories:', oldData.stories.length);
console.log('- Total characters:', oldData.stories.reduce((sum, story) => sum + story.cast.length, 0));
console.log('- Total elements:', oldData.stories.reduce((sum, story) => sum + story.elements.length, 0));

// Import the migration service (you'll need to run this in the actual app context)
console.log('\nMigration would:');
console.log('- Move all characters to global characters array');
console.log('- Move all elements to global elements array'); 
console.log('- Remove cast and elements from individual stories');
console.log('- Preserve all character and element data');
console.log('- Update scene references to use global IDs');

console.log('\nExpected result:');
console.log('- Global characters:', 3);
console.log('- Global elements:', 1);
console.log('- Stories without cast/elements arrays');
console.log('- All scene characterIds and elementIds preserved'); 