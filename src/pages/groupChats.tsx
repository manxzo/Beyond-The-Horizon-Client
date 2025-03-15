import React, { useState, useEffect, useRef } from "react";
import { useGroupChat } from "../hooks/useGroupChat";
import { useUser } from "../hooks/useUser";
import { useWebSocketContext } from "../providers/WebSocketProvider";
import { WebSocketMessageType } from "../hooks/useWebSocket";
import { Container } from "../components/ui/container";
import { Heading } from "../components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Spinner } from "../components/ui/spinner";
import { ScrollArea } from "../components/ui/scroll-area";

const GroupChats: React.FC = () => {
    const { user } = useUser();
    const {
        getGroupChats,
        getGroupChatMessages,
        sendGroupChatMessage,
        isLoading
    } = useGroupChat();
    const { subscribe } = useWebSocketContext();

    const [groupChats, setGroupChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageText, setMessageText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchGroupChats = async () => {
            try {
                const data = await getGroupChats();
                setGroupChats(data || []);
                if (data && data.length > 0) {
                    setSelectedChat(data[0]);
                }
            } catch (error) {
                console.error("Failed to fetch group chats:", error);
            }
        };

        fetchGroupChats();
    }, [getGroupChats]);

    useEffect(() => {
        if (selectedChat) {
            const fetchMessages = async () => {
                try {
                    const data = await getGroupChatMessages(selectedChat.id);
                    setMessages(data || []);
                    scrollToBottom();
                } catch (error) {
                    console.error("Failed to fetch messages:", error);
                }
            };

            fetchMessages();

            // Subscribe to WebSocket for this chat
            const unsubscribe = subscribe(WebSocketMessageType.NEW_GROUP_MESSAGE, (message) => {
                // Only process messages for the selected chat
                if (message.payload.group_id === selectedChat.id) {
                    setMessages(prev => [...prev, message.payload]);
                    scrollToBottom();
                }
            });

            return () => {
                unsubscribe();
            };
        }
    }, [selectedChat, getGroupChatMessages, subscribe]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedChat) return;

        try {
            await sendGroupChatMessage(selectedChat.id, messageText);
            setMessageText("");
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Container className="py-10">
            <Heading level="h1" className="mb-6">Group Chats</Heading>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Chat list */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Your Groups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Spinner size="lg" />
                            </div>
                        ) : groupChats.length > 0 ? (
                            <div className="space-y-2">
                                {/* Placeholder group chats */}
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <div
                                        key={item}
                                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted ${selectedChat?.id === `chat-${item}` ? "bg-muted" : ""
                                            }`}
                                        onClick={() => setSelectedChat({ id: `chat-${item}`, name: `Group Chat ${item}` })}
                                    >
                                        <Avatar fallback={`G${item}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">Group Chat {item}</div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                Last message preview...
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">No group chats found.</p>
                                <Button className="mt-4">Create a Group Chat</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Chat messages */}
                <Card className="md:col-span-2">
                    <CardHeader className="border-b">
                        <CardTitle>
                            {selectedChat ? selectedChat.name : "Select a chat"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col h-[600px]">
                        {selectedChat ? (
                            <>
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-4">
                                        {/* Placeholder messages */}
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
                                            const isCurrentUser = item % 2 === 0;
                                            return (
                                                <div
                                                    key={item}
                                                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div className="flex gap-3 max-w-[80%]">
                                                        {!isCurrentUser && <Avatar fallback="U" />}
                                                        <div>
                                                            {!isCurrentUser && (
                                                                <div className="text-sm font-medium mb-1">User {item}</div>
                                                            )}
                                                            <div
                                                                className={`p-3 rounded-lg ${isCurrentUser
                                                                        ? "bg-primary text-primary-foreground"
                                                                        : "bg-muted"
                                                                    }`}
                                                            >
                                                                <p>This is a placeholder message in the group chat.</p>
                                                                <div
                                                                    className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
                                                                        }`}
                                                                >
                                                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>
                                <div className="p-4 border-t mt-auto">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Type a message..."
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                        />
                                        <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground">Select a chat to start messaging</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
};

export default GroupChats; 