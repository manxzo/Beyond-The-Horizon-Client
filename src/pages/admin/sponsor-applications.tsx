import React, { useState } from "react";
import { useAdmin } from "../../hooks/admin/useAdmin";
import { Container } from "../../components/ui/container";
import { Heading } from "../../components/ui/heading";
import { Text } from "../../components/ui/text";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Spinner } from "../../components/ui/spinner";
import { Avatar } from "../../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { useQuery } from "@tanstack/react-query";

const SponsorApplications: React.FC = () => {
    const {
        getPendingSponsorApplications,
        reviewSponsorApplication,
        isReviewingSponsorApplication
    } = useAdmin();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedApplication, setSelectedApplication] = useState<any>(null);
    const [isApplicationDetailOpen, setIsApplicationDetailOpen] = useState(false);
    const [feedbackNote, setFeedbackNote] = useState("");
    const [activeTab, setActiveTab] = useState("pending");

    // Fetch pending sponsor applications
    const {
        data: pendingSponsorApplicationsData,
        isLoading: isPendingSponsorApplicationsLoading,
        error: pendingSponsorApplicationsError
    } = useQuery(getPendingSponsorApplications());

    const isLoading = isPendingSponsorApplicationsLoading || isReviewingSponsorApplication;

    // Placeholder applications data - in a real app, this would come from the API
    const allApplications = [
        {
            id: "1",
            user: {
                id: "user1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                avatar: null
            },
            motivation: "I've been in recovery for 5 years and want to give back to the community that helped me.",
            experience: "I've been volunteering at local recovery centers for 3 years and have completed mentor training.",
            references: [
                { name: "Dr. Sarah Johnson", contact: "sarah.johnson@rehab.org", relationship: "Therapist" },
                { name: "Michael Williams", contact: "michael@recoverygroup.com", relationship: "Group Leader" }
            ],
            status: "pending",
            submittedAt: new Date(2023, 5, 15).toISOString()
        },
        {
            id: "2",
            user: {
                id: "user2",
                firstName: "Jane",
                lastName: "Smith",
                email: "jane@example.com",
                avatar: null
            },
            motivation: "After losing my brother to addiction, I want to help others avoid the same fate.",
            experience: "I'm a certified counselor with 7 years of experience in addiction treatment.",
            references: [
                { name: "Dr. Robert Brown", contact: "robert@counseling.org", relationship: "Supervisor" },
                { name: "Lisa Chen", contact: "lisa@recoveryalliance.org", relationship: "Colleague" }
            ],
            status: "approved",
            submittedAt: new Date(2023, 4, 20).toISOString(),
            reviewedAt: new Date(2023, 4, 25).toISOString(),
            feedbackNote: "Excellent qualifications and experience. Approved."
        },
        {
            id: "3",
            user: {
                id: "user3",
                firstName: "Mark",
                lastName: "Johnson",
                email: "mark@example.com",
                avatar: null
            },
            motivation: "I want to share my journey of recovery and help others find their path.",
            experience: "I've been sober for 2 years and have completed peer support training.",
            references: [
                { name: "Amanda Wilson", contact: "amanda@supportgroup.org", relationship: "Group Facilitator" }
            ],
            status: "rejected",
            submittedAt: new Date(2023, 5, 5).toISOString(),
            reviewedAt: new Date(2023, 5, 10).toISOString(),
            feedbackNote: "Insufficient experience at this time. Please reapply after completing additional training."
        },
        {
            id: "4",
            user: {
                id: "user4",
                firstName: "Emily",
                lastName: "Davis",
                email: "emily@example.com",
                avatar: null
            },
            motivation: "As a healthcare professional, I want to volunteer my time to help those in recovery.",
            experience: "I'm a registered nurse with 10 years of experience in mental health and addiction treatment.",
            references: [
                { name: "Dr. James Wilson", contact: "james@hospital.org", relationship: "Chief of Psychiatry" },
                { name: "Sarah Thompson", contact: "sarah@mentalhealth.org", relationship: "Director" }
            ],
            status: "pending",
            submittedAt: new Date(2023, 5, 18).toISOString()
        },
        {
            id: "5",
            user: {
                id: "user5",
                firstName: "Michael",
                lastName: "Brown",
                email: "michael@example.com",
                avatar: null
            },
            motivation: "I've been through the recovery process and want to be the mentor I wish I had.",
            experience: "4 years sober, certified recovery coach, and active in community outreach.",
            references: [
                { name: "Jennifer Adams", contact: "jennifer@recoverycoach.org", relationship: "Mentor" },
                { name: "David Miller", contact: "david@community.org", relationship: "Program Director" }
            ],
            status: "pending",
            submittedAt: new Date(2023, 5, 10).toISOString()
        }
    ];

    // In a real app, we would use the data from the API
    // const applications = pendingSponsorApplicationsData?.data || [];
    const applications = allApplications;

    const handleApproveApplication = async (applicationId: string) => {
        try {
            await reviewSponsorApplication(applicationId, "approved", feedbackNote);
            setIsApplicationDetailOpen(false);
            setFeedbackNote("");
        } catch (error) {
            console.error("Failed to approve application:", error);
        }
    };

    const handleRejectApplication = async (applicationId: string) => {
        try {
            await reviewSponsorApplication(applicationId, "rejected", feedbackNote);
            setIsApplicationDetailOpen(false);
            setFeedbackNote("");
        } catch (error) {
            console.error("Failed to reject application:", error);
        }
    };

    // Filter applications based on search query
    const filteredApplications = applications.filter(app => {
        const matchesSearch =
            app?.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app?.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app?.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app?.motivation?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    // Get applications for the active tab
    const getTabApplications = () => {
        switch (activeTab) {
            case "pending":
                return filteredApplications.filter(app => app.status === "pending");
            case "approved":
                return filteredApplications.filter(app => app.status === "approved");
            case "rejected":
                return filteredApplications.filter(app => app.status === "rejected");
            default:
                return filteredApplications;
        }
    };

    return (
        <Container className="py-10">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8">
                <div>
                    <Heading level="h1" className="mb-2">Sponsor Applications</Heading>
                    <Text className="text-muted-foreground">
                        Review and manage applications from users who want to become sponsors.
                    </Text>
                </div>
                <div className="mt-4 md:mt-0">
                    <Button>Export Applications</Button>
                </div>
            </div>

            <Tabs
                defaultValue="pending"
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="mb-6">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Applications</CardTitle>
                            <CardDescription>
                                {activeTab === "pending"
                                    ? "Applications awaiting review"
                                    : activeTab === "approved"
                                        ? "Applications that have been approved"
                                        : "Applications that have been rejected"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6">
                                <Input
                                    placeholder="Search applications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="max-w-md"
                                />
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <Spinner size="lg" />
                                </div>
                            ) : getTabApplications().length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Applicant</TableHead>
                                                <TableHead>Motivation</TableHead>
                                                <TableHead>Experience</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {getTabApplications().map((application) => (
                                                <TableRow key={application.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar fallback={application.user.firstName[0] + application.user.lastName[0]} />
                                                            <div>
                                                                <div className="font-medium">{application.user.firstName} {application.user.lastName}</div>
                                                                <div className="text-sm text-muted-foreground">{application.user.email}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm truncate max-w-[200px]">
                                                            {application.motivation}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm truncate max-w-[200px]">
                                                            {application.experience}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{new Date(application.submittedAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            application.status === "pending" ? "outline" :
                                                                application.status === "approved" ? "default" :
                                                                    "destructive"
                                                        }>
                                                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedApplication(application);
                                                                    setIsApplicationDetailOpen(true);
                                                                    setFeedbackNote("");
                                                                }}
                                                            >
                                                                View
                                                            </Button>
                                                            {application.status === "pending" && (
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedApplication(application);
                                                                        setIsApplicationDetailOpen(true);
                                                                        setFeedbackNote("");
                                                                    }}
                                                                >
                                                                    Review
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">No {activeTab} applications found.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Application Detail Dialog */}
            <Dialog open={isApplicationDetailOpen} onOpenChange={setIsApplicationDetailOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Sponsor Application</DialogTitle>
                    </DialogHeader>
                    {selectedApplication && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16" fallback={selectedApplication.user.firstName[0] + selectedApplication.user.lastName[0]} />
                                <div>
                                    <h3 className="text-xl font-semibold">{selectedApplication.user.firstName} {selectedApplication.user.lastName}</h3>
                                    <p className="text-muted-foreground">{selectedApplication.user.email}</p>
                                </div>
                                <Badge className="ml-auto" variant={
                                    selectedApplication.status === "pending" ? "outline" :
                                        selectedApplication.status === "approved" ? "default" :
                                            "destructive"
                                }>
                                    {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                                </Badge>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-1">Motivation</h4>
                                <p className="p-3 bg-muted rounded-md">{selectedApplication.motivation}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-1">Experience</h4>
                                <p className="p-3 bg-muted rounded-md">{selectedApplication.experience}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-2">References</h4>
                                <div className="space-y-3">
                                    {selectedApplication.references.map((reference: any, index: number) => (
                                        <div key={index} className="p-3 bg-muted rounded-md">
                                            <p className="font-medium">{reference.name}</p>
                                            <p className="text-sm">{reference.relationship}</p>
                                            <p className="text-sm text-muted-foreground">{reference.contact}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">Submitted On</p>
                                    <p>{new Date(selectedApplication.submittedAt).toLocaleDateString()}</p>
                                </div>
                                {selectedApplication.reviewedAt && (
                                    <div>
                                        <p className="text-sm font-medium">Reviewed On</p>
                                        <p>{new Date(selectedApplication.reviewedAt).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>

                            {selectedApplication.status !== "pending" && selectedApplication.feedbackNote && (
                                <div>
                                    <p className="text-sm font-medium mb-1">Feedback</p>
                                    <p className="p-3 bg-muted rounded-md">{selectedApplication.feedbackNote}</p>
                                </div>
                            )}

                            {selectedApplication.status === "pending" && (
                                <>
                                    <Separator />
                                    <div>
                                        <Label htmlFor="feedback-note">Feedback Note</Label>
                                        <Textarea
                                            id="feedback-note"
                                            placeholder="Enter feedback for the applicant..."
                                            value={feedbackNote}
                                            onChange={(e) => setFeedbackNote(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </>
                            )}

                            <DialogFooter>
                                <div className="flex justify-end gap-4 w-full">
                                    <Button variant="outline" onClick={() => setIsApplicationDetailOpen(false)}>
                                        Close
                                    </Button>
                                    {selectedApplication.status === "pending" && (
                                        <>
                                            <Button
                                                variant="destructive"
                                                onClick={() => handleRejectApplication(selectedApplication.id)}
                                                disabled={!feedbackNote.trim()}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                variant="default"
                                                onClick={() => handleApproveApplication(selectedApplication.id)}
                                                disabled={!feedbackNote.trim()}
                                            >
                                                Approve
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default SponsorApplications; 