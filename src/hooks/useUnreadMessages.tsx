import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMessage } from './useMessage';
import { useGroupChat } from './useGroupChat';
import { useUser } from './useUser';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket, MessageType } from '../contexts/WebSocketContext';

export function useUnreadMessages() {
    const [unreadPrivateCount, setUnreadPrivateCount] = useState(0);
    const [unreadGroupCount, setUnreadGroupCount] = useState(0);
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Get hooks
    const { useGetConversations, useMarkMessageSeen } = useMessage();
    const { getGroupChats } = useGroupChat();
    const { currentUser, isAuthenticated } = useUser();
    const queryClient = useQueryClient();
    const { addMessageListener } = useWebSocket();

    // Get the markMessageSeen mutation
    const { mutate: markMessageSeen } = useMarkMessageSeen();

    // Fetch conversations - only when authenticated
    const {
        data: conversationsData,
        isLoading: isLoadingConversations,
        refetch: refetchConversations
    } = useGetConversations();

    // Fetch group chats - only when authenticated
    const {
        data: groupChatsData,
        isLoading: isLoadingGroupChats,
        refetch: refetchGroupChats
    } = useQuery(getGroupChats());

    // Extract data - ensure we're handling the correct data structure
    // Memoize these values to prevent unnecessary re-renders
    const conversations = useMemo(() => conversationsData?.usernames || [], [conversationsData]);
    const groupChats = useMemo(() => groupChatsData || [], [groupChatsData]);

    // Function to manually initialize unread counts
    const initializeUnreadCounts = useCallback(() => {
        if (isAuthenticated && currentUser) {
            console.log('Initializing unread message counts');
            // Only refetch if we don't already have the data
            if (!conversationsData) {
                refetchConversations();
            }
            if (!groupChatsData) {
                refetchGroupChats();
            }
        }
    }, [isAuthenticated, currentUser, refetchConversations, refetchGroupChats, conversationsData, groupChatsData]);

    // Initialize unread counts when the hook is first used
    useEffect(() => {
        initializeUnreadCounts();
        // This effect should only run once when the component mounts
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Force refetch when user logs in
    useEffect(() => {
        if (isAuthenticated && currentUser) {
            // Refetch conversations and group chats when user logs in
            initializeUnreadCounts();
        }
    }, [isAuthenticated, currentUser, initializeUnreadCounts]);

    // Set up WebSocket listeners for real-time updates
    useEffect(() => {
        if (!isAuthenticated || !currentUser) return;

        // Listen for private messages
        const removePrivateMessageListener = addMessageListener(MessageType.PRIVATE_MESSAGE, (payload) => {
            // If the current user is the receiver and the message is not seen, increment the unread count
            if (payload.receiver_id === currentUser.user_id && !payload.seen) {
                setUnreadPrivateCount(prev => prev + 1);

                // Invalidate the query to force a refetch
                const queryKey = ['messages', payload.sender_username];
                queryClient.invalidateQueries({ queryKey });
            }
        });

        // Listen for group messages
        const removeGroupMessageListener = addMessageListener(MessageType.GROUP_MESSAGE, (payload) => {
            // If the sender is not the current user, increment the unread count
            if (payload.sender_id !== currentUser.user_id) {
                setUnreadGroupCount(prev => prev + 1);

                // Invalidate the query to force a refetch
                const queryKey = ['groupChat', payload.group_chat_id];
                queryClient.invalidateQueries({ queryKey });
            }
        });

        // Clean up listeners when component unmounts
        return () => {
            removePrivateMessageListener();
            removeGroupMessageListener();
        };
    }, [isAuthenticated, currentUser, addMessageListener, queryClient]);

    // Count unread private messages
    useEffect(() => {
        if (!currentUser || isLoadingConversations) {
            return;
        }

        // If no conversations, set loading to false for private messages
        if (conversations.length === 0) {
            setUnreadPrivateCount(0);
            setIsLoading(isLoadingGroupChats);
            return;
        }

        // Track how many conversations we've processed
        let processedCount = 0;
        let totalUnread = 0;

        // Process each conversation username
        conversations.forEach((username: string) => {
            // Get the messages from the query cache if available
            const queryKey = ['messages', username];
            const cachedMessages = queryClient.getQueryData(queryKey);

            if (cachedMessages) {
                // Count unread messages from cache
                const unreadCount = (cachedMessages as any[]).filter(msg =>
                    msg.receiver_id === currentUser?.user_id && !msg.seen
                ).length;

                totalUnread += unreadCount;
                processedCount++;

                // If all conversations processed, update state
                if (processedCount === conversations.length) {
                    setUnreadPrivateCount(totalUnread);
                    setIsLoading(isLoadingGroupChats);
                }
            } else {
                // If not in cache, we'll need to wait for the data to be fetched
                // This will happen when the user navigates to the messages page
                processedCount++;

                // If all conversations processed, update state
                if (processedCount === conversations.length) {
                    setUnreadPrivateCount(totalUnread);
                    setIsLoading(isLoadingGroupChats);
                }
            }
        });
    }, [currentUser, conversations, isLoadingConversations, isLoadingGroupChats, queryClient]);

    // Count unread group messages
    useEffect(() => {
        if (!currentUser || isLoadingGroupChats) {
            return;
        }

        // If no group chats, set loading to false
        if (groupChats.length === 0) {
            setUnreadGroupCount(0);
            setIsLoading(false);
            return;
        }

        // Track how many group chats we've processed
        let processedCount = 0;
        let totalUnread = 0;

        // Process each group chat
        groupChats.forEach((chat: any) => {
            const chatId = chat.group_chat_id;

            // Get the chat details from the query cache if available
            const queryKey = ['groupChat', chatId];
            const cachedChatDetails = queryClient.getQueryData(queryKey);

            if (cachedChatDetails) {
                const chatDetails = cachedChatDetails as any;

                // For group chats, we'll consider a message unread if it was sent after the user's last visit
                if (chatDetails.messages && chatDetails.messages.length > 0) {
                    // Get the user's last visit timestamp from local storage
                    const lastVisitKey = `group_chat_${chatId}_last_visit`;
                    const lastVisitTimestamp = localStorage.getItem(lastVisitKey);
                    const lastVisitTime = lastVisitTimestamp ? new Date(lastVisitTimestamp).getTime() : 0;

                    // Count messages sent after the user's last visit by other users
                    const unreadCount = chatDetails.messages.filter((msg: any) =>
                        msg.sender_id !== currentUser?.user_id &&
                        new Date(msg.timestamp).getTime() > lastVisitTime
                    ).length;

                    totalUnread += unreadCount;
                }
            }

            processedCount++;

            // If all group chats processed, update state
            if (processedCount === groupChats.length) {
                setUnreadGroupCount(totalUnread);
                setIsLoading(false);
            }
        });
    }, [currentUser, groupChats, isLoadingGroupChats, queryClient]);

    // Update total unread count when either private or group counts change
    useEffect(() => {
        setTotalUnreadCount(unreadPrivateCount + unreadGroupCount);
    }, [unreadPrivateCount, unreadGroupCount]);

    // Memoize these functions to prevent unnecessary re-renders
    const markConversationAsRead = useCallback((username: string) => {
        // Get the messages from the query cache
        const queryKey = ['messages', username];
        const cachedMessages = queryClient.getQueryData(queryKey) as any[] | undefined;

        if (cachedMessages) {
            // Find unread messages
            const unreadMessages = cachedMessages.filter(msg =>
                msg.receiver_id === currentUser?.user_id && !msg.seen
            );

            // Mark each unread message as seen using the API
            unreadMessages.forEach(msg => {
                markMessageSeen(msg.message_id, {
                    onSuccess: () => {
                        // The useMarkMessageSeen hook will invalidate the queries
                        // which will trigger a refetch of the messages
                    }
                });
            });

            // Update the unread count immediately for a better user experience
            setUnreadPrivateCount(prev => Math.max(0, prev - unreadMessages.length));
        }
    }, [currentUser, queryClient, markMessageSeen]);

    // Memoize this function to prevent unnecessary re-renders
    const markGroupChatAsRead = useCallback((chatId: string) => {
        // Update the last visit timestamp in local storage
        const lastVisitKey = `group_chat_${chatId}_last_visit`;
        localStorage.setItem(lastVisitKey, new Date().toISOString());

        // Update the unread count for this group chat
        const queryKey = ['groupChat', chatId];
        const cachedChatDetails = queryClient.getQueryData(queryKey) as any;

        if (cachedChatDetails && cachedChatDetails.messages) {
            // Recalculate unread messages for this chat (should be 0 now)
            const lastVisitTime = new Date().getTime();

            const unreadCount = cachedChatDetails.messages.filter((msg: any) =>
                msg.sender_id !== currentUser?.user_id &&
                new Date(msg.timestamp).getTime() > lastVisitTime
            ).length;

            // Update the unread count
            setUnreadGroupCount(prev => prev - (unreadCount > 0 ? unreadCount : 0));
        }
    }, [currentUser, queryClient]);

    // Memoize this function to prevent unnecessary re-renders
    const handleNewMessage = useCallback((payload: any) => {
        // This would be called when a new message is received via WebSocket
        if (payload.type === 'private_message' || payload.type === MessageType.PRIVATE_MESSAGE) {
            // Increment the unread count for private messages
            if (payload.receiver_id === currentUser?.user_id && !payload.seen) {
                setUnreadPrivateCount(prev => prev + 1);
            }

            // Invalidate the query to force a refetch
            const queryKey = ['messages', payload.sender_username || payload.sender_id];
            queryClient.invalidateQueries({ queryKey });
        } else if (payload.type === 'group_message' || payload.type === MessageType.GROUP_MESSAGE) {
            // Increment the unread count for group messages
            if (payload.sender_id !== currentUser?.user_id) {
                setUnreadGroupCount(prev => prev + 1);
            }

            // Invalidate the query to force a refetch
            const queryKey = ['groupChat', payload.group_chat_id];
            queryClient.invalidateQueries({ queryKey });
        }
    }, [currentUser, queryClient]);

    // Memoize the return value to prevent unnecessary re-renders
    return useMemo(() => ({
        unreadPrivateCount,
        unreadGroupCount,
        totalUnreadCount,
        isLoading,
        markConversationAsRead,
        markGroupChatAsRead,
        handleNewMessage,
        initializeUnreadCounts
    }), [
        unreadPrivateCount,
        unreadGroupCount,
        totalUnreadCount,
        isLoading,
        markConversationAsRead,
        markGroupChatAsRead,
        handleNewMessage,
        initializeUnreadCounts
    ]);
} 