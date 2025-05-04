
// ConfigService for managing sync settings and configuration

export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // in milliseconds
  retentionPeriod: number; // in days
  serverUrl?: string;
}

const DEFAULT_CONFIG: SyncConfig = {
  enabled: true,
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  retentionPeriod: 548, // 18 months (~548 days)
  serverUrl: process.env.NODE_ENV === 'production' 
    ? 'wss://your-sync-server.com/ws'
    : 'ws://localhost:8081'
};

class ConfigService {
  private config: SyncConfig;

  constructor() {
    // Load config from localStorage or use defaults
    const savedConfig = localStorage.getItem('syncConfig');
    if (savedConfig) {
      try {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) };
      } catch (e) {
        console.error('Error parsing saved config:', e);
        this.config = { ...DEFAULT_CONFIG };
      }
    } else {
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SyncConfig>): SyncConfig {
    this.config = { ...this.config, ...newConfig };
    // Save to localStorage
    localStorage.setItem('syncConfig', JSON.stringify(this.config));
    return { ...this.config };
  }

  resetConfig(): SyncConfig {
    this.config = { ...DEFAULT_CONFIG };
    localStorage.setItem('syncConfig', JSON.stringify(this.config));
    return { ...this.config };
  }

  // Check if data should be retained based on date
  shouldRetainData(date: string): boolean {
    const dataDate = new Date(date);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);
    
    return dataDate >= cutoffDate;
  }
}

export const configService = new ConfigService();
