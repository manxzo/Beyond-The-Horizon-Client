import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/services';

export function useAdminResource() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        pendingResources: ['admin', 'pendingResources'],
    };

    /**
     * Get all pending resources
     * Route: /api/protected/admin/resources/pending
     */
    const getPendingResources = () => ({
        queryKey: QUERY_KEYS.pendingResources,
        queryFn: async () => {
            const response = await adminService.getPendingResources();
            return response;
        },
        select: (response: any) => response.data,
        staleTime: 1 * 60 * 1000, // 1 minute
    });


    /**
     * Review a resource
     * Route: /api/protected/admin/resources/review
     */
    const reviewResourceMutation = useMutation({
        mutationFn: async ({
            resourceId,
            approved,
            adminComments,
        }: {
            resourceId: string;
            approved: boolean;
            adminComments?: string;
        }) => {
            const response = await adminService.reviewResource({
                resourceId,
                approved,
                adminComments
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.pendingResources
            });
        },
    });

    return {
        // Queries
        getPendingResources,

        // Mutations
        reviewResource: reviewResourceMutation.mutate,
        isReviewingResource: reviewResourceMutation.isPending,
        reviewResourceError: reviewResourceMutation.error,
    };
} 