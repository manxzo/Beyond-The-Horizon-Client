import axios, { AxiosError } from "axios";
import { addToast } from "@heroui/react";
// Get the API URL from environment variables or use a default
const API_URL = import.meta.env.VITE_SERVER_URL;

// Create an axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, 
    headers: {
        "Content-Type": "application/json",
    },
});

// Response interceptor for handling errors globally
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Handle session expiration or authentication errors
        if (error.response?.status === 401) {
            // You might want to redirect to login or refresh token here
            console.error("Authentication error:", error.response?.data);
        }

        // Add toast notification for API errors
        let errorMessage = "An error occurred with the API request";

        // Try to extract error message from different response formats
        if (error.response?.data) {
            const data = error.response.data;
            if (typeof data === 'string') {
                // Handle string error responses
                errorMessage = data;
            } else if (typeof data === 'object') {
                // Handle object error responses with message property
                if ('message' in data && typeof data.message === 'string') {
                    errorMessage = data.message;
                } else if ('errors' in data && Array.isArray(data.errors) && data.errors.length > 0) {
                    // Handle errors array
                    errorMessage = data.errors.join(', ');
                }
            }
        }

        addToast({
            description: errorMessage,
            color: "danger",
            size: "lg"
        });

        return Promise.reject(error);
    }
);

// Types for API responses
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

// ==================== AUTH SERVICES ====================
export const authService = {
    // POST /api/public/auth/register
    register: async (userData: any): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/public/auth/register", userData);
        return response.data;
    },

    // POST /api/public/auth/login
    login: async (
        username: string,
        password: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/public/auth/login", {
            username,
            password,
        });
        return response.data;
    },

    // POST /api/public/auth/logout
    logout: async (): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/public/auth/logout");
        return response.data;
    },

    // POST /api/public/auth/refresh
    refreshSession: async (): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/public/auth/refresh");
        return response.data;
    },
};

// ==================== USER DATA SERVICES ====================
export const userService = {
    // GET /api/protected/users/info
    getCurrentUser: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/protected/users/info");
        return response.data;
    },

    // GET /api/protected/users/{username}
    getUserByName: async (username: string): Promise<ApiResponse<any>> => {
        const response = await api.get(`/api/protected/users/${username}`);
        return response.data;
    },

    // PATCH /api/protected/users/update-info
    updateProfile: async (userData: any): Promise<ApiResponse<any>> => {
        const response = await api.patch(
            "/api/protected/users/update-info",
            userData
        );
        return response.data;
    },

    // POST /api/protected/users/avatar/upload
    updateAvatar: async (file: File): Promise<ApiResponse<any>> => {
        const formData = new FormData();
        formData.append("avatar", file);

        const response = await api.post(
            "/api/protected/users/avatar/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    },

    // POST /api/protected/users/avatar/reset
    resetAvatar: async (): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/protected/users/avatar/reset");
        return response.data;
    },

    // DELETE /api/protected/users/delete-user
    deleteAccount: async (): Promise<ApiResponse<any>> => {
        const response = await api.delete("/api/protected/users/delete-user");
        return response.data;
    },
};

