import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useSponsor } from "../hooks/useSponsor";
import { Container } from "../components/ui/container";
import { Heading } from "../components/ui/heading";
import { Text } from "../components/ui/text";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Spinner } from "../components/ui/spinner";
import { Avatar } from "../components/ui/avatar";
import { Progress } from "../components/ui/progress";

const SponsorDashboard: React.FC = () => {
    const { user } = useUser();
    const {
        getSponsorStats,
        getSponsorActivities,
        isLoading
    } = useSponsor();

    const [stats, setStats] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsData = await getSponsorStats();
                setStats(statsData);

                const activitiesData = await getSponsorActivities();
                setActivities(activitiesData || []);
            } catch (error) {
                console.error("Failed to fetch sponsor data:", error);
            }
        };

        fetchData();
    }, [getSponsorStats, getSponsorActivities]);

    // Placeholder stats data
    const placeholderStats = {
        activeMentees: 5,
        pendingRequests: 2,
        totalSessions: 28,
        sessionsThisMonth: 8,
        averageRating: 4.8,
        totalHours: 42,
        completedMentorships: 3
    };

    // Placeholder upcoming sessions
    const upcomingSessions = [
        { id: 1, menteeName: "John Doe", date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), type: "One-on-One" },
        { id: 2, menteeName: "Jane Smith", date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), type: "One-on-One" },
        { id: 3, menteeName: "Group Session", date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), type: "Group" }
    ];

    // Placeholder recent activities
    const recentActivities = [
        { id: 1, type: "session", menteeName: "John Doe", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), description: "Completed a mentoring session" },
        { id: 2, type: "request", menteeName: "Alice Johnson", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), description: "Accepted mentorship request" },
        { id: 3, type: "message", menteeName: "Bob Williams", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), description: "Sent a message" },
        { id: 4, type: "session", menteeName: "Group Session", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), description: "Hosted a group session" }
    ];

    return (
        <Container className="py-10">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8">
                <div>
                    <Heading level="h1" className="mb-2">Sponsor Dashboard</Heading>
                    <Text className="text-muted-foreground">
                        Welcome back, {user?.firstName || "Sponsor"}. Here's an overview of your mentoring activities.
                    </Text>
                </div>
                <div className="mt-4 md:mt-0">
                    <Button>Schedule a Session</Button>
                </div>
            </div>

            <Tabs
                defaultValue="overview"
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
                    <TabsTrigger value="activities">Recent Activities</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Active Mentees</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{placeholderStats.activeMentees}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {placeholderStats.pendingRequests} pending requests
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="ghost" size="sm" className="w-full" onClick={() => window.location.href = "/mentees"}>
                                            View Mentees
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Total Sessions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{placeholderStats.totalSessions}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {placeholderStats.sessionsThisMonth} this month
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="ghost" size="sm" className="w-full" onClick={() => window.location.href = "/mentoring-sessions"}>
                                            View Sessions
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Mentee Satisfaction</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">{placeholderStats.averageRating}/5.0</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Based on {placeholderStats.totalSessions} sessions
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <div className="w-full flex items-center gap-2">
                                            <Progress value={placeholderStats.averageRating * 20} className="h-2" />
                                            <span className="text-xs text-muted-foreground">
                                                {placeholderStats.averageRating * 20}%
                                            </span>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Upcoming Sessions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {upcomingSessions.length > 0 ? (
                                            <div className="space-y-4">
                                                {upcomingSessions.map((session) => (
                                                    <div key={session.id} className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar fallback={session.menteeName[0]} />
                                                            <div>
                                                                <div className="font-medium">{session.menteeName}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {session.date.toLocaleDateString()} at {session.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge variant={session.type === "Group" ? "secondary" : "default"}>
                                                            {session.type}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-muted-foreground">No upcoming sessions</p>
                                                <Button variant="outline" className="mt-4">Schedule a Session</Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recent Activities</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {recentActivities.length > 0 ? (
                                            <div className="space-y-4">
                                                {recentActivities.map((activity) => (
                                                    <div key={activity.id} className="flex justify-between items-start">
                                                        <div className="flex items-start gap-3">
                                                            <div className="mt-1">
                                                                <Badge variant="outline" className="rounded-full h-8 w-8 p-0 flex items-center justify-center">
                                                                    {activity.type === "session" ? "S" :
                                                                        activity.type === "request" ? "R" : "M"}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{activity.description}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    With {activity.menteeName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {activity.date.toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-muted-foreground">No recent activities</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="sessions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Mentoring Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {upcomingSessions.length > 0 ? (
                                <div className="space-y-6">
                                    {upcomingSessions.map((session) => (
                                        <Card key={session.id}>
                                            <CardHeader>
                                                <div className="flex justify-between items-center">
                                                    <CardTitle className="text-lg">{session.type} Session with {session.menteeName}</CardTitle>
                                                    <Badge variant={session.type === "Group" ? "secondary" : "default"}>
                                                        {session.type}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Date:</span>
                                                        <span>{session.date.toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Time:</span>
                                                        <span>{session.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Status:</span>
                                                        <Badge variant="outline">Scheduled</Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex justify-end gap-4">
                                                <Button variant="outline">Reschedule</Button>
                                                <Button>Join Session</Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground mb-4">You don't have any upcoming sessions.</p>
                                    <Button>Schedule a Session</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activities">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentActivities.length > 0 ? (
                                <div className="space-y-6">
                                    {recentActivities.map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                                            <div>
                                                <Badge variant="outline" className="rounded-full h-10 w-10 p-0 flex items-center justify-center">
                                                    {activity.type === "session" ? "S" :
                                                        activity.type === "request" ? "R" : "M"}
                                                </Badge>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">{activity.description}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    With {activity.menteeName}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {activity.date.toLocaleDateString()} at {activity.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                Details
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">No recent activities found.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </Container>
    );
};

export default SponsorDashboard; 