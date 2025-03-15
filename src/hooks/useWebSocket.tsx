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
  disconnect: () => void;
  sendMessage: (type: string, payload: any) => boolean;
  reconnectAttempts: number;
  addMessageListener: (listener: (message: WebSocketMessage) => void) => () => void;
}

// Create the WebSocket context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Global message listeners array
const messageListeners: ((message: WebSocketMessage) => void)[] = [];

// WebSocket Provider component
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to establish WebSocket connection
  const connect = useCallback(() => {
    // Don't connect if already connecting or connected
    if (isConnecting || (socketRef.current && socketRef.current.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connecting or connected, skipping connection attempt');
      return;
    }

    // Check if user is authenticated
    const token = tokenManager.getToken();
    if (!token) {
      console.log('Cannot connect to WebSocket: No authentication token found');
      return;
    }

    setIsConnecting(true);
    console.log('Attempting to connect to WebSocket...');

    // Get the API URL from environment or use default
    const API_URL = import.meta.env.VITE_SERVER_URL || 'https://bth-server-ywjx.shuttle.app';

    // Properly format the WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = '';

    // Handle different URL formats
    if (API_URL.startsWith('http://') || API_URL.startsWith('https://')) {
      // Extract the hostname (and port if present)
      const apiHostname = API_URL.replace(/^https?:\/\//, '');
      wsUrl = `${wsProtocol}//${apiHostname}/api/protected/ws/connect?token=${encodeURIComponent(token)}`;
    } else {
      // If it's just a hostname
      wsUrl = `${wsProtocol}//${API_URL}/api/protected/ws/connect?token=${encodeURIComponent(token)}`;
    }

    console.log('Connecting to WebSocket at:', wsUrl);

    try {
      // Create WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connection opened');
        // We don't need to send the token as the first message anymore
        // The server will authenticate using the token in the query parameter

        // Note: We don't set isConnected here because we wait for the authentication_success message
      };

      socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setIsConnected(false);
        setIsConnecting(false);

        // Attempt to reconnect if not closed cleanly and within max attempts
        if (event.code !== 1000 && reconnectAttempts < 5) {
          console.log(`Attempting to reconnect (attempt ${reconnectAttempts + 1} of 5)...`);
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, 5000);
        } else if (reconnectAttempts >= 5) {
          console.log('Maximum reconnect attempts reached, giving up');
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
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
    }
  }, [isConnecting, reconnectAttempts]);

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
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000, 'User initiated disconnect');
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setReconnectAttempts(0);
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
        if (token && !isConnected && !isConnecting) {
          connect();
        } else if (!token && (isConnected || isConnecting)) {
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Initial connection if token exists
    const token = tokenManager.getToken();
    if (token) {
      connect();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      disconnect();
    };
  }, [connect, disconnect, isConnected, isConnecting]);

  // Create the context value
  const contextValue: WebSocketContextType = {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
    reconnectAttempts,
    addMessageListener
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