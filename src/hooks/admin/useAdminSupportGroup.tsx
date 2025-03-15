import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/services';

export function useAdminSupportGroup() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        pendingSupportGroups: ['admin', 'pendingSupportGroups'],
    };

    /**
     * Get all pending support groups
     */
    const getPendingSupportGroups = () => ({
        queryKey: QUERY_KEYS.pendingSupportGroups,
        queryFn: async () => {
            return await adminService.getPendingSupportGroups();
        },
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    // Define interfaces to match server types
    interface ReviewSupportGroupRequest {
        support_group_id: string;
        status: string;
        admin_comments?: string;
    }

    /**
     * Review a support group
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
            const payload: ReviewSupportGroupRequest = {
                support_group_id: supportGroupId,
                status,
                admin_comments: adminComments
            };
            return await adminService.reviewSupportGroup(
                supportGroupId,
                status,
                adminComments
            );
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