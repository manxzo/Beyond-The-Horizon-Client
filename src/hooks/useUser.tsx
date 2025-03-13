import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService, userService, userSignupData } from '../services/services';

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

    // Query key constants for better organization and consistency
    // These keys are used for caching and invalidation
    const QUERY_KEYS = {
        currentUser: ['currentUser'],
        userProfile: (username: string) => ['userProfile', username],
    };

    /**
     * Fetch the current logged-in user's data
     * 
     * With useState approach, you would need:
     * - useState for user data, loading state, and error state
     * - useEffect to fetch data on component mount
     * - Manual refetching function
     * 
     * TanStack Query handles all of this automatically and provides:
     * - Cached data with configurable stale time
     * - Loading and error states
     * - Refetch function
     */
    const {
        data: currentUser,         // The cached user data
        isLoading: isLoadingUser,  // True while the initial fetch is happening
        isError: isErrorUser,      // True if the fetch failed
        error: userError,          // The error object if the fetch failed
        refetch: refetchUser,      // Function to manually refetch data
    } = useQuery({
        queryKey: QUERY_KEYS.currentUser,  // Unique identifier for this query in the cache
        queryFn: async () => {
            try {
                const response = await userService.getCurrentUser();
                return response.data;
            } catch (error) {
               console.error(error);
                return null;
            }
        },
        // Don't refetch on window focus for auth state to avoid disrupting user experience
        refetchOnWindowFocus: false,
        // Stale time of 5 minutes - user data doesn't change that frequently
        staleTime: 5 * 60 * 1000,
    });

    /**
     * Check if the user is authenticated
     */
    const isAuthenticated = !!currentUser;

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
        // The function that performs the mutation
        mutationFn: async ({ username, password }: { username: string; password: string }) => {
            return await authService.login(username, password);
        },
        // Called when the mutation succeeds
        onSuccess: () => {
            // After successful login, refetch the current user data
            // This invalidates the cache and triggers a refetch
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
        },
    });

    /**
     * Register mutation - handles user registration
     */
    const registerMutation = useMutation({
        mutationFn: async (userData: userSignupData) => {
            return await authService.register(userData);
        },
        onSuccess: () => {
            
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
            // After successful logout, clear the current user data and other relevant queries
            // This immediately updates the UI to reflect the logged-out state
            queryClient.setQueryData(QUERY_KEYS.currentUser, null);
            // Invalidate all queries to ensure fresh data after login
            queryClient.invalidateQueries();
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
            await authService.refreshSession();
            // After successful refresh, refetch the current user data
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
            return true;
        } catch (error) {
            console.error(error);
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
