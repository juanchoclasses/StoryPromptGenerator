import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  IconButton,
  Paper,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Book as BookIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { BookService } from '../services/BookService';
import { BookExportWithImagesService } from '../services/BookExportWithImagesService';
import type { BookMetadata, PanelConfig } from '../types/Book';
import { DEFAULT_PANEL_CONFIG } from '../types/Book';
import type { BookStyle } from '../types/BookStyle';
import { DEFAULT_BOOK_STYLE } from '../types/BookStyle';
import { PanelConfigDialog } from './PanelConfigDialog';
import { BookStyleEditor } from './BookStyleEditor';

interface FileManagerProps {
  onBookSelect: (bookId: string) => void;
  onBookUpdate: () => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ onBookSelect, onBookUpdate }) => {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<BookMetadata | null>(null);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookDescription, setNewBookDescription] = useState('');
  const [newBookBackgroundSetup, setNewBookBackgroundSetup] = useState('');
  const [newBookAspectRatio, setNewBookAspectRatio] = useState('9:16');
  const [newBookPanelConfig, setNewBookPanelConfig] = useState<PanelConfig>(DEFAULT_PANEL_CONFIG);
  const [editBookTitle, setEditBookTitle] = useState('');
  const [editBookDescription, setEditBookDescription] = useState('');
  const [editBookBackgroundSetup, setEditBookBackgroundSetup] = useState('');
  const [editBookAspectRatio, setEditBookAspectRatio] = useState('9:16');
  const [editBookPanelConfig, setEditBookPanelConfig] = useState<PanelConfig>(DEFAULT_PANEL_CONFIG);
  const [panelConfigDialogOpen, setPanelConfigDialogOpen] = useState(false);
  const [panelConfigDialogMode, setPanelConfigDialogMode] = useState<'create' | 'edit'>('create');
  const [styleEditorOpen, setStyleEditorOpen] = useState(false);
  const [editingBookStyle, setEditingBookStyle] = useState<{ bookId: string, style: BookStyle } | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [exportingBookId, setExportingBookId] = useState<string | null>(null);
  const [importingBook, setImportingBook] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    const collection = await BookService.getBookCollection();
    setBooks(collection.books);
    setActiveBookId(collection.activeBookId);
  };

  const handleCreateBook = async () => {
    if (!newBookTitle.trim()) {
      showSnackbar('Book title is required', 'error');
      return;
    }

    try {
      await BookService.createBook(
        newBookTitle.trim(), 
        newBookDescription.trim() || undefined,
        newBookAspectRatio,
        newBookPanelConfig,
        newBookBackgroundSetup.trim() || undefined
      );
      
      setNewBookTitle('');
      setNewBookDescription('');
      setNewBookBackgroundSetup('');
      setNewBookAspectRatio('9:16');
      setNewBookPanelConfig(DEFAULT_PANEL_CONFIG);
      setOpenCreateDialog(false);
      await loadBooks();
      onBookUpdate();
      showSnackbar('Book created successfully', 'success');
    } catch (error) {
      console.error('Error creating book:', error);
      showSnackbar('Failed to create book', 'error');
    }
  };

  const handleEditBook = async () => {
    if (!editingBook || !editBookTitle.trim()) {
      showSnackbar('Book title is required', 'error');
      return;
    }

    try {
      await BookService.updateBook(editingBook.id, {
        title: editBookTitle.trim(),
        description: editBookDescription.trim() || undefined,
        backgroundSetup: editBookBackgroundSetup.trim() || undefined,
        aspectRatio: editBookAspectRatio,
        panelConfig: editBookPanelConfig
      });

      setOpenEditDialog(false);
      setEditingBook(null);
      setEditBookTitle('');
      setEditBookDescription('');
      setEditBookBackgroundSetup('');
      setEditBookAspectRatio('9:16');
      setEditBookPanelConfig(DEFAULT_PANEL_CONFIG);
      await loadBooks();
      onBookUpdate();
      showSnackbar('Book updated successfully', 'success');
    } catch (error) {
      console.error('Error updating book:', error);
      showSnackbar('Failed to update book', 'error');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      try {
        await BookService.deleteBook(bookId);
        await loadBooks();
        onBookUpdate();
        showSnackbar('Book deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting book:', error);
        showSnackbar('Failed to delete book', 'error');
      }
    }
  };

  const handleSelectBook = async (bookId: string) => {
    try {
      await BookService.setActiveBook(bookId);
      setActiveBookId(bookId);
      onBookSelect(bookId);
      showSnackbar('Book selected', 'success');
    } catch (error) {
      console.error('Error selecting book:', error);
      showSnackbar('Failed to select book', 'error');
    }
  };

  const handleExportBook = async (bookId: string) => {
    try {
      const exportData = await BookService.exportBook(bookId);
      if (!exportData) {
        showSnackbar('Failed to export book: No data available', 'error');
        return;
      }
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `book-${bookId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar('Book exported successfully (JSON only)', 'success');
    } catch (error) {
      console.error('Error exporting book:', error);
      showSnackbar('Failed to export book', 'error');
    }
  };

  const handleExportBookWithImages = async (bookId: string) => {
    try {
      setExportingBookId(bookId);
      
      // Get book to create filename
      const book = await BookService.getBook(bookId);
      if (!book) {
        showSnackbar('Book not found', 'error');
        return;
      }

      // Export the book with all images
      const result = await BookExportWithImagesService.exportBookWithImages(bookId);
      
      if (!result.success || !result.blob) {
        showSnackbar(result.error || 'Failed to export book with images', 'error');
        return;
      }

      // Download the ZIP file
      const filename = BookExportWithImagesService.generateExportFilename(book.title);
      BookExportWithImagesService.downloadBlob(result.blob, filename);
      
      const stats = result.stats;
      const sizeMB = stats ? (stats.totalSize / (1024 * 1024)).toFixed(2) : '?';
      showSnackbar(
        `Book exported with ${stats?.sceneImages || 0} scene images and ${stats?.characterImages || 0} character images (${sizeMB} MB)`,
        'success'
      );
    } catch (error) {
      console.error('Error exporting book with images:', error);
      showSnackbar('Failed to export book with images', 'error');
    } finally {
      setExportingBookId(null);
    }
  };

  const handleImportBook = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            await BookService.importBook(content);
            await loadBooks();
            onBookUpdate();
            showSnackbar('Book imported successfully (JSON only)', 'success');
          } catch (error) {
            console.error('Error importing book:', error);
            showSnackbar('Failed to import book. Please check the file format.', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleImportBookWithImages = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setImportingBook(true);
          
          // Import the book with images
          const result = await BookExportWithImagesService.importBookWithImages(file);
          
          if (!result.success) {
            showSnackbar(result.error || 'Failed to import book with images', 'error');
            return;
          }

          await loadBooks();
          onBookUpdate();
          
          const stats = result.stats;
          let message = `Book imported with ${stats?.sceneImages || 0} scene images and ${stats?.characterImages || 0} character images`;
          
          if (result.warnings && result.warnings.length > 0) {
            message += ` (${result.warnings.length} warnings - check console)`;
            console.warn('Import warnings:', result.warnings);
          }
          
          showSnackbar(message, 'success');
        } catch (error) {
          console.error('Error importing book with images:', error);
          showSnackbar('Failed to import book with images', 'error');
        } finally {
          setImportingBook(false);
        }
      }
    };
    input.click();
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const openEditDialogForBook = (book: BookMetadata) => {
    setEditingBook(book);
    setEditBookTitle(book.title);
    setEditBookDescription(book.description || '');
    setEditBookBackgroundSetup(book.backgroundSetup || '');
    setEditBookAspectRatio(book.aspectRatio || '9:16');
    setEditBookPanelConfig(book.panelConfig || DEFAULT_PANEL_CONFIG);
    setOpenEditDialog(true);
  };

  const handleOpenPanelConfig = (mode: 'create' | 'edit') => {
    setPanelConfigDialogMode(mode);
    setPanelConfigDialogOpen(true);
  };

  const handleSavePanelConfig = (config: PanelConfig) => {
    if (panelConfigDialogMode === 'create') {
      setNewBookPanelConfig(config);
    } else {
      setEditBookPanelConfig(config);
    }
  };

  const handleOpenStyleEditor = async (bookId: string) => {
    try {
      const book = await BookService.getBook(bookId);
      if (book) {
        setEditingBookStyle({
          bookId: book.id,
          style: book.style || DEFAULT_BOOK_STYLE
        });
        setStyleEditorOpen(true);
      }
    } catch {
      // Error loading book style
      showSnackbar('Failed to load book style', 'error');
    }
  };

  const handleSaveBookStyle = async (style: BookStyle) => {
    if (!editingBookStyle) return;
    
    try {
      // Get the book, update its style, and save
      const book = await BookService.getBook(editingBookStyle.bookId);
      if (book) {
        book.updateStyle(style);
        // Use StorageService directly since BookService.updateBook doesn't handle style
        const { StorageService } = await import('../services/StorageService');
        await StorageService.saveBook(book);
        
        loadBooks();
        onBookUpdate();
        showSnackbar('Book style updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating book style:', error);
      showSnackbar('Failed to update book style', 'error');
    }
    
    setStyleEditorOpen(false);
    setEditingBookStyle(null);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" component="h2">
          Books
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Import Book (JSON only)">
            <IconButton onClick={handleImportBook} color="primary">
              <UploadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Book with Images (ZIP)">
            <IconButton 
              onClick={handleImportBookWithImages} 
              color="primary"
              disabled={importingBook}
            >
              {importingBook ? <CircularProgress size={24} /> : <FolderOpenIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            New Book
          </Button>
        </Box>
      </Box>

      {books.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <BookIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No books yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Create your first book to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Create First Book
          </Button>
        </Paper>
      ) : (
        <>
          <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="body2">
              <strong>How to edit your stories:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              1. <strong>Click on a book</strong> to select it (highlighted in blue)
            </Typography>
            <Typography variant="body2">
              2. <strong>Switch to the "Stories" tab</strong> to see and edit your stories
            </Typography>
            <Typography variant="body2">
              3. <strong>Use the "Edit" button</strong> (pencil icon) to change book title/description only
            </Typography>
          </Paper>
          <Paper elevation={2}>
            <List>
              {books.map((book, index) => (
                <React.Fragment key={book.id}>
                  <Box
                    component="li"
                    onClick={() => handleSelectBook(book.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 2,
                      cursor: 'pointer',
                      backgroundColor: activeBookId === book.id ? 'primary.light' : 'transparent',
                      '&:hover': {
                        backgroundColor: activeBookId === book.id ? 'primary.light' : 'action.hover',
                      },
                      borderBottom: index < books.length - 1 ? 1 : 0,
                      borderColor: 'divider'
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} flex={1}>
                      <BookIcon color="primary" />
                      <Box flex={1}>
                        <Typography variant="h6">{book.title}</Typography>
                        {book.description && (
                          <Typography variant="body2" color="text.secondary">
                            {book.description}
                          </Typography>
                        )}
                        <Box display="flex" gap={1} mt={1}>
                          <Chip label={`${book.storyCount} stories`} size="small" variant="outlined" />
                        </Box>
                      </Box>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Export Book (JSON only)">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportBook(book.id);
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Export Book with Images (ZIP)">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportBookWithImages(book.id);
                          }}
                          disabled={exportingBookId === book.id}
                        >
                          {exportingBookId === book.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <FolderIcon />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Book Metadata">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialogForBook(book);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Book Style">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStyleEditor(book.id);
                          }}
                        >
                          <PaletteIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Book">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBook(book.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  {index < books.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </>
      )}

      {/* Create Book Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Book</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Book Title"
            fullWidth
            value={newBookTitle}
            onChange={(e) => setNewBookTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            value={newBookDescription}
            onChange={(e) => setNewBookDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Book Background Setup (Optional)"
            fullWidth
            multiline
            rows={4}
            value={newBookBackgroundSetup}
            onChange={(e) => setNewBookBackgroundSetup(e.target.value)}
            placeholder="Overall world/style description that applies to all scenes in this book..."
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Image Aspect Ratio</InputLabel>
            <Select
              value={newBookAspectRatio}
              label="Image Aspect Ratio"
              onChange={(e) => setNewBookAspectRatio(e.target.value)}
            >
              <MenuItem value="1:1">1:1 (Square)</MenuItem>
              <MenuItem value="2:3">2:3 (Portrait)</MenuItem>
              <MenuItem value="3:4">3:4 (Portrait)</MenuItem>
              <MenuItem value="9:16">9:16 (Portrait)</MenuItem>
              <MenuItem value="3:2">3:2 (Landscape)</MenuItem>
              <MenuItem value="4:3">4:3 (Landscape)</MenuItem>
              <MenuItem value="16:9">16:9 (Wide Landscape)</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => handleOpenPanelConfig('create')}
              variant="outlined"
              fullWidth
            >
              Configure Text Panel Overlay
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateBook} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Book</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Book Title"
            fullWidth
            value={editBookTitle}
            onChange={(e) => setEditBookTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            value={editBookDescription}
            onChange={(e) => setEditBookDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Book Background Setup (Optional)"
            fullWidth
            multiline
            rows={4}
            value={editBookBackgroundSetup}
            onChange={(e) => setEditBookBackgroundSetup(e.target.value)}
            placeholder="Overall world/style description that applies to all scenes in this book..."
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Image Aspect Ratio</InputLabel>
            <Select
              value={editBookAspectRatio}
              label="Image Aspect Ratio"
              onChange={(e) => setEditBookAspectRatio(e.target.value)}
            >
              <MenuItem value="1:1">1:1 (Square)</MenuItem>
              <MenuItem value="2:3">2:3 (Portrait)</MenuItem>
              <MenuItem value="3:4">3:4 (Portrait)</MenuItem>
              <MenuItem value="9:16">9:16 (Portrait)</MenuItem>
              <MenuItem value="3:2">3:2 (Landscape)</MenuItem>
              <MenuItem value="4:3">4:3 (Landscape)</MenuItem>
              <MenuItem value="16:9">16:9 (Wide Landscape)</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => handleOpenPanelConfig('edit')}
              variant="outlined"
              fullWidth
            >
              Configure Text Panel Overlay
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditBook} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Panel Config Dialog */}
      <PanelConfigDialog
        open={panelConfigDialogOpen}
        onClose={() => setPanelConfigDialogOpen(false)}
        initialConfig={panelConfigDialogMode === 'create' ? newBookPanelConfig : editBookPanelConfig}
        onSave={handleSavePanelConfig}
      />

      {/* Book Style Editor */}
      <BookStyleEditor
        open={styleEditorOpen}
        onClose={() => {
          setStyleEditorOpen(false);
          setEditingBookStyle(null);
        }}
        initialStyle={editingBookStyle?.style}
        onSave={handleSaveBookStyle}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}; 