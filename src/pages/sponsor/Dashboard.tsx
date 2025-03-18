import { Button, Card, CardBody, CardHeader, Divider, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
    Users,
    UserCheck,
    Award
} from "lucide-react";
import SponsorNav from "@/components/SponsorNav";
import DefaultLayout from "@/layouts/default";
import { useSponsorDashboard } from "@/hooks/useSponsorDashboard";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
export default function SponsorDashboard() {
    const { currentUser } = useUser();
    const { getMenteeRequests, getMyMentees } = useSponsorDashboard();
    const navigate = useNavigate();
    // Get mentee requests
    const {
        data: menteeRequests,
        isLoading: isLoadingRequests
    } = useQuery(getMenteeRequests());

    // Get my mentees
    const {
        data: myMentees,
        isLoading: isLoadingMentees
    } = useQuery(getMyMentees());

    const isLoading = isLoadingRequests || isLoadingMentees;

    if (isLoading) {
        return (
            <DefaultLayout>
                <SponsorNav />
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" color="primary" />
                </div>
            </DefaultLayout>
        );
    }

    const statCards = [
        {
            title: "Pending Requests",
            value: menteeRequests?.length || 0,
            icon: <UserCheck size={24} className="text-warning" />,
            description: "Mentee requests awaiting your response",
        },
        {
            title: "Active Mentees",
            value: myMentees?.length || 0,
            icon: <Users size={24} className="text-success" />,
            description: "Members you are currently mentoring",
        },
        {
            title: "Sponsor Status",
            value: "Active",
            icon: <Award size={24} className="text-secondary" />,
            description: "Your current sponsor status",
        },
    ];

    return (
        <DefaultLayout>
            {/* Sponsor Navigation */}
            <SponsorNav />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Sponsor Dashboard</h1>
                    <p className="text-default-500">Welcome back, {currentUser?.username}! Here&apos;s an overview of your sponsor activity.</p>
                </div>

                <Divider />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {statCards.map((card, index) => (
                        <Card key={index} className="shadow-sm">
                            <CardHeader className="flex justify-between items-center pb-2">
                                <h3 className="text-lg font-medium">{card.title}</h3>
                                {card.icon}
                            </CardHeader>
                            <CardBody>
                                <div className="flex flex-col">
                                    <span className="text-3xl font-bold">{card.value}</span>
                                    <span className="text-default-500 text-sm mt-1">{card.description}</span>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Sponsor Responsibilities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <h3 className="text-lg font-medium">Mentoring Guidelines</h3>
                            </CardHeader>
                            <CardBody>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Respond to mentee requests in a timely manner</li>
                                    <li>Provide guidance and support to your mentees</li>
                                    <li>Maintain regular communication with active mentees</li>
                                    <li>Respect confidentiality and privacy</li>
                                    <li>Report any concerns to administrators</li>
                                </ul>
                            </CardBody>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader>
                                <h3 className="text-lg font-medium">Quick Actions</h3>
                            </CardHeader>
                            <CardBody className="flex flex-col gap-2">
                                <Button onPress={() => navigate("/sponsor/requests")}>Review pending mentee requests</Button>
                                <Button onPress={() => navigate("/sponsor/mentees")}>Check in with your current mentees</Button>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </DefaultLayout>
    );
} 