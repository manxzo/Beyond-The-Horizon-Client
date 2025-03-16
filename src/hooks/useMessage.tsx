import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { messageService } from '../services/services';

export function useMessage() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        conversations: ['conversations'],
        messages: (username: string) => ['messages', username],
    };

    /**
     * Get all conversations for the current user
     * Route: /api/protected/messages/conversations
     */
    const useGetConversations = () => {
        return useQuery({
            queryKey: QUERY_KEYS.conversations,
            queryFn: async () => {
                const response = await messageService.getConversations();
                return response.data;
            },
            staleTime: 1 * 60 * 1000, // 1 minute
        });
    };

    /**
     * Get messages for a specific conversation
     * Route: /api/protected/messages/conversation/{username}
     */
    const useGetMessages = (username: string) => {
        return useQuery({
            queryKey: QUERY_KEYS.messages(username),
            queryFn: async () => {
                const response = await messageService.getMessages(username);
                return response.data;
            },
            staleTime: 30 * 1000, // 30 seconds
            enabled: !!username, // Only run if username is provided
        });
    };

    /**
     * Send a message to a user
     * Route: POST /api/protected/messages/send
     */
    const useSendMessage = () => {
        return useMutation({
            mutationFn: async ({ receiverUsername, content }: { receiverUsername: string, content: string }) => {
                const response = await messageService.sendMessage(receiverUsername, content);
                return response.data;
            },
            onSuccess: (_, variables) => {
                // Invalidate the messages query for this conversation
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(variables.receiverUsername) });
                // Also invalidate the conversations list
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
            },
        });
    };

    /**
     * Mark a message as seen
     * Route: PUT /api/protected/messages/{message_id}/seen
     */
    const useMarkMessageSeen = () => {
        return useMutation<any, Error, string, { username: string }>({
            mutationFn: async (messageId: string) => {
                const response = await messageService.markMessageSeen(messageId);
                return response.data;
            },
            onSuccess: (_, __, context) => {
                if (context?.username) {
                    // Invalidate the messages query for this conversation
                    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(context.username) });
                    // Also invalidate the conversations list
                    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
                }
            },
        });
    };

    /**
     * Edit a message
     * Route: PUT /api/protected/messages/{message_id}/edit
     */
    const useEditMessage = () => {
        return useMutation<any, Error, { messageId: string, content: string }, { username: string }>({
            mutationFn: async ({ messageId, content }) => {
                const response = await messageService.editMessage(messageId, content);
                return response.data;
            },
            onSuccess: (_, __, context) => {
                if (context?.username) {
                    // Invalidate the messages query for this conversation
                    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(context.username) });
                }
            },
        });
    };

    /**
     * Delete a message
     * Route: DELETE /api/protected/messages/{message_id}
     */
    const useDeleteMessage = () => {
        return useMutation<any, Error, string, { username: string }>({
            mutationFn: async (messageId: string) => {
                const response = await messageService.deleteMessage(messageId);
                return response.data;
            },
            onSuccess: (_, __, context) => {
                if (context?.username) {
                    // Invalidate the messages query for this conversation
                    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(context.username) });
                    // Also invalidate the conversations list
                    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
                }
            },
        });
    };

    /**
     * Report a message
     * Route: POST /api/protected/messages/{message_id}/report
     */
    const useReportMessage = () => {
        return useMutation({
            mutationFn: async ({ messageId, reason }: { messageId: string, reason: string }) => {
                const response = await messageService.reportMessage(messageId, reason);
                return response.data;
            },
        });
    };

    return {
        // Queries
        useGetConversations,
        useGetMessages,

        // Mutations
        useSendMessage,
        useMarkMessageSeen,
        useEditMessage,
        useDeleteMessage,
        useReportMessage,
    };
} 