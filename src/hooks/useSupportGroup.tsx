import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportGroupService} from '../services/services';

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
    members: {
        support_group_id: string;
        user_id: string;
        joined_at: string;
    }[];
    sponsors: {
        user_id: string;
        username: string;
        avatar_url: string;
        role: string;
    }[];
    main_group_chat: {
        group_chat_id: string;
        created_at: string;
        creator_id: string;
    } | null;
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
        supportGroup: (groupId: string) => ['supportGroup', groupId],
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
        select: (response:any) => response.data,
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
        select: (response:any) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Get details of a specific support group
     * Route: /api/protected/support-groups/{group_id}
     */
    const getSupportGroupDetails = (groupId: string) => ({
        queryKey: QUERY_KEYS.supportGroup(groupId),
        queryFn: async () => {
            const response = await supportGroupService.getSupportGroupDetails(groupId);
            return response;
        },
        select: (response:any) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!groupId,
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
        onSuccess: (_, supportGroupId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supportGroups });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myGroups });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supportGroup(supportGroupId) });
        },
    });

    /**
     * Leave a support group
     * Route: /api/protected/support-groups/{group_id}/leave
     */
    const leaveSupportGroupMutation = useMutation({
        mutationFn: async (groupId: string) => {
            const response = await supportGroupService.leaveSupportGroup(groupId);
            return response.data;
        },
        onSuccess: (_, groupId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supportGroups });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myGroups });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supportGroup(groupId) });
        },
    });

    return {
        // Queries
        getSupportGroups,
        getMyGroups,
        getSupportGroupDetails,

        // Mutations
        suggestSupportGroup: suggestSupportGroupMutation.mutate,
        isSuggestingSupportGroup: suggestSupportGroupMutation.isPending,
        suggestSupportGroupError: suggestSupportGroupMutation.error,

        joinSupportGroup: joinSupportGroupMutation.mutate,
        isJoiningSupportGroup: joinSupportGroupMutation.isPending,
        joinSupportGroupError: joinSupportGroupMutation.error,

        leaveSupportGroup: leaveSupportGroupMutation.mutate,
        isLeavingSupportGroup: leaveSupportGroupMutation.isPending,
        leaveSupportGroupError: leaveSupportGroupMutation.error,
    };
} 