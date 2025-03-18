import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/services';
import { ApplicationStatus } from '../../interfaces/enums';

export function useAdminSponsor() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        pendingSponsorApplications: ['admin', 'pendingSponsorApplications'],
    };

    /**
     * Get all pending sponsor applications
     * Route: /api/protected/admin/sponsor-applications/pending
     */
    const getPendingSponsorApplications = () => ({
        queryKey: QUERY_KEYS.pendingSponsorApplications,
        queryFn: async () => {
            const response = await adminService.getPendingSponsorApplications();
            return response;
        },
        select: (response: any) => response.data,
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    /**
     * Review a sponsor application
     * Route: /api/protected/admin/sponsor-applications/review
     */
    const reviewSponsorApplicationMutation = useMutation({
        mutationFn: async ({
            applicationId,
            status,
            adminComments,
        }: {
            applicationId: string;
            status: ApplicationStatus;
            adminComments?: string;
        }) => {
            const response = await adminService.reviewSponsorApplication({
                applicationId,
                status,
                adminComments,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.pendingSponsorApplications,
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