// ==================== FEED/POSTS SERVICES ====================
export const postService = {
    // GET /api/protected/feed/posts
    getPosts: async (
        page: number = 1,
        searchTags?: string,
        sortBy?: string
    ): Promise<ApiResponse<any>> => {
        let url = `/api/protected/feed/posts?page=${page}`;
        if (searchTags) {
            url += `&search-tags=${searchTags}`;
        }
        if (sortBy) {
            url += `&sort-by=${sortBy}`;
        }
        const response = await api.get(url);
        return response.data;
    },

    // GET /api/protected/feed/posts/{id}
    getPost: async (postId: string): Promise<ApiResponse<any>> => {
        const response = await api.get(`/api/protected/feed/posts/${postId}`);
        return response.data;
    },

    // POST /api/protected/feed/posts/new
    createPost: async (postData: {
        content: string;
        tags?: string[];
    }): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/protected/feed/posts/new", postData);
        return response.data;
    },

    // PATCH /api/protected/feed/posts/{id}
    updatePost: async (
        postId: string,
        postData: { content?: string; tags?: string[] }
    ): Promise<ApiResponse<any>> => {
        const response = await api.patch(
            `/api/protected/feed/posts/${postId}`,
            postData
        );
        return response.data;
    },

    // DELETE /api/protected/feed/posts/{id}
    deletePost: async (postId: string): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/api/protected/feed/posts/${postId}`);
        return response.data;
    },

    // POST /api/protected/feed/posts/like
    likePost: async (postId: string): Promise<ApiResponse<any>> => {
        const response = await api.post(`/api/protected/feed/posts/like`, {
            post_id: postId,
        });
        return response.data;
    },

    // POST /api/protected/feed/comments
    commentOnPost: async (
        postId: string,
        content: string,
        parentCommentId?: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post(`/api/protected/feed/comments`, {
            post_id: postId,
            content,
            parent_comment_id: parentCommentId,
        });
        return response.data;
    },

    // PATCH /api/protected/feed/comments/{id}
    updateComment: async (
        commentId: string,
        content: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.patch(
            `/api/protected/feed/comments/${commentId}`,
            {
                content,
            }
        );
        return response.data;
    },

    // DELETE /api/protected/feed/comments/{id}
    deleteComment: async (commentId: string): Promise<ApiResponse<any>> => {
        const response = await api.delete(
            `/api/protected/feed/comments/${commentId}`
        );
        return response.data;
    },
};

// ==================== PRIVATE MESSAGING SERVICES ====================
export const messageService = {
    // GET /api/protected/messages/conversations
    getConversations: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/protected/messages/conversations");
        return response.data;
    },

    // GET /api/protected/messages/conversation/{username}
    getMessages: async (username: string): Promise<ApiResponse<any>> => {
        const response = await api.get(
            `/api/protected/messages/conversation/${username}`
        );
        return response.data;
    },

    // POST /api/protected/messages/send
    sendMessage: async (
        receiverUsername: string,
        content: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post(`/api/protected/messages/send`, {
            receiver_username: receiverUsername,
            content,
        });
        return response.data;
    },

    // PUT /api/protected/messages/{message_id}/seen
    markMessageSeen: async (messageId: string): Promise<ApiResponse<any>> => {
        const response = await api.put(`/api/protected/messages/${messageId}/seen`);
        return response.data;
    },

    // PUT /api/protected/messages/{message_id}/edit
    editMessage: async (
        messageId: string,
        content: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.put(
            `/api/protected/messages/${messageId}/edit`,
            {
                content,
            }
        );
        return response.data;
    },

    // DELETE /api/protected/messages/{message_id}
    deleteMessage: async (messageId: string): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/api/protected/messages/${messageId}`);
        return response.data;
    },

    // POST /api/protected/messages/{message_id}/report
    reportMessage: async (
        messageId: string,
        reason: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post(
            `/api/protected/messages/${messageId}/report`,
            {
                reason,
            }
        );
        return response.data;
    },
};

// ==================== SPONSOR MATCHING SERVICES ====================
export const matchingService = {
    // GET /api/protected/matching/recommend-sponsors
    getRecommendedSponsors: async (): Promise<ApiResponse<any>> => {
        const response = await api.get(
            "/api/protected/matching/recommend-sponsors"
        );
        return response.data;
    },

    // POST /api/protected/matching/request-sponsor
    requestSponsor: async (sponsorId: string): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/protected/matching/request-sponsor", {
            sponsor_id: sponsorId,
        });
        return response.data;
    },

    // GET /api/protected/matching/status
    getMatchingStatus: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/protected/matching/status");
        return response.data;
    },

    // PATCH /api/protected/matching/respond
    respondToMatchingRequest: async (
        matchingRequestId: string,
        accept: boolean
    ): Promise<ApiResponse<any>> => {
        const response = await api.patch("/api/protected/matching/respond", {
            matching_request_id: matchingRequestId,
            accept,
        });
        return response.data;
    },
};

// ==================== SPONSOR ROLE SERVICES ====================
export const sponsorService = {
    // POST /api/protected/sponsor/apply
    applyForSponsor: async (
        applicationInfo: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/protected/sponsor/apply", {
            application_info: applicationInfo,
        });
        return response.data;
    },

    // GET /api/protected/sponsor/check
    checkSponsorApplicationStatus: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/protected/sponsor/check");
        return response.data;
    },

    // PATCH /api/protected/sponsor/update
    updateSponsorApplication: async (
        applicationInfo: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.patch("/api/protected/sponsor/update", {
            application_info: applicationInfo,
        });
        return response.data;
    },

    // DELETE /api/protected/sponsor/delete
    deleteSponsorApplication: async (): Promise<ApiResponse<any>> => {
        const response = await api.delete("/api/protected/sponsor/delete");
        return response.data;
    },
};

