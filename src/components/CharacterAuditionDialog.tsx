/**
 * CharacterAuditionDialog - Generate and manage character images
 * 
 * Allows users to:
 * - Generate character images with different models
 * - View character image gallery
 * - Select active character image
 * - Delete unwanted images
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardMedia,
  CardActions,
  Badge,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Upload as UploadIcon,
  ContentCopy as ContentCopyIcon,
  ContentPaste as ContentPasteIcon
} from '@mui/icons-material';
import type { Character } from '../models/Story';
import type { Book } from '../models/Book';
import { CharacterImageService } from '../services/CharacterImageService';
import { IMAGE_MODELS } from '../constants/imageModels';

interface CharacterAuditionDialogProps {
  open: boolean;
  character: Character;
  storyId?: string; // Optional for book-level characters
  storyBackgroundSetup?: string; // Optional for book-level characters
  book: Book;
  onClose: () => void;
  onUpdate: () => void; // Callback when character is updated
}

export const CharacterAuditionDialog: React.FC<CharacterAuditionDialogProps> = ({
  open,
  character,
  storyId,
  storyBackgroundSetup,
  book,
  onClose,
  onUpdate
}) => {
  // For book-level characters, use book ID as context; for story-level, use story ID
  const contextId = storyId || `book:${book.id}`;
  const backgroundSetup = storyBackgroundSetup || book.backgroundSetup || '';
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].value);
  const [promptStrategy, setPromptStrategy] = useState<'auto' | 'legacy' | 'gemini'>('auto');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<Map<string, string>>(new Map());
  const [loadingGallery, setLoadingGallery] = useState(false);
  
  // Prompt dialog state
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  
  // Image preview dialog state
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // File upload state
  const [uploading, setUploading] = useState(false);
  
  // Reference image state
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [includeReferenceImage, setIncludeReferenceImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track last saved image count to prevent duplicate saves during React strict mode double-invocation
  const lastSavedCountRef = useRef<number | null>(null);
  
  // Editable character description
  const [characterDescription, setCharacterDescription] = useState(character.description);
  const [descriptionChanged, setDescriptionChanged] = useState(false);

  // Reset description when character changes
  useEffect(() => {
    setCharacterDescription(character.description);
    setDescriptionChanged(false);
  }, [character]);

  const loadGallery = useCallback(async () => {
    // If character has no image gallery metadata, don't try to load from filesystem
    if (!character.imageGallery || character.imageGallery.length === 0) {
      setGalleryImages(new Map());
      setLoadingGallery(false);
      lastSavedCountRef.current = 0; // Track that we've seen 0 images
      return;
    }

    setLoadingGallery(true);
    try {
      const beforeCount = character.imageGallery?.length || 0;
      const images = await CharacterImageService.loadCharacterGallery(contextId, character.name, character);
      const afterCount = character.imageGallery?.length || 0;
      
      // If cleanup removed stale references, save the book (but only once per cleanup cycle)
      if (beforeCount > afterCount && lastSavedCountRef.current !== afterCount) {
        console.log(`Character metadata cleaned up (${beforeCount} → ${afterCount} images). Saving book...`);
        lastSavedCountRef.current = afterCount; // Mark that we've saved for this count
        onUpdate(); // Trigger save to persist cleanup
      }
      
      setGalleryImages(images);
    } catch (err) {
      console.error('Failed to load character gallery:', err);
      // Don't show error for empty gallery - just set empty map
      setGalleryImages(new Map());
    } finally {
      setLoadingGallery(false);
    }
  }, [contextId, character.name, character.imageGallery, onUpdate]);

  // Handle reference image upload
  const handleReferenceImageUpload = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please provide an image file');
      return;
    }

    try {
      // Convert file to blob URL for immediate display
      const blobUrl = URL.createObjectURL(file);
      setReferenceImage(blobUrl);
      setIncludeReferenceImage(true);

      // Generate a unique ID for this reference image
      const imageId = crypto.randomUUID();

      // Store to filesystem using ImageStorageService
      const { ImageStorageService } = await import('../services/ImageStorageService');
      await ImageStorageService.storeCharacterImage(
        contextId,
        character.name,
        imageId,
        blobUrl,
        'reference-image'
      );

      // Update character metadata with the reference image ID
      character.referenceImageId = imageId;
      
      // Save the updated character metadata
      onUpdate();

      setSuccess('Reference image saved successfully!');
    } catch (err) {
      console.error('Error processing reference image:', err);
      setError('Failed to save reference image');
      throw err;
    }
  }, [character, contextId, onUpdate]);

  // Handle reference image file input change
  const handleReferenceImageFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleReferenceImageUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleReferenceImageUpload]);

  // Clear reference image
  const handleClearReferenceImage = useCallback(async () => {
    // Delete from filesystem if it exists
    if (character.referenceImageId) {
      try {
        await CharacterImageService.deleteCharacterImage(
          contextId,
          character.name,
          character.referenceImageId
        );
      } catch (err) {
        console.error('Failed to delete reference image from filesystem:', err);
        // Continue anyway to clear the UI state
      }
      
      // Clear the reference from character metadata
      character.referenceImageId = undefined;
      onUpdate();
    }

    setReferenceImage(null);
    setIncludeReferenceImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [character, contextId, onUpdate]);

  const processImageFile = useCallback(async (file: File, source: 'upload' | 'paste') => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please provide an image file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create a blob URL from the file
      const blobUrl = URL.createObjectURL(file);

      // Create character image metadata (without actual generation)
      const imageId = crypto.randomUUID();
      const characterImage = {
        id: imageId,
        url: blobUrl,
        model: source === 'paste' ? 'user-pasted' : 'user-uploaded',
        prompt: source === 'paste' 
          ? `Manual paste by user for ${character.name}`
          : `Manual upload by user for ${character.name}`,
        timestamp: new Date(),
      };

      // Store to filesystem using ImageStorageService
      const { ImageStorageService } = await import('../services/ImageStorageService');
      await ImageStorageService.storeCharacterImage(
        contextId,
        character.name,
        imageId,
        blobUrl,
        source === 'paste' ? 'user-pasted' : 'user-uploaded'
      );

      // Add to character's gallery
      CharacterImageService.addImageToGallery(character, characterImage);

      // If this is the first image, auto-select it
      if (!character.selectedImageId) {
        CharacterImageService.setSelectedCharacterImage(character, imageId);
      }

      // Notify parent to save changes
      onUpdate();

      // Reload gallery
      await loadGallery();

      setSuccess(`Image ${source === 'paste' ? 'pasted' : 'uploaded'} successfully! Select it to use as a reference image in scene generation.`);
    } catch (err: unknown) {
      console.error(`Failed to ${source} image:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to ${source} image: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  }, [contextId, character.name, onUpdate, loadGallery]);

  // Load reference image from character metadata
  const loadReferenceImage = useCallback(async () => {
    if (!character.referenceImageId) {
      setReferenceImage(null);
      setIncludeReferenceImage(false);
      return;
    }

    try {
      // Load the reference image from filesystem
      const imageUrl = await CharacterImageService.loadCharacterImage(
        contextId,
        character.name,
        character.referenceImageId
      );
      
      if (imageUrl) {
        setReferenceImage(imageUrl);
        setIncludeReferenceImage(true); // Auto-check when loading existing reference image
      } else {
        // Reference image not found - clear the invalid reference
        character.referenceImageId = undefined;
        setReferenceImage(null);
        setIncludeReferenceImage(false);
      }
    } catch (err) {
      console.error('Failed to load reference image:', err);
      setReferenceImage(null);
      setIncludeReferenceImage(false);
    }
  }, [character, storyId]);

  // Reset ref when dialog opens or character changes, then load gallery and reference image
  useEffect(() => {
    if (open) {
      lastSavedCountRef.current = null; // Reset ref when dialog opens
      loadGallery();
      loadReferenceImage();
    }
  }, [open, character.name, loadGallery, loadReferenceImage]);

  // Handle paste button click for regular image upload
  const handlePasteButtonClick = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], 'pasted-image.png', { type });
            await processImageFile(file, 'paste');
            return;
          }
        }
      }
      setError('No image found in clipboard');
    } catch (err) {
      console.error('Failed to paste image:', err);
      setError('Failed to paste image. Make sure you have an image copied to your clipboard.');
    }
  };

  // Handle paste events when dialog is open
  // This handles both regular image paste (to gallery) and reference image paste
  useEffect(() => {
    if (!open) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.type.startsWith('image/')) {
          event.preventDefault(); // Prevent default paste behavior
          
          const file = item.getAsFile();
          if (file) {
            // Check if user is focused on reference image section or if reference image is already set
            // If reference image section is active, paste to reference; otherwise paste to gallery
            const activeElement = document.activeElement;
            const isReferenceSectionActive = activeElement?.closest('[data-reference-section]') !== null;
            
            try {
              if (isReferenceSectionActive || referenceImage !== null) {
                // Paste to reference image
                await handleReferenceImageUpload(file);
              } else {
                // Paste to gallery (existing behavior)
                await processImageFile(file, 'paste');
              }
            } catch (err) {
              console.error('Error pasting image:', err);
              // Error is already set by handleReferenceImageUpload or processImageFile
            }
          }
          return;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [open, processImageFile, handleReferenceImageUpload, referenceImage]);

  const handleClose = () => {
    // Save changes before closing
    console.log('Dialog closing - saving character changes...');
    onUpdate();
    onClose();
  };

  const handleGenerateImage = async () => {
    console.log('=== Starting Character Image Generation ===');
    console.log('Character:', character.name);
    console.log('Story ID:', storyId);
    console.log('Model:', selectedModel);
    console.log('Include reference image:', includeReferenceImage);
    
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate the character image (always use 1:1 for character portraits)
      // Include reference image if checkbox is checked and image is available
      let referenceImageToUse = includeReferenceImage && referenceImage ? referenceImage : null;
      
      // If reference image is a blob URL, convert it to data URL for API
      if (referenceImageToUse && referenceImageToUse.startsWith('blob:')) {
        console.log('⚙️  Converting blob URL to data URL for API...');
        try {
          const response = await fetch(referenceImageToUse);
          const blob = await response.blob();
          referenceImageToUse = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          console.log('✓ Converted to data URL');
        } catch (err) {
          console.error('Failed to convert blob URL to data URL:', err);
          setError('Failed to process reference image');
          setGenerating(false);
          return;
        }
      }
      
      console.log('Step 1: Calling generateCharacterImage...');
      // Use the edited description for generation
      const characterWithEditedDesc = { ...character, description: characterDescription };
      const characterImage = await CharacterImageService.generateCharacterImage(
        characterWithEditedDesc,
        contextId,
        backgroundSetup,
        book,
        selectedModel,
        '1:1',
        referenceImageToUse,
        promptStrategy // Pass the selected prompt strategy
      );
      console.log('✓ Step 1 complete: Image generated', characterImage.id);

      // Add to character's gallery (metadata only)
      console.log('Step 2: Adding to gallery...');
      CharacterImageService.addImageToGallery(character, characterImage);
      console.log('✓ Step 2 complete: Added to gallery. Gallery size:', character.imageGallery?.length);

      // If this is the first image, auto-select it
      if (!character.selectedImageId && characterImage.id) {
        console.log('Step 3: Auto-selecting first image...');
        CharacterImageService.setSelectedCharacterImage(character, characterImage.id);
        console.log('✓ Step 3 complete: Selected image:', character.selectedImageId);
      }

      // Notify parent to save changes
      console.log('Step 4: Calling onUpdate() to save changes...');
      onUpdate();
      console.log('✓ Step 4 complete: onUpdate() called');

      // Reload gallery to show new image
      console.log('Step 5: Reloading gallery...');
      await loadGallery();
      console.log('✓ Step 5 complete: Gallery reloaded');

      console.log('=== Image Generation Complete! ===');
      setSuccess('Character image generated successfully!');
    } catch (err: unknown) {
      console.error('✗✗✗ Failed to generate character image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate image: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectImage = (imageId: string) => {
    CharacterImageService.setSelectedCharacterImage(character, imageId);
    onUpdate();
    setSuccess('Character image selected!');
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      // Delete from filesystem
      await CharacterImageService.deleteCharacterImage(contextId, character.name, imageId);

      // Remove from character's gallery
      CharacterImageService.removeImageFromGallery(character, imageId);

      // Notify parent to save changes
      onUpdate();

      // Reload gallery
      await loadGallery();

      setSuccess('Image deleted successfully!');
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError('Failed to delete image');
    }
  };

  const isImageSelected = (imageId: string) => {
    return character.selectedImageId === imageId;
  };

  const handleViewPrompt = () => {
    // Build the prompt using the edited description
    const characterWithEditedDesc = { ...character, description: characterDescription };
    const prompt = CharacterImageService.buildCharacterPrompt(
      characterWithEditedDesc,
      backgroundSetup,
      book,
      selectedModel, // Pass model for strategy selection
      !!referenceImage, // Has reference image
      promptStrategy // Pass the selected prompt strategy
    );
    setGeneratedPrompt(prompt);
    setShowPromptDialog(true);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setSuccess('Prompt copied to clipboard!');
    } catch {
      setError('Failed to copy prompt');
    }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processImageFile(file, 'upload');
    
    // Reset file input
    event.target.value = '';
  };


  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">
              🎭 Character Audition: {character.name}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Character Description Section */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" color="textSecondary">
              Character Description:
            </Typography>
            {descriptionChanged && (
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  character.description = characterDescription;
                  onUpdate(); // Save the updated description
                  setDescriptionChanged(false);
                  setSuccess('Description updated successfully!');
                }}
              >
                Save Description
              </Button>
            )}
          </Box>
          <TextField
            multiline
            rows={3}
            value={characterDescription}
            onChange={(e) => {
              setCharacterDescription(e.target.value);
              setDescriptionChanged(e.target.value !== character.description);
            }}
            fullWidth
            variant="outlined"
            placeholder="Describe the character's appearance, personality, clothing, etc."
            helperText={descriptionChanged ? "Don't forget to save your changes!" : "Changes will be used for future image generations"}
          />
        </Box>

        {/* Reference Image Section */}
        <Box mb={3} data-reference-section>
          <Typography variant="subtitle2" gutterBottom>
            Reference Image (Optional):
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            {referenceImage ? (
              <>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100'
                  }}
                >
                  <img
                    src={referenceImage}
                    alt="Reference"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={() => {
                      console.error('Failed to load reference image');
                      setError('Failed to load reference image. Please try uploading again.');
                      setReferenceImage(null);
                    }}
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeReferenceImage}
                        onChange={(e) => setIncludeReferenceImage(e.target.checked)}
                        disabled={generating}
                      />
                    }
                    label="Include reference image in generation"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={handleClearReferenceImage}
                    sx={{ mt: 1 }}
                  >
                    Clear
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                >
                  Upload Reference Image
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleReferenceImageFileChange}
                  />
                </Button>
                <Button
                  variant="outlined"
                  onClick={async () => {
                    try {
                      const clipboardItems = await navigator.clipboard.read();
                      for (const clipboardItem of clipboardItems) {
                        for (const type of clipboardItem.types) {
                          if (type.startsWith('image/')) {
                            const blob = await clipboardItem.getType(type);
                            const file = new File([blob], 'pasted-reference.png', { type });
                            await handleReferenceImageUpload(file);
                            return;
                          }
                        }
                      }
                      setError('No image found in clipboard');
                    } catch (err) {
                      console.error('Failed to paste reference image:', err);
                      setError('Failed to paste image. Make sure you have an image copied to your clipboard.');
                    }
                  }}
                  startIcon={<ContentPasteIcon />}
                >
                  Paste Reference Image
                </Button>
              </>
            )}
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Upload or paste a photo or image of the person to use as a reference when generating character images.
            Check the box to include it in the generation request. You can also press Ctrl+V/Cmd+V to paste when this section is focused.
          </Typography>
        </Box>

        {/* Image Generation Section */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Generate or Upload Character Image:
          </Typography>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Model</InputLabel>
              <Select
                value={selectedModel}
                label="Model"
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={generating}
              >
                {IMAGE_MODELS.map((model) => (
                  <MenuItem key={model.value} value={model.value}>
                    {model.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Prompt Strategy</InputLabel>
              <Select
                value={promptStrategy}
                label="Prompt Strategy"
                onChange={(e) => setPromptStrategy(e.target.value as 'auto' | 'legacy' | 'gemini')}
                disabled={generating}
              >
                <MenuItem value="auto">Auto (Detect from Model)</MenuItem>
                <MenuItem value="legacy">Legacy (Simple)</MenuItem>
                <MenuItem value="gemini">Gemini (Structured)</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleGenerateImage}
              disabled={generating}
              startIcon={generating ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {generating ? 'Generating...' : 'Generate'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleViewPrompt}
              startIcon={<VisibilityIcon />}
            >
              View Prompt
            </Button>

            <Button
              variant="outlined"
              component="label"
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleUploadImage}
              />
            </Button>

            <Button
              variant="outlined"
              onClick={handlePasteButtonClick}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <ContentPasteIcon />}
            >
              {uploading ? 'Pasting...' : 'Paste Image'}
            </Button>
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Generate with API, view the prompt for external tools, upload an image, or click "Paste Image" (or press Ctrl+V/Cmd+V).
            <br />
            <strong>Tip:</strong> Select any image from the gallery below to use it as a reference image in scene generation prompts.
          </Typography>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Character Gallery */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2">
              Character Gallery ({character.imageGallery?.length || 0} images)
            </Typography>
            <Tooltip title={loadingGallery ? "" : "Refresh gallery"}>
              <span>
                <IconButton onClick={loadGallery} size="small" disabled={loadingGallery}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {loadingGallery ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : !character.imageGallery || character.imageGallery.length === 0 ? (
            <Box 
              p={4} 
              textAlign="center" 
              sx={{ 
                border: '2px dashed #ccc', 
                borderRadius: 2,
                backgroundColor: '#f9f9f9'
              }}
            >
              <Typography variant="body2" color="textSecondary">
                No images yet. Generate your first character image!
              </Typography>
            </Box>
          ) : (
            <Box 
              display="grid" 
              gridTemplateColumns={{
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              }}
              gap={2}
            >
              {character.imageGallery.map((img) => {
                const imageUrl = galleryImages.get(img.id);
                const selected = isImageSelected(img.id);

                return (
                  <Box key={img.id}>
                    <Card
                      sx={{
                        position: 'relative',
                        border: selected ? '3px solid #1976d2' : '1px solid #e0e0e0',
                        boxShadow: selected ? 3 : 1,
                      }}
                    >
                      {selected && (
                        <Badge
                          badgeContent={<CheckCircleIcon sx={{ fontSize: 20 }} />}
                          color="primary"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 1,
                          }}
                        />
                      )}
                      {imageUrl ? (
                        <CardMedia
                          component="img"
                          height="200"
                          image={imageUrl}
                          alt={`${character.name} - ${img.model}`}
                          sx={{
                            objectFit: 'contain',
                            backgroundColor: '#f5f5f5',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setPreviewImageUrl(imageUrl);
                            setImagePreviewOpen(true);
                          }}
                        />
                      ) : (
                        <Box 
                          height="200px" 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center"
                          sx={{ backgroundColor: '#f5f5f5' }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Image not available
                          </Typography>
                        </Box>
                      )}
                      <CardActions sx={{ justifyContent: 'space-between', px: 1 }}>
                        <Tooltip title={selected ? '' : 'Select this image'}>
                          <span>
                            <Button
                              size="small"
                              variant={selected ? 'contained' : 'outlined'}
                              onClick={() => handleSelectImage(img.id)}
                              disabled={selected}
                            >
                              {selected ? 'Selected' : 'Select'}
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete image">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteImage(img.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                      <Box px={1} pb={1}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {img.model.split('/').pop()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {new Date(img.timestamp).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>

    {/* Prompt View Dialog */}
    <Dialog
      open={showPromptDialog}
      onClose={() => setShowPromptDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Character Generation Prompt</Typography>
          <IconButton onClick={() => setShowPromptDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          This is the prompt that will be used to generate the character image. You can copy it to use with other AI tools (Midjourney, Stable Diffusion, etc.)
        </Typography>
        <TextField
          multiline
          fullWidth
          value={generatedPrompt}
          rows={20}
          variant="outlined"
          InputProps={{
            readOnly: true,
            sx: {
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }
          }}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleCopyPrompt}
          startIcon={<ContentCopyIcon />}
          variant="contained"
        >
          Copy Prompt
        </Button>
        <Button onClick={() => setShowPromptDialog(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>

    {/* Image Preview Dialog */}
    <Dialog
      open={imagePreviewOpen}
      onClose={() => setImagePreviewOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{character.name} - Image Preview</Typography>
          <IconButton onClick={() => setImagePreviewOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          sx={{ 
            minHeight: '400px',
            backgroundColor: '#f5f5f5',
            p: 2
          }}
        >
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt={`${character.name} preview`}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setImagePreviewOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

