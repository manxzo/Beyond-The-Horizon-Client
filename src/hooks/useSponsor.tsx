import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sponsorService, ApiResponse } from '../services/services';

export function useSponsor() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        sponsorApplicationStatus: ['sponsorApplicationStatus'],
    };

    /**
     * Check the current user's sponsor application status
     */
    const getSponsorApplicationStatus = () => ({
        queryKey: QUERY_KEYS.sponsorApplicationStatus,
        queryFn: async () => {
            const response = await sponsorService.checkSponsorApplicationStatus();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });



    /**
     * Apply to become a sponsor
     */
    const applyForSponsorMutation = useMutation({
        mutationFn: async (applicationInfo: string) => {
            const response = await sponsorService.applyForSponsor(applicationInfo);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.sponsorApplicationStatus
            });
        },
    });

    /**
     * Update an existing sponsor application
     */
    const updateSponsorApplicationMutation = useMutation({
        mutationFn: async (applicationInfo: string) => {
            const response = await sponsorService.updateSponsorApplication(applicationInfo);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.sponsorApplicationStatus
            });
        },
    });

    /**
     * Delete a sponsor application
     */
    const deleteSponsorApplicationMutation = useMutation({
        mutationFn: async () => {
            const response = await sponsorService.deleteSponsorApplication();
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.sponsorApplicationStatus
            });
        },
    });

    return {
        // Queries
        getSponsorApplicationStatus,

        // Mutations
        applyForSponsor: applyForSponsorMutation.mutate,
        isApplyingForSponsor: applyForSponsorMutation.isPending,
        applyForSponsorError: applyForSponsorMutation.error,

        updateSponsorApplication: updateSponsorApplicationMutation.mutate,
        isUpdatingSponsorApplication: updateSponsorApplicationMutation.isPending,
        updateSponsorApplicationError: updateSponsorApplicationMutation.error,

        deleteSponsorApplication: deleteSponsorApplicationMutation.mutate,
        isDeletingSponsorApplication: deleteSponsorApplicationMutation.isPending,
        deleteSponsorApplicationError: deleteSponsorApplicationMutation.error,
    };
} 