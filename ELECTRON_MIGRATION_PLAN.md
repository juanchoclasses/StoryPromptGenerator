# Electron Migration Plan

## Overview
Convert the Prompter web app to an Electron desktop application. This will provide:
- ✅ Native file system access (no browser limitations)
- ✅ Better performance
- ✅ Offline-first architecture
- ✅ Cross-platform distribution (Windows, macOS, Linux)
- ✅ No browser compatibility issues

## Current Architecture
- **Build Tool**: Vite + React
- **File System**: File System Access API (`showDirectoryPicker`)
- **Storage**: Filesystem + IndexedDB (for directory handles) + localStorage
- **Deployment**: GitHub Pages (static hosting)

## Required Changes

### 1. Install Electron Dependencies

```bash
npm install --save-dev electron electron-builder
npm install --save electron-updater  # Optional: for auto-updates
```

### 2. Create Electron Main Process

**File: `electron/main.js`** (or `electron/main.ts` with TypeScript)

```javascript
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

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
    }
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers for file system operations
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return { success: false, error: 'Cancelled' };
  }
  
  return {
    success: true,
    path: result.filePaths[0]
  };
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

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
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file-exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return { exists: true };
  } catch {
    return { exists: false };
  }
});
```

### 3. Create Preload Script

**File: `electron/preload.js`**

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  
  // For storing directory path preference
  getStoreValue: (key) => ipcRenderer.invoke('store-get', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('store-set', key, value),
});
```

### 4. Create Electron FileSystemService Adapter

**File: `src/services/ElectronFileSystemService.ts`**

```typescript
/**
 * Electron-specific FileSystemService implementation
 * Replaces browser File System Access API with Electron IPC
 */

interface ElectronAPI {
  selectDirectory: () => Promise<{ success: boolean; path?: string; error?: string }>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  readDirectory: (dirPath: string) => Promise<{ success: boolean; files?: string[]; directories?: string[]; error?: string }>;
  fileExists: (filePath: string) => Promise<{ exists: boolean }>;
  getStoreValue: (key: string) => Promise<any>;
  setStoreValue: (key: string, value: any) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export class ElectronFileSystemService {
  private static baseDirectory: string | null = null;

  static isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  static async selectDirectory(): Promise<{ 
    success: boolean; 
    path?: string; 
    error?: string;
  }> {
    if (!this.isElectron()) {
      return { success: false, error: 'Not running in Electron' };
    }

    const result = await window.electronAPI!.selectDirectory();
    if (result.success && result.path) {
      this.baseDirectory = result.path;
      await window.electronAPI!.setStoreValue('baseDirectory', result.path);
    }
    return result;
  }

  static async getDirectoryHandle(): Promise<string | null> {
    if (!this.isElectron()) {
      return null;
    }

    if (this.baseDirectory) {
      return this.baseDirectory;
    }

    // Try to load from store
    const stored = await window.electronAPI!.getStoreValue('baseDirectory');
    if (stored) {
      this.baseDirectory = stored;
      return stored;
    }

    return null;
  }

  static async readFile(relativePath: string): Promise<string | null> {
    if (!this.isElectron()) {
      return null;
    }

    const baseDir = await this.getDirectoryHandle();
    if (!baseDir) {
      throw new Error('No directory selected');
    }

    const fullPath = `${baseDir}/${relativePath}`;
    const result = await window.electronAPI!.readFile(fullPath);
    
    if (result.success) {
      return result.content || null;
    }
    
    throw new Error(result.error || 'Failed to read file');
  }

  static async writeFile(relativePath: string, content: string): Promise<void> {
    if (!this.isElectron()) {
      throw new Error('Not running in Electron');
    }

    const baseDir = await this.getDirectoryHandle();
    if (!baseDir) {
      throw new Error('No directory selected');
    }

    const fullPath = `${baseDir}/${relativePath}`;
    const result = await window.electronAPI!.writeFile(fullPath, content);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to write file');
    }
  }

  static async fileExists(relativePath: string): Promise<boolean> {
    if (!this.isElectron()) {
      return false;
    }

    const baseDir = await this.getDirectoryHandle();
    if (!baseDir) {
      return false;
    }

    const fullPath = `${baseDir}/${relativePath}`;
    const result = await window.electronAPI!.fileExists(fullPath);
    return result.exists;
  }

