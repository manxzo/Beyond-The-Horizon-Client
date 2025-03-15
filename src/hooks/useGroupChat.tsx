import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupChatService } from '../services/services';

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
            return await groupChatService.getGroupChats();
        },
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    /**
     * Get details for a specific group chat
     */
    const getGroupChatDetails = (chatId: string) => ({
        queryKey: QUERY_KEYS.groupChat(chatId),
        queryFn: async () => {
            return await groupChatService.getGroupChatDetails(chatId);
        },
        enabled: !!chatId,
    });

    /**
     * Create a new group chat
     */
    const createGroupChatMutation = useMutation({
        mutationFn: async () => {
            return await groupChatService.createGroupChat();
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
            return await groupChatService.sendGroupChatMessage(chatId, content);
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
            return await groupChatService.editGroupChatMessage(chatId, messageId, content);
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
            return await groupChatService.deleteGroupChatMessage(chatId, messageId);
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
            return await groupChatService.addGroupChatMember(chatId, memberId);
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
            return await groupChatService.removeGroupChatMember(chatId, memberId);
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