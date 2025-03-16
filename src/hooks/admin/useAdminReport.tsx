import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, ApiResponse } from '../../services/services';

export function useAdminReport() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        unresolvedReports: ['admin', 'unresolvedReports'],
    };

    /**
     * Get all unresolved reports
     * Route: /api/admin/reports/unresolved
     */
    const getUnresolvedReports = () => ({
        queryKey: QUERY_KEYS.unresolvedReports,
        queryFn: async () => {
            const response = await adminService.getUnresolvedReports();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 1 * 60 * 1000, // 1 minute
    });


    /**
     * Handle a report
     * Route: /api/admin/reports/handle
     */
    const handleReportMutation = useMutation({
        mutationFn: async ({
            reportId,
            actionTaken,
            resolved,
        }: {
            reportId: string;
            actionTaken: string;
            resolved: boolean;
        }) => {
            const response = await adminService.handleReport(
                reportId,
                actionTaken,
                resolved
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.unresolvedReports
            });
        },
    });

    return {
        // Queries
        getUnresolvedReports,

        // Mutations
        handleReport: handleReportMutation.mutate,
        isHandlingReport: handleReportMutation.isPending,
        handleReportError: handleReportMutation.error,
    };
} 