import { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Spinner,
    Button,
    Textarea,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Badge,
    Input,
    Select,
    SelectItem,
    Chip,
    Pagination,
    Tabs,
    Tab
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/admin/useAdmin";
import { Search, Shield, Ban, Eye, UserX, Clock } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import DefaultLayout from "@/layouts/default";

export default function AdminUsers() {
    const { getAllUsers, getBannedUsers, banUser, unbanUser } = useAdmin();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [banReason, setBanReason] = useState("");
    const [banDuration, setBanDuration] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const ITEMS_PER_PAGE = 12;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Query for all users
    const {
        data: usersData,
        isLoading: isLoadingAllUsers,
        error: allUsersError
    } = useQuery(getAllUsers({
        username: debouncedSearch || undefined,
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE
    }));

    // Query for banned users
    const {
        data: bannedUsersData,
        isLoading: isLoadingBannedUsers,
        error: bannedUsersError
    } = useQuery(getBannedUsers());

    const handleViewUser = (user: any) => {
        setSelectedUser(user);
        setBanReason("");
        setBanDuration(null);
        onOpen();
    };

    const handleBanUser = async () => {
        if (!selectedUser || !banReason || !banDuration) return;

        const duration = banDuration === "permanent" ? undefined : parseInt(banDuration);

        await banUser({
            userId: selectedUser.user_id,
            reason: banReason,
            banDurationDays: duration
        });

        setBanReason("");
        setBanDuration(null);
        onClose();
    };

    const handleUnbanUser = async (userId: string) => {
        await unbanUser(userId);
    };

    const getUserStatusBadge = (user: any) => {
        if (user.is_banned) {
            return <Badge color="danger" variant="flat">Banned</Badge>;
        }
        if (user.role === "admin") {
            return <Badge color="success" variant="flat">Admin</Badge>;
        }
        if (user.role === "sponsor") {
            return <Badge color="warning" variant="flat">Sponsor</Badge>;
        }
        return <Badge color="primary" variant="flat">Member</Badge>;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString();
    };

    const isLoading = activeTab === "all" ? isLoadingAllUsers : isLoadingBannedUsers;
    const error = activeTab === "all" ? allUsersError : bannedUsersError;

    if (isLoading) {
        return (
            <DefaultLayout>
                <AdminNav />
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" color="primary" />
                </div>
            </DefaultLayout>
        );
    }

    if (error) {
        return (
            <DefaultLayout>
                <AdminNav />
                <div className="bg-danger-50 text-danger p-4 rounded-lg">
                    Error loading users. Please try again later.
                </div>
            </DefaultLayout>
        );
    }

    const users = activeTab === "all"
        ? (usersData?.users || [])
        : (bannedUsersData || []);

    const totalUsers = activeTab === "all"
        ? (usersData?.total || 0)
        : users.length;

    const totalPages = activeTab === "all"
        ? Math.ceil(totalUsers / ITEMS_PER_PAGE)
        : Math.ceil(users.length / ITEMS_PER_PAGE);

    // For banned users view, apply pagination manually since the API returns all banned users
    const paginatedBannedUsers = activeTab === "banned"
        ? users.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
        : users;

    const displayedUsers = activeTab === "all" ? users : paginatedBannedUsers;

    return (
        <DefaultLayout>
            <AdminNav />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-default-500">Manage and moderate user accounts</p>
                </div>

                <Tabs
                    aria-label="User Management Tabs"
                    selectedKey={activeTab}
                    onSelectionChange={(key) => {
                        setActiveTab(key as string);
                        setPage(1); // Reset to first page when switching tabs
                    }}
                    className="mb-4"
                >
                    <Tab key="all" title="All Users" />
                    <Tab
                        key="banned"
                        title={
                            <div className="flex items-center gap-1">
                                <Ban size={16} />
                                <span>Banned Users</span>
                                {bannedUsersData && (
                                    <Badge size="sm" color="danger" variant="flat">
                                        {bannedUsersData.length}
                                    </Badge>
                                )}
                            </div>
                        }
                    />
                </Tabs>

                <div className="flex justify-between items-center">
                    <div className="relative w-full max-w-md">
                        {activeTab === "all" && (
                            <Input
                                placeholder="Search users by username..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1); // Reset to first page on new search
                                }}
                                startContent={<Search size={18} />}
                                isClearable
                                onClear={() => {
                                    setSearchQuery("");
                                    setPage(1); // Reset to first page when clearing
                                }}
                            />
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Chip color="primary" variant="flat">
                            Total: {totalUsers || 0}
                        </Chip>
                    </div>
                </div>

                <Divider />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedUsers.map((user: any) => (
                        <Card key={user.user_id} className="shadow-sm">
                            <CardHeader className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium">{user.username}</h3>
                                    {getUserStatusBadge(user)}
                                </div>
                                <Button
                                    isIconOnly
                                    variant="light"
                                    onPress={() => handleViewUser(user)}
                                    aria-label="View user details"
                                >
                                    <Eye size={20} />
                                </Button>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-semibold">Email:</span>
                                        <p className="text-default-500">{user.email}</p>
                                    </div>
                                    {activeTab === "banned" && (
                                        <div>
                                            <span className="font-semibold">Ban Expires:</span>
                                            <p className="text-default-500">
                                                {user.is_permanent_ban
                                                    ? "Permanent"
                                                    : formatDate(user.banned_until)}
                                            </p>
                                        </div>
                                    )}
                                    {activeTab === "all" && (
                                        <div>
                                            <span className="font-semibold">Role:</span>
                                            <p className="text-default-500 capitalize">{user.role}</p>
                                        </div>
                                    )}
                                    {activeTab === "all" && (
                                        <div>
                                            <span className="font-semibold">Joined:</span>
                                            <p className="text-default-500">{formatDate(user.created_at)}</p>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                            <Divider />
                            <CardFooter>
                                <div className="flex justify-between w-full">
                                    {user.role === "admin" ? (
                                        <Button
                                            color="primary"
                                            variant="flat"
                                            startContent={<Shield size={16} />}
                                            isDisabled
                                        >
                                            Admin User
                                        </Button>
                                    ) : user.is_banned || activeTab === "banned" ? (
                                        <Button
                                            color="success"
                                            variant="flat"
                                            startContent={<Shield size={16} />}
                                            onPress={() => handleUnbanUser(user.user_id)}
                                        >
                                            Unban User
                                        </Button>
                                    ) : (
                                        <Button
                                            color="danger"
                                            variant="flat"
                                            startContent={<Ban size={16} />}
                                            onPress={() => handleViewUser(user)}
                                        >
                                            Ban User
                                        </Button>
                                    )}

                                    {activeTab === "banned" && !user.is_permanent_ban && (
                                        <Badge
                                            color="warning"
                                            variant="flat"
                                            className="ml-2 flex items-center gap-1"
                                        >
                                            <Clock size={14} />
                                            Expires {formatDate(user.banned_until)}
                                        </Badge>
                                    )}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <Pagination
                            total={totalPages}
                            page={page}
                            onChange={setPage}
                            size="lg"
                        />
                    </div>
                )}
            </div>

            {/* User Details Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="2xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <h3 className="text-xl font-bold">User Details: {selectedUser?.username}</h3>
                            </ModalHeader>
                            <ModalBody>
                                {selectedUser && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-semibold">Username</h4>
                                                <p>{selectedUser.username}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Email</h4>
                                                <p>{selectedUser.email}</p>
                                            </div>
                                            {activeTab === "all" && (
                                                <div>
                                                    <h4 className="font-semibold">Role</h4>
                                                    <p className="capitalize">{selectedUser.role}</p>
                                                </div>
                                            )}
                                            {activeTab === "all" && (
                                                <div>
                                                    <h4 className="font-semibold">Joined</h4>
                                                    <p>{formatDate(selectedUser.created_at)}</p>
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-semibold">Status</h4>
                                                <div className="mt-1">
                                                    {getUserStatusBadge(selectedUser)}
                                                </div>
                                            </div>
                                            {(selectedUser.is_banned || activeTab === "banned") && (
                                                <div>
                                                    <h4 className="font-semibold">Ban Expires</h4>
                                                    <p>
                                                        {activeTab === "banned" && selectedUser.is_permanent_ban
                                                            ? "Permanent"
                                                            : selectedUser.banned_until
                                                                ? formatDate(selectedUser.banned_until)
                                                                : "Permanent"}
                                                    </p>
                                                </div>
                                            )}
                                            {activeTab === "all" && (
                                                <>
                                                    <div>
                                                        <h4 className="font-semibold">Email Verified</h4>
                                                        <p>{selectedUser.email_verified ? "Yes" : "No"}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">Privacy Mode</h4>
                                                        <p>{selectedUser.privacy ? "Enabled" : "Disabled"}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {selectedUser.role !== "admin" && !selectedUser.is_banned && activeTab === "all" && (
                                            <>
                                                <Divider />
                                                <div>
                                                    <h4 className="font-semibold mb-2">Ban User</h4>
                                                    <div className="space-y-4">
                                                        <Select
                                                            label="Ban Duration"
                                                            placeholder="Select ban duration"
                                                            selectedKeys={banDuration ? [banDuration] : []}
                                                            onSelectionChange={(keys) => {
                                                                const selected = Array.from(keys)[0] as string;
                                                                setBanDuration(selected);
                                                            }}
                                                        >
                                                            <SelectItem key="1">1 Day</SelectItem>
                                                            <SelectItem key="3">3 Days</SelectItem>
                                                            <SelectItem key="7">7 Days</SelectItem>
                                                            <SelectItem key="14">14 Days</SelectItem>
                                                            <SelectItem key="30">30 Days</SelectItem>
                                                            <SelectItem key="permanent">Permanent</SelectItem>
                                                        </Select>
                                                        <Textarea
                                                            label="Ban Reason"
                                                            placeholder="Explain why this user is being banned"
                                                            value={banReason}
                                                            onChange={(e) => setBanReason(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={onClose}>
                                    Cancel
                                </Button>
                                {selectedUser && selectedUser.role !== "admin" && !selectedUser.is_banned && activeTab === "all" && (
                                    <Button
                                        color="danger"
                                        startContent={<UserX size={16} />}
                                        onPress={handleBanUser}
                                        isDisabled={!banReason || !banDuration}
                                    >
                                        Ban User
                                    </Button>
                                )}
                                {(selectedUser?.is_banned || activeTab === "banned") && selectedUser && (
                                    <Button
                                        color="success"
                                        startContent={<Shield size={16} />}
                                        onPress={() => {
                                            handleUnbanUser(selectedUser.user_id);
                                            onClose();
                                        }}
                                    >
                                        Unban User
                                    </Button>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </DefaultLayout>
    );
} 