import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Button,
    Card,
    CardBody,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Textarea,
    Badge,
    Spinner,
    Divider,
    Form,
    addToast,
    Tabs,
    Tab
} from '@heroui/react';
import { useSupportGroup, SupportGroupSummary, UserSupportGroup } from '../hooks/useSupportGroup';
import DefaultLayout from '@/layouts/default';
import { title, subtitle } from '@/components/primitives';

const SupportGroups = () => {
    const navigate = useNavigate();
    const {
        getSupportGroups,
        getMyGroups,
        suggestSupportGroup,
        isSuggestingSupportGroup,
        joinSupportGroup,
        isJoiningSupportGroup
    } = useSupportGroup();

    // State for the suggestion modal and active tab
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [titleText, setTitleText] = useState('');
    const [description, setDescription] = useState('');
    const [activeTab, setActiveTab] = useState<"all" | "my">("all");

    // Fetch all support groups
    const {
        data: allGroupsResponse,
        isLoading: isLoadingAllGroups,
        error: allGroupsError,
        refetch: refetchAllGroups
    } = useQuery({
        ...getSupportGroups()
    });

    // Fetch groups the user is a member of
    const {
        data: myGroupsResponse,
        isLoading: isLoadingMyGroups,
        error: myGroupsError,
        refetch: refetchMyGroups
    } = useQuery({
        ...getMyGroups(),
        retry: false
    });

    // Refetch data when component mounts or becomes visible
    useEffect(() => {
        refetchAllGroups();
        refetchMyGroups();
    }, [refetchAllGroups, refetchMyGroups]);

    // Extract data from responses
    const allGroups = allGroupsResponse?.data || [];
    const myGroups = myGroupsResponse?.data || [];

    // Process groups to ensure all required fields are present
    const processedAllGroups: SupportGroupSummary[] = (allGroups || []).map((group: any) => ({
        ...group,
        // Add default values for missing fields
        status: group.status || 'approved', // Default to 'approved' if status is missing
        is_member: group.is_member || false
    }));

    const processedMyGroups: UserSupportGroup[] = myGroups || [];

    // Handle suggesting a new support group
    const handleSuggestGroup = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!titleText.trim() || !description.trim()) {
            addToast({
                description: "Please fill in all fields",
                color: "danger"
            });
            return;
        }

        suggestSupportGroup(
            { title: titleText, description },
            {
                onSuccess: () => {
                    addToast({
                        description: "Support group suggestion submitted successfully!",
                        color: "success"
                    });
                    setIsModalOpen(false);
                    setTitleText('');
                    setDescription('');
                    refetchAllGroups();
                },
                onError: (error) => {
                    addToast({
                        description: `Failed to suggest support group: ${error.message}`,
                        color: "danger"
                    });
                }
            }
        );
    };

    // Handle joining a support group
    const handleJoinGroup = (groupId: string) => {
        joinSupportGroup(groupId, {
            onSuccess: () => {
                addToast({
                    description: "Successfully joined the support group!",
                    color: "success"
                });
                // Refetch both lists to update UI
                refetchAllGroups();
                refetchMyGroups();
            },
            onError: (error) => {
                addToast({
                    description: `Failed to join support group: ${error.message}`,
                    color: "danger"
                });
            }
        });
    };

    // Handle navigating to a support group's detail page
    const handleViewGroup = (groupId: string) => {
        navigate(`/support-groups/${groupId}`);
    };

    // Loading state
    if ((activeTab === 'all' && isLoadingAllGroups) || (activeTab === 'my' && isLoadingMyGroups)) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center min-h-[60vh]">
                    <Spinner size="lg" />
                </div>
            </DefaultLayout>
        );
    }

    // Error state - only show error for all groups tab
    // For my groups tab, we'll handle the error in the UI
    if (activeTab === 'all' && allGroupsError) {
        return (
            <DefaultLayout>
                <div className="p-4 text-center">
                    <h2 className={title({ color: "foreground", size: "md" })}>
                        Error loading support groups
                    </h2>
                    <p className={subtitle()}>Please try again later</p>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className={title({ color: "foreground" })}>Support Groups</h1>
                    <Button onPress={() => setIsModalOpen(true)}>Suggest New Group</Button>
                </div>

                {/* Tabs for All Groups and My Groups */}
                <Tabs
                    aria-label="Support Group Tabs"
                    selectedKey={activeTab}
                    onSelectionChange={(key) => setActiveTab(key as "all" | "my")}
                    className="mb-6"
                >
                    <Tab key="all" title="All Support Groups">
                        {processedAllGroups.length === 0 ? (
                            <div className="text-center p-8">
                                <p className={subtitle()}>No support groups available yet.</p>
                                <Button className="mt-4" onPress={() => setIsModalOpen(true)}>
                                    Be the first to suggest a group
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {processedAllGroups.map((group: SupportGroupSummary) => (
                                    <Card key={group.support_group_id} className="overflow-hidden">
                                        <CardBody className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-semibold">{group.title}</h3>
                                                <Badge color={group.status === 'approved' ? 'success' : 'warning'}>
                                                    {group.status || 'approved'}
                                                </Badge>
                                            </div>
                                            <p className="text-gray-600 mb-4 line-clamp-3">{group.description}</p>
                                            <p className="text-sm mb-2">Members: {group.member_count}</p>
                                            <Divider className="my-3" />
                                            <div className="flex justify-between items-center mt-2">
                                                <Button
                                                    variant="flat"
                                                    onPress={() => handleViewGroup(group.support_group_id)}
                                                >
                                                    View Details
                                                </Button>
                                                {/* Show join button if not a member and group is approved */}
                                                {!group.is_member && group.status === 'approved' && (
                                                    <Button
                                                        isLoading={isJoiningSupportGroup}
                                                        onPress={() => handleJoinGroup(group.support_group_id)}
                                                    >
                                                        Join Group
                                                    </Button>
                                                )}
                                                {group.is_member && (
                                                    <Badge color="primary">Member</Badge>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </Tab>
                    <Tab key="my" title="My Groups">
                        {isLoadingMyGroups ? (
                            <div className="flex justify-center items-center min-h-[40vh]">
                                <Spinner size="lg" />
                            </div>
                        ) : myGroupsError ? (
                            <div className="text-center p-8">
                                <p className={subtitle()}>There was an error loading your groups.</p>
                                <p className="text-gray-600 mb-4">This feature may not be available yet or there might be a server issue.</p>
                                <Button
                                    className="mt-4"
                                    onPress={() => setActiveTab("all")}
                                >
                                    Browse all groups instead
                                </Button>
                            </div>
                        ) : processedMyGroups.length === 0 ? (
                            <div className="text-center p-8">
                                <p className={subtitle()}>You haven&apos;t joined any support groups yet.</p>
                                <Button
                                    className="mt-4"
                                    onPress={() => setActiveTab("all")}
                                >
                                    Browse available groups
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {processedMyGroups.map((group: UserSupportGroup) => (
                                    <Card key={group.support_group_id} className="overflow-hidden">
                                        <CardBody className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-semibold">{group.title}</h3>
                                                <Badge color="primary">Member</Badge>
                                            </div>
                                            <p className="text-gray-600 mb-4 line-clamp-3">{group.description}</p>
                                            <Divider className="my-3" />
                                            <div className="flex justify-center mt-2">
                                                <Button
                                                    color="primary"
                                                    onPress={() => handleViewGroup(group.support_group_id)}
                                                >
                                                    View Group Details
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </Tab>
                </Tabs>

                {/* Suggestion Modal */}
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <ModalContent>
                        <ModalHeader>Suggest a New Support Group</ModalHeader>
                        <ModalBody>
                            <p className="text-gray-600 mb-4">
                                Fill in the details below to suggest a new support group. Your suggestion will be reviewed by administrators.
                            </p>

                            <Form
                                id="suggest-group-form"
                                className="space-y-4"
                                onSubmit={handleSuggestGroup}
                            >
                                <Input
                                    id="title"
                                    label="Title"
                                    value={titleText}
                                    onValueChange={setTitleText}
                                    placeholder="Enter a title for the support group"
                                    isRequired
                                />

                                <Textarea
                                    id="description"
                                    label="Description"
                                    value={description}
                                    onValueChange={setDescription}
                                    placeholder="Describe the purpose and focus of this support group"
                                    rows={5}
                                    isRequired
                                />
                            </Form>
                        </ModalBody>

                        <ModalFooter>
                            <Button variant="flat" onPress={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="suggest-group-form"
                                isLoading={isSuggestingSupportGroup}
                                color="primary"
                            >
                                Submit Suggestion
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </DefaultLayout>
    );
};

export default SupportGroups;
