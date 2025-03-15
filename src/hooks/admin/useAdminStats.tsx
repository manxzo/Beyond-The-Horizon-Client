import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/services';

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
            // Return the response directly, not response.data
            return await adminService.getAdminStats();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        // Queries
        getAdminStats,
    };
} 