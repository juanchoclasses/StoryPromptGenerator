# Electron Setup Guide

This guide explains how to run and build the Prompter app as an Electron desktop application.

## Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Verify Electron is installed:**
   ```bash
   npx electron --version
   ```

## Development Mode

Run the app in Electron development mode:

```bash
npm run electron:dev
```

This will:
1. Start the Vite dev server on `http://localhost:5173`
2. Wait for the server to be ready
3. Launch Electron and load the app from the dev server

**Note:** The app will hot-reload when you make changes to the React code.

## Building for Production

### Build the React App

First, build the React app:

```bash
npm run build
```

### Package Electron App

#### Development Build (unpacked directory)

```bash
npm run electron:pack
```

This creates an unpacked app in the `dist-electron` directory that you can run directly.

#### Production Build (installer)

```bash
npm run electron:build
```

This creates platform-specific installers:
- **macOS**: `.dmg` file
- **Windows**: `.exe` installer
- **Linux**: `.AppImage` file

Output files will be in the `dist-electron` directory.

## Platform-Specific Notes

### macOS

- The first time you run the app, you may need to allow it in System Preferences > Security & Privacy
- For distribution, you'll need to code sign the app (requires Apple Developer account)

### Windows

- Windows Defender may flag unsigned apps
- Consider code signing for distribution

### Linux

- AppImage files are portable and don't require installation
- Make sure the AppImage has execute permissions: `chmod +x Prompter-*.AppImage`

## File System Access

In Electron mode, the app uses Node.js file system APIs instead of the browser's File System Access API. This means:

- ✅ No browser permission prompts
- ✅ Direct file system access
- ✅ Better performance
- ✅ Works offline

The directory selection dialog is a native OS dialog, and the selected directory path is stored securely using `electron-store`.

## Troubleshooting

### "Electron failed to install"

Try:
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Cannot find module 'electron'"

Make sure Electron is installed:
```bash
npm install --save-dev electron
```

### Dev server not starting

Check if port 5173 is available:
```bash
lsof -i :5173
```

### App window is blank

1. Check the Electron console (DevTools should open automatically in dev mode)
2. Look for errors in the terminal where you ran `npm run electron:dev`
3. Verify the Vite dev server is running on `http://localhost:5173`

### File operations not working

The Electron file system adapter is still being implemented. Some file operations may not work yet. Check the browser console (DevTools) for errors.

## Next Steps

1. ✅ Basic Electron setup complete
2. ⏳ File system operations migration (in progress)
3. ⏳ Test all file operations in Electron mode
4. ⏳ Add app icons
5. ⏳ Configure auto-updates (optional)
6. ⏳ Code signing for distribution (optional)

## Architecture

```
┌─────────────────────────────────────┐
│         Electron Main Process        │
│  (Node.js - file system access)     │
│  - main.js                           │
│  - IPC handlers                      │
└──────────────┬──────────────────────┘
               │ IPC
┌──────────────▼──────────────────────┐
│      Electron Renderer Process       │
│  (Chromium - React app)              │
│  - React components                  │
│  - FileSystemService                 │
│  - ElectronFileSystemService         │
└──────────────────────────────────────┘
```

The app automatically detects Electron mode and routes file operations to the appropriate implementation.

