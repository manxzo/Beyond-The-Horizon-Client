import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportGroupService, ApiResponse } from '../services/services';

// Define interfaces to match server types
export interface SupportGroupSummary {
    support_group_id: string;
    title: string;
    description: string;
    created_at: string;
    member_count: number;
    is_member?: boolean;
    status?: string;
}

export interface UserSupportGroup {
    support_group_id: string;
    title: string;
    description: string;
    joined_at: string;
}

export interface SupportGroupDetails {
    group: {
        support_group_id: string;
        title: string;
        description: string;
        admin_id: string | null;
        group_chat_id: string | null;
        status: string;
        created_at: string;
    };
    members: any[];
    sponsors: any[];
    main_group_chat: any | null;
    meetings: any[];
    meeting_group_chats: any[];
    is_member?: boolean;
    is_admin?: boolean;
    member_count?: number;
}

export interface SuggestSupportGroupRequest {
    title: string;
    description: string;
}

export function useSupportGroup() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        supportGroups: ['supportGroups'],
        myGroups: ['myGroups'],
    };

    /**
     * Get all support groups
     * Route: /api/protected/support-groups/list
     */
    const getSupportGroups = () => ({
        queryKey: QUERY_KEYS.supportGroups,
        queryFn: async () => {
            const response = await supportGroupService.getSupportGroups();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Get support groups the current user is a member of
     * Route: /api/protected/support-groups/my
     */
    const getMyGroups = () => ({
        queryKey: QUERY_KEYS.myGroups,
        queryFn: async () => {
            const response = await supportGroupService.getMyGroups();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Suggest a new support group
     * Route: /api/protected/support-groups/suggest
     */
    const suggestSupportGroupMutation = useMutation({
        mutationFn: async (groupData: SuggestSupportGroupRequest) => {
            const response = await supportGroupService.suggestSupportGroup(groupData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supportGroups });
        },
    });

    /**
     * Join a support group
     * Route: /api/protected/support-groups/join
     */
    const joinSupportGroupMutation = useMutation({
        mutationFn: async (supportGroupId: string) => {
            const response = await supportGroupService.joinSupportGroup(supportGroupId);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supportGroups });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myGroups });
        },
    });

    return {
        // Queries
        getSupportGroups,
        getMyGroups,

        // Mutations
        suggestSupportGroup: suggestSupportGroupMutation.mutate,
        isSuggestingSupportGroup: suggestSupportGroupMutation.isPending,
        suggestSupportGroupError: suggestSupportGroupMutation.error,

        joinSupportGroup: joinSupportGroupMutation.mutate,
        isJoiningSupportGroup: joinSupportGroupMutation.isPending,
        joinSupportGroupError: joinSupportGroupMutation.error,
    };
} 