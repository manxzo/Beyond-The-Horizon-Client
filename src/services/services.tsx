import axios, { AxiosError } from "axios";
import { addToast } from "@heroui/react";
import { jwtDecode } from "jwt-decode";
// Get the API URL from environment variables or use a default
const API_URL = import.meta.env.VITE_SERVER_URL || 'https://bth-server-ywjx.shuttle.app';

// Log the API URL for debugging
console.log('API URL:', API_URL);

// Define the JWT payload interface
interface JwtPayload {
    id: string;
    username: string;
    role: string;
    exp: number;
    iat?: number;
}

// Create a token management utility with jsonwebtoken
const tokenManager = {
    getToken: () => localStorage.getItem('auth_token'),
    setToken: (token: string) => localStorage.setItem('auth_token', token),
    removeToken: () => localStorage.removeItem('auth_token'),
    isTokenExpired: () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return true;

        try {
            // Use jwtDecode instead of jwt_decode
            const decoded = jwtDecode<JwtPayload>(token);

            // Check if the token is expired
            const currentTime = Date.now() / 1000;
            return decoded.exp < currentTime;
        } catch (e) {
            console.error('Error checking token expiration:', e);
            return true;
        }
    },
    getDecodedToken: () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;

        try {
            return jwtDecode<JwtPayload>(token);
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
    },
    lastRefreshAttempt: 0,
    canAttemptRefresh: () => {
        const now = Date.now();
        // Only allow refresh attempts every 30 seconds
        if (now - tokenManager.lastRefreshAttempt < 30000) {
            return false;
        }
        tokenManager.lastRefreshAttempt = now;
        return true;
    }
};

// Create two axios instances - one for public routes and one for protected routes
const publicApi = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Always send cookies for public routes too
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

// Add request interceptors for both instances
[publicApi, api].forEach(instance => {
    instance.interceptors.request.use(
        (config) => {
            // Log outgoing requests for debugging
            console.log(`Request: ${config.method?.toUpperCase()} ${config.url}`, config);

            // For protected routes, add the JWT token as a header
            if (instance === api) {
                const token = tokenManager.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }

            return config;
        },
        (error) => {
            console.error('Request error:', error);
            return Promise.reject(error);
        }
    );

    // Add response interceptors for both instances
    instance.interceptors.response.use(
        (response) => {
            // Log successful responses for debugging
            console.log(`Response from ${response.config.url}:`, response.data);
            return response;
        },
        async (error: AxiosError) => {
            // Enhanced error logging
            console.error('API Error:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // Handle session expiration or authentication errors
            if (error.response?.status === 401) {
                console.error("Authentication error:", error.response?.data);

                // Try to refresh the session if token is expired
                if (tokenManager.getToken() &&
                    tokenManager.isTokenExpired() &&
                    tokenManager.canAttemptRefresh() &&
                    error.config) {
                    try {
                        // Call the refresh endpoint
                        const refreshResponse = await publicApi.post("/api/public/auth/refresh");

                        if (refreshResponse.data.token) {
                            // Update the token
                            tokenManager.setToken(refreshResponse.data.token);

                            // Retry the original request with the new token
                            const originalRequest = error.config;
                            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error("Failed to refresh token:", refreshError);
                        // Clear auth state on refresh failure
                        tokenManager.removeToken();
                        localStorage.removeItem('user');

                        // Redirect to login page only if on a protected route
                        if (window.location.pathname !== '/login' &&
                            !window.location.pathname.startsWith('/public')) {
                            window.location.href = '/login';
                        }
                    }
                } else {
                    // Clear auth state on other 401 errors
                    tokenManager.removeToken();
                    localStorage.removeItem('user');
                }
            }

            // Add toast notification for API errors
            let errorMessage = "An error occurred with the API request";

            // Extract error message from response
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'string') {
                    errorMessage = data;
                } else if (typeof data === 'object') {
                    if ('message' in data && typeof data.message === 'string') {
                        errorMessage = data.message;
                    } else if ('errors' in data && Array.isArray(data.errors) && data.errors.length > 0) {
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
});

// Export token manager for use in other parts of the app
export { tokenManager };

// Types for API responses
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}

// ==================== AUTH SERVICES ====================
export interface userSignupData {
    username: string,
    email: string,
    password: string,
    dob: string,
}
export const authService = {
    // POST /api/public/auth/register
    register: async (userData: userSignupData): Promise<ApiResponse<any>> => {
        try {
            console.log('Registering user:', userData);
            const response = await publicApi.post("/api/public/auth/register", userData);
            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    // POST /api/public/auth/login
    login: async (
        username: string,
        password: string
    ): Promise<ApiResponse<any>> => {
        try {
            console.log('Logging in user:', username);
            const response = await publicApi.post("/api/public/auth/login", {
                username,
                password,
            });

            // Store the JWT token if it's in the response
            if (response.data.token) {
                tokenManager.setToken(response.data.token);
            }

            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // POST /api/protected/auth/logout
    logout: async (): Promise<ApiResponse<any>> => {
        try {
            // Make sure we have the latest token
            const token = tokenManager.getToken();

            // First try to call the server endpoint with explicit headers
            const response = await axios({
                method: 'post',
                url: `${API_URL}/api/protected/auth/logout`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true  // Important for cookies
            });

            // Clear local storage regardless of server response
            tokenManager.removeToken();
            localStorage.removeItem('user');

            return response.data;
        } catch (error) {
            console.error('Logout error:', error);

            // Always clear local storage even if the server request fails
            tokenManager.removeToken();
            localStorage.removeItem('user');

            // Return a successful response even if the server call failed
            return {
                success: true,
                message: "Logged out locally"
            };
        }
    },

    // POST /api/public/auth/refresh
    refreshSession: async (): Promise<ApiResponse<any>> => {
        // Only attempt to refresh if we have a token
        if (!tokenManager.getToken()) {
            return Promise.reject(new Error("No token to refresh"));
        }

        return refreshSessionDebounced();
    },

    // Check if the user is authenticated (both cookie and token)
    checkAuth: async (): Promise<boolean> => {
        try {
            // First check if we have a token
            const token = tokenManager.getToken();
            if (!token) {
                return false;
            }

            // Check if token is expired before making the request
            if (tokenManager.isTokenExpired()) {
                return false;
            }

            // Then verify with the server
            await api.get("/api/protected/users/info");
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }
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

        // Log file details for debugging
        console.log(`Uploading avatar: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

        // Use a longer timeout for file uploads
        const response = await api.post(
            "/api/protected/users/avatar/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 30000, // 30 seconds timeout for file uploads
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || file.size)
                    );
                    console.log(`Upload progress: ${percentCompleted}%`);
                }
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

// Add this utility function at the top of your file
const debounce = <T extends (...args: any[]) => Promise<any>>(fn: T, ms = 300) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (...args: Parameters<T>): ReturnType<T> {
        return new Promise((resolve, reject) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                fn(...args).then(resolve).catch(reject);
            }, ms);
        }) as ReturnType<T>;
    };
};

// Then update the refreshSession function
const refreshSessionDebounced = debounce(async () => {
    try {
        const response = await api.post("/api/public/auth/refresh");
        // Update the JWT token if it's in the response
        if (response.data.token) {
            tokenManager.setToken(response.data.token);
        }
        return response.data;
    } catch (error) {
        console.error('Session refresh error:', error);
        throw error;
    }
}, 1000); // 1 second debounce
