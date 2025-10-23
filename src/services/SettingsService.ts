const SETTINGS_KEY = 'app-settings';

export interface AppSettings {
  openRouterApiKey?: string;
  imageGenerationModel?: string;
}

export class SettingsService {
  private static getSettings(): AppSettings {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return {
        imageGenerationModel: 'google/gemini-flash-1.5-8b'
      };
    }
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing settings:', error);
      return {
        imageGenerationModel: 'google/gemini-flash-1.5-8b'
      };
    }
  }

  private static saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  static getApiKey(): string | undefined {
    return this.getSettings().openRouterApiKey;
  }

  static setApiKey(apiKey: string): void {
    const settings = this.getSettings();
    settings.openRouterApiKey = apiKey;
    this.saveSettings(settings);
  }

  static clearApiKey(): void {
    const settings = this.getSettings();
    delete settings.openRouterApiKey;
    this.saveSettings(settings);
  }

  static getImageGenerationModel(): string {
    return this.getSettings().imageGenerationModel || 'google/gemini-flash-1.5-8b';
  }

  static setImageGenerationModel(model: string): void {
    const settings = this.getSettings();
    settings.imageGenerationModel = model;
    this.saveSettings(settings);
  }

  static getAllSettings(): AppSettings {
    return this.getSettings();
  }

  static updateSettings(updates: Partial<AppSettings>): void {
    const settings = this.getSettings();
    const updated = { ...settings, ...updates };
    this.saveSettings(updated);
  }
}

