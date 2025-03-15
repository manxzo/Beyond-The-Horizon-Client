import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, ApiResponse } from '../../services/services';

export function useAdminReport() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        unresolvedReports: ['admin', 'unresolvedReports'],
    };

    /**
     * Get all unresolved reports
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

    // Define interfaces to match server types
    interface HandleReportRequest {
        report_id: string;
        action_taken: string;
        resolved: boolean;
    }

    /**
     * Handle a report
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
            const payload: HandleReportRequest = {
                report_id: reportId,
                action_taken: actionTaken,
                resolved
            };
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