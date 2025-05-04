
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { wsService, ConnectionStatus, SyncEventType, SyncMessageType } from "../services/WebSocketService";
import { dbService, SyncInfo } from "../services/IndexedDBService";
import { configService, SyncConfig } from "../services/ConfigService";
import { useToast } from "../hooks/use-toast";

interface SyncContextType {
  status: ConnectionStatus;
  lastSynced: string | null;
  connectedClients: string[];
  syncEnabled: boolean;
  isSyncing: boolean;
  clientId: string;
  config: SyncConfig;
  toggleSync: () => void;
  updateConfig: (config: Partial<SyncConfig>) => void;
  forceSyncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const { toast } = useToast();
  
  // State for sync status
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [connectedClients, setConnectedClients] = useState<string[]>([]);
  const [syncEnabled, setSyncEnabled] = useState<boolean>(configService.getConfig().enabled);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [config, setConfig] = useState<SyncConfig>(configService.getConfig());
  const [clientId] = useState<string>(dbService.getClientId());
  
  // Handle WebSocket status changes
  useEffect(() => {
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
    };
    
    const handleClientsUpdate = (clients: string[]) => {
      setConnectedClients(clients);
    };
    
    wsService.on('statusChange', handleStatusChange);
    wsService.on('clientsUpdate', handleClientsUpdate);
    
    return () => {
      wsService.off('statusChange', handleStatusChange);
      wsService.off('clientsUpdate', handleClientsUpdate);
    };
  }, []);
  
  // Load last sync time
  useEffect(() => {
    const loadSyncInfo = async () => {
      try {
        const syncInfo = await dbService.getSyncInfo();
        if (syncInfo && syncInfo.lastSynced) {
          setLastSynced(syncInfo.lastSynced);
        }
      } catch (error) {
        console.error('Error loading sync info:', error);
      }
    };
    
    loadSyncInfo();
  }, []);
  
  // Auto-connect if sync is enabled
  useEffect(() => {
    if (syncEnabled) {
      connectToSyncService();
    } else {
      wsService.disconnect();
    }
    
    return () => {
      // Ensure clean disconnect when component unmounts
      wsService.disconnect();
    };
  }, [syncEnabled]);
  
  const connectToSyncService = async () => {
    try {
      await wsService.connect();
    } catch (error) {
      console.error('Failed to connect to sync service:', error);
      toast({
        title: "Sync connection failed",
        description: "Could not connect to the sync service. Please check your network connection.",
        variant: "destructive",
      });
    }
  };
  
  const toggleSync = () => {
    const newEnabled = !syncEnabled;
    setSyncEnabled(newEnabled);
    
    const newConfig = configService.updateConfig({ enabled: newEnabled });
    setConfig(newConfig);
    
    toast({
      title: newEnabled ? "Sync enabled" : "Sync disabled",
      description: newEnabled 
        ? "Your data will be synchronized across devices"
        : "Data synchronization has been disabled",
    });
  };
  
  const updateConfig = (newConfig: Partial<SyncConfig>) => {
    const updatedConfig = configService.updateConfig(newConfig);
    setConfig(updatedConfig);
    
    // Apply changes immediately if needed
    if (updatedConfig.enabled !== syncEnabled) {
      setSyncEnabled(updatedConfig.enabled);
    }
  };
  
  const forceSyncNow = async () => {
    if (isSyncing) return Promise.resolve();
    
    setIsSyncing(true);
    
    try {
      if (status !== ConnectionStatus.CONNECTED) {
        await connectToSyncService();
      }
      
      // Send sync request message
      wsService.sendMessage({
        type: SyncMessageType.SYNC_REQUEST,
        clientId: clientId,
        timestamp: new Date().toISOString(),
      });
      
      // Update last synced timestamp
      const syncInfo = await dbService.updateSyncInfo({
        lastSynced: new Date().toISOString(),
      });
      
      if (syncInfo.lastSynced) {
        setLastSynced(syncInfo.lastSynced);
      }
      
      toast({
        title: "Sync completed",
        description: "Your data has been successfully synchronized",
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync failed",
        description: "An error occurred during synchronization",
        variant: "destructive",
      });
      
      return Promise.reject(error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const value = {
    status,
    lastSynced,
    connectedClients,
    syncEnabled,
    isSyncing,
    clientId,
    config,
    toggleSync,
    updateConfig,
    forceSyncNow,
  };
  
  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};
