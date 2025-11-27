/**
 * Test setup file for Vitest and React Testing Library
 * 
 * This file is run before all tests and sets up the testing environment.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.electronAPI (for Electron-specific code)
global.electronAPI = undefined;

// Mock matchMedia (used by some MUI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (used by some components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (used by some components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock URL.createObjectURL and URL.revokeObjectURL
// These are used by ImageCache and ImageStorageService
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn(() => {});

// Mock IndexedDB for FileSystemService (browser mode)
// In Electron mode, IndexedDB is not used - directory path is stored in Electron store
// In browser mode, IndexedDB stores the FileSystemDirectoryHandle (permission token)
(global as any).indexedDB = {
  open: vi.fn((dbName: string, version: number) => {
    const request: any = {
      result: null,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };
    
    // Simulate async open
    setTimeout(() => {
      const mockDB: any = {
        objectStoreNames: {
          contains: vi.fn(() => false)
        },
        transaction: vi.fn((storeNames: string[], mode: string) => ({
          objectStore: vi.fn((name: string) => ({
            get: vi.fn((key: string) => {
              const getRequest: any = {
                result: null,
                error: null,
                onsuccess: null,
                onerror: null,
              };
              setTimeout(() => {
                if (getRequest.onsuccess) getRequest.onsuccess();
              }, 0);
              return getRequest;
            }),
            put: vi.fn((value: any, key: string) => {
              const putRequest: any = {
                result: null,
                error: null,
                onsuccess: null,
                onerror: null,
              };
              setTimeout(() => {
                if (putRequest.onsuccess) putRequest.onsuccess();
              }, 0);
              return putRequest;
            }),
            delete: vi.fn((key: string) => {
              const deleteRequest: any = {
                result: null,
                error: null,
                onsuccess: null,
                onerror: null,
              };
              setTimeout(() => {
                if (deleteRequest.onsuccess) deleteRequest.onsuccess();
              }, 0);
              return deleteRequest;
            }),
          }))
        })),
        createObjectStore: vi.fn(() => ({})),
      };
      
      request.result = mockDB;
      
      // Trigger onupgradeneeded if it's set
      if (request.onupgradeneeded) {
        const event = { target: request };
        request.onupgradeneeded(event);
      }
      
      // Then trigger onsuccess
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  })
};

