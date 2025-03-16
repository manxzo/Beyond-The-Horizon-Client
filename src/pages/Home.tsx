import { useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Image,
} from "@heroui/react";
import { Newspaper, Users, BookOpen } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import DefaultLayout from "@/layouts/default";

export default function Home() {
    const { isAuthenticated, currentUser, isLoadingUser } = useUser();
    const navigate = useNavigate();

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