import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, ApiResponse } from '../../services/services';

export function useAdminResource() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        pendingResources: ['admin', 'pendingResources'],
    };

    /**
     * Get all pending resources
     * Route: /api/admin/resources/pending
     */
    const getPendingResources = () => ({
        queryKey: QUERY_KEYS.pendingResources,
        queryFn: async () => {
            const response = await adminService.getPendingResources();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    // Define interfaces to match server types
    interface ReviewResourceRequest {
        resource_id: string;
        approved: boolean;
        admin_comments?: string;
    }

    /**
     * Review a resource
     * Route: /api/admin/resources/review
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
            const response = await adminService.reviewResource(
                resourceId,
                approved,
                adminComments
            );
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