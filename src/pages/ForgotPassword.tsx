import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Input,
    Link,
    Spinner
} from "@heroui/react";
import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");

    const validateEmail = (email: string) => {
        return /\S+@\S+\.\S+/.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }

        setError("");
        setIsSubmitting(true);

       
    };

    return (
        <DefaultLayout>
            <div className="flex justify-center items-center min-h-[80vh]">
                <Card className="w-full max-w-md">
                    <CardHeader className="flex flex-col gap-1 items-center">
                        <h1 className="text-2xl font-bold">Reset Your Password</h1>
                        <p className="text-default-500">
                            Enter your email to receive password reset instructions
                        </p>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {isSubmitted ? (
                            <div className="flex flex-col items-center gap-4 py-4">
                                <div className="rounded-full bg-success/10 p-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="32"
                                        height="32"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-success"
                                    >
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold">Check Your Email</h2>
                                <p className="text-center text-default-500">
                                    If an account exists for {email}, we&apos;ve sent instructions to reset your password.
                                    Please check your email.
                                </p>
                                <p className="text-sm text-default-400 mt-4">
                                    Didn&apos;t receive an email? Check your spam folder or{" "}
                                    <Button
                                        variant="light"
                                        color="primary"
                                        onPress={() => setIsSubmitted(false)}
                                        className="p-0 h-auto"
                                    >
                                        try again
                                    </Button>
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                {error && (
                                    <div className="bg-danger-50 text-danger p-3 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}

                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    isInvalid={!!error}
                                    errorMessage={error}
                                    isRequired
                                    autoComplete="email"
                                />

                                <Button
                                    type="submit"
                                    color="primary"
                                    isLoading={isSubmitting}
                                    spinner={<Spinner size="sm" color="current" />}
                                    fullWidth
                                    className="mt-2"
                                >
                                    Reset Password
                                </Button>
                            </form>
                        )}
                    </CardBody>
                    <Divider />
                    <CardFooter className="flex justify-center">
                        <p className="text-default-500">
                            Remember your password?{" "}
                            <Link
                                as={RouterLink}
                                to={siteConfig.authLinks.login}
                                className="text-primary"
                            >
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </DefaultLayout>
    );
} 