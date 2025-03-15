import { useMutation } from '@tanstack/react-query';
import { reportService } from '../services/services';

// Define interfaces to match server types
interface CreateReportRequest {
    reported_user_id: string;
    reason: string;
    reported_type: string;
    reported_item_id: string;
}

export function useReport() {
    /**
     * Create a new report
     */
    const createReportMutation = useMutation({
        mutationFn: async (reportData: CreateReportRequest) => {
            return await reportService.createReport(reportData);
        },
    });

    return {
        // Mutations
        createReport: createReportMutation.mutate,
        isCreatingReport: createReportMutation.isPending,
        createReportError: createReportMutation.error,
    };
} 