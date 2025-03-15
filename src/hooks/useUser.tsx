import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authService, userService, userSignupData, tokenManager } from '../services/services';
import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

export function useUser() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [storedUser, setStoredUser] = useState<any>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const { connect: connectWebSocket, disconnect: disconnectWebSocket } = useWebSocket();

    const QUERY_KEYS = {
        currentUser: ['currentUser'],
        userProfile: (username: string) => ['userProfile', username],
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
                // Return the response directly, not response.data
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
            // Return the response directly, not response.data
            return await userService.getCurrentUser();
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
     * 
     * This version has been adjusted to always fetch and save the full user data.
     */
    const loginMutation = useMutation({
        mutationFn: async ({ username, password }: { username: string; password: string }) => {
            try {
                console.log('Login mutation called with:', username);
                const authResponse = await authService.login(username, password);
                console.log('Login auth response:', authResponse);

                if (authResponse && 'token' in authResponse) {
                    // Set the token so the next request can use it
                    tokenManager.setToken(authResponse.token as string);

                    // Connect to WebSocket after successful login
                    connectWebSocket();

                    try {
                        // Fetch the complete user profile after login
                        const userProfileResponse = await userService.getCurrentUser();
                        console.log('User profile after login:', userProfileResponse);

                        // Combine the full profile data with the token
                        const completeUserData = {
                            ...userProfileResponse,
                            token: authResponse.token
                        };

                        return completeUserData;
                    } catch (profileError) {
                        console.error('Error fetching profile after login:', profileError);
                        // Fallback: return the auth response if profile fetch fails
                        return authResponse;
                    }
                }

                return authResponse;
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

            // Redirect to home page after successful login
            navigate('/');
        },
        onError: (error) => {
            console.error('Login mutation error handler:', error);
        }
    });

    /**
     * Register mutation - handles user registration
     */
    const registerMutation = useMutation({
        mutationFn: async (userData: userSignupData) => {
            return await authService.register(userData);
        },
        onSuccess: () => {
            // Optionally redirect to login after successful registration
            // navigate('/login');
        },
    });

    /**
     * Logout mutation - handles user logout
     */
    const logoutMutation = useMutation({
        mutationFn: async () => {
            return await authService.logout();
        },
        onSuccess: () => {
            localStorage.removeItem('user');
            tokenManager.removeToken();
            setStoredUser(null);

            // Disconnect WebSocket on logout
            disconnectWebSocket();

            queryClient.setQueryData(QUERY_KEYS.currentUser, null);
            queryClient.setQueryData(QUERY_KEYS.authStatus, false);

            navigate('/login');
        },
    });

    /**
     * Update profile mutation - handles updating user profile information
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
            return await userService.updateProfile(profileData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
        },
    });

    /**
     * Update avatar mutation - handles uploading a new user avatar
     */
    const updateAvatarMutation = useMutation({
        mutationFn: async (file: File) => {
            return await userService.updateAvatar(file);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
        },
    });

    /**
     * Reset avatar mutation - handles resetting user avatar to default
     */
    const resetAvatarMutation = useMutation({
        mutationFn: async () => {
            return await userService.resetAvatar();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
        },
    });

    /**
     * Delete account mutation - handles user account deletion
     */
    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            return await userService.deleteAccount();
        },
        onSuccess: () => {
            queryClient.clear();
            navigate('/');
        },
    });

    /**
     * Fetch a user profile by username - returns a query configuration
     */
    const getUserProfile = (username: string) => {
        const queryConfig = {
            queryKey: QUERY_KEYS.userProfile(username),
            queryFn: async () => {
                // Return the response directly, not response.data
                return await userService.getUserByName(username);
            },
            enabled: !!username,
        };

        return queryConfig;
    };

    /**
     * Refresh the user's authentication session
     */
    const refreshSession = async () => {
        try {
            const result = await authService.refreshSession();
            console.log('Token refresh result:', result);

            const userResponse = await userService.getCurrentUser();
            console.log('User data after token refresh:', userResponse);

            if (userResponse) {
                const token = tokenManager.getToken();
                const completeUserData = {
                    ...userResponse,
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

    // Connect to WebSocket if user is authenticated
    useEffect(() => {
        if (isAuthenticated && !isCheckingAuth) {
            connectWebSocket();
        }
    }, [isAuthenticated, isCheckingAuth, connectWebSocket]);

    // Return all functions and data for user management
    return {
        currentUser: userData,
        isLoadingUser,
        isErrorUser,
        userError,
        isAuthenticated,
        isCheckingAuth,
        refetchUser,

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

        // User profile fetching (query config)
        getUserProfile,
    };
}

