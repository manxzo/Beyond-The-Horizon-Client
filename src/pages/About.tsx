import { useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    CardBody,
    Divider,
    Image,
} from "@heroui/react";
import { Users, MessageSquare, Edit } from "lucide-react";
import DefaultLayout from "@/layouts/default";

export default function About() {
    const navigate = useNavigate();

    return (
        <DefaultLayout>
            <div className="flex flex-col gap-8 py-4">
                {/* Hero section */}
                <div className="flex flex-col gap-4">
                    <h1 className="text-4xl font-bold">About Beyond The Horizon</h1>
                    <p className="text-xl text-default-500">
                        Our mission is to create a supportive community where individuals can connect,
                        share experiences, and grow together.
                    </p>
                </div>

                {/* Mission and Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-6">
                        <CardBody className="flex flex-col gap-4">
                            <h2 className="text-2xl font-semibold">Our Mission</h2>
                            <p>
                                Beyond The Horizon is dedicated to providing a safe, supportive environment
                                where individuals can connect with experienced mentors who understand their
                                challenges and can offer guidance based on lived experience.
                            </p>
                            <p>
                                We believe that sharing experiences and supporting one another creates
                                a powerful foundation for personal growth and healing.
                            </p>
                        </CardBody>
                    </Card>

                    <Card className="p-6">
                        <CardBody className="flex flex-col gap-4">
                            <h2 className="text-2xl font-semibold">Our Vision</h2>
                            <p>
                                We envision a world where no one has to face life&apos;s challenges alone.
                                Where individuals can easily find support, guidance, and community
                                from others who have walked similar paths.
                            </p>
                            <p>
                                Through connection and shared experience, we aim to help people
                                move beyond their current horizons toward healing and growth.
                            </p>
                        </CardBody>
                    </Card>
                </div>

                {/* How it works */}
                <div className="flex flex-col gap-6 py-4">
                    <h2 className="text-2xl font-semibold">How Beyond The Horizon Works</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-4 items-center text-center">
                            <div className="rounded-full bg-primary/10 p-6 flex justify-center items-center">
                                <Users className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">Connect</h3>
                            <p className="text-default-500">
                                Create an account and connect with others who share similar experiences or challenges.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 items-center text-center">
                            <div className="rounded-full bg-primary/10 p-6 flex justify-center items-center">
                                <MessageSquare className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">Share</h3>
                            <p className="text-default-500">
                                Participate in support groups, discussions, and one-on-one conversations.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 items-center text-center">
                            <div className="rounded-full bg-primary/10 p-6 flex justify-center items-center">
                                <Edit className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold">Grow</h3>
                            <p className="text-default-500">
                                Learn from others&apos; experiences and gain insights to help navigate your own journey.
                            </p>
                        </div>
                    </div>
                </div>

                <Divider />

                {/* Our Team */}
                <div className="flex flex-col gap-6">
                    <h2 className="text-2xl font-semibold">Our Team</h2>
                    <p className="text-default-600">
                        Beyond The Horizon was founded by a team of individuals who understand
                        the importance of community support during challenging times. Our team
                        includes mental health professionals, community organizers, and individuals
                        with lived experience who are passionate about creating spaces for connection and growth.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <Card className="p-4">
                            <CardBody className="flex flex-col items-center gap-4 text-center">
                                <Image
                                    alt="Team member"
                                    className="object-cover rounded-full"
                                    height={120}
                                    src="/images/team/founder.jpg"
                                    width={120}
                                />
                                <div>
                                    <h3 className="text-xl font-semibold">Jane Doe</h3>
                                    <p className="text-default-500">Founder & CEO</p>
                                    <p className="mt-2">
                                        With over 15 years of experience in community building and mental health advocacy.
                                    </p>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="p-4">
                            <CardBody className="flex flex-col items-center gap-4 text-center">
                                <Image
                                    alt="Team member"
                                    className="object-cover rounded-full"
                                    height={120}
                                    src="/images/team/director.jpg"
                                    width={120}
                                />
                                <div>
                                    <h3 className="text-xl font-semibold">John Smith</h3>
                                    <p className="text-default-500">Program Director</p>
                                    <p className="mt-2">
                                        Clinical psychologist specializing in trauma-informed care and group therapy.
                                    </p>
                                </div>
                            </CardBody>
                        </Card>

                        <Card className="p-4">
                            <CardBody className="flex flex-col items-center gap-4 text-center">
                                <Image
                                    alt="Team member"
                                    className="object-cover rounded-full"
                                    height={120}
                                    src="/images/team/community.jpg"
                                    width={120}
                                />
                                <div>
                                    <h3 className="text-xl font-semibold">Sarah Johnson</h3>
                                    <p className="text-default-500">Community Manager</p>
                                    <p className="mt-2">
                                        Dedicated to creating inclusive spaces and fostering meaningful connections.
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {/* Join us CTA */}
                <div className="flex flex-col items-center gap-4 py-8 bg-default-100 rounded-xl p-8 mt-4">
                    <h2 className="text-2xl font-semibold text-center">Join Our Community</h2>
                    <p className="text-center max-w-2xl">
                        Whether you&apos;re seeking support or looking to offer guidance based on your experiences,
                        we welcome you to become part of our growing community.
                    </p>
                    <div className="flex gap-4 mt-4">
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
        </DefaultLayout>
    );
} 