// ==================== SUPPORT GROUP SERVICES ====================
export const supportGroupService = {
    // POST /api/protected/support-groups/suggest
    suggestSupportGroup: async (groupData: {
        title: string;
        description: string;
    }): Promise<ApiResponse<any>> => {
        const response = await api.post(
            "/api/protected/support-groups/suggest",
            groupData
        );
        return response.data;
    },

    // GET /api/protected/support-groups/list
    getSupportGroups: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/protected/support-groups/list");
        return response.data;
    },

    // GET /api/protected/support-groups/{group_id}
    getSupportGroupDetails: async (
        groupId: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.get(`/api/protected/support-groups/${groupId}`);
        return response.data;
    },

    // POST /api/protected/support-groups/join
    joinSupportGroup: async (
        supportGroupId: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/protected/support-groups/join", {
            support_group_id: supportGroupId,
        });
        return response.data;
    },

    // DELETE /api/protected/support-groups/{group_id}/leave
    leaveSupportGroup: async (groupId: string): Promise<ApiResponse<any>> => {
        const response = await api.delete(
            `/api/protected/support-groups/${groupId}/leave`
        );
        return response.data;
    },

    // GET /api/protected/support-groups/my
    getMyGroups: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/protected/support-groups/my");
        return response.data;
    },
};

// ==================== SUPPORT GROUP MEETINGS SERVICES ====================
export const meetingService = {
    // POST /api/protected/support-groups/{group_id}/meetings
    createMeeting: async (
        groupId: string,
        meetingData: {
            title: string;
            description?: string;
            scheduled_time: string;
            support_group_id: string;
        }
    ): Promise<ApiResponse<any>> => {
        const response = await api.post(
            `/api/protected/support-groups/${groupId}/meetings`,
            meetingData
        );
        return response.data;
    },

    // POST /api/protected/meetings/{meeting_id}/join
    joinMeeting: async (meetingId: string): Promise<ApiResponse<any>> => {
        const response = await api.post(
            `/api/protected/meetings/${meetingId}/join`,
            {
                meeting_id: meetingId,
            }
        );
        return response.data;
    },

    // DELETE /api/protected/meetings/{meeting_id}/leave
    leaveMeeting: async (meetingId: string): Promise<ApiResponse<any>> => {
        const response = await api.delete(
            `/api/protected/meetings/${meetingId}/leave`
        );
        return response.data;
    },

    // GET /api/protected/meetings/{meeting_id}/participants
    getMeetingParticipants: async (
        meetingId: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.get(
            `/api/protected/meetings/${meetingId}/participants`
        );
        return response.data;
    },

    // POST /api/protected/meetings/{meeting_id}/start
    startMeeting: async (meetingId: string): Promise<ApiResponse<any>> => {
        const response = await api.post(
            `/api/protected/meetings/${meetingId}/start`
        );
        return response.data;
    },

    // POST /api/protected/meetings/{meeting_id}/end
    endMeeting: async (meetingId: string): Promise<ApiResponse<any>> => {
        const response = await api.post(`/api/protected/meetings/${meetingId}/end`);
        return response.data;
    },
};

// ==================== GROUP CHAT SERVICES ====================
export const groupChatService = {
    // POST /api/protected/group-chats/create
    createGroupChat: async (): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/protected/group-chats/create");
        return response.data;
    },

    // GET /api/protected/group-chats/list
    getGroupChats: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/protected/group-chats/list");
        return response.data;
    },

    // GET /api/protected/group-chats/{group_chat_id}
    getGroupChatDetails: async (chatId: string): Promise<ApiResponse<any>> => {
        const response = await api.get(`/api/protected/group-chats/${chatId}`);
        return response.data;
    },

    // POST /api/protected/group-chats/{group_chat_id}/messages
    sendGroupChatMessage: async (
        chatId: string,
        content: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post(
            `/api/protected/group-chats/${chatId}/messages`,
            {
                content,
            }
        );
        return response.data;
    },

    // PATCH /api/protected/group-chats/{group_chat_id}/messages/{message_id}
    editGroupChatMessage: async (
        chatId: string,
        messageId: string,
        content: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.patch(
            `/api/protected/group-chats/${chatId}/messages/${messageId}`,
            { content }
        );
        return response.data;
    },

    // DELETE /api/protected/group-chats/{group_chat_id}/messages/{message_id}
    deleteGroupChatMessage: async (
        chatId: string,
        messageId: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.delete(
            `/api/protected/group-chats/${chatId}/messages/${messageId}`
        );
        return response.data;
    },

    // POST /api/protected/group-chats/{group_chat_id}/members
    addGroupChatMember: async (
        chatId: string,
        memberId: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post(
            `/api/protected/group-chats/${chatId}/members`,
            {
                member_id: memberId,
            }
        );
        return response.data;
    },

    // DELETE /api/protected/group-chats/{group_chat_id}/members/{member_id}
    removeGroupChatMember: async (
        chatId: string,
        memberId: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.delete(
            `/api/protected/group-chats/${chatId}/members/${memberId}`
        );
        return response.data;
    },
};