  static async listDirectory(relativePath: string = ''): Promise<{ files: string[]; directories: string[] }> {
    if (!this.isElectron()) {
      return { files: [], directories: [] };
    }

    const baseDir = await this.getDirectoryHandle();
    if (!baseDir) {
      return { files: [], directories: [] };
    }

    const fullPath = relativePath ? `${baseDir}/${relativePath}` : baseDir;
    const result = await window.electronAPI!.readDirectory(fullPath);
    
    if (result.success) {
      return {
        files: result.files || [],
        directories: result.directories || []
      };
    }
    
    return { files: [], directories: [] };
  }
}
```

### 5. Update FileSystemService to Support Both Modes

**Modify `src/services/FileSystemService.ts`:**

```typescript
import { ElectronFileSystemService } from './ElectronFileSystemService';

export class FileSystemService {
  // Check if running in Electron
  static isElectron(): boolean {
    return ElectronFileSystemService.isElectron();
  }

  // Use Electron API if available, otherwise use browser API
  static async selectDirectory() {
    if (this.isElectron()) {
      return ElectronFileSystemService.selectDirectory();
    }
    // ... existing browser implementation
  }

  static async getDirectoryHandle() {
    if (this.isElectron()) {
      const path = await ElectronFileSystemService.getDirectoryHandle();
      // Convert path to a handle-like object for compatibility
      return path ? { name: path, path } : null;
    }
    // ... existing browser implementation
  }

  // Similar updates for all other methods
}
```

### 6. Update package.json

```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:pack": "npm run build && electron-builder --dir"
  },
  "devDependencies": {
    "electron": "^latest",
    "electron-builder": "^latest",
    "concurrently": "^latest",
    "wait-on": "^latest"
  }
}
```

### 7. Create electron-builder Configuration

**File: `electron-builder.yml`**

```yaml
appId: com.yourcompany.prompter
productName: Prompter
directories:
  buildResources: build
files:
  - dist/**
  - electron/**
  - package.json
mac:
  category: public.app-category.utilities
  target: dmg
win:
  target: nsis
linux:
  target: AppImage
```

### 8. Update Vite Config for Electron

**Modify `vite.config.ts`:**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.ELECTRON ? './' : '/',
  build: {
    outDir: 'dist',
    // Electron needs relative paths
    assetsDir: './',
  }
});
```

### 9. Handle localStorage Replacement

Electron can use `electron-store` for persistent storage:

```javascript
// In main.js
const Store = require('electron-store');
const store = new Store();

ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value);
});
```

### 10. Remove IndexedDB Dependency

Since Electron has direct file system access, we can:
- Store directory path in `electron-store` instead of IndexedDB
- Remove IndexedDB initialization code
- Simplify directory handle management

## Migration Steps

1. **Phase 1: Setup**
   - Install Electron dependencies
   - Create main process and preload scripts
   - Test basic window creation

2. **Phase 2: File System**
   - Create ElectronFileSystemService adapter
   - Update FileSystemService to detect Electron mode
   - Test file operations

3. **Phase 3: Storage**
   - Replace IndexedDB with electron-store
   - Update localStorage usage
   - Test persistence

4. **Phase 4: Build & Distribution**
   - Configure electron-builder
   - Test builds for all platforms
   - Set up code signing (optional)

5. **Phase 5: Polish**
   - Add app icons
   - Configure auto-updates (optional)
   - Test on all target platforms

## Benefits of Electron

✅ **No Browser Limitations**: Direct file system access without user prompts
✅ **Better Performance**: Native file operations
✅ **Offline-First**: No internet required
✅ **Cross-Platform**: One codebase, multiple platforms
✅ **Native Feel**: Can add native menus, tray icons, etc.
✅ **Smaller Bundle**: No need for browser compatibility code

## Considerations

⚠️ **Bundle Size**: Electron apps are larger (~100MB+)
⚠️ **Security**: Need to follow Electron security best practices
⚠️ **Updates**: Need to handle app updates (electron-updater)
⚠️ **Code Signing**: Required for distribution (costs money)

## Next Steps

1. Start with Phase 1 (basic Electron setup)
2. Test file operations work correctly
3. Gradually migrate features
4. Test thoroughly before full migration

