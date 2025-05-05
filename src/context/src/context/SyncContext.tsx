// src/context/SyncContext.tsx

import React from "react";

export const useSyncContext = () => ({
  status: "DISCONNECTED",
  lastSynced: null,
  connectedClients: [],
  syncEnabled: false,
  isSyncing: false,
  clientId: "00000000-0000-0000-0000-000000000000",
  config: {
    syncInterval: 60000,
    retentionPeriod: 548,
    autoSync: false,
    serverUrl: ""
  },
  toggleSync: () => {},
  updateConfig: () => {},
  forceSyncNow: () => {},
});

export const SyncProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
