import { useState, useEffect } from "react";
import { Avatar, Badge, Button } from "@heroui/react";
import { Clock, ArrowRight, User } from "lucide-react";
import { useUser } from "../hooks/useUser";
import { useMessage } from "../hooks/useMessage";
import { useNavigate } from "react-router-dom";

interface ConversationPreviewProps {
    username: string;
    onClick: () => void;
}

export default function ConversationPreview({ username, onClick }: ConversationPreviewProps) {
    const navigate = useNavigate();
    const [lastMessage, setLastMessage] = useState<string>("");
    const [lastMessageTime, setLastMessageTime] = useState<string>("");
    const [hasUnread, setHasUnread] = useState(false);
    const { useGetUserByName, currentUser } = useUser();
    const { useGetMessages } = useMessage();

    // Fetch user details
    const {
        data: userData,
        isLoading: isLoadingUser,
    } = useGetUserByName(username);

    // Fetch messages for this conversation
    const {
        data: messagesData,
        isLoading: isLoadingMessages,
    } = useGetMessages(username);

    // Extract the actual messages from the response
    const messages = messagesData || [];

    // Update last message and unread status when messages change
    useEffect(() => {
        if (messages.length > 0) {
            const mostRecentMessage = messages[messages.length - 1];
            setLastMessage(mostRecentMessage.content || "");
            setLastMessageTime(mostRecentMessage.timestamp || "");

            // Check for unread messages (messages sent to current user that haven't been seen)
            const hasUnreadMessages = messages.some(
                (msg: any) =>
                    msg.receiver_id === currentUser?.user_id &&
                    !msg.seen
            );

            setHasUnread(hasUnreadMessages);
        }
    }, [messages, currentUser?.user_id]);

    // Format the last message time
    const formatLastMessageTime = (timestamp: string) => {
        if (!timestamp) return "";

        const messageDate = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - messageDate.getTime();
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMs / 3600000);
        const diffDays = Math.round(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return messageDate.toLocaleDateString();
    };

    // Handle view profile click
    const handleViewProfile = () => {
        navigate(`/users/${username}`);
    };

    // Show loading state or render conversation preview
    if (isLoadingUser || isLoadingMessages) {
        return (
            <div className="w-full text-left border rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-default-200"></div>
                    <div className="flex-grow">
                        <div className="h-4 bg-default-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-default-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full text-left border rounded-lg p-4 hover:bg-default-100 transition-colors">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar
                        name={(userData?.username || username || "U").charAt(0).toUpperCase()}
                        src={userData?.avatar_url}
                        size="md"
                        aria-hidden="true"
                    />
                    {hasUnread && (
                        <Badge
                            color="danger"
                            placement="bottom-right"
                            size="sm"
                            className="absolute"
                        >
                            <span className="sr-only">Unread messages</span>
                        </Badge>
                    )}
                </div>
                <Button
                    className="flex-grow text-left justify-start h-auto p-0 bg-transparent min-w-0"
                    onPress={onClick}
                    variant="light"
                >
                    <div className="w-full">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">
                                {userData?.username || username}
                                {hasUnread && <span className="sr-only"> (unread messages)</span>}
                            </h3>
                            <span className="text-small text-default-400 flex items-center gap-1">
                                <Clock size={14} aria-hidden="true" />
                                <span aria-label={`Last message ${formatLastMessageTime(lastMessageTime)}`}>
                                    {formatLastMessageTime(lastMessageTime)}
                                </span>
                            </span>
                        </div>
                        <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-foreground' : 'text-default-500'}`}>
                            {lastMessage || "No messages yet"}
                        </p>
                    </div>
                </Button>
                <div className="flex gap-2">
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={handleViewProfile}
                        aria-label={`View ${username}'s profile`}
                    >
                        <User size={18} />
                    </Button>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={onClick}
                        aria-label={`Open conversation with ${username}`}
                    >
                        <ArrowRight size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
} 