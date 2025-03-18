import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardBody,
    CardFooter,
    Button,
    Spinner,
    Divider,
    Avatar,
    Input,
    Chip,
} from "@heroui/react";
import {
    Send,
    ArrowLeft,
    MessageSquare,
} from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useMessage } from "../hooks/useMessage";
import { useUser } from "../hooks/useUser";
import { useUnreadMessages } from "../hooks/useUnreadMessages";
import MessageBubble from "../components/MessageBubble";

import { useWebSocket, MessageType } from "../contexts/WebSocketContext";

export default function Conversation() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [newMessage, setNewMessage] = useState("");

    // Get message hooks
    const { useGetMessages, useSendMessage } = useMessage();

    // Get user hooks
    const { currentUser, useGetUserByName } = useUser();

    // Get unread message functions
    const { markConversationAsRead, handleNewMessage } = useUnreadMessages();

    // Get WebSocket context
    const { addMessageListener } = useWebSocket();

    // Get the send message mutation
    const { mutate: sendMessage, isPending: isSendingMessage } = useSendMessage();

    // Fetch messages for this conversation
    const {
        data: messagesData,
        isLoading: isLoadingMessages,
        error: messagesError,
        refetch: refetchMessages,
    } = useGetMessages(username || '');

    // Fetch user details
    const {
        data: userData,
        isLoading: isLoadingUser,
    } = useGetUserByName(username || '');

    // Extract the actual messages from the response
    const messages = messagesData || [];

    // Mark conversation as read when component mounts or username changes
    useEffect(() => {
        if (username) {
            markConversationAsRead(username);
        }
    }, [username, markConversationAsRead]);

    // Set up WebSocket listener for new private messages
    useEffect(() => {
        if (!username || !currentUser) return;

        // Add listener for private messages
        const removeListener = addMessageListener(MessageType.PRIVATE_MESSAGE, (payload) => {
            // Check if this message is part of the current conversation
            if ((payload.sender_username === username && payload.receiver_id === currentUser.user_id) ||
                (payload.receiver_username === username && payload.sender_id === currentUser.user_id)) {
                // Update unread message count
                handleNewMessage(payload);
                // Refetch messages to update the UI
                refetchMessages();
            }
        });

        // Also listen for the NEW_MESSAGE type which might be sent by the server
        const removeNewMessageListener = addMessageListener(MessageType.NEW_MESSAGE, (payload) => {
            if (payload.sender_username === username || payload.receiver_username === username) {
                refetchMessages();
            }
        });

        // Clean up listeners when component unmounts
        return () => {
            removeListener();
            removeNewMessageListener();
        };
    }, [username, currentUser, addMessageListener, refetchMessages, handleNewMessage]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle sending a new message
    const handleSendMessage = () => {
        if (newMessage.trim() && username) {
            sendMessage(
                { receiverUsername: username, content: newMessage.trim() },
                {
                    onSuccess: () => {
                        setNewMessage("");
                        // Refetch messages to get the updated list
                        refetchMessages();
                    },
                }
            );
        }
    };

    // Handle key press (Enter to send)
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Handle navigating back
    const handleBack = () => {
        navigate('/messages');
    };

    // Format date for message grouping
    const formatMessageDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
            });
        }
    };

    // Group messages by date
    const groupMessagesByDate = (messages: any[]) => {
        const groups: { [key: string]: any[] } = {};

        messages.forEach(message => {
            const date = formatMessageDate(message.timestamp);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });

        return groups;
    };

    // Group the messages by date
    const groupedMessages = groupMessagesByDate(messages);

    // Render loading state
    if (isLoadingMessages || isLoadingUser) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-[70vh]" aria-live="polite" aria-busy="true">
                    <Spinner size="lg" color="primary" />
                    <span className="sr-only">Loading conversation</span>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="py-4 h-screen flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                    <Button
                        variant="flat"
                        isIconOnly
                        onPress={handleBack}
                        aria-label="Go back to messages"
                    >
                        <ArrowLeft size={20} aria-hidden="true" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <Avatar
                            name={(userData?.username || "U").charAt(0).toUpperCase()}
                            src={userData?.avatar_url}
                            size="md"
                            aria-hidden="true"
                        />
                        <div>
                            <h1 className="text-2xl font-bold">{userData?.username || username}</h1>
                            {userData?.full_name && (
                                <p className="text-default-500">{userData.full_name}</p>
                            )}
                        </div>
                    </div>
                </div>

                <Card className="flex-grow flex flex-col h-[calc(100vh-180px)]">
                    <CardBody className="flex-grow overflow-y-auto p-4">
                        {messagesError ? (
                            <div className="flex flex-col items-center justify-center h-full text-center" aria-live="assertive">
                                <p className="text-danger">Error loading messages</p>
                                <Button
                                    color="primary"
                                    variant="flat"
                                    onPress={() => refetchMessages()}
                                    className="mt-4"
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : messages.length > 0 ? (
                            <div className="flex flex-col gap-4" role="log" aria-label="Conversation messages" aria-live="polite">
                                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                                    <div key={date}>
                                        <div className="flex justify-center my-4">
                                            <Chip variant="flat">{date}</Chip>
                                        </div>
                                        {dateMessages.map((message) => (
                                            <MessageBubble
                                                key={message.message_id}
                                                message={message}
                                                isCurrentUser={message.sender_id === currentUser?.user_id}
                                                onMessageUpdated={refetchMessages}
                                            />
                                        ))}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center" aria-live="polite">
                                <MessageSquare size={48} className="text-default-400 mb-4" aria-hidden="true" />
                                <p className="text-xl font-medium mb-2">No messages yet</p>
                                <p className="text-default-500">
                                    Send a message to start the conversation!
                                </p>
                            </div>
                        )}
                    </CardBody>
                    <Divider />
                    <CardFooter className="p-2">
                        <div className="flex w-full gap-2">
                            <Input
                                fullWidth
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                aria-label="Message input"
                            />
                            <Button
                                color="primary"
                                isIconOnly
                                onPress={handleSendMessage}
                                isDisabled={!newMessage.trim() || isSendingMessage}
                                isLoading={isSendingMessage}
                                aria-label="Send message"
                            >
                                <Send size={20} aria-hidden="true" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </DefaultLayout>
    );
} 