import { useState } from "react";
import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Spinner,
    Button,
    Textarea,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Badge
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/admin/useAdmin";
import { Check, X, Eye } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import DefaultLayout from "@/layouts/default";
import { SupportGroupStatus } from "../../interfaces/enums";

export default function AdminSupportGroups() {
    const { getPendingSupportGroups, reviewSupportGroup } = useAdmin();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [adminComments, setAdminComments] = useState("");
    const [viewingGroup, setViewingGroup] = useState<any>(null);

    const { data: supportGroups, isLoading, error, refetch } = useQuery(getPendingSupportGroups());

    const handleViewDetails = (group: any) => {
        setViewingGroup(group);
        onOpen();
    };

    const handleApprove = async (groupId: string) => {
        await reviewSupportGroup({
            supportGroupId: groupId,
            status: SupportGroupStatus.Approved,
            adminComments
        });

        setAdminComments("");
        refetch();
    };

    const handleReject = async (groupId: string) => {
        await reviewSupportGroup({
            supportGroupId: groupId,
            status: SupportGroupStatus.Rejected,
            adminComments
        });
        setAdminComments("");
        refetch();
    };

    if (isLoading) {
        return (
            <DefaultLayout>
                <AdminNav />
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" color="primary" />
                </div>
            </DefaultLayout>
        );
    }

    if (error) {
        return (
            <DefaultLayout>
                <AdminNav />
                <div className="bg-danger-50 text-danger p-4 rounded-lg">
                    Error loading pending support groups. Please try again later.
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <AdminNav />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Support Group Management</h1>
                    <p className="text-default-500">Review and approve support group applications</p>
                </div>

                <Divider />

                {supportGroups && supportGroups.length === 0 ? (
                    <div className="text-center p-8 bg-content1 rounded-lg">
                        <p className="text-xl">No pending support groups to review</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {supportGroups.map((group: any) => (
                            <Card key={group.support_group_id} className="shadow-sm">
                                <CardHeader className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-medium">{group.title}</h3>
                                        <Badge color="warning" variant="flat">Pending Review</Badge>
                                    </div>
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        onPress={() => handleViewDetails(group)}
                                        aria-label="View details"
                                    >
                                        <Eye size={20} />
                                    </Button>
                                </CardHeader>
                                <CardBody>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="font-semibold">Description:</span>
                                            <p className="text-default-500">
                                                {group.description.length > 150
                                                    ? `${group.description.substring(0, 150)}...`
                                                    : group.description}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-semibold">Created at:</span>
                                            <p className="text-default-500">{new Date(group.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </CardBody>
                                <Divider />
                                <CardFooter className="flex flex-col space-y-4">
                                    <Textarea
                                        label="Admin Comments"
                                        placeholder="Add comments about this support group (optional)"
                                        value={adminComments}
                                        onChange={(e) => setAdminComments(e.target.value)}
                                    />
                                    <div className="flex justify-between w-full">
                                        <Button
                                            color="danger"
                                            variant="flat"
                                            startContent={<X size={16} />}
                                            onPress={() => handleReject(group.support_group_id)}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            color="success"
                                            startContent={<Check size={16} />}
                                            onPress={() => handleApprove(group.support_group_id)}
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Group Details Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="3xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <h3 className="text-xl font-bold">{viewingGroup?.title}</h3>
                            </ModalHeader>
                            <ModalBody>
                                {viewingGroup && (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold">Description</h4>
                                            <p className="text-default-600">{viewingGroup.description}</p>
                                        </div>
                                        <Divider />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-semibold">Status</h4>
                                                <p>{viewingGroup.status}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Created At</h4>
                                                <p>{new Date(viewingGroup.created_at).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Support Group ID</h4>
                                                <p>{viewingGroup.support_group_id}</p>
                                            </div>
                                            {viewingGroup.admin_username && (
                                                <div>
                                                    <h4 className="font-semibold">Admin</h4>
                                                    <p>{viewingGroup.admin_username}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    Close
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </DefaultLayout>
    );
} 