const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Directory operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDirectoryPath: () => ipcRenderer.invoke('get-directory-path'),
  
  // File operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  
  // Binary file operations (for images)
  readFileBinary: (filePath) => ipcRenderer.invoke('read-file-binary', filePath),
  writeFileBinary: (filePath, buffer) => ipcRenderer.invoke('write-file-binary', filePath, buffer),
  
  // Directory operations
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  
  // Store operations (replaces localStorage)
  getStoreValue: (key) => ipcRenderer.invoke('store-get', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('store-set', key, value),
  deleteStoreValue: (key) => ipcRenderer.invoke('store-delete', key),
  getAllStoreValues: () => ipcRenderer.invoke('store-keys'),
});

