import { useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingService } from '../services/services';
import { MatchingStatus } from '../interfaces/enums';

export function useSponsorDashboard() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        menteeRequests: ['sponsor', 'menteeRequests'],
        myMentees: ['sponsor', 'myMentees'],
    };

    /**
     * Get all mentee requests for the current sponsor
     * Uses the matching status endpoint but filters for pending requests
     * Route: /api/protected/matching/status
     */
    const getMenteeRequests = () => ({
        queryKey: QUERY_KEYS.menteeRequests,
        queryFn: async () => {
            const response = await matchingService.getMatchingStatus();
            return response;
        },
        select: (response: any) => {
            // Filter for pending requests where the current user is the sponsor
            return response.data.filter((request: any) => request.status === MatchingStatus.Pending);
        },
        staleTime: 1 * 60 * 1000, // 1 minute
    });

    /**
     * Get all approved mentees for the current sponsor
     * Uses the matching status endpoint but filters for approved requests
     * Route: /api/protected/matching/status
     */
    const getMyMentees = () => ({
        queryKey: QUERY_KEYS.myMentees,
        queryFn: async () => {
            const response = await matchingService.getMatchingStatus();
            return response;
        },
        select: (response: any) => {
            // Filter for approved requests where the current user is the sponsor
            return response.data.filter((request: any) => request.status === MatchingStatus.Accepted);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Respond to a mentee request (accept or decline)
     * Route: /api/protected/matching/respond
     */
    const respondToMenteeRequestMutation = useMutation({
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
            // Invalidate both queries to refresh the data
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menteeRequests });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myMentees });
        },
    });

    return {
        // Queries
        getMenteeRequests,
        getMyMentees,

        // Mutations
        respondToMenteeRequest: respondToMenteeRequestMutation.mutate,
        isRespondingToMenteeRequest: respondToMenteeRequestMutation.isPending,
        respondToMenteeRequestError: respondToMenteeRequestMutation.error,
    };
} 