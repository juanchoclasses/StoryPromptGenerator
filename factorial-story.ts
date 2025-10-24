/**
 * Factorial Factory Story Definition
 * 
 * This demonstrates how to define a story using the story.ts utility.
 * Notice how we use {CharacterName} and {ElementName} in descriptions
 * for automatic reference extraction.
 */

import { StoryDefinition, createStory, toImportFormat } from './story';

const factorialStory: StoryDefinition = {
  story: {
    title: "Calculating 4!",
    backgroundSetup: "The students are learning about recursion and factorial calculations through a magical factory where each level represents a recursive function call."
  },
  
  characters: [
    {
      name: "Manager Four",
      description: "A tall, enthusiastic character wearing a hard hat shaped like the number \"4\" with a factorial symbol (!) on top. She has four arms, each holding different tools: a speaking tube, a multiplication wrench, an order clipboard, and a celebration banner. Her vest is covered in badges showing \"4×3×2×1\" and she wears glasses shaped like multiplication signs. She's colored in bold ruby red with gold accents."
    },
    {
      name: "Manager Three",
      description: "A medium-height character with three ponytails that bounce when she moves, each decorated with a small gear. Her hard hat is shaped like the number \"3\" and glows softly. She has three eyes arranged in a triangle on her face (whimsical style). She wears a jumpsuit with three pockets and her body has gentle curves like the number 3. She's colored in emerald green with silver accents."
    },
    {
      name: "Manager Two",
      description: "A character with a body shaped like two stacked circles, making him literally look like the number \"2\". His hard hat has two antennae with small lights on top. His outfit is a two-tone uniform: half sapphire blue, half sky blue, split down the middle. He wears goggles with two lenses that can swivel independently."
    },
    {
      name: "Manager One",
      description: "A small but MIGHTY character who stands on a glowing pedestal. She's shaped like the number \"1\"—tall, thin, and perfectly straight, but with a large round head and a big smile. She wears a golden crown-shaped hard hat with \"BASE CASE\" written on it. Her outfit is completely golden with amethyst purple accents. She carries a stamp that says \"1! = 1\"."
    },
    {
      name: "Professor Factorial",
      description: "A wise, elderly character with a beard shaped like a factorial symbol (!). Wears a top hat with the recursive formula \"n! = n × (n-1)!\" written around the brim. Has a pocket watch that runs backwards and forwards simultaneously."
    }
  ],
  
  elements: [
    {
      name: "Speaking Tube",
      description: "A colorful communication tube that connects factory levels, used for passing questions downward during the recursive call process.",
      category: "Machinery"
    },
    {
      name: "Factory Gears",
      description: "Oversized gears labeled with numbers, spinning and turning as calculations proceed. Some are shaped like factorial symbols (!).",
      category: "Machinery"
    },
    {
      name: "Order Ticket",
      description: "A floating pneumatic ticket showing the factorial calculation request (e.g., \"4!\"), delivered from above to start the process.",
      category: "Props"
    },
    {
      name: "Multiplication Machine",
      description: "A whimsical machine with personality, featuring dials, displays, conveyor belts for arms, and lights that glow when calculating.",
      category: "Machinery"
    }
  ],
  
  scenes: [
    {
      title: "The Order Arrives",
      description: "The top floor of the Factorial Factory. A large \"4!\" {Order Ticket} floats down from a pneumatic tube into the hands of {Manager Four}. The room is bright and busy, with {Factory Gears} labeled \"4\" spinning slowly. A large multiplication board shows \"4 × ?\" with a question mark glowing. A {Speaking Tube} extends downward through the floor, and {Manager Four} is leaning over it, calling down to Level 3. The atmosphere is one of anticipation—work has just begun!",
      textPanel: "The order comes in: \"Calculate four!\"\nThe manager says, \"I can't do this alone, that's for sure!\"\nFour-factorial means four times three-factorial, you see,\nSo I'll call the next floor down and wait patiently!"
    },
    {
      title: "Level 3 Springs to Life",
      description: "Level 3 of the factory, positioned one floor below Level 4. {Manager Three} is catching the message coming through a {Speaking Tube} from below, while simultaneously listening to another {Speaking Tube} from Level 4 above. The room is decorated with {Factory Gears} showing \"3\" and multiplication tables on the walls. A {Multiplication Machine} labeled \"3 × ?\" waits to process. {Manager Three} is pointing downward to Level 2, ready to pass along her own question.",
      textPanel: "Down on Level Three, a new manager appears,\n\"Calculate three-factorial!\" rings in her ears.\nBut three times two-factorial is what she must find,\nSo she calls Level Two—another floor to unwind!"
    },
    {
      title: "Level 2 Gets to Work",
      description: "Level 2 of the factory, two floors below the top. {Manager Two} is at his workstation, which features prominent {Factory Gears} labeled \"2\" and a {Multiplication Machine} showing \"2 × ?\". He's speaking into a {Speaking Tube} that descends to Level 1. The room has two speaking tubes—one coming from Level 3 above, one going to Level 1 below. The factory machinery is elaborate but patient, showing how each level depends on the next.",
      textPanel: "Level Two springs to life with a whirr and a clank,\nThe manager says, \"Two-factorial? I need a lower rank!\"\n\"Two times one-factorial,\" he carefully states,\nAnd calls Level One while his answer awaits!"
    },
    {
      title: "Level 1 - The Base Case",
      description: "Level 1 of the factory—the deepest floor with a special golden glow. {Manager One} is at her station, which is simpler but more important than the others. A large sign reads \"BASE CASE - 1! = 1\" in glowing letters. Unlike other levels, this floor has NO {Speaking Tube} going downward—this is where the recursion stops! {Manager One} stands proudly with her stamp ready. The room has a foundational feeling, like the bedrock of the factory.",
      textPanel: "Down at Level One, the call comes through clear,\n\"We need one-factorial!\" the message appears.\nThe manager grins—this is easy to do,\n\"One-factorial equals one—that's always true!\""
    }
  ]
};

// Create and validate the story
export const { story, validation } = createStory(factorialStory);

// Export in import format for use with the application
export const factorialStoryImport = toImportFormat(story);

// Log validation results
if (!validation.valid) {
  console.error('Story validation failed:', validation.errors);
} else {
  console.log('✅ Factorial story is valid!');
}