// ==================== RESOURCE SERVICES ====================
export const resourceService = {
    // GET /api/protected/resources/list
    getResources: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/protected/resources/list");
        return response.data;
    },

    // GET /api/protected/resources/{id}
    getResource: async (resourceId: string): Promise<ApiResponse<any>> => {
        const response = await api.get(`/api/protected/resources/${resourceId}`);
        return response.data;
    },

    // POST /api/protected/resources/create
    createResource: async (resourceData: {
        title: string;
        content: string;
        support_group_id?: string;
    }): Promise<ApiResponse<any>> => {
        const response = await api.post(
            "/api/protected/resources/create",
            resourceData
        );
        return response.data;
    },

    // PATCH /api/protected/resources/{id}
    updateResource: async (
        resourceId: string,
        resourceData: {
            title?: string;
            content?: string;
            support_group_id?: string;
        }
    ): Promise<ApiResponse<any>> => {
        const response = await api.patch(
            `/api/protected/resources/${resourceId}`,
            resourceData
        );
        return response.data;
    },

    // DELETE /api/protected/resources/{id}
    deleteResource: async (resourceId: string): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/api/protected/resources/${resourceId}`);
        return response.data;
    },
};

// ==================== REPORT SERVICES ====================
export const reportService = {
    // POST /api/protected/reports/new
    createReport: async (reportData: {
        reported_user_id: string;
        reason: string;
        reported_type: string;
        reported_item_id: string;
    }): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/protected/reports/new", reportData);
        return response.data;
    },
};

// ==================== ADMIN SERVICES ====================
export const adminService = {
    // GET /api/admin/sponsor-applications/pending
    getPendingSponsorApplications: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/admin/sponsor-applications/pending");
        return response.data;
    },

    // POST /api/admin/sponsor-applications/review
    reviewSponsorApplication: async (
        applicationId: string,
        status: string,
        adminComments?: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/admin/sponsor-applications/review", {
            application_id: applicationId,
            status,
            admin_comments: adminComments,
        });
        return response.data;
    },

    // GET /api/admin/support-groups/pending
    getPendingSupportGroups: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/admin/support-groups/pending");
        return response.data;
    },

    // POST /api/admin/support-groups/review
    reviewSupportGroup: async (
        supportGroupId: string,
        status: string,
        adminComments?: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/admin/support-groups/review", {
            support_group_id: supportGroupId,
            status,
            admin_comments: adminComments,
        });
        return response.data;
    },

    // GET /api/admin/resources/pending
    getPendingResources: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/admin/resources/pending");
        return response.data;
    },

    // POST /api/admin/resources/review
    reviewResource: async (
        resourceId: string,
        approved: boolean,
        adminComments?: string
    ): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/admin/resources/review", {
            resource_id: resourceId,
            approved,
            admin_comments: adminComments,
        });
        return response.data;
    },

    // GET /api/admin/reports/unresolved
    getUnresolvedReports: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/admin/reports/unresolved");
        return response.data;
    },

    // POST /api/admin/reports/handle
    handleReport: async (
        reportId: string,
        actionTaken: string,
        resolved: boolean
    ): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/admin/reports/handle", {
            report_id: reportId,
            action_taken: actionTaken,
            resolved,
        });
        return response.data;
    },

    // POST /api/admin/users/ban
    banUser: async (
        userId: string,
        reason: string,
        banDurationDays?: number
    ): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/admin/users/ban", {
            user_id: userId,
            reason,
            ban_duration_days: banDurationDays,
        });
        return response.data;
    },

    // POST /api/admin/users/unban
    unbanUser: async (userId: string): Promise<ApiResponse<any>> => {
        const response = await api.post("/api/admin/users/unban", {
            user_id: userId,
        });
        return response.data;
    },

    // GET /api/admin/users/banned
    getBannedUsers: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/admin/users/banned");
        return response.data;
    },

    // GET /api/admin/stats
    getAdminStats: async (): Promise<ApiResponse<any>> => {
        const response = await api.get("/api/admin/stats");
        return response.data;
    },
};
