#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');

class GeminiMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'gemini-image-generator',
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
    // Tool for generating images with Gemini
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
            description: 'Generate an image using Gemini and save it to local disk',
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
      const { prompt, filename, outputDir = '/Users/juancho/Downloads' } = args;

      // Generate image using Gemini
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/png',
            data: '' // Gemini will generate the image
          }
        }
      ]);

      const response = await result.response;
      const imageData = response.candidates[0].content.parts[0].inlineData.data;

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Save image to local disk
      const filePath = path.join(outputDir, filename);
      await fs.writeFile(filePath, Buffer.from(imageData, 'base64'));

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
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gemini MCP Server running...');
  }
}

// Run the server
const server = new GeminiMCPServer();
server.run().catch(console.error); 