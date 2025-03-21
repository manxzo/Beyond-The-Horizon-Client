import axios, { AxiosError, AxiosResponse } from "axios";
import { addToast } from "@heroui/react";
import { jwtDecode } from "jwt-decode";
import { ReportedType, ApplicationStatus, SupportGroupStatus } from '../interfaces/enums';


// Get the API URL from environment variables or use a default
const API_URL = import.meta.env.VITE_SERVER_URL || 'https://bth-server-ywjx.shuttle.app';

// Define the JWT payload interface
interface JwtPayload {
    id: string;
    username: string;
    role: string;
    exp: number;
    iat?: number;
}

// Create a secure token management utility
const tokenManager = {

    // Get token from storage and decrypt it
    getToken: (): string | null => {
        const token = localStorage.getItem('auth_token');


        try {
            return token;
        } catch (e) {
            console.error('Error retrieving token:', e);
            localStorage.removeItem('auth_token');
            return null;
        }
    },

    // Store token
    setToken: (token: string): void => {
        localStorage.setItem('auth_token', token);
    },

    removeToken: (): void => {
        localStorage.removeItem('auth_token');
    },

    isTokenExpired: (): boolean => {
        const token = tokenManager.getToken();
        if (!token) return true;

        try {
            const decoded = jwtDecode<JwtPayload>(token);

            const currentTime = Date.now() / 1000;
            return decoded.exp < currentTime - 60;
        } catch (e) {
            console.error('Error checking token expiration:', e);
            return true;
        }
    },

    willExpireSoon: (): boolean => {
        const token = tokenManager.getToken();
        if (!token) return false;

        try {
            const decoded = jwtDecode<JwtPayload>(token);

            const currentTime = Date.now() / 1000;
            const fiveMinutesFromNow = currentTime + 5 * 60;

            return decoded.exp < fiveMinutesFromNow;
        } catch (e) {
            return false;
        }
    },

    getDecodedToken: (): JwtPayload | null => {
        const token = tokenManager.getToken();
        if (!token) return null;

        try {
            return jwtDecode<JwtPayload>(token);
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
    },

    lastRefreshAttempt: 0,
    canAttemptRefresh: (): boolean => {
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
    withCredentials: true,
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
        async (config) => {
            // For protected routes, add the JWT token as a header
            if (instance === api) {
                const token = tokenManager.getToken();


                if (!token && config.url && !config.url.includes('/api/public/')) {
                    console.error('Attempted to call protected endpoint without authentication:', config.url);
                    return Promise.reject(new Error('Authentication required'));
                }

                // If token exists and will expire soon, try to refresh it
                if (token && tokenManager.willExpireSoon() && tokenManager.canAttemptRefresh()) {
                    try {
                        // Call the refresh endpoint
                        const refreshResponse = await publicApi.post("/api/public/auth/refresh");

                        if (refreshResponse.data.token) {
                            // Update the token
                            tokenManager.setToken(refreshResponse.data.token);

                            // Use the new token for this request
                            config.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
                            return config;
                        }
                    } catch (refreshError) {
                        console.error('Failed to refresh token:', refreshError);
                        // If refresh fails and this is a protected route, reject the request
                        if (config.url && !config.url.includes('/api/public/')) {
                            return Promise.reject(new Error('Authentication required'));
                        }
                    }
                }

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }

            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Add response interceptors for both instances
    instance.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error: AxiosError) => {
            // Handle session expiration or authentication errors
            if (error.response?.status === 401) {
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

                // Don't show toast for authentication errors
                return Promise.reject(error);
            }

            // Check if this is an error from a protected endpoint being called without authentication
            if (error.message === 'Authentication required') {
                // Don't show toast for authentication errors
                return Promise.reject(error);
            }

            // Add toast notification for non-authentication API errors
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
export interface ApiResponse<T> extends AxiosResponse<{
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}> { }

// ==================== AUTH SERVICES ====================
export interface userSignupData {
    username: string,
    email: string,
    password: string,
    dob: string,
}
export const authService = {
    // POST /api/public/auth/register
    register: async (userData: userSignupData): Promise<any> => {
        try {
            const response = await publicApi.post("/api/public/auth/register", userData);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // POST /api/public/auth/login
    login: async (
        username: string,
        password: string
    ): Promise<any> => {
        try {
            const response = await publicApi.post("/api/public/auth/login", {
                username,
                password,
            });

            // Store the JWT token if it's in the response
            if (response.data.token) {
                tokenManager.setToken(response.data.token);
            }

            return response;
        } catch (error) {
            throw error;
        }
    },

    // POST /api/protected/auth/logout
    logout: async (): Promise<any> => {
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

            return response;
        } catch (error) {
            // Always clear local storage even if the server request fails
            tokenManager.removeToken();
            localStorage.removeItem('user');

            // Return a successful response even if the server call failed
            return {
                success: true,
                message: "Logged out locally"
            } as any;
        }
    },

    // POST /api/public/auth/refresh
    refreshSession: async (): Promise<any> => {
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
            return false;
        }
    }
};

// ==================== USER DATA SERVICES ====================
export const userService = {
    // GET /api/protected/users/info
    getCurrentUser: async (): Promise<any> => {
        const response = await api.get("/api/protected/users/info");
        return response;
    },

    // GET /api/protected/users/{username}
    getUserByName: async (username: string): Promise<any> => {
        const response = await api.get(`/api/protected/users/${username}`);
        return response;
    },

    // GET /api/protected/users/id/{user_id}
    getUserById: async (userId: string): Promise<any> => {
        const response = await api.get(`/api/protected/users/id/${userId}`);
        return response;
    },

    // PATCH /api/protected/users/update-info
    updateProfile: async (userData: any): Promise<any> => {
        const response = await api.patch(
            "/api/protected/users/update-info",
            userData
        );
        return response;
    },

    // POST /api/protected/users/avatar/upload
    updateAvatar: async (file: File): Promise<any> => {
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
                    'Content-Type': 'multipart/form-data',
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
        return response;
    },

    // POST /api/protected/users/avatar/reset
    resetAvatar: async (): Promise<any> => {
        const response = await api.post("/api/protected/users/avatar/reset");
        return response;
    },

    // DELETE /api/protected/users/delete-user
    deleteAccount: async (): Promise<any> => {
        const response = await api.delete("/api/protected/users/delete-user");
        return response;
    },
};

// ==================== FEED/POSTS SERVICES ====================
export const postService = {
    // GET /api/protected/feed/posts
    getPosts: async (
        page: number = 1,
        searchTags?: string,
        sortBy?: string
    ): Promise<any> => {
        let url = `/api/protected/feed/posts?page=${page}`;
        if (searchTags) {
            url += `&search-tags=${searchTags}`;
        }
        if (sortBy) {
            url += `&sort-by=${sortBy}`;
        }
        const response = await api.get(url);
        return response;
    },

    // GET /api/protected/feed/posts/{id}
    getPost: async (postId: string): Promise<any> => {
        const response = await api.get(`/api/protected/feed/posts/${postId}`);
        return response;
    },

    // POST /api/protected/feed/posts/new
    createPost: async (postData: {
        content: string;
        tags?: string[];
    }): Promise<any> => {
        const response = await api.post("/api/protected/feed/posts/new", postData);
        return response;
    },

    // PATCH /api/protected/feed/posts/{id}
    updatePost: async (
        postId: string,
        postData: { content?: string; tags?: string[] }
    ): Promise<any> => {
        const response = await api.patch(
            `/api/protected/feed/posts/${postId}`,
            postData
        );
        return response;
    },

    // DELETE /api/protected/feed/posts/{id}
    deletePost: async (postId: string): Promise<any> => {
        const response = await api.delete(`/api/protected/feed/posts/${postId}`);
        return response;
    },

    // POST /api/protected/feed/posts/like
    likePost: async (postId: string): Promise<any> => {
        const response = await api.post(`/api/protected/feed/posts/like`, {
            post_id: postId,
        });
        return response;
    },

    // POST /api/protected/feed/comments
    commentOnPost: async (
        postId: string,
        content: string,
        parentCommentId?: string
    ): Promise<any> => {
        const response = await api.post(`/api/protected/feed/comments`, {
            post_id: postId,
            content,
            parent_comment_id: parentCommentId,
        });
        return response;
    },

    // PATCH /api/protected/feed/comments/{id}
    updateComment: async (
        commentId: string,
        content: string
    ): Promise<any> => {
        const response = await api.patch(
            `/api/protected/feed/comments/${commentId}`,
            {
                content,
            }
        );
        return response;
    },

    // DELETE /api/protected/feed/comments/{id}
    deleteComment: async (commentId: string): Promise<any> => {
        const response = await api.delete(
            `/api/protected/feed/comments/${commentId}`
        );
        return response;
    },
};

// ==================== PRIVATE MESSAGING SERVICES ====================
export const messageService = {
    // GET /api/protected/messages/conversations
    getConversations: async (): Promise<any> => {
        const response = await api.get("/api/protected/messages/conversations");
        return response;
    },

    // GET /api/protected/messages/conversation/{username}
    getMessages: async (username: string): Promise<any> => {
        const response = await api.get(
            `/api/protected/messages/conversation/${username}`
        );
        return response;
    },

    // POST /api/protected/messages/send
    sendMessage: async (
        receiverUsername: string,
        content: string
    ): Promise<any> => {
        const response = await api.post(`/api/protected/messages/send`, {
            receiver_username: receiverUsername,
            content,
        });
        return response;
    },

    // PUT /api/protected/messages/{message_id}/seen
    markMessageSeen: async (messageId: string): Promise<any> => {
        const response = await api.put(`/api/protected/messages/${messageId}/seen`);
        return response;
    },

    // PUT /api/protected/messages/{message_id}/edit
    editMessage: async (
        messageId: string,
        content: string
    ): Promise<any> => {
        const response = await api.put(
            `/api/protected/messages/${messageId}/edit`,
            {
                content,
            }
        );
        return response;
    },

    // DELETE /api/protected/messages/{message_id}
    deleteMessage: async (messageId: string): Promise<any> => {
        const response = await api.delete(`/api/protected/messages/${messageId}`);
        return response;
    },

    // POST /api/protected/messages/{message_id}/report
    reportMessage: async (
        messageId: string,
        reason: string
    ): Promise<any> => {
        const response = await api.post(
            `/api/protected/messages/${messageId}/report`,
            {
                reason,
            }
        );
        return response;
    },
};

// ==================== SPONSOR MATCHING SERVICES ====================
export const matchingService = {
    // GET /api/protected/matching/recommend-sponsors
    getRecommendedSponsors: async (): Promise<any> => {
        const response = await api.get(
            "/api/protected/matching/recommend-sponsors"
        );
        return response;
    },

    // POST /api/protected/matching/request-sponsor
    requestSponsor: async (sponsorId: string): Promise<any> => {
        const response = await api.post("/api/protected/matching/request-sponsor", {
            sponsor_id: sponsorId,
        });
        return response;
    },

    // GET /api/protected/matching/status
    getMatchingStatus: async (): Promise<any> => {
        const response = await api.get("/api/protected/matching/status");
        return response;
    },

    // PATCH /api/protected/matching/respond
    respondToMatchingRequest: async (
        matchingRequestId: string,
        accept: boolean
    ): Promise<any> => {
        const response = await api.patch("/api/protected/matching/respond", {
            matching_request_id: matchingRequestId,
            accept,
        });
        return response;
    },
};

// ==================== SPONSOR ROLE SERVICES ====================
export const sponsorService = {
    // POST /api/protected/sponsor/apply
    applyForSponsor: async (
        applicationInfo: string
    ): Promise<any> => {
        const response = await api.post("/api/protected/sponsor/apply", {
            application_info: applicationInfo,
        });
        return response;
    },

    // GET /api/protected/sponsor/check
    checkSponsorApplicationStatus: async (): Promise<any> => {
        const response = await api.get("/api/protected/sponsor/check");
        return response;
    },

    // PATCH /api/protected/sponsor/update
    updateSponsorApplication: async (
        applicationInfo: string
    ): Promise<any> => {
        const response = await api.patch("/api/protected/sponsor/update", {
            application_info: applicationInfo,
        });
        return response;
    },

    // DELETE /api/protected/sponsor/delete
    deleteSponsorApplication: async (): Promise<any> => {
        const response = await api.delete("/api/protected/sponsor/delete");
        return response;
    },
};

// ==================== SUPPORT GROUP SERVICES ====================
export const supportGroupService = {
    // POST /api/protected/support-groups/suggest
    suggestSupportGroup: async (groupData: {
        title: string;
        description: string;
    }): Promise<any> => {
        const response = await api.post(
            "/api/protected/support-groups/suggest",
            groupData
        );
        console.log(response);
        return response;
    },

    // GET /api/protected/support-groups/list
    getSupportGroups: async (): Promise<any> => {
        const response = await api.get("/api/protected/support-groups/list");
        console.log(response);
        return response;
    },

    // GET /api/protected/support-groups/{group_id}
    getSupportGroupDetails: async (
        groupId: string
    ): Promise<any> => {
        const response = await api.get(`/api/protected/support-groups/${groupId}`);
        return response;
    },

    // POST /api/protected/support-groups/join
    joinSupportGroup: async (
        supportGroupId: string
    ): Promise<any> => {
        const response = await api.post("/api/protected/support-groups/join", {
            support_group_id: supportGroupId,
        });
        return response;
    },

    // DELETE /api/protected/support-groups/{group_id}/leave
    leaveSupportGroup: async (groupId: string): Promise<any> => {
        const response = await api.delete(
            `/api/protected/support-groups/${groupId}/leave`
        );
        return response;
    },

    // GET /api/protected/support-groups/my
    getMyGroups: async (): Promise<any> => {
        const response = await api.get("/api/protected/support-groups/my");
        return response;
    },
};

// ==================== SUPPORT GROUP MEETINGS SERVICES ====================
export const meetingService = {
    // POST /api/protected/support-groups/{group_id}/meetings
    createMeeting: async (
        meetingData: {
            title: string;
            description?: string;
            scheduled_time: string;
            support_group_id: string;
        }
    ): Promise<any> => {
        // Validate title length - must be at least 5 characters
        if (meetingData.title.length < 5) {
            throw new Error("Meeting title must be at least 5 characters long");
        }

        // Format the date to remove timezone information
        // The server expects a NaiveDateTime format without timezone
        const dateStr = meetingData.scheduled_time;
        // Remove timezone information by taking only the part before '+' or before '['
        let formattedDate = dateStr;
        const plusIndex = dateStr.indexOf('+');
        const bracketIndex = dateStr.indexOf('[');

        if (plusIndex > 0) {
            formattedDate = dateStr.substring(0, plusIndex);
        } else if (bracketIndex > 0) {
            formattedDate = dateStr.substring(0, bracketIndex);
        }

        const formattedData = {
            ...meetingData,
            scheduled_time: formattedDate.trim()
        };

        const response = await api.post(
            `/api/protected/meetings/new`,
            formattedData
        );
        return response;
    },

    // GET /api/protected/meetings/{meeting_id}
    getMeeting: async (meetingId: string): Promise<any> => {
        const response = await api.get(`/api/protected/meetings/${meetingId}`);
        return response;
    },

    // GET /api/protected/meetings/user
    getUserMeetings: async (): Promise<any> => {
        const response = await api.get(`/api/protected/meetings/user`);
        return response;
    },

    // POST /api/protected/meetings/join
    joinMeeting: async (meetingId: string): Promise<any> => {
        const response = await api.post(
            `/api/protected/meetings/join`,
            {
                meeting_id: meetingId,
            }
        );
        return response;
    },

    // DELETE /api/protected/meetings/{meeting_id}/leave
    leaveMeeting: async (meetingId: string): Promise<any> => {
        const response = await api.delete(
            `/api/protected/meetings/${meetingId}/leave`
        );
        return response;
    },

    // GET /api/protected/meetings/{meeting_id}/participants
    getMeetingParticipants: async (
        meetingId: string
    ): Promise<any> => {
        const response = await api.get(
            `/api/protected/meetings/${meetingId}/participants`
        );
        return response;
    },

    // POST /api/protected/meetings/{meeting_id}/start
    startMeeting: async (meetingId: string): Promise<any> => {
        const response = await api.post(
            `/api/protected/meetings/${meetingId}/start`
        );
        return response;
    },

    // POST /api/protected/meetings/{meeting_id}/end
    endMeeting: async (meetingId: string): Promise<any> => {
        const response = await api.post(`/api/protected/meetings/${meetingId}/end`);
        return response;
    },
};

// ==================== GROUP CHAT SERVICES ====================
export const groupChatService = {
    // POST /api/protected/group-chats/create
    createGroupChat: async (): Promise<any> => {
        const response = await api.post("/api/protected/group-chats/create");
        return response;
    },

    // GET /api/protected/group-chats/list
    getGroupChats: async (): Promise<any> => {
        const response = await api.get("/api/protected/group-chats/list");
        return response;
    },

    // GET /api/protected/group-chats/{group_chat_id}
    getGroupChatDetails: async (chatId: string): Promise<any> => {
        const response = await api.get(`/api/protected/group-chats/${chatId}`);
        return response;
    },

    // POST /api/protected/group-chats/{group_chat_id}/messages
    sendGroupChatMessage: async (
        chatId: string,
        content: string
    ): Promise<any> => {
        const response = await api.post(
            `/api/protected/group-chats/${chatId}/messages`,
            {
                content,
            }
        );
        return response;
    },

    // PATCH /api/protected/group-chats/{group_chat_id}/messages/{message_id}
    editGroupChatMessage: async (
        chatId: string,
        messageId: string,
        content: string
    ): Promise<any> => {
        const response = await api.patch(
            `/api/protected/group-chats/${chatId}/messages/${messageId}`,
            { content }
        );
        return response;
    },

    // DELETE /api/protected/group-chats/{group_chat_id}/messages/{message_id}
    deleteGroupChatMessage: async (
        chatId: string,
        messageId: string
    ): Promise<any> => {
        const response = await api.delete(
            `/api/protected/group-chats/${chatId}/messages/${messageId}`
        );
        return response;
    },

    // POST /api/protected/group-chats/{group_chat_id}/members
    addGroupChatMember: async (
        chatId: string,
        memberId: string
    ): Promise<any> => {
        const response = await api.post(
            `/api/protected/group-chats/${chatId}/members`,
            {
                member_id: memberId,
            }
        );
        return response;
    },

    // DELETE /api/protected/group-chats/{group_chat_id}/members/{member_id}
    removeGroupChatMember: async (
        chatId: string,
        memberId: string
    ): Promise<any> => {
        const response = await api.delete(
            `/api/protected/group-chats/${chatId}/members/${memberId}`
        );
        return response;
    },
};

// ==================== RESOURCE SERVICES ====================
export const resourceService = {
    // GET /api/protected/resources/list
    getResources: async (): Promise<any> => {
        const response = await api.get("/api/protected/resources/list");
        return response;
    },

    // GET /api/protected/resources/{id}
    getResource: async (resourceId: string): Promise<any> => {
        const response = await api.get(`/api/protected/resources/${resourceId}`);
        return response;
    },

    // POST /api/protected/resources/create
    createResource: async (resourceData: {
        title: string;
        content: string;
        support_group_id?: string;
    }): Promise<any> => {
        const response = await api.post(
            "/api/protected/resources/create",
            resourceData
        );
        return response;
    },

    // PATCH /api/protected/resources/{id}
    updateResource: async (
        resourceId: string,
        resourceData: {
            title?: string;
            content?: string;
            support_group_id?: string;
        }
    ): Promise<any> => {
        const response = await api.patch(
            `/api/protected/resources/${resourceId}`,
            resourceData
        );
        return response;
    },

    // DELETE /api/protected/resources/{id}
    deleteResource: async (resourceId: string): Promise<any> => {
        const response = await api.delete(`/api/protected/resources/${resourceId}`);
        return response;
    },
};

// ==================== REPORT SERVICES ====================
export const reportService = {
    // POST /api/protected/reports/new
    createReport: async (reportData: {
        reported_user_id: string;
        reason: string;
        reported_type: ReportedType;
        reported_item_id: string;
    }): Promise<any> => {
        const response = await api.post("/api/protected/reports/new", reportData);
        return response;
    },
};

// ==================== ADMIN SERVICES ====================
export const adminService = {
    // GET /api/protected/admin/sponsor-applications/pending
    getPendingSponsorApplications: async (): Promise<any> => {
        const response = await api.get("/api/protected/admin/sponsor-applications/pending");
        return response;
    },

    // POST /api/protected/admin/sponsor-applications/review
    reviewSponsorApplication: async (
        params: {
            applicationId: string,
            status: ApplicationStatus,
            adminComments?: string
        }
    ): Promise<any> => {
        const response = await api.post("/api/protected/admin/sponsor-applications/review", {
            application_id: params.applicationId,
            status: params.status,
            admin_comments: params.adminComments,
        });
        return response;
    },

    // GET /api/protected/admin/support-groups/pending
    getPendingSupportGroups: async (): Promise<any> => {
        const response = await api.get("/api/protected/admin/support-groups/pending");
        return response;
    },

    // POST /api/protected/admin/support-groups/review
    reviewSupportGroup: async (
        params: {
            supportGroupId: string,
            status: SupportGroupStatus,
            adminComments?: string
        }
    ): Promise<any> => {
        const response = await api.post("/api/protected/admin/support-groups/review", {
            support_group_id: params.supportGroupId,
            status: params.status,
            admin_comments: params.adminComments,
        });
        return response;
    },

    // GET /api/protected/admin/resources/pending
    getPendingResources: async (): Promise<any> => {
        const response = await api.get("/api/protected/admin/resources/pending");
        return response;
    },

    // POST /api/protected/admin/resources/review
    reviewResource: async (
        params: {
            resourceId: string,
            approved: boolean,
            adminComments?: string
        }
    ): Promise<any> => {
        const response = await api.post("/api/protected/admin/resources/review", {
            resource_id: params.resourceId,
            approved: params.approved,
            admin_comments: params.adminComments,
        });
        return response;
    },

    // GET /api/protected/admin/reports/unresolved
    getUnresolvedReports: async (): Promise<any> => {
        const response = await api.get("/api/protected/admin/reports/unresolved");
        return response;
    },

    // POST /api/protected/admin/reports/handle
    handleReport: async (
        params: {
            reportId: string,
            actionTaken: string,
            resolved: boolean
        }
    ): Promise<any> => {
        const response = await api.post("/api/protected/admin/reports/handle", {
            report_id: params.reportId,
            action_taken: params.actionTaken,
            resolved: params.resolved,
        });
        return response;
    },

    // POST /api/protected/admin/users/ban
    banUser: async (
        params: {
            userId: string,
            reason: string,
            banDurationDays?: number
        }
    ): Promise<any> => {
        const response = await api.post("/api/protected/admin/users/ban", {
            user_id: params.userId,
            reason: params.reason,
            ban_duration_days: params.banDurationDays,
        });
        return response;
    },

    // POST /api/protected/admin/users/unban
    unbanUser: async (userId: string): Promise<any> => {
        const response = await api.post("/api/protected/admin/users/unban", {
            user_id: userId,
        });
        return response;
    },

    // GET /api/protected/admin/users/banned
    getBannedUsers: async (): Promise<any> => {
        const response = await api.get("/api/protected/admin/users/banned");
        return response;
    },

    // GET /api/protected/admin/users
    getAllUsers: async (params?: {
        username?: string,
        role?: string,
        limit?: number,
        offset?: number
    }): Promise<any> => {
        let url = "/api/protected/admin/users";

        // Add query parameters if provided
        if (params) {
            const queryParams = new URLSearchParams();

            if (params.username) {
                queryParams.append("username", params.username);
            }

            if (params.role) {
                queryParams.append("role", params.role);
            }

            if (params.limit) {
                queryParams.append("limit", params.limit.toString());
            }

            if (params.offset) {
                queryParams.append("offset", params.offset.toString());
            }

            const queryString = queryParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }

        const response = await api.get(url);
        return response;
    },

    // GET /api/protected/admin/stats
    getAdminStats: async (): Promise<any> => {
        const response = await api.get("/api/protected/admin/stats");
        return response;
    },
};

// ==================== WEBSOCKET SERVICES ====================
export const wsService = {
    // Helper function to get the WebSocket URL with token
    getWebSocketUrl: (): string => {
        // Use the same base URL as the API to ensure cookies are sent
        const baseUrl = API_URL.replace('http://', 'ws://').replace('https://', 'wss://');

        // Get the token for authentication
        const token = tokenManager.getToken();
        if (!token) {
            throw new Error('No authentication token available');
        }
        return `${baseUrl}/api/protected/ws/connect?token=${token}`;
    },

    // POST /api/protected/ws/send-user - Send a message to a specific user
    sendToUser: async (userId: string, payload: any): Promise<any> => {
        try {
            const response = await api.post('/api/protected/ws/send-user', {
                user_id: userId,
                payload
            });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // POST /api/protected/ws/send-users - Send a message to multiple users
    sendToUsers: async (userIds: string[], payload: any): Promise<any> => {
        try {
            const response = await api.post('/api/protected/ws/send-users', {
                user_ids: userIds,
                payload
            });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // POST /api/protected/ws/send-role - Send a message to all users with a specific role
    sendToRole: async (role: string, payload: any): Promise<any> => {
        try {
            const response = await api.post('/api/protected/ws/send-role', {
                role,
                payload
            });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // POST /api/protected/ws/send-all - Send a message to all connected users
    sendToAll: async (payload: any): Promise<any> => {
        try {
            const response = await api.post('/api/protected/ws/send-all', {
                payload
            });
            return response;
        } catch (error) {
            throw error;
        }
    }
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
        return response;
    } catch (error) {
        console.error('Session refresh error:', error);
        throw error;
    }
}, 1000); // 1 second debounce
