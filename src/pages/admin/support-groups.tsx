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

const SupportGroups: React.FC = () => {
  const {
    getPendingSupportGroups,
    reviewSupportGroup,
    isReviewingSupportGroup
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isGroupDetailOpen, setIsGroupDetailOpen] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch pending support groups
  const {
    data: pendingSupportGroupsData,
    isLoading: isPendingSupportGroupsLoading,
    error: pendingSupportGroupsError
  } = useQuery(getPendingSupportGroups());

  const isLoading = isPendingSupportGroupsLoading || isReviewingSupportGroup;

  // Placeholder support groups data - in a real app, this would come from the API
  const allGroups = [
    {
      id: "1",
      name: "Recovery Warriors",
      description: "A support group for individuals in early recovery from substance abuse.",
      category: "Substance Abuse",
      meetingFrequency: "Weekly",
      meetingDay: "Monday",
      meetingTime: "19:00",
      meetingDuration: 90,
      isVirtual: true,
      meetingLink: "https://zoom.us/j/123456789",
      maxParticipants: 15,
      creator: {
        id: "user1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        avatar: null
      },
      status: "pending",
      createdAt: new Date(2023, 5, 15).toISOString()
    },
    {
      id: "2",
      name: "Grief Support Circle",
      description: "A compassionate space for those dealing with loss and grief.",
      category: "Grief & Loss",
      meetingFrequency: "Bi-weekly",
      meetingDay: "Wednesday",
      meetingTime: "18:30",
      meetingDuration: 120,
      isVirtual: false,
      location: "Community Center, 123 Main St",
      maxParticipants: 12,
      creator: {
        id: "user2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        avatar: null
      },
      status: "approved",
      createdAt: new Date(2023, 4, 20).toISOString(),
      reviewedAt: new Date(2023, 4, 25).toISOString(),
      feedbackNote: "Well-structured group with clear objectives. Approved."
    },
    {
      id: "3",
      name: "Anxiety Management",
      description: "Learn techniques to manage anxiety and stress in daily life.",
      category: "Mental Health",
      meetingFrequency: "Weekly",
      meetingDay: "Thursday",
      meetingTime: "17:00",
      meetingDuration: 60,
      isVirtual: true,
      meetingLink: "https://meet.google.com/abc-defg-hij",
      maxParticipants: 20,
      creator: {
        id: "user3",
        firstName: "Mark",
        lastName: "Johnson",
        email: "mark@example.com",
        avatar: null
      },
      status: "rejected",
      createdAt: new Date(2023, 5, 5).toISOString(),
      reviewedAt: new Date(2023, 5, 10).toISOString(),
      feedbackNote: "The group's focus overlaps significantly with existing groups. Please consider joining one of those or refining your group's focus."
    },
    {
      id: "4",
      name: "Family Support Network",
      description: "Support for family members of individuals struggling with addiction.",
      category: "Family Support",
      meetingFrequency: "Weekly",
      meetingDay: "Saturday",
      meetingTime: "10:00",
      meetingDuration: 90,
      isVirtual: true,
      meetingLink: "https://zoom.us/j/987654321",
      maxParticipants: 15,
      creator: {
        id: "user4",
        firstName: "Emily",
        lastName: "Davis",
        email: "emily@example.com",
        avatar: null
      },
      status: "pending",
      createdAt: new Date(2023, 5, 18).toISOString()
    },
    {
      id: "5",
      name: "Veterans Support Group",
      description: "A safe space for veterans to share experiences and support each other.",
      category: "Veterans",
      meetingFrequency: "Weekly",
      meetingDay: "Tuesday",
      meetingTime: "19:00",
      meetingDuration: 120,
      isVirtual: false,
      location: "Veterans Center, 456 Oak St",
      maxParticipants: 15,
      creator: {
        id: "user5",
        firstName: "Michael",
        lastName: "Brown",
        email: "michael@example.com",
        avatar: null
      },
      status: "pending",
      createdAt: new Date(2023, 5, 10).toISOString()
    }
  ];

  // In a real app, we would use the data from the API
  // const groups = pendingSupportGroupsData?.data || [];
  const groups = allGroups;

  const handleApproveGroup = async (groupId: string) => {
    try {
      await reviewSupportGroup(groupId, "approved", feedbackNote);
      setIsGroupDetailOpen(false);
      setFeedbackNote("");
    } catch (error) {
      console.error("Failed to approve group:", error);
    }
  };

  const handleRejectGroup = async (groupId: string) => {
    try {
      await reviewSupportGroup(groupId, "rejected", feedbackNote);
      setIsGroupDetailOpen(false);
      setFeedbackNote("");
    } catch (error) {
      console.error("Failed to reject group:", error);
    }
  };

  // Filter groups based on search query
  const filteredGroups = groups.filter(group => {
    const matchesSearch =
      group?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group?.creator?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group?.creator?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Get groups for the active tab
  const getTabGroups = () => {
    switch (activeTab) {
      case "pending":
        return filteredGroups.filter(group => group.status === "pending");
      case "approved":
        return filteredGroups.filter(group => group.status === "approved");
      case "rejected":
        return filteredGroups.filter(group => group.status === "rejected");
      default:
        return filteredGroups;
    }
  };

  return (
    <Container className="py-10">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <Heading level="h1" className="mb-2">Support Groups</Heading>
          <Text className="text-muted-foreground">
            Review and manage support group applications.
          </Text>
        </div>
        <div className="mt-4 md:mt-0">
          <Button>Export Groups</Button>
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
              <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Support Groups</CardTitle>
              <CardDescription>
                {activeTab === "pending"
                  ? "Support groups awaiting review"
                  : activeTab === "approved"
                    ? "Support groups that have been approved"
                    : "Support groups that have been rejected"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Input
                  placeholder="Search support groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner size="lg" />
                </div>
              ) : getTabGroups().length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Creator</TableHead>
                        <TableHead>Meeting</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getTabGroups().map((group) => (
                        <TableRow key={group.id}>
                          <TableCell>
                            <div className="font-medium">{group.name}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {group.description}
                            </div>
                          </TableCell>
                          <TableCell>{group.category}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar fallback={group.creator.firstName[0] + group.creator.lastName[0]} />
                              <div>
                                <div className="font-medium">{group.creator.firstName} {group.creator.lastName}</div>
                                <div className="text-sm text-muted-foreground">{group.creator.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{group.meetingFrequency}, {group.meetingDay}s</div>
                              <div>{group.meetingTime}, {group.meetingDuration} mins</div>
                              <div>{group.isVirtual ? "Virtual" : "In-person"}</div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(group.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              group.status === "pending" ? "outline" :
                                group.status === "approved" ? "default" :
                                  "destructive"
                            }>
                              {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setIsGroupDetailOpen(true);
                                  setFeedbackNote("");
                                }}
                              >
                                View
                              </Button>
                              {group.status === "pending" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGroup(group);
                                    setIsGroupDetailOpen(true);
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
                  <p className="text-muted-foreground">No {activeTab} support groups found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Group Detail Dialog */}
      <Dialog open={isGroupDetailOpen} onOpenChange={setIsGroupDetailOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Support Group Details</DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedGroup.name}</h3>
                  <p className="text-muted-foreground">{selectedGroup.category}</p>
                </div>
                <Badge className="ml-auto" variant={
                  selectedGroup.status === "pending" ? "outline" :
                    selectedGroup.status === "approved" ? "default" :
                      "destructive"
                }>
                  {selectedGroup.status.charAt(0).toUpperCase() + selectedGroup.status.slice(1)}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="p-3 bg-muted rounded-md">{selectedGroup.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Meeting Details</h4>
                  <div className="p-3 bg-muted rounded-md">
                    <p><span className="font-medium">Frequency:</span> {selectedGroup.meetingFrequency}</p>
                    <p><span className="font-medium">Day:</span> {selectedGroup.meetingDay}</p>
                    <p><span className="font-medium">Time:</span> {selectedGroup.meetingTime}</p>
                    <p><span className="font-medium">Duration:</span> {selectedGroup.meetingDuration} minutes</p>
                    <p><span className="font-medium">Format:</span> {selectedGroup.isVirtual ? "Virtual" : "In-person"}</p>
                    {selectedGroup.isVirtual ? (
                      <p><span className="font-medium">Link:</span> {selectedGroup.meetingLink}</p>
                    ) : (
                      <p><span className="font-medium">Location:</span> {selectedGroup.location}</p>
                    )}
                    <p><span className="font-medium">Max Participants:</span> {selectedGroup.maxParticipants}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Creator</h4>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar fallback={selectedGroup.creator.firstName[0] + selectedGroup.creator.lastName[0]} />
                      <div>
                        <p className="font-medium">{selectedGroup.creator.firstName} {selectedGroup.creator.lastName}</p>
                        <p className="text-sm text-muted-foreground">{selectedGroup.creator.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Created On</p>
                  <p>{new Date(selectedGroup.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedGroup.reviewedAt && (
                  <div>
                    <p className="text-sm font-medium">Reviewed On</p>
                    <p>{new Date(selectedGroup.reviewedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {selectedGroup.status !== "pending" && selectedGroup.feedbackNote && (
                <div>
                  <p className="text-sm font-medium mb-1">Feedback</p>
                  <p className="p-3 bg-muted rounded-md">{selectedGroup.feedbackNote}</p>
                </div>
              )}

              {selectedGroup.status === "pending" && (
                <>
                  <Separator />
                  <div>
                    <Label htmlFor="feedback-note">Feedback Note</Label>
                    <Textarea
                      id="feedback-note"
                      placeholder="Enter feedback for the group creator..."
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              <DialogFooter>
                <div className="flex justify-end gap-4 w-full">
                  <Button variant="outline" onClick={() => setIsGroupDetailOpen(false)}>
                    Close
                  </Button>
                  {selectedGroup.status === "pending" && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => handleRejectGroup(selectedGroup.id)}
                        disabled={!feedbackNote.trim()}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => handleApproveGroup(selectedGroup.id)}
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

export default SupportGroups; 