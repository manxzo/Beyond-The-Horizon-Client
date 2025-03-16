import { useUser } from "../hooks/useUser";
import { Avatar } from "@heroui/react";
import { getLocalTimeZone } from "@internationalized/date";
export default function MessageBubble({
    message,
    isCurrentUser,
   
}: {
    message: any;
    isCurrentUser: boolean;
}) {

    const { useGetUserById } = useUser();
    const { data: user } = useGetUserById(message.sender_id);
    return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[80%]`}>
                {!isCurrentUser && (
                    <Avatar
                        name={(user?.username || 'U').charAt(0).toUpperCase()}
                        size="sm"
                    />
                )}
                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    {!isCurrentUser && (
                        <span className="text-small font-semibold mb-1">{user?.username || 'Unknown User'}</span>
                    )}
                    <div
                        className={`py-2 px-3 rounded-lg ${isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-default-100'
                            }`}
                    >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <span className="text-tiny text-default-400 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: getLocalTimeZone()
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
} 