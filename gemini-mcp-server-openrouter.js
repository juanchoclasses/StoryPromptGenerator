#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fs = require('fs').promises;
const path = require('path');

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'your-openrouter-api-key-here';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

class OpenRouterGeminiMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'openrouter-gemini-image-generator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  setupTools() {
    // Tool for generating images with Gemini via OpenRouter
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'generate_image') {
        return await this.generateImage(args);
      }

      throw new Error(`Unknown tool: ${name}`);
    });

    // List available tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'generate_image',
            description: 'Generate an image using Gemini via OpenRouter and save it to local disk',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Description of the image to generate'
                },
                filename: {
                  type: 'string',
                  description: 'Filename to save the image as (with extension)'
                },
                outputDir: {
                  type: 'string',
                  description: 'Directory to save the image in (defaults to Downloads)'
                },
                model: {
                  type: 'string',
                  description: 'Gemini model to use (defaults to google/gemini-1.5-flash)'
                }
              },
              required: ['prompt', 'filename']
            }
          }
        ]
      };
    });
  }

  async generateImage(args) {
    try {
      const { prompt, filename, outputDir = '/Users/juancho/Downloads', model = 'google/gemini-1.5-flash' } = args;

      // Call OpenRouter API for image generation
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/your-repo', // Optional but recommended
          'X-Title': 'Gemini MCP Server' // Optional but recommended
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Extract image data from response
      // Note: The exact response format depends on the model and OpenRouter's implementation
      // You may need to adjust this based on the actual response structure
      const imageData = result.choices[0]?.message?.content;
      
      if (!imageData) {
        throw new Error('No image data received from OpenRouter');
      }

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Save image to local disk
      const filePath = path.join(outputDir, filename);
      
      // Handle different response formats (base64, URL, etc.)
      if (imageData.startsWith('data:image/')) {
        // Base64 data URL
        const base64Data = imageData.split(',')[1];
        await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));
      } else if (imageData.startsWith('http')) {
        // URL - download the image
        const imageResponse = await fetch(imageData);
        const imageBuffer = await imageResponse.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(imageBuffer));
      } else {
        // Assume it's base64 data
        await fs.writeFile(filePath, Buffer.from(imageData, 'base64'));
      }

      return {
        content: [
          {
            type: 'text',
            text: `Image generated successfully and saved to: ${filePath}`
          }
        ]
      };
    } catch (error) {
      console.error('Error generating image:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error generating image: ${error.message}`
          }
        ]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('OpenRouter Gemini MCP Server running...');
  }
}

// Run the server
const server = new OpenRouterGeminiMCPServer();
server.run().catch(console.error); 