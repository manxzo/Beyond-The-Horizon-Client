import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingService, ApiResponse } from '../services/services';

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
            const response = await matchingService.getRecommendedSponsors();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    /**
     * Get the current user's matching status
     */
    const getMatchingStatus = () => ({
        queryKey: QUERY_KEYS.matchingStatus,
        queryFn: async () => {
            const response = await matchingService.getMatchingStatus();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Request a specific sponsor
     */
    const requestSponsorMutation = useMutation({
        mutationFn: async (sponsorId: string) => {
            const response = await matchingService.requestSponsor(sponsorId);
            return response.data;
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
            const response = await matchingService.respondToMatchingRequest(matchingRequestId, accept);
            return response.data;
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