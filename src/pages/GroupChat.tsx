import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Spinner,
  Divider,
  Avatar,
  Input,
  Chip,
  Badge,
} from "@heroui/react";
import {
  Users,
  Send,
  ArrowLeft,
  AlertTriangle,
  MessageSquare,
  Info,
} from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useGroupChat } from "../hooks/useGroupChat";
import { useUser } from "../hooks/useUser";
import { useUnreadMessages } from "../hooks/useUnreadMessages";
// Import WebSocket context
import { useWebSocket, MessageType } from "../contexts/WebSocketContext";

import MessageBubble from "../components/MessageBubble";


export default function GroupChat() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isMeetingChat, setIsMeetingChat] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
 

  // Get group chat hooks
  const {
    getGroupChatDetails,
    sendGroupChatMessage,
    isSendingGroupChatMessage: isSendingMessage,
  } = useGroupChat();

  // Get user hooks
  const { currentUser } = useUser();

  // Get unread message functions
  const { markGroupChatAsRead, handleNewMessage } = useUnreadMessages();

  // Get WebSocket context
  const { addMessageListener } = useWebSocket();

  // Fetch group chat details
  const {
    data: chatDetailsResponse,
    isLoading: isLoadingChatDetails,
    error: chatDetailsError,
    refetch: refetchChatDetails,
  } = useQuery(getGroupChatDetails(chatId || ''));

  // Extract the actual chat details data from the response
  const chatDetails = chatDetailsResponse;

  // Access the chat properties
  const messages = chatDetails?.messages || [];
  const members = chatDetails?.members || [];

  // Mark group chat as read when component mounts or chatId changes
  useEffect(() => {
    if (chatId) {
      markGroupChatAsRead(chatId);
    }
  }, [chatId, markGroupChatAsRead]);

  // Set up WebSocket listener for new group messages
  useEffect(() => {
    if (!chatId || !currentUser) return;

    // Add listener for group messages
    const removeGroupMessageListener = addMessageListener(MessageType.GROUP_MESSAGE, (payload) => {
      // Check if this message is for the current group chat
      if (payload.group_chat_id === chatId) {
        // Update unread message count
        handleNewMessage(payload);
        // Refetch chat details to update the UI
        refetchChatDetails();
      }
    });

    // Also listen for meeting updates if this is a meeting chat
    const removeMeetingUpdateListener = addMessageListener(MessageType.MEETING_UPDATE, (payload) => {
      if (payload.meeting_id === meetingId) {
        // Refetch chat details to update the UI
        refetchChatDetails();
      }
    });

    // Clean up listeners when component unmounts
    return () => {
      removeGroupMessageListener();
      removeMeetingUpdateListener();
    };
  }, [chatId, meetingId, currentUser, addMessageListener, refetchChatDetails, handleNewMessage]);

  // Check if this is a meeting chat
  useEffect(() => {
    // This is a simplified check - in a real app, you'd have a more robust way to determine this
    const meetingId = chatDetails?.chat?.meeting_id;
    if (meetingId) {
      setIsMeetingChat(true);
      setMeetingId(meetingId);
    }
  }, [chatDetails]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim() && chatId) {
      sendGroupChatMessage({
        chatId: chatId,
        content: newMessage.trim(),
      });
      setNewMessage("");
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
    if (isMeetingChat && meetingId) {
      navigate(`/meetings/${meetingId}`);
    } else {
      navigate(-1);
    }
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

  if (isLoadingChatDetails) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-[70vh]">
          <Spinner size="lg" color="primary" />
        </div>
      </DefaultLayout>
    );
  }

  if (chatDetailsError) {
    return (
      <DefaultLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <AlertTriangle size={48} className="text-danger mb-4" />
          <h2 className="text-2xl font-bold mb-4">Error Loading Chat</h2>
          <p className="text-danger mb-6">
            {(chatDetailsError as Error)?.message || "Failed to load chat details"}
          </p>
          <div className="flex gap-4">
            <Button color="primary" onPress={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="flat" onPress={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const groupedMessages = messages ? groupMessagesByDate(messages) : {};

  return (
    <DefaultLayout>
      <div className="py-4 h-screen flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="flat"
            isIconOnly
            onPress={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare size={24} />
            {isMeetingChat ? 'Meeting Chat' : 'Group Chat'}
            {isMeetingChat && <Badge color="success">Live</Badge>}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-grow overflow-hidden">
          {/* Chat messages */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <Card className="flex-grow flex flex-col h-[calc(100vh-180px)]">
              <CardBody className="flex-grow overflow-y-auto p-4">
                {messages && messages.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                      <div key={date}>
                        <div className="flex justify-center my-4">
                          <Chip variant="flat">{date}</Chip>
                        </div>
                        {dateMessages.map((message) => (
                          <MessageBubble
                            key={message.group_chat_message_id}
                            message={message}
                            isCurrentUser={message.sender_id === currentUser?.user_id}
                          />
                        ))}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={48} className="text-default-400 mb-4" />
                    <p className="text-xl font-medium mb-2">No messages yet</p>
                    <p className="text-default-500">
                      Be the first to send a message in this chat!
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
                  />
                  <Button
                    color="primary"
                    isIconOnly
                    onPress={handleSendMessage}
                    isDisabled={!newMessage.trim() || isSendingMessage}
                    isLoading={isSendingMessage}
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Members sidebar */}
          <div className="hidden lg:block">
            <Card className="h-[calc(100vh-180px)]">
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users size={18} />
                  <span>Members</span>
                  <span className="ml-1 text-small">({members?.length || 0})</span>
                </h3>
              </CardHeader>
              <Divider />
              <CardBody className="overflow-y-auto">
                {members && members.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {members.map((member: any) => (
                      <div key={member.user_id} className="flex items-center gap-3">
                        <Avatar
                          name={(currentUser?.username || 'U').charAt(0).toUpperCase()}
                          size="sm"
                        />
                        <div>
                          <p className="font-semibold">{currentUser?.username || 'Unknown User'}</p>
                          {currentUser?.role && (
                            <p className="text-tiny text-default-500 capitalize">{currentUser.role}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Users size={36} className="text-default-400 mb-3" />
                    <p className="text-default-500 text-center">No members found</p>
                  </div>
                )}
              </CardBody>
              {isMeetingChat && (
                <>
                  <Divider />
                  <CardFooter>
                    <div className="flex items-center gap-2 text-small text-default-500">
                      <Info size={16} />
                      <p>This is a meeting chat</p>
                    </div>
                  </CardFooter>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}

