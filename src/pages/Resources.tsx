import { useState } from "react";
import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Spinner,
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Badge,
    Link,
    Tabs,
    Tab
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useResource } from "@/hooks/useResource";
import { Plus, ExternalLink } from "lucide-react";
import DefaultLayout from "@/layouts/default";

// Resource types and categories
const RESOURCE_TYPES = [
    { value: "article", label: "Article" },
    { value: "video", label: "Video" },
    { value: "podcast", label: "Podcast" },
    { value: "book", label: "Book" },
    { value: "other", label: "Other" }
];

const RESOURCE_CATEGORIES = [
    { value: "mental_health", label: "Mental Health" },
    { value: "addiction_recovery", label: "Addiction Recovery" },
    { value: "personal_development", label: "Personal Development" },
    { value: "career_guidance", label: "Career Guidance" },
    { value: "education", label: "Education" },
    { value: "financial_literacy", label: "Financial Literacy" },
    { value: "health_wellness", label: "Health & Wellness" },
    { value: "other", label: "Other" }
];

export default function Resources() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const {
        getResources,
        createResource,
        isCreatingResource
    } = useResource();

    // Form state for new resource
    const [newResource, setNewResource] = useState({
        title: "",
        url: "",
        description: "",
        type: "",
        category: ""
    });

    // Validation state
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Get resources data
    const { data: resources, isLoading, error, refetch } = useQuery(getResources());

    // Handle input changes for new resource form
    const handleInputChange = (field: string, value: string) => {
        setNewResource({
            ...newResource,
            [field]: value
        });

        // Clear error for this field if it exists
        if (formErrors[field]) {
            const updatedErrors = { ...formErrors };
            delete updatedErrors[field];
            setFormErrors(updatedErrors);
        }
    };

    // Validate form
    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!newResource.title.trim()) {
            errors.title = "Title is required";
        }

        if (!newResource.url.trim()) {
            errors.url = "URL is required";
        } else if (!isValidUrl(newResource.url)) {
            errors.url = "Please enter a valid URL";
        }

        if (!newResource.description.trim()) {
            errors.description = "Description is required";
        }

        if (!newResource.type) {
            errors.type = "Please select a resource type";
        }

        if (!newResource.category) {
            errors.category = "Please select a category";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Check if URL is valid
    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    // Submit new resource
    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            await createResource({
                title: newResource.title,
                content: JSON.stringify({
                    url: newResource.url,
                    description: newResource.description,
                    type: newResource.type,
                    category: newResource.category
                })
            });

            // Reset form and close modal
            setNewResource({
                title: "",
                url: "",
                description: "",
                type: "",
                category: ""
            });
            onClose();
            refetch();
        } catch (error) {
            console.error("Error creating resource:", error);
        }
    };

  

    // Get color based on resource type
    const getResourceColor = (type: string) => {
        switch (type.toLowerCase()) {
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

    // Parse content from JSON string
    const parseContent = (contentStr: string) => {
        try {
            return JSON.parse(contentStr);
        } catch (e) {
            return { description: contentStr };
        }
    };

    if (isLoading) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" color="primary" />
                </div>
            </DefaultLayout>
        );
    }

    if (error) {
        return (
            <DefaultLayout>
                <div className="bg-danger-50 text-danger p-4 rounded-lg">
                    Error loading resources. Please try again later.
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Resources</h1>
                        <p className="text-default-500">Access helpful resources and materials</p>
                    </div>
                    <Button
                        color="primary"
                        startContent={<Plus size={16} />}
                        onPress={onOpen}
                    >
                        Submit Resource
                    </Button>
                </div>

                <Divider />

                <Tabs aria-label="Resource categories">
                    <Tab key="all" title="All Resources" />
                    <Tab key="mental_health" title="Mental Health" />
                    <Tab key="addiction_recovery" title="Addiction Recovery" />
                    <Tab key="personal_development" title="Personal Development" />
                </Tabs>

                {resources && resources.length === 0 ? (
                    <div className="text-center p-8 bg-content1 rounded-lg">
                        <p className="text-xl">No resources available</p>
                        <p className="text-default-500 mt-2">Be the first to submit a helpful resource!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {resources?.map((resource: any) => {
                            const content = parseContent(resource.content);
                            return (
                                <Card key={resource.resource_id} className="shadow-sm">
                                    <CardHeader className="flex gap-3">
                                        <div className="flex flex-col">
                                            <p className="text-lg font-medium">{resource.title}</p>
                                            <div className="flex gap-2 mt-1">
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
                                    </CardHeader>
                                    <CardBody>
                                        <p className="text-default-500">
                                            {content.description?.substring(0, 150)}
                                            {content.description?.length > 150 ? "..." : ""}
                                        </p>
                                    </CardBody>
                                    <Divider />
                                    <CardFooter>
                                        <Link
                                            isExternal
                                            showAnchorIcon
                                            href={content.url}
                                            anchorIcon={<ExternalLink className="w-4 h-4" />}
                                        >
                                            View Resource
                                        </Link>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Resource Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="2xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <h3 className="text-xl font-bold">Submit a Resource</h3>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    <Input
                                        label="Title"
                                        placeholder="Enter resource title"
                                        value={newResource.title}
                                        onChange={(e) => handleInputChange("title", e.target.value)}
                                        isInvalid={!!formErrors.title}
                                        errorMessage={formErrors.title}
                                    />
                                    <Input
                                        label="URL"
                                        placeholder="https://example.com"
                                        value={newResource.url}
                                        onChange={(e) => handleInputChange("url", e.target.value)}
                                        isInvalid={!!formErrors.url}
                                        errorMessage={formErrors.url}
                                    />
                                    <Textarea
                                        label="Description"
                                        placeholder="Describe this resource and how it can help others"
                                        value={newResource.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        isInvalid={!!formErrors.description}
                                        errorMessage={formErrors.description}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select
                                            label="Resource Type"
                                            placeholder="Select type"
                                            selectedKeys={newResource.type ? [newResource.type] : []}
                                            onChange={(e) => handleInputChange("type", e.target.value)}
                                            isInvalid={!!formErrors.type}
                                            errorMessage={formErrors.type}
                                        >
                                            {RESOURCE_TYPES.map((type) => (
                                                <SelectItem key={type.value} >
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                        <Select
                                            label="Category"
                                            placeholder="Select category"
                                            selectedKeys={newResource.category ? [newResource.category] : []}
                                            onChange={(e) => handleInputChange("category", e.target.value)}
                                            isInvalid={!!formErrors.category}
                                            errorMessage={formErrors.category}
                                        >
                                            {RESOURCE_CATEGORIES.map((category) => (
                                                <SelectItem key={category.value} >
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleSubmit}
                                    isLoading={isCreatingResource}
                                >
                                    Submit Resource
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </DefaultLayout>
    );
} 