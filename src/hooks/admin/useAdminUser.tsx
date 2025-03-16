import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, ApiResponse } from '../../services/services';

export function useAdminUser() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        bannedUsers: ['admin', 'bannedUsers'],
    };

    /**
     * Get all banned users
     * Route: /api/admin/users/banned
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


    /**
     * Ban a user
     * Route: /api/admin/users/ban
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
     * Route: /api/admin/users/unban
     */
    const unbanUserMutation = useMutation({
        mutationFn: async (userId: string) => {
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