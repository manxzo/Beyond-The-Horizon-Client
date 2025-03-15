import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, ApiResponse } from '../services/services';
import { useWebSocket } from './useWebSocket';

export function useMessage() {
    const queryClient = useQueryClient();
    const { sendMessage: sendWsMessage } = useWebSocket();

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

    // Send a message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ receiverUsername, content }: { receiverUsername: string; content: string }) => {
            const response = await messageService.sendMessage(receiverUsername, content);
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalidate the messages query for this conversation
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.receiverUsername) });
            // Also invalidate the conversations list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });

            // Send a WebSocket message to notify the recipient
            sendWsMessage('new_message', {
                receiver_username: variables.receiverUsername,
                content: variables.content
            });
        },
    });

    // Mark a message as seen mutation
    const markMessageSeenMutation = useMutation({
        mutationFn: async ({ messageId }: { messageId: string; username: string }) => {
            const response = await messageService.markMessageSeen(messageId);
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalidate the messages query for this conversation
            if ('username' in variables) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.username) });
            }
            // Also invalidate the conversations list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
        },
    });

    // Edit a message mutation
    const editMessageMutation = useMutation({
        mutationFn: async ({ messageId, content }: { messageId: string; content: string; username: string }) => {
            const response = await messageService.editMessage(messageId, content);
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalidate the messages query for this conversation
            if ('username' in variables) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.username) });
            }
            // Also invalidate the conversations list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
        },
    });

    // Delete a message mutation
    const deleteMessageMutation = useMutation({
        mutationFn: async ({ messageId }: { messageId: string; username: string }) => {
            const response = await messageService.deleteMessage(messageId);
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalidate the messages query for this conversation
            if ('username' in variables) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.username) });
            }
            // Also invalidate the conversations list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
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