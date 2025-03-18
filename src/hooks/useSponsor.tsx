import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sponsorService} from '../services/services';

export function useSponsor() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        sponsorApplicationStatus: ['sponsorApplicationStatus'],
    };

    /**
     * Check the current user's sponsor application status
     * Route: /api/protected/sponsor/check
     */
    const getSponsorApplicationStatus = () => ({
        queryKey: QUERY_KEYS.sponsorApplicationStatus,
        queryFn: async () => {
            try {
                const response = await sponsorService.checkSponsorApplicationStatus();
                return response;
            } catch (error: any) {
                if (error.response?.status === 404) {
                    return { success: true, data: null, message: "No application found" };
                }
                throw error;
            }
        },
        select: (response:any) => response.data,
        staleTime: 10 * 60 * 1000, // 10 minutes
        cacheTime: 15 * 60 * 1000, // 15 minutes
    });

    /**
     * Apply to become a sponsor
     * Route: /api/protected/sponsor/apply
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
     * Route: /api/protected/sponsor/update
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
     * Route: /api/protected/sponsor/delete
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