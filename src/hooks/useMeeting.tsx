import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingService } from '../services/services';

export function useMeeting() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        meetingParticipants: (meetingId: string) => ['meetingParticipants', meetingId],
        groupMeetings: (groupId: string) => ['groupMeetings', groupId],
    };

    /**
     * Get participants for a specific meeting
     */
    const getMeetingParticipants = (meetingId: string) => ({
        queryKey: QUERY_KEYS.meetingParticipants(meetingId),
        queryFn: async () => {
            // Return the response directly, not response.data
            return await meetingService.getMeetingParticipants(meetingId);
        },
        enabled: !!meetingId,
    });

    // Define interfaces to match server types
    interface CreateMeetingRequest {
        title: string;
        description?: string;
        scheduled_time: string;
        support_group_id: string;
    }

    /**
     * Create a new meeting for a support group
     */
    const createMeetingMutation = useMutation({
        mutationFn: async ({ 
            groupId, 
            meetingData 
        }: { 
            groupId: string; 
            meetingData: CreateMeetingRequest
        }) => {
            return await meetingService.createMeeting(groupId, meetingData);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ 
                queryKey: QUERY_KEYS.groupMeetings(variables.groupId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: ['supportGroup', variables.groupId] 
            });
        },
    });

    /**
     * Join a meeting
     */
    const joinMeetingMutation = useMutation({
        mutationFn: async (meetingId: string) => {
            return await meetingService.joinMeeting(meetingId);
        },
        onSuccess: (_, meetingId) => {
            queryClient.invalidateQueries({ 
                queryKey: QUERY_KEYS.meetingParticipants(meetingId) 
            });
        },
    });

    /**
     * Leave a meeting
     */
    const leaveMeetingMutation = useMutation({
        mutationFn: async (meetingId: string) => {
            return await meetingService.leaveMeeting(meetingId);
        },
        onSuccess: (_, meetingId) => {
            queryClient.invalidateQueries({ 
                queryKey: QUERY_KEYS.meetingParticipants(meetingId) 
            });
        },
    });

    /**
     * Start a meeting
     */
    const startMeetingMutation = useMutation({
        mutationFn: async (meetingId: string) => {
            return await meetingService.startMeeting(meetingId);
        },
        onSuccess: (_, meetingId) => {
            // Invalidate meeting participants
            queryClient.invalidateQueries({ 
                queryKey: QUERY_KEYS.meetingParticipants(meetingId) 
            });
        },
    });

    /**
     * End a meeting
     */
    const endMeetingMutation = useMutation({
        mutationFn: async (meetingId: string) => {
            return await meetingService.endMeeting(meetingId);
        },
        onSuccess: (_, meetingId) => {
            queryClient.invalidateQueries({ 
                queryKey: QUERY_KEYS.meetingParticipants(meetingId) 
            });
        },
    });

    return {
        // Queries
        getMeetingParticipants,

        // Mutations
        createMeeting: createMeetingMutation.mutate,
        isCreatingMeeting: createMeetingMutation.isPending,
        createMeetingError: createMeetingMutation.error,

        joinMeeting: joinMeetingMutation.mutate,
        isJoiningMeeting: joinMeetingMutation.isPending,
        joinMeetingError: joinMeetingMutation.error,

        leaveMeeting: leaveMeetingMutation.mutate,
        isLeavingMeeting: leaveMeetingMutation.isPending,
        leaveMeetingError: leaveMeetingMutation.error,

        startMeeting: startMeetingMutation.mutate,
        isStartingMeeting: startMeetingMutation.isPending,
        startMeetingError: startMeetingMutation.error,

        endMeeting: endMeetingMutation.mutate,
        isEndingMeeting: endMeetingMutation.isPending,
        endMeetingError: endMeetingMutation.error,
    };
} 