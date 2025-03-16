import { useState } from "react";
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
} from "lucide-react";
import { getLocalTimeZone, now, ZonedDateTime } from "@internationalized/date";

import DefaultLayout from "../layouts/default";
import { useSupportGroup } from "../hooks/useSupportGroup";
import { useMeeting } from "../hooks/useMeeting";
import { useUser } from "../hooks/useUser";
import MemberCard from "../components/MemberCard";

// Define meeting status types
type MeetingStatus = 'upcoming' | 'ongoing' | 'ended';

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

    // Get support group hooks
    const { getSupportGroupDetails, leaveSupportGroup } = useSupportGroup();

    // Get meeting hooks
    const {
        createMeeting,
        isCreatingMeeting
    } = useMeeting();

    // Get user hooks
    const { currentUser } = useUser();
    // Fetch support group details
    const {
        data: groupDetailsResponse,
        isLoading: isLoadingGroupDetails,
        error: groupDetailsError,
    } = useQuery({
        ...getSupportGroupDetails(groupId || ""),
        enabled: !!groupId,
    });

    const groupDetails = groupDetailsResponse;

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
    const sortedMeetings = meetings?.sort((a: GroupMeeting, b: GroupMeeting) => {
        // First by status priority (ongoing > upcoming > ended)
        const statusPriority = { ongoing: 0, upcoming: 1, ended: 2 };
        const statusDiff = statusPriority[a.status] - statusPriority[b.status];
        if (statusDiff !== 0) return statusDiff;

        // Then by date (upcoming: soonest first, ended: most recent first)
        const dateA = new Date(a.scheduled_time);
        const dateB = new Date(b.scheduled_time);

        if (a.status === 'upcoming') {
            return dateA.getTime() - dateB.getTime(); // Soonest first
        } else {
            return dateB.getTime() - dateA.getTime(); // Most recent first
        }
    });

    // Filter meetings by status
    const upcomingMeetings = sortedMeetings?.filter((meeting: GroupMeeting) => meeting.status === 'upcoming');
    const ongoingMeetings = sortedMeetings?.filter((meeting: GroupMeeting) => meeting.status === 'ongoing');
    const pastMeetings = sortedMeetings?.filter((meeting: GroupMeeting) => meeting.status === 'ended');

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
    const isAdminOrSponsor = groupDetails?.group?.admin_id === currentUser?.user_id ||
        groupDetails?.sponsors?.some((sponsor: any) => sponsor.user_id === currentUser?.user_id);

    if (isLoadingGroupDetails) {
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
                                                    </div>
                                                    <Chip color="success" variant="flat">Live</Chip>
                                                </CardHeader>
                                                <Divider />
                                                <CardBody>
                                                    <p>{meeting.description || "No description provided."}</p>
                                                </CardBody>
                                                <Divider />
                                                <CardFooter>
                                                    <Button
                                                        color="success"
                                                        fullWidth
                                                        onPress={() => handleViewMeeting(meeting.meeting_id)}
                                                    >
                                                        Join Now
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
                                                    </div>
                                                    <Chip color="primary" variant="flat">Upcoming</Chip>
                                                </CardHeader>
                                                <Divider />
                                                <CardBody>
                                                    <p>{meeting.description || "No description provided."}</p>
                                                </CardBody>
                                                <Divider />
                                                <CardFooter>
                                                    <Button
                                                        color="primary"
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
                        <div className="mt-4 flex flex-col items-center justify-center py-12">
                            <BookOpen size={48} className="text-default-400 mb-4" />
                            <p className="text-xl font-medium mb-2">Resources Coming Soon</p>
                            <p className="text-default-500">
                                This feature is under development. Check back later for resources related to this group.
                            </p>
                        </div>
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