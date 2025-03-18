import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { tokenManager, wsService } from '../services/services';
import { addToast } from "@heroui/react";

/**
 * Enum representing user roles in the system.
 * Must match the roles defined on the server.
 */
export enum UserRole {
    USER = "user",
    SPONSOR = "sponsor",
    ADMIN = "admin",
    MODERATOR = "moderator"
}

/**
 * Common message types used in the application
 */
export enum MessageType {
    // Authentication messages
    AUTHENTICATION_SUCCESS = "authentication_success",
    AUTHENTICATION_ERROR = "error",

    // Standard message types
    CHAT_MESSAGE = "chat_message",
    PRIVATE_MESSAGE = "private_message",
    GROUP_MESSAGE = "group_message",
    NOTIFICATION = "notification",
    NEW_MESSAGE = "new_message",
    SPONSOR_NOTIFICATION = "sponsor_notification",
    GLOBAL_ANNOUNCEMENT = "global_announcement",
    USER_STATUS_CHANGE = "user_status_change",
    MEETING_UPDATE = "meeting_update",
    SUPPORT_GROUP_UPDATE = "support_group_update",
    SPONSOR_APPLICATION_UPDATE = "sponsor_application_update"
}

/**
 * Interface for WebSocket message payloads
 */
export interface WebSocketPayload {
    type: string;
    [key: string]: any;
}

/**
 * WebSocketContext provides WebSocket functionality throughout the application.
 * 
 * Usage examples:
 * 
 * // Basic message sending through WebSocket
 * const { sendMessage } = useWebSocket();
 * sendMessage(MessageType.CHAT_MESSAGE, { content: 'Hello world!' });
 * 
 * // Server-side WebSocket broadcasting (uses HTTP endpoints)
 * const { sendToUser, sendToUsers } = useWebSocket();
 * sendToUser('user-123', { type: MessageType.PRIVATE_MESSAGE, content: 'Hello user!' });
 * sendToUsers(['user-123', 'user-456'], { type: MessageType.GROUP_MESSAGE, content: 'Hello group!' });
 * 
 * // More server-side broadcasting options
 * const { sendToRole, sendToAll } = useWebSocket();
 * sendToRole(UserRole.SPONSOR, { type: MessageType.SPONSOR_NOTIFICATION, content: 'New sponsee available!' });
 * sendToAll({ type: MessageType.GLOBAL_ANNOUNCEMENT, content: 'System maintenance in 1 hour' });
 * 
 * // Listening for messages
 * const { addMessageListener } = useWebSocket();
 * useEffect(() => {
 *   const removeListener = addMessageListener(MessageType.CHAT_MESSAGE, (payload) => {
 *     console.log('New chat message:', payload);
 *   });
 *   
 *   // Clean up listener when component unmounts
 *   return removeListener;
 * }, []);
 */

// Define the shape of our WebSocket context
interface WebSocketContextType {
    isConnected: boolean;
    sendMessage: (type: MessageType | string, payload: any) => void;
    addMessageListener: (type: MessageType | string, callback: (payload: any) => void) => () => void;
    lastError: string | null;
    // Add HTTP-based WebSocket broadcast methods
    /**
     * Send a message to a specific user via server HTTP endpoint
     * @param userId - The ID of the user to send the message to
     * @param payload - The payload object containing type and data to send
     * @returns Promise that resolves when the server has processed the request
     */
    sendToUser: (userId: string, payload: WebSocketPayload) => Promise<any>;

    /**
     * Send a message to multiple users via server HTTP endpoint
     * @param userIds - Array of user IDs to send the message to
     * @param payload - The payload object containing type and data to send
     * @returns Promise that resolves when the server has processed the request
     */
    sendToUsers: (userIds: string[], payload: WebSocketPayload) => Promise<any>;

    /**
     * Send a message to all users with a specific role via server HTTP endpoint
     * @param role - The role to target from UserRole enum
     * @param payload - The payload object containing type and data to send
     * @returns Promise that resolves when the server has processed the request
     */
    sendToRole: (role: UserRole, payload: WebSocketPayload) => Promise<any>;

    /**
     * Send a message to all connected users via server HTTP endpoint
     * @param payload - The payload object containing type and data to send
     * @returns Promise that resolves when the server has processed the request
     */
    sendToAll: (payload: WebSocketPayload) => Promise<any>;

    /**
     * Explicitly disconnect the WebSocket connection
     * Used when logging out to ensure clean disconnection
     */
    disconnectWebSocket: () => void;
}

