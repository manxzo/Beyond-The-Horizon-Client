import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Spinner,
    Divider,
    Avatar,
    Chip,
    Badge,
} from "@heroui/react";
import {
    Users,
    Calendar,
    Clock,
    AlertTriangle,
    Play,
    CheckCircle,
    ArrowLeft,
    MessageSquare,
} from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useMeeting } from "../hooks/useMeeting";
import { useUser } from "../hooks/useUser";
import { MeetingStatus } from "../interfaces/enums";
import { userService } from "../services/services";

// Define participant interface
interface MeetingParticipant {
    meeting_id: string;
    user_id: string;
    username?: string;
    avatar_url?: string;
    email?: string;
    is_host?: boolean;
}

// Function to get user details by ID
const getUserDetailsById = async (userId: string) => {
    try {
        const response = await userService.getUserById(userId);
        return response.data;
    } catch (error) {
        console.error(`Error fetching user ${userId} details:`, error);
        return null;
    }
};

// Process participants with user details
const fetchParticipantsDetails = async (participants: MeetingParticipant[], hostId: string) => {
    try {
        const participantsWithDetails = await Promise.all(
            participants.map(async (participant) => {
                const userDetails = await getUserDetailsById(participant.user_id);
                return {
                    ...participant,
                    username: userDetails?.username || 'Unknown User',
                    avatar_url: userDetails?.avatar_url || '',
                    email: userDetails?.email || '',
                    is_host: participant.user_id === hostId
                };
            })
        );
        console.log(participantsWithDetails);
        return participantsWithDetails;
    } catch (error) {
        console.error('Error fetching participants details:', error);
        return participants;
    }
};

