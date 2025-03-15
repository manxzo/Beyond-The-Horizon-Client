import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, ApiResponse } from '../services/services';
import { useWebSocketContext } from '../providers/WebSocketProvider';
import { WebSocketMessage, WebSocketMessageType } from './useWebSocket';
import { useEffect } from 'react';

export function useMessage() {
    const queryClient = useQueryClient();
    const { sendMessage: sendWsMessage, subscribeToAll } = useWebSocketContext();

    const QUERY_KEYS = {
        conversations: ['conversations'],
        messages: (username: string) => ['messages', username],
    };

    // Define interfaces for request payloads
    interface SendMessageRequest {
        receiverUsername: string;
        content: string;
    }

    interface ReportMessageRequest {
        messageId: string;
        reason: string;
    }

    // Listen for WebSocket messages and update the cache directly
    useEffect(() => {
        const handleWebSocketMessage = (message: WebSocketMessage) => {
            switch (message.type) {
                case WebSocketMessageType.NEW_MESSAGE:
                    // Update the messages cache for the relevant conversation
                    if (message.payload.sender_username && message.payload.receiver_username) {
                        const currentUsername = message.payload.sender_username;
                        const otherUsername = message.payload.receiver_username;

                        // Determine which conversation this belongs to
                        const conversationUsername = currentUsername;

                        // Update the messages cache
                        queryClient.setQueryData(
                            QUERY_KEYS.messages(conversationUsername),
                            (oldData: any) => {
                                if (!oldData) return oldData;

                                // Add the new message to the list
                                return [...oldData, message.payload];
                            }
                        );

                        // Also update the conversations list
                        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
                    }
                    break;

                case WebSocketMessageType.EDITED_MESSAGE:
                    // Update the edited message in the cache
                    if (message.payload.message_id && message.payload.conversation) {
                        const conversationUsername = message.payload.conversation;

                        queryClient.setQueryData(
                            QUERY_KEYS.messages(conversationUsername),
                            (oldData: any) => {
                                if (!oldData) return oldData;

                                // Replace the edited message
                                return oldData.map((msg: any) =>
                                    msg.message_id === message.payload.message_id
                                        ? { ...msg, content: message.payload.content, edited: true }
                                        : msg
                                );
                            }
                        );
                    }
                    break;

                case WebSocketMessageType.DELETED_MESSAGE:
                    // Update the deleted message in the cache
                    if (message.payload.message_id && message.payload.conversation) {
                        const conversationUsername = message.payload.conversation;

                        queryClient.setQueryData(
                            QUERY_KEYS.messages(conversationUsername),
                            (oldData: any) => {
                                if (!oldData) return oldData;

                                // Mark the message as deleted
                                return oldData.map((msg: any) =>
                                    msg.message_id === message.payload.message_id
                                        ? { ...msg, deleted: true }
                                        : msg
                                );
                            }
                        );
                    }
                    break;

                case WebSocketMessageType.SEEN_MESSAGE:
                    // Update the seen status of messages
                    if (message.payload.message_ids && message.payload.conversation) {
                        const conversationUsername = message.payload.conversation;

                        queryClient.setQueryData(
                            QUERY_KEYS.messages(conversationUsername),
                            (oldData: any) => {
                                if (!oldData) return oldData;

                                // Mark the messages as seen
                                return oldData.map((msg: any) =>
                                    message.payload.message_ids.includes(msg.message_id)
                                        ? { ...msg, seen_at: new Date().toISOString() }
                                        : msg
                                );
                            }
                        );
                    }
                    break;

                default:
                    // For other message types, we'll just invalidate the queries
                    if (message.payload.conversation) {
                        queryClient.invalidateQueries({
                            queryKey: QUERY_KEYS.messages(message.payload.conversation)
                        });
                    }
                    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
                    break;
            }
        };

        // Register the message listener
        const unsubscribe = subscribeToAll(handleWebSocketMessage);

        // Clean up the listener when the hook unmounts
        return unsubscribe;
    }, [queryClient]);

    // Send a message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ receiverUsername, content }: { receiverUsername: string; content: string }) => {
            const response = await messageService.sendMessage(receiverUsername, content);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Add the new message to the cache immediately
            queryClient.setQueryData(
                QUERY_KEYS.messages(variables.receiverUsername),
                (oldData: any) => {
                    if (!oldData) return [data];
                    return [...oldData, data];
                }
            );

            // Also invalidate the conversations list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });

            // Send a WebSocket message to notify the recipient
            sendWsMessage(WebSocketMessageType.NEW_MESSAGE, {
                receiver_username: variables.receiverUsername,
                content: variables.content,
                message_id: data.message_id,
                timestamp: new Date().toISOString(),
                conversation: variables.receiverUsername
            });
        },
    });

    // Mark a message as seen mutation
    const markMessageSeenMutation = useMutation({
        mutationFn: async ({ messageId, username }: { messageId: string; username: string }) => {
            const response = await messageService.markMessageSeen(messageId);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Update the messages cache directly
            queryClient.setQueryData(
                QUERY_KEYS.messages(variables.username),
                (oldData: any) => {
                    if (!oldData) return oldData;

                    // Mark the message as seen
                    return oldData.map((msg: any) =>
                        msg.message_id === variables.messageId
                            ? { ...msg, seen_at: new Date().toISOString() }
                            : msg
                    );
                }
            );

            // Also invalidate the conversations list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });

            // Send a WebSocket message to notify the sender
            sendWsMessage(WebSocketMessageType.SEEN_MESSAGE, {
                message_ids: [variables.messageId],
                conversation: variables.username
            });
        },
    });

    // Edit a message mutation
    const editMessageMutation = useMutation({
        mutationFn: async ({ messageId, content, username }: { messageId: string; content: string; username: string }) => {
            const response = await messageService.editMessage(messageId, content);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Update the messages cache directly
            queryClient.setQueryData(
                QUERY_KEYS.messages(variables.username),
                (oldData: any) => {
                    if (!oldData) return oldData;

                    // Replace the edited message
                    return oldData.map((msg: any) =>
                        msg.message_id === variables.messageId
                            ? { ...msg, content: variables.content, edited: true }
                            : msg
                    );
                }
            );

            // Also invalidate the conversations list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });

            // Send a WebSocket message to notify the recipient
            sendWsMessage(WebSocketMessageType.EDITED_MESSAGE, {
                message_id: variables.messageId,
                content: variables.content,
                conversation: variables.username
            });
        },
    });

    // Delete a message mutation
    const deleteMessageMutation = useMutation({
        mutationFn: async ({ messageId, username }: { messageId: string; username: string }) => {
            const response = await messageService.deleteMessage(messageId);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Update the messages cache directly
            queryClient.setQueryData(
                QUERY_KEYS.messages(variables.username),
                (oldData: any) => {
                    if (!oldData) return oldData;

                    // Mark the message as deleted
                    return oldData.map((msg: any) =>
                        msg.message_id === variables.messageId
                            ? { ...msg, deleted: true }
                            : msg
                    );
                }
            );

            // Also invalidate the conversations list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });

            // Send a WebSocket message to notify the recipient
            sendWsMessage(WebSocketMessageType.DELETED_MESSAGE, {
                message_id: variables.messageId,
                conversation: variables.username
            });
        },
    });

    // Report a message mutation
    const reportMessageMutation = useMutation({
        mutationFn: async ({ messageId, reason }: { messageId: string; reason: string }) => {
            const response = await messageService.reportMessage(messageId, reason);
            return response.data;
        },
    });

    // Get conversations query
    const getConversations = () => ({
        queryKey: QUERY_KEYS.conversations,
        queryFn: async () => {
            const response = await messageService.getConversations();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
    });

    // Get messages for a conversation query
    const getMessages = (username: string) => ({
        queryKey: QUERY_KEYS.messages(username),
        queryFn: async () => {
            const response = await messageService.getMessages(username);
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        enabled: !!username,
    });

    return {
        // Queries
        getConversations,
        getMessages,

        // Mutations
        sendMessage: sendMessageMutation.mutate,
        isSendingMessage: sendMessageMutation.isPending,
        sendMessageError: sendMessageMutation.error,

        markMessageSeen: markMessageSeenMutation.mutate,
        isMarkingMessageSeen: markMessageSeenMutation.isPending,
        markMessageSeenError: markMessageSeenMutation.error,

        editMessage: editMessageMutation.mutate,
        isEditingMessage: editMessageMutation.isPending,
        editMessageError: editMessageMutation.error,

        deleteMessage: deleteMessageMutation.mutate,
        isDeletingMessage: deleteMessageMutation.isPending,
        deleteMessageError: deleteMessageMutation.error,

        reportMessage: reportMessageMutation.mutate,
        isReportingMessage: reportMessageMutation.isPending,
        reportMessageError: reportMessageMutation.error,
    };
} 