import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Checkbox,
    Divider,
    Input,
    Link,
    Spinner
} from "@heroui/react";
import { useUser } from "@/hooks/useUser";
import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site";

export default function Login() {
    const navigate = useNavigate();
    const { login, isLoggingIn, loginError, isAuthenticated } = useUser();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState<{
        username?: string;
        password?: string;
        general?: string;
    }>({});

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    // Update errors when login error occurs
    useEffect(() => {
        if (loginError) {
            setErrors({
                general: "Invalid username or password. Please try again."
            });
        }
    }, [loginError]);

    const validateForm = () => {
        const newErrors: {
            username?: string;
            password?: string;
        } = {};

        if (!username.trim()) {
            newErrors.username = "Username is required";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            // Clear any previous errors
            setErrors({});

            // Call login from useUser hook
            login({ username, password });

            // If remember me is checked, store the username in localStorage
            if (rememberMe) {
                localStorage.setItem("rememberedUsername", username);
            } else {
                localStorage.removeItem("rememberedUsername");
            }
        }
    };

    // Load remembered username if available
    useEffect(() => {
        const rememberedUsername = localStorage.getItem("rememberedUsername");
        if (rememberedUsername) {
            setUsername(rememberedUsername);
            setRememberMe(true);
        }
    }, []);

    return (
        <DefaultLayout>
            <div className="flex justify-center items-center min-h-[80vh]">
                <Card className="w-full max-w-md">
                    <CardHeader className="flex flex-col gap-1 items-center">
                        <h1 className="text-2xl font-bold">Welcome Back</h1>
                        <p className="text-default-500">Sign in to your account</p>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {errors.general && (
                                <div className="bg-danger-50 text-danger p-3 rounded-md text-sm">
                                    {errors.general}
                                </div>
                            )}

                            <Input
                                label="Username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                isInvalid={!!errors.username}
                                errorMessage={errors.username}
                                isRequired
                                autoComplete="username"
                            />

                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                isInvalid={!!errors.password}
                                errorMessage={errors.password}
                                isRequired
                                autoComplete="current-password"
                            />

                            <div className="flex justify-between items-center">
                                <Checkbox
                                    isSelected={rememberMe}
                                    onValueChange={setRememberMe}
                                >
                                    Remember me
                                </Checkbox>

                                <Link
                                    as={RouterLink}
                                    to={siteConfig.authLinks.forgotPassword}
                                    size="sm"
                                    className="text-primary"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                color="primary"
                                isLoading={isLoggingIn}
                                spinner={<Spinner size="sm" color="current" />}
                                fullWidth
                            >
                                Sign In
                            </Button>
                        </form>
                    </CardBody>
                    <Divider />
                    <CardFooter className="flex justify-center">
                        <p className="text-default-500">
                            Don&apos;t have an account?{" "}
                            <Link
                                as={RouterLink}
                                to={siteConfig.authLinks.register || "/register"}
                                className="text-primary"
                            >
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </DefaultLayout>
    );
} 