import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { tokenManager, wsService } from '../services/services';
import { addToast } from "@heroui/react";

// Define the shape of our WebSocket context
interface WebSocketContextType {
    isConnected: boolean;
    sendMessage: (type: string, payload: any) => void;
    addMessageListener: (type: string, callback: (payload: any) => void) => () => void;
    lastError: string | null;
}

// Create the context with a default value
const WebSocketContext = createContext<WebSocketContextType>({
    isConnected: false,
    sendMessage: () => { },
    addMessageListener: () => () => { },
    lastError: null,
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
                    const data = JSON.parse(event.data);
                    const { type, payload } = data;

                    console.log(`Received WebSocket message of type: ${type}`);

                    // Handle authentication messages
                    if (type === 'authentication_success') {
                        console.log('WebSocket authentication successful');
                    } else if (type === 'error' && payload?.message?.includes('Not authenticated')) {
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
                    if (type === 'notification') {
                        addToast({
                            title: payload.title || 'New Notification',
                            description: payload.message || 'You have a new notification',
                            color: payload.color || "primary",
                            size: "lg"
                        });
                    } else if (type === 'new_message') {
                        addToast({
                            title: 'New Message',
                            description: `New message from ${payload.sender_username || 'someone'}`,
                            color: "primary",
                            size: "lg"
                        });
                    } else if (type === 'sponsor_application_update') {
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
    const sendMessage = useCallback((type: string, payload: any) => {
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
    const addMessageListener = useCallback((type: string, callback: (payload: any) => void) => {
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
    };

    return (
        <WebSocketContext.Provider value={contextValue}>
            {children}
        </WebSocketContext.Provider>
    );
}; 