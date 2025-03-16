import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Spinner,
    Tabs,
    Tab,
    Divider,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Chip,
} from "@heroui/react";
import { Users, UserPlus, Search, Plus } from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useSupportGroup } from "../hooks/useSupportGroup";
import { SupportGroupSummary, UserSupportGroup } from "../hooks/useSupportGroup";

export default function SupportGroups() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [newGroup, setNewGroup] = useState({
        title: "",
        description: "",
    });

    // Get support group hooks
    const {
        getSupportGroups,
        getMyGroups,
        suggestSupportGroup,
        joinSupportGroup,
        isSuggestingSupportGroup,
        isJoiningSupportGroup,
    } = useSupportGroup();

    // Fetch all support groups
    const {
        data: allGroupsResponse,
        isLoading: isLoadingAllGroups,
        error: allGroupsError,
       
    } = useQuery(getSupportGroups());
    // Fetch my support groups
    const {
        data: myGroupsResponse,
        isLoading: isLoadingMyGroups,
        error: myGroupsError,
       
    } = useQuery(getMyGroups());
    // Extract the actual data from the responses
    const allGroups = allGroupsResponse || [];
    const myGroups = myGroupsResponse|| [];
    // Handle joining a support group
    const handleJoinGroup = (groupId: string) => {
        joinSupportGroup(groupId);
    };

    // Handle suggesting a new support group
    const handleSuggestGroup = () => {
        suggestSupportGroup(newGroup);
        onClose();
        setNewGroup({ title: "", description: "" });
    };

    // Handle navigating to a support group's dashboard
    const handleViewGroup = (groupId: string) => {
        navigate(`/support-groups/${groupId}`);
    };

    // Filter groups based on search query
    const filteredAllGroups = allGroups.filter((group: SupportGroupSummary) => {
        if (searchQuery === "") {
            return true;
        } else {
            return group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                group.description.toLowerCase().includes(searchQuery.toLowerCase())
        }
    });

    const filteredMyGroups = myGroups.filter((group: UserSupportGroup) => {
        if (searchQuery === "") {
            return true;
        } else {
            return group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                group.description.toLowerCase().includes(searchQuery.toLowerCase())
        }
    })

    // Check if a group is already joined
    const isGroupJoined = (groupId: string) => {
        return myGroups.some((group: UserSupportGroup) => group.support_group_id === groupId);
    };

    if (isLoadingAllGroups || isLoadingMyGroups) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-[70vh]">
                    <Spinner size="lg" color="primary" />
                </div>
            </DefaultLayout>
        );
    }

    if (allGroupsError || myGroupsError) {
        return (
            <DefaultLayout>
                <div className="flex flex-col items-center justify-center h-[70vh]">
                    <h2 className="text-2xl font-bold mb-4">Error Loading Support Groups</h2>
                    <p className="text-danger">
                        {(allGroupsError as Error)?.message || (myGroupsError as Error)?.message}
                    </p>
                    <Button color="primary" className="mt-4" onPress={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Support Groups</h1>
                    <Button color="primary" startContent={<Plus size={20} />} onPress={onOpen}>
                        Suggest New Group
                    </Button>
                </div>

                <div className="mb-6">
                    <Input
                        placeholder="Search support groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        startContent={<Search size={18} />}
                        isClearable
                        onClear={() => setSearchQuery("")}
                    />
                </div>

                <Tabs aria-label="Support Groups">
                    <Tab key="my-groups" title={
                        <div className="flex items-center gap-2">
                            <Users size={18} />
                            <span>My Groups</span>
                            <span className="ml-1 text-small">({myGroups.length || 0})</span>
                        </div>
                    }>
                        {filteredMyGroups.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                                {filteredMyGroups.map((group: UserSupportGroup) => (
                                    <Card
                                        key={group.support_group_id}
                                        className="border border-default-200 hover:border-primary transition-all"
                                    >
                                        <CardHeader className="flex gap-3">
                                            <div className="flex flex-col">
                                                <p className="text-lg font-semibold">{group.title}</p>
                                                <p className="text-small text-default-500">
                                                    Joined on {new Date(group.joined_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </CardHeader>
                                        <Divider />
                                        <CardBody>
                                            <p className="line-clamp-3">{group.description}</p>
                                        </CardBody>
                                        <Divider />
                                        <CardFooter>
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                fullWidth
                                                onPress={() => handleViewGroup(group.support_group_id)}
                                            >
                                                View Group
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Users size={48} className="text-default-400 mb-4" />
                                <p className="text-xl font-medium mb-2">You haven&apos;t joined any support groups yet</p>
                                <p className="text-default-500 mb-6">Join a group to connect with others and participate in discussions</p>
                                <Button color="primary" onPress={() => document.getElementById("all-groups-tab")?.click()}>
                                    Browse Available Groups
                                </Button>
                            </div>
                        )}
                    </Tab>
                    <Tab
                        id="all-groups-tab"
                        key="all-groups"
                        title={
                            <div className="flex items-center gap-2">
                                <UserPlus size={18} />
                                <span>Available Groups</span>
                                <span className="ml-1 text-small">({allGroups.length || 0})</span>
                            </div>
                        }
                    >
                        {filteredAllGroups.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                                {filteredAllGroups.map((group: SupportGroupSummary) => {
                                    const joined = isGroupJoined(group.support_group_id);

                                    return (
                                        <Card
                                            key={group.support_group_id}
                                            className={`border border-default-200 ${joined ? 'hover:border-primary' : ''} transition-all`}
                                        >
                                            <CardHeader className="flex gap-3">
                                                <div className="flex flex-col">
                                                    <p className="text-lg font-semibold">{group.title}</p>
                                                    <p className="text-small text-default-500">
                                                        {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {joined && (
                                                        <Chip color="primary" variant="flat" size="sm">Joined</Chip>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <Divider />
                                            <CardBody>
                                                <p className="line-clamp-3">{group.description}</p>
                                            </CardBody>
                                            <Divider />
                                            <CardFooter>
                                                {joined ? (
                                                    <Button
                                                        color="primary"
                                                        variant="flat"
                                                        fullWidth
                                                        onPress={() => handleViewGroup(group.support_group_id)}
                                                    >
                                                        View Group
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        color="primary"
                                                        fullWidth
                                                        onPress={() => handleJoinGroup(group.support_group_id)}
                                                        isLoading={isJoiningSupportGroup}
                                                        startContent={!isJoiningSupportGroup && <UserPlus size={18} />}
                                                    >
                                                        Join Group
                                                    </Button>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Users size={48} className="text-default-400 mb-4" />
                                <p className="text-xl font-medium mb-2">No support groups available</p>
                                <p className="text-default-500 mb-6">Check back later or suggest a new group</p>
                                <Button color="primary" onPress={onOpen}>
                                    Suggest New Group
                                </Button>
                            </div>
                        )}
                    </Tab>
                </Tabs>
            </div>

            {/* Suggest New Group Modal */}
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">Suggest a New Support Group</ModalHeader>
                    <ModalBody>
                        <Input
                            label="Title"
                            placeholder="Enter group title"
                            value={newGroup.title}
                            onChange={(e) => setNewGroup({ ...newGroup, title: e.target.value })}
                            isRequired
                        />
                        <Input
                            label="Description"
                            placeholder="Enter group description"
                            value={newGroup.description}
                            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                            isRequired
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleSuggestGroup}
                            isLoading={isSuggestingSupportGroup}
                            isDisabled={!newGroup.title || !newGroup.description}
                        >
                            Submit Suggestion
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </DefaultLayout>
    );
} 