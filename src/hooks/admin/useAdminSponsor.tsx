import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, ApiResponse } from '../../services/services';

export function useAdminSponsor() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        pendingSponsorApplications: ['admin', 'pendingSponsorApplications'],
    };

    /**
     * Get all pending sponsor applications
     * Route: /api/admin/sponsor-applications/pending
     */
    const getPendingSponsorApplications = () => ({
        queryKey: QUERY_KEYS.pendingSponsorApplications,
        queryFn: async () => {
            const response = await adminService.getPendingSponsorApplications();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    // Define interfaces to match server types
    interface ReviewSponsorApplicationRequest {
        application_id: string;
        status: string;
        admin_comments?: string;
    }

    /**
     * Review a sponsor application
     * Route: /api/admin/sponsor-applications/review
     */
    const reviewSponsorApplicationMutation = useMutation({
        mutationFn: async ({
            applicationId,
            status,
            adminComments,
        }: {
            applicationId: string;
            status: string;
            adminComments?: string;
        }) => {
            const response = await adminService.reviewSponsorApplication(
                applicationId,
                status,
                adminComments
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.pendingSponsorApplications
            });
        },
    });

    return {
        // Queries
        getPendingSponsorApplications,

        // Mutations
        reviewSponsorApplication: reviewSponsorApplicationMutation.mutate,
        isReviewingSponsorApplication: reviewSponsorApplicationMutation.isPending,
        reviewSponsorApplicationError: reviewSponsorApplicationMutation.error,
    };
} 