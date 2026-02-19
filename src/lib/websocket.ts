/**
 * WebSocket Manager for Real-time Updates
 * Provides real-time communication for alerts, reports, and live updates
 */

import { Alert, Report, Resource } from '../types';

type EventType = 
  | 'alert:new'
  | 'alert:update'
  | 'alert:delete'
  | 'report:new'
  | 'report:update'
  | 'resource:new'
  | 'resource:update'
  | 'user:location'
  | 'system:status';

type MessageHandler = (data: any) => void;

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<EventType, Set<MessageHandler>> = new Map();
  private isConnecting = false;
  private isClosing = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      debug: config.debug || false,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;
      this.log('Connecting to WebSocket...');

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.log('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          this.log('🔌 WebSocket closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();

          if (!this.isClosing && !event.wasClean) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.isClosing = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.isClosing = false;
    this.log('Disconnected from WebSocket');
  }

  /**
   * Send message to server
   */
  send(type: string, data: any) {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }

    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    this.ws!.send(message);
    this.log('📤 Sent:', type, data);
  }

  /**
   * Subscribe to specific event type
   */
  on(eventType: EventType, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, new Set());
    }

    this.messageHandlers.get(eventType)!.add(handler);
    this.log('📝 Subscribed to:', eventType);

    // Return unsubscribe function
    return () => this.off(eventType, handler);
  }

  /**
   * Unsubscribe from event type
   */
  off(eventType: EventType, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(eventType);
      }
    }
    this.log('🗑️ Unsubscribed from:', eventType);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState(): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' {
    if (!this.ws) return 'CLOSED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'CLOSED';
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(rawData: string) {
    try {
      const message = JSON.parse(rawData);
      this.log('📥 Received:', message.type, message.data);

      // Handle heartbeat response
      if (message.type === 'pong') {
        return;
      }

      // Notify all subscribers for this event type
      const handlers = this.messageHandlers.get(message.type as EventType);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    this.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        this.log('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send('ping', {});
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Log message (only in debug mode)
   */
  private log(...args: any[]) {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }
}

// ==================== Convenience Functions ====================

/**
 * Subscribe to new alerts
 */
export function subscribeToAlerts(
  ws: WebSocketManager,
  callback: (alert: Alert) => void
): () => void {
  return ws.on('alert:new', callback);
}

/**
 * Subscribe to alert updates
 */
export function subscribeToAlertUpdates(
  ws: WebSocketManager,
  callback: (alert: Alert) => void
): () => void {
  return ws.on('alert:update', callback);
}

/**
 * Subscribe to new reports
 */
export function subscribeToReports(
  ws: WebSocketManager,
  callback: (report: Report) => void
): () => void {
  return ws.on('report:new', callback);
}

/**
 * Subscribe to resource updates
 */
export function subscribeToResources(
  ws: WebSocketManager,
  callback: (resource: Resource) => void
): () => void {
  return ws.on('resource:new', callback);
}

/**
 * Broadcast user location for live tracking
 */
export function broadcastLocation(
  ws: WebSocketManager,
  location: { latitude: number; longitude: number }
) {
  ws.send('user:location', location);
}

// ==================== Create WebSocket Instance ====================

let wsInstance: WebSocketManager | null = null;

/**
 * Get or create WebSocket instance
 */
export function getWebSocket(): WebSocketManager {
  if (!wsInstance) {
    const wsUrl = import.meta.env.VITE_WS_URL || 
                  (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace('http', 'ws');

    wsInstance = new WebSocketManager({
      url: wsUrl,
      debug: import.meta.env.DEV,
    });
  }

  return wsInstance;
}

/**
 * Initialize WebSocket connection
 */
export async function initializeWebSocket(): Promise<WebSocketManager> {
  const ws = getWebSocket();
  
  try {
    await ws.connect();
    console.log('✅ Real-time updates enabled');
    return ws;
  } catch (error) {
    console.warn('⚠️ Could not establish WebSocket connection:', error);
    console.warn('Falling back to polling for updates');
    throw error;
  }
}

export default WebSocketManager;
