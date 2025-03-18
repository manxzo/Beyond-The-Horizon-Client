import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Tabs,
    Tab,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Spinner,
    Divider,
    Badge,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Textarea,
    useDisclosure,
    DateInput,
    Select,
    SelectItem,
} from "@heroui/react";
import {
    Users,
    Calendar,
    MessageSquare,
    BookOpen,
    Clock,
    CalendarPlus,
    LogOut,
    AlertTriangle,
    Plus,
    FileText,
    Video,
    Headphones,
    ExternalLink,
} from "lucide-react";
import { getLocalTimeZone, now, ZonedDateTime } from "@internationalized/date";

import DefaultLayout from "../layouts/default";
import { useSupportGroup } from "../hooks/useSupportGroup";
import { useMeeting } from "../hooks/useMeeting";
import { useUser } from "../hooks/useUser";
import MemberCard from "../components/MemberCard";
import { MeetingStatus } from "../interfaces/enums";
import { useResource } from "../hooks/useResource";

// Define meeting interface
interface GroupMeeting {
    meeting_id: string;
    group_chat_id: string | null;
    support_group_id: string;
    host_id: string;
    title: string;
    description: string | null;
    scheduled_time: string;
    status: MeetingStatus;
    meeting_chat_id: string | null;
    participant_count?: number;
    is_participant?: boolean;
}

