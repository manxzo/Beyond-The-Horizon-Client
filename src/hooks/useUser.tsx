import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authService, userService, userSignupData, tokenManager } from '../services/services';
import { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

export function useUser() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [storedUser, setStoredUser] = useState<any>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const { disconnectWebSocket } = useWebSocket();

    const QUERY_KEYS = {
        currentUser: ['currentUser'],
        userProfile: (username: string) => ['userProfile', username],
        userById: (userId: string) => ['userById', userId],
        authStatus: ['authStatus'],
    };

    const {
        data: authStatus,
        isLoading: isCheckingAuth,
        refetch: recheckAuth
    } = useQuery({
        queryKey: QUERY_KEYS.authStatus,
        queryFn: async () => {
            try {
                // Return the boolean result directly
                return await authService.checkAuth();
            } catch (error) {
                console.error('Error checking auth status:', error);
                return false;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
        // Only run this query if we have a token
        enabled: !!tokenManager.getToken() && isInitialized,
        refetchOnWindowFocus: false,
    });

    /**
     * Fetch the current logged-in user's data, but only if authenticated
     * Route: /api/protected/users/info
     */
    const {
        data: currentUser,
        isLoading: isLoadingUser,
        isError: isErrorUser,
        error: userError,
        refetch: refetchUser,
    } = useQuery({
        queryKey: QUERY_KEYS.currentUser,
        queryFn: async () => {
            // Get the full response and return its data property
            const response = await userService.getCurrentUser();
            localStorage.removeItem('user');
            localStorage.setItem('user', JSON.stringify(response.data));
            setStoredUser(response.data);
            return response.data;
        },
        enabled: !!authStatus && isInitialized,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    // Check for stored user and token on component mount
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const parsedUser = JSON.parse(user);
                console.log('Loaded stored user:', parsedUser);
                setStoredUser(parsedUser);

                // Pre-populate the query cache with the stored user
                queryClient.setQueryData(QUERY_KEYS.currentUser, parsedUser);
            } catch (e) {
                console.error('Error parsing stored user:', e);
                localStorage.removeItem('user');
            }
        }

        // Only attempt to refresh if we have a token
        const token = tokenManager.getToken();
        if (token && tokenManager.isTokenExpired()) {
            console.log('Token is expired, attempting to refresh');
            authService.refreshSession()
                .then(() => {
                    // After successful refresh, force refetch user data
                    recheckAuth();
                    refetchUser();
                })
                .catch(() => {
                    console.log('Failed to refresh token, clearing auth state');
                    localStorage.removeItem('user');
                    tokenManager.removeToken();
                    setStoredUser(null);
                    queryClient.setQueryData(QUERY_KEYS.currentUser, null);
                })
                .finally(() => {
                    setIsInitialized(true);
                });
        } else {
            setIsInitialized(true);
        }
        if (!token && user) {
            localStorage.removeItem('user');
            tokenManager.removeToken();
            setStoredUser(null);
            queryClient.setQueryData(QUERY_KEYS.currentUser, null);
        }
    }, [queryClient, recheckAuth, refetchUser]);

    // Make sure we're using the most up-to-date user data
    const userData = currentUser || storedUser;

    // Log the current state for debugging
    useEffect(() => {
        console.log('Current user state:', { currentUser, storedUser, userData, isAuthenticated: !!authStatus && !!userData });
    }, [currentUser, storedUser, authStatus]);

    /**
     * Check if the user is authenticated
     */
    const isAuthenticated = !!authStatus && !!userData;

    /**
     * Login mutation - handles user login and updates the current user data.
     * Route: /api/public/auth/login
     */
    const loginMutation = useMutation({
        mutationFn: async ({ username, password }: { username: string; password: string }) => {
            try {
                console.log('Login mutation called with:', username);
                const authResponse = await authService.login(username, password);
                console.log('Login auth response:', authResponse);
                if (authResponse && authResponse.data && 'token' in authResponse.data) {
                    // Set the token so the next request can use it
                    tokenManager.setToken(authResponse.data.token as string);

                    try {
                        // Fetch the complete user profile after login
                        const userProfileResponse = await userService.getCurrentUser();
                        console.log('User profile after login:', userProfileResponse);

                        // Combine the full profile data with the token
                        const completeUserData = {
                            ...userProfileResponse.data,
                            token: authResponse.data.token
                        };

                        return completeUserData;
                    } catch (profileError) {
                        console.error('Error fetching profile after login:', profileError);
                        // Fallback: return the auth response if profile fetch fails
                        return authResponse.data;
                    }
                }

                return authResponse.data;
            } catch (error) {
                console.error('Login mutation error:', error);
                throw error;
            }
        },
        onSuccess: (data) => {
            console.log('Login successful, storing complete user data:', data);

            // Save complete user data to localStorage and update state
            localStorage.setItem('user', JSON.stringify(data));
            setStoredUser(data);

            // Update the query cache with the complete user data
            queryClient.setQueryData(QUERY_KEYS.currentUser, data);

            // Refresh auth status
            recheckAuth();

            // Invalidate message-related queries to ensure unread counts are fetched
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['groupChats'] });

            // Redirect to home page after successful login
            navigate('/');
        },
        onError: (error) => {
            console.error('Login mutation error handler:', error);
        }
    });

    /**
     * Register mutation - handles user registration
     * Route: /api/public/auth/register
     */
    const registerMutation = useMutation({
        mutationFn: async (userData: userSignupData) => {
            const response = await authService.register(userData);
            return response.data;
        },
        onSuccess: () => {
            // Optionally redirect to login after successful registration
            // navigate('/login');
        },
    });

    /**
     * Logout mutation - handles user logout
     * Route: /api/protected/auth/logout
     */
    const logoutMutation = useMutation({
        mutationFn: async () => {
            const response = await authService.logout();
            return response.data;
        },
        onSuccess: () => {
            // Disconnect WebSocket connection
            disconnectWebSocket();

            // Clear all local storage items
            localStorage.clear(); // Clear all localStorage items instead of just specific ones
            sessionStorage.clear(); // Clear all sessionStorage items as well
            tokenManager.removeToken();
            setStoredUser(null);

            // Clear all query cache data
            queryClient.clear();

            // Set specific query data to null for immediate UI updates
            queryClient.setQueryData(QUERY_KEYS.currentUser, null);
            queryClient.setQueryData(QUERY_KEYS.authStatus, false);

            // Redirect to login page and force a complete page reload
            navigate('/login', { replace: true });

            // Force a complete page reload to ensure a fresh state
            // This will happen after the navigation
            setTimeout(() => {
                window.location.reload();
            }, 100);
        },
    });

    /**
     * Update profile mutation - handles updating user profile information
     * Route: /api/protected/users/update-info
     */
    const updateProfileMutation = useMutation({
        mutationFn: async (profileData: {
            user_profile?: string;
            bio?: string;
            location?: any;
            interests?: string[];
            experience?: string[];
            available_days?: string[];
            languages?: string[];
            privacy?: boolean;
        }) => {
            const response = await userService.updateProfile(profileData);
            return response.data;
        },
        onSuccess: (_data) => {
            // Invalidate the current user query to trigger a refetch
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });

            // After invalidating, we need to refetch the user data
            refetchUser().then(result => {
                if (result.data) {
                    // Update localStorage with the latest user data
                    const updatedUser = result.data;
                    // Preserve the token when updating localStorage
                    const token = tokenManager.getToken();
                    const completeUserData = {
                        ...updatedUser,
                        token
                    };

                    localStorage.setItem('user', JSON.stringify(completeUserData));
                    setStoredUser(completeUserData);
                }
            });
        },
    });

    /**
     * Update avatar mutation - handles uploading a new user avatar
     * Route: /api/protected/users/avatar/upload
     */
    const updateAvatarMutation = useMutation({
        mutationFn: async (file: File) => {
            const response = await userService.updateAvatar(file);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });

            // After invalidating, refetch and update localStorage
            refetchUser().then(result => {
                if (result.data) {
                    // Update localStorage with the latest user data
                    const updatedUser = result.data;
                    // Preserve the token when updating localStorage
                    const token = tokenManager.getToken();
                    const completeUserData = {
                        ...updatedUser,
                        token
                    };

                    localStorage.setItem('user', JSON.stringify(completeUserData));
                    setStoredUser(completeUserData);
                }
            });
        },
    });

    /**
     * Reset avatar mutation - handles resetting user avatar to default
     * Route: /api/protected/users/avatar/reset
     */
    const resetAvatarMutation = useMutation({
        mutationFn: async () => {
            const response = await userService.resetAvatar();
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });

            // After invalidating, refetch and update localStorage
            refetchUser().then(result => {
                if (result.data) {
                    // Update localStorage with the latest user data
                    const updatedUser = result.data;
                    // Preserve the token when updating localStorage
                    const token = tokenManager.getToken();
                    const completeUserData = {
                        ...updatedUser,
                        token
                    };

                    localStorage.setItem('user', JSON.stringify(completeUserData));
                    setStoredUser(completeUserData);
                }
            });
        },
    });

    /**
     * Delete account mutation - handles user account deletion
     * Route: /api/protected/users/delete-user
     */
    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            const response = await userService.deleteAccount();
            return response.data;
        },
        onSuccess: () => {
            queryClient.clear();
            navigate('/');
        },
    });

    /**
     * Refresh the user's authentication session
     * Route: /api/public/auth/refresh
     */
    const refreshSession = async () => {
        try {
            const result = await authService.refreshSession();
            console.log('Token refresh result:', result);

            const userResponse = await userService.getCurrentUser();
            console.log('User data after token refresh:', userResponse);

            if (userResponse && userResponse.data) {
                const token = tokenManager.getToken();
                const completeUserData = {
                    ...userResponse.data,
                    token
                };

                localStorage.setItem('user', JSON.stringify(completeUserData));
                setStoredUser(completeUserData);
                queryClient.setQueryData(QUERY_KEYS.currentUser, completeUserData);
            }

            recheckAuth();
            return true;
        } catch (error) {
            console.error('Session refresh error:', error);
            localStorage.removeItem('user');
            tokenManager.removeToken();
            setStoredUser(null);
            queryClient.setQueryData(QUERY_KEYS.currentUser, null);
            return false;
        }
    };

    /**
     * Get a user profile by username
     * Route: /api/protected/users/{username}
     */
    const useGetUserByName = (username: string) => {
        return useQuery({
            queryKey: QUERY_KEYS.userProfile(username),
            queryFn: async () => {
                const response = await userService.getUserByName(username);
                return response.data;
            },
            enabled: !!username && isAuthenticated,
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
        });
    };

    /**
     * Get a user profile by ID
     * Route: /api/protected/users/id/{user_id}
     */
    const useGetUserById = (userId: string) => {
        return useQuery({
            queryKey: QUERY_KEYS.userById(userId),
            queryFn: async () => {
                const response = await userService.getUserById(userId);
                return response.data;
            },
            enabled: !!userId && isAuthenticated,
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
        });
    };

    // Return all functions and data for user management
    return {
        currentUser: userData,
        isLoadingUser,
        isErrorUser,
        userError,
        isAuthenticated,
        isCheckingAuth,
        refetchUser,

        // User profile queries
        useGetUserByName,
        useGetUserById,

        // Auth functions
        login: loginMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        loginError: loginMutation.error,

        register: registerMutation.mutate,
        isRegistering: registerMutation.isPending,
        registerError: registerMutation.error,

        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,

        refreshSession,

        // Profile management
        updateProfile: updateProfileMutation.mutate,
        isUpdatingProfile: updateProfileMutation.isPending,
        updateProfileError: updateProfileMutation.error,

        updateAvatar: (file: File, options?: { onSuccess?: () => void, onError?: (error: any) => void }) => {
            return updateAvatarMutation.mutate(file, {
                onSuccess: () => {
                    if (options?.onSuccess) {
                        options.onSuccess();
                    }
                },
                onError: (error) => {
                    if (options?.onError) {
                        options.onError(error);
                    }
                }
            });
        },
        isUpdatingAvatar: updateAvatarMutation.isPending,
        updateAvatarError: updateAvatarMutation.error,

        resetAvatar: resetAvatarMutation.mutate,
        isResettingAvatar: resetAvatarMutation.isPending,

        deleteAccount: deleteAccountMutation.mutate,
        isDeletingAccount: deleteAccountMutation.isPending,
    };
}

