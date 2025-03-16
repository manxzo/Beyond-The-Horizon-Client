import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupChatService } from '../services/services';

export function useGroupChat() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        groupChats: ['groupChats'],
        groupChat: (chatId: string) => ['groupChat', chatId],
        groupChatMessages: (chatId: string) => ['groupChat', chatId, 'messages'],
        groupChatMembers: (chatId: string) => ['groupChat', chatId, 'members'],
    };

    /**
     * Get all group chats for the current user
     * Route: /api/protected/group-chats/list
     */
    const getGroupChats = () => ({
        queryKey: QUERY_KEYS.groupChats,
        queryFn: async () => {
            const response = await groupChatService.getGroupChats();
            return response;
        },
        select: (response: any) => response.data,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    /**
     * Get details of a specific group chat
     * Route: /api/protected/group-chats/{group_chat_id}
     */
    const getGroupChatDetails = (chatId: string) => ({
        queryKey: QUERY_KEYS.groupChat(chatId),
        queryFn: async () => {
            const response = await groupChatService.getGroupChatDetails(chatId);
            return response;
        },
        select: (response: any) => response.data,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    /**
     * Create a new group chat
     * Route: /api/protected/group-chats/create
     */
    const createGroupChatMutation = useMutation({
        mutationFn: async () => {
            const response = await groupChatService.createGroupChat();
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChats });
        },
    });

    /**
     * Send a message to a group chat
     * Route: /api/protected/group-chats/{group_chat_id}/messages
     */
    const sendGroupChatMessageMutation = useMutation({
        mutationFn: async ({
            chatId,
            content,
        }: {
            chatId: string;
            content: string;
        }) => {
            const response = await groupChatService.sendGroupChatMessage(chatId, content);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChatMessages(variables.chatId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChat(variables.chatId) });
        },
    });

    /**
     * Edit a message in a group chat
     * Route: /api/protected/group-chats/{group_chat_id}/messages/{message_id}
     */
    const editGroupChatMessageMutation = useMutation({
        mutationFn: async ({
            chatId,
            messageId,
            content,
        }: {
            chatId: string;
            messageId: string;
            content: string;
        }) => {
            const response = await groupChatService.editGroupChatMessage(chatId, messageId, content);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChatMessages(variables.chatId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChat(variables.chatId) });
        },
    });

    /**
     * Delete a message from a group chat
     * Route: /api/protected/group-chats/{group_chat_id}/messages/{message_id}
     */
    const deleteGroupChatMessageMutation = useMutation({
        mutationFn: async ({
            chatId,
            messageId,
        }: {
            chatId: string;
            messageId: string;
        }) => {
            const response = await groupChatService.deleteGroupChatMessage(chatId, messageId);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChatMessages(variables.chatId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChat(variables.chatId) });
        },
    });

    /**
     * Add a member to a group chat
     * Route: /api/protected/group-chats/{group_chat_id}/members
     */
    const addGroupChatMemberMutation = useMutation({
        mutationFn: async ({
            chatId,
            memberId,
        }: {
            chatId: string;
            memberId: string;
        }) => {
            const response = await groupChatService.addGroupChatMember(chatId, memberId);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChatMembers(variables.chatId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChat(variables.chatId) });
        },
    });

    /**
     * Remove a member from a group chat
     * Route: /api/protected/group-chats/{group_chat_id}/members/{member_id}
     */
    const removeGroupChatMemberMutation = useMutation({
        mutationFn: async ({
            chatId,
            memberId,
        }: {
            chatId: string;
            memberId: string;
        }) => {
            const response = await groupChatService.removeGroupChatMember(chatId, memberId);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChatMembers(variables.chatId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupChat(variables.chatId) });
        },
    });

    return {
        // Queries
        getGroupChats,
        getGroupChatDetails,

        // Mutations
        createGroupChat: createGroupChatMutation.mutate,
        isCreatingGroupChat: createGroupChatMutation.isPending,
        createGroupChatError: createGroupChatMutation.error,

        sendGroupChatMessage: sendGroupChatMessageMutation.mutate,
        isSendingGroupChatMessage: sendGroupChatMessageMutation.isPending,
        sendGroupChatMessageError: sendGroupChatMessageMutation.error,

        editGroupChatMessage: editGroupChatMessageMutation.mutate,
        isEditingGroupChatMessage: editGroupChatMessageMutation.isPending,
        editGroupChatMessageError: editGroupChatMessageMutation.error,

        deleteGroupChatMessage: deleteGroupChatMessageMutation.mutate,
        isDeletingGroupChatMessage: deleteGroupChatMessageMutation.isPending,
        deleteGroupChatMessageError: deleteGroupChatMessageMutation.error,

        addGroupChatMember: addGroupChatMemberMutation.mutate,
        isAddingGroupChatMember: addGroupChatMemberMutation.isPending,
        addGroupChatMemberError: addGroupChatMemberMutation.error,

        removeGroupChatMember: removeGroupChatMemberMutation.mutate,
        isRemovingGroupChatMember: removeGroupChatMemberMutation.isPending,
        removeGroupChatMemberError: removeGroupChatMemberMutation.error,
    };
} 