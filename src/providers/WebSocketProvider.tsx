import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useWebSocketMessages } from '../hooks/useWebSocketMessages';
import { WebSocketMessage, WebSocketMessageType } from '../hooks/useWebSocket';
import { useUser } from '../hooks/useUser';

// Define the WebSocket context type
interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  hasConnectionFailed: boolean;
  connect: () => void;
  disconnect: (force?: boolean) => void;
  retryConnection: () => void;
  sendMessage: (type: WebSocketMessageType, payload: any) => boolean;
  subscribe: (type: WebSocketMessageType, handler: (message: WebSocketMessage) => void) => () => void;
  subscribeToAll: (handler: (message: WebSocketMessage) => void) => () => void;
}

// Create the WebSocket context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

/**
 * WebSocket Provider component
 */
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  // Get authentication state from useUser hook
  const { isAuthenticated, isCheckingAuth } = useUser();

  // Use the WebSocket messages hook
  const webSocket = useWebSocketMessages();

  // Create a retryConnection method that uses resetConnection
  const retryConnection = useCallback(() => {
    webSocket.resetConnection();
    webSocket.connect();
  }, [webSocket]);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth) {
      webSocket.connect();
    }
  }, [isAuthenticated, isCheckingAuth, webSocket.connect]);

  // Create the context value with all required properties
  const contextValue: WebSocketContextType = {
    ...webSocket,
    retryConnection
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to use the WebSocket context
 */
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }

  return context;
} 