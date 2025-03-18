import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/services';

export function useAdminUser() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        bannedUsers: ['admin', 'bannedUsers'],
        allUsers: ['admin', 'allUsers'],
    };

    /**
     * Get all banned users
     * Route: /api/protected/admin/users/banned
     */
    const getBannedUsers = () => ({
        queryKey: QUERY_KEYS.bannedUsers,
        queryFn: async () => {
            const response = await adminService.getBannedUsers();
            return response;
        },
        select: (response: any) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Get all users with optional filtering
     * Route: /api/protected/admin/users
     */
    const getAllUsers = (params?: {
        username?: string,
        role?: string,
        limit?: number,
        offset?: number
    }) => ({
        queryKey: [...QUERY_KEYS.allUsers, params],
        queryFn: async () => {
            const response = await adminService.getAllUsers(params);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Ban a user
     * Route: /api/protected/admin/users/ban
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
            const response = await adminService.banUser({
                userId,
                reason,
                banDurationDays
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.bannedUsers
            });
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.allUsers
            });
        },
    });

    /**
     * Unban a user
     * Route: /api/protected/admin/users/unban
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
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.allUsers
            });
        },
    });

    return {
        // Queries
        getBannedUsers,
        getAllUsers,

        // Mutations
        banUser: banUserMutation.mutate,
        isBanningUser: banUserMutation.isPending,
        banUserError: banUserMutation.error,
        unbanUser: unbanUserMutation.mutate,
        isUnbanningUser: unbanUserMutation.isPending,
        unbanUserError: unbanUserMutation.error,
    };
} 