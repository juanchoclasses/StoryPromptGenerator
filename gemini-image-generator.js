const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');

async function generateAndSaveImage(prompt, filename, outputDir = '/Users/juancho/Downloads') {
  try {
    console.log(`Generating image: ${prompt}`);
    
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

    console.log(`Image saved successfully to: ${filePath}`);
    return filePath;

  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  const prompt = process.argv[2] || 'A beautiful sunset over mountains';
  const filename = process.argv[3] || 'generated-image.png';
  
  generateAndSaveImage(prompt, filename)
    .then(filePath => console.log(`Success! Image saved to: ${filePath}`))
    .catch(error => console.error('Failed:', error.message));
}

module.exports = { generateAndSaveImage }; 