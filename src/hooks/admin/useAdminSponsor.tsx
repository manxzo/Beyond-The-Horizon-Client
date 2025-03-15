import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/services';

export function useAdminSponsor() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        pendingSponsorApplications: ['admin', 'pendingSponsorApplications'],
    };

    /**
     * Get all pending sponsor applications
     */
    const getPendingSponsorApplications = () => ({
        queryKey: QUERY_KEYS.pendingSponsorApplications,
        queryFn: async () => {
            return await adminService.getPendingSponsorApplications();
        },
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
            const payload: ReviewSponsorApplicationRequest = {
                application_id: applicationId,
                status,
                admin_comments: adminComments
            };
            return await adminService.reviewSponsorApplication(
                applicationId,
                status,
                adminComments
            );
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