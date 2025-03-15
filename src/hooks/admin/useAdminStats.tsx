import { useQuery } from '@tanstack/react-query';
import { adminService, ApiResponse } from '../../services/services';

export function useAdminStats() {
    const QUERY_KEYS = {
        adminStats: ['admin', 'stats'],
    };

    /**
     * Get admin dashboard statistics
     */
    const getAdminStats = () => ({
        queryKey: QUERY_KEYS.adminStats,
        queryFn: async () => {
            // Get the full response
            const response = await adminService.getAdminStats();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        // Queries
        getAdminStats,
    };
} 