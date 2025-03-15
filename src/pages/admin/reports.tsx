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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { useQuery } from "@tanstack/react-query";

const AdminReports: React.FC = () => {
    const {
        getUnresolvedReports,
        handleReport,
        isHandlingReport
    } = useAdmin();

    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isReportDetailOpen, setIsReportDetailOpen] = useState(false);
    const [resolutionNote, setResolutionNote] = useState("");
    const [activeTab, setActiveTab] = useState("pending");

    // Fetch unresolved reports
    const {
        data: unresolvedReportsData,
        isLoading: isUnresolvedReportsLoading,
        error: unresolvedReportsError
    } = useQuery(getUnresolvedReports());

    const isLoading = isUnresolvedReportsLoading || isHandlingReport;

    // Placeholder reports data - in a real app, this would come from the API
    const allReports = [
        {
            id: "1",
            title: "Inappropriate content in post",
            description: "This post contains offensive language and inappropriate images.",
            type: "content",
            status: "pending",
            reportedBy: { id: "user1", username: "john_doe" },
            reportedAt: new Date(2023, 5, 15).toISOString(),
            contentId: "post123",
            contentType: "post"
        },
        {
            id: "2",
            title: "Harassment in messages",
            description: "This user has been sending threatening messages.",
            type: "user",
            status: "pending",
            reportedBy: { id: "user2", username: "jane_smith" },
            reportedAt: new Date(2023, 5, 18).toISOString(),
            contentId: "user456",
            contentType: "user"
        },
        {
            id: "3",
            title: "Spam in support group",
            description: "This user is posting spam links in the support group.",
            type: "content",
            status: "resolved",
            reportedBy: { id: "user3", username: "alex_johnson" },
            reportedAt: new Date(2023, 5, 10).toISOString(),
            resolvedAt: new Date(2023, 5, 12).toISOString(),
            resolutionNote: "User has been warned and content removed.",
            contentId: "group789",
            contentType: "group"
        },
        {
            id: "4",
            title: "Fake sponsor profile",
            description: "This sponsor profile appears to be fake and is soliciting personal information.",
            type: "user",
            status: "dismissed",
            reportedBy: { id: "user4", username: "sarah_williams" },
            reportedAt: new Date(2023, 5, 5).toISOString(),
            resolvedAt: new Date(2023, 5, 7).toISOString(),
            resolutionNote: "Investigated and found to be legitimate.",
            contentId: "sponsor101",
            contentType: "user"
        },
        {
            id: "5",
            title: "Technical issue with chat",
            description: "The chat feature is not working properly in the support group.",
            type: "technical",
            status: "pending",
            reportedBy: { id: "user5", username: "mike_brown" },
            reportedAt: new Date(2023, 5, 20).toISOString(),
            contentId: "feature202",
            contentType: "feature"
        }
    ];

    // In a real app, we would use the data from the API
    // const reports = unresolvedReportsData?.data || [];
    const reports = allReports;

    const handleResolveReport = async (reportId: string) => {
        if (!resolutionNote.trim()) {
            // In a real app, you'd show an error message
            console.error("Resolution note is required");
            return;
        }

        try {
            await handleReport(reportId, resolutionNote, true);
            setIsReportDetailOpen(false);
            setResolutionNote("");
        } catch (error) {
            console.error("Failed to resolve report:", error);
        }
    };

    const handleDismissReport = async (reportId: string) => {
        if (!resolutionNote.trim()) {
            // In a real app, you'd show an error message
            console.error("Resolution note is required");
            return;
        }

        try {
            await handleReport(reportId, resolutionNote, false);
            setIsReportDetailOpen(false);
            setResolutionNote("");
        } catch (error) {
            console.error("Failed to dismiss report:", error);
        }
    };

    // Filter reports based on search query, type, and status
    const filteredReports = reports.filter(report => {
        const matchesSearch =
            report?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report?.reportedBy?.username?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = typeFilter === "all" || report?.type === typeFilter;

        return matchesSearch && matchesType;
    });

    // Get reports for the active tab
    const getTabReports = () => {
        switch (activeTab) {
            case "pending":
                return filteredReports.filter(report => report.status === "pending");
            case "resolved":
                return filteredReports.filter(report => report.status === "resolved");
            case "dismissed":
                return filteredReports.filter(report => report.status === "dismissed");
            default:
                return filteredReports;
        }
    };

    return (
        <Container className="py-10">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8">
                <div>
                    <Heading level="h1" className="mb-2">Report Management</Heading>
                    <Text className="text-muted-foreground">
                        Review and manage user reports and platform issues.
                    </Text>
                </div>
                <div className="mt-4 md:mt-0">
                    <Button>Export Reports</Button>
                </div>
            </div>

            <Tabs
                defaultValue="pending"
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="mb-6">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                    <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Reports</CardTitle>
                            <CardDescription>
                                {activeTab === "pending"
                                    ? "Reports awaiting review and action"
                                    : activeTab === "resolved"
                                        ? "Reports that have been addressed and resolved"
                                        : "Reports that have been reviewed and dismissed"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <Input
                                    placeholder="Search reports..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="md:max-w-xs"
                                />
                                <Select
                                    value={typeFilter}
                                    onValueChange={setTypeFilter}
                                >
                                    <SelectTrigger className="md:w-[180px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="content">Content</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <Spinner size="lg" />
                                </div>
                            ) : getTabReports().length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Reported By</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {getTabReports().map((report) => (
                                                <TableRow key={report.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{report.title}</div>
                                                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                            {report.description}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            report.type === "content" ? "default" :
                                                                report.type === "user" ? "destructive" :
                                                                    "secondary"
                                                        }>
                                                            {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>@{report.reportedBy.username}</TableCell>
                                                    <TableCell>{new Date(report.reportedAt).toLocaleDateString()}</TableCell>
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
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedReport(report);
                                                                    setIsReportDetailOpen(true);
                                                                    setResolutionNote("");
                                                                }}
                                                            >
                                                                View
                                                            </Button>
                                                            {report.status === "pending" && (
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedReport(report);
                                                                        setIsReportDetailOpen(true);
                                                                        setResolutionNote("");
                                                                    }}
                                                                >
                                                                    Resolve
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
                                    <p className="text-muted-foreground">No {activeTab} reports found.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Report Detail Dialog */}
            <Dialog open={isReportDetailOpen} onOpenChange={setIsReportDetailOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Report Details</DialogTitle>
                    </DialogHeader>
                    {selectedReport && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold">{selectedReport.title}</h3>
                                <Badge className="mt-2" variant={
                                    selectedReport.type === "content" ? "default" :
                                        selectedReport.type === "user" ? "destructive" :
                                            "secondary"
                                }>
                                    {selectedReport.type.charAt(0).toUpperCase() + selectedReport.type.slice(1)}
                                </Badge>
                                <Badge className="ml-2" variant={
                                    selectedReport.status === "pending" ? "outline" :
                                        selectedReport.status === "resolved" ? "default" :
                                            "secondary"
                                }>
                                    {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                                </Badge>
                            </div>

                            <div>
                                <p className="text-sm font-medium mb-1">Description</p>
                                <p className="p-3 bg-muted rounded-md">{selectedReport.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">Reported By</p>
                                    <p>@{selectedReport.reportedBy.username}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Date Reported</p>
                                    <p>{new Date(selectedReport.reportedAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Content Type</p>
                                    <p>{selectedReport.contentType.charAt(0).toUpperCase() + selectedReport.contentType.slice(1)}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Content ID</p>
                                    <p className="font-mono text-sm">{selectedReport.contentId}</p>
                                </div>
                            </div>

                            {selectedReport.status !== "pending" && (
                                <div>
                                    <p className="text-sm font-medium mb-1">Resolution Note</p>
                                    <p className="p-3 bg-muted rounded-md">{selectedReport.resolutionNote}</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Resolved on {new Date(selectedReport.resolvedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            )}

                            {selectedReport.status === "pending" && (
                                <div>
                                    <Label htmlFor="resolution-note">Resolution Note</Label>
                                    <Textarea
                                        id="resolution-note"
                                        placeholder="Enter details about how this report was handled..."
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            <DialogFooter>
                                <div className="flex justify-end gap-4 w-full">
                                    <Button variant="outline" onClick={() => setIsReportDetailOpen(false)}>
                                        Close
                                    </Button>
                                    {selectedReport.status === "pending" && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                onClick={() => handleDismissReport(selectedReport.id)}
                                                disabled={!resolutionNote.trim()}
                                            >
                                                Dismiss
                                            </Button>
                                            <Button
                                                variant="default"
                                                onClick={() => handleResolveReport(selectedReport.id)}
                                                disabled={!resolutionNote.trim()}
                                            >
                                                Resolve
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

export default AdminReports; 