# Story Generation Template for Code Academy Stories

## Required Information to Gather:

### 1. Professor Information
**Question:** Who is the professor teaching this topic?
- Name:
- Description: (appearance, clothing, mannerisms, teaching style, props they carry)

### 2. Topic Information
**Question:** What is the topic being taught?
- Topic name:
- Key concepts to cover:
- Complexity/level:

### 3. Detailed Requirements
**Question:** What detailed explanation or approach do you want?
- Teaching approach: (visual metaphor, step-by-step, hands-on demonstration)
- Key learning objectives:
- Examples or demonstrations to include:
- Specific array/data to use:

### 4. Story Length
**Question:** How many pages/scenes do you want?
- Number of scenes: (8-12 recommended)

## Story Structure Template:

```json
{
  "story": {
    "title": "[Topic]: [Catchy Subtitle]",
    "backgroundSetup": "[Magical classroom description with theme relevant to topic]. [Professor name] teaches here, [teaching style description]. IMPORTANT: All characters ([Professor name] and students) should be positioned in the BOTTOM HALF of the image, with the code panels, stage elements, and visual demonstrations in the top half.",
    "description": "A whimsical introduction to [topic] through [metaphor/approach]"
  },
  "characters": [
    {
      "name": "[Professor Name]",
      "description": "[Full professor description from user]"
    },
    {
      "name": "Student Eager Noodler",
      "description": "A small, round student with a head shaped like a perfectly smooth, bright green apple, from which two long, springy antennae sprout, constantly twitching with curiosity. They wear an oversized, striped scarf that wraps around them multiple times, ending in a tassel that bounces as they nod vigorously. Their eyes are wide and perpetually amazed, and they often have a tiny, wobbly pencil clutched in a three-fingered hand, ready to scribble notes."
    },
    {
      "name": "student Thoughtful Giggler",
      "description": "A tall, lanky student with a head that's a stack of three wobbly, different-sized spheres, each a different shade of blue. They have enormous, floppy ears that droop when they're confused and perk up when they understand. Their smile is wide and stretches almost ear to ear, and they often emit soft, bubbling giggles as they ponder concepts. They wear pants that are far too short, revealing long, segmented legs that end in enormous, flat feet."
    },
    {
      "name": "Student Zippy Zapper",
      "description": "A vibrant, energetic student whose body is a series of interconnected, brightly colored zig-zags, always in motion. Their hair is a burst of spiky yellow and orange, standing straight up as if charged with static. They have four small, quick-moving arms, each ending in a suction cup, and their large, round eyes dart around, taking everything in. They have no discernible mouth but communicate through a series of enthusiastic 'boings' and 'zings'"
    },
    {
      "name": "Student Quiet observer",
      "description": "A shy, somewhat squarish student with a soft, fuzzy purple body and tiny, barely visible legs. Their head is a perfect cube, and instead of eyes, they have two large, circular lenses that slowly adjust, observing everything with intense focus. They carry a small, portable periscope that they often peer through, even in class. They rarely speak, but when they do, it's in a gentle, melodious hum, and they often sketch intricate diagrams in a tiny notebook."
    }
  ],
  "elements": [
    {
      "name": "[Classroom Name]",
      "description": "[Description of main teaching space, themed to topic]",
      "category": "Rooms"
    },
    {
      "name": "[Set Piece 1]",
      "description": "[Description of key visual element or demonstration tool]",
      "category": "Set Pieces"
    },
    {
      "name": "[Machinery 1]",
      "description": "[Description of interactive teaching device or tracker]",
      "category": "Machinery"
    }
  ],
  "scenes": [
    {
      "title": "[Scene Title]",
      "description": "[Detailed scene description: what's happening, who's doing what, visual elements, student reactions]",
      "textPanel": "[Dr. Seuss-style rhyming stanzas]\n[4 lines per stanza]\n[Maximum 2 stanzas (8 lines total)]\n[Must rhyme AABB or ABAB]\n[Explain the concept being taught]",
      "diagramPanel": {
        "type": "code",
        "content": "[Python code example]\n[NO character references in code]\n[Only code comments explaining the concept]\n[Clean, educational code]",
        "language": "python",
        "style": {
          "boardStyle": "blackboard",
          "position": "top-center",
          "widthPercentage": 60-70,
          "heightPercentage": 20-40,
          "autoScale": true,
          "backgroundColor": "#2d3748",
          "foregroundColor": "#ffffff",
          "borderColor": "#8b7355",
          "borderWidth": 3,
          "padding": 15,
          "fontSize": 14-18,
          "gutterTop": 20,
          "gutterBottom": 0,
          "gutterLeft": 0,
          "gutterRight": 0
        }
      },
      "characters": [
        "[Professor Name]",
        "Student Eager Noodler",
        "student Thoughtful Giggler",
        "Student Zippy Zapper",
        "Student Quiet observer"
      ],
      "elements": [
        "[Relevant elements from elements list]"
      ]
    }
  ]
}
```

