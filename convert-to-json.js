#!/usr/bin/env node

/**
 * Script to convert factorial markdown files to JSON format
 * Run: node convert-to-json.js
 */

import fs from 'fs';

// Read the markdown files
const charactersContent = fs.readFileSync('factorial-characters.md', 'utf8');
const scenesContent = fs.readFileSync('factorial-scenes.md', 'utf8');
const poemContent = fs.readFileSync('factorial-poem.md', 'utf8');

// Parse characters
const characters = [];
const characterSections = charactersContent.split(/\n## /).filter(s => s.trim() && !s.startsWith('#'));

for (const section of characterSections) {
  const nameMatch = section.match(/\*\*Name:\*\*\s*([^\n]+)/);
  const descMatch = section.match(/\*\*Description:\*\*\s*\n([\s\S]+?)(?=\n\*\*Role:|$)/);
  
  if (nameMatch && descMatch) {
    characters.push({
      name: nameMatch[1].trim(),
      description: descMatch[1].trim().replace(/\*\*Role:\*\*[\s\S]*$/, '').trim()
    });
  }
}

// Parse scenes
const scenes = [];
const sceneSections = scenesContent.split(/\n## /).filter(s => s.trim() && !s.startsWith('#'));

for (const section of sceneSections) {
  const titleMatch = section.match(/Scene \d+:\s*([^\n]+)/) || section.match(/\*\*Title:\*\*\s*([^\n]+)/);
  const descMatch = section.match(/\*\*Description:\*\*\s*\n([\s\S]+?)(?=\n---|\n##|$)/);
  
  if (titleMatch && descMatch) {
    const title = titleMatch[1].trim();
    const description = descMatch[1].trim();
    
    // Extract characters
    const characterNames = [];
    const managerMatches = description.matchAll(/Manager\s+(\w+)/gi);
    for (const match of managerMatches) {
      const name = `Manager ${match[1]}`;
      if (!characterNames.includes(name)) characterNames.push(name);
    }
    if (description.match(/Professor/i)) {
      characterNames.push('Professor Factorial');
    }
    
    // Extract elements
    const elementNames = [];
    if (description.match(/multiplication\s+machine/i)) {
      const levelMatch = title.match(/Level\s+(\d+)/i);
      if (levelMatch) elementNames.push(`Multiplication Machine (Level ${levelMatch[1]})`);
    }
    if (description.match(/speaking\s+tube/i)) elementNames.push('Speaking Tube');
    if (description.match(/return\s+tube/i)) elementNames.push('Return Tube');
    if (description.match(/conveyor\s+belt/i)) elementNames.push('Conveyor Belt');
    if (description.match(/gear/i)) elementNames.push('Factory Gears');
    if (description.match(/order\s+ticket/i)) elementNames.push('Order Ticket');
    if (description.match(/base\s+case/i)) elementNames.push('Base Case Pedestal');
    
    const levelMatch = title.match(/Level\s+(\d+)/i);
    if (levelMatch) elementNames.push(`Factory Level ${levelMatch[1]}`);
    
    scenes.push({
      title,
      description,
      characters: characterNames,
      elements: elementNames
    });
  }
}

// Parse poem stanzas
const stanzas = [];
const poemSections = poemContent.split(/\n## /).filter(s => s.trim() && !s.startsWith('#'));

for (const section of poemSections) {
  const headerMatch = section.match(/^([^\n]+)/);
  if (headerMatch) {
    const lines = section.split('\n').slice(1).join('\n').trim();
    if (lines) {
      stanzas.push(lines);
    }
  }
}

// Match stanzas to scenes
scenes.forEach((scene, index) => {
  if (stanzas[index]) {
    scene.textPanel = stanzas[index];
  }
});

// Define common elements
const commonElements = [
  {
    name: 'Multiplication Machine (Level 4)',
    description: 'A whimsical machine with personality, featuring dials, displays, conveyor belts for arms, and lights that glow when calculating. Makes happy whirring sounds during multiplication.',
    category: 'Machinery'
  },
  {
    name: 'Multiplication Machine (Level 3)',
    description: 'A whimsical machine with personality, featuring dials, displays, conveyor belts for arms, and lights that glow when calculating. Makes happy whirring sounds during multiplication.',
    category: 'Machinery'
  },
  {
    name: 'Multiplication Machine (Level 2)',
    description: 'A whimsical machine with personality, featuring dials, displays, conveyor belts for arms, and lights that glow when calculating. Makes happy whirring sounds during multiplication.',
    category: 'Machinery'
  },
  {
    name: 'Speaking Tube',
    description: 'A colorful communication tube that connects factory levels, used for passing questions downward during the recursive call process.',
    category: 'Machinery'
  },
  {
    name: 'Return Tube',
    description: 'A glowing tube that carries answers upward from lower levels, showing the return values flowing back up through the recursion.',
    category: 'Machinery'
  },
  {
    name: 'Conveyor Belt',
    description: 'A rainbow-colored segment conveyor belt that carries numbers and calculations between different parts of the factory floor.',
    category: 'Machinery'
  },
  {
    name: 'Factory Gears',
    description: 'Oversized gears labeled with numbers, spinning and turning as calculations proceed. Some are shaped like factorial symbols (!).',
    category: 'Machinery'
  },
  {
    name: 'Order Ticket',
    description: 'A floating pneumatic ticket showing the factorial calculation request (e.g., "4!"), delivered from above to start the process.',
    category: 'Props'
  },
  {
    name: 'Base Case Pedestal',
    description: 'A golden, glowing pedestal marking the foundation level where 1! = 1. Has special importance as the stopping point of recursion.',
    category: 'Set Pieces'
  },
  {
    name: 'Factory Level 4',
    description: 'The top factory floor representing recursion depth 4, where the initial request arrives.',
    category: 'Set Pieces'
  },
  {
    name: 'Factory Level 3',
    description: 'Factory floor representing recursion depth 3, one level down from the top.',
    category: 'Set Pieces'
  },
  {
    name: 'Factory Level 2',
    description: 'Factory floor representing recursion depth 2, two levels down from the top.',
    category: 'Set Pieces'
  },
  {
    name: 'Factory Level 1',
    description: 'The foundation factory floor representing recursion depth 1 - the base case level.',
    category: 'Set Pieces'
  }
];

// Build final JSON
const storyData = {
  story: {
    title: 'Calculating 4!',
    backgroundSetup: 'The students are learning about recursion and factorial calculations through a magical factory where each level represents a recursive function call.'
  },
  characters,
  elements: commonElements,
  scenes
};

// Write to file
fs.writeFileSync('factorial-story.json', JSON.stringify(storyData, null, 2));
console.log('✅ Created factorial-story.json');
console.log(`   ${characters.length} characters`);
console.log(`   ${commonElements.length} elements`);
console.log(`   ${scenes.length} scenes`);

