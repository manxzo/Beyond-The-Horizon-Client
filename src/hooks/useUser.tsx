import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authService, userService, userSignupData, tokenManager } from '../services/services';
import axios from 'axios';
import { useState, useEffect } from 'react';

/**
 * Custom hook for managing user authentication and profile data
 * 
 * === TanStack Query vs useState Approach ===
 * 
 * Traditional useState approach would require:
 * 1. Multiple useState hooks for user data, loading states, and errors
 * 2. useEffect hooks to fetch data and handle side effects
 * 3. Manual refetching logic and cache invalidation
 * 4. Custom error handling for each API call
 * 
 * TanStack Query advantages:
 * 1. Automatic caching of query results
 * 2. Built-in loading and error states
 * 3. Automatic refetching on window focus, network reconnection
 * 4. Deduplication of requests
 * 5. Background updates that don't block the UI
 * 6. Optimistic updates for mutations
 * 7. Query invalidation to keep data fresh
 */
export function useUser() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [storedUser, setStoredUser] = useState<any>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Query key constants for better organization and consistency
    // These keys are used for caching and invalidation
    const QUERY_KEYS = {
        currentUser: ['currentUser'],
        userProfile: (username: string) => ['userProfile', username],
        authStatus: ['authStatus'],
    };

    /**
     * Check authentication status - both cookie and token
     */
    const {
        data: authStatus,
        isLoading: isCheckingAuth,
        refetch: recheckAuth
    } = useQuery({
        queryKey: QUERY_KEYS.authStatus,
        queryFn: async () => {
            try {
                return await authService.checkAuth();
            } catch (error) {
                console.error('Error checking auth status:', error);
                // Return false instead of letting the error propagate
                return false;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
        // Only run this query if we have a token
        enabled: !!tokenManager.getToken() && isInitialized,
        refetchOnWindowFocus: false, // Prevent refetching on window focus
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
            try {
                const response = await userService.getCurrentUser();
                return response.data || null;
            } catch (error) {
                console.error('Error fetching current user:', error);
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('user');
                    tokenManager.removeToken();
                    setStoredUser(null);
                }
                return null;
            }
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
                setStoredUser(JSON.parse(user));
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
                .catch(() => {
                    console.log('Failed to refresh token, clearing auth state');
                    localStorage.removeItem('user');
                    tokenManager.removeToken();
                    setStoredUser(null);
                })
                .finally(() => {
                    setIsInitialized(true);
                });
        } else {
            setIsInitialized(true);
        }
    }, []);

    /**
     * Check if the user is authenticated
     */
    const isAuthenticated = !!authStatus && (!!currentUser || !!storedUser);

    /**
     * Login mutation - handles user login and updates the current user data
     * 
     * With useState approach, you would need:
     * - useState for loading and error states
     * - Custom function to call the API and update state
     * - Manual error handling
     * - Manual cache invalidation
     * 
     * TanStack Query's useMutation provides:
     * - Loading and error states
     * - Automatic error handling
     * - Callbacks for success/error/settlement
     * - Integration with the query cache
     */
    const loginMutation = useMutation({
        mutationFn: async ({ username, password }: { username: string; password: string }) => {
            try {
                console.log('Login mutation called with:', username);
                return await authService.login(username, password);
            } catch (error) {
                console.error('Login mutation error:', error);
                throw error;
            }
        },
        onSuccess: (data) => {
            console.log('Login successful, storing user data');

            // Store user data
            localStorage.setItem('user', JSON.stringify(data));
            setStoredUser(data);

            // Refresh auth status and user data
            recheckAuth();
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });

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
     * 
     * Note how we use queryClient.setQueryData to immediately update the cache
     * This provides an optimistic UI update before the server confirms the logout
     */
    const logoutMutation = useMutation({
        mutationFn: async () => {
            return await authService.logout();
        },
        onSuccess: () => {
            localStorage.removeItem('user');
            tokenManager.removeToken();
            setStoredUser(null);

            queryClient.setQueryData(QUERY_KEYS.currentUser, null);
            queryClient.setQueryData(QUERY_KEYS.authStatus, false);

            navigate('/login');
        },
    });

    /**
     * Update profile mutation - handles updating user profile information
     * 
     * After a successful update, we invalidate the currentUser query
     * This ensures the UI shows the latest user data after an update
     */
    const updateProfileMutation = useMutation({
        mutationFn: async (userData: any) => {
            return await userService.updateProfile(userData);
        },
        onSuccess: () => {
            // After successful profile update, refetch the current user data
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
            // After successful avatar update, refetch the current user data
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
            // After successful avatar reset, refetch the current user data
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
        },
    });

    /**
     * Delete account mutation - handles user account deletion
     * 
     * After account deletion, we clear the entire query cache
     * This ensures no stale data remains for the deleted account
     */
    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            return await userService.deleteAccount();
        },
        onSuccess: () => {
            // After successful account deletion, clear all queries and navigate to home
            queryClient.clear();
            navigate('/');
        },
    });

    /**
     * Fetch a user profile by username
     * 
     * This is a function that returns a query configuration object,
     * not a hook itself. This pattern allows components to use the
     * configuration with useQuery while respecting the Rules of Hooks.
     * 
     * Usage in a component:
     * const { getUserProfile } = useUser();
     * const { data: profile } = useQuery(getUserProfile('username'));
     */
    const getUserProfile = (username: string) => {
        // Create the query configuration
        const queryConfig = {
            queryKey: QUERY_KEYS.userProfile(username),
            queryFn: async () => {
                const response = await userService.getUserByName(username);
                return response.data;
            },
            // Enable the query only if a username is provided
            enabled: !!username,
        };

        // Return the query configuration for use with useQuery
        return queryConfig;
    };

    /**
     * Refresh the user's authentication session
     * 
     * This is a manual function that refreshes the auth token
     * and then invalidates the currentUser query to update the UI
     */
    const refreshSession = async () => {
        try {
            const result = await authService.refreshSession();
            recheckAuth();
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
            console.log(result);
            return true;
        } catch (error) {
            console.error('Session refresh error:', error);
            return false;
        }
    };

    // Return all the necessary functions and data for user management
    return {
        // Current user state
        currentUser,
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

        updateAvatar: updateAvatarMutation.mutate,
        isUpdatingAvatar: updateAvatarMutation.isPending,
        updateAvatarError: updateAvatarMutation.error,

        resetAvatar: resetAvatarMutation.mutate,
        isResettingAvatar: resetAvatarMutation.isPending,

        deleteAccount: deleteAccountMutation.mutate,
        isDeletingAccount: deleteAccountMutation.isPending,

        // User profile fetching - returns a query config, not a direct useQuery call
        getUserProfile,
    };
}

/**
 * === USAGE EXAMPLES ===
 * 
 * // In a component:
 * const {
 *   currentUser,
 *   isAuthenticated,
 *   login,
 *   logout,
 *   isLoggingIn
 * } = useUser();
 * 
 * // Login
 * const handleLogin = () => {
 *   login({ username, password });
 * };
 * 
 * // Show loading state
 * if (isLoggingIn) {
 *   return <LoadingSpinner />;
 * }
 * 
 * // Conditional rendering based on auth state
 * return isAuthenticated ? <UserDashboard user={currentUser} /> : <LoginForm />;
 * 
 * // Fetching a user profile
 * const { getUserProfile } = useUser();
 * const { data: profile } = useQuery(getUserProfile('someUsername'));
 */
