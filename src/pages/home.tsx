import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { Button, Card, CardBody, CardFooter } from "@heroui/react";
import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, isLoadingUser } = useUser();

    if (isLoadingUser) {
        return (
            <div className="container mx-auto px-4">
                <div className="flex justify-center items-center min-h-[80vh]">
                    <h2 className="text-xl font-semibold">Loading...</h2>
                </div>
            </div>
        );
    }

    return (
        <DefaultLayout>
            <section className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-full max-w-5xl">
                    <div className="text-center mb-8">
                        <h1 className={title({ color: "violet" })}>Welcome to Beyond The Horizon</h1>
                        <p className={subtitle({ class: "mt-2" })}>
                            Your journey to recovery and support begins here
                        </p>
                    </div>

                    {currentUser ? (
                        <div className="mt-8">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-semibold">
                                    Hello, {currentUser.username}!
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                <Card>
                                    <CardBody>
                                        <h3 className="text-lg font-semibold mb-4">
                                            My Support Groups
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Access your support groups, track your progress, and connect with your community.
                                        </p>
                                    </CardBody>
                                    <CardFooter>
                                        <Button
                                            color="primary"
                                            fullWidth
                                            onPress={() => navigate('/dashboard')}
                                        >
                                            View My Groups
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardBody>
                                        <h3 className="text-lg font-semibold mb-4">
                                            Find Meetings
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Discover upcoming meetings, both virtual and in-person, in your area.
                                        </p>
                                    </CardBody>
                                    <CardFooter>
                                        <Button
                                            color="secondary"
                                            fullWidth
                                            onPress={() => navigate('/explore')}
                                        >
                                            Browse Meetings
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardBody>
                                        <h3 className="text-lg font-semibold mb-4">
                                            Connect with Sponsors
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Find or manage your sponsor relationships and mentorship connections.
                                        </p>
                                    </CardBody>
                                    <CardFooter>
                                        <Button
                                            color="primary"
                                            variant="flat"
                                            fullWidth
                                            onPress={() => navigate('/profile')}
                                        >
                                            Sponsor Network
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 text-center">
                            <Card className="max-w-md mx-auto">
                                <CardBody>
                                    <h2 className="text-xl font-semibold mb-4">
                                        Join our supportive community
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        Create an account to connect with support groups, find sponsors, and attend meetings on your journey to recovery.
                                    </p>
                                </CardBody>
                                <CardFooter className="flex justify-center gap-4">
                                    <Button
                                        color="primary"
                                        onPress={() => navigate('/login')}
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        variant="bordered"
                                        color="primary"
                                        onPress={() => navigate('/register')}
                                    >
                                        Register
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}

                    <div className="mt-16">
                        <div className="text-center mb-6">
                            <h2 className={title({ size: "sm", color: "foreground" })}>About Beyond The Horizon</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card>
                                <CardBody>
                                    <h3 className="text-lg font-semibold mb-3">Our Mission</h3>
                                    <p className="text-gray-600">
                                        Beyond The Horizon is dedicated to supporting individuals on their recovery journey.
                                        We provide a safe, anonymous platform where you can connect with support groups like
                                        Alcoholics Anonymous and find the community you need.
                                    </p>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardBody>
                                    <h3 className="text-lg font-semibold mb-3">How We Help</h3>
                                    <p className="text-gray-600">
                                        Our platform helps you find local and virtual support meetings, connect with experienced
                                        sponsors who can guide your recovery, and join groups where you can share your experiences
                                        in a judgment-free environment.
                                    </p>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </DefaultLayout>
    );
};

export default Home;
