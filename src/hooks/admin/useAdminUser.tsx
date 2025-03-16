import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, ApiResponse } from '../../services/services';

export function useAdminUser() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        bannedUsers: ['admin', 'bannedUsers'],
    };

    /**
     * Get all banned users
     */
    const getBannedUsers = () => ({
        queryKey: QUERY_KEYS.bannedUsers,
        queryFn: async () => {
            const response = await adminService.getBannedUsers();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Define interfaces to match server types
    interface BanUserRequest {
        user_id: string;
        reason: string;
        ban_duration_days?: number;
    }

    interface UnbanUserRequest {
        user_id: string;
    }

    /**
     * Ban a user
     */
    const banUserMutation = useMutation({
        mutationFn: async ({
            userId,
            reason,
            banDurationDays,
        }: {
            userId: string;
            reason: string;
            banDurationDays?: number;
        }) => {
            const payload: BanUserRequest = {
                user_id: userId,
                reason,
                ban_duration_days: banDurationDays
            };
            const response = await adminService.banUser(
                userId,
                reason,
                banDurationDays
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.bannedUsers
            });
        },
    });

    /**
     * Unban a user
     */
    const unbanUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const payload: UnbanUserRequest = { user_id: userId };
            const response = await adminService.unbanUser(userId);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.bannedUsers
            });
        },
    });

    return {
        // Queries
        getBannedUsers,

        // Mutations
        banUser: banUserMutation.mutate,
        isBanningUser: banUserMutation.isPending,
        banUserError: banUserMutation.error,

        unbanUser: unbanUserMutation.mutate,
        isUnbanningUser: unbanUserMutation.isPending,
        unbanUserError: unbanUserMutation.error,
    };
} 