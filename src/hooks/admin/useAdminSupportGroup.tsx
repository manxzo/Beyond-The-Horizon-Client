import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, ApiResponse } from '../../services/services';

export function useAdminSupportGroup() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        pendingSupportGroups: ['admin', 'pendingSupportGroups'],
    };

    /**
     * Get all pending support groups
     * Route: /api/admin/support-groups/pending
     */
    const getPendingSupportGroups = () => ({
        queryKey: QUERY_KEYS.pendingSupportGroups,
        queryFn: async () => {
            const response = await adminService.getPendingSupportGroups();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 1 * 60 * 1000, // 1 minute
    });



    /**
     * Review a support group
     * Route: /api/admin/support-groups/review
     */
    const reviewSupportGroupMutation = useMutation({
        mutationFn: async ({
            supportGroupId,
            status,
            adminComments,
        }: {
            supportGroupId: string;
            status: string;
            adminComments?: string;
        }) => {
            const response = await adminService.reviewSupportGroup(
                supportGroupId,
                status,
                adminComments
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.pendingSupportGroups
            });
        },
    });

    return {
        // Queries
        getPendingSupportGroups,

        // Mutations
        reviewSupportGroup: reviewSupportGroupMutation.mutate,
        isReviewingSupportGroup: reviewSupportGroupMutation.isPending,
        reviewSupportGroupError: reviewSupportGroupMutation.error,
    };
} 