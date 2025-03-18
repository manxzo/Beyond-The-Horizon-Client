import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Spinner,
    Divider,
    Chip,
    Avatar,
    Badge,
} from "@heroui/react";
import {
    User,
    Languages,
    Calendar,
    Heart,
    MessageSquare,
    AlertTriangle,
    UserX,
} from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useUser } from "../hooks/useUser";

export default function UserProfile() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();

    const { useGetUserByName, currentUser } = useUser();

    // Fetch user data based on the username from URL
    const {
        data: userData,
        isLoading,
        isError,
        
    } = useGetUserByName(username || "");

    // Function to handle sending a message to the user
    const handleSendMessage = () => {
        if (username) {
            navigate(`/messages/conversation/${username}`);
        }
    };

    // Check if the profile is the current user's profile
    const isOwnProfile = currentUser?.username === username;

    // Render loading state
    if (isLoading) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                    <Spinner size="lg" color="primary" />
                </div>
            </DefaultLayout>
        );
    }

    // Render error state
    if (isError) {
        return (
            <DefaultLayout>
                <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
                    <AlertTriangle size={48} className="text-danger mb-4" />
                    <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
                    <p className="text-gray-600 mb-6">
                        We couldn&apos;t find a user with the username &quot;{username}&quot;.
                    </p>
                    <Button color="primary" onPress={() => navigate("/feed")}>
                        Return to Feed
                    </Button>
                </div>
            </DefaultLayout>
        );
    }

    // Check if this is a private profile (limited data)
    const isPrivateProfile = userData && !('bio' in userData);

    return (
        <DefaultLayout>
            <div className="container mx-auto px-4 py-8">
                <Card className="w-full max-w-4xl mx-auto">
                    <CardHeader className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Avatar
                                src={userData?.avatar_url}
                                alt={userData?.username}
                                size="lg"
                                className="border-4 border-primary-100"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold">{userData?.username}</h1>
                                    <Badge color="primary" variant="flat" size="sm">
                                        {userData?.role}
                                    </Badge>
                                </div>
                                {!isPrivateProfile && userData?.user_profile && (
                                    <p className="text-gray-600">{userData.user_profile}</p>
                                )}
                            </div>
                        </div>
                        {!isOwnProfile && (
                            <Button
                                color="primary"
                                variant="solid"
                                startContent={<MessageSquare size={18} />}
                                onPress={handleSendMessage}
                            >
                                Send Message
                            </Button>
                        )}
                        {isOwnProfile && (
                            <Button
                                color="primary"
                                variant="solid"
                                onPress={() => navigate("/profile")}
                            >
                                Edit Profile
                            </Button>
                        )}
                    </CardHeader>

                    <Divider />

                    <CardBody>
                        {isPrivateProfile ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <UserX size={48} className="text-gray-400 mb-4" />
                                <h2 className="text-xl font-semibold mb-2">Private Profile</h2>
                                <p className="text-gray-600 max-w-md">
                                    This user has set their profile to private. Only basic information is visible.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Bio Section */}
                                {userData?.bio && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                            <User size={20} /> About
                                        </h2>
                                        <p className="text-gray-700 whitespace-pre-line">{userData.bio}</p>
                                    </div>
                                )}

                                {/* Interests Section */}
                                {userData?.interests && userData.interests.length > 0 && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                            <Heart size={20} /> Interests
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {userData.interests.map((interest: string, index: number) => (
                                                <Chip key={index} color="primary" variant="flat">
                                                    {interest}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Experience Section */}
                                {userData?.experience && userData.experience.length > 0 && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                            <Calendar size={20} /> Experience
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {userData.experience.map((exp: string, index: number) => (
                                                <Chip key={index} color="secondary" variant="flat">
                                                    {exp}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Languages Section */}
                                {userData?.languages && userData.languages.length > 0 && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                            <Languages size={20} /> Languages
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {userData.languages.map((language: string, index: number) => (
                                                <Chip key={index} color="success" variant="flat">
                                                    {language}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardBody>

                    <CardFooter>
                        <div className="w-full flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                {userData?.role === "Sponsor" && (
                                    <span className="text-primary-600 font-medium">Verified Sponsor</span>
                                )}
                            </div>
                            {!isOwnProfile && (
                                <Button
                                    color="primary"
                                    variant="light"
                                    startContent={<MessageSquare size={18} />}
                                    onPress={handleSendMessage}
                                >
                                    Message
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </DefaultLayout>
    );
} 