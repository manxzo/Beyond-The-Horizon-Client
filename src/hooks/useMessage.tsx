import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, ApiResponse } from '../services/services';
import { useWebSocket, WebSocketMessageType } from './useWebSocket';

export function useMessage() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        conversations: ['conversations'],
        messages: (username: string) => ['messages', username],
    };

    // Define interfaces to match server types
    interface SendMessageRequest {
        receiverUsername: string;
        content: string;
    }

    interface ReportMessageRequest {
        messageId: string;
        reason: string;
    }

    // Get the WebSocket connection
    const { sendMessage: sendWsMessage } = useWebSocket();

    /**
     * Get all conversations for the current user
     */
    const getConversations = () => ({
        queryKey: QUERY_KEYS.conversations,
        queryFn: async () => {
            const response = await messageService.getConversations();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    /**
     * Get messages for a specific conversation
     */
    const getMessages = (username: string) => ({
        queryKey: QUERY_KEYS.messages(username),
        queryFn: async () => {
            const response = await messageService.getMessages(username);
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        enabled: !!username,
        staleTime: 10 * 1000, // 10 seconds
    });

    /**
     * Send a message to another user
     */
    const sendMessage = useMutation({
        mutationFn: async ({ receiverUsername, content }: { receiverUsername: string; content: string }) => {
            const response = await messageService.sendMessage(receiverUsername, content);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate queries to refresh the conversation
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.receiverUsername) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });

            // No need to send WebSocket message here as the server will handle it
        },
    });

    /**
     * Mark a message as seen
     */
    const markMessageSeen = useMutation({
        mutationFn: async ({ messageId, username }: { messageId: string; username: string }) => {
            const response = await messageService.markMessageSeen(messageId);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate queries to refresh the conversation
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.username) });

            // No need to send WebSocket message here as the server will handle it
        },
    });

    /**
     * Edit a message
     */
    const editMessage = useMutation({
        mutationFn: async ({ messageId, content, username }: { messageId: string; content: string; username: string }) => {
            const response = await messageService.editMessage(messageId, content);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate queries to refresh the conversation
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.username) });

            // No need to send WebSocket message here as the server will handle it
        },
    });

    /**
     * Delete a message
     */
    const deleteMessage = useMutation({
        mutationFn: async ({ messageId, username }: { messageId: string; username: string }) => {
            const response = await messageService.deleteMessage(messageId);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate queries to refresh the conversation
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.username) });

            // No need to send WebSocket message here as the server will handle it
        },
    });

    /**
     * Report a message
     */
    const reportMessageMutation = useMutation({
        mutationFn: async ({
            messageId,
            reason
        }: {
            messageId: string;
            reason: string
        }) => {
            const response = await messageService.reportMessage(messageId, reason);
            return response.data;
        },
    });

    return {
        // Queries
        getConversations,
        getMessages,

        // Mutations
        sendMessage: sendMessage.mutate,
        isSendingMessage: sendMessage.isPending,
        sendMessageError: sendMessage.error,

        markMessageSeen: markMessageSeen.mutate,
        isMarkingMessageSeen: markMessageSeen.isPending,

        editMessage: editMessage.mutate,
        isEditingMessage: editMessage.isPending,
        editMessageError: editMessage.error,

        deleteMessage: deleteMessage.mutate,
        isDeletingMessage: deleteMessage.isPending,
        deleteMessageError: deleteMessage.error,

        reportMessage: reportMessageMutation.mutate,
        isReportingMessage: reportMessageMutation.isPending,
        reportMessageError: reportMessageMutation.error,
    };
} 