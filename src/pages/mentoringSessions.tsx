import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useSponsor } from "../hooks/useSponsor";
import { useMeeting } from "../hooks/useMeeting";
import { Container } from "../components/ui/container";
import { Heading } from "../components/ui/heading";
import { Text } from "../components/ui/text";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Spinner } from "../components/ui/spinner";
import { Avatar } from "../components/ui/avatar";
import { Calendar } from "../components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";

const MentoringSessions: React.FC = () => {
    const { user } = useUser();
    const { getMentees } = useSponsor();
    const {
        getMentoringSessions,
        createMentoringSession,
        cancelMentoringSession,
        isLoading
    } = useMeeting();

    const [sessions, setSessions] = useState<any[]>([]);
    const [mentees, setMentees] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("upcoming");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

    // Form state for creating a new session
    const [newSession, setNewSession] = useState({
        menteeId: "",
        title: "",
        description: "",
        date: new Date(),
        time: "10:00",
        duration: "60",
        type: "one-on-one"
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sessionsData = await getMentoringSessions();
                setSessions(sessionsData || []);

                const menteesData = await getMentees();
                setMentees(menteesData?.filter((m: any) => m.status === "active") || []);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };

        fetchData();
    }, [getMentoringSessions, getMentees]);

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Combine date and time
            const sessionDateTime = new Date(newSession.date);
            const [hours, minutes] = newSession.time.split(':').map(Number);
            sessionDateTime.setHours(hours, minutes);

            await createMentoringSession({
                ...newSession,
                date: sessionDateTime
            });

            // Refresh sessions
            const sessionsData = await getMentoringSessions();
            setSessions(sessionsData || []);

            // Close dialog and reset form
            setIsScheduleDialogOpen(false);
            setNewSession({
                menteeId: "",
                title: "",
                description: "",
                date: new Date(),
                time: "10:00",
                duration: "60",
                type: "one-on-one"
            });
        } catch (error) {
            console.error("Failed to create session:", error);
        }
    };

    const handleCancelSession = async (sessionId: string) => {
        try {
            await cancelMentoringSession(sessionId);

            // Update local state
            setSessions(sessions.map(session =>
                session.id === sessionId
                    ? { ...session, status: "cancelled" }
                    : session
            ));
        } catch (error) {
            console.error("Failed to cancel session:", error);
        }
    };

    // Filter sessions based on active tab
    const filteredSessions = sessions.filter(session => {
        const sessionDate = new Date(session?.scheduledTime || Date.now());

        if (activeTab === "upcoming") {
            return sessionDate > new Date() && session?.status !== "cancelled";
        } else if (activeTab === "past") {
            return sessionDate < new Date() || session?.status === "completed";
        } else if (activeTab === "cancelled") {
            return session?.status === "cancelled";
        }

        return true;
    });

    // Placeholder sessions data
    const placeholderSessions = [
        {
            id: "1",
            title: "Initial Mentoring Session",
            menteeName: "John Doe",
            menteeId: "mentee-1",
            scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            duration: 60,
            type: "one-on-one",
            status: "scheduled"
        },
        {
            id: "2",
            title: "Follow-up Session",
            menteeName: "Jane Smith",
            menteeId: "mentee-2",
            scheduledTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            duration: 45,
            type: "one-on-one",
            status: "scheduled"
        },
        {
            id: "3",
            title: "Group Mentoring",
            menteeName: "Support Group",
            menteeId: "group-1",
            scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            duration: 90,
            type: "group",
            status: "scheduled"
        },
        {
            id: "4",
            title: "Career Guidance",
            menteeName: "Alice Johnson",
            menteeId: "mentee-3",
            scheduledTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            duration: 60,
            type: "one-on-one",
            status: "completed"
        },
        {
            id: "5",
            title: "Cancelled Session",
            menteeName: "Bob Williams",
            menteeId: "mentee-4",
            scheduledTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            duration: 30,
            type: "one-on-one",
            status: "cancelled"
        }
    ];

    // Placeholder mentees data
    const placeholderMentees = [
        { id: "mentee-1", name: "John Doe", username: "john_doe" },
        { id: "mentee-2", name: "Jane Smith", username: "jane_smith" },
        { id: "mentee-3", name: "Alice Johnson", username: "alice_j" },
        { id: "mentee-4", name: "Bob Williams", username: "bob_w" }
    ];

    return (
        <Container className="py-10">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8">
                <div>
                    <Heading level="h1" className="mb-2">Mentoring Sessions</Heading>
                    <Text className="text-muted-foreground">
                        Schedule, manage, and track your mentoring sessions with mentees.
                    </Text>
                </div>
                <div className="mt-4 md:mt-0">
                    <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>Schedule New Session</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Schedule a Mentoring Session</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateSession} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mentee">Mentee</Label>
                                    <Select
                                        value={newSession.menteeId}
                                        onValueChange={(value) => setNewSession({ ...newSession, menteeId: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a mentee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {placeholderMentees.map((mentee) => (
                                                <SelectItem key={mentee.id} value={mentee.id}>
                                                    {mentee.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="title">Session Title</Label>
                                    <Input
                                        id="title"
                                        value={newSession.title}
                                        onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                                        placeholder="e.g., Initial Mentoring Session"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={newSession.description}
                                        onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                                        placeholder="What will you cover in this session?"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
                                        <div className="border rounded-md p-2">
                                            <Calendar
                                                mode="single"
                                                selected={newSession.date}
                                                onSelect={(date) => setNewSession({ ...newSession, date: date || new Date() })}
                                                disabled={(date) => date < new Date()}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="time">Time</Label>
                                        <Input
                                            id="time"
                                            type="time"
                                            value={newSession.time}
                                            onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                                        />

                                        <Label htmlFor="duration" className="mt-4">Duration (minutes)</Label>
                                        <Select
                                            value={newSession.duration}
                                            onValueChange={(value) => setNewSession({ ...newSession, duration: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select duration" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30">30 minutes</SelectItem>
                                                <SelectItem value="45">45 minutes</SelectItem>
                                                <SelectItem value="60">60 minutes</SelectItem>
                                                <SelectItem value="90">90 minutes</SelectItem>
                                                <SelectItem value="120">2 hours</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <Label htmlFor="type" className="mt-4">Session Type</Label>
                                        <Select
                                            value={newSession.type}
                                            onValueChange={(value) => setNewSession({ ...newSession, type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="one-on-one">One-on-One</SelectItem>
                                                <SelectItem value="group">Group Session</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 mt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsScheduleDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">Schedule Session</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs
                defaultValue="upcoming"
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="mb-6">
                    <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
                    <TabsTrigger value="past">Past Sessions</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>

                {["upcoming", "past", "cancelled"].map((tab) => (
                    <TabsContent key={tab} value={tab}>
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Filter placeholder sessions based on tab */}
                                {placeholderSessions
                                    .filter(session => {
                                        if (tab === "upcoming") {
                                            return session.scheduledTime > new Date() && session.status !== "cancelled";
                                        } else if (tab === "past") {
                                            return session.scheduledTime < new Date() || session.status === "completed";
                                        } else if (tab === "cancelled") {
                                            return session.status === "cancelled";
                                        }
                                        return true;
                                    })
                                    .map((session) => (
                                        <Card key={session.id}>
                                            <CardHeader>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar fallback={session.menteeName[0]} />
                                                        <div>
                                                            <CardTitle className="text-lg">{session.title}</CardTitle>
                                                            <div className="text-sm text-muted-foreground">
                                                                with {session.menteeName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge variant={
                                                        session.status === "cancelled" ? "destructive" :
                                                            session.status === "completed" ? "secondary" :
                                                                "default"
                                                    }>
                                                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-sm font-medium">Date & Time</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {session.scheduledTime.toLocaleDateString()} at {session.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">Duration</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {session.duration} minutes
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">Type</div>
                                                        <div className="text-sm text-muted-foreground capitalize">
                                                            {session.type}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex justify-end gap-4">
                                                {session.status !== "cancelled" && session.status !== "completed" && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleCancelSession(session.id)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button>
                                                            {new Date() >= session.scheduledTime ? "Start Session" : "Reschedule"}
                                                        </Button>
                                                    </>
                                                )}
                                                {session.status === "completed" && (
                                                    <Button variant="outline">View Notes</Button>
                                                )}
                                                {session.status === "cancelled" && (
                                                    <Button variant="outline">Reschedule</Button>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    ))}

                                {placeholderSessions.filter(session => {
                                    if (tab === "upcoming") {
                                        return session.scheduledTime > new Date() && session.status !== "cancelled";
                                    } else if (tab === "past") {
                                        return session.scheduledTime < new Date() || session.status === "completed";
                                    } else if (tab === "cancelled") {
                                        return session.status === "cancelled";
                                    }
                                    return true;
                                }).length === 0 && (
                                        <div className="text-center py-10">
                                            <p className="text-muted-foreground mb-4">
                                                {tab === "upcoming"
                                                    ? "You don't have any upcoming sessions."
                                                    : tab === "past"
                                                        ? "You don't have any past sessions."
                                                        : "You don't have any cancelled sessions."}
                                            </p>
                                            {tab === "upcoming" && (
                                                <Button onClick={() => setIsScheduleDialogOpen(true)}>
                                                    Schedule a Session
                                                </Button>
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </Container>
    );
};

export default MentoringSessions; 