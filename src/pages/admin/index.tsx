import React, { useState } from "react";
import { useAdmin } from "../../hooks/admin/useAdmin";
import { Container } from "../../components/ui/container";
import { Heading } from "../../components/ui/heading";
import { Text } from "../../components/ui/text";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Spinner } from "../../components/ui/spinner";
import { Avatar } from "../../components/ui/avatar";
import { Progress } from "../../components/ui/progress";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useQuery } from "@tanstack/react-query";

// Import chart components (assuming you have these)
import { LineChart, BarChart, PieChart } from "../../components/ui/charts";

const AdminDashboard: React.FC = () => {
    const {
        getAdminStats,
        getPendingSponsorApplications,
        getPendingSupportGroups,
        getUnresolvedReports
    } = useAdmin();

    const [activeTab, setActiveTab] = useState("overview");

    // Fetch admin statistics
    const {
        data: adminStatsData,
        isLoading: isAdminStatsLoading,
        error: adminStatsError
    } = useQuery(getAdminStats());

    // Fetch pending sponsor applications
    const {
        data: pendingSponsorApplicationsData,
        isLoading: isPendingSponsorApplicationsLoading,
        error: pendingSponsorApplicationsError
    } = useQuery(getPendingSponsorApplications());

    // Fetch pending support groups
    const {
        data: pendingSupportGroupsData,
        isLoading: isPendingSupportGroupsLoading,
        error: pendingSupportGroupsError
    } = useQuery(getPendingSupportGroups());

    // Fetch unresolved reports
    const {
        data: unresolvedReportsData,
        isLoading: isUnresolvedReportsLoading,
        error: unresolvedReportsError
    } = useQuery(getUnresolvedReports());

    const isLoading =
        isAdminStatsLoading ||
        isPendingSponsorApplicationsLoading ||
        isPendingSupportGroupsLoading ||
        isUnresolvedReportsLoading;

    // Placeholder statistics data - in a real app, this would come from the API
    const stats = {
        totalUsers: 2547,
        activeUsers: 1823,
        newUsersThisMonth: 156,
        totalSupportGroups: 87,
        activeSupportGroups: 72,
        totalSponsors: 134,
        activeSponsors: 112,
        totalResources: 245,
        pendingApplications: 12,
        unresolvedReports: 8,
        pendingSupportGroups: 5
    };

    // Placeholder chart data
    const userGrowthData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'New Users',
                data: [65, 78, 90, 105, 125, 156],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    const userTypeData = {
        labels: ['Regular Users', 'Sponsors', 'Mentees', 'Admins'],
        datasets: [
            {
                label: 'User Types',
                data: [1850, 134, 542, 21],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)'
                ],
                borderWidth: 1
            }
        ]
    };

    const platformActivityData = {
        labels: ['Support Groups', 'Resources', 'Mentoring', 'Forum Posts', 'Events'],
        datasets: [
            {
                label: 'Activity Count',
                data: [245, 320, 178, 430, 120],
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
            }
        ]
    };

    // Placeholder pending applications data
    const pendingApplications = [
        {
            id: "1",
            type: "sponsor",
            user: {
                id: "user1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                avatar: null
            },
            submittedAt: new Date(2023, 5, 15).toISOString()
        },
        {
            id: "2",
            type: "sponsor",
            user: {
                id: "user2",
                firstName: "Jane",
                lastName: "Smith",
                email: "jane@example.com",
                avatar: null
            },
            submittedAt: new Date(2023, 5, 14).toISOString()
        },
        {
            id: "3",
            type: "support-group",
            name: "Anxiety Support Circle",
            creator: {
                id: "user3",
                firstName: "Mark",
                lastName: "Johnson",
                email: "mark@example.com",
                avatar: null
            },
            submittedAt: new Date(2023, 5, 13).toISOString()
        }
    ];

    // Placeholder support groups data
    const supportGroups = [
        {
            id: "1",
            name: "Recovery Warriors",
            category: "Substance Abuse",
            memberCount: 45,
            creator: {
                id: "user1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                avatar: null
            },
            createdAt: new Date(2023, 5, 10).toISOString()
        },
        {
            id: "2",
            name: "Grief Support Circle",
            category: "Grief & Loss",
            memberCount: 32,
            creator: {
                id: "user2",
                firstName: "Jane",
                lastName: "Smith",
                email: "jane@example.com",
                avatar: null
            },
            createdAt: new Date(2023, 5, 8).toISOString()
        }
    ];

    // Placeholder reports data
    const reports = [
        {
            id: "1",
            type: "user",
            title: "Inappropriate behavior",
            reportedUser: {
                id: "user5",
                firstName: "Alex",
                lastName: "Brown",
                email: "alex@example.com",
                avatar: null
            },
            reportedBy: {
                id: "user6",
                firstName: "Sarah",
                lastName: "Wilson",
                email: "sarah@example.com",
                avatar: null
            },
            submittedAt: new Date(2023, 5, 15).toISOString(),
            status: "pending"
        },
        {
            id: "2",
            type: "content",
            title: "Misleading information",
            contentType: "resource",
            contentId: "res123",
            contentTitle: "Recovery Guide",
            reportedBy: {
                id: "user7",
                firstName: "Michael",
                lastName: "Davis",
                email: "michael@example.com",
                avatar: null
            },
            submittedAt: new Date(2023, 5, 14).toISOString(),
            status: "pending"
        }
    ];

    return (
        <Container className="py-10">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8">
                <div>
                    <Heading level="h1" className="mb-2">Admin Dashboard</Heading>
                    <Text className="text-muted-foreground">
                        Monitor platform activity and manage administrative tasks.
                    </Text>
                </div>
                <div className="mt-4 md:mt-0 flex gap-4">
                    <Button variant="outline">Export Reports</Button>
                    <Button>Manage Settings</Button>
                </div>
            </div>

            <Tabs
                defaultValue="overview"
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="pending-approvals">Pending Approvals</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                        <p className="text-xs text-muted-foreground">
                                            <span className="text-green-500">+{stats.newUsersThisMonth}</span> this month
                                        </p>
                                        <Progress value={(stats.activeUsers / stats.totalUsers) * 100} className="mt-2" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {stats.activeUsers} active users ({Math.round((stats.activeUsers / stats.totalUsers) * 100)}%)
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Support Groups</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.totalSupportGroups}</div>
                                        <p className="text-xs text-muted-foreground">
                                            <span className="text-amber-500">{stats.pendingSupportGroups}</span> pending approval
                                        </p>
                                        <Progress value={(stats.activeSupportGroups / stats.totalSupportGroups) * 100} className="mt-2" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {stats.activeSupportGroups} active groups ({Math.round((stats.activeSupportGroups / stats.totalSupportGroups) * 100)}%)
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Sponsors</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.totalSponsors}</div>
                                        <p className="text-xs text-muted-foreground">
                                            <span className="text-amber-500">{stats.pendingApplications}</span> pending applications
                                        </p>
                                        <Progress value={(stats.activeSponsors / stats.totalSponsors) * 100} className="mt-2" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {stats.activeSponsors} active sponsors ({Math.round((stats.activeSponsors / stats.totalSponsors) * 100)}%)
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Resources</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.totalResources}</div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    <span className="text-red-500">{stats.unresolvedReports}</span> unresolved reports
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm">Manage</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>User Growth</CardTitle>
                                        <CardDescription>New user registrations over time</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px]">
                                            <LineChart data={userGrowthData} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>User Distribution</CardTitle>
                                        <CardDescription>Breakdown of user types</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px]">
                                            <PieChart data={userTypeData} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Platform Activity</CardTitle>
                                    <CardDescription>Activity across different platform features</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <BarChart data={platformActivityData} />
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* Pending Approvals Tab */}
                <TabsContent value="pending-approvals">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Sponsor Applications</CardTitle>
                                <CardDescription>
                                    Applications awaiting review
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center py-10">
                                        <Spinner size="lg" />
                                    </div>
                                ) : pendingApplications.filter(app => app.type === "sponsor").length > 0 ? (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Applicant</TableHead>
                                                    <TableHead>Submitted</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingApplications
                                                    .filter(app => app.type === "sponsor")
                                                    .map((application) => (
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
                                                            <TableCell>{new Date(application.submittedAt).toLocaleDateString()}</TableCell>
                                                            <TableCell>
                                                                <Button variant="outline" size="sm">Review</Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground">No pending sponsor applications.</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">View All Applications</Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Support Groups</CardTitle>
                                <CardDescription>
                                    Support groups awaiting approval
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center py-10">
                                        <Spinner size="lg" />
                                    </div>
                                ) : pendingApplications.filter(app => app.type === "support-group").length > 0 ? (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Group Name</TableHead>
                                                    <TableHead>Creator</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingApplications
                                                    .filter(app => app.type === "support-group")
                                                    .map((group) => (
                                                        <TableRow key={group.id}>
                                                            <TableCell>
                                                                <div className="font-medium">{group.name}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar fallback={group.creator.firstName[0] + group.creator.lastName[0]} />
                                                                    <div className="text-sm">{group.creator.firstName} {group.creator.lastName}</div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button variant="outline" size="sm">Review</Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground">No pending support groups.</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">View All Support Groups</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports">
                    <Card>
                        <CardHeader>
                            <CardTitle>Unresolved Reports</CardTitle>
                            <CardDescription>
                                Reports that require administrative attention
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <Spinner size="lg" />
                                </div>
                            ) : reports.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Report Type</TableHead>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Reported By</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reports.map((report) => (
                                                <TableRow key={report.id}>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{report.title}</div>
                                                        {report.type === "user" && (
                                                            <div className="text-sm text-muted-foreground">
                                                                User: {report.reportedUser.firstName} {report.reportedUser.lastName}
                                                            </div>
                                                        )}
                                                        {report.type === "content" && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {report.contentType.charAt(0).toUpperCase() + report.contentType.slice(1)}: {report.contentTitle}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar fallback={report.reportedBy.firstName[0] + report.reportedBy.lastName[0]} />
                                                            <div className="text-sm">{report.reportedBy.firstName} {report.reportedBy.lastName}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{new Date(report.submittedAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            report.status === "pending" ? "outline" :
                                                                report.status === "resolved" ? "default" :
                                                                    "secondary"
                                                        }>
                                                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="outline" size="sm">Review</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">No unresolved reports.</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full">View All Reports</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                    <div className="grid grid-cols-1 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Growth</CardTitle>
                                <CardDescription>New user registrations over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px]">
                                    <LineChart data={userGrowthData} />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>User Distribution</CardTitle>
                                    <CardDescription>Breakdown of user types</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <PieChart data={userTypeData} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Platform Activity</CardTitle>
                                    <CardDescription>Activity across different platform features</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <BarChart data={platformActivityData} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Export Analytics</CardTitle>
                                <CardDescription>Download platform analytics for reporting</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Button variant="outline">User Analytics</Button>
                                    <Button variant="outline">Content Analytics</Button>
                                    <Button variant="outline">Engagement Analytics</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </Container>
    );
};

export default AdminDashboard; 