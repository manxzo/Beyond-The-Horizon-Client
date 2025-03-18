import { adminService } from '../../services/services';

export function useAdminStats() {
    const QUERY_KEYS = {
        adminStats: ['admin', 'stats'],
    };

    /**
     * Get admin dashboard statistics
     * Route: /api/protected/admin/stats
     */
    const getAdminStats = () => ({
        queryKey: QUERY_KEYS.adminStats,
        queryFn: async () => {
            // Get the full response
            const response = await adminService.getAdminStats();
            return response;
        },
        select: (response: any) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        // Queries
        getAdminStats,
    };
} 