
import React from "react";
import { Card } from "@/components/ui/card";
import SyncSettings from "@/components/sync/SyncSettings";

const SyncTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Synchronization Settings</h2>
      <p className="text-muted-foreground">
        Configure how your data is synchronized across devices and retained for food safety compliance.
      </p>
      
      <div className="grid gap-6">
        <SyncSettings />
        
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-2">About Data Synchronization</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Real-time sync:</strong> Changes made on one device are instantly reflected on all connected devices.
            </li>
            <li>
              <strong>Offline mode:</strong> Continue working when disconnected. Changes will sync when you reconnect.
            </li>
            <li>
              <strong>Data retention:</strong> Food safety regulations require keeping records for 18 months. Your data is automatically archived and retained.
            </li>
            <li>
              <strong>Backup:</strong> Your data is automatically backed up to prevent loss.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default SyncTab;
