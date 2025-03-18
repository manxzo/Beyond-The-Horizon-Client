import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Button,
    User,
    Chip,
} from "@heroui/react";
import {
    UserCheck,
    Calendar,
    MapPin,
    Languages,
    Briefcase,
    Award,
    CheckCircle,
    Clock,
    XCircle
} from "lucide-react";
import { useUser } from "../hooks/useUser";

interface SponsorCardProps {
    sponsor: any;
    matchScore?: number;
    requestStatus?: string;
    requestDate?: string;
    isRequested?: boolean;
    isDisabled?: boolean;
    onViewDetails?: () => void;
    onRequestSponsor?: () => void;
    onMessageSponsor?: () => void;
    showDetails?: boolean;
}

export default function SponsorCard({
    sponsor,
    matchScore,
    requestStatus,
    requestDate,
    isRequested = false,
    isDisabled = false,
    onViewDetails,
    onRequestSponsor,
    onMessageSponsor,
    showDetails = false
}: SponsorCardProps) {
    const { useGetUserById } = useUser();
    const { data: userData, isLoading } = useGetUserById(sponsor.id);

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    // Extract country from location JSON string
    const extractCountry = (locationString: string) => {
        if (!locationString) return "Not specified";
        try {
            const locationObj = JSON.parse(locationString);
            return locationObj.country || "Not specified";
        } catch (error) {
            console.error("Error parsing location:", error);
            return "Not specified";
        }
    };

    // Get status chip color based on request status
    const getStatusChipColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return "warning";
            case "accepted":
                return "success";
            case "declined":
                return "danger";
            default:
                return "default";
        }
    };

    // Get status icon based on request status
    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return <Clock className="w-4 h-4" />;
            case "accepted":
                return <CheckCircle className="w-4 h-4" />;
            case "declined":
                return <XCircle className="w-4 h-4" />;
            default:
                return null;
        }
    };

    // If we're loading user data, show a loading state
    if (isLoading) {
        return (
            <Card className="shadow-sm">
                <CardHeader className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <User
                            name="Loading..."
                            avatarProps={{
                                size: "md"
                            }}
                        />
                        <div>
                            <h3 className="text-lg font-medium">Loading...</h3>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    <div className="animate-pulse">
                        <div className="h-4 bg-default-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-default-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-default-200 rounded w-2/3"></div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    // Get the avatar URL from the user data if available
    const avatarUrl = userData?.avatar_url || sponsor.avatar_url;
    const username = userData?.username || sponsor.username || "Sponsor";

    return (
        <Card className="shadow-sm">
            <CardHeader className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <User
                        name={username}
                        avatarProps={{
                            src: avatarUrl,
                            size: "md"
                        }}
                    />
                    <div>
                        <h3 className="text-lg font-medium">{username}</h3>
                        <div className="flex items-center gap-2">
                            <Award className="text-success w-4 h-4" />
                            <span className="text-sm text-success">Sponsor</span>
                        </div>
                    </div>
                </div>
                {requestStatus && (
                    <Chip
                        color={getStatusChipColor(requestStatus)}
                        variant="flat"
                        startContent={getStatusIcon(requestStatus)}
                    >
                        {requestStatus}
                    </Chip>
                )}
            </CardHeader>
            <CardBody>
                {matchScore !== undefined && (
                    <div className="mb-2">
                        <Chip color="primary" variant="flat">
                            {matchScore}% Match Score
                        </Chip>
                    </div>
                )}

                {requestDate && (
                    <p className="text-sm text-default-500 mb-2">
                        Requested on {formatDate(requestDate)}
                    </p>
                )}

                {showDetails && (
                    <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <MapPin className="text-default-500" size={16} />
                            <span>Location: {sponsor.location ? extractCountry(sponsor.location) : "Not specified"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="text-default-500" size={16} />
                            <span>Available: {sponsor.available_days?.join(", ") || "Not specified"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Languages className="text-default-500" size={16} />
                            <span>Languages: {sponsor.languages?.join(", ") || "Not specified"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase className="text-default-500" size={16} />
                            <span>Experience: {sponsor.experience?.join(", ") || "Not specified"}</span>
                        </div>
                    </div>
                )}
            </CardBody>
            <Divider />
            <CardFooter className="flex justify-end gap-2">
                {onViewDetails && (
                    <Button
                        color="primary"
                        variant="flat"
                        onPress={onViewDetails}
                    >
                        View Details
                    </Button>
                )}

                {onRequestSponsor && (
                    <Button
                        color="primary"
                        startContent={<UserCheck size={16} />}
                        onPress={onRequestSponsor}
                        isDisabled={isRequested || isDisabled}
                    >
                        {isRequested ? "Requested" : "Request Sponsor"}
                    </Button>
                )}

                {onMessageSponsor && requestStatus?.toLowerCase() === "accepted" && (
                    <Button
                        color="primary"
                        onPress={onMessageSponsor}
                    >
                        Message Sponsor
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}