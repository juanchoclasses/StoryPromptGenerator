const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');

// Initialize electron-store for persistent storage
const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, '../public/icon.png') // Optional: add icon
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === 'true') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for file system operations

/**
 * Select directory dialog
 */
ipcMain.handle('select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Data Directory'
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Cancelled' };
    }
    
    const selectedPath = result.filePaths[0];
    
    // Store the selected directory path
    store.set('baseDirectory', selectedPath);
    
    return {
      success: true,
      path: selectedPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
});

/**
 * Get stored directory path
 */
ipcMain.handle('get-directory-path', async () => {
  const path = store.get('baseDirectory');
  return { path: path || null };
});

/**
 * Read file from filesystem
 */
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Failed to read file' 
    };
  }
});

/**
 * Write file to filesystem
 */
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Failed to write file' 
    };
  }
});

/**
 * Read directory contents
 */
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];
    const directories = [];
    
    for (const entry of entries) {
      if (entry.isFile()) {
        files.push(entry.name);
      } else if (entry.isDirectory()) {
        directories.push(entry.name);
      }
    }
    
    return { success: true, files, directories };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Failed to read directory' 
    };
  }
});

/**
 * Check if file exists
 */
ipcMain.handle('file-exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return { exists: true };
  } catch {
    return { exists: false };
  }
});

/**
 * Delete file
 */
ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Failed to delete file' 
    };
  }
});

/**
 * Create directory
 */
ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Failed to create directory' 
    };
  }
});

/**
 * Read file as ArrayBuffer (for binary files like images)
 */
ipcMain.handle('read-file-binary', async (event, filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    return { 
      success: true, 
      data: buffer.buffer,
      byteOffset: buffer.byteOffset,
      byteLength: buffer.byteLength
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Failed to read file' 
    };
  }
});

/**
 * Write file from ArrayBuffer (for binary files like images)
 */
ipcMain.handle('write-file-binary', async (event, filePath, buffer) => {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(filePath, Buffer.from(buffer));
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message || 'Failed to write file' 
    };
  }
});

/**
 * Store value (replaces localStorage)
 */
ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

/**
 * Set store value (replaces localStorage)
 */
ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value);
});

/**
 * Delete store value
 */
ipcMain.handle('store-delete', (event, key) => {
  store.delete(key);
});

/**
 * Get all store keys
 */
ipcMain.handle('store-keys', () => {
  return store.store;
});

