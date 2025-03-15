import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportGroupService } from '../services/services';

export function useSupportGroup() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        supportGroups: ['supportGroups'],
        supportGroup: (id: string) => ['supportGroup', id],
        myGroups: ['myGroups'],
    };

    /**
     * Get all support groups
     */
    const getSupportGroups = () => ({
        queryKey: QUERY_KEYS.supportGroups,
        queryFn: async () => {
            return await supportGroupService.getSupportGroups();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Get details for a specific support group
     */
    const getSupportGroupDetails = (groupId: string) => ({
        queryKey: QUERY_KEYS.supportGroup(groupId),
        queryFn: async () => {
            return await supportGroupService.getSupportGroupDetails(groupId);
        },
        enabled: !!groupId,
    });

    /**
     * Get support groups the current user is a member of
     */
    const getMyGroups = () => ({
        queryKey: QUERY_KEYS.myGroups,
        queryFn: async () => {
            return await supportGroupService.getMyGroups();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Define interfaces to match server types
    interface SuggestSupportGroupRequest {
        title: string;
        description: string;
    }

    /**
     * Suggest a new support group
     */
    const suggestSupportGroupMutation = useMutation({
        mutationFn: async (groupData: SuggestSupportGroupRequest) => {
            return await supportGroupService.suggestSupportGroup(groupData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supportGroups });
        },
    });

    /**
     * Join a support group
     */
    const joinSupportGroupMutation = useMutation({
        mutationFn: async (supportGroupId: string) => {
            return await supportGroupService.joinSupportGroup(supportGroupId);
        },
        onSuccess: (_, supportGroupId) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.supportGroup(supportGroupId)
            });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myGroups });
        },
    });

    /**
     * Leave a support group
     */
    const leaveSupportGroupMutation = useMutation({
        mutationFn: async (groupId: string) => {
            return await supportGroupService.leaveSupportGroup(groupId);
        },
        onSuccess: (_, groupId) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.supportGroup(groupId)
            });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myGroups });
        },
    });

    return {
        // Queries
        getSupportGroups,
        getSupportGroupDetails,
        getMyGroups,

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