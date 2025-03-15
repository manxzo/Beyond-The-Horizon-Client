import { useState, useEffect, useCallback, useRef } from 'react';
import { tokenManager } from '../services/services';

// Define the options for the WebSocket connection
interface WebSocketConnectionOptions {
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    onMessage?: (message: any) => void;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

/**
 * Hook for managing WebSocket connection
 */
export function useWebSocketConnection(options: WebSocketConnectionOptions = {}) {
    // Connection state
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [hasConnectionFailed, setHasConnectionFailed] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    // Refs
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const connectionAttemptTimeoutRef = useRef<number | null>(null);
    const connectionLockRef = useRef<boolean>(false);
    const connectionFailureCountRef = useRef<number>(0);
    const messageQueueRef = useRef<any[]>([]);

    // Constants
    const MAX_RECONNECT_ATTEMPTS = options.maxReconnectAttempts || 5;
    const RECONNECT_INTERVAL = options.reconnectInterval || 5000;
    const CONNECTION_TIMEOUT = 10000; // 10 seconds

    // Get WebSocket URL
    const getWebSocketUrl = useCallback(() => {
        const apiUrl = import.meta.env.VITE_SERVER_URL || 'https://bth-server-ywjx.shuttle.app';
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const baseWsUrl = apiUrl.replace(/^https?:/, wsProtocol);
        return `${baseWsUrl}/ws/connect`;
    }, []);

    // Acquire connection lock
    const acquireLock = useCallback(() => {
        if (connectionLockRef.current) {
            return false;
        }
        connectionLockRef.current = true;
        return true;
    }, []);

    // Release connection lock
    const releaseLock = useCallback(() => {
        connectionLockRef.current = false;
    }, []);

    // Reset connection state
    const resetConnectionState = useCallback(() => {
        setIsConnected(false);
        setIsConnecting(false);
        setHasConnectionFailed(false);
        setReconnectAttempts(0);
        connectionFailureCountRef.current = 0;

        // Clear any pending timeouts
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (connectionAttemptTimeoutRef.current) {
            clearTimeout(connectionAttemptTimeoutRef.current);
            connectionAttemptTimeoutRef.current = null;
        }
    }, []);

    // Process message queue
    const processMessageQueue = useCallback(() => {
        if (!isConnected || !socketRef.current) return;

        while (messageQueueRef.current.length > 0) {
            const message = messageQueueRef.current.shift();
            try {
                socketRef.current.send(JSON.stringify(message));
            } catch (error) {
                console.error('Error sending queued message:', error);
                // Put the message back in the queue
                messageQueueRef.current.unshift(message);
                break;
            }
        }
    }, [isConnected]);

    // Connect to WebSocket
    const connect = useCallback(() => {
        // Don't connect if already connected or connecting
        if (isConnected || isConnecting || !acquireLock()) {
            return;
        }

        setIsConnecting(true);

        try {
            const token = tokenManager.getToken();
            if (!token) {
                console.error('No token available for WebSocket connection');
                setIsConnecting(false);
                releaseLock();
                return;
            }

            const wsUrl = getWebSocketUrl();
            console.log('Connecting to WebSocket:', wsUrl);

            // Create WebSocket with token in protocol
            const socket = new WebSocket(wsUrl, [`token-${token}`]);
            socketRef.current = socket;

            // Set up connection timeout
            connectionAttemptTimeoutRef.current = window.setTimeout(() => {
                if (socketRef.current && socketRef.current.readyState !== WebSocket.OPEN) {
                    console.error('WebSocket connection timeout');
                    socket.close();
                    setIsConnecting(false);
                    setHasConnectionFailed(true);
                    connectionFailureCountRef.current += 1;
                    releaseLock();
                }
            }, CONNECTION_TIMEOUT);

            // Set up event handlers
            socket.onopen = () => {
                console.log('WebSocket connection established');
                setIsConnected(true);
                setIsConnecting(false);
                setHasConnectionFailed(false);
                setReconnectAttempts(0);
                connectionFailureCountRef.current = 0;

                // Clear connection timeout
                if (connectionAttemptTimeoutRef.current) {
                    clearTimeout(connectionAttemptTimeoutRef.current);
                    connectionAttemptTimeoutRef.current = null;
                }

                // Process any queued messages
                processMessageQueue();

                // Call onOpen callback
                if (options.onOpen) {
                    options.onOpen();
                }

                releaseLock();
            };

            socket.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                setIsConnected(false);

                // Clear connection timeout
                if (connectionAttemptTimeoutRef.current) {
                    clearTimeout(connectionAttemptTimeoutRef.current);
                    connectionAttemptTimeoutRef.current = null;
                }

                // Call onClose callback
                if (options.onClose) {
                    options.onClose();
                }

                // Attempt to reconnect if not a clean close
                if (event.code !== 1000) {
                    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                        console.log(`Reconnecting in ${RECONNECT_INTERVAL}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
                        reconnectTimeoutRef.current = window.setTimeout(() => {
                            setReconnectAttempts(prev => prev + 1);
                            setIsConnecting(false);
                            releaseLock();
                            connect();
                        }, RECONNECT_INTERVAL);
                    } else {
                        console.error('Max reconnect attempts reached');
                        setHasConnectionFailed(true);
                        setIsConnecting(false);
                        releaseLock();
                    }
                } else {
                    setIsConnecting(false);
                    releaseLock();
                }
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);

                // Call onError callback
                if (options.onError) {
                    options.onError(error);
                }

                // Don't set connection failed here, let onclose handle it
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket message received:', data);

                    // Call onMessage callback
                    if (options.onMessage) {
                        options.onMessage(data);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error, event.data);
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            setIsConnecting(false);
            setHasConnectionFailed(true);
            connectionFailureCountRef.current += 1;
            releaseLock();
        }
    }, [
        isConnected,
        isConnecting,
        acquireLock,
        releaseLock,
        getWebSocketUrl,
        reconnectAttempts,
        MAX_RECONNECT_ATTEMPTS,
        RECONNECT_INTERVAL,
        processMessageQueue,
        options
    ]);

    // Disconnect from WebSocket
    const disconnect = useCallback((force = false) => {
        if (socketRef.current) {
            try {
                socketRef.current.close(1000, force ? 'Forced disconnect' : 'Normal disconnect');
            } catch (e) {
                console.error('Error closing WebSocket:', e);
            }
            socketRef.current = null;
        }

        // Clear any pending timeouts
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (connectionAttemptTimeoutRef.current) {
            clearTimeout(connectionAttemptTimeoutRef.current);
            connectionAttemptTimeoutRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        releaseLock();
    }, [releaseLock]);

    // Reset connection (disconnect and reset state)
    const resetConnection = useCallback(() => {
        disconnect(true);
        resetConnectionState();
        messageQueueRef.current = [];
    }, [disconnect, resetConnectionState]);

    // Send a message
    const sendMessage = useCallback((message: any): boolean => {
        if (!isConnected || !socketRef.current) {
            // Queue the message for later
            messageQueueRef.current.push(message);
            console.log('WebSocket not connected, message queued');
            return false;
        }

        try {
            socketRef.current.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Error sending WebSocket message:', error);
            // Queue the message for retry
            messageQueueRef.current.push(message);
            return false;
        }
    }, [isConnected]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            disconnect(true);
        };
    }, [disconnect]);

    return {
        isConnected,
        isConnecting,
        hasConnectionFailed,
        reconnectAttempts,
        connect,
        disconnect,
        resetConnection,
        sendMessage,
        setReconnectAttempts
    };
} 