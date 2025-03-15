import { useEffect } from 'react';
import { useWebSocketContext } from '../providers/WebSocketProvider';

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
  ERROR = 'error',
  // Add more message types as needed
}

// Define the structure of a WebSocket message
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}

// Helper function to convert string message types to enum values
export const normalizeMessageType = (type: string): WebSocketMessageType => {
  // Check if the type is a valid enum value
  if (Object.values(WebSocketMessageType).includes(type as WebSocketMessageType)) {
    return type as WebSocketMessageType;
  }

  // Default to ERROR for unknown types
  console.warn(`Unknown WebSocket message type: ${type}`);
  return WebSocketMessageType.ERROR;
};

// Define the options for the hook
interface WebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// Hook to use the WebSocket
export function useWebSocket(options: WebSocketOptions = {}) {
  const context = useWebSocketContext();

  const { onOpen, onMessage } = options;

  // Register message listener if onMessage is provided
  useEffect(() => {
    if (onMessage) {
      const unsubscribe = context.subscribeToAll(onMessage);
      return unsubscribe;
    }
  }, [onMessage, context]);

  // Register open handler if onOpen is provided
  useEffect(() => {
    if (onOpen && context.isConnected) {
      onOpen();
    }
  }, [onOpen, context.isConnected]);

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