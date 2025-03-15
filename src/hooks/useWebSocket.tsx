import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { tokenManager } from '../services/services';
import { addToast } from "@heroui/react";

// Define the types of messages we can receive
export enum WebSocketMessageType {
  NEW_MESSAGE = 'new_message',
  MESSAGE_READ = 'message_read',
  NEW_GROUP_MESSAGE = 'new_group_message',
  NEW_MATCHING_REQUEST = 'new_matching_request',
  MATCHING_REQUEST_ACCEPTED = 'matching_request_accepted',
  NEW_MEETING = 'new_meeting',
  MEETING_STARTED = 'meeting_started',
  NEW_NOTIFICATION = 'new_notification',
  EDITED_MESSAGE = 'edited_message',
  DELETED_MESSAGE = 'deleted_message',
  SEEN_MESSAGE = 'seen_message',
  AUTHENTICATION_SUCCESS = 'authentication_success',
  AUTHENTICATION_ERROR = 'authentication_error',
  // Add more message types as needed
}

// Define the structure of a WebSocket message
export interface WebSocketMessage {
  type: WebSocketMessageType | string;
  payload: any;
}

// Define the options for the hook
interface WebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// Define the WebSocket context type
interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: (force?: boolean) => void;
  sendMessage: (type: string, payload: any) => boolean;
  reconnectAttempts: number;
  addMessageListener: (listener: (message: WebSocketMessage) => void) => () => void;
  hasConnectionFailed: boolean;
  retryConnection: () => void;
  setReconnectAttempts: (count: number) => void;
  resetConnectionState: () => void;
}

// Create the WebSocket context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Global message listeners array
const messageListeners: ((message: WebSocketMessage) => void)[] = [];

// Store connection failure information in session storage to persist across page refreshes
const getConnectionFailureCount = (): number => {
  const count = sessionStorage.getItem('ws_failure_count');
  return count ? parseInt(count, 10) : 0;
};

const incrementConnectionFailureCount = (): number => {
  const count = getConnectionFailureCount() + 1;
  sessionStorage.setItem('ws_failure_count', count.toString());
  return count;
};

const resetConnectionFailureCount = (): void => {
  sessionStorage.removeItem('ws_failure_count');
};

// Store reconnect attempts in session storage to persist across page refreshes
const getReconnectAttempts = (): number => {
  const attempts = sessionStorage.getItem('ws_reconnect_attempts');
  return attempts ? parseInt(attempts, 10) : 0;
};

const incrementReconnectAttempts = (): number => {
  const attempts = getReconnectAttempts() + 1;
  sessionStorage.setItem('ws_reconnect_attempts', attempts.toString());
  return attempts;
};

const resetReconnectAttempts = (): void => {
  sessionStorage.removeItem('ws_reconnect_attempts');
};

// Reset all WebSocket state
const resetAllWebSocketState = (): void => {
  resetConnectionFailureCount();
  resetReconnectAttempts();
};

