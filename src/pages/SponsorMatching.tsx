import { useState } from "react";
import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Spinner,
    Button,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Textarea,
    Badge
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
    UserCheck,
    AlertTriangle,  
} from "lucide-react";
import DefaultLayout from "@/layouts/default";
import { useMatching } from "@/hooks/useMatching";
import { useUser } from "@/hooks/useUser";
import { useNavigate } from "react-router-dom";
import SponsorCard from "@/components/SponsorCard";

export default function SponsorMatching() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedSponsor, setSelectedSponsor] = useState<any>(null);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const handleSendMessage = (username: string) => {
        if (username) {
            navigate(`/messages/conversation/${username}`);
        }
    };
    const { currentUser } = useUser();
    const {
        getRecommendedSponsors,
        getMatchingStatus,
        requestSponsor,
        isRequestingSponsor
    } = useMatching();

    // Check if profile is complete
    const isProfileComplete = () => {
        return Boolean(
            currentUser?.location &&
            currentUser?.interests &&
            currentUser?.interests.length > 0 &&
            currentUser?.experience &&
            currentUser?.experience.length > 0 &&
            currentUser?.available_days &&
            currentUser?.available_days.length > 0 &&
            currentUser?.languages &&
            currentUser?.languages.length > 0
        );
    };

    // Get recommended sponsors
    const recommendedSponsorsConfig = getRecommendedSponsors();
    const {
        data: recommendedSponsors,
        isLoading: isLoadingSponsors,
        error: sponsorsError,
        refetch: refetchSponsors
    } = useQuery({
        queryKey: recommendedSponsorsConfig.queryKey,
        queryFn: recommendedSponsorsConfig.queryFn,
        select: recommendedSponsorsConfig.select,
        staleTime: recommendedSponsorsConfig.staleTime,
        enabled: isProfileComplete()
    });

    // Get matching status
    const matchingStatusConfig = getMatchingStatus();
    const {
        data: matchingStatus,
        isLoading: isLoadingStatus,
        error: statusError,
        refetch: refetchStatus
    } = useQuery({
        queryKey: matchingStatusConfig.queryKey,
        queryFn: matchingStatusConfig.queryFn,
        select: matchingStatusConfig.select,
        staleTime: matchingStatusConfig.staleTime,
        enabled: isProfileComplete()
    });

    const handleViewSponsor = (sponsor: any) => {
        setSelectedSponsor(sponsor);
        onOpen();
    };

    const handleRequestSponsor = async (sponsorId: string) => {
        try {
            await requestSponsor(sponsorId);
            setMessage("");
            onClose();
            refetchStatus();
            refetchSponsors();
        } catch (error) {
            console.error("Error requesting sponsor:", error);
        }
    };

    // Check if user has already requested a specific sponsor
    const hasRequestedSponsor = (sponsorId: string) => {
        if (!matchingStatus) return false;
        return matchingStatus.some((request: any) =>
            request.sponsor_id === sponsorId && request.status.toLowerCase() === "pending"
        );
    };

    // Check if user already has an accepted sponsor
    const hasAcceptedSponsor = () => {
        if (!matchingStatus) return false;
        return matchingStatus.some((request: any) =>
            request.status.toLowerCase() === "accepted"
        );
    };

    const isLoading = isLoadingSponsors || isLoadingStatus;
    const error = sponsorsError || statusError;

    // If profile is incomplete, show a message - CHECK THIS FIRST
    if (!isProfileComplete()) {
        return (
            <DefaultLayout>
                <div className="py-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Sponsor Matching</h1>
                    </div>

                    <Card className="max-w-3xl mx-auto">
                        <CardHeader className="flex gap-3">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-warning w-6 h-6" />
                                    <p className="text-xl font-semibold">Complete Your Profile First</p>
                                </div>
                                <p className="text-small text-default-500">
                                    You need to complete your profile before you can request a sponsor.
                                </p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                            <p className="mb-4">
                                To get matched with a sponsor, we need more information about you. Please complete your profile with the following information:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                {!currentUser?.location && <li>Your location</li>}
                                {(!currentUser?.interests || currentUser.interests.length === 0) && <li>Your interests</li>}
                                {(!currentUser?.experience || currentUser.experience.length === 0) && <li>Your experience level</li>}
                                {(!currentUser?.available_days || currentUser.available_days.length === 0) && <li>Your availability</li>}
                                {(!currentUser?.languages || currentUser.languages.length === 0) && <li>Languages you speak</li>}
                            </ul>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                            <Button
                                color="primary"
                                onPress={() => navigate("/profile")}
                            >
                                Complete My Profile
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </DefaultLayout>
        );
    }

    // Then check for loading state
    if (isLoading) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" color="primary" />
                </div>
            </DefaultLayout>
        );
    }

    // Then check for errors
    if (error) {
        return (
            <DefaultLayout>
                <div className="bg-danger-50 text-danger p-4 rounded-lg">
                    Error loading sponsor matching data. Please try again later.
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Sponsor Matching</h1>
                </div>

                {/* Current Requests Section */}
                {matchingStatus && matchingStatus.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Your Sponsor Requests</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matchingStatus.map((request: any) => (
                                <SponsorCard
                                    key={request.matching_request_id}
                                    sponsor={{
                                        id: request.sponsor_id,
                                        username: request.username,
                                        avatar_url: request.avatar_url
                                    }}
                                    requestStatus={request.status}
                                    requestDate={request.created_at}
                                    onMessageSponsor={() => handleSendMessage(request.username)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommended Sponsors Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Recommended Sponsors</h2>
                        {hasAcceptedSponsor() && (
                            <Badge color="success" variant="flat">
                                You already have an active sponsor
                            </Badge>
                        )}
                    </div>

                    {recommendedSponsors && recommendedSponsors.length === 0 ? (
                        <div className="text-center p-8 bg-content1 rounded-lg">
                            <p className="text-xl">No sponsors available at the moment</p>
                            <p className="text-default-500 mt-2">Please check back later for sponsor recommendations.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedSponsors?.map((sponsorData: any) => {
                                const sponsor = sponsorData[0]; 
                                const matchScore = sponsorData[1]; 
                                const alreadyRequested = hasRequestedSponsor(sponsor.id);

                                return (
                                    <SponsorCard
                                        key={sponsor.id}
                                        sponsor={sponsor}
                                        matchScore={matchScore}
                                        isRequested={alreadyRequested}
                                        isDisabled={hasAcceptedSponsor() || isRequestingSponsor}
                                        onViewDetails={() => handleViewSponsor(sponsor)}
                                        onRequestSponsor={() => handleRequestSponsor(sponsor.id)}
                                        showDetails={true}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sponsor Details Modal */}
                <Modal isOpen={isOpen} onClose={onClose} size="3xl">
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader>
                                    <h3 className="text-xl font-bold">
                                        Sponsor Details
                                    </h3>
                                </ModalHeader>
                                <ModalBody>
                                    {selectedSponsor && (
                                        <div className="space-y-4">
                                            <SponsorCard
                                                sponsor={selectedSponsor}
                                                showDetails={true}
                                                isRequested={hasRequestedSponsor(selectedSponsor.id)}
                                            />

                                            <Divider />

                                            <div>
                                                <h4 className="font-semibold mb-2">Interests</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedSponsor.interests?.map((interest: string, index: number) => (
                                                        <Chip key={index} color="primary" variant="flat">
                                                            {interest}
                                                        </Chip>
                                                    )) || "No interests specified"}
                                                </div>
                                            </div>

                                            <Divider />

                                            <div>
                                                <h4 className="font-semibold mb-2">Send a message with your request (optional)</h4>
                                                <Textarea
                                                    placeholder="Write a message to the sponsor..."
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    minRows={3}
                                                    isDisabled={hasRequestedSponsor(selectedSponsor.id) || hasAcceptedSponsor()}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        color="default"
                                        variant="flat"
                                        onPress={onClose}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        color="primary"
                                        startContent={<UserCheck size={16} />}
                                        onPress={() => handleRequestSponsor(selectedSponsor.id)}
                                        isDisabled={hasRequestedSponsor(selectedSponsor.id) || hasAcceptedSponsor() || isRequestingSponsor}
                                    >
                                        {hasRequestedSponsor(selectedSponsor.id) ? "Already Requested" : "Request Sponsor"}
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </div>
        </DefaultLayout>
    );
} 