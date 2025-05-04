
import { dbService } from "./IndexedDBService";

// Define sync message types
export enum SyncMessageType {
  CONNECT = 'connect',
  SYNC_REQUEST = 'sync_request',
  SYNC_DATA = 'sync_data',
  UPDATE = 'update',
  DELETE = 'delete',
  ERROR = 'error',
  CONNECTED_CLIENTS = 'connected_clients'
}

// Define sync message structure
export interface SyncMessage {
  type: SyncMessageType;
  clientId: string;
  timestamp: string;
  entity?: string;
  data?: any;
  id?: string;
  version?: number;
}

// Connection status enum
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Websocket service options
interface WebSocketServiceOptions {
  url: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// Define events that can be subscribed to
export type SyncEventType = 
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'statusChange'
  | 'dataReceived'
  | 'clientsUpdate';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private url: string;
  private autoReconnect: boolean;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private eventListeners: Map<SyncEventType, Set<Function>> = new Map();
  private messageQueue: SyncMessage[] = [];
  private connectedClients: string[] = [];
  
  constructor(options: WebSocketServiceOptions) {
    this.url = options.url;
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
  }

  // Connect to the WebSocket server
  connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    this.setStatus(ConnectionStatus.CONNECTING);
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.setStatus(ConnectionStatus.CONNECTED);
          this.reconnectAttempts = 0;
          
          // Send initial connect message with client ID
          this.sendMessage({
            type: SyncMessageType.CONNECT,
            clientId: dbService.getClientId(),
            timestamp: new Date().toISOString()
          });
          
          // Process any queued messages
          this.processQueue();
          
          this.trigger('connect');
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.setStatus(ConnectionStatus.DISCONNECTED);
          this.trigger('disconnect', { code: event.code, reason: event.reason });
          
          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.setStatus(ConnectionStatus.ERROR);
          this.trigger('error', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: SyncMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing message:', error, event.data);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.setStatus(ConnectionStatus.ERROR);
        this.trigger('error', error);
        reject(error);
        
        if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      }
    });
  }

  // Disconnect from the WebSocket server
  disconnect(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Get current connection status
  getStatus(): ConnectionStatus {
    return this.status;
  }

  // Get connected clients
  getConnectedClients(): string[] {
    return [...this.connectedClients];
  }

  // Send a message
  sendMessage(message: SyncMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for later sending
      this.messageQueue.push(message);
      
      // If not connected or connecting, try to connect
      if (this.status === ConnectionStatus.DISCONNECTED || this.status === ConnectionStatus.ERROR) {
        this.connect();
      }
    }
  }

  // Handle incoming message
  private handleMessage(message: SyncMessage): void {
    console.log('Received message:', message);
    
    switch (message.type) {
      case SyncMessageType.CONNECTED_CLIENTS:
        if (Array.isArray(message.data)) {
          this.connectedClients = message.data;
          this.trigger('clientsUpdate', this.connectedClients);
        }
        break;

      case SyncMessageType.SYNC_REQUEST:
        // Server is asking for our data - we will handle this in the DataContext
        break;
        
      case SyncMessageType.SYNC_DATA:
      case SyncMessageType.UPDATE:
      case SyncMessageType.DELETE:
        if (message.entity && (message.data || message.id)) {
          // Forward data events to subscribers
          this.trigger('dataReceived', message);
        }
        break;
        
      case SyncMessageType.ERROR:
        console.error('Sync error:', message.data);
        this.trigger('error', message.data);
        break;
    }
  }

  // Process queued messages
  private processQueue(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.messageQueue.length > 0) {
      console.log(`Processing ${this.messageQueue.length} queued messages`);
      
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          this.ws.send(JSON.stringify(message));
        }
      }
    }
  }

  // Schedule reconnection
  private scheduleReconnect(): void {
    if (this.reconnectTimer === null) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
      
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
    }
  }

  // Update connection status
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.trigger('statusChange', status);
    }
  }

  // Event subscription methods
  on(event: SyncEventType, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: SyncEventType, callback: Function): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.delete(callback);
    }
  }

  private trigger(event: SyncEventType, data?: any): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event handler:`, error);
        }
      });
    }
  }
}

// Create default WebSocket service
// In a production environment, you would use wss:// (secure WebSocket)
// For local development, we'll use a mock implementation that
// will be replaced by a real server implementation in production
export class MockWebSocketService extends WebSocketService {
  constructor() {
    super({ url: 'mock://localhost' });
  }

  // Mock implementation that simulates connection but doesn't actually connect
  connect(): Promise<void> {
    console.log('Mock WebSocket service connected');
    setTimeout(() => this.trigger('connect'), 100);
    setTimeout(() => this.trigger('statusChange', ConnectionStatus.CONNECTED), 100);
    return Promise.resolve();
  }

  disconnect(): void {
    console.log('Mock WebSocket service disconnected');
    setTimeout(() => this.trigger('disconnect', { code: 1000, reason: 'Normal closure' }), 100);
    setTimeout(() => this.trigger('statusChange', ConnectionStatus.DISCONNECTED), 100);
  }

  sendMessage(message: SyncMessage): void {
    console.log('Mock WebSocket sending message:', message);
    
    // Simulate receiving messages for local testing
    if (message.type === SyncMessageType.CONNECT) {
      setTimeout(() => {
        this.handleMessage({
          type: SyncMessageType.CONNECTED_CLIENTS,
          clientId: 'server',
          timestamp: new Date().toISOString(),
          data: [dbService.getClientId(), 'other-client-1', 'other-client-2']
        });
      }, 300);
    }
  }

  private handleMessage(message: SyncMessage): void {
    console.log('Mock received message:', message);
    this.trigger('dataReceived', message);
    
    if (message.type === SyncMessageType.CONNECTED_CLIENTS && Array.isArray(message.data)) {
      this.trigger('clientsUpdate', message.data);
    }
  }
}

// Export singleton instances
export const wsService = process.env.NODE_ENV === 'production' 
  ? new WebSocketService({ url: 'wss://your-sync-server.com/ws' }) 
  : new MockWebSocketService();
