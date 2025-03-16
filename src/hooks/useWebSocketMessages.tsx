import { useCallback, useRef } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';
import { WebSocketMessage, WebSocketMessageType, normalizeMessageType } from './useWebSocket';

// Type for message handlers
type MessageHandler = (message: WebSocketMessage) => void;

/**
 * Hook for handling WebSocket messages with a pub/sub pattern
 */
export function useWebSocketMessages() {
    // Use the connection hook
    const {
        isConnected,
        isConnecting,
        hasConnectionFailed,
        reconnectAttempts,
        connect,
        disconnect,
        resetConnection,
        sendMessage: sendRawMessage,
        setReconnectAttempts
    } = useWebSocketConnection({
        onMessage: (data) => {
            // Normalize the message type
            const message: WebSocketMessage = {
                type: normalizeMessageType(data.type),
                payload: data.payload
            };

            // Process the message
            processMessage(message);
        }
    });

    // Store message handlers by type
    const messageHandlersRef = useRef<Map<WebSocketMessageType, Set<MessageHandler>>>(
        new Map()
    );

    // Store global message handlers
    const globalHandlersRef = useRef<Set<MessageHandler>>(new Set());

    // Process an incoming message
    const processMessage = useCallback((message: WebSocketMessage) => {
        // Call handlers for this specific message type
        const typeHandlers = messageHandlersRef.current.get(message.type);
        if (typeHandlers) {
            typeHandlers.forEach(handler => {
                try {
                    handler(message);
                } catch (error) {
                    console.error(`Error in message handler for type ${message.type}:`, error);
                }
            });
        }

        // Call global handlers
        globalHandlersRef.current.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Error in global message handler:', error);
            }
        });
    }, []);

    // Subscribe to a specific message type
    const subscribe = useCallback((type: WebSocketMessageType, handler: MessageHandler) => {
        // Get or create the set of handlers for this type
        if (!messageHandlersRef.current.has(type)) {
            messageHandlersRef.current.set(type, new Set());
        }

        const handlers = messageHandlersRef.current.get(type)!;
        handlers.add(handler);

        // Return an unsubscribe function
        return () => {
            handlers.delete(handler);

            // Clean up empty sets
            if (handlers.size === 0) {
                messageHandlersRef.current.delete(type);
            }
        };
    }, []);

    // Subscribe to all messages
    const subscribeToAll = useCallback((handler: MessageHandler) => {
        globalHandlersRef.current.add(handler);

        // Return an unsubscribe function
        return () => {
            globalHandlersRef.current.delete(handler);
        };
    }, []);

    // Send a typed message
    const sendMessage = useCallback((type: WebSocketMessageType, payload: any) => {
        return sendRawMessage({
            type,
            payload
        });
    }, [sendRawMessage]);

    return {
        isConnected,
        isConnecting,
        hasConnectionFailed,
        reconnectAttempts,
        connect,
        disconnect,
        resetConnection,
        sendMessage,
        subscribe,
        subscribeToAll,
        setReconnectAttempts
    };
} 