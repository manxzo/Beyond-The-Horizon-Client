import { useState, useEffect } from "react";
import { Avatar, Badge } from "@heroui/react";
import { Clock, ArrowRight, Users } from "lucide-react";
import { useGroupChat } from "../hooks/useGroupChat";
import { useUser } from "../hooks/useUser";
import { useQuery } from "@tanstack/react-query";

interface GroupChatPreviewProps {
    chatId: string;
    onClick: () => void;
}

export default function GroupChatPreview({ chatId, onClick }: GroupChatPreviewProps) {
    const [lastMessage, setLastMessage] = useState<string>("");
    const [lastMessageTime, setLastMessageTime] = useState<string>("");
    const [hasUnread, setHasUnread] = useState(false);
    const [memberCount, setMemberCount] = useState<number>(0);
    const [chatName, setChatName] = useState<string>("Group Chat");
    const [chatType, setChatType] = useState<"regular" | "support" | "meeting">("regular");

    // Get group chat hooks
    const { getGroupChatDetails } = useGroupChat();

    // Get user hooks
    const { currentUser } = useUser();

    // Fetch group chat details
    const {
        data: chatDetailsResponse,
        isLoading: isLoadingChatDetails,
    } = useQuery(getGroupChatDetails(chatId));

    // Extract the actual chat details data from the response
    const chatDetails = chatDetailsResponse;

    // Update chat details when data changes
    useEffect(() => {
        if (chatDetails) {
            // Set member count
            if (chatDetails.members) {
                setMemberCount(chatDetails.members.length);
            }

            // Set chat name and type
            if (chatDetails.chat) {
                if (chatDetails.chat.support_group_id) {
                    setChatType("support");
                    setChatName(chatDetails.chat.support_group_name || "Support Group");
                } else if (chatDetails.chat.meeting_id) {
                    setChatType("meeting");
                    setChatName(chatDetails.chat.meeting_title || "Meeting Chat");
                } else {
                    setChatName(chatDetails.chat.name || "Group Chat");
                }
            }

            // Set last message and time
            if (chatDetails.messages && chatDetails.messages.length > 0) {
                const mostRecentMessage = chatDetails.messages[chatDetails.messages.length - 1];
                setLastMessage(mostRecentMessage.content || "");
                setLastMessageTime(mostRecentMessage.timestamp || "");

                // Check for unread messages (messages sent after the user's last seen timestamp)
                const userMember = chatDetails.members?.find(
                    (member: any) => member.user_id === currentUser?.user_id
                );

                if (userMember && userMember.last_read_at) {
                    const lastReadTime = new Date(userMember.last_read_at).getTime();
                    const hasUnreadMessages = chatDetails.messages.some(
                        (msg: any) =>
                            new Date(msg.timestamp).getTime() > lastReadTime &&
                            msg.sender_id !== currentUser?.user_id
                    );

                    setHasUnread(hasUnreadMessages);
                }
            }
        }
    }, [chatDetails, currentUser?.user_id]);

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

    // Get chat badge based on type
    const getChatBadge = () => {
        if (chatType === "support") {
            return <Badge color="secondary">Support Group</Badge>;
        } else if (chatType === "meeting") {
            return <Badge color="success">Meeting</Badge>;
        }
        return null;
    };

    // Show loading state or render group chat preview
    if (isLoadingChatDetails) {
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
        <button
            className="w-full text-left border rounded-lg p-4 hover:bg-default-100 cursor-pointer transition-colors"
            onClick={onClick}
            aria-label={`Group chat: ${chatName}${hasUnread ? ', has unread messages' : ''}`}
        >
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Avatar
                        icon={<Users size={20} />}
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
                <div className="flex-grow">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${hasUnread ? 'text-foreground' : ''}`}>
                                {chatName}
                                {hasUnread && <span className="sr-only"> (unread messages)</span>}
                            </h3>
                            {getChatBadge()}
                        </div>
                        <span className="text-small text-default-400 flex items-center gap-1">
                            <Clock size={14} aria-hidden="true" />
                            <span aria-label={`Last activity ${formatLastMessageTime(lastMessageTime)}`}>
                                {formatLastMessageTime(lastMessageTime)}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`text-sm truncate flex-grow ${hasUnread ? 'font-semibold text-foreground' : 'text-default-500'}`}>
                            {lastMessage || "No messages yet"}
                        </div>
                        <div className="text-default-500 text-sm flex items-center gap-1">
                            <Users size={14} aria-hidden="true" />
                            <span>{memberCount || "?"}</span>
                        </div>
                    </div>
                </div>
                <ArrowRight size={18} className="text-default-400" aria-hidden="true" />
            </div>
        </button>
    );
} 