export default function SupportGroupDashboard() {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [newMeeting, setNewMeeting] = useState({
        title: "",
        description: "",
        support_group_id: groupId || "",
    });
    const [meetingDate, setMeetingDate] = useState<ZonedDateTime | null>(now(getLocalTimeZone()));
    const [processedGroupDetails, setProcessedGroupDetails] = useState<any>(null);
    const [joiningMeetingId, setJoiningMeetingId] = useState<string | null>(null);
    const [leavingMeetingId, setLeavingMeetingId] = useState<string | null>(null);

    // Get support group hooks
    const { getSupportGroupDetails, leaveSupportGroup } = useSupportGroup();

    // Get meeting hooks
    const {
        createMeeting,
        isCreatingMeeting,
        joinMeeting,
        isJoiningMeeting,
        leaveMeeting,
        isLeavingMeeting
    } = useMeeting();

    // Get user hooks
    const { currentUser } = useUser();

    // Fetch support group details
    const {
        data: groupDetailsResponse,
        isLoading: isLoadingGroupDetails,
        error: groupDetailsError,
        refetch: refetchGroupDetails
    } = useQuery({
        ...getSupportGroupDetails(groupId || ""),
        enabled: !!groupId,
    });

    // Process the group details to ensure consistent casing and structure
    useEffect(() => {
        if (groupDetailsResponse) {
            // Create a deep copy of the response to avoid mutation issues
            const processedData = JSON.parse(JSON.stringify(groupDetailsResponse));

            // Process meetings to ensure status is properly capitalized
            if (processedData.meetings && Array.isArray(processedData.meetings)) {
                processedData.meetings = processedData.meetings.map((meeting: any) => {
                    // Ensure status is properly capitalized
                    if (meeting.status) {
                        meeting.status = meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1).toLowerCase();
                    }
                    return meeting;
                });
            }

            setProcessedGroupDetails(processedData);
        }
    }, [groupDetailsResponse]);

    // Use the processed group details instead of the raw response
    const groupDetails = processedGroupDetails;

    // Extract the actual meetings data
    const meetings = groupDetails?.meetings;
    const members = groupDetails?.members;
    const isMember = members?.some((member: any) => member.user_id === currentUser?.user_id);

    // Handle creating a new meeting
    const handleCreateMeeting = () => {
        if (groupId) {
            const formattedDate = meetingDate ? meetingDate.toString() : "";

            createMeeting({
                groupId,
                meetingData: {
                    ...newMeeting,
                    scheduled_time: formattedDate,
                    support_group_id: groupId,
                },
            });
            onClose();
            setNewMeeting({
                title: "",
                description: "",
                support_group_id: groupId,
            });
            setMeetingDate(now(getLocalTimeZone()));
        }
    };

    // Handle joining a meeting
    const handleJoinMeeting = (meetingId: string) => {
        setJoiningMeetingId(meetingId);
        joinMeeting(meetingId);

        // Refetch group details after a short delay to update the UI
        setTimeout(() => {
            refetchGroupDetails();
            setJoiningMeetingId(null);
        }, 1000);
    };

    // Handle leaving a meeting
    const handleLeaveMeeting = (meetingId: string) => {
        setLeavingMeetingId(meetingId);
        leaveMeeting(meetingId);

        // Refetch group details after a short delay to update the UI
        setTimeout(() => {
            refetchGroupDetails();
            setLeavingMeetingId(null);
        }, 1000);
    };

    // Handle leaving the support group
    const handleLeaveGroup = () => {
        if (groupId) {
            leaveSupportGroup(groupId);
            navigate("/support-groups");
        }
    };

    // Handle navigating to a meeting
    const handleViewMeeting = (meetingId: string) => {
        navigate(`/meetings/${meetingId}`);
    };

    // Handle navigating to the group chat
    const handleViewGroupChat = (chatId: string) => {
        navigate(`/group-chats/${chatId}`);
    };

    // Sort meetings by status and date
    const sortedMeetings = [...(groupDetails?.meetings || [])].sort((a, b) => {
        // First sort by status with explicit typing
        const statusPriority: Record<MeetingStatus, number> = {
            [MeetingStatus.Ongoing]: 0,
            [MeetingStatus.Upcoming]: 1,
            [MeetingStatus.Ended]: 2
        };
        const statusDiff = statusPriority[a.status as MeetingStatus] - statusPriority[b.status as MeetingStatus];
        if (statusDiff !== 0) return statusDiff;

        // Then by date (upcoming: soonest first, ended: most recent first)
        const dateA = new Date(a.scheduled_time);
        const dateB = new Date(b.scheduled_time);

        if (a.status === MeetingStatus.Upcoming) {
            return dateA.getTime() - dateB.getTime(); // Soonest first
        } else {
            return dateB.getTime() - dateA.getTime(); // Most recent first
        }
    }) || [];

    // Filter meetings by status
    const upcomingMeetings = sortedMeetings.filter((meeting: GroupMeeting) => meeting.status === MeetingStatus.Upcoming);
    const ongoingMeetings = sortedMeetings.filter((meeting: GroupMeeting) => meeting.status === MeetingStatus.Ongoing);
    const pastMeetings = sortedMeetings.filter((meeting: GroupMeeting) => meeting.status === MeetingStatus.Ended);

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    // Check if user is admin or sponsor
    const isAdminOrSponsor =
        currentUser?.user_id === groupDetails?.group?.admin_id ||
        groupDetails?.sponsors?.some((sponsor: any) => sponsor.user_id === currentUser?.user_id);

    if (isLoadingGroupDetails || !processedGroupDetails) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-[70vh]">
                    <Spinner size="lg" color="primary" />
                </div>
            </DefaultLayout>
        );
    }

    if (groupDetailsError) {
        return (
            <DefaultLayout>
                <div className="flex flex-col items-center justify-center h-[70vh]">
                    <AlertTriangle size={48} className="text-danger mb-4" />
                    <h2 className="text-2xl font-bold mb-4">Error Loading Support Group</h2>
                    <p className="text-danger mb-6">
                        {(groupDetailsError as Error)?.message || "Failed to load support group details"}
                    </p>
                    <div className="flex gap-4">
                        <Button color="primary" onPress={() => window.location.reload()}>
                            Try Again
                        </Button>
                        <Button variant="flat" onPress={() => navigate("/support-groups")}>
                            Back to Support Groups
                        </Button>
                    </div>
                </div>
            </DefaultLayout>
        );
    }

    if (!isMember) {
        return (
            <DefaultLayout>
                <div className="flex flex-col items-center justify-center h-[70vh]">
                    <AlertTriangle size={48} className="text-warning mb-4" />
                    <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
                    <p className="text-default-700 mb-6">
                        You need to join this support group to view its details.
                    </p>
                    <div className="flex gap-4">
                        <Button color="primary" onPress={() => navigate("/support-groups")}>
                            Back to Support Groups
                        </Button>
                    </div>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">{groupDetails?.group.title}</h1>
                        <p className="text-default-600 mt-1">
                            {groupDetails?.members.length || 0} {(groupDetails?.members.length || 0) === 1 ? 'member' : 'members'} • Created {new Date(groupDetails?.group.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {isAdminOrSponsor && (
                            <Button
                                color="primary"
                                startContent={<CalendarPlus size={18} />}
                                onPress={onOpen}
                            >
                                Schedule Meeting
                            </Button>
                        )}
                        <Button
                            color="danger"
                            variant="flat"
                            startContent={<LogOut size={18} />}
                            onPress={handleLeaveGroup}
                        >
                            Leave Group
                        </Button>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardBody>
                        <p>{groupDetails?.group.description}</p>
                    </CardBody>
                </Card>

                <Tabs aria-label="Support Group Dashboard">
                    <Tab key="meetings" title={
                        <div className="flex items-center gap-2">
                            <Calendar size={18} />
                            <span>Meetings</span>
                            {ongoingMeetings?.length > 0 && (
                                <Badge color="success" shape="circle" size="sm">
                                    {ongoingMeetings.length}
                                </Badge>
                            )}
                        </div>
                    }>
                        <div className="mt-4">
                            {ongoingMeetings?.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Badge color="success" variant="flat">Live</Badge>
                                        Ongoing Meetings
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {ongoingMeetings.map((meeting: GroupMeeting) => (
                                            <Card key={meeting.meeting_id} className="border border-success">
                                                <CardHeader className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-lg font-semibold">{meeting.title}</h4>
                                                        <p className="text-small text-default-500">
                                                            Started {formatDate(meeting.scheduled_time)}
                                                        </p>
                                                        {meeting.participant_count !== undefined && (
                                                            <p className="text-tiny text-default-400 mt-1">
                                                                {meeting.participant_count} {meeting.participant_count === 1 ? 'participant' : 'participants'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Chip color="success" variant="flat">Live</Chip>
                                                </CardHeader>
                                                <Divider />
                                                <CardBody>
                                                    <p>{meeting.description || "No description provided."}</p>
                                                </CardBody>
                                                <Divider />
                                                <CardFooter className="flex flex-col gap-2">
                                                    <div className="flex gap-2 w-full">
                                                        {meeting.is_participant ? (
                                                            <Button
                                                                color="danger"
                                                                variant="flat"
                                                                fullWidth
                                                                onPress={() => handleLeaveMeeting(meeting.meeting_id)}
                                                                isLoading={isLeavingMeeting && leavingMeetingId === meeting.meeting_id}
                                                            >
                                                                Leave Meeting
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                color="primary"
                                                                fullWidth
                                                                onPress={() => handleJoinMeeting(meeting.meeting_id)}
                                                                isLoading={isJoiningMeeting && joiningMeetingId === meeting.meeting_id}
                                                            >
                                                                Join Meeting
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Button
                                                        color={meeting.is_participant ? "success" : "default"}
                                                        variant={meeting.is_participant ? "solid" : "flat"}
                                                        fullWidth
                                                        onPress={() => handleViewMeeting(meeting.meeting_id)}
                                                    >
                                                        {meeting.is_participant ? "Enter Meeting" : "View Details"}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {upcomingMeetings?.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Clock size={18} />
                                        Upcoming Meetings
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {upcomingMeetings.map((meeting: GroupMeeting) => (
                                            <Card key={meeting.meeting_id}>
                                                <CardHeader className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-lg font-semibold">{meeting.title}</h4>
                                                        <p className="text-small text-default-500">
                                                            Scheduled for {formatDate(meeting.scheduled_time)}
                                                        </p>
                                                        {meeting.participant_count !== undefined && (
                                                            <p className="text-tiny text-default-400 mt-1">
                                                                {meeting.participant_count} {meeting.participant_count === 1 ? 'participant' : 'participants'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Chip color="primary" variant="flat">Upcoming</Chip>
                                                </CardHeader>
                                                <Divider />
                                                <CardBody>
                                                    <p>{meeting.description || "No description provided."}</p>
                                                </CardBody>
                                                <Divider />
                                                <CardFooter className="flex flex-col gap-2">
                                                    <div className="flex gap-2 w-full">
                                                        {meeting.is_participant ? (
                                                            <Button
                                                                color="danger"
                                                                variant="flat"
                                                                fullWidth
                                                                onPress={() => handleLeaveMeeting(meeting.meeting_id)}
                                                                isLoading={isLeavingMeeting && leavingMeetingId === meeting.meeting_id}
                                                            >
                                                                Leave Meeting
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                color="primary"
                                                                fullWidth
                                                                onPress={() => handleJoinMeeting(meeting.meeting_id)}
                                                                isLoading={isJoiningMeeting && joiningMeetingId === meeting.meeting_id}
                                                            >
                                                                Join Meeting
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="flat"
                                                        fullWidth
                                                        onPress={() => handleViewMeeting(meeting.meeting_id)}
                                                    >
                                                        View Details
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {pastMeetings?.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-semibold mb-4">Past Meetings</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {pastMeetings.map((meeting: GroupMeeting) => (
                                            <Card key={meeting.meeting_id} className="opacity-80">
                                                <CardHeader className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-lg font-semibold">{meeting.title}</h4>
                                                        <p className="text-small text-default-500">
                                                            Held on {formatDate(meeting.scheduled_time)}
                                                        </p>
                                                        {meeting.participant_count !== undefined && (
                                                            <p className="text-tiny text-default-400 mt-1">
                                                                {meeting.participant_count} {meeting.participant_count === 1 ? 'participant' : 'participants'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Chip variant="flat">Ended</Chip>
                                                </CardHeader>
                                                <Divider />
                                                <CardBody>
                                                    <p>{meeting.description || "No description provided."}</p>
                                                </CardBody>
                                                <Divider />
                                                <CardFooter>
                                                    <Button
                                                        variant="flat"
                                                        fullWidth
                                                        onPress={() => handleViewMeeting(meeting.meeting_id)}
                                                    >
                                                        View Summary
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isLoadingGroupDetails && (!meetings || meetings.length === 0) && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Calendar size={48} className="text-default-400 mb-4" />
                                    <p className="text-xl font-medium mb-2">No meetings scheduled</p>
                                    <p className="text-default-500 mb-6">
                                        {isAdminOrSponsor
                                            ? "Schedule a meeting to connect with group members"
                                            : "Check back later for upcoming meetings"}
                                    </p>
                                    {isAdminOrSponsor && (
                                        <Button color="primary" onPress={onOpen}>
                                            Schedule Meeting
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </Tab>

                    <Tab key="group-chat" title={
                        <div className="flex items-center gap-2">
                            <MessageSquare size={18} />
                            <span>Group Chat</span>
                        </div>
                    }>
                        <div className="mt-4">
                            {groupDetails?.main_group_chat ? (
                                <div className="flex flex-col items-center">
                                    <Card className="w-full">
                                        <CardHeader>
                                            <h3 className="text-xl font-semibold">Group Chat</h3>
                                        </CardHeader>
                                        <Divider />
                                        <CardBody>
                                            <p>Connect with other members in the group chat.</p>
                                        </CardBody>
                                        <Divider />
                                        <CardFooter>
                                            <Button
                                                color="primary"
                                                fullWidth
                                                onPress={() => handleViewGroupChat(groupDetails.main_group_chat.group_chat_id)}
                                            >
                                                Open Chat
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <MessageSquare size={48} className="text-default-400 mb-4" />
                                    <p className="text-xl font-medium mb-2">No group chat available</p>
                                    <p className="text-default-500">
                                        The group chat hasn&apos;t been set up yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Tab>

                    <Tab key="members" title={
                        <div className="flex items-center gap-2">
                            <Users size={18} />
                            <span>Members</span>
                            <span className="ml-1 text-small">({groupDetails?.members.length || 0})</span>
                        </div>
                    }>
                        <div className="mt-4">
                            {groupDetails?.sponsors && groupDetails.sponsors.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xl font-semibold mb-4">Sponsors</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {groupDetails.sponsors.map((sponsor: any) => (
                                            <MemberCard
                                                key={sponsor.user_id}
                                                userId={sponsor.user_id}
                                                joinedAt={sponsor.joined_at}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h3 className="text-xl font-semibold mb-4">All Members</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {groupDetails?.members?.map((member: any) => {
                                    // Skip rendering if this member is already shown as a sponsor
                                    if (groupDetails?.sponsors?.some((sponsor: any) => sponsor.user_id === member.user_id)) {
                                        return null;
                                    }

                                    return (
                                        <MemberCard
                                            key={member.user_id}
                                            userId={member.user_id}
                                            joinedAt={member.joined_at}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </Tab>

                    <Tab key="resources" title={
                        <div className="flex items-center gap-2">
                            <BookOpen size={18} />
                            <span>Resources</span>
                        </div>
                    }>
                        <ResourcesTab groupId={groupId || ""} isAdmin={isAdminOrSponsor} />
                    </Tab>
                </Tabs>
            </div>

            {/* Schedule Meeting Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">Schedule a New Meeting</ModalHeader>
                    <ModalBody>
                        <Input
                            label="Title"
                            placeholder="Enter meeting title"
                            value={newMeeting.title}
                            onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                            isRequired
                        />
                        <Textarea
                            label="Description"
                            placeholder="Enter meeting description"
                            value={newMeeting.description}
                            onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                        />
                        <DateInput
                            label="Date and Time"
                            labelPlacement="outside"
                            value={meetingDate}
                            onChange={(date) => setMeetingDate(date)}
                            isRequired
                            description="Select the date and time for the meeting"
                            granularity="minute"
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleCreateMeeting}
                            isLoading={isCreatingMeeting}
                            isDisabled={!newMeeting.title || !meetingDate}
                        >
                            Schedule Meeting
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </DefaultLayout>
    );
}

// Resources Tab Component
function ResourcesTab({ groupId, isAdmin }: { groupId: string, isAdmin: boolean }) {
    const [isCreatingResource, setIsCreatingResource] = useState(false);
    const [newResource, setNewResource] = useState({
        title: "",
        content: "",
        type: "article",
        category: "mental_health",
        url: "",
        description: ""
    });
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { getResources, createResource } = useResource();

    // Resource types and categories
    const RESOURCE_TYPES = [
        { value: "article", label: "Article" },
        { value: "video", label: "Video" },
        { value: "podcast", label: "Podcast" },
        { value: "book", label: "Book" },
        { value: "document", label: "Document" },
        { value: "other", label: "Other" }
    ];

    const RESOURCE_CATEGORIES = [
        { value: "mental_health", label: "Mental Health" },
        { value: "addiction_recovery", label: "Addiction Recovery" },
        { value: "personal_development", label: "Personal Development" },
        { value: "relationships", label: "Relationships" },
        { value: "grief_loss", label: "Grief & Loss" },
        { value: "health_wellness", label: "Health & Wellness" },
        { value: "other", label: "Other" }
    ];

    // Fetch resources
    const { data: resourcesData, isLoading, error, refetch } = useQuery({
        ...getResources(),
        select: (data: any) => {
            // Add debugging
            console.log("Resource API response:", data);

            // Filter resources for this support group
            if (!data) return [];

            // Handle different response structures
            let resourcesList = data.data || data;

            // If we got a single resource object (not in an array)
            if (resourcesList && !Array.isArray(resourcesList) && resourcesList.resource_id) {
                console.log("Single resource detected, converting to array:", resourcesList);
                resourcesList = [resourcesList];
            }

            // Ensure we're working with an array before filtering
            if (!Array.isArray(resourcesList)) {
                console.log("Resource list is not an array:", resourcesList);
                return [];
            }

            const filteredResources = resourcesList.filter((resource: any) =>
                resource.support_group_id === groupId || resource.support_group_id === null
            );
            console.log("Filtered resources:", filteredResources);
            return filteredResources;
        }
    });

    const handleCreateResource = async () => {
        setIsCreatingResource(true);
        try {
            // Format content as JSON with structured data
            const contentObj = {
                type: newResource.type,
                category: newResource.category,
                url: newResource.url,
                description: newResource.description
            };

            // Create resource with formatted content
            await createResource({
                title: newResource.title,
                content: JSON.stringify(contentObj),
                support_group_id: groupId
            });

            // Reset form and close modal
            setNewResource({
                title: "",
                content: "",
                type: "article",
                category: "mental_health",
                url: "",
                description: ""
            });
            onClose();
            refetch();
        } catch (error) {
            console.error("Error creating resource:", error);
        } finally {
            setIsCreatingResource(false);
        }
    };

    // Parse content from JSON string to object
    const parseResourceContent = (contentStr: string) => {
        try {
            return JSON.parse(contentStr);
        } catch (e) {
            // If parsing fails, return the original string as description
            return { description: contentStr };
        }
    };

    // Get resource type icon
    const getResourceTypeIcon = (type: string) => {
        switch (type) {
            case 'article':
                return <FileText size={18} />;
            case 'video':
                return <Video size={18} />;
            case 'podcast':
                return <Headphones size={18} />;
            case 'book':
                return <BookOpen size={18} />;
            default:
                return <FileText size={18} />;
        }
    };

    if (isLoading) {
        return (
            <div className="mt-4 flex justify-center py-8">
                <Spinner color="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-4 flex flex-col items-center justify-center py-8">
                <AlertTriangle size={40} className="text-danger mb-4" />
                <p className="text-danger">Failed to load resources</p>
            </div>
        );
    }

    // Ensure we have an array of resources
    const resources = resourcesData || [];

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Group Resources</h3>
                {isAdmin && (
                    <Button
                        color="primary"
                        variant="flat"
                        startContent={<Plus size={16} />}
                        onPress={onOpen}
                    >
                        Add Resource
                    </Button>
                )}
            </div>

            {resources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resources.map((resource: any) => {
                        const content = parseResourceContent(resource.content);
                        return (
                            <Card key={resource.resource_id} className="border border-default-200">
                                <CardHeader className="flex justify-between items-start">
                                    <div className="flex-grow">
                                        <h4 className="text-lg font-semibold">{resource.title}</h4>
                                        <p className="text-small text-default-500">
                                            Added {new Date(resource.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {content.category && (
                                        <Chip color="primary" variant="flat" size="sm">
                                            {content.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                        </Chip>
                                    )}
                                </CardHeader>
                                <Divider />
                                <CardBody>
                                    <div className="flex gap-2 items-center mb-2">
                                        {content.type && (
                                            <Chip
                                                variant="flat"
                                                size="sm"
                                                startContent={getResourceTypeIcon(content.type)}
                                            >
                                                {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                                            </Chip>
                                        )}
                                    </div>
                                    <p className="whitespace-pre-line">{content.description}</p>
                                </CardBody>
                                {content.url && (
                                    <>
                                        <Divider />
                                        <CardFooter>
                                            <Button
                                                as="a"
                                                href={content.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                color="primary"
                                                variant="flat"
                                                size="sm"
                                                startContent={<ExternalLink size={16} />}
                                            >
                                                View Resource
                                            </Button>
                                        </CardFooter>
                                    </>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-default-50 rounded-lg">
                    <BookOpen size={48} className="text-default-400 mb-4" />
                    <p className="text-xl font-medium mb-2">No Resources Yet</p>
                    <p className="text-default-500 text-center max-w-md mb-6">
                        {isAdmin
                            ? "Add helpful resources for your group members."
                            : "Check back later for resources related to this group."}
                    </p>
                    {isAdmin && (
                        <Button
                            color="primary"
                            startContent={<Plus size={16} />}
                            onPress={onOpen}
                        >
                            Add First Resource
                        </Button>
                    )}
                </div>
            )}

            {/* Add Resource Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalContent>
                    <ModalHeader>Add New Resource</ModalHeader>
                    <ModalBody>
                        <Input
                            label="Title"
                            placeholder="Enter resource title"
                            value={newResource.title}
                            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                            isRequired
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2">
                            <Select
                                label="Resource Type"
                                value={newResource.type}
                                onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                                isRequired
                            >
                                {RESOURCE_TYPES.map(type => (
                                    <SelectItem key={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </Select>

                            <Select
                                label="Category"
                                value={newResource.category}
                                onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                                isRequired
                            >
                                {RESOURCE_CATEGORIES.map(category => (
                                    <SelectItem key={category.value}>
                                        {category.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>

                        <Input
                            label="URL (Optional)"
                            placeholder="Enter resource URL"
                            value={newResource.url}
                            onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                        />

                        <Textarea
                            label="Description"
                            placeholder="Enter resource description"
                            value={newResource.description}
                            onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                            isRequired
                            minRows={3}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClose}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onPress={handleCreateResource}
                            isLoading={isCreatingResource}
                            isDisabled={!newResource.title || !newResource.description}
                        >
                            Add Resource
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
} 