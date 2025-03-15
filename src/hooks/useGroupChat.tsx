import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupChatService, ApiResponse } from '../services/services';

// Define interfaces to match server types
interface SendGroupChatMessageRequest {
    content: string;
}

interface AddGroupChatMemberRequest {
    member_id: string;
}

export function useGroupChat() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        groupChats: ['groupChats'],
        groupChat: (id: string) => ['groupChat', id],
    };

    /**
     * Get all group chats for the current user
     */
    const getGroupChats = () => ({
        queryKey: QUERY_KEYS.groupChats,
        queryFn: async () => {
            const response = await groupChatService.getGroupChats();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    /**
     * Get details for a specific group chat
     */
    const getGroupChatDetails = (chatId: string) => ({
        queryKey: QUERY_KEYS.groupChat(chatId),
        queryFn: async () => {
            const response = await groupChatService.getGroupChatDetails(chatId);
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        enabled: !!chatId,
    });

    /**
     * Create a new group chat
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
     * Send a message in a group chat
     */
    const sendGroupChatMessageMutation = useMutation({
        mutationFn: async ({
            chatId,
            content
        }: {
            chatId: string;
            content: string
        }) => {
            const response = await groupChatService.sendGroupChatMessage(chatId, content);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.groupChat(variables.chatId)
            });
        },
    });

    /**
     * Edit a message in a group chat
     */
    const editGroupChatMessageMutation = useMutation({
        mutationFn: async ({
            chatId,
            messageId,
            content
        }: {
            chatId: string;
            messageId: string;
            content: string
        }) => {
            const response = await groupChatService.editGroupChatMessage(chatId, messageId, content);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.groupChat(variables.chatId)
            });
        },
    });

    /**
     * Delete a message from a group chat
     */
    const deleteGroupChatMessageMutation = useMutation({
        mutationFn: async ({
            chatId,
            messageId
        }: {
            chatId: string;
            messageId: string
        }) => {
            const response = await groupChatService.deleteGroupChatMessage(chatId, messageId);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.groupChat(variables.chatId)
            });
        },
    });

    /**
     * Add a member to a group chat
     */
    const addGroupChatMemberMutation = useMutation({
        mutationFn: async ({
            chatId,
            memberId
        }: {
            chatId: string;
            memberId: string
        }) => {
            const response = await groupChatService.addGroupChatMember(chatId, memberId);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.groupChat(variables.chatId)
            });
        },
    });

    /**
     * Remove a member from a group chat
     */
    const removeGroupChatMemberMutation = useMutation({
        mutationFn: async ({
            chatId,
            memberId
        }: {
            chatId: string;
            memberId: string
        }) => {
            const response = await groupChatService.removeGroupChatMember(chatId, memberId);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.groupChat(variables.chatId)
            });
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