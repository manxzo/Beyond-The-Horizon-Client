import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resourceService, ApiResponse } from '../services/services';

export function useResource() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        resources: ['resources'],
        resource: (id: string) => ['resource', id],
    };

    /**
     * Get all resources
     */
    const getResources = () => ({
        queryKey: QUERY_KEYS.resources,
        queryFn: async () => {
            const response = await resourceService.getResources();
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Get a specific resource by ID
     */
    const getResource = (resourceId: string) => ({
        queryKey: QUERY_KEYS.resource(resourceId),
        queryFn: async () => {
            const response = await resourceService.getResource(resourceId);
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        enabled: !!resourceId,
    });

    // Define interfaces to match server types
    interface CreateResourceRequest {
        title: string;
        content: string;
        support_group_id?: string;
    }

    interface UpdateResourceRequest {
        title?: string;
        content?: string;
        support_group_id?: string;
    }

    /**
     * Create a new resource
     */
    const createResourceMutation = useMutation({
        mutationFn: async (resourceData: CreateResourceRequest) => {
            const response = await resourceService.createResource(resourceData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.resources });
        },
    });

    /**
     * Update an existing resource
     */
    const updateResourceMutation = useMutation({
        mutationFn: async ({
            resourceId,
            resourceData
        }: {
            resourceId: string;
            resourceData: {
                title?: string;
                content?: string;
                support_group_id?: string;
            }
        }) => {
            const response = await resourceService.updateResource(resourceId, resourceData);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.resource(variables.resourceId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.resources });
        },
    });

    /**
     * Delete a resource
     */
    const deleteResourceMutation = useMutation({
        mutationFn: async (resourceId: string) => {
            const response = await resourceService.deleteResource(resourceId);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.resources });
        },
    });

    return {
        // Queries
        getResources,
        getResource,

        // Mutations
        createResource: createResourceMutation.mutate,
        isCreatingResource: createResourceMutation.isPending,
        createResourceError: createResourceMutation.error,

        updateResource: updateResourceMutation.mutate,
        isUpdatingResource: updateResourceMutation.isPending,
        updateResourceError: updateResourceMutation.error,

        deleteResource: deleteResourceMutation.mutate,
        isDeletingResource: deleteResourceMutation.isPending,
        deleteResourceError: deleteResourceMutation.error,
    };
} 