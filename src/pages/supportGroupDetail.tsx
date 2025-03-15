import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    Divider,
    Badge,
    Spinner,
    Tabs,
    Tab,
    Avatar,
    addToast
} from '@heroui/react';
import { useSupportGroup } from '../hooks/useSupportGroup';
import { useMeeting } from '../hooks/useMeeting';
import { useUser } from '../hooks/useUser';
import DefaultLayout from '@/layouts/default';
import { title, subtitle } from '@/components/primitives';
import { format } from 'date-fns';

// Interfaces to match server data structures
interface SupportGroupMember {
    support_group_id: string;
    user_id: string;
    joined_at: string;
    username?: string; // Added from user data
    avatar_url?: string; // Added from user data
    role?: string; // Added from user data
}

const SupportGroupDetail = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { currentUser } = useUser();

    const {
        getSupportGroupDetails,
        joinSupportGroup,
        isJoiningSupportGroup,
        leaveSupportGroup,
        isLeavingSupportGroup
    } = useSupportGroup();

    const {
        getGroupMeetings,
        createMeeting,
        isCreatingMeeting,
        joinMeeting,
        isJoiningMeeting
    } = useMeeting();

    const [selectedTab, setSelectedTab] = useState("about");
    const [showNewMeetingForm, setShowNewMeetingForm] = useState(false);
    const [meetingTitle, setMeetingTitle] = useState('');
    const [meetingDescription, setMeetingDescription] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingTime, setMeetingTime] = useState('');

    // Fetch support group details
    const {
        data: groupDetailsResponse,
        isLoading: isLoadingGroup,
        error: groupError,
        refetch: refetchGroup
    } = useQuery({
        ...getSupportGroupDetails(groupId || '')
    });

    // Fetch group meetings
    const {
        data: meetingsResponse,
        isLoading: isLoadingMeetings,
        refetch: refetchMeetings
    } = useQuery({
        ...getGroupMeetings(groupId || '')
    });

    // Refetch data when component mounts or groupId changes
    useEffect(() => {
        if (groupId) {
            refetchGroup();
            refetchMeetings();
        }
    }, [groupId, refetchGroup, refetchMeetings]);

    // Extract data from responses
    const groupDetails = groupDetailsResponse?.data;
    const meetings = meetingsResponse?.data || [];

    // Extract group details
    const group = groupDetails?.group;
    const groupMembers = groupDetails?.members || [];

    // Determine user's relationship to the group
    const isMember = groupDetails?.is_member || false;

    // Check if user is an admin (used for conditional rendering in the UI)
    const isAdmin = currentUser?.role === 'admin' || groupDetails?.is_admin;

    // Handle joining a support group
    const handleJoinGroup = () => {
        if (!groupId) return;

        joinSupportGroup(groupId, {
            onSuccess: () => {
                addToast({
                    description: "Successfully joined the support group!",
                    color: "success"
                });
                refetchGroup();
            },
            onError: (error) => {
                addToast({
                    description: `Failed to join support group: ${error.message}`,
                    color: "danger"
                });
            }
        });
    };

    // Handle leaving a support group
    const handleLeaveGroup = () => {
        if (!groupId) return;

        leaveSupportGroup(groupId, {
            onSuccess: () => {
                addToast({
                    description: "Successfully left the support group",
                    color: "success"
                });
                refetchGroup();
            },
            onError: (error) => {
                addToast({
                    description: `Failed to leave support group: ${error.message}`,
                    color: "danger"
                });
            }
        });
    };

    // Handle joining a meeting
    const handleJoinMeeting = (meetingId: string) => {
        joinMeeting(meetingId, {
            onSuccess: () => {
                addToast({
                    description: "Successfully joined the meeting!",
                    color: "success"
                });
                refetchMeetings();
            },
            onError: (error) => {
                addToast({
                    description: `Failed to join meeting: ${error.message}`,
                    color: "danger"
                });
            }
        });
    };

    // Handle creating a new meeting
    const handleCreateMeeting = () => {
        if (!groupId || !meetingTitle || !meetingDate || !meetingTime) {
            addToast({
                description: "Please fill in all required fields",
                color: "danger"
            });
            return;
        }

        const scheduledTime = `${meetingDate}T${meetingTime}:00`;

        createMeeting({
            groupId,
            meetingData: {
                title: meetingTitle,
                description: meetingDescription || undefined,
                scheduled_time: scheduledTime,
                support_group_id: groupId
            }
        }, {
            onSuccess: () => {
                addToast({
                    description: "Meeting created successfully!",
                    color: "success"
                });
                setShowNewMeetingForm(false);
                setMeetingTitle('');
                setMeetingDescription('');
                setMeetingDate('');
                setMeetingTime('');
                refetchMeetings();
            },
            onError: (error) => {
                addToast({
                    description: `Failed to create meeting: ${error.message}`,
                    color: "danger"
                });
            }
        });
    };

    if (isLoadingGroup) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center min-h-[60vh]">
                    <Spinner size="lg" />
                </div>
            </DefaultLayout>
        );
    }

    if (groupError || !groupDetails || !group) {
        return (
            <DefaultLayout>
                <div className="p-4 text-center">
                    <h2 className={title({ color: "foreground", size: "md" })}>
                        Error loading support group
                    </h2>
                    <p className={subtitle()}>This group may not exist or you may not have permission to view it.</p>
                    <Button
                        className="mt-4"
                        onPress={() => navigate('/support-groups')}
                    >
                        Back to Support Groups
                    </Button>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="container mx-auto px-4 py-8">
                {/* Group Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                            <h1 className={title({ color: "foreground" })}>{group.title}</h1>
                            <p className={subtitle()}>Created {format(new Date(group.created_at), 'PPP')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge color={group.status === 'approved' ? 'success' : 'warning'}>
                                {group.status}
                            </Badge>
                            {!isMember && group.status === 'approved' ? (
                                <Button
                                    color="primary"
                                    isLoading={isJoiningSupportGroup}
                                    onPress={handleJoinGroup}
                                >
                                    Join Group
                                </Button>
                            ) : isMember && (
                                <Button
                                    color="danger"
                                    variant="flat"
                                    isLoading={isLeavingSupportGroup}
                                    onPress={handleLeaveGroup}
                                >
                                    Leave Group
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <Tabs
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => setSelectedTab(key as string)}
                    className="mb-6"
                >
                    <Tab key="about" title="About" />
                    <Tab key="meetings" title="Meetings" />
                    <Tab key="members" title="Members" />
                </Tabs>

                {/* Tab Content */}
                <div className="mt-4">
                    {/* About Tab */}
                    {selectedTab === "about" && (
                        <Card>
                            <CardBody>
                                <h2 className="text-xl font-semibold mb-2">Description</h2>
                                <p className="text-gray-600 whitespace-pre-line mb-4">{group.description}</p>

                                <Divider className="my-4" />

                                <div className="flex flex-wrap gap-4">
                                    <div>
                                        <h3 className="font-medium mb-1">Members</h3>
                                        <p>{groupMembers.length} members</p>
                                    </div>
                                    <div>
                                        <h3 className="font-medium mb-1">Status</h3>
                                        <Badge color={group.status === 'approved' ? 'success' : 'warning'}>
                                            {group.status}
                                        </Badge>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Meetings Tab */}
                    {selectedTab === "meetings" && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Upcoming Meetings</h2>
                                {isMember && (
                                    <Button
                                        color="primary"
                                        onPress={() => setShowNewMeetingForm(!showNewMeetingForm)}
                                    >
                                        {showNewMeetingForm ? 'Cancel' : 'Schedule Meeting'}
                                    </Button>
                                )}
                                {/* Admin can also schedule meetings even if not a member */}
                                {!isMember && isAdmin && (
                                    <Button
                                        color="primary"
                                        onPress={() => setShowNewMeetingForm(!showNewMeetingForm)}
                                    >
                                        {showNewMeetingForm ? 'Cancel' : 'Schedule Meeting (Admin)'}
                                    </Button>
                                )}
                            </div>

                            {/* New Meeting Form */}
                            {showNewMeetingForm && (
                                <Card className="mb-6">
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold">Schedule a New Meeting</h3>
                                    </CardHeader>
                                    <CardBody>
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="meetingTitle" className="block font-medium mb-1">
                                                    Title *
                                                </label>
                                                <input
                                                    id="meetingTitle"
                                                    className="w-full px-3 py-2 border rounded-md"
                                                    value={meetingTitle}
                                                    onChange={(e) => setMeetingTitle(e.target.value)}
                                                    placeholder="Enter meeting title"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="meetingDescription" className="block font-medium mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    id="meetingDescription"
                                                    className="w-full px-3 py-2 border rounded-md"
                                                    value={meetingDescription}
                                                    onChange={(e) => setMeetingDescription(e.target.value)}
                                                    placeholder="Describe the meeting purpose"
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="meetingDate" className="block font-medium mb-1">
                                                        Date *
                                                    </label>
                                                    <input
                                                        id="meetingDate"
                                                        type="date"
                                                        className="w-full px-3 py-2 border rounded-md"
                                                        value={meetingDate}
                                                        onChange={(e) => setMeetingDate(e.target.value)}
                                                    />
                                                </div>

                                                <div>
                                                    <label htmlFor="meetingTime" className="block font-medium mb-1">
                                                        Time *
                                                    </label>
                                                    <input
                                                        id="meetingTime"
                                                        type="time"
                                                        className="w-full px-3 py-2 border rounded-md"
                                                        value={meetingTime}
                                                        onChange={(e) => setMeetingTime(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                    <CardFooter>
                                        <Button
                                            color="primary"
                                            isLoading={isCreatingMeeting}
                                            onPress={handleCreateMeeting}
                                        >
                                            Create Meeting
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}

                            {isLoadingMeetings ? (
                                <div className="flex justify-center py-8">
                                    <Spinner />
                                </div>
                            ) : meetings.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600">No upcoming meetings scheduled.</p>
                                    {isMember && !showNewMeetingForm && (
                                        <Button
                                            className="mt-4"
                                            onPress={() => setShowNewMeetingForm(true)}
                                        >
                                            Schedule the first meeting
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {meetings.map((meeting) => (
                                        <Card key={meeting.meeting_id}>
                                            <CardBody>
                                                <h3 className="text-lg font-semibold mb-2">{meeting.title}</h3>
                                                {meeting.description && (
                                                    <p className="text-gray-600 mb-3">{meeting.description}</p>
                                                )}
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
                                                    <div>
                                                        <span className="font-medium">Date: </span>
                                                        <span>{format(new Date(meeting.scheduled_time), 'PPP')}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Time: </span>
                                                        <span>{format(new Date(meeting.scheduled_time), 'p')}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Participants: </span>
                                                        <span>{meeting.participant_count || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-3">
                                                    <Badge color={meeting.status === 'upcoming' ? 'primary' : meeting.status === 'ongoing' ? 'success' : 'default'}>
                                                        {meeting.status === 'upcoming' ? 'Scheduled' :
                                                            meeting.status === 'ongoing' ? 'In Progress' :
                                                                meeting.status === 'ended' ? 'Completed' : meeting.status}
                                                    </Badge>
                                                    {isMember && !meeting.is_participant && meeting.status === 'upcoming' && (
                                                        <Button
                                                            size="sm"
                                                            isLoading={isJoiningMeeting}
                                                            onPress={() => handleJoinMeeting(meeting.meeting_id)}
                                                        >
                                                            Join Meeting
                                                        </Button>
                                                    )}
                                                    {meeting.is_participant && (
                                                        <Badge color="success">Joined</Badge>
                                                    )}
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Members Tab */}
                    {selectedTab === "members" && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Group Members ({groupMembers.length})</h2>

                            {groupMembers.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-600">No members in this group yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupMembers.map((member: SupportGroupMember) => (
                                        <Card key={member.user_id} className="overflow-hidden">
                                            <CardBody>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={member.avatar_url || undefined}
                                                        name={(member.username || '?').charAt(0).toUpperCase()}
                                                        size="lg"
                                                    />
                                                    <div>
                                                        <h3 className="font-semibold">{member.username || 'Unknown User'}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge color={member.role === 'admin' ? 'danger' : member.role === 'moderator' ? 'warning' : 'primary'}>
                                                                {member.role === 'admin' ? 'Admin' :
                                                                    member.role === 'moderator' ? 'Moderator' : 'Member'}
                                                            </Badge>
                                                            <span className="text-xs text-gray-500">
                                                                Joined {format(new Date(member.joined_at), 'PP')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DefaultLayout>
    );
};

export default SupportGroupDetail; 