import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Cloud, Users, Clock, Database, RefreshCw, Save } from "lucide-react";
import { format } from "date-fns";

const SyncSettings: React.FC = () => {
  // Dummy fallback values
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState(60);
  const [retentionPeriod, setRetentionPeriod] = useState(548);
  const [serverUrl, setServerUrl] = useState("");
  const [connectedClients] = useState<string[]>([]);
  const [clientId] = useState("dummy-client-id");
  const [lastSynced] = useState<string | null>(null);
  const [isSyncing] = useState(false);

  const handleSaveSettings = () => {
    console.log("Saved settings:", {
      syncEnabled,
      autoSync,
      syncInterval,
      retentionPeriod,
      serverUrl
    });
  };

  const handleForceSync = () => {
    alert("Sync triggered (demo only)");
  };

  const formatRetentionPeriod = (days: number) => {
    if (days >= 365) {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      return `${years} year${years !== 1 ? 's' : ''}${remainingDays > 0 ? `, ${remainingDays} days` : ''}`;
    }
    return `${days} days`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Synchronization</CardTitle>
            <CardDescription>
              Configure how your data is synchronized across devices
            </CardDescription>
          </div>
          <Badge variant={syncEnabled ? "success" : "destructive"}>
            {syncEnabled ? "Connected" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="h-4 w-4" />
            <Label htmlFor="sync-enabled">Enable Synchronization</Label>
          </div>
          <Switch
            id="sync-enabled"
            checked={syncEnabled}
            onCheckedChange={setSyncEnabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <Label htmlFor="auto-sync">Auto Sync</Label>
          </div>
          <Switch
            id="auto-sync"
            checked={autoSync}
            onCheckedChange={setAutoSync}
            disabled={!syncEnabled}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <Label>Sync Interval: {syncInterval} seconds</Label>
          </div>
          <Slider
            disabled={!syncEnabled || !autoSync}
            value={[syncInterval]}
            min={5}
            max={300}
            step={5}
            onValueChange={(value) => setSyncInterval(value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <Label>Data Retention: {formatRetentionPeriod(retentionPeriod)}</Label>
          </div>
          <Slider
            value={[retentionPeriod]}
            min={30}
            max={730}
            step={30}
            onValueChange={(value) => setRetentionPeriod(value[0])}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Food safety regulations require 18 months (548 days) minimum retention
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Cloud className="h-4 w-4" />
            <Label htmlFor="server-url">Sync Server URL</Label>
          </div>
          <Input
            id="server-url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="wss://your-sync-server.com/ws"
            disabled={!syncEnabled}
          />
        </div>

        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <Label>Connected Devices: {connectedClients.length}</Label>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Your device ID: {clientId}</p>
            <p>Last synced: {lastSynced ? format(new Date(lastSynced), "yyyy-MM-dd HH:mm:ss") : "Never"}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleForceSync}
          disabled={!syncEnabled || isSyncing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>

        <Button onClick={handleSaveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SyncSettings;
