import React, { useState } from "react";
import { useUser } from "../hooks/useUser";
import { useNavigate } from "react-router-dom";
import { Container } from "../components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Spinner } from "../components/ui/spinner";

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register, isLoading, error } = useUser();
    const [activeTab, setActiveTab] = useState<"member" | "sponsor">("member");

    // Member registration form state
    const [memberForm, setMemberForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        agreeToTerms: false
    });

    // Sponsor registration form state
    const [sponsorForm, setSponsorForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        organization: "",
        position: "",
        experience: "",
        motivation: "",
        agreeToTerms: false
    });

    // Form validation state
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const validateMemberForm = () => {
        const errors: Record<string, string> = {};

        if (!memberForm.username.trim()) errors.username = "Username is required";
        if (!memberForm.email.trim()) errors.email = "Email is required";
        if (!/\S+@\S+\.\S+/.test(memberForm.email)) errors.email = "Email is invalid";
        if (!memberForm.password) errors.password = "Password is required";
        if (memberForm.password.length < 8) errors.password = "Password must be at least 8 characters";
        if (memberForm.password !== memberForm.confirmPassword) errors.confirmPassword = "Passwords do not match";
        if (!memberForm.firstName.trim()) errors.firstName = "First name is required";
        if (!memberForm.lastName.trim()) errors.lastName = "Last name is required";
        if (!memberForm.agreeToTerms) errors.agreeToTerms = "You must agree to the terms and conditions";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateSponsorForm = () => {
        const errors: Record<string, string> = {};

        if (!sponsorForm.username.trim()) errors.username = "Username is required";
        if (!sponsorForm.email.trim()) errors.email = "Email is required";
        if (!/\S+@\S+\.\S+/.test(sponsorForm.email)) errors.email = "Email is invalid";
        if (!sponsorForm.password) errors.password = "Password is required";
        if (sponsorForm.password.length < 8) errors.password = "Password must be at least 8 characters";
        if (sponsorForm.password !== sponsorForm.confirmPassword) errors.confirmPassword = "Passwords do not match";
        if (!sponsorForm.firstName.trim()) errors.firstName = "First name is required";
        if (!sponsorForm.lastName.trim()) errors.lastName = "Last name is required";
        if (!sponsorForm.organization.trim()) errors.organization = "Organization is required";
        if (!sponsorForm.position.trim()) errors.position = "Position is required";
        if (!sponsorForm.experience.trim()) errors.experience = "Experience is required";
        if (!sponsorForm.motivation.trim()) errors.motivation = "Motivation is required";
        if (!sponsorForm.agreeToTerms) errors.agreeToTerms = "You must agree to the terms and conditions";

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleMemberSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateMemberForm()) return;

        try {
            await register({
                ...memberForm,
                role: "member"
            });
            navigate("/home");
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };

    const handleSponsorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateSponsorForm()) return;

        try {
            await register({
                ...sponsorForm,
                role: "sponsor"
            });
            navigate("/home");
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };

    const handleMemberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setMemberForm({
            ...memberForm,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleSponsorInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setSponsorForm({
            ...sponsorForm,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        });
    };

    return (
        <Container className="py-10 max-w-md mx-auto">
            <Card className="w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create an Account</CardTitle>
                    <CardDescription>
                        Join Beyond The Horizon and connect with a supportive community
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs
                        defaultValue="member"
                        onValueChange={(value) => setActiveTab(value as "member" | "sponsor")}
                        className="w-full"
                    >
                        <TabsList className="grid grid-cols-2 mb-6">
                            <TabsTrigger value="member">Join as Member</TabsTrigger>
                            <TabsTrigger value="sponsor">Join as Sponsor</TabsTrigger>
                        </TabsList>

                        <TabsContent value="member">
                            <form onSubmit={handleMemberSubmit}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="member-firstName">First Name</Label>
                                            <Input
                                                id="member-firstName"
                                                name="firstName"
                                                value={memberForm.firstName}
                                                onChange={handleMemberInputChange}
                                            />
                                            {formErrors.firstName && (
                                                <p className="text-sm text-destructive">{formErrors.firstName}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="member-lastName">Last Name</Label>
                                            <Input
                                                id="member-lastName"
                                                name="lastName"
                                                value={memberForm.lastName}
                                                onChange={handleMemberInputChange}
                                            />
                                            {formErrors.lastName && (
                                                <p className="text-sm text-destructive">{formErrors.lastName}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="member-username">Username</Label>
                                        <Input
                                            id="member-username"
                                            name="username"
                                            value={memberForm.username}
                                            onChange={handleMemberInputChange}
                                        />
                                        {formErrors.username && (
                                            <p className="text-sm text-destructive">{formErrors.username}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="member-email">Email</Label>
                                        <Input
                                            id="member-email"
                                            name="email"
                                            type="email"
                                            value={memberForm.email}
                                            onChange={handleMemberInputChange}
                                        />
                                        {formErrors.email && (
                                            <p className="text-sm text-destructive">{formErrors.email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="member-password">Password</Label>
                                        <Input
                                            id="member-password"
                                            name="password"
                                            type="password"
                                            value={memberForm.password}
                                            onChange={handleMemberInputChange}
                                        />
                                        {formErrors.password && (
                                            <p className="text-sm text-destructive">{formErrors.password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="member-confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="member-confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            value={memberForm.confirmPassword}
                                            onChange={handleMemberInputChange}
                                        />
                                        {formErrors.confirmPassword && (
                                            <p className="text-sm text-destructive">{formErrors.confirmPassword}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="member-terms"
                                            name="agreeToTerms"
                                            checked={memberForm.agreeToTerms}
                                            onCheckedChange={(checked) =>
                                                setMemberForm({ ...memberForm, agreeToTerms: checked as boolean })
                                            }
                                        />
                                        <label
                                            htmlFor="member-terms"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            I agree to the{" "}
                                            <a href="/terms" className="text-primary hover:underline">
                                                terms and conditions
                                            </a>
                                        </label>
                                    </div>
                                    {formErrors.agreeToTerms && (
                                        <p className="text-sm text-destructive">{formErrors.agreeToTerms}</p>
                                    )}

                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? <Spinner className="mr-2" size="sm" /> : null}
                                        Register as Member
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="sponsor">
                            <form onSubmit={handleSponsorSubmit}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sponsor-firstName">First Name</Label>
                                            <Input
                                                id="sponsor-firstName"
                                                name="firstName"
                                                value={sponsorForm.firstName}
                                                onChange={handleSponsorInputChange}
                                            />
                                            {formErrors.firstName && (
                                                <p className="text-sm text-destructive">{formErrors.firstName}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sponsor-lastName">Last Name</Label>
                                            <Input
                                                id="sponsor-lastName"
                                                name="lastName"
                                                value={sponsorForm.lastName}
                                                onChange={handleSponsorInputChange}
                                            />
                                            {formErrors.lastName && (
                                                <p className="text-sm text-destructive">{formErrors.lastName}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sponsor-username">Username</Label>
                                        <Input
                                            id="sponsor-username"
                                            name="username"
                                            value={sponsorForm.username}
                                            onChange={handleSponsorInputChange}
                                        />
                                        {formErrors.username && (
                                            <p className="text-sm text-destructive">{formErrors.username}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sponsor-email">Email</Label>
                                        <Input
                                            id="sponsor-email"
                                            name="email"
                                            type="email"
                                            value={sponsorForm.email}
                                            onChange={handleSponsorInputChange}
                                        />
                                        {formErrors.email && (
                                            <p className="text-sm text-destructive">{formErrors.email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sponsor-password">Password</Label>
                                        <Input
                                            id="sponsor-password"
                                            name="password"
                                            type="password"
                                            value={sponsorForm.password}
                                            onChange={handleSponsorInputChange}
                                        />
                                        {formErrors.password && (
                                            <p className="text-sm text-destructive">{formErrors.password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sponsor-confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="sponsor-confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            value={sponsorForm.confirmPassword}
                                            onChange={handleSponsorInputChange}
                                        />
                                        {formErrors.confirmPassword && (
                                            <p className="text-sm text-destructive">{formErrors.confirmPassword}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sponsor-organization">Organization</Label>
                                        <Input
                                            id="sponsor-organization"
                                            name="organization"
                                            value={sponsorForm.organization}
                                            onChange={handleSponsorInputChange}
                                        />
                                        {formErrors.organization && (
                                            <p className="text-sm text-destructive">{formErrors.organization}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sponsor-position">Position</Label>
                                        <Input
                                            id="sponsor-position"
                                            name="position"
                                            value={sponsorForm.position}
                                            onChange={handleSponsorInputChange}
                                        />
                                        {formErrors.position && (
                                            <p className="text-sm text-destructive">{formErrors.position}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sponsor-experience">Experience</Label>
                                        <Input
                                            id="sponsor-experience"
                                            name="experience"
                                            value={sponsorForm.experience}
                                            onChange={handleSponsorInputChange}
                                        />
                                        {formErrors.experience && (
                                            <p className="text-sm text-destructive">{formErrors.experience}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sponsor-motivation">Why do you want to be a sponsor?</Label>
                                        <Input
                                            id="sponsor-motivation"
                                            name="motivation"
                                            value={sponsorForm.motivation}
                                            onChange={handleSponsorInputChange}
                                        />
                                        {formErrors.motivation && (
                                            <p className="text-sm text-destructive">{formErrors.motivation}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="sponsor-terms"
                                            name="agreeToTerms"
                                            checked={sponsorForm.agreeToTerms}
                                            onCheckedChange={(checked) =>
                                                setSponsorForm({ ...sponsorForm, agreeToTerms: checked as boolean })
                                            }
                                        />
                                        <label
                                            htmlFor="sponsor-terms"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            I agree to the{" "}
                                            <a href="/terms" className="text-primary hover:underline">
                                                terms and conditions
                                            </a>
                                        </label>
                                    </div>
                                    {formErrors.agreeToTerms && (
                                        <p className="text-sm text-destructive">{formErrors.agreeToTerms}</p>
                                    )}

                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? <Spinner className="mr-2" size="sm" /> : null}
                                        Apply as Sponsor
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex flex-col items-center justify-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <a href="/login" className="text-primary hover:underline">
                            Log in
                        </a>
                    </div>
                </CardFooter>
            </Card>
        </Container>
    );
};

export default Register; 