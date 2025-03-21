//@ts-nocheck
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postService, ApiResponse } from '../services/services';

export function usePost() {
    const queryClient = useQueryClient();

    const QUERY_KEYS = {
        posts: ['posts'],
        post: (id: string) => ['post', id],
        filteredPosts: (page: number, searchTags?: string, sortBy?: string) =>
            ['posts', 'filtered', page, searchTags, sortBy],
    };

    // Define interfaces to match server types
    interface CreatePostRequest {
        content: string;
        tags?: string[];
    }

    interface CommentRequest {
        postId: string;
        content: string;
        parentCommentId?: string;
    }

    /**
     * Get all posts with optional filtering
     */
    const getPosts = (page: number = 1, searchTags?: string, sortBy?: string) => ({
        queryKey: QUERY_KEYS.filteredPosts(page, searchTags, sortBy),
        queryFn: async () => {
            const response = await postService.getPosts(page, searchTags, sortBy);
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    /**
     * Get a single post by ID
     */
    const getPost = (postId: string) => ({
        queryKey: QUERY_KEYS.post(postId),
        queryFn: async () => {
            const response = await postService.getPost(postId);
            return response;
        },
        select: (response: ApiResponse<any>) => response.data,
        enabled: !!postId,
    });

    /**
     * Create a new post
     */
    const createPostMutation = useMutation({
        mutationFn: async (postData: CreatePostRequest) => {
            const response = await postService.createPost(postData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    /**
     * Update an existing post
     */
    const updatePostMutation = useMutation({
        mutationFn: async ({
            postId,
            postData
        }: {
            postId: string;
            postData: { content?: string; tags?: string[] }
        }) => {
            const response = await postService.updatePost(postId, postData);
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalidate specific post and posts list
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.post(variables.postId) });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    /**
     * Delete a post
     */
    const deletePostMutation = useMutation({
        mutationFn: async (postId: string) => {
            const response = await postService.deletePost(postId);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    /**
     * Like a post
     */
    const likePostMutation = useMutation({
        mutationFn: async (postId: string) => {
            const response = await postService.likePost(postId);
            return response.data;
        },
        onSuccess: (_, postId) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.post(postId) });
        },
    });

    /**
     * Comment on a post
     */
    const commentOnPostMutation = useMutation({
        mutationFn: async ({
            postId,
            content,
            parentCommentId
        }: CommentRequest) => {
            const response = await postService.commentOnPost(postId, content, parentCommentId);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.post(variables.postId) });
        },
    });

    /**
     * Update a comment
     */
    const updateCommentMutation = useMutation({
        mutationFn: async ({
            commentId,
            content,
            postId
        }: {
            commentId: string;
            content: string;
            postId: string
        }) => {
            const response = await postService.updateComment(commentId, content);
            return response.data;
        },
        onSuccess: (_, variables) => {
            // Invalidate the post that contains this comment
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.post(variables.postId) });
        },
    });

    /**
     * Delete a comment
     */
    const deleteCommentMutation = useMutation({
        mutationFn: async ({
            commentId,
            postId
        }: {
            commentId: string;
            postId: string
        }) => {
            const response = await postService.deleteComment(commentId);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.post(variables.postId) });
        },
    });

    return {
        // Queries
        getPosts,
        getPost,

        // Mutations
        createPost: createPostMutation.mutate,
        isCreatingPost: createPostMutation.isPending,
        createPostError: createPostMutation.error,

        updatePost: updatePostMutation.mutate,
        isUpdatingPost: updatePostMutation.isPending,
        updatePostError: updatePostMutation.error,

        deletePost: deletePostMutation.mutate,
        isDeletingPost: deletePostMutation.isPending,
        deletePostError: deletePostMutation.error,

        likePost: likePostMutation.mutate,
        isLikingPost: likePostMutation.isPending,
        likePostError: likePostMutation.error,

        commentOnPost: commentOnPostMutation.mutate,
        isCommentingOnPost: commentOnPostMutation.isPending,
        commentOnPostError: commentOnPostMutation.error,

        updateComment: updateCommentMutation.mutate,
        isUpdatingComment: updateCommentMutation.isPending,
        updateCommentError: updateCommentMutation.error,

        deleteComment: deleteCommentMutation.mutate,
        isDeletingComment: deleteCommentMutation.isPending,
        deleteCommentError: deleteCommentMutation.error,
    };
} 