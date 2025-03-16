import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useSponsor } from "../hooks/useSponsor";
import { useMatching } from "../hooks/useMatching";
import { Container } from "../components/ui/container";
import { Heading } from "../components/ui/heading";
import { Text } from "../components/ui/text";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Spinner } from "../components/ui/spinner";

const Mentees: React.FC = () => {
    const { user } = useUser();
    const { getMentees, isLoading: isSponsorLoading } = useSponsor();
    const {
        acceptMenteeRequest,
        declineMenteeRequest,
        endMentorship,
        isLoading: isMatchingLoading
    } = useMatching();

    const [mentees, setMentees] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("current");

    const isLoading = isSponsorLoading || isMatchingLoading;

    useEffect(() => {
        const fetchMentees = async () => {
            try {
                const data = await getMentees();
                // Separate current mentees from pending requests
                const current = data?.filter((m: any) => m.status === "active") || [];
                const pending = data?.filter((m: any) => m.status === "pending") || [];

                setMentees(current);
                setPendingRequests(pending);
            } catch (error) {
                console.error("Failed to fetch mentees:", error);
            }
        };

        fetchMentees();
    }, [getMentees]);

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await acceptMenteeRequest(requestId);
            // Update local state
            const accepted = pendingRequests.find(req => req.id === requestId);
            if (accepted) {
                setPendingRequests(pendingRequests.filter(req => req.id !== requestId));
                setMentees([...mentees, { ...accepted, status: "active" }]);
            }
        } catch (error) {
            console.error("Failed to accept mentee request:", error);
        }
    };

    const handleDeclineRequest = async (requestId: string) => {
        try {
            await declineMenteeRequest(requestId);
            // Update local state
            setPendingRequests(pendingRequests.filter(req => req.id !== requestId));
        } catch (error) {
            console.error("Failed to decline mentee request:", error);
        }
    };

    const handleEndMentorship = async (menteeId: string) => {
        try {
            await endMentorship(menteeId);
            // Update local state
            setMentees(mentees.filter(mentee => mentee.id !== menteeId));
        } catch (error) {
            console.error("Failed to end mentorship:", error);
        }
    };

    // Filter mentees based on search query
    const filteredMentees = mentees.filter(mentee =>
        mentee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mentee?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter pending requests based on search query
    const filteredRequests = pendingRequests.filter(request =>
        request?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Container className="py-10">
            <Heading level="h1" className="mb-6">My Mentees</Heading>
            <Text className="mb-8">
                Manage your mentee relationships and respond to mentorship requests.
            </Text>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <Input
                    placeholder="Search mentees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="md:max-w-xs"
                />
            </div>

            <Tabs
                defaultValue="current"
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="mb-6">
                    <TabsTrigger value="current">
                        Current Mentees {mentees.length > 0 && `(${mentees.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        Pending Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="current">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Spinner size="lg" />
                        </div>
                    ) : filteredMentees.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Placeholder mentee cards */}
                            {[1, 2, 3, 4, 5].map((item) => (
                                <Card key={item} className="overflow-hidden">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar fallback={`M${item}`} />
                                            <div>
                                                <CardTitle className="text-lg">Mentee {item}</CardTitle>
                                                <div className="text-sm text-muted-foreground">@username{item}</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Mentorship started:</span>
                                                <span>{new Date().toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Last session:</span>
                                                <span>{new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Next session:</span>
                                                <span>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="border-t pt-4 flex justify-between">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { }}
                                        >
                                            Message
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { }}
                                        >
                                            Schedule
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleEndMentorship(`mentee-${item}`)}
                                        >
                                            End
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground mb-4">You don&apos;t have any mentees yet.</p>
                            <Button variant="outline" onClick={() => setActiveTab("pending")}>
                                Check Pending Requests
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Spinner size="lg" />
                        </div>
                    ) : filteredRequests.length > 0 ? (
                        <div className="space-y-6">
                            {/* Placeholder request cards */}
                            {[1, 2, 3].map((item) => (
                                <Card key={item}>
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar fallback={`R${item}`} />
                                                <div>
                                                    <CardTitle className="text-lg">Request {item}</CardTitle>
                                                    <div className="text-sm text-muted-foreground">@request{item}</div>
                                                </div>
                                            </div>
                                            <Badge>New Request</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium mb-1">Why they&apos;re seeking mentorship:</h4>
                                                <p className="text-sm text-muted-foreground mb-4">
                                                    This is a placeholder for the mentee&apos;s reason for seeking mentorship.
                                                    They would explain their goals, challenges, and what they hope to gain
                                                    from the mentorship relationship.
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-1">Areas of interest:</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="outline">Interest 1</Badge>
                                                    <Badge variant="outline">Interest 2</Badge>
                                                    <Badge variant="outline">Interest 3</Badge>
                                                </div>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">Requested on: </span>
                                                <span>{new Date().toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="border-t pt-4 flex justify-end gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDeclineRequest(`request-${item}`)}
                                        >
                                            Decline
                                        </Button>
                                        <Button
                                            onClick={() => handleAcceptRequest(`request-${item}`)}
                                        >
                                            Accept
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">You don&apos;t have any pending mentorship requests.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </Container>
    );
};

export default Mentees; 