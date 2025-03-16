import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Button,
    Spinner,
    Divider,
    Input,
    Textarea,
    Chip,
    Avatar,
    Switch,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Select,
    SelectItem,
} from "@heroui/react";
import {
    User,
    MapPin,
    Languages,
    Calendar,
    Heart,
    Upload,
    RefreshCw,
    Trash,
    AlertTriangle,
    Save,
    X,
    CheckCircle,
} from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useUser } from "../hooks/useUser";

// Days of the week for available days selection
const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

// Common languages for selection
const COMMON_LANGUAGES = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Arabic",
    "Russian",
    "Portuguese",
    "Hindi",
    "Bengali",
    "Urdu",
    "Other",
];

export default function Profile() {
    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for profile data
    const [bio, setBio] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const [newInterest, setNewInterest] = useState("");
    const [experience, setExperience] = useState<string[]>([]);
    const [newExperience, setNewExperience] = useState("");
    const [availableDays, setAvailableDays] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [privacy, setPrivacy] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState("");

    // State for avatar
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Modal states
    const {
        isOpen: isDeleteModalOpen,
        onOpen: onDeleteModalOpen,
        onClose: onDeleteModalClose
    } = useDisclosure();

    const {
        isOpen: isSuccessModalOpen,
        onOpen: onSuccessModalOpen,
        onClose: onSuccessModalClose
    } = useDisclosure();

    // Get user hooks
    const {
        currentUser,
        refetchUser,
        updateProfile,
        isUpdatingProfile,
        updateAvatar,
        isUpdatingAvatar,
        resetAvatar,
        isResettingAvatar,
        deleteAccount,
        isDeletingAccount,
    } = useUser();

    // Initialize form with current user data
    useEffect(() => {
        if (currentUser) {
            setBio(currentUser.bio || "");
            setInterests(currentUser.interests || []);
            setExperience(currentUser.experience || []);
            setAvailableDays(currentUser.available_days || []);
            setLanguages(currentUser.languages || []);
            setPrivacy(currentUser.privacy || false);
            setLocation(currentUser.location || null);
        }
    }, [currentUser]);

    // Handle getting location from IP
    const handleGetLocation = async () => {
        setIsLoadingLocation(true);
        setLocationError("");

        try {
            const response = await fetch("https://ipapi.co/json");
            const data = await response.json();

            if (data.error) {
                throw new Error(data.reason || "Failed to get location");
            }

            setLocation({
                latitude: parseFloat(data.latitude),
                longitude: parseFloat(data.longitude),
            });
        } catch (error) {
            console.error("Error fetching location:", error);
            setLocationError("Failed to get location. Please try again later.");
        } finally {
            setIsLoadingLocation(false);
        }
    };

    // Handle adding a new interest
    const handleAddInterest = () => {
        if (newInterest.trim() && !interests.includes(newInterest.trim())) {
            setInterests([...interests, newInterest.trim()]);
            setNewInterest("");
        }
    };

    // Handle removing an interest
    const handleRemoveInterest = (interest: string) => {
        setInterests(interests.filter(i => i !== interest));
    };

    // Handle adding a new experience
    const handleAddExperience = () => {
        if (newExperience.trim() && !experience.includes(newExperience.trim())) {
            setExperience([...experience, newExperience.trim()]);
            setNewExperience("");
        }
    };

    // Handle removing an experience
    const handleRemoveExperience = (exp: string) => {
        setExperience(experience.filter(e => e !== exp));
    };

    // Handle toggling available days
    const handleToggleDay = (day: string) => {
        if (availableDays.includes(day)) {
            setAvailableDays(availableDays.filter(d => d !== day));
        } else {
            setAvailableDays([...availableDays, day]);
        }
    };

    // Handle language selection
    const handleLanguageChange = (selection: any) => {
        // Convert the selection to a string array
        if (selection === "all") {
            setLanguages(COMMON_LANGUAGES);
        } else {
            setLanguages(Array.from(selection) as string[]);
        }
    };

    // Handle avatar file selection
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle avatar upload
    const handleUploadAvatar = async () => {
        if (!avatarFile) return;

        await updateAvatar(avatarFile, {
            onSuccess: () => {
                setAvatarFile(null);
                setAvatarPreview(null);
                refetchUser();
            },
        });
    };

    // Handle avatar reset
    const handleResetAvatar = async () => {
        await resetAvatar();
        setAvatarFile(null);
        setAvatarPreview(null);
        refetchUser();
    };

    // Handle profile update
    const handleUpdateProfile = async () => {
        await updateProfile({
            bio,
            interests,
            experience,
            available_days: availableDays,
            languages,
            privacy,
            location,
        });

        onSuccessModalOpen();
    };

    // Handle account deletion
    const handleDeleteAccount = async () => {
        await deleteAccount();
    };

    if (!currentUser) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center h-[70vh]">
                    <Spinner size="lg" color="primary" />
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <div className="py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">My Profile</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Avatar and Basic Info */}
                    <Card className="lg:col-span-1">
                        <CardHeader className="flex flex-col items-center">
                            <div className="relative group">
                                <Avatar
                                    src={avatarPreview || currentUser.avatar_url}
                                    name={(currentUser.username || "U").charAt(0).toUpperCase()}
                                    className="w-32 h-32 text-large"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        isIconOnly
                                        variant="flat"
                                        color="default"
                                        className="bg-white bg-opacity-80"
                                        onPress={() => fileInputRef.current?.click()}
                                    >
                                        <Upload size={20} />
                                    </Button>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                            <h2 className="text-xl font-semibold mt-4">{currentUser.username}</h2>
                            <p className="text-default-500">{currentUser.role}</p>

                            {avatarFile && (
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        color="primary"
                                        onPress={handleUploadAvatar}
                                        isLoading={isUpdatingAvatar}
                                    >
                                        Save Avatar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        onPress={() => {
                                            setAvatarFile(null);
                                            setAvatarPreview(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}

                            {!avatarFile && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="default"
                                    className="mt-4"
                                    onPress={handleResetAvatar}
                                    isLoading={isResettingAvatar}
                                >
                                    Reset to Default Avatar
                                </Button>
                            )}
                        </CardHeader>
                        <Divider />
                        <CardBody>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-default-500 mb-1">Username</p>
                                    <p className="font-medium">{currentUser.username}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-default-500 mb-1">Role</p>
                                    <Chip color={currentUser.role === "Admin" ? "danger" : currentUser.role === "Sponsor" ? "secondary" : "primary"} variant="flat">
                                        {currentUser.role}
                                    </Chip>
                                </div>

                                <div>
                                    <p className="text-sm text-default-500 mb-1">Privacy Setting</p>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            isSelected={privacy}
                                            onValueChange={setPrivacy}
                                        />
                                        <span>{privacy ? "Private Profile" : "Public Profile"}</span>
                                    </div>
                                    <p className="text-xs text-default-400 mt-1">
                                        {privacy
                                            ? "Only members of your groups can see your full profile"
                                            : "Anyone in the community can see your profile"}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                            <Button
                                color="danger"
                                variant="flat"
                                fullWidth
                                onPress={onDeleteModalOpen}
                            >
                                Delete Account
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Profile Details */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Profile Information</h2>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                            <div className="space-y-6">
                                {/* Bio */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <User size={18} />
                                        <h3 className="text-lg font-medium">Bio</h3>
                                    </div>
                                    <Textarea
                                        placeholder="Tell us about yourself..."
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        minRows={3}
                                    />
                                </div>

                                {/* Location */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin size={18} />
                                        <h3 className="text-lg font-medium">Location</h3>
                                    </div>

                                    {location ? (
                                        <div className="mb-2">
                                            <p>Latitude: {location.latitude}</p>
                                            <p>Longitude: {location.longitude}</p>
                                        </div>
                                    ) : (
                                        <p className="text-default-500 mb-2">No location set</p>
                                    )}

                                    <Button
                                        color="primary"
                                        variant="flat"
                                        startContent={<MapPin size={16} />}
                                        onPress={handleGetLocation}
                                        isLoading={isLoadingLocation}
                                    >
                                        Get Location from IP
                                    </Button>

                                    {locationError && (
                                        <p className="text-danger text-sm mt-2">{locationError}</p>
                                    )}
                                </div>

                                {/* Interests */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Heart size={18} />
                                        <h3 className="text-lg font-medium">Interests</h3>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {interests.map((interest, index) => (
                                            <Chip
                                                key={index}
                                                onClose={() => handleRemoveInterest(interest)}
                                                variant="flat"
                                                color="primary"
                                            >
                                                {interest}
                                            </Chip>
                                        ))}

                                        {interests.length === 0 && (
                                            <p className="text-default-500">No interests added</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add an interest..."
                                            value={newInterest}
                                            onChange={(e) => setNewInterest(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            color="primary"
                                            isDisabled={!newInterest.trim()}
                                            onPress={handleAddInterest}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>

                                {/* Experience */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <User size={18} />
                                        <h3 className="text-lg font-medium">Experience</h3>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {experience.map((exp, index) => (
                                            <Chip
                                                key={index}
                                                onClose={() => handleRemoveExperience(exp)}
                                                variant="flat"
                                                color="secondary"
                                            >
                                                {exp}
                                            </Chip>
                                        ))}

                                        {experience.length === 0 && (
                                            <p className="text-default-500">No experience added</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add experience..."
                                            value={newExperience}
                                            onChange={(e) => setNewExperience(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button
                                            color="secondary"
                                            isDisabled={!newExperience.trim()}
                                            onPress={handleAddExperience}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>

                                {/* Available Days */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar size={18} />
                                        <h3 className="text-lg font-medium">Available Days</h3>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {DAYS_OF_WEEK.map((day) => (
                                            <Chip
                                                key={day}
                                                variant={availableDays.includes(day) ? "solid" : "flat"}
                                                color={availableDays.includes(day) ? "primary" : "default"}
                                                onClick={() => handleToggleDay(day)}
                                                className="cursor-pointer"
                                            >
                                                {day}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>

                                {/* Languages */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Languages size={18} />
                                        <h3 className="text-lg font-medium">Languages</h3>
                                    </div>

                                    <Select
                                        label="Select languages you speak"
                                        selectionMode="multiple"
                                        placeholder="Select languages"
                                        selectedKeys={new Set(languages)}
                                        className="max-w-xs"
                                        onSelectionChange={handleLanguageChange}
                                    >
                                        {COMMON_LANGUAGES.map((language) => (
                                            <SelectItem key={language}>
                                                {language}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                            <Button
                                color="primary"
                                fullWidth
                                startContent={<Save size={18} />}
                                onPress={handleUpdateProfile}
                                isLoading={isUpdatingProfile}
                            >
                                Save Profile
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Delete Account Confirmation Modal */}
                <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-danger">
                                <AlertTriangle />
                                Delete Account
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <p>
                                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                            </p>
                            <div className="bg-danger-50 p-3 rounded-md mt-2">
                                <p className="text-danger font-medium">Warning:</p>
                                <ul className="list-disc pl-5 text-sm text-danger-600">
                                    <li>Your profile information will be deleted</li>
                                    <li>Your posts and comments will be removed</li>
                                    <li>You will be removed from all support groups</li>
                                    <li>You will lose access to all conversations</li>
                                </ul>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="default" variant="flat" onPress={onDeleteModalClose}>
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onPress={handleDeleteAccount}
                                isLoading={isDeletingAccount}
                            >
                                Delete My Account
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Success Modal */}
                <Modal isOpen={isSuccessModalOpen} onClose={onSuccessModalClose}>
                    <ModalContent>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-success">
                                <CheckCircle />
                                Profile Updated
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <p>
                                Your profile has been successfully updated.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="success" onPress={onSuccessModalClose}>
                                OK
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </DefaultLayout>
    );
} 