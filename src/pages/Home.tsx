import { useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Image,
    Progress,
    Spinner,
} from "@heroui/react";
import { Newspaper, Users, BookOpen, Award, UserCheck, Shield, MessageCircle, ChevronRight, BarChart3 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import DefaultLayout from "@/layouts/default";
import { useAdmin } from "@/hooks/admin/useAdmin";
import { useSponsorDashboard } from "@/hooks/useSponsorDashboard";
import { useQuery } from "@tanstack/react-query";
import { matchingService } from "@/services/services";

// Define the AdminStats interface to match the server response
interface AdminStats {
    pending_resources: number;
    pending_sponsor_applications: number;
    pending_support_groups: number;
    reportCounts: {
        pending: number;
        resolved: number;
        total: number;
    };
    resourceCounts: {
        articles: number;
        books: number;
        other: number;
        podcasts: number;
        total: number;
        videos: number;
    };
    supportGroupCounts: {
        total: number;
    };
    total_sponsors: number;
    total_users: number;
    unresolved_reports: number;
    userCounts: {
        adminUsers: number;
        bannedUsers: number;
        memberUsers: number;
        sponsorUsers: number;
        totalUsers: number;
    };
    userRegistrationsByMonth: Array<{
        count: number;
        month: string;
    }>;
}

export default function Home() {
    const { isAuthenticated, currentUser, isLoadingUser } = useUser();
    const navigate = useNavigate();
    const { getAdminStats } = useAdmin();
    const { getMenteeRequests, getMyMentees } = useSponsorDashboard();

    // Only fetch admin stats if user is an admin
    const {
        data: adminStatsResponse,
        isLoading: isLoadingAdminStats
    } = useQuery({
        queryKey: ["admin", "stats"],
        queryFn: async () => {
            const response = await getAdminStats().queryFn();
            return response;
        },
        enabled: currentUser?.role === "Admin" && isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Get admin stats from response - extract the data property which contains the actual stats
    const adminStats: AdminStats | undefined = adminStatsResponse?.data?.data;

    // Only fetch sponsor data if user is a sponsor
    const {
        data: menteeRequests,
        isLoading: isLoadingRequests
    } = useQuery({
        queryKey: ["sponsor", "menteeRequests"],
        queryFn: async () => {
            const response = await getMenteeRequests().queryFn();
            // Filter for pending requests
            return response.data.filter((request: any) => request.status === "Pending");
        },
        enabled: currentUser?.role === "Sponsor" && isAuthenticated,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    const {
        data: myMentees,
        isLoading: isLoadingMentees
    } = useQuery({
        queryKey: ["sponsor", "myMentees"],
        queryFn: async () => {
            const response = await getMyMentees().queryFn();
            // Filter for accepted requests
            return response.data.filter((request: any) => request.status === "Accepted");
        },
        enabled: currentUser?.role === "Sponsor" && isAuthenticated,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // For regular users, fetch sponsor matches
    const {
        data: sponsorMatches,
        isLoading: isLoadingSponsorMatches
    } = useQuery({
        queryKey: ["sponsorMatches"],
        queryFn: async () => {
            const response = await matchingService.getRecommendedSponsors();
            return response.data || [];
        },
        enabled: currentUser?.role !== "Admin" && currentUser?.role !== "Sponsor" && isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Calculate if we're loading based on user role
    const isLoadingRoleData =
        (currentUser?.role === "Admin" && isLoadingAdminStats) ||
        (currentUser?.role === "Sponsor" && (isLoadingRequests || isLoadingMentees)) ||
        (currentUser?.role !== "Admin" && currentUser?.role !== "Sponsor" && isLoadingSponsorMatches);

    // Authenticated user view (dashboard)
    const AuthenticatedView = () => (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold">Welcome back, {currentUser?.username}!</h1>
                <p className="text-default-500">
                    Here&apos;s what&apos;s happening in your Beyond The Horizon community.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                    <CardHeader className="flex gap-3">
                        <div className="p-2 rounded-md bg-primary/10 flex justify-center items-center">
                            <Newspaper className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-md font-semibold">Your Feed</p>
                            <p className="text-small text-default-500">Latest updates and posts</p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <p>Stay updated with the latest posts and activities from your community.</p>
                    </CardBody>
                    <Divider />
                    <CardFooter>
                        <Button
                            color="primary"
                            variant="flat"
                            onPress={() => navigate("/feed")}
                            fullWidth
                        >
                            Go to Feed
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="p-4">
                    <CardHeader className="flex gap-3">
                        <div className="p-2 rounded-md bg-primary/10 flex justify-center items-center">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-md font-semibold">Support Groups</p>
                            <p className="text-small text-default-500">Connect with others</p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <p>Join support groups to connect with others who share similar experiences.</p>
                    </CardBody>
                    <Divider />
                    <CardFooter>
                        <Button
                            color="primary"
                            variant="flat"
                            onPress={() => navigate("/support-groups")}
                            fullWidth
                        >
                            View Groups
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="p-4">
                    <CardHeader className="flex gap-3">
                        <div className="p-2 rounded-md bg-primary/10 flex justify-center items-center">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-md font-semibold">Resources</p>
                            <p className="text-small text-default-500">Helpful materials</p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <p>Access helpful resources, articles, and materials to support your journey.</p>
                    </CardBody>
                    <Divider />
                    <CardFooter>
                        <Button
                            color="primary"
                            variant="flat"
                            onPress={() => navigate("/resources")}
                            fullWidth
                        >
                            Browse Resources
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="mt-4">
                <Card className="p-4">
                    {isLoadingRoleData ? (
                        <div className="flex justify-center items-center p-8">
                            <Spinner size="md" color="primary" />
                        </div>
                    ) : currentUser?.role === "Admin" ? (
                        <>
                            <CardHeader className="flex gap-3">
                                <div className="p-2 rounded-md bg-danger/10 flex justify-center items-center">
                                    <Shield className="w-6 h-6 text-danger" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-md font-semibold">Administration</p>
                                    <p className="text-small text-default-500">Platform overview</p>
                                </div>
                            </CardHeader>
                            <Divider />
                            <CardBody>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="border border-default-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-default-500">Community Overview</span>
                                            <Users size={16} className="text-primary" />
                                        </div>
                                        <p className="text-2xl font-semibold">{adminStats?.userCounts?.totalUsers || 0}</p>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-default-500">Members</span>
                                                <span className="text-xs font-medium">{adminStats?.userCounts?.memberUsers || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-default-500">Sponsors</span>
                                                <span className="text-xs font-medium">{adminStats?.userCounts?.sponsorUsers || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-default-500">Admins</span>
                                                <span className="text-xs font-medium">{adminStats?.userCounts?.adminUsers || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border border-default-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-default-500">Resources & Groups</span>
                                            <BookOpen size={16} className="text-primary" />
                                        </div>
                                        <p className="text-2xl font-semibold">{(adminStats?.resourceCounts?.total || 0) + (adminStats?.supportGroupCounts?.total || 0)}</p>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-default-500">Support Groups</span>
                                                <span className="text-xs font-medium">{adminStats?.supportGroupCounts?.total || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-default-500">Resources</span>
                                                <span className="text-xs font-medium">{adminStats?.resourceCounts?.total || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-warning">Pending</span>
                                                <span className="text-xs font-medium">{(adminStats?.pending_resources || 0) + (adminStats?.pending_support_groups || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border border-default-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-default-500">Action Items</span>
                                            <Shield size={16} className="text-danger" />
                                        </div>
                                        <p className="text-2xl font-semibold">
                                            {(adminStats?.pending_sponsor_applications || 0) +
                                                (adminStats?.pending_support_groups || 0) +
                                                (adminStats?.pending_resources || 0) +
                                                (adminStats?.unresolved_reports || 0)}
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {adminStats?.pending_sponsor_applications ? (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-default-500">Sponsor Applications</span>
                                                    <span className="text-xs font-medium">{adminStats.pending_sponsor_applications}</span>
                                                </div>
                                            ) : null}
                                            {adminStats?.pending_resources ? (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-default-500">Resource Reviews</span>
                                                    <span className="text-xs font-medium">{adminStats.pending_resources}</span>
                                                </div>
                                            ) : null}
                                            {adminStats?.unresolved_reports ? (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-danger">Reports</span>
                                                    <span className="text-xs font-medium">{adminStats.unresolved_reports}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                            <Divider />
                            <CardFooter>
                                <Button
                                    color="danger"
                                    endContent={<ChevronRight size={16} />}
                                    onPress={() => navigate("/admin")}
                                    fullWidth
                                >
                                    Go to Admin Dashboard
                                </Button>
                            </CardFooter>
                        </>
                    ) : currentUser?.role === "Sponsor" ? (
                        <>
                            <CardHeader className="flex gap-3">
                                <div className="p-2 rounded-md bg-secondary/10 flex justify-center items-center">
                                    <Award className="w-6 h-6 text-secondary" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-md font-semibold">Sponsorship Activity</p>
                                    <p className="text-small text-default-500">Your impact overview</p>
                                </div>
                            </CardHeader>
                            <Divider />
                            <CardBody>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-default-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-default-500">Active Mentees</span>
                                            <Users size={16} className="text-primary" />
                                        </div>
                                        <p className="text-2xl font-semibold">{myMentees?.length || 0}</p>
                                        <div className="mt-2">
                                            <span className="text-xs text-default-500 mb-1 block">Status</span>
                                            <Progress value={myMentees?.length *10} color="secondary" size="sm" />
                                            <span className="text-xs text-default-400 mt-1 block">Good standing as a sponsor</span>
                                        </div>
                                    </div>
                                    <div className="border border-default-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-default-500">Mentoring Requests</span>
                                            <MessageCircle size={16} className="text-secondary" />
                                        </div>
                                        <p className="text-2xl font-semibold">{menteeRequests?.length || 0}</p>
                                        <div className="mt-2">
                                            <span className="text-xs text-default-500 mb-1 block">Request status</span>
                                            <div className="flex gap-1">
                                                {menteeRequests?.length > 0 ? (
                                                    <span className="inline-block w-3 h-3 rounded-full bg-warning"></span>
                                                ) : (
                                                    <span className="inline-block w-3 h-3 rounded-full bg-success"></span>
                                                )}
                                            </div>
                                            <span className="text-xs text-default-400 mt-1 block">
                                                {menteeRequests?.length > 0 ? `${menteeRequests.length} pending requests` : "No pending requests"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                            <Divider />
                            <CardFooter>
                                <Button
                                    color="secondary"
                                    endContent={<ChevronRight size={16} />}
                                    onPress={() => navigate("/sponsor")}
                                    fullWidth
                                >
                                    Go to Sponsor Dashboard
                                </Button>
                            </CardFooter>
                        </>
                    ) : (
                        <>
                            <CardHeader className="flex gap-3">
                                <div className="p-2 rounded-md bg-success/10 flex justify-center items-center">
                                    <UserCheck className="w-6 h-6 text-success" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-md font-semibold">Your Journey</p>
                                    <p className="text-small text-default-500">Support system overview</p>
                                </div>
                            </CardHeader>
                            <Divider />
                            <CardBody>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-default-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-default-500">Sponsor Matches Available</span>
                                            <Award size={16} className="text-success" />
                                        </div>
                                        <p className="text-2xl font-semibold">{sponsorMatches?.length || 0}</p>
                                        <div className="mt-2">
                                            {sponsorMatches && sponsorMatches.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {sponsorMatches.slice(0, 3).map((sponsor: any, index: number) => {
                                                        let bgColorClass = "";
                                                        let textColorClass = "";

                                                        if (index === 0) {
                                                            bgColorClass = "bg-success/10";
                                                            textColorClass = "text-success";
                                                        } else if (index === 1) {
                                                            bgColorClass = "bg-primary/10";
                                                            textColorClass = "text-primary";
                                                        } else {
                                                            bgColorClass = "bg-secondary/10";
                                                            textColorClass = "text-secondary";
                                                        }

                                                        return (
                                                            <span
                                                                key={index}
                                                                className={`text-xs ${bgColorClass} ${textColorClass} rounded-full px-2 py-0.5`}
                                                            >
                                                                {sponsor.specialty || "Support"}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <Button
                                                color="success"
                                                size="sm"
                                                variant="flat"
                                                className="mt-2"
                                                onPress={() => navigate("/sponsor-matching")}
                                            >
                                                Find a Sponsor
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="border border-default-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-default-500">Become a Sponsor</span>
                                            <BarChart3 size={16} className="text-secondary" />
                                        </div>
                                        <p className="text-md font-medium">Help others on their journey</p>
                                        <div className="mt-2">
                                            <ul className="text-xs text-default-500 space-y-1 list-disc pl-4 mb-2">
                                                <li>Share your experience and wisdom</li>
                                                <li>Make a difference in someone&apos;s life</li>
                                                <li>Strengthen your own recovery</li>
                                            </ul>
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                variant="flat"
                                                onPress={() => navigate("/sponsor-application")}
                                            >
                                                Apply Now
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );

    // Unauthenticated user view (landing page)
    const UnauthenticatedView = () => (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold">Beyond The Horizon</h1>
                <p className="text-xl text-default-500">
                    Connect, support, and grow together beyond the horizon.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
                <div className="flex flex-col gap-4 justify-center">
                    <h2 className="text-2xl font-semibold">A Community of Support</h2>
                    <p className="text-default-600">
                        Beyond The Horizon is a platform designed to connect individuals seeking support with
                        experienced mentors who can guide them through life&apos;s challenges.
                    </p>
                    <p className="text-default-600">
                        Whether you&apos;re looking for guidance or wanting to share your experience to help others,
                        our community provides a safe and supportive environment.
                    </p>
                    <div className="flex gap-4 mt-4">
                        <Button
                            color="primary"
                            onPress={() => navigate("/register")}
                        >
                            Join Now
                        </Button>
                        <Button
                            variant="flat"
                            color="default"
                            onPress={() => navigate("/about")}
                        >
                            Learn More
                        </Button>
                    </div>
                </div>
                <div className="flex justify-center items-center">
                    <Image
                        alt="Community illustration"
                        className="object-cover rounded-xl"
                        src="/images/community.jpg"
                        width={500}
                        height={350}
                    />
                </div>
            </div>

            <div className="py-8">
                <h2 className="text-2xl font-semibold mb-6 text-center">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-4">
                        <CardHeader className="justify-center">
                            <div className="rounded-full bg-primary/10 p-4 flex justify-center items-center">
                                <span className="text-2xl font-bold text-primary">1</span>
                            </div>
                        </CardHeader>
                        <CardBody className="text-center">
                            <h3 className="text-xl font-semibold">Create an Account</h3>
                            <p className="text-default-500">Sign up and complete your profile to get started.</p>
                        </CardBody>
                    </Card>

                    <Card className="p-4">
                        <CardHeader className="justify-center">
                            <div className="rounded-full bg-primary/10 p-4 flex justify-center items-center">
                                <span className="text-2xl font-bold text-primary">2</span>
                            </div>
                        </CardHeader>
                        <CardBody className="text-center">
                            <h3 className="text-xl font-semibold">Connect with Others</h3>
                            <p className="text-default-500">Join support groups and engage with the community.</p>
                        </CardBody>
                    </Card>

                    <Card className="p-4">
                        <CardHeader className="justify-center">
                            <div className="rounded-full bg-primary/10 p-4 flex justify-center items-center">
                                <span className="text-2xl font-bold text-primary">3</span>
                            </div>
                        </CardHeader>
                        <CardBody className="text-center">
                            <h3 className="text-xl font-semibold">Grow Together</h3>
                            <p className="text-default-500">Share experiences and support each other&apos;s journeys.</p>
                        </CardBody>
                    </Card>
                </div>
            </div>

            <div className="flex flex-col items-center py-8">
                <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
                <div className="flex gap-4">
                    <Button
                        color="primary"
                        size="lg"
                        onPress={() => navigate("/register")}
                    >
                        Create Account
                    </Button>
                    <Button
                        variant="flat"
                        color="default"
                        size="lg"
                        onPress={() => navigate("/login")}
                    >
                        Sign In
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <DefaultLayout>
            {isLoadingUser ? (
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {isAuthenticated ? <AuthenticatedView /> : <UnauthenticatedView />}
                </>
            )}
        </DefaultLayout>
    );
} 