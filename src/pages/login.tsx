//@ts-nocheck
import { useState, useEffect } from "react";
import {  Input, Button, Card, CardBody, CardFooter, Tabs, Tab, Form, DateInput } from "@heroui/react";
import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { useUser } from "@/hooks/useUser";
import {  getLocalTimeZone, today } from "@internationalized/date";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [selected, setSelected] = useState<"login" | "register">("login");

    // Registration form state
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [dob, setDob] = useState<Date | null>(null);
    const [dobError, setDobError] = useState("");

    // Password validation
    const passwordErrors = [];
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

            // Check if user is at least 13 years old
            const minAge = 16;
            const dobYear = dob.year;
            const currentYear = currentDate.year;

            let age = currentYear - dobYear;

            // Adjust age if birthday hasn't occurred yet this year
            if (
                currentDate.month < dob.month ||
                (currentDate.month === dob.month && currentDate.day < dob.day)
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

    // Use the existing useUser hook for authentication
    const {
        login,
        isLoggingIn,
        loginError,
        register,
        isRegistering,
        registerError,
    } = useUser();

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        login({ username: data.username, password: data.password });
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));

        // Basic validation
        if (data.password !== data.confirmPassword) {
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


        // Call the register function from useUser hook
        register({
            username: data.username,
            password: data.password,
            email: data.email,
            dob: data.dob,
        });
    };

    return (
        <DefaultLayout>
            <section className="flex flex-col items-center justify-center py-12 px-4">
                <Tabs aria-label="Auth Tabs" selectedKey={selected} onSelectionChange={setSelected}>
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
                                            labelPlacement="outside"
                                            name="username"
                                            placeholder="Enter your username"
                                            value={username}
                                            onValueChange={setUsername}
                                        />

                                        <Input
                                            isRequired
                                            label="Password"
                                            labelPlacement="outside"
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
                                            onClick={() => setSelected("register")}
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
                                            labelPlacement="outside"
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
                                            labelPlacement="outside"
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
                                            labelPlacement="outside"
                                            name="dob"
                                            placeholder="Select your date of birth"
                                            value={dob}
                                            onChange={setDob}
                                            isInvalid={!!dobError}
                                            errorMessage={dobError}
                                            maxValue={today(getLocalTimeZone())}
                                        />

                                        <Input
                                            isRequired
                                            label="Password"
                                            labelPlacement="outside"
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
                                            labelPlacement="outside"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="Confirm your password"
                                            value={confirmPassword}
                                            onValueChange={setConfirmPassword}
                                            isInvalid={confirmPassword && confirmPassword !== registerPassword}
                                            errorMessage={() =>
                                                confirmPassword && confirmPassword !== registerPassword
                                                    ? "Passwords don't match"
                                                    : null
                                            }
                                        />

                                        {registerError && (
                                            <div className="text-danger text-sm">
                                                {registerError instanceof Error ? registerError.message : "Registration failed. Please try again."}
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            color="primary"
                                            fullWidth
                                            isLoading={isRegistering}
                                            isDisabled={passwordErrors.length > 0 || !dob || !!dobError}
                                        >
                                            {isRegistering ? "Creating account..." : "Create account"}
                                        </Button>
                                    </Form>
                                </CardBody>

                                <CardFooter className="flex justify-center">
                                    <p className="text-sm">
                                        Already have an account?{" "}
                                        <Button
                                            variant="light"
                                            color="primary"
                                            size="sm"
                                            onClick={() => setSelected("login")}
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
}
