import React from "react";
import { ConnectionStatus } from "@/services/WebSocketService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, formatDistanceToNow } from "date-fns";

// Dummy context fallback – ensures no SyncContext dependency
const useSyncContext = () => ({
  status: ConnectionStatus.DISCONNECTED,
  lastSynced: null,
  isSyncing: false,
  syncEnabled: false,
  forceSyncNow: () => {},
  toggleSync: () => {},
  connectedClients: []
});

const SyncStatusIndicator: React.FC = () => {
  const { 
    status, 
    lastSynced, 
    isSyncing, 
    syncEnabled, 
    forceSyncNow, 
    connectedClients 
  } = useSyncContext();

  const formatLastSynced = () => {
    if (!lastSynced) return "Never";
    try {
      const date = new Date(lastSynced);
      return `${formatDistanceToNow(date, { addSuffix: true })} (${format(date, "HH:mm:ss")})`;
    } catch {
      return "Unknown";
    }
  };

  const getStatusColor = () => {
    if (!syncEnabled) return "gray";
    switch (status) {
      case ConnectionStatus.CONNECTED: return "green";
      case ConnectionStatus.CONNECTING: return "yellow";
      case ConnectionStatus.ERROR: return "red";
      case ConnectionStatus.DISCONNECTED: return "gray";
      default: return "gray";
    }
  };

  const getStatusText = () => {
    if (!syncEnabled) return "Sync disabled";
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return `Connected (${connectedClients.length} devices)`;
      case ConnectionStatus.CONNECTING:
        return "Connecting...";
      case ConnectionStatus.ERROR:
        return "Connection error";
      case ConnectionStatus.DISCONNECTED:
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = () => {
    if (isSyncing) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!syncEnabled) return <WifiOff className="h-4 w-4" />;
    switch (status) {
      case ConnectionStatus.CONNECTED: return <Wifi className="h-4 w-4" />;
      case ConnectionStatus.CONNECTING: return <Loader2 className="h-4 w-4 animate-spin" />;
      case ConnectionStatus.ERROR:
      case ConnectionStatus.DISCONNECTED: return <WifiOff className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2 text-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`px-2 py-1 border-${getStatusColor()}-500 text-${getStatusColor()}-600 flex items-center gap-1`}
            >
              {getStatusIcon()} {getStatusText()}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <div className="text-sm">
              <p><strong>Sync status:</strong> {getStatusText()}</p>
              <p><strong>Last synced:</strong> {formatLastSynced()}</p>
              {connectedClients.length > 0 && (
                <p><strong>Connected devices:</strong> {connectedClients.length}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={forceSyncNow}
                disabled={!syncEnabled || isSyncing}
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sync now</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </TooltipProvider>
  );
};

export default SyncStatusIndicator;
