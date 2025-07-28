const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testGeminiMCP() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['gemini-mcp-server.js'],
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'your-api-key-here'
    }
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  });

  try {
    await client.connect(transport);
    console.log('Connected to Gemini MCP Server');

    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools);

    // Test image generation
    const result = await client.callTool('generate_image', {
      prompt: 'A beautiful sunset over mountains',
      filename: 'test-sunset.png',
      outputDir: '/Users/juancho/Downloads'
    });

    console.log('Image generation result:', result);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testGeminiMCP(); 