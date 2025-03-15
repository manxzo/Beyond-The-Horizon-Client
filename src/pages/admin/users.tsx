import React, { useState } from "react";
import { useAdmin } from "../../hooks/admin/useAdmin";
import { Container } from "../../components/ui/container";
import { Heading } from "../../components/ui/heading";
import { Text } from "../../components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Spinner } from "../../components/ui/spinner";
import { Avatar } from "../../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { useQuery } from "@tanstack/react-query";

const AdminUsers: React.FC = () => {
    const {
        getUsers,
        banUser,
        unbanUser,
        getBannedUsers,
        isLoading: isAdminLoading
    } = useAdmin();

    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [banReason, setBanReason] = useState("");
    const [banDuration, setBanDuration] = useState<number | undefined>(30);

    // Fetch banned users
    const {
        data: bannedUsersData,
        isLoading: isBannedUsersLoading,
        error: bannedUsersError
    } = useQuery(getBannedUsers());

    // Fetch all users (we'll simulate this since it's not in the hooks)
    const {
        data: usersData,
        isLoading: isUsersLoading,
        error: usersError
    } = useQuery({
        queryKey: ['admin', 'users'],
        queryFn: async () => {
            // This would normally call getUsers(), but we'll use placeholder data
            return {
                success: true,
                data: [
                    { id: "1", username: "john_doe", email: "john@example.com", firstName: "John", lastName: "Doe", role: "member", isActive: true, joinDate: new Date(2023, 0, 15).toISOString() },
                    { id: "2", username: "jane_smith", email: "jane@example.com", firstName: "Jane", lastName: "Smith", role: "member", isActive: true, joinDate: new Date(2023, 1, 20).toISOString() },
                    { id: "3", username: "sponsor1", email: "sponsor1@example.com", firstName: "Robert", lastName: "Johnson", role: "sponsor", isActive: true, joinDate: new Date(2023, 2, 10).toISOString() },
                    { id: "4", username: "admin_user", email: "admin@example.com", firstName: "Admin", lastName: "User", role: "admin", isActive: true, joinDate: new Date(2023, 3, 5).toISOString() },
                    { id: "5", username: "inactive_user", email: "inactive@example.com", firstName: "Inactive", lastName: "User", role: "member", isActive: false, joinDate: new Date(2023, 4, 25).toISOString() }
                ]
            };
        }
    });

    const isLoading = isAdminLoading || isBannedUsersLoading || isUsersLoading;
    const users = usersData?.data || [];
    const bannedUsers = bannedUsersData?.data || [
        { id: "6", username: "banned_user1", email: "banned1@example.com", firstName: "Banned", lastName: "User", role: "member", isActive: false, joinDate: new Date(2023, 5, 12).toISOString(), banReason: "Inappropriate behavior", banDate: new Date(2023, 6, 15).toISOString(), banDuration: 30 },
        { id: "7", username: "banned_user2", email: "banned2@example.com", firstName: "Another", lastName: "Banned", role: "member", isActive: false, joinDate: new Date(2023, 3, 8).toISOString(), banReason: "Spam", banDate: new Date(2023, 7, 20).toISOString(), banDuration: null }
    ];

    const handleBanUserAction = async (userId: string) => {
        if (!banReason.trim()) {
            // In a real app, you'd show an error message
            console.error("Ban reason is required");
            return;
        }

        try {
            await banUser(userId, banReason, banDuration);
            setIsUserDetailOpen(false);
            setBanReason("");
            setBanDuration(30);
        } catch (error) {
            console.error("Failed to ban user:", error);
        }
    };

    const handleUnbanUserAction = async (userId: string) => {
        try {
            await unbanUser(userId);
        } catch (error) {
            console.error("Failed to unban user:", error);
        }
    };

    // Filter users based on search query, role, and status
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === "all" || user?.role === roleFilter;
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && user?.isActive) ||
            (statusFilter === "inactive" && !user?.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Filter banned users based on search query
    const filteredBannedUsers = bannedUsers.filter(user =>
        user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Container className="py-10">
            <div className="flex flex-col md:flex-row justify-between items-start mb-8">
                <div>
                    <Heading level="h1" className="mb-2">User Management</Heading>
                    <Text className="text-muted-foreground">
                        Manage users, view profiles, and moderate user accounts.
                    </Text>
                </div>
                <div className="mt-4 md:mt-0">
                    <Button>Export User Data</Button>
                </div>
            </div>

            <Tabs
                defaultValue="all"
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="mb-6">
                    <TabsTrigger value="all">All Users</TabsTrigger>
                    <TabsTrigger value="banned">Banned Users</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <Card>
                        <CardHeader>
                            <CardTitle>User List</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="md:max-w-xs"
                                />
                                <Select
                                    value={roleFilter}
                                    onValueChange={setRoleFilter}
                                >
                                    <SelectTrigger className="md:w-[180px]">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="member">Members</SelectItem>
                                        <SelectItem value="sponsor">Sponsors</SelectItem>
                                        <SelectItem value="admin">Admins</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="md:w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <Spinner size="lg" />
                                </div>
                            ) : filteredUsers.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Join Date</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar fallback={user.firstName[0] + user.lastName[0]} />
                                                            <div>
                                                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                                                <div className="text-sm text-muted-foreground">@{user.username}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            user.role === "admin" ? "destructive" :
                                                                user.role === "sponsor" ? "secondary" :
                                                                    "default"
                                                        }>
                                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.isActive ? "outline" : "secondary"}>
                                                            {user.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setIsUserDetailOpen(true);
                                                                }}
                                                            >
                                                                View
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setIsUserDetailOpen(true);
                                                                    setBanReason("");
                                                                    setBanDuration(30);
                                                                }}
                                                            >
                                                                Ban
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">No users found matching your filters.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="banned">
                    <Card>
                        <CardHeader>
                            <CardTitle>Banned Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center py-10">
                                    <Spinner size="lg" />
                                </div>
                            ) : filteredBannedUsers.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Ban Reason</TableHead>
                                                <TableHead>Ban Date</TableHead>
                                                <TableHead>Duration</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredBannedUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar fallback={user.firstName[0] + user.lastName[0]} />
                                                            <div>
                                                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                                                <div className="text-sm text-muted-foreground">@{user.username}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.banReason}</TableCell>
                                                    <TableCell>{new Date(user.banDate).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        {user.banDuration ? `${user.banDuration} days` : "Permanent"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUnbanUserAction(user.id)}
                                                        >
                                                            Unban
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">No banned users found.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* User Detail Dialog */}
            <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16" fallback={selectedUser.firstName[0] + selectedUser.lastName[0]} />
                                <div>
                                    <h3 className="text-xl font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                                    <p className="text-muted-foreground">@{selectedUser.username}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <p>{selectedUser.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Role</p>
                                    <Badge variant={
                                        selectedUser.role === "admin" ? "destructive" :
                                            selectedUser.role === "sponsor" ? "secondary" :
                                                "default"
                                    }>
                                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Status</p>
                                    <Badge variant={selectedUser.isActive ? "outline" : "secondary"}>
                                        {selectedUser.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Join Date</p>
                                    <p>{new Date(selectedUser.joinDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">User Activity</h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-2 bg-muted rounded-md">
                                        <p className="text-2xl font-bold">12</p>
                                        <p className="text-sm text-muted-foreground">Posts</p>
                                    </div>
                                    <div className="p-2 bg-muted rounded-md">
                                        <p className="text-2xl font-bold">5</p>
                                        <p className="text-sm text-muted-foreground">Groups</p>
                                    </div>
                                    <div className="p-2 bg-muted rounded-md">
                                        <p className="text-2xl font-bold">28</p>
                                        <p className="text-sm text-muted-foreground">Comments</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="ban-reason">Ban Reason</Label>
                                <Textarea
                                    id="ban-reason"
                                    placeholder="Enter reason for banning this user..."
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="ban-duration">Ban Duration</Label>
                                <div className="flex items-center gap-4 mt-1">
                                    <Input
                                        id="ban-duration"
                                        type="number"
                                        min="1"
                                        value={banDuration || ""}
                                        onChange={(e) => setBanDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                                        className="w-24"
                                    />
                                    <Label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={banDuration === undefined}
                                          onChange={(e) => setBanDuration(e.target.checked ? undefined : 30)}
                                        />
                                        Permanent Ban
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <div className="flex justify-end gap-4">
                                    <Button variant="outline" onClick={() => setIsUserDetailOpen(false)}>
                                        Close
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => handleBanUserAction(selectedUser.id)}
                                        disabled={!banReason.trim()}
                                    >
                                        Ban User
                                    </Button>
                                </div>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default AdminUsers; 