// Create the context with a default value
const WebSocketContext = createContext<WebSocketContextType>({
    isConnected: false,
    sendMessage: () => { },
    addMessageListener: () => () => { },
    lastError: null,
    // Add default implementations for new methods
    sendToUser: () => Promise.resolve(),
    sendToUsers: () => Promise.resolve(),
    sendToRole: () => Promise.resolve(),
    sendToAll: () => Promise.resolve(),
    disconnectWebSocket: () => { },
});

// Custom hook to use the WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

// Define the props for our provider component
interface WebSocketProviderProps {
    children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    // State to track connection status
    const [isConnected, setIsConnected] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    // Refs to store WebSocket instance and listeners
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const messageListenersRef = useRef<Map<string, Set<(payload: any) => void>>>(new Map());
    const currentTokenRef = useRef<string | null>(tokenManager.getToken());
    const intentionalCloseRef = useRef<boolean>(false);

    // Function to create a new WebSocket connection
    const connectWebSocket = useCallback(async () => {
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current !== null) {
            window.clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Get the token for authentication
        const token = tokenManager.getToken();
        if (!token) {
            console.log('No token available, not connecting WebSocket');
            return;
        }

        // Store the current token
        currentTokenRef.current = token;

        // If we already have an open connection, don't create a new one
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected, not creating a new connection');
            return;
        }

        // Close existing connection if any
        if (wsRef.current) {
            intentionalCloseRef.current = true;
            wsRef.current.close();
        }

        try {
            // Get WebSocket URL and protocol from wsService
            const wsUrl = wsService.getWebSocketUrl();

            // Create a new WebSocket connection
            wsRef.current = new WebSocket(wsUrl);
            intentionalCloseRef.current = false;

            // Set up event handlers
            wsRef.current.onopen = () => {
                console.log('WebSocket connection established');
                setIsConnected(true);
                setLastError(null);
            };

            wsRef.current.onclose = (event) => {
                console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
                setIsConnected(false);

                // Only attempt to reconnect if:
                // 1. It wasn't an intentional close
                // 2. The token has changed since we last connected
                if (!intentionalCloseRef.current &&
                    tokenManager.getToken() &&
                    tokenManager.getToken() !== currentTokenRef.current) {

                    console.log('Token has changed, reconnecting WebSocket');
                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        connectWebSocket();
                    }, 1000);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setLastError('WebSocket connection error');
            };

            wsRef.current.onmessage = (event) => {
                try {
                    console.log('WebSocket message received:', event.data);
                    const data = JSON.parse(event.data);
                    const { type, payload } = data;

                    console.log(`Received WebSocket message of type: ${type}`);

                    // Handle authentication messages
                    if (type === MessageType.AUTHENTICATION_SUCCESS) {
                        console.log('WebSocket authentication successful');
                    } else if (type === MessageType.AUTHENTICATION_ERROR && payload?.message?.includes('Not authenticated')) {
                        console.error('WebSocket authentication failed');
                        // Only try to refresh if the token has actually expired
                        if (tokenManager.isTokenExpired() && tokenManager.canAttemptRefresh()) {
                            import('../services/services').then(({ authService }) => {
                                authService.refreshSession().catch(() => {
                                    console.error('Failed to refresh session for WebSocket');
                                });
                            });
                        }
                    }

                    // Show toast notifications for certain message types
                    if (type === MessageType.NOTIFICATION) {
                        addToast({
                            title: payload.title || 'New Notification',
                            description: payload.message || 'You have a new notification',
                            color: payload.color || "primary",
                            size: "lg"
                        });
                    } else if (type === MessageType.NEW_MESSAGE) {
                        addToast({
                            title: 'New Message',
                            description: `New message from ${payload.sender_username || 'someone'}`,
                            color: "primary",
                            size: "lg"
                        });
                    } else if (type === MessageType.SPONSOR_APPLICATION_UPDATE) {
                        addToast({
                            title: 'Sponsor Application Update',
                            description: payload.message || 'Your sponsor application status has been updated',
                            color: "primary",
                            size: "lg"
                        });
                    }

                    // Dispatch the message to all registered listeners for this type
                    if (type && messageListenersRef.current.has(type)) {
                        const listeners = messageListenersRef.current.get(type);
                        if (listeners) {
                            listeners.forEach(callback => {
                                try {
                                    callback(payload);
                                } catch (err) {
                                    console.error(`Error in WebSocket message listener for type ${type}:`, err);
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };
        } catch (err) {
            console.error('Error creating WebSocket connection:', err);
            setLastError('Failed to create WebSocket connection');
        }
    }, []);

    // Function to send a message through the WebSocket
    const sendMessage = useCallback((type: MessageType | string, payload: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type, payload });
            wsRef.current.send(message);
            return true;
        } else {
            console.warn('Cannot send message, WebSocket is not connected');
            setLastError('Cannot send message, WebSocket is not connected');

            // Only try to reconnect if the token has changed
            const currentToken = tokenManager.getToken();
            if (currentToken && currentToken !== currentTokenRef.current && !tokenManager.isTokenExpired()) {
                connectWebSocket();
            }

            return false;
        }
    }, [connectWebSocket]);

    // Function to add a message listener
    const addMessageListener = useCallback((type: MessageType | string, callback: (payload: any) => void) => {
        // Get or create the set of listeners for this message type
        if (!messageListenersRef.current.has(type)) {
            messageListenersRef.current.set(type, new Set());
        }

        const listeners = messageListenersRef.current.get(type);
        if (listeners) {
            listeners.add(callback);
        }

        // Return a function to remove this listener
        return () => {
            const listeners = messageListenersRef.current.get(type);
            if (listeners) {
                listeners.delete(callback);

                // Clean up the map entry if there are no more listeners
                if (listeners.size === 0) {
                    messageListenersRef.current.delete(type);
                }
            }
        };
    }, []);

    // Connect when the component mounts and the user is authenticated
    useEffect(() => {
        // Check if the user is authenticated
        const checkAuthAndConnect = async () => {
            const token = tokenManager.getToken();
            if (token && !tokenManager.isTokenExpired()) {
                connectWebSocket();
            }
        };

        // Initial connection attempt
        checkAuthAndConnect();

        // Set up event listeners for authentication changes
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'auth_token') {
                if (event.newValue && event.newValue !== currentTokenRef.current) {
                    // Token added or changed, try to connect
                    currentTokenRef.current = event.newValue;
                    connectWebSocket();
                } else if (!event.newValue) {
                    // Token removed, disconnect
                    if (wsRef.current) {
                        intentionalCloseRef.current = true;
                        wsRef.current.close(1000, 'User logged out');
                        currentTokenRef.current = null;
                    }
                }
            }
        };

        // Listen for storage events (for multi-tab support)
        window.addEventListener('storage', handleStorageChange);

        // Clean up on unmount
        return () => {
            window.removeEventListener('storage', handleStorageChange);

            if (reconnectTimeoutRef.current !== null) {
                window.clearTimeout(reconnectTimeoutRef.current);
            }

            if (wsRef.current) {
                intentionalCloseRef.current = true;
                wsRef.current.close(1000, 'Component unmounted');
            }
        };
    }, [connectWebSocket]);

    // The context value that will be provided
    const contextValue: WebSocketContextType = {
        isConnected,
        sendMessage,
        addMessageListener,
        lastError,
        // Implement the HTTP-based WebSocket broadcast methods
        sendToUser: async (userId: string, payload: WebSocketPayload) => {
            try {
                return await wsService.sendToUser(userId, payload);
            } catch (error) {
                console.error('Error sending message to user:', error);
                setLastError(`Failed to send message to user: ${error}`);
                throw error;
            }
        },
        sendToUsers: async (userIds: string[], payload: WebSocketPayload) => {
            try {
                return await wsService.sendToUsers(userIds, payload);
            } catch (error) {
                console.error('Error sending message to users:', error);
                setLastError(`Failed to send message to users: ${error}`);
                throw error;
            }
        },
        sendToRole: async (role: UserRole, payload: WebSocketPayload) => {
            try {
                return await wsService.sendToRole(role, payload);
            } catch (error) {
                console.error('Error sending message to role:', error);
                setLastError(`Failed to send message to role: ${error}`);
                throw error;
            }
        },
        sendToAll: async (payload: WebSocketPayload) => {
            try {
                return await wsService.sendToAll(payload);
            } catch (error) {
                console.error('Error sending message to all users:', error);
                setLastError(`Failed to send message to all users: ${error}`);
                throw error;
            }
        },
        disconnectWebSocket: () => {
            if (wsRef.current) {
                intentionalCloseRef.current = true;
                wsRef.current.close();
            }
        },
    };

    return (
        <WebSocketContext.Provider value={contextValue}>
            {children}
        </WebSocketContext.Provider>
    );
}; 