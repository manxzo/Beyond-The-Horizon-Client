import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";

/**
 * Configuration options for the useWebSocketRefetch hook
 */
export interface WebSocketRefetchOptions {
  /** Whether to show toast notifications for received messages */
  showToasts?: boolean;
  /** Custom toast configuration for specific message types */
  toastConfig?: {
    [messageType: string]: {
      title?: string;
      description?: string | ((payload: any) => string);
      color?: "primary" | "secondary" | "success" | "warning" | "danger";
    };
  };
  /** Whether to automatically refetch data when messages are received */
  autoRefetch?: boolean;
  /** Delay in milliseconds before refetching data (to avoid multiple rapid refetches) */
  refetchDelay?: number;
}

/**
 * Hook to automatically refetch data when relevant WebSocket messages are received
 *
 * @param messageTypes - Array of WebSocket message types to listen for
 * @param queryKeys - Array of React Query keys to invalidate when messages are received
 * @param onMessage - Optional callback to run when a message is received
 * @param options - Configuration options for the hook
 */
export function useWebSocketRefetch(
  messageTypes: string[],
  queryKeys: QueryKey[],
  onMessage?: (type: string, payload: any) => void,
  options?: WebSocketRefetchOptions
) {
  const { addMessageListener, isConnected } = useWebSocket();
  const queryClient = useQueryClient();
  const onMessageRef = useRef(onMessage);
  const refetchTimeoutRef = useRef<number | null>(null);
  const [lastMessage, setLastMessage] = useState<{
    type: string;
    payload: any;
  } | null>(null);

  // Default options
  const defaultOptions: WebSocketRefetchOptions = {
    showToasts: false,
    autoRefetch: true,
    refetchDelay: 300,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Update the ref when the callback changes
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Set up listeners for each message type
  useEffect(() => {
    if (!isConnected) return;

    // Create an array to store cleanup functions
    const cleanupFunctions = messageTypes.map((type) => {
      return addMessageListener(type, (payload) => {
        // Store the last message received
        setLastMessage({ type, payload });

        // Show toast if enabled and configured for this message type
        if (mergedOptions.showToasts) {
          const toastConfig = mergedOptions.toastConfig?.[type];

          if (toastConfig) {
            const description =
              typeof toastConfig.description === "function"
                ? toastConfig.description(payload)
                : toastConfig.description || "New update received";

            addToast({
              title: toastConfig.title || type,
              description,
              color: toastConfig.color || "primary",
              size: "lg",
            });
          }
        }

        // Call the optional callback if provided
        if (onMessageRef.current) {
          onMessageRef.current(type, payload);
        }

        // Invalidate queries with debouncing if auto-refetch is enabled
        if (mergedOptions.autoRefetch) {
          // Clear any existing timeout to prevent multiple rapid refetches
          if (refetchTimeoutRef.current !== null) {
            window.clearTimeout(refetchTimeoutRef.current);
          }

          // Set a new timeout to refetch after the specified delay
          refetchTimeoutRef.current = window.setTimeout(() => {
            queryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });
            refetchTimeoutRef.current = null;
          }, mergedOptions.refetchDelay);
        }
      });
    });

    // Clean up all listeners and timeouts when the component unmounts or dependencies change
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());

      if (refetchTimeoutRef.current !== null) {
        window.clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, [
    addMessageListener,
    isConnected,
    messageTypes,
    queryKeys,
    queryClient,
    mergedOptions.showToasts,
    mergedOptions.toastConfig,
    mergedOptions.autoRefetch,
    mergedOptions.refetchDelay,
  ]);

  // Return the last message received for use in the component
  return { lastMessage, isConnected };
}

/**
 * Hook to listen for specific WebSocket messages without refetching data
 *
 * @param messageType - WebSocket message type to listen for
 * @param callback - Callback to run when a message is received
 * @param showToast - Whether to show a toast notification when a message is received
 */
export function useWebSocketListener(
  messageType: string,
  callback: (payload: any) => void,
  showToast?:
    | boolean
    | {
        title?: string;
        description?: string | ((payload: any) => string);
        color?: "primary" | "secondary" | "success" | "warning" | "danger";
      }
) {
  const { addMessageListener, isConnected } = useWebSocket();
  const callbackRef = useRef(callback);
  const [lastPayload, setLastPayload] = useState<any>(null);

  // Update the ref when the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Set up the listener
  useEffect(() => {
    if (!isConnected) return;

    const cleanup = addMessageListener(messageType, (payload) => {
      // Store the last payload received
      setLastPayload(payload);

      // Show toast if enabled
      if (showToast) {
        const toastConfig = typeof showToast === "object" ? showToast : {};
        const description =
          typeof toastConfig.description === "function"
            ? toastConfig.description(payload)
            : toastConfig.description || "New update received";

        addToast({
          title: toastConfig.title || messageType,
          description,
          color: toastConfig.color || "primary",
          size: "lg",
        });
      }

      // Call the callback
      callbackRef.current(payload);
    });

    return cleanup;
  }, [addMessageListener, isConnected, messageType, showToast]);

  // Return the last payload received and connection status
  return { lastPayload, isConnected };
}
