import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardHeader,
    CardBody,
    Tabs,
    Tab,
    Spinner,
    Badge,
    Button,
} from "@heroui/react";
import {
    MessageSquare,
    Users,
    UserPlus,
} from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useMessage } from "../hooks/useMessage";
import { useGroupChat } from "../hooks/useGroupChat";
import { useUser } from "../hooks/useUser";
import { useUnreadMessages } from "../hooks/useUnreadMessages";
import ConversationPreview from "../components/ConversationPreview";
import GroupChatPreview from "../components/GroupChatPreview";
import { useWebSocket, MessageType } from "../contexts/WebSocketContext";

export default function Messages() {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState("private");

    // Get message hooks
    const { useGetConversations } = useMessage();

    // Get group chat hooks
    const { getGroupChats } = useGroupChat();

    // Get user hooks
    const { currentUser } = useUser();

    // Get unread message counts and functions
    const {
        unreadPrivateCount,
        unreadGroupCount,
        markConversationAsRead,
        markGroupChatAsRead,
        isLoading: _isLoadingUnreadCounts,
        handleNewMessage,
        initializeUnreadCounts
    } = useUnreadMessages();

    // Get WebSocket context
    const { addMessageListener } = useWebSocket();

    // Fetch private conversations
    const {
        data: conversationsData,
        isLoading: isLoadingConversations,
        error: conversationsError,
        refetch: refetchConversations
    } = useGetConversations();

    // Fetch group chats
    const {
        data: groupChatsData,
        isLoading: isLoadingGroupChats,
        error: groupChatsError,
        refetch: refetchGroupChats
    } = useQuery(getGroupChats());

    // Extract the actual data from the responses
    // conversationsData is an object with a usernames array
    const conversations = conversationsData?.usernames || [];
    const groupChats = groupChatsData || [];

    // Set up WebSocket listeners for new messages
    useEffect(() => {
        if (!currentUser) return;

        // Listen for private messages
        const removePrivateMessageListener = addMessageListener(MessageType.PRIVATE_MESSAGE, (payload) => {
            handleNewMessage(payload);
            refetchConversations();
        });

        // Listen for new message notifications
        const removeNewMessageListener = addMessageListener(MessageType.NEW_MESSAGE, (_payload) => {
            refetchConversations();
        });

        // Listen for group messages
        const removeGroupMessageListener = addMessageListener(MessageType.GROUP_MESSAGE, (payload) => {
            handleNewMessage(payload);
            refetchGroupChats();
        });

         
        return () => {
            removePrivateMessageListener();
            removeNewMessageListener();
            removeGroupMessageListener();
        };
    }, [currentUser, addMessageListener, handleNewMessage, refetchConversations, refetchGroupChats]);

    useEffect(() => {
        initializeUnreadCounts();
    }, [initializeUnreadCounts]);

    
    const handleOpenConversation = (username: string) => {
        markConversationAsRead(username);
        navigate(`/messages/conversation/${username}`);
    };

    // Handle opening a group chat
    const handleOpenGroupChat = (chatId: string) => {
        markGroupChatAsRead(chatId);

        // Navigate to the group chat
        navigate(`/group-chats/${chatId}`);
    };

 



    // Render loading state
    if (isLoadingConversations && isLoadingGroupChats) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-[70vh]" aria-live="polite" aria-busy="true">
                    <Spinner size="lg" color="primary" />
                    <span className="sr-only">Loading messages</span>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="py-4">
                <div className="flex items-center gap-4 mb-6">
                    <h1 className="text-3xl font-bold">Messages</h1>
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <Tabs
                            selectedKey={selectedTab}
                            onSelectionChange={(key) => setSelectedTab(key as string)}
                            aria-label="Message tabs"
                            variant="underlined"
                            classNames={{
                                tab: "h-12",
                            }}
                        >
                            <Tab
                                key="private"
                                title={
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={18} aria-hidden="true" />
                                        <span>Private Messages</span>
                                        {unreadPrivateCount > 0 ? (
                                            <Badge color="danger" variant="solid" size="sm">
                                                {unreadPrivateCount}
                                            </Badge>
                                        ) : conversations.length > 0 && (
                                            <Badge color="primary" variant="flat" size="sm">
                                                {conversations.length}
                                            </Badge>
                                        )}
                                    </div>
                                }
                            />
                            <Tab
                                key="group"
                                title={
                                    <div className="flex items-center gap-2">
                                        <Users size={18} aria-hidden="true" />
                                        <span>Group Chats</span>
                                        {unreadGroupCount > 0 ? (
                                            <Badge color="danger" variant="solid" size="sm">
                                                {unreadGroupCount}
                                            </Badge>
                                        ) : groupChats.length > 0 && (
                                            <Badge color="primary" variant="flat" size="sm">
                                                {groupChats.length}
                                            </Badge>
                                        )}
                                    </div>
                                }
                            />
                        </Tabs>
                    </CardHeader>
                    <CardBody>
                        {selectedTab === "private" ? (
                            <div className="flex flex-col gap-2" role="list" aria-label="Private conversations">
                                {conversationsError ? (
                                    <div className="text-center py-8" aria-live="assertive">
                                        <p className="text-danger">Error loading conversations</p>
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="text-center py-8" aria-live="polite">
                                        <MessageSquare size={48} className="mx-auto text-default-400 mb-4" aria-hidden="true" />
                                        <p className="text-xl font-medium mb-2">No conversations yet</p>
                                        <p className="text-default-500 mb-6">
                                            Start a new conversation with someone to connect.
                                        </p>
                                        <Button
                                            color="primary"
                                            startContent={<UserPlus size={18} aria-hidden="true" />}
                                            onPress={() => navigate("/feed")}
                                        >
                                            Find People
                                        </Button>
                                    </div>
                                ) : (
                                    conversations.map((username: string) => (
                                        <ConversationPreview
                                            key={username}
                                            username={username}
                                            onClick={() => handleOpenConversation(username)}
                                        />
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2" role="list" aria-label="Group chats">
                                {groupChatsError ? (
                                    <div className="text-center py-8" aria-live="assertive">
                                        <p className="text-danger">Error loading group chats</p>
                                    </div>
                                ) : groupChats.length === 0 ? (
                                    <div className="text-center py-8" aria-live="polite">
                                        <Users size={48} className="mx-auto text-default-400 mb-4" aria-hidden="true" />
                                        <p className="text-xl font-medium mb-2">No group chats yet</p>
                                        <p className="text-default-500 mb-6">
                                            Join a support group or meeting to access group chats.
                                        </p>
                                        <Button
                                            color="primary"
                                            startContent={<Users size={18} aria-hidden="true" />}
                                            onPress={() => navigate("/support-groups")}
                                        >
                                            Browse Support Groups
                                        </Button>
                                    </div>
                                ) : (
                                    groupChats.map((chat: any) => (
                                        <GroupChatPreview
                                            key={chat.group_chat_id}
                                            chatId={chat.group_chat_id}
                                            onClick={() => handleOpenGroupChat(chat.group_chat_id)}
                                        />
                                    ))
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </DefaultLayout>
    );
} 