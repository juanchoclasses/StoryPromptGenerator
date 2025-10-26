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
  static async urlToBuffer(url: string): Promise<{ buffer: Uint8Array; type: string }> {
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
    
    return { buffer: new Uint8Array(arrayBuffer), type };
  }
  
  /**
   * Export a story with all its images to a DOCX file
   * Simple version: just images, one per page
   */
  static async exportStoryToDocx(story: Story, bookTitle: string): Promise<Blob> {
    const paragraphs = [];
    
    // Process each scene - just add images
    for (let i = 0; i < story.scenes.length; i++) {
      const scene = story.scenes[i];
      
      // Get the most recent image
      const mostRecentImage = scene.imageHistory && scene.imageHistory.length > 0
        ? scene.imageHistory[scene.imageHistory.length - 1]
        : null;
      
      if (mostRecentImage) {
        try {
          // Load image from IndexedDB
          let imageUrl = mostRecentImage.url;
          if (!imageUrl || imageUrl.startsWith('blob:')) {
            imageUrl = await ImageStorageService.getImage(mostRecentImage.id);
          }
          
          if (imageUrl) {
            const { buffer, type } = await this.urlToBuffer(imageUrl);
            
            // Add image centered on page with page break before (except first)
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: buffer,
                    transformation: {
                      width: 576,
                      height: 768
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
          }
        } catch (error) {
          console.error(`Failed to add image for scene "${scene.title}":`, error);
        }
      }
    }
    
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
    
    // Generate blob
    const blob = await Packer.toBlob(doc);
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

