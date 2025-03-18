import { useUser } from "../hooks/useUser";
import { useState } from "react";
import {
    Avatar,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Textarea,
    useDisclosure
} from "@heroui/react";
import { getLocalTimeZone } from "@internationalized/date";
import { MoreVertical, Edit, Trash, Flag,EyeIcon } from "lucide-react";
import { useMessage } from "../hooks/useMessage";
import { useReport } from "../hooks/useReport";
import { ReportedType } from "../interfaces/enums";

export default function MessageBubble({
    message,
    isCurrentUser,
    onMessageUpdated
}: {
    message: any;
    isCurrentUser: boolean;
    onMessageUpdated?: () => void;
}) {
    const { useGetUserById } = useUser();
    const { data: user } = useGetUserById(message.sender_id);
    const { useEditMessage, useDeleteMessage } = useMessage();
    const { createReport, isCreatingReport } = useReport();

    // Edit message state
    const [editContent, setEditContent] = useState(message.content);
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

    // Delete message state
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

    // Report message state
    const [reportReason, setReportReason] = useState("");
    const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();

    // Get mutations
    const { mutate: editMessage, isPending: isEditing } = useEditMessage();
    const { mutate: deleteMessage, isPending: isDeleting } = useDeleteMessage();

    // Handle edit message
    const handleEditMessage = () => {
        if (!editContent.trim()) return;

        editMessage(
            { messageId: message.message_id, content: editContent },
            {
                onSuccess: () => {
                    onEditClose();
                    if (onMessageUpdated) onMessageUpdated();
                }
            }
        );
    };

    // Handle delete message
    const handleDeleteMessage = () => {
        deleteMessage(
            message.message_id,
            {
                onSuccess: () => {
                    onDeleteClose();
                    if (onMessageUpdated) onMessageUpdated();
                }
            }
        );
    };

    // Handle report message
    const handleReportMessage = () => {
        if (!reportReason.trim()) return;

        createReport({
            reported_user_id: message.sender_id,
            reason: reportReason,
            reported_type: ReportedType.Message,
            reported_item_id: message.message_id
        });

        setReportReason("");
        onReportClose();
    };

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
                    <div className="flex items-center gap-2">
                        {!isCurrentUser && (
                            <span className="text-small font-semibold mb-1">{user?.username || 'Unknown User'}</span>
                        )}

                        {/* Message options dropdown */}
                        <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light" className="h-6 w-6 min-w-0">
                                    <MoreVertical size={14} />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Message actions">
                                {isCurrentUser ? (
                                    <>
                                        <DropdownItem
                                            key="edit"
                                            startContent={<Edit size={16} />}
                                            onPress={onEditOpen}
                                        >
                                            Edit
                                        </DropdownItem>
                                        <DropdownItem
                                            key="delete"
                                            startContent={<Trash size={16} />}
                                            className="text-danger"
                                            onPress={onDeleteOpen}
                                        >
                                            Delete
                                        </DropdownItem>
                                    </>
                                ) : (
                                    <DropdownItem
                                        key="report"
                                        startContent={<Flag size={16} />}
                                        className="text-warning"
                                        onPress={onReportOpen}
                                    >
                                        Report
                                    </DropdownItem>
                                )}
                            </DropdownMenu>
                        </Dropdown>
                    </div>

                    <div
                        className={`py-2 px-3 rounded-lg ${isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-default-100'
                            }`}
                    >
                        <p className={`whitespace-pre-wrap break-words ${message.deleted && "text-red-500"}`}>{!message.deleted ? message.content:"*Deleted Message*"}</p>
                        {message.edited && (
                            <span className="text-tiny opacity-70 ml-1">(edited)</span>
                        )}
                        
                    </div>
                    <span className="text-tiny text-default-400 mt-1 flex flex-row gap-2">
                    {(isCurrentUser && message.seen_at) && <EyeIcon size={15}/>}
                        {new Date(message.timestamp).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            
                        })}
                        
                    </span>
                </div>
            </div>

            {/* Edit Message Modal */}
            <Modal isOpen={isEditOpen} onClose={onEditClose}>
                <ModalContent>
                    <ModalHeader>Edit Message</ModalHeader>
                    <ModalBody>
                        <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Edit your message..."
                            minRows={3}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onEditClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleEditMessage}
                            isLoading={isEditing}
                            isDisabled={!editContent.trim() || editContent === message.content}
                        >
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Message Modal */}
            <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
                <ModalContent>
                    <ModalHeader>Delete Message</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to delete this message? This action cannot be undone.</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onDeleteClose}>
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onPress={handleDeleteMessage}
                            isLoading={isDeleting}
                        >
                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Report Message Modal */}
            <Modal isOpen={isReportOpen} onClose={onReportClose}>
                <ModalContent>
                    <ModalHeader>Report Message</ModalHeader>
                    <ModalBody>
                        <p className="mb-2">Please provide a reason for reporting this message:</p>
                        <Textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Enter reason for report..."
                            minRows={3}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onReportClose}>
                            Cancel
                        </Button>
                        <Button
                            color="warning"
                            onPress={handleReportMessage}
                            isLoading={isCreatingReport}
                            isDisabled={!reportReason.trim()}
                        >
                            Report
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
} 