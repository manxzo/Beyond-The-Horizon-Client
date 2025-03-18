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
    Badge,
    Link
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/admin/useAdmin";
import { Check, X, Eye, ExternalLink} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import DefaultLayout from "@/layouts/default";

export default function AdminResources() {
    const { getPendingResources, reviewResource } = useAdmin();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [adminComments, setAdminComments] = useState("");
    const [viewingResource, setViewingResource] = useState<any>(null);

    const { data: resources, isLoading, error, refetch } = useQuery(getPendingResources());

    const handleViewDetails = (resource: any) => {
        setViewingResource(resource);
        onOpen();
    };

    const handleApprove = async (resourceId: string) => {
        await reviewResource({
            resourceId,
            approved: true,
            adminComments
        });
        setAdminComments("");
        refetch();
    };

    const handleReject = async (resourceId: string) => {
        await reviewResource({
            resourceId,
            approved: false,
            adminComments
        });
        setAdminComments("");
        refetch();
    };

    // Parse content from JSON string
    const parseContent = (contentStr: string) => {
        try {
            return JSON.parse(contentStr);
        } catch (e) {
            return { description: contentStr };
        }
    };

   

    // Get color based on resource type
    const getResourceColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'article':
                return 'primary';
            case 'video':
                return 'success';
            case 'podcast':
                return 'secondary';
            case 'book':
                return 'warning';
            default:
                return 'default';
        }
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
                    Error loading pending resources. Please try again later.
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <AdminNav />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Resource Management</h1>
                    <p className="text-default-500">Review and approve resource submissions</p>
                </div>

                <Divider />

                {resources && resources.length === 0 ? (
                    <div className="text-center p-8 bg-content1 rounded-lg">
                        <p className="text-xl">No pending resources to review</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {resources?.map((resource: any) => {
                            const content = parseContent(resource.content);
                            return (
                                <Card key={resource.id} className="shadow-sm">
                                    <CardHeader className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-medium">{resource.title}</h3>
                                            <div className="flex gap-2 mt-1">
                                                <Badge color="warning" variant="flat">Pending Review</Badge>
                                                {content.type && (
                                                    <Badge color={getResourceColor(content.type)} variant="flat">
                                                        {content.type}
                                                    </Badge>
                                                )}
                                                {content.category && (
                                                    <Badge color="default" variant="flat">
                                                        {content.category}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            isIconOnly
                                            variant="light"
                                            onPress={() => handleViewDetails(resource)}
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
                                                    {content.description?.substring(0, 150)}
                                                    {content.description?.length > 150 ? "..." : ""}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="font-semibold">Submitted by:</span>
                                                <p className="text-default-500">{resource.submitter_username || "Anonymous"}</p>
                                            </div>
                                        </div>
                                    </CardBody>
                                    <Divider />
                                    <CardFooter className="flex flex-col space-y-4">
                                        <Textarea
                                            label="Admin Comments"
                                            placeholder="Add comments about this resource (optional)"
                                            value={adminComments}
                                            onChange={(e) => setAdminComments(e.target.value)}
                                        />
                                        <div className="flex justify-between w-full">
                                            <Button
                                                color="danger"
                                                variant="flat"
                                                startContent={<X size={16} />}
                                                onPress={() => handleReject(resource.id)}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                color="success"
                                                startContent={<Check size={16} />}
                                                onPress={() => handleApprove(resource.id)}
                                            >
                                                Approve
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Resource Details Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="3xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <h3 className="text-xl font-bold">{viewingResource?.title}</h3>
                            </ModalHeader>
                            <ModalBody>
                                {viewingResource && (
                                    <div className="space-y-4">
                                        {(() => {
                                            const content = parseContent(viewingResource.content);
                                            return (
                                                <>
                                                    <div>
                                                        <h4 className="font-semibold">Description</h4>
                                                        <p className="text-default-600">{content.description}</p>
                                                    </div>
                                                    <Divider />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <h4 className="font-semibold">Category</h4>
                                                            <p>{content.category}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold">Type</h4>
                                                            <p>{content.type}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold">Submitted By</h4>
                                                            <p>{viewingResource.submitter_username || "Anonymous"}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold">Submitted At</h4>
                                                            <p>{new Date(viewingResource.created_at).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <Divider />
                                                    <div>
                                                        <h4 className="font-semibold">Resource URL</h4>
                                                        <Link
                                                            href={content.url}
                                                            isExternal
                                                            showAnchorIcon
                                                            className="text-primary"
                                                            anchorIcon={<ExternalLink className="w-4 h-4" />}
                                                        >
                                                            {content.url}
                                                        </Link>
                                                    </div>
                                                </>
                                            );
                                        })()}
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