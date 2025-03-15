import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingService } from '../services/services';

export function useMatching() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        recommendedSponsors: ['recommendedSponsors'],
        matchingStatus: ['matchingStatus'],
    };

    /**
     * Get recommended sponsors for the current user
     */
    const getRecommendedSponsors = () => ({
        queryKey: QUERY_KEYS.recommendedSponsors,
        queryFn: async () => {
            return await matchingService.getRecommendedSponsors();
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    /**
     * Get the current user's matching status
     */
    const getMatchingStatus = () => ({
        queryKey: QUERY_KEYS.matchingStatus,
        queryFn: async () => {
            return await matchingService.getMatchingStatus();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Request a specific sponsor
     */
    const requestSponsorMutation = useMutation({
        mutationFn: async (sponsorId: string) => {
            return await matchingService.requestSponsor(sponsorId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recommendedSponsors });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.matchingStatus });
        },
    });

    /**
     * Respond to a matching request (accept or decline)
     */
    const respondToMatchingRequestMutation = useMutation({
        mutationFn: async ({ 
            matchingRequestId, 
            accept 
        }: { 
            matchingRequestId: string; 
            accept: boolean 
        }) => {
            return await matchingService.respondToMatchingRequest(matchingRequestId, accept);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.matchingStatus });
        },
    });

    return {
        // Queries
        getRecommendedSponsors,
        getMatchingStatus,

        // Mutations
        requestSponsor: requestSponsorMutation.mutate,
        isRequestingSponsor: requestSponsorMutation.isPending,
        requestSponsorError: requestSponsorMutation.error,

        respondToMatchingRequest: respondToMatchingRequestMutation.mutate,
        isRespondingToMatchingRequest: respondToMatchingRequestMutation.isPending,
        respondToMatchingRequestError: respondToMatchingRequestMutation.error,
    };
} 