## Story Arc Guidelines:

### Recommended Scene Progression (for 10-12 scenes):
1. **Welcome/Introduction** - Introduce topic, professor welcomes students
2. **Basic Concept** - Explain the fundamental idea with simple example
3. **First Demonstration** - Show the concept in action, step-by-step
4. **Building Complexity** - Add more details or steps
5. **Common Pattern** - Show typical use case or pattern
6. **Advanced Example** - More complex demonstration
7. **Edge Cases or Variations** - Show what happens in different scenarios
8. **Complete Algorithm/Process** - Show full implementation
9. **Performance/Analysis** - Discuss efficiency, complexity, or trade-offs
10. **Practical Applications** - When to use this concept
11. **Summary** - Review key points, celebrate learning

## Writing Guidelines:

### textPanel (Rhyming Stanzas):
- Write in Dr. Seuss style - whimsical, rhythmic, educational
- Maximum 2 stanzas (8 lines total) per scene
- Each stanza is 4 lines
- Rhyme scheme: AABB or ABAB
- Explain the concept being taught in the scene
- Keep it fun and memorable
- Reference visual elements happening in the scene

### diagramPanel (Code):
- Use Python for all code examples
- NO character names or references in code
- Use clear, educational comments
- Show progression from simple to complex
- Keep code examples focused on one concept per scene
- Use realistic, practical examples
- Include helpful comments explaining what the code does

### Scene Descriptions:
- Describe what's visually happening
- Include professor's actions (gesturing, explaining, demonstrating)
- Mention student reactions (antennae twitching, giggling, zinging, observing)
- Reference visual elements (glowing, lighting up, moving, changing)
- Create a sense of wonder and magic in the learning

### Elements:
- Create 3-5 themed elements per story
- Elements should be: classroom, set pieces (2-3), machinery (1-2)
- Name them creatively to match the topic theme
- Make them interactive and magical
- They should support the teaching visually

## Key Rules:

1. ✅ **ALWAYS** include character positioning instruction in backgroundSetup
2. ❌ **NEVER** have three stanzas (max 2 stanzas = 8 lines)
3. ❌ **NEVER** put character names in code comments
4. ✅ **ALWAYS** use Python for code examples
5. ✅ **ALWAYS** include all 4 standard students
6. ✅ **ALWAYS** make it whimsical and magical
7. ✅ **ALWAYS** include the professor's name in character lists
8. ✅ **ALWAYS** reference elements from the elements list in scenes
9. ✅ **ALWAYS** show learning progression across scenes
10. ✅ **ALWAYS** end with a summary/celebration scene

## Example Naming Patterns:

### Classrooms:
- "The Sorting Studio" (bubble sort)
- "The Card Hall" (insertion sort)  
- "The Divide Hall" (merge sort)
- "The Partition Arena" (quick sort)
- "The Code Garden" (conditionals)

### Set Pieces:
- Physical platforms, stages, tables where concepts are demonstrated
- Should be interactive and visual
- Examples: "Number Platform", "Merge Bridge", "Pivot Pedestal"

### Machinery:
- Tracking/monitoring devices
- Interactive teaching tools
- Examples: "Recursion Tracker", "Speed-O-Meter", "Pass Counter"

## Output Format:

Save as: `[topic_name].json` in the `/stories` directory
- Use lowercase
- Separate words with underscores
- Example: `bubble_sort.json`, `binary_trees.json`

