import { Document, Packer, Paragraph, ImageRun, AlignmentType } from 'docx';
import type { Story } from '../types/Story';
import { ImageStorageService } from './ImageStorageService';

export interface ExportValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DocxExportService {
  /**
   * Validate that all scenes have exactly one image
   */
  static async validateStoryForExport(story: Story): Promise<ExportValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const scene of story.scenes) {
      const imageCount = scene.imageHistory?.length || 0;
      
      if (imageCount === 0) {
        errors.push(`Scene "${scene.title}" has no images`);
      } else if (imageCount > 1) {
        warnings.push(`Scene "${scene.title}" has ${imageCount} images. Only the most recent will be used.`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Convert a data URL or blob URL to a Buffer (Uint8Array) and detect type
   */
  static async urlToBuffer(url: string): Promise<{ buffer: Uint8Array; type: string; dimensions: { width: number; height: number } }> {
    const response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    
    // Detect image type from blob MIME type or data URL
    let type = 'png'; // default
    if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') {
      type = 'jpg';
    } else if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
      type = 'jpg';
    }
    
    // Get image dimensions
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    
    return { 
      buffer: new Uint8Array(arrayBuffer), 
      type,
      dimensions: { width: img.naturalWidth, height: img.naturalHeight }
    };
  }
  
  /**
   * Export a story with all its images to a DOCX file
   * Simple version: just images, one per page
   */
  static async exportStoryToDocx(story: Story, bookTitle: string): Promise<Blob> {
    console.log(`\n📄 DOCX EXPORT: Starting export for "${story.title}"`);
    console.log(`   Book: ${bookTitle}`);
    console.log(`   Total scenes: ${story.scenes.length}`);
    
    const paragraphs = [];
    
    // Process each scene - just add images
    for (let i = 0; i < story.scenes.length; i++) {
      const scene = story.scenes[i];
      
      console.log(`\n   Scene #${i + 1}/${story.scenes.length}:`);
      console.log(`      ID: ${scene.id}`);
      console.log(`      Title: "${scene.title}"`);
      console.log(`      Image history count: ${scene.imageHistory?.length || 0}`);
      
      // Get the most recent image
      const mostRecentImage = scene.imageHistory && scene.imageHistory.length > 0
        ? scene.imageHistory[scene.imageHistory.length - 1]
        : null;
      
      if (mostRecentImage) {
        console.log(`      Most recent image ID: ${mostRecentImage.id}`);
        console.log(`      Model: ${mostRecentImage.modelName}`);
        
        try {
          // Load image from filesystem
          let imageUrl = mostRecentImage.url;
          if (!imageUrl || imageUrl.startsWith('blob:')) {
            console.log(`      Loading image from filesystem...`);
            imageUrl = await ImageStorageService.getImage(mostRecentImage.id);
          }
          
          if (imageUrl) {
            console.log(`      ✓ Image loaded, converting to buffer...`);
            const { buffer, type, dimensions } = await this.urlToBuffer(imageUrl);
            console.log(`      ✓ Buffer created (${buffer.length} bytes, type: ${type})`);
            console.log(`      Image dimensions: ${dimensions.width}x${dimensions.height}`);
            
            // Calculate dimensions to fit page while preserving aspect ratio
            // Word page is ~8.5" x 11" with 1" margins = 6.5" x 9" usable
            // At 96 DPI: 624px x 864px usable area
            const maxWidth = 624; // 6.5 inches at 96 DPI
            const maxHeight = 864; // 9 inches at 96 DPI
            
            let width = dimensions.width;
            let height = dimensions.height;
            
            // Scale to fit within page while preserving aspect ratio
            if (width > maxWidth || height > maxHeight) {
              const widthScale = maxWidth / width;
              const heightScale = maxHeight / height;
              const scale = Math.min(widthScale, heightScale);
              
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }
            
            console.log(`      Scaled dimensions for DOCX: ${width}x${height}`);
            
            // Add image centered on page with page break before (except first)
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: buffer,
                    transformation: {
                      width: width,
                      height: height
                    },
                    type: type === 'jpg' ? 'jpg' : 'png'
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { 
                  before: 200,
                  after: 200
                },
                pageBreakBefore: i > 0
              })
            );
            console.log(`      ✓ Added to DOCX (page break before: ${i > 0})`);
            console.log(`      Total paragraphs so far: ${paragraphs.length}`);
          } else {
            console.warn(`      ⚠️  Image URL is null after loading`);
          }
        } catch (error) {
          console.error(`      ❌ Failed to add image for scene "${scene.title}":`, error);
        }
      } else {
        console.warn(`      ⚠️  No images in imageHistory`);
      }
    }
    
    console.log(`\n✓ DOCX EXPORT: Processed all scenes, total paragraphs: ${paragraphs.length}`);
    console.log(`   Creating DOCX document...`);
    
    // Create document
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: paragraphs
      }]
    });
    
    console.log(`   ✓ Document created with ${paragraphs.length} paragraphs (should equal number of scenes with images)`);
    console.log(`   Generating blob...`);
    
    // Generate blob
    const blob = await Packer.toBlob(doc);
    console.log(`✓ DOCX EXPORT: Complete! Blob size: ${blob.size} bytes\n`);
    
    return blob;
  }
  
  /**
   * Trigger download of the DOCX file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