// WebSocket Provider component
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttemptsState] = useState(getReconnectAttempts());
  const [hasConnectionFailed, setHasConnectionFailed] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionFailureCountRef = useRef<number>(getConnectionFailureCount());

  // Custom function to update reconnect attempts in both state and session storage
  const setReconnectAttempts = useCallback((count: number) => {
    console.log(`Setting reconnect attempts to ${count}`);
    // Update React state
    setReconnectAttemptsState(count);
    // Update session storage
    if (count === 0) {
      resetReconnectAttempts();
    } else {
      sessionStorage.setItem('ws_reconnect_attempts', count.toString());
    }
  }, []);

  // Function to establish WebSocket connection
  const connect = useCallback(() => {
    // If we already have a socket that's open or connecting, don't create a new one
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected, updating state');
        setIsConnected(true);
        setIsConnecting(false);
        return;
      } else if (socketRef.current.readyState === WebSocket.CONNECTING) {
        console.log('WebSocket already connecting, skipping connection attempt');
        setIsConnecting(true);
        return;
      }
    }

    // Don't connect if already connecting
    if (isConnecting) {
      console.log('Already in connecting state, skipping connection attempt');
      return;
    }

    // Check if user is authenticated
    const token = tokenManager.getToken();
    if (!token) {
      console.log('Cannot connect to WebSocket: No authentication token found');
      return;
    }

    // Check if we've had too many failures and should stop trying automatically
    const failureCount = getConnectionFailureCount();
    connectionFailureCountRef.current = failureCount;

    if (failureCount >= 3) {
      console.log(`WebSocket connection has failed ${failureCount} times, not attempting automatic reconnection`);
      setHasConnectionFailed(true);

      // Only show the toast once per session
      if (failureCount === 3) {
        addToast({
          description: "WebSocket connection unavailable. Some real-time features may not work.",
          color: "danger",
          size: "lg"
        });
      }
      return;
    }

    setIsConnecting(true);
    console.log('Attempting to connect to WebSocket...');

    // Get the API URL from environment or use default
    const API_URL = import.meta.env.VITE_SERVER_URL || 'https://bth-server-ywjx.shuttle.app';

    // Properly format the WebSocket URL
    let wsUrl = '';

    // Force WSS for shuttle.app domains which are always HTTPS
    if (API_URL.includes('shuttle.app')) {
      const apiHostname = API_URL.replace(/^https?:\/\//, '');
      wsUrl = `wss://${apiHostname}/api/protected/ws/connect?token=${encodeURIComponent(token)}`;
      console.log('Using secure WebSocket (wss://) for shuttle.app domain');
    }
    // Handle different URL formats for other domains
    else if (API_URL.startsWith('http://') || API_URL.startsWith('https://')) {
      // Extract the hostname (and port if present)
      const apiHostname = API_URL.replace(/^https?:\/\//, '');
      // Use wss:// if the API URL is https:// or if we're on an https page
      const wsProtocol = API_URL.startsWith('https://') || window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${apiHostname}/api/protected/ws/connect?token=${encodeURIComponent(token)}`;
    } else {
      // If it's just a hostname, use secure WebSocket if we're on a secure page
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${API_URL}/api/protected/ws/connect?token=${encodeURIComponent(token)}`;
    }

    console.log('Connecting to WebSocket at:', wsUrl);

    try {
      // Create WebSocket connection with a timeout
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout');
          socket.close();
          setIsConnecting(false);

          // Increment failure count
          connectionFailureCountRef.current = incrementConnectionFailureCount();

          if (connectionFailureCountRef.current >= 3) {
            setHasConnectionFailed(true);
            addToast({
              description: "WebSocket connection unavailable. Some real-time features may not work.",
              color: "danger",
              size: "lg"
            });
          } else {
            // Show a toast notification
            addToast({
              description: "WebSocket connection timeout. Real-time updates may be unavailable.",
              color: "warning",
              size: "lg"
            });
          }
        }
      }, 10000); // 10 second timeout

      socket.onopen = () => {
        console.log('WebSocket connection opened');
        // Clear the connection timeout
        clearTimeout(connectionTimeout);

        // We don't need to send the token as the first message anymore
        // The server will authenticate using the token in the query parameter

        // Note: We don't set isConnected here because we wait for the authentication_success message
      };

      socket.onclose = (event) => {
        // Clear the connection timeout if it exists
        clearTimeout(connectionTimeout);

        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        setIsConnecting(false);

        // Attempt to reconnect if not closed cleanly and within max attempts
        if (event.code !== 1000) {
          // Log more detailed information about the close event
          if (event.code === 1006) {
            console.warn("WebSocket closed abnormally (code 1006). This often indicates network issues or server unavailability.");
            console.warn("Check if the server supports secure WebSocket connections (wss://)");

            // Increment failure count for abnormal closures
            connectionFailureCountRef.current = incrementConnectionFailureCount();

            if (connectionFailureCountRef.current >= 3) {
              console.log(`WebSocket connection has failed ${connectionFailureCountRef.current} times, stopping automatic reconnection`);
              setHasConnectionFailed(true);

              // Only show the toast once
              if (connectionFailureCountRef.current === 3) {
                addToast({
                  description: "WebSocket connection unavailable. Some real-time features may not work.",
                  color: "danger",
                  size: "lg"
                });
              }

              // Clear any pending reconnect attempts
              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
              }

              return;
            }
          } else if (event.code === 1001) {
            console.log("WebSocket connection going away (browser navigating away from page)");
          } else if (event.code === 1011) {
            console.error("WebSocket server encountered an unexpected condition:", event.reason);
          } else if (event.code === 1015) {
            console.error("WebSocket TLS handshake failure. Check if server supports secure connections.");
          }

          if (reconnectAttempts < 5 && connectionFailureCountRef.current < 3) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff with 30s max
            console.log(`Attempting to reconnect (attempt ${reconnectAttempts + 1} of 5) in ${delay / 1000}s...`);

            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
              // Update reconnect attempts in both state and session storage
              const newAttempts = reconnectAttempts + 1;
              setReconnectAttempts(newAttempts);
              connect();
            }, delay);
          } else if (connectionFailureCountRef.current < 3) {
            console.log('Maximum reconnect attempts reached, giving up');
            addToast({
              description: "Unable to establish WebSocket connection. Real-time updates will be unavailable.",
              color: "danger",
              size: "lg"
            });
          }
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Log more detailed information about the error
        console.error('WebSocket error details:', {
          url: wsUrl,
          readyState: socket.readyState,
          protocol: window.location.protocol,
          host: window.location.host,
          apiUrl: API_URL
        });
        setIsConnecting(false);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', message);

          // Handle authentication response
          if (message.type === 'authentication_success') {
            console.log('WebSocket authentication successful');
            setIsConnected(true);
            setIsConnecting(false);
            setReconnectAttempts(0);
            setHasConnectionFailed(false);

            // Reset all WebSocket state on successful connection
            resetAllWebSocketState();
            connectionFailureCountRef.current = 0;

            // We don't call onOpen here because it's handled by the useEffect in the useWebSocket hook
          } else if (message.type === 'authentication_error') {
            console.error('WebSocket authentication failed:', message.payload.message);
            setIsConnected(false);
            setIsConnecting(false);
            // Don't attempt to reconnect on auth failure
            return;
          }

          // Handle the message based on its type
          handleMessage(message);

          // Notify all registered listeners
          messageListeners.forEach(listener => {
            try {
              listener(message);
            } catch (error) {
              console.error('Error in message listener:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnecting(false);

      // Increment failure count
      connectionFailureCountRef.current = incrementConnectionFailureCount();
    }
  }, [isConnecting, reconnectAttempts, hasConnectionFailed]);

  // Function to manually retry connection after failures
  const retryConnection = useCallback(() => {
    console.log('Manually retrying WebSocket connection');
    // Reset all WebSocket state
    resetAllWebSocketState();
    connectionFailureCountRef.current = 0;
    setHasConnectionFailed(false);
    setReconnectAttempts(0);

    // Attempt to connect
    connect();
  }, [connect]);

  // Function to handle different message types
  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case WebSocketMessageType.NEW_MESSAGE:
        // Handle new private message
        addToast({
          description: `New message from ${message.payload.sender_username}`,
          color: "primary",
          size: "lg"
        });
        break;

      case WebSocketMessageType.NEW_GROUP_MESSAGE:
        // Handle new group chat message
        addToast({
          description: `New message in ${message.payload.group_name}`,
          color: "primary",
          size: "lg"
        });
        break;

      case WebSocketMessageType.NEW_MATCHING_REQUEST:
        // Handle new matching request
        addToast({
          description: `New sponsor request from ${message.payload.requester_username}`,
          color: "primary",
          size: "lg"
        });
        break;

      case WebSocketMessageType.MATCHING_REQUEST_ACCEPTED:
        // Handle accepted matching request
        addToast({
          description: `${message.payload.sponsor_username} accepted your sponsor request!`,
          color: "success",
          size: "lg"
        });
        break;

      case WebSocketMessageType.NEW_MEETING:
        // Handle new meeting notification
        addToast({
          description: `New meeting scheduled: ${message.payload.meeting_title}`,
          color: "primary",
          size: "lg"
        });
        break;

      case WebSocketMessageType.MEETING_STARTED:
        // Handle meeting started notification
        addToast({
          description: `Meeting started: ${message.payload.meeting_title}`,
          color: "warning",
          size: "lg"
        });
        break;

      case WebSocketMessageType.NEW_NOTIFICATION:
        // Handle general notification
        addToast({
          description: message.payload.message,
          color: message.payload.color || "primary",
          size: "lg"
        });
        break;

      case WebSocketMessageType.EDITED_MESSAGE:
        // Handle edited message notification
        // No toast needed, the UI will update
        break;

      case WebSocketMessageType.DELETED_MESSAGE:
        // Handle deleted message notification
        // No toast needed, the UI will update
        break;

      case WebSocketMessageType.SEEN_MESSAGE:
        // Handle seen message notification
        // No toast needed, the UI will update
        break;

      case WebSocketMessageType.AUTHENTICATION_SUCCESS:
        // Authentication success is handled separately
        break;

      case WebSocketMessageType.AUTHENTICATION_ERROR:
        // Authentication error is handled separately
        break;

      default:
        console.log('Unhandled WebSocket message type:', message.type);
    }
  }, []);

  // Function to send a message through the WebSocket
  const sendMessage = useCallback((type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      socketRef.current.send(message);
      return true;
    }
    return false;
  }, []);

  // Function to disconnect the WebSocket
  const disconnect = useCallback((force: boolean = false) => {
    // Update state regardless
    setIsConnected(false);
    setIsConnecting(false);
    setReconnectAttempts(0);

    // Reset reconnect attempts in session storage
    resetReconnectAttempts();

    // Clear any pending reconnect timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Always close the socket when disconnecting during logout
    // or when forced or the page is unloading
    if (force || document.visibilityState === 'hidden' || !document.hasFocus()) {
      if (socketRef.current) {
        console.log('Closing WebSocket connection');
        socketRef.current.close(1000, 'User initiated disconnect');
        socketRef.current = null;
      }
    } else {
      console.log('Disconnect called but keeping socket alive for development');
    }
  }, []);

  // Function to add a message listener
  const addMessageListener = useCallback((listener: (message: WebSocketMessage) => void) => {
    messageListeners.push(listener);

    // Return a function to remove the listener
    return () => {
      const index = messageListeners.indexOf(listener);
      if (index !== -1) {
        messageListeners.splice(index, 1);
      }
    };
  }, []);

  // Connect when token changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token') {
        const token = tokenManager.getToken();
        if (token && !isConnected && !isConnecting && !hasConnectionFailed) {
          connect();
        } else if (!token && (isConnected || isConnecting)) {
          disconnect();
        }
      }
    };

    // Handle page unload events to properly close the connection
    const handleBeforeUnload = () => {
      console.log('Page is unloading, closing WebSocket connection');
      disconnect(true); // Force disconnect when page is unloading
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Initial connection if token exists and we haven't had too many failures
    const token = tokenManager.getToken();
    if (token && !hasConnectionFailed) {
      connect();
    }

    // Cleanup function that runs when the component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // In development with StrictMode, React will mount and unmount components twice
      // We don't want to disconnect during this process as it causes connection issues

      // Only force disconnect if the page is actually unloading
      if (document.visibilityState === 'hidden' || !document.hasFocus()) {
        disconnect(true); // Force disconnect
      } else {
        // Use the regular disconnect which will preserve the socket in development
        disconnect();
      }
    };
  }, [connect, disconnect, isConnected, isConnecting, hasConnectionFailed]);

  // Create the context value
  const contextValue: WebSocketContextType = {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
    reconnectAttempts,
    addMessageListener,
    hasConnectionFailed,
    retryConnection,
    setReconnectAttempts,
    resetConnectionState: () => {
      console.log('Resetting WebSocket connection state');
      resetAllWebSocketState();
      connectionFailureCountRef.current = 0;
      setHasConnectionFailed(false);
      setReconnectAttempts(0);
    },
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook to use the WebSocket context
export function useWebSocket(options: WebSocketOptions = {}) {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  const { onOpen, onClose, onError, onMessage } = options;

  // Register message listener if onMessage is provided
  useEffect(() => {
    if (onMessage) {
      const removeListener = context.addMessageListener(onMessage);
      return removeListener;
    }
  }, [context, onMessage]);

  // Call onOpen when connected
  useEffect(() => {
    if (context.isConnected && onOpen) {
      onOpen();
    }
  }, [context.isConnected, onOpen]);

  return context;
}

/* 
USAGE EXAMPLES:

// Basic usage
const { isConnected } = useWebSocket();

// With custom handlers
const { isConnected, sendMessage } = useWebSocket({
  onOpen: () => console.log('Connected to server'),
  onMessage: (message) => {
    if (message.type === WebSocketMessageType.NEW_MESSAGE) {
      // Update messages in state
      setMessages(prev => [...prev, message.payload]);
    }
  }
});

// Sending a message
sendMessage('join_room', { roomId: 'support-group-123' });

// Different message types to implement:
1. Private messages: 
   - NEW_MESSAGE: When a user receives a new private message
   - MESSAGE_READ: When a message is read by the recipient

2. Group chat messages:
   - NEW_GROUP_MESSAGE: When a new message is posted in a group chat
   - USER_JOINED_GROUP: When a user joins a group
   - USER_LEFT_GROUP: When a user leaves a group

3. Support group events:
   - NEW_SUPPORT_GROUP: When a new support group is created
   - SUPPORT_GROUP_APPROVED: When a support group is approved by admin

4. Matching system:
   - NEW_MATCHING_REQUEST: When someone requests a user as sponsor
   - MATCHING_REQUEST_ACCEPTED: When a matching request is accepted
   - MATCHING_REQUEST_REJECTED: When a matching request is rejected

5. Meetings:
   - NEW_MEETING: When a new meeting is scheduled
   - MEETING_REMINDER: Reminder before a meeting starts
   - MEETING_STARTED: When a meeting starts
   - MEETING_ENDED: When a meeting ends

6. Admin notifications:
   - NEW_REPORT: When a new report is submitted
   - NEW_SPONSOR_APPLICATION: When a new sponsor application is submitted
*/ 