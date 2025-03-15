import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/services';

export function useAdminResource() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        pendingResources: ['admin', 'pendingResources'],
    };

    /**
     * Get all pending resources
     */
    const getPendingResources = () => ({
        queryKey: QUERY_KEYS.pendingResources,
        queryFn: async () => {
            return await adminService.getPendingResources();
        },
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
            const payload: ReviewResourceRequest = {
                resource_id: resourceId,
                approved,
                admin_comments: adminComments
            };
            return await adminService.reviewResource(
                resourceId,
                approved,
                adminComments
            );
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