import { FileSystemService } from './FileSystemService';

export interface AppSettings {
  openRouterApiKey?: string;
  imageGenerationModel?: string;
  textLLMModel?: string;
  autoSaveImages?: boolean;
}

export class SettingsService {
  private static settingsCache: AppSettings | null = null;

  private static async getSettings(): Promise<AppSettings> {
    // Return cached settings if available
    if (this.settingsCache !== null) {
      return this.settingsCache;
    }

    // Load from filesystem
    const metadata = await FileSystemService.loadAppMetadata();
    const settings = metadata?.settings || {
      imageGenerationModel: 'google/gemini-2.5-flash-image'
    };

    // Cache settings
    this.settingsCache = settings;
    return settings;
  }

  private static async saveSettings(settings: AppSettings): Promise<void> {
    // Update cache
    this.settingsCache = settings;

    // Save to filesystem
    await FileSystemService.saveAppMetadata({ settings });
  }

  static async getApiKey(): Promise<string | undefined> {
    const settings = await this.getSettings();
    return settings.openRouterApiKey;
  }

  static async setApiKey(apiKey: string): Promise<void> {
    const settings = await this.getSettings();
    settings.openRouterApiKey = apiKey;
    await this.saveSettings(settings);
  }

  static async clearApiKey(): Promise<void> {
    const settings = await this.getSettings();
    delete settings.openRouterApiKey;
    await this.saveSettings(settings);
  }

  static async getImageGenerationModel(): Promise<string> {
    const settings = await this.getSettings();
    return settings.imageGenerationModel || 'google/gemini-2.5-flash-image';
  }

  static async setImageGenerationModel(model: string): Promise<void> {
    const settings = await this.getSettings();
    settings.imageGenerationModel = model;
    await this.saveSettings(settings);
  }

  static async getTextLLMModel(): Promise<string> {
    const settings = await this.getSettings();
    return settings.textLLMModel || 'google/gemini-2.0-flash-exp';
  }

  static async setTextLLMModel(model: string): Promise<void> {
    const settings = await this.getSettings();
    settings.textLLMModel = model;
    await this.saveSettings(settings);
  }

  static async getAllSettings(): Promise<AppSettings> {
    return await this.getSettings();
  }

  static async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const settings = await this.getSettings();
    const updated = { ...settings, ...updates };
    await this.saveSettings(updated);
  }

  static async isAutoSaveEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.autoSaveImages ?? false; // Default: OFF
  }

  static async setAutoSaveEnabled(enabled: boolean): Promise<void> {
    const settings = await this.getSettings();
    settings.autoSaveImages = enabled;
    await this.saveSettings(settings);
  }
}

