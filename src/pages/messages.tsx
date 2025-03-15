import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Avatar,
    Button,
    Input,
    Spinner,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Tooltip,
    Textarea,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from "@heroui/react";
import { useUser } from "@/hooks/useUser";
import { useMessage } from "@/hooks/useMessage";
import { useWebSocket, WebSocketMessage, WebSocketMessageType } from "@/hooks/useWebSocket";
import DefaultLayout from "@/layouts/default";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";

// Icons
import {
    Send as SendIcon,
    MoreVertical as MoreVerticalIcon,
    Edit as EditIcon,
    Trash as TrashIcon,
    Flag as FlagIcon,
    Check as CheckIcon
} from "lucide-react";

// Message interface
interface Message {
    message_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    timestamp: string;
    deleted: boolean;
    edited: boolean;
    seen_at: string | null;
}

// Conversation interface
interface Conversation {
    username: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
}

// Define a type that includes all possible message types
type MessageType = WebSocketMessageType | string;

const Messages = () => {
    const { username } = useParams<{ username?: string }>();
    const navigate = useNavigate();
    const { currentUser, isAuthenticated, isCheckingAuth } = useUser();
    const {
        getConversations,
        getMessages,
        sendMessage,
        markMessageSeen,
        editMessage,
        deleteMessage,
        reportMessage,
    } = useMessage();

    const { isConnected } = useWebSocket({
        onMessage: (message: WebSocketMessage) => {
            // Use type assertion to handle all message types
            const messageType = message.type as MessageType;

            // Skip authentication messages
            if (
                messageType === WebSocketMessageType.AUTHENTICATION_SUCCESS ||
                messageType === WebSocketMessageType.AUTHENTICATION_ERROR ||
                messageType === 'authentication_success' ||
                messageType === 'authentication_error'
            ) {
                return;
            }

            if (
                messageType === WebSocketMessageType.NEW_MESSAGE ||
                messageType === WebSocketMessageType.MESSAGE_READ ||
                messageType === WebSocketMessageType.EDITED_MESSAGE ||
                messageType === WebSocketMessageType.DELETED_MESSAGE ||
                messageType === WebSocketMessageType.SEEN_MESSAGE ||
                messageType === 'new_message' ||
                messageType === 'message_read' ||
                messageType === 'edited_message' ||
                messageType === 'deleted_message' ||
                messageType === 'seen_message'
            ) {
                // Refresh messages if we're in the relevant conversation
                if (
                    activeConversation === message.payload.sender_username ||
                    activeConversation === message.payload.receiver_username
                ) {
                    refetchMessages();
                }
                // Always refresh conversations list
                refetchConversations();
            }
        },
    });

    // State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [activeConversation, setActiveConversation] = useState<string | null>(
        username || null
    );
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editMessageContent, setEditMessageContent] = useState("");
    const [reportReason, setReportReason] = useState("");
    const [reportingMessageId, setReportingMessageId] = useState<string | null>(
        null
    );

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null);

    // Modal controls
    const {
        isOpen: isReportModalOpen,
        onOpen: openReportModal,
        onClose: closeReportModal,
    } = useDisclosure();

    // Fetch conversations
    const {
        data: conversationsResponse,
        isLoading: isLoadingConversations,
        refetch: refetchConversations
    } = useQuery({
        ...getConversations(),
        enabled: isAuthenticated
    });

    // Fetch messages for the selected conversation
    const {
        data: messagesResponse,
        isLoading: isLoadingMessages,
        refetch: refetchMessages
    } = useQuery({
        ...getMessages(activeConversation || ''),
        enabled: !!activeConversation && isAuthenticated
    });

    // Refetch data when component mounts or when username changes
    useEffect(() => {
        if (isAuthenticated) {
            refetchConversations();
            if (activeConversation) {
                refetchMessages();
            }
        }
    }, [refetchConversations, refetchMessages, activeConversation, isAuthenticated]);

    // Process conversations data
    useEffect(() => {
        if (conversationsResponse?.data?.usernames) {
            setConversations(
                conversationsResponse.data.usernames.map((username: string) => ({ username }))
            );
        } else {
            setConversations([]);
        }
    }, [conversationsResponse]);

    // Process messages data and mark unread messages as seen
    useEffect(() => {
        if (messagesResponse?.data && Array.isArray(messagesResponse.data) && activeConversation) {
            setMessages(messagesResponse.data);

            // Mark unread messages as seen
            const unreadMessages = messagesResponse.data.filter(
                (msg: Message) =>
                    msg.receiver_id === currentUser?.user_id &&
                    !msg.seen_at
            );

            for (const msg of unreadMessages) {
                markMessageSeen({ messageId: msg.message_id, username: activeConversation });
            }
        } else {
            setMessages([]);
        }
    }, [messagesResponse, activeConversation, currentUser]);

    // Handle sending a message
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !activeConversation) return;

        try {
            await sendMessage({
                receiverUsername: activeConversation,
                content: messageInput,
            });
            setMessageInput("");
            refetchMessages();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // Handle editing a message
    const handleStartEditMessage = (message: Message) => {
        setEditingMessageId(message.message_id);
        setEditMessageContent(message.content);
    };

    const handleSaveEditMessage = async () => {
        if (!editingMessageId || !editMessageContent.trim() || !activeConversation) return;

        try {
            await editMessage({
                messageId: editingMessageId,
                content: editMessageContent,
                username: activeConversation,
            });
            setEditingMessageId(null);
            setEditMessageContent("");
            refetchMessages();
        } catch (error) {
            console.error("Error editing message:", error);
        }
    };

    const handleCancelEditMessage = () => {
        setEditingMessageId(null);
        setEditMessageContent("");
    };

    // Handle deleting a message
    const handleDeleteMessage = async (messageId: string) => {
        if (!activeConversation) return;

        try {
            await deleteMessage({
                messageId,
                username: activeConversation,
            });
            refetchMessages();
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    // Handle reporting a message
    const handleOpenReportModal = (messageId: string) => {
        setReportingMessageId(messageId);
        openReportModal();
    };

    const handleSubmitReport = async () => {
        if (!reportingMessageId || !reportReason.trim() || !activeConversation) return;

        try {
            await reportMessage({
                messageId: reportingMessageId,
                reason: reportReason,
            });

            setReportingMessageId(null);
            setReportReason("");
            closeReportModal();
        } catch (error) {
            console.error("Error reporting message:", error);
        }
    };

    // Select a conversation
    const selectConversation = (username: string) => {
        setActiveConversation(username);
        navigate(`/messages/${username}`);
    };

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Initial load
    useEffect(() => {
        if (isAuthenticated) {
            refetchConversations();
        }
    }, [isAuthenticated]);

    // Load messages when active conversation changes
    useEffect(() => {
        if (activeConversation) {
            refetchMessages();
        }
    }, [activeConversation]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Update URL when active conversation changes
    useEffect(() => {
        if (username && username !== activeConversation) {
            setActiveConversation(username);
        }
    }, [username]);

    // Loading state
    if (isCheckingAuth) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                    <Spinner size="lg" />
                </div>
            </DefaultLayout>
        );
    }

    // Not authenticated
    if (!isAuthenticated) {
        return (
            <DefaultLayout>
                <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
                    <h1 className="text-2xl font-bold mb-4">Please log in to view messages</h1>
                    <Button color="primary" onClick={() => navigate("/login")}>
                        Go to Login
                    </Button>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
                {/* Conversations List */}
                <Card className="md:col-span-1 h-full">
                    <CardHeader className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Conversations</h2>
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <Tooltip content="Connected">
                                    <div className="w-3 h-3 rounded-full bg-success"></div>
                                </Tooltip>
                            ) : (
                                <Tooltip content="Disconnected">
                                    <div className="w-3 h-3 rounded-full bg-danger"></div>
                                </Tooltip>
                            )}
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="overflow-y-auto">
                        {isLoadingConversations ? (
                            <div className="flex justify-center py-4">
                                <Spinner />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-4 text-default-500">
                                No conversations yet
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {conversations.map((conversation) => (
                                    <li key={conversation.username}>
                                        <Button
                                            variant={
                                                activeConversation === conversation.username
                                                    ? "solid"
                                                    : "ghost"
                                            }
                                            color={
                                                activeConversation === conversation.username
                                                    ? "primary"
                                                    : "default"
                                            }
                                            className="w-full justify-start"
                                            onClick={() => selectConversation(conversation.username)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={conversation.username}
                                                    size="sm"
                                                    className="flex-shrink-0"
                                                />
                                                <div className="flex-grow truncate text-left">
                                                    <p className="font-medium">{conversation.username}</p>
                                                </div>
                                            </div>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardBody>
                </Card>

                {/* Messages */}
                <Card className="md:col-span-3 h-full flex flex-col">
                    {activeConversation ? (
                        <>
                            <CardHeader className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Avatar name={activeConversation} size="sm" />
                                    <h2 className="text-xl font-bold">{activeConversation}</h2>
                                </div>
                            </CardHeader>
                            <Divider />
                            <CardBody className="flex-grow overflow-y-auto p-4">
                                <div ref={messageContainerRef} className="h-full overflow-y-auto">
                                    {isLoadingMessages ? (
                                        <div className="flex justify-center py-4">
                                            <Spinner />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center py-4 text-default-500">
                                            No messages yet. Start a conversation!
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {messages.map((message) => {
                                                const isCurrentUser =
                                                    message.sender_id === currentUser?.user_id;
                                                return (
                                                    <div
                                                        key={message.message_id}
                                                        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"
                                                            }`}
                                                    >
                                                        <div
                                                            className={`max-w-[80%] ${isCurrentUser
                                                                ? "bg-primary text-white"
                                                                : "bg-default-100"
                                                                } rounded-lg p-3 relative group`}
                                                        >
                                                            {message.deleted ? (
                                                                <p className="italic text-default-400">
                                                                    This message has been deleted
                                                                </p>
                                                            ) : editingMessageId === message.message_id ? (
                                                                <div className="space-y-2">
                                                                    <Textarea
                                                                        value={editMessageContent}
                                                                        onChange={(e) =>
                                                                            setEditMessageContent(e.target.value)
                                                                        }
                                                                        className="min-w-[300px]"
                                                                    />
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={handleCancelEditMessage}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            color="primary"
                                                                            onClick={handleSaveEditMessage}
                                                                        >
                                                                            Save
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p>{message.content}</p>
                                                                    <div className="flex justify-between items-center mt-1 text-xs">
                                                                        <span
                                                                            className={`${isCurrentUser
                                                                                ? "text-white/70"
                                                                                : "text-default-400"
                                                                                }`}
                                                                        >
                                                                            {formatDistanceToNow(
                                                                                new Date(message.timestamp),
                                                                                { addSuffix: true }
                                                                            )}
                                                                            {message.edited && " (edited)"}
                                                                        </span>
                                                                        {isCurrentUser && message.seen_at && (
                                                                            <span
                                                                                className={`${isCurrentUser
                                                                                    ? "text-white/70"
                                                                                    : "text-default-400"
                                                                                    } ml-2 flex items-center`}
                                                                            >
                                                                                <CheckIcon className="w-3 h-3 mr-1" />
                                                                                Seen
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {/* Message actions */}
                                                                    {!message.deleted && (
                                                                        <div
                                                                            className={`absolute ${isCurrentUser ? "left-0" : "right-0"
                                                                                } top-0 -translate-y-1/2 ${isCurrentUser
                                                                                    ? "-translate-x-full"
                                                                                    : "translate-x-full"
                                                                                } opacity-0 group-hover:opacity-100 transition-opacity`}
                                                                        >
                                                                            <Dropdown>
                                                                                <DropdownTrigger>
                                                                                    <Button
                                                                                        isIconOnly
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        className="text-default-400"
                                                                                    >
                                                                                        <MoreVerticalIcon className="w-4 h-4" />
                                                                                    </Button>
                                                                                </DropdownTrigger>
                                                                                <DropdownMenu>
                                                                                    {isCurrentUser ? (
                                                                                        <>
                                                                                            <DropdownItem
                                                                                                key="edit"
                                                                                                startContent={
                                                                                                    <EditIcon className="w-4 h-4" />
                                                                                                }
                                                                                                onClick={() =>
                                                                                                    handleStartEditMessage(message)
                                                                                                }
                                                                                            >
                                                                                                Edit
                                                                                            </DropdownItem>
                                                                                            <DropdownItem
                                                                                                key="delete"
                                                                                                startContent={
                                                                                                    <TrashIcon className="w-4 h-4" />
                                                                                                }
                                                                                                className="text-danger"
                                                                                                onClick={() =>
                                                                                                    handleDeleteMessage(
                                                                                                        message.message_id
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                Delete
                                                                                            </DropdownItem>
                                                                                        </>
                                                                                    ) : (
                                                                                        <DropdownItem
                                                                                            key="report"
                                                                                            startContent={
                                                                                                <FlagIcon className="w-4 h-4" />
                                                                                            }
                                                                                            className="text-warning"
                                                                                            onClick={() =>
                                                                                                handleOpenReportModal(
                                                                                                    message.message_id
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            Report
                                                                                        </DropdownItem>
                                                                                    )}
                                                                                </DropdownMenu>
                                                                            </Dropdown>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                            <Divider />
                            <div className="p-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="flex-grow"
                                    />
                                    <Button
                                        isIconOnly
                                        color="primary"
                                        onClick={handleSendMessage}
                                        isDisabled={!messageInput.trim()}
                                    >
                                        <SendIcon className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col justify-center items-center h-full">
                            <h3 className="text-xl font-medium mb-2">
                                Select a conversation to start chatting
                            </h3>
                            <p className="text-default-500">
                                Choose a conversation from the list on the left
                            </p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Report Message Modal */}
            <Modal isOpen={isReportModalOpen} onClose={closeReportModal}>
                <ModalContent>
                    <ModalHeader>Report Message</ModalHeader>
                    <ModalBody>
                        <p className="mb-4">
                            Please provide a reason for reporting this message:
                        </p>
                        <Textarea
                            placeholder="Explain why you're reporting this message..."
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            minRows={3}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={closeReportModal}>
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onClick={handleSubmitReport}
                            isDisabled={!reportReason.trim()}
                        >
                            Submit Report
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </DefaultLayout>
    );
}

export default Messages;
