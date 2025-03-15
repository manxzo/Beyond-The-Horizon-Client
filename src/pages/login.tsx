import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, CardBody, CardFooter, Tabs, Tab, Form, DateInput } from "@heroui/react";
import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useUser } from '../hooks/useUser';
import { getLocalTimeZone, today, CalendarDate, parseDate } from "@internationalized/date";

const Login: React.FC = () => {
    const navigate = useNavigate();
    const {
        login,
        isLoggingIn,
        loginError,
        register,
        isRegistering,
        registerError,
        isAuthenticated,
        isCheckingAuth
    } = useUser();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [selected, setSelected] = useState<"login" | "register">("login");

    // Registration form state
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [dob, setDob] = useState<CalendarDate | any>(parseDate("2025-01-01"));
    const [dobError, setDobError] = useState("");

    // Password validation
    const passwordErrors: string[] = [];
    if (registerPassword) {
        if (registerPassword.length < 8) {
            passwordErrors.push("Password must be 8 characters or more");
        }
        if ((registerPassword.match(/[A-Z]/g) || []).length < 1) {
            passwordErrors.push("Password must include at least 1 uppercase letter");
        }
        if ((registerPassword.match(/[0-9]/g) || []).length < 1) {
            passwordErrors.push("Password must include at least 1 number");
        }
        if ((registerPassword.match(/[^a-z0-9]/gi) || []).length < 1) {
            passwordErrors.push("Password must include at least 1 special character");
        }
    }

    // Validate date of birth
    useEffect(() => {
        if (dob) {
            const currentDate = today(getLocalTimeZone());

            // Check if user is at least 16 years old
            const minAge = 16;
            const dobYear = dob.year;
            const currentYear = currentDate.year;

            let age = currentYear - dobYear;

            // Adjust age if birthday hasn't occurred yet this year
            if (
                dob.month > currentDate.month ||
                (dob.month === currentDate.month && dob.day > currentDate.day)
            ) {
                age--;
            }

            if (age < minAge) {
                setDobError(`You must be at least ${minAge} years old to register`);
            } else if (age > 100) {
                setDobError("Please enter a valid date of birth");
            } else {
                setDobError("");
            }
        } else {
            setDobError("");
        }
    }, [dob]);

    // Auto-navigate away if already logged in
    useEffect(() => {
        if (isAuthenticated && !isCheckingAuth) {
            navigate('/');
        }
    }, [isAuthenticated, isCheckingAuth, navigate]);

    // Handle login form submission
    const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        login({ username, password });
    };

    // Handle register form submission
    const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Get form values with proper type casting
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        const email = formData.get('email') as string;

        // Basic validation
        if (password !== confirmPassword) {
            console.error("Passwords don't match");
            return;
        }

        if (!dob) {
            console.error("Date of birth is required");
            return;
        }

        if (dobError) {
            console.error(dobError);
            return;
        }

        // Convert CalendarDate to string format for the API
        const dobString = dob.toString();

        // Call the register function from useUser hook
        register({
            username,
            password,
            email,
            dob: dobString,
        });
    };

    // Show loading state while checking authentication
    if (isCheckingAuth) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Checking authentication status...</p>
            </div>
        );
    }

    // If already authenticated, this will redirect via the useEffect

    return (
        <DefaultLayout>
            <section className="flex flex-col items-center justify-center py-12 px-4">
                <Tabs
                    aria-label="Auth Tabs"
                    selectedKey={selected}
                    onSelectionChange={(key) => setSelected(key as "login" | "register")}
                >
                    <Tab key="login" title="Login">
                        <div className="w-full max-w-md">
                            <div className="text-center mb-8">
                                <h1 className={title({ color: "violet" })}>Login</h1>
                                <p className={subtitle({ class: "mt-2" })}>
                                    Sign in to your account
                                </p>
                            </div>
                            <Card className="w-full">
                                <CardBody>
                                    <Form className="space-y-4" onSubmit={handleLoginSubmit}>
                                        <Input
                                            isRequired
                                            label="Username"
                                            name="username"
                                            placeholder="Enter your username"
                                            value={username}
                                            onValueChange={setUsername}
                                        />

                                        <Input
                                            isRequired
                                            label="Password"
                                            name="password"
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onValueChange={setPassword}
                                        />

                                        {loginError && (
                                            <div className="text-danger text-sm">
                                                {loginError instanceof Error ? loginError.message : "Login failed. Please try again."}
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            color="primary"
                                            fullWidth
                                            isLoading={isLoggingIn}
                                        >
                                            {isLoggingIn ? "Signing in..." : "Sign in"}
                                        </Button>
                                    </Form>
                                </CardBody>

                                <CardFooter className="flex justify-center">
                                    <p className="text-sm">
                                        Don&apos;t have an account?{" "}
                                        <Button
                                            variant="light"
                                            color="primary"
                                            size="sm"
                                            onPress={() => setSelected("register")}
                                        >
                                            Sign up
                                        </Button>
                                    </p>
                                </CardFooter>
                            </Card>
                        </div>
                    </Tab>
                    <Tab key="register" title="Register">
                        <div className="w-full max-w-md">
                            <div className="text-center mb-8">
                                <h1 className={title({ color: "violet" })}>Register</h1>
                                <p className={subtitle({ class: "mt-2" })}>
                                    Create a new account
                                </p>
                            </div>
                            <Card className="w-full">
                                <CardBody>
                                    <Form className="space-y-4" onSubmit={handleRegisterSubmit}>
                                        <Input
                                            isRequired
                                            label="Username"
                                            name="username"
                                            placeholder="Choose a username"
                                            value={registerUsername}
                                            onValueChange={setRegisterUsername}
                                            validate={(value) => {
                                                if (value.length < 3) {
                                                    return "Username must be at least 3 characters long";
                                                }
                                                return null;
                                            }}
                                        />

                                        <Input
                                            isRequired
                                            label="Email"
                                            name="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onValueChange={setEmail}
                                            errorMessage={({ validationDetails }) => {
                                                if (validationDetails.typeMismatch) {
                                                    return "Please enter a valid email address";
                                                }
                                                return null;
                                            }}
                                        />

                                        <DateInput
                                            isRequired
                                            label="Date of Birth"
                                            name="dob"
                                            value={dob}
                                            onChange={setDob}
                                            isInvalid={!!dobError}
                                            errorMessage={dobError}
                                            maxValue={today(getLocalTimeZone())}
                                        />

                                        <Input
                                            isRequired
                                            label="Password"
                                            name="password"
                                            type="password"
                                            placeholder="Create a password"
                                            value={registerPassword}
                                            onValueChange={setRegisterPassword}
                                            isInvalid={passwordErrors.length > 0 && registerPassword.length > 0}
                                            errorMessage={() => passwordErrors.length > 0 && (
                                                <ul className="list-disc pl-4">
                                                    {passwordErrors.map((error, i) => (
                                                        <li key={i}>{error}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        />

                                        <Input
                                            isRequired
                                            label="Confirm Password"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="Confirm your password"
                                            value={confirmPassword}
                                            onValueChange={setConfirmPassword}
                                            isInvalid={confirmPassword !== "" && confirmPassword !== registerPassword}
                                            errorMessage={() =>
                                                confirmPassword !== "" && confirmPassword !== registerPassword
                                                    ? "Passwords don't match"
                                                    : null
                                            }
                                        />

                                        <Button
                                            type="submit"
                                            color="primary"
                                            fullWidth
                                            isLoading={isRegistering}
                                            isDisabled={passwordErrors.length > 0 || !dob || !!dobError}
                                        >
                                            {isRegistering ? "Creating account..." : "Create account"}
                                        </Button>

                                        {registerError && (
                                            <div className="text-danger text-sm">
                                                {registerError instanceof Error ? registerError.message : "Registration failed. Please try again."}
                                            </div>
                                        )}
                                    </Form>
                                </CardBody>

                                <CardFooter className="flex justify-center">
                                    <p className="text-sm">
                                        Already have an account?{" "}
                                        <Button
                                            variant="light"
                                            color="primary"
                                            size="sm"
                                            onPress={() => setSelected("login")}
                                        >
                                            Sign in
                                        </Button>
                                    </p>
                                </CardFooter>
                            </Card>
                        </div>
                    </Tab>
                </Tabs>
            </section>
        </DefaultLayout>
    );
};

export default Login;
