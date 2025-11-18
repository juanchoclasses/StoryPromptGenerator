import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative paths for Electron, absolute for web
  base: process.env.ELECTRON ? './' : '/StoryPromptGenerator/',
  build: {
    outDir: 'dist',
    // Electron needs relative paths
    assetsDir: './',
  },
  server: {
    port: 5173,
    strictPort: true,
  }
})
