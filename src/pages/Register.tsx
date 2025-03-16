import { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Checkbox,
    DateInput,
    Divider,
    Input,
    Link,
    Spinner,
    addToast,
} from "@heroui/react";
import { parseDate, getLocalTimeZone, today, DateValue } from '@internationalized/date';
import { useUser } from "@/hooks/useUser";
import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site";
import { UserSignupData } from "@/interfaces/user";

export default function Register() {
    const navigate = useNavigate();
    const { register, isRegistering, registerError, isAuthenticated } = useUser();

    const [formData, setFormData] = useState<UserSignupData>({
        username: "",
        email: "",
        password: "",
        dob: ""
    });

    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [errors, setErrors] = useState<{
        username?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        dob?: string;
        terms?: string;
        general?: string;
    }>({});

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    // Update errors when registration error occurs
    useEffect(() => {
        if (registerError) {
            const errorMessage = registerError.toString();

            if (errorMessage.includes("username")) {
                setErrors(prev => ({ ...prev, username: "Username already taken" }));
            } else if (errorMessage.includes("email")) {
                setErrors(prev => ({ ...prev, email: "Email already in use" }));
            } else {
                setErrors(prev => ({
                    ...prev,
                    general: "Registration failed. Please try again."
                }));
            }
        }
    }, [registerError]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setErrors({});
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Updated date change handler to use DateValue
    const handleDateChange = (value: DateValue | null) => {
        if (value) {
            // Format date as YYYY-MM-DD
            const formattedDate = value.toString();
            setFormData(prev => ({ ...prev, dob: formattedDate }));
        } else {
            setFormData(prev => ({ ...prev, dob: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: {
            username?: string;
            email?: string;
            password?: string;
            confirmPassword?: string;
            dob?: string;
            terms?: string;
        } = {};
        // Username validation
        if (!formData.username.trim()) {
            newErrors.username = "Username is required";
        } else if (formData.username.length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = "Username can only contain letters, numbers, and underscores";
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = "Password must include uppercase, lowercase, and numbers";
        }

        // Confirm password validation
        if (formData.password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        // Date of birth validation
        if (!formData.dob) {
            newErrors.dob = "Date of birth is required";
        } else {
            try {
                // Parse the date string to CalendarDate
                const dobDate = parseDate(formData.dob);
                const todayDate = today(getLocalTimeZone());

                // Calculate minimum age date (13 years ago)
                const minAgeDate = todayDate.subtract({ years: 13 });

                if (dobDate.compare(todayDate) > 0) {
                    newErrors.dob = "Date of birth cannot be in the future";
                } else if (dobDate.compare(minAgeDate) > 0) {
                    newErrors.dob = "You must be at least 13 years old to register";
                }
            } catch (e) {
                newErrors.dob = "Invalid date format";
            }
        }

        // Terms agreement validation
        if (!agreeToTerms) {
            newErrors.terms = "You must agree to the terms and conditions";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (validateForm()) {
            // Clear any previous errors
            setErrors({});

            try {
                // Call register from useUser hook
                await register(formData);

                // Show success toast
                addToast({
                    title: "Registration Successful",
                    description: "Your account has been created. Please sign in.",
                    color: "success"
                });

                // Redirect to login page
                navigate("/login");
            } catch (error) {
                // Error handling is done in the useEffect
                console.error("Registration error:", error);
            }
        }
    };

    return (
        <DefaultLayout>
            <div className="flex justify-center items-center py-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="flex flex-col gap-1 items-center">
                        <h1 className="text-2xl font-bold">Create an Account</h1>
                        <p className="text-default-500">Join the Beyond The Horizon community</p>
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
                                name="username"
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={handleInputChange}
                                isInvalid={!!errors.username}
                                errorMessage={errors.username}
                                isRequired
                                autoComplete="username"
                            />

                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleInputChange}
                                isInvalid={!!errors.email}
                                errorMessage={errors.email}
                                isRequired
                                autoComplete="email"
                            />

                            <DateInput
                                label="Date of Birth"
                                labelPlacement="outside"
                                description="Select your date of birth"
                                onChange={handleDateChange}
                                isInvalid={!!errors.dob}
                                errorMessage={errors.dob}
                                isRequired
                                maxValue={today(getLocalTimeZone())}
                            />

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleInputChange}
                                isInvalid={!!errors.password}
                                errorMessage={errors.password}
                                isRequired
                                autoComplete="new-password"
                            />

                            <Input
                                label="Confirm Password"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                isInvalid={!!errors.confirmPassword}
                                errorMessage={errors.confirmPassword}
                                isRequired
                                autoComplete="new-password"
                            />

                            <div className="mt-2">
                                <Checkbox
                                    isSelected={agreeToTerms}
                                    onValueChange={setAgreeToTerms}
                                    isInvalid={!!errors.terms}
                                >
                                    <span className="text-sm">
                                        I agree to the{" "}
                                        <Link href="/terms" className="text-primary">
                                            Terms of Service
                                        </Link>{" "}
                                        and{" "}
                                        <Link href="/privacy" className="text-primary">
                                            Privacy Policy
                                        </Link>
                                    </span>
                                </Checkbox>
                                {errors.terms && (
                                    <p className="text-danger text-xs mt-1">{errors.terms}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                color="primary"
                                isLoading={isRegistering}
                                spinner={<Spinner size="sm" color="current" />}
                                fullWidth
                                className="mt-2"
                            >
                                Create Account
                            </Button>
                        </form>
                    </CardBody>
                    <Divider />
                    <CardFooter className="flex justify-center">
                        <p className="text-default-500">
                            Already have an account?{" "}
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