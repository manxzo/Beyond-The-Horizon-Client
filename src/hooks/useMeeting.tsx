import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingService, ApiResponse } from '../services/services';

// Define interfaces to match server types
interface GroupMeeting {
    meeting_id: string;
    group_chat_id: string | null;
    support_group_id: string;
    host_id: string;
    title: string;
    description: string | null;
    scheduled_time: string;
    status: 'upcoming' | 'ongoing' | 'ended';
    participant_count?: number;
    is_participant?: boolean;
}

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
            // Get the full response
            const response = await meetingService.getMeetingParticipants(meetingId);
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        enabled: !!meetingId,
    });

    /**
     * Get all meetings for a specific support group
     */
    const getGroupMeetings = (groupId: string) => ({
        queryKey: QUERY_KEYS.groupMeetings(groupId),
        queryFn: async () => {
            const response = await meetingService.getGroupMeetings(groupId);
            return response;
        },
        select: (response: ApiResponse<GroupMeeting[]>) => response.data,
        enabled: !!groupId,
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
            const response = await meetingService.createMeeting(groupId, meetingData);
            return response.data;
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
            const response = await meetingService.joinMeeting(meetingId);
            return response.data;
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
            const response = await meetingService.leaveMeeting(meetingId);
            return response.data;
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
            const response = await meetingService.startMeeting(meetingId);
            return response.data;
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
            const response = await meetingService.endMeeting(meetingId);
            return response.data;
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
        getGroupMeetings,

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