export default function Meeting() {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const [isHost, setIsHost] = useState(false);
    const [isParticipant, setIsParticipant] = useState(false);
    const [participantsWithDetails, setParticipantsWithDetails] = useState<MeetingParticipant[]>([]);
    const [isProcessingParticipants, setIsProcessingParticipants] = useState(false);

    // Get meeting hooks
    const {
        getMeeting,
        getMeetingParticipants,
        joinMeeting,
        leaveMeeting,
        startMeeting,
        endMeeting,
        isJoiningMeeting,
        isLeavingMeeting,
        isStartingMeeting,
        isEndingMeeting,
    } = useMeeting();

    // Get user hooks
    const { currentUser } = useUser();

    // Fetch meeting details
    const {
        data: meetingResponse,
        isLoading: isLoadingMeeting,
        error: meetingError,
        refetch: refetchMeeting,
    } = useQuery(getMeeting(meetingId || ''));

    // Extract the actual meeting data
    const meeting = meetingResponse?.data;

    // Fetch meeting participants
    const {
        data: participantsResponse,
        isLoading: isLoadingParticipants,
        refetch: refetchParticipants,
    } = useQuery(getMeetingParticipants(meetingId || ''));

    // Extract the actual participants data and process it
    useEffect(() => {
        const processParticipants = async () => {
            if (participantsResponse && meeting) {
                setIsProcessingParticipants(true);
                try {
                    const participants = participantsResponse|| [];
                    const hostId = meeting.host_id;
                    const detailedParticipants = await fetchParticipantsDetails(participants, hostId);
                    console.log(detailedParticipants);
                    setParticipantsWithDetails(detailedParticipants);
                } catch (error) {
                    console.error('Failed to process participants:', error);
                } finally {
                    setIsProcessingParticipants(false);
                }
            }
        };

        processParticipants();
    }, [participantsResponse, meeting]);

    // Check if current user is host or participant
    useEffect(() => {
        if (currentUser && meeting) {
            // Check if user is host
            const userIsHost = currentUser.user_id === meeting.host_id;
            setIsHost(userIsHost);

            // Check if current user is in the participants list
            const userIsParticipant =
                Array.isArray(participantsWithDetails) &&
                participantsWithDetails.some(
                    (participant: MeetingParticipant) => participant.user_id === currentUser.user_id
                );

            setIsParticipant(userIsParticipant);
        }
    }, [currentUser, meeting, participantsWithDetails]);

    // Handle joining the meeting
    const handleJoinMeeting = () => {
        if (meetingId && currentUser) {
            joinMeeting(meetingId);
            setTimeout(() => {
                refetchParticipants();
                refetchMeeting();
            }, 1000);
        }
    };

    // Handle leaving the meeting
    const handleLeaveMeeting = () => {
        if (meetingId && currentUser) {
            leaveMeeting(meetingId);
            setTimeout(() => {
                refetchParticipants();
                refetchMeeting();
            }, 1000);
        }
    };

    // Handle starting the meeting
    const handleStartMeeting = () => {
        if (meetingId) {
            startMeeting(meetingId);
            setTimeout(() => {
                refetchMeeting();
            }, 1000);
        }
    };

    // Handle ending the meeting
    const handleEndMeeting = () => {
        if (meetingId) {
            endMeeting(meetingId);
            setTimeout(() => {
                refetchMeeting();
            }, 1000);
        }
    };

    // Handle navigating to the meeting chat
    const handleViewMeetingChat = (chatId: string) => {
        navigate(`/group-chats/${chatId}`);
    };

    // Handle navigating back to the support group
    const handleBackToGroup = () => {
        if (meeting?.support_group_id) {
            navigate(`/support-groups/${meeting.support_group_id}`);
        } else {
            navigate('/support-groups');
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get status badge based on meeting status
    const getStatusBadge = (status: MeetingStatus) => {
        switch (status) {
            case MeetingStatus.Upcoming:
                return <Badge color="primary" variant="flat">Upcoming</Badge>;
            case MeetingStatus.Ongoing:
                return <Badge color="success" variant="flat">Ongoing</Badge>;
            case MeetingStatus.Ended:
                return <Badge color="default" variant="flat">Ended</Badge>;
            default:
                return null;
        }
    };

    // Check if meeting is about to start (within 15 minutes of scheduled time)
    const isAboutToStart = (scheduledTime: string) => {
        if (!scheduledTime) return false;
        const scheduledDate = new Date(scheduledTime);
        const now = new Date();
        const diffMs = scheduledDate.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // Meeting can be started 15 minutes before scheduled time
        return diffMinutes <= 15;
    };

    if (isLoadingMeeting || isLoadingParticipants || isProcessingParticipants) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-[70vh]">
                    <Spinner size="lg" color="primary" />
                </div>
            </DefaultLayout>
        );
    }

    if (meetingError || !meeting) {
        return (
            <DefaultLayout>
                <div className="flex flex-col items-center justify-center h-[70vh]">
                    <AlertTriangle size={48} className="text-danger mb-4" />
                    <h2 className="text-2xl font-bold mb-4">Error Loading Meeting</h2>
                    <p className="text-danger mb-6">
                        {(meetingError as Error)?.message || "Failed to load meeting details"}
                    </p>
                    <div className="flex gap-4">
                        <Button color="primary" onPress={() => window.location.reload()}>
                            Try Again
                        </Button>
                        <Button variant="flat" onPress={() => navigate(-1)}>
                            Go Back
                        </Button>
                    </div>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="py-8">
                <div className="mb-6">
                    <Button
                        variant="flat"
                        startContent={<ArrowLeft size={18} />}
                        onPress={handleBackToGroup}
                    >
                        Back to Support Group
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{meeting.title}</h1>
                        <div className="flex flex-wrap gap-2">
                            {meeting.status && getStatusBadge(meeting.status)}
                            {isParticipant && (
                                <Chip color="success" size="sm" variant="flat">You&apos;ve Joined</Chip>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isHost && meeting.status === MeetingStatus.Upcoming && (
                            <Button
                                color="success"
                                startContent={<Play size={18} />}
                                onPress={handleStartMeeting}
                                isLoading={isStartingMeeting}
                                isDisabled={!isAboutToStart(meeting.scheduled_time)}
                            >
                                Start Meeting
                            </Button>
                        )}
                        {isHost && meeting.status === MeetingStatus.Ongoing && (
                            <Button
                                color="danger"
                                variant="flat"
                                onPress={handleEndMeeting}
                                isLoading={isEndingMeeting}
                            >
                                End Meeting
                            </Button>
                        )}
                        {!isParticipant && meeting.status !== MeetingStatus.Ended && (
                            <Button
                                color="primary"
                                onPress={handleJoinMeeting}
                                isLoading={isJoiningMeeting}
                            >
                                Join Meeting
                            </Button>
                        )}
                        {isParticipant && meeting.status !== MeetingStatus.Ended && !isHost && (
                            <Button
                                color="danger"
                                variant="flat"
                                onPress={handleLeaveMeeting}
                                isLoading={isLeavingMeeting}
                            >
                                Leave Meeting
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card className="mb-6">
                            <CardHeader className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-default-500">
                                    <Calendar size={18} />
                                    <span className="font-semibold">Scheduled for:</span>
                                    <span>{formatDate(meeting.scheduled_time)}</span>
                                </div>
                                {meeting.host_id && (
                                    <HostInfo hostId={meeting.host_id} />
                                )}
                            </CardHeader>
                            <Divider />
                            <CardBody>
                                <h3 className="text-lg font-semibold mb-2">About this meeting</h3>
                                <p>{meeting.description || "No description provided."}</p>
                            </CardBody>
                        </Card>

                        {meeting.status === MeetingStatus.Ongoing && meeting.meeting_chat_id && (
                            <Card className="mb-6 border border-success">
                                <CardHeader>
                                    <h3 className="text-xl font-semibold flex items-center gap-2">
                                        <MessageSquare size={20} />
                                        Meeting Chat
                                    </h3>
                                </CardHeader>
                                <Divider />
                                <CardBody>
                                    <p className="mb-4">
                                        Join the meeting chat to communicate with other participants in real-time.
                                    </p>
                                </CardBody>
                                <Divider />
                                <CardFooter>
                                    <Button
                                        color="success"
                                        fullWidth
                                        onPress={() => handleViewMeetingChat(meeting.meeting_chat_id || '')}
                                        startContent={<MessageSquare size={18} />}
                                    >
                                        Open Meeting Chat
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}

                        {meeting.status === MeetingStatus.Upcoming && (
                            <Card className="mb-6">
                                <CardHeader>
                                    <h3 className="text-xl font-semibold flex items-center gap-2">
                                        <Clock size={20} />
                                        Meeting Status
                                    </h3>
                                </CardHeader>
                                <CardBody className="flex flex-col items-center py-8">
                                    <Clock size={48} className="text-primary mb-4" />
                                    <p className="text-xl font-medium mb-2">Meeting hasn&apos;t started yet</p>
                                    <p className="text-default-500 text-center">
                                        The host will start the meeting at the scheduled time.
                                        {isAboutToStart(meeting.scheduled_time) && isHost && (
                                            " You can start the meeting now."
                                        )}
                                    </p>

                                    {isParticipant && !isHost && (
                                        <Chip color="success" className="mt-4">You&apos;re registered for this meeting</Chip>
                                    )}

                                    {isAboutToStart(meeting.scheduled_time) && isHost && (
                                        <Button
                                            color="success"
                                            className="mt-4"
                                            startContent={<Play size={18} />}
                                            onPress={handleStartMeeting}
                                            isLoading={isStartingMeeting}
                                        >
                                            Start Meeting Now
                                        </Button>
                                    )}
                                </CardBody>
                            </Card>
                        )}

                        {meeting.status === MeetingStatus.Ended && (
                            <Card className="mb-6">
                                <CardHeader>
                                    <h3 className="text-xl font-semibold flex items-center gap-2">
                                        <CheckCircle size={20} />
                                        Meeting Ended
                                    </h3>
                                </CardHeader>
                                <CardBody className="flex flex-col items-center py-8">
                                    <CheckCircle size={48} className="text-success mb-4" />
                                    <p className="text-xl font-medium mb-2">This meeting has ended</p>
                                    <p className="text-default-500 text-center">
                                        Thank you for participating. Check back later for future meetings.
                                    </p>
                                </CardBody>
                            </Card>
                        )}
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <Users size={18} />
                                    <span>Participants</span>
                                    <span className="ml-1 text-small">({participantsWithDetails.length || 0})</span>
                                </h3>
                            </CardHeader>
                            <Divider />
                            <CardBody>
                                {participantsWithDetails.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        {participantsWithDetails.map((participant: MeetingParticipant) => (
                                            <ParticipantItem
                                                key={participant.user_id}
                                                userId={participant.user_id}
                                                isHost={participant.user_id === meeting.host_id}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <Users size={36} className="text-default-400 mb-3" />
                                        <p className="text-default-500 text-center">No participants yet</p>
                                    </div>
                                )}
                            </CardBody>
                            {meeting.status !== MeetingStatus.Ended && (
                                <>
                                    <Divider />
                                    <CardFooter>
                                        {!isParticipant ? (
                                            <Button
                                                color="primary"
                                                fullWidth
                                                onPress={handleJoinMeeting}
                                                isLoading={isJoiningMeeting}
                                            >
                                                Join Meeting
                                            </Button>
                                        ) : !isHost && (
                                            <Button
                                                color="danger"
                                                variant="flat"
                                                fullWidth
                                                onPress={handleLeaveMeeting}
                                                isLoading={isLeavingMeeting}
                                            >
                                                Leave Meeting
                                            </Button>
                                        )}
                                    </CardFooter>
                                </>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </DefaultLayout>
    );
}

// Host info component
function HostInfo({ hostId }: { hostId: string }) {
    const [hostData, setHostData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch host data when component mounts
    useEffect(() => {
        const fetchHostData = async () => {
            try {
                setIsLoading(true);
                const result = await getUserDetailsById(hostId);
                setHostData(result);
                setIsLoading(false);
            } catch (err) {
                console.error(`Failed to fetch host ${hostId} details:`, err);
                setError(`Failed to load host information`);
                setIsLoading(false);
            }
        };

        fetchHostData();
    }, [hostId]);

    if (isLoading) {
        return <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <span>Loading host info...</span>
        </div>;
    }

    if (error || !hostData) {
        return <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={18} />
            <span>{error || "Error loading host data"}</span>
        </div>;
    }

    return (
        <div className="flex items-center gap-2">
            <Avatar
                src={hostData.avatar_url}
                name={(hostData.username || 'Host').charAt(0).toUpperCase()}
                size="sm"
            />
            <div>
                <p className="font-semibold">{hostData.username || 'Host'}</p>
                {hostData.email && (
                    <p className="text-tiny text-default-500">{hostData.email}</p>
                )}
                <p className="text-tiny text-default-500">Meeting Host</p>
            </div>
        </div>
    );
}

// Participant item component
function ParticipantItem({ userId, isHost }: { userId: string; isHost: boolean }) {
    const [userData, setUserData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user data when component mounts
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setIsLoading(true);
                const result = await getUserDetailsById(userId);
                setUserData(result);
                setIsLoading(false);
            } catch (err) {
                console.error(`Failed to fetch user ${userId} details:`, err);
                setError(`Failed to load user information`);
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    if (isLoading) {
        return <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <span>Loading participant info...</span>
        </div>;
    }

    if (error || !userData) {
        return <div className="flex items-center gap-2 text-danger">
            <AlertTriangle size={18} />
            <span>{error || "Error loading user data"}</span>
        </div>;
    }

    return (
        <div className="flex items-center gap-3">
            <Avatar
                src={userData.avatar_url}
                name={(userData.username || 'User').charAt(0).toUpperCase()}
                size="sm"
            />
            <div className="flex-grow">
                <p className="font-semibold">{userData.username || 'User'}</p>
                {userData.email && (
                    <p className="text-tiny text-default-500">{userData.email}</p>
                )}
                {isHost && (
                    <p className="text-tiny text-default-500">Meeting Host</p>
                )}
            </div>
            {isHost && (
                <Chip color="warning" size="sm">Host</Chip>
            )}
        </div>
    );
} 