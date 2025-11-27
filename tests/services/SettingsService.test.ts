import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SettingsService, type AppSettings } from '../../src/services/SettingsService';
import { FileSystemService } from '../../src/services/FileSystemService';

// Mock FileSystemService
vi.mock('../../src/services/FileSystemService', () => ({
  FileSystemService: {
    loadAppMetadata: vi.fn(),
    saveAppMetadata: vi.fn()
  }
}));

describe('SettingsService', () => {
  const mockMetadata = {
    settings: {
      openRouterApiKey: 'test-api-key',
      imageGenerationModel: 'test-model',
      autoSaveImages: true
    }
  };

  beforeEach(() => {
    // Clear cache before each test
    (SettingsService as any).settingsCache = null;
    
    // Setup default mock behavior
    vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue(mockMetadata);
    vi.mocked(FileSystemService.saveAppMetadata).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllSettings', () => {
    it('should return all settings', async () => {
      const settings = await SettingsService.getAllSettings();
      
      expect(settings.openRouterApiKey).toBe('test-api-key');
      expect(settings.imageGenerationModel).toBe('test-model');
      expect(settings.autoSaveImages).toBe(true);
    });

    it('should load settings from filesystem on first call', async () => {
      await SettingsService.getAllSettings();
      
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1);
    });

    it('should use cache on subsequent calls', async () => {
      await SettingsService.getAllSettings();
      await SettingsService.getAllSettings();
      await SettingsService.getAllSettings();
      
      // Should only load once
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1);
    });

    it('should return default settings when no metadata exists', async () => {
      vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue(null);
      (SettingsService as any).settingsCache = null;
      
      const settings = await SettingsService.getAllSettings();
      
      expect(settings.imageGenerationModel).toBe('google/gemini-2.5-flash-image');
      expect(settings.openRouterApiKey).toBeUndefined();
    });

    it('should return default settings when metadata has no settings', async () => {
      vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue({});
      (SettingsService as any).settingsCache = null;
      
      const settings = await SettingsService.getAllSettings();
      
      expect(settings.imageGenerationModel).toBe('google/gemini-2.5-flash-image');
    });
  });

  describe('API Key Management', () => {
    it('should get API key', async () => {
      const apiKey = await SettingsService.getApiKey();
      
      expect(apiKey).toBe('test-api-key');
    });

    it('should return undefined when no API key is set', async () => {
      vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue({ settings: {} });
      (SettingsService as any).settingsCache = null;
      
      const apiKey = await SettingsService.getApiKey();
      
      expect(apiKey).toBeUndefined();
    });

    it('should set API key', async () => {
      await SettingsService.setApiKey('new-api-key');
      
      expect(FileSystemService.saveAppMetadata).toHaveBeenCalledTimes(1);
      const savedData = vi.mocked(FileSystemService.saveAppMetadata).mock.calls[0][0];
      expect(savedData.settings?.openRouterApiKey).toBe('new-api-key');
    });

    it('should update cache when setting API key', async () => {
      await SettingsService.setApiKey('new-api-key');
      
      // Get API key should return new value from cache
      const apiKey = await SettingsService.getApiKey();
      expect(apiKey).toBe('new-api-key');
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1); // Only initial load
    });

    it('should clear API key', async () => {
      await SettingsService.clearApiKey();
      
      expect(FileSystemService.saveAppMetadata).toHaveBeenCalledTimes(1);
      const savedData = vi.mocked(FileSystemService.saveAppMetadata).mock.calls[0][0];
      expect(savedData.settings?.openRouterApiKey).toBeUndefined();
    });

    it('should update cache when clearing API key', async () => {
      await SettingsService.clearApiKey();
      
      const apiKey = await SettingsService.getApiKey();
      expect(apiKey).toBeUndefined();
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe('Image Generation Model Management', () => {
    it('should get image generation model', async () => {
      const model = await SettingsService.getImageGenerationModel();
      
      expect(model).toBe('test-model');
    });

    it('should return default model when not set', async () => {
      vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue({ settings: {} });
      (SettingsService as any).settingsCache = null;
      
      const model = await SettingsService.getImageGenerationModel();
      
      expect(model).toBe('google/gemini-2.5-flash-image');
    });

    it('should set image generation model', async () => {
      await SettingsService.setImageGenerationModel('new-model');
      
      expect(FileSystemService.saveAppMetadata).toHaveBeenCalledTimes(1);
      const savedData = vi.mocked(FileSystemService.saveAppMetadata).mock.calls[0][0];
      expect(savedData.settings?.imageGenerationModel).toBe('new-model');
    });

    it('should update cache when setting model', async () => {
      await SettingsService.setImageGenerationModel('new-model');
      
      const model = await SettingsService.getImageGenerationModel();
      expect(model).toBe('new-model');
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1); // Only initial load
    });
  });

  describe('Auto Save Images Management', () => {
    it('should check if auto save is enabled', async () => {
      const enabled = await SettingsService.isAutoSaveEnabled();
      
      expect(enabled).toBe(true);
    });

    it('should return false by default when not set', async () => {
      vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue({ settings: {} });
      (SettingsService as any).settingsCache = null;
      
      const enabled = await SettingsService.isAutoSaveEnabled();
      
      expect(enabled).toBe(false);
    });

    it('should set auto save enabled', async () => {
      await SettingsService.setAutoSaveEnabled(false);
      
      expect(FileSystemService.saveAppMetadata).toHaveBeenCalledTimes(1);
      const savedData = vi.mocked(FileSystemService.saveAppMetadata).mock.calls[0][0];
      expect(savedData.settings?.autoSaveImages).toBe(false);
    });

    it('should update cache when setting auto save', async () => {
      await SettingsService.setAutoSaveEnabled(false);
      
      const enabled = await SettingsService.isAutoSaveEnabled();
      expect(enabled).toBe(false);
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1); // Only initial load
    });

    it('should handle null/undefined auto save value', async () => {
      vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue({ 
        settings: { autoSaveImages: undefined } 
      });
      (SettingsService as any).settingsCache = null;
      
      const enabled = await SettingsService.isAutoSaveEnabled();
      
      expect(enabled).toBe(false); // Should use default
    });
  });

  describe('Update Settings', () => {
    beforeEach(() => {
      // Ensure cache is clear for each test in this suite
      (SettingsService as any).settingsCache = null;
      vi.clearAllMocks();
      
      // Re-setup mock behavior after clearing
      vi.mocked(FileSystemService.loadAppMetadata).mockResolvedValue(mockMetadata);
      vi.mocked(FileSystemService.saveAppMetadata).mockResolvedValue();
    });

    it('should update multiple settings at once', async () => {
      await SettingsService.updateSettings({
        openRouterApiKey: 'updated-key',
        imageGenerationModel: 'updated-model'
      });
      
      expect(FileSystemService.saveAppMetadata).toHaveBeenCalledTimes(1);
      const savedData = vi.mocked(FileSystemService.saveAppMetadata).mock.calls[0][0];
      expect(savedData.settings?.openRouterApiKey).toBe('updated-key');
      expect(savedData.settings?.imageGenerationModel).toBe('updated-model');
    });

    it('should preserve existing settings when updating', async () => {
      await SettingsService.updateSettings({
        imageGenerationModel: 'updated-model'
      });
      
      const settings = await SettingsService.getAllSettings();
      expect(settings.imageGenerationModel).toBe('updated-model'); // Updated
      
      // Verify save was called with spread settings
      expect(FileSystemService.saveAppMetadata).toHaveBeenCalledTimes(1);
      const savedData = vi.mocked(FileSystemService.saveAppMetadata).mock.calls[0][0];
      expect(savedData.settings?.imageGenerationModel).toBe('updated-model');
      
      // Should only load once (initial)
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1);
    });

    it('should update cache when updating settings', async () => {
      await SettingsService.updateSettings({
        imageGenerationModel: 'updated-model'
      });
      
      const model = await SettingsService.getImageGenerationModel();
      expect(model).toBe('updated-model');
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1); // Only initial load
    });

    it('should handle partial updates', async () => {
      await SettingsService.updateSettings({
        autoSaveImages: false
      });
      
      const savedData = vi.mocked(FileSystemService.saveAppMetadata).mock.calls[0][0];
      expect(savedData.settings?.autoSaveImages).toBe(false);
      
      // Verify the update was applied
      const enabled = await SettingsService.isAutoSaveEnabled();
      expect(enabled).toBe(false);
    });
  });

  describe('Cache Behavior', () => {
    it('should not reload settings from filesystem after cache is populated', async () => {
      // Initial load
      await SettingsService.getAllSettings();
      
      // Multiple operations
      await SettingsService.getApiKey();
      await SettingsService.getImageGenerationModel();
      await SettingsService.isAutoSaveEnabled();
      
      // Should only load once
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1);
    });

    it('should update cache after any save operation', async () => {
      await SettingsService.setApiKey('new-key');
      
      // Subsequent reads should use cache with updated value
      const apiKey = await SettingsService.getApiKey();
      expect(apiKey).toBe('new-key');
      
      // No additional filesystem loads
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1);
    });

    it('should persist cache across multiple reads', async () => {
      const settings1 = await SettingsService.getAllSettings();
      const settings2 = await SettingsService.getAllSettings();
      const settings3 = await SettingsService.getAllSettings();
      
      // Should be the same object from cache
      expect(settings1).toEqual(settings2);
      expect(settings2).toEqual(settings3);
      expect(FileSystemService.loadAppMetadata).toHaveBeenCalledTimes(1);
    });
  });
});

