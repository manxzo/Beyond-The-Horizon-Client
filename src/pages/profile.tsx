import React, { useState, useRef, ChangeEvent } from 'react';
import { useUser } from '../hooks/useUser';
import {
    Button,
    Card,
    CardBody,
    CardFooter,
    Input,
    Textarea,
    Avatar,
    Chip,
    Switch,
    Divider,
    Spinner,
    Alert,
    addToast
} from "@heroui/react";
import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import {
    SunFilledIcon,
    MoonFilledIcon,
    HeartFilledIcon,
    GithubIcon,
    TwitterIcon,
    DiscordIcon
} from "@/components/icons";

const Profile = () => {
    const {
        currentUser,
        isLoadingUser,
        isAuthenticated,
        updateProfile,
        isUpdatingProfile,
        updateProfileError,
        updateAvatar,
        isUpdatingAvatar,
        updateAvatarError,
        resetAvatar,
        isResettingAvatar,
        deleteAccount,
        isDeletingAccount,
    } = useUser();

    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({
        bio: currentUser?.bio || '',
        location: currentUser?.location || '',
        interests: currentUser?.interests || [],
        experience: currentUser?.experience || [],
        available_days: currentUser?.available_days || [],
        languages: currentUser?.languages || [],
        privacy: currentUser?.privacy || false,
    });

    const [newInterest, setNewInterest] = useState('');
    const [newExperience, setNewExperience] = useState('');
    const [newLanguage, setNewLanguage] = useState('');
    const [newAvailableDay, setNewAvailableDay] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (isLoadingUser) {
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center min-h-[80vh]">
                    <Spinner size="lg" />
                </div>
            </DefaultLayout>
        );
    }

    if (!isAuthenticated || !currentUser) {
        return (
            <DefaultLayout>
                <div className="container mx-auto px-4 py-8">
                    <h2 className={title({ color: "violet" })}>Please log in to view your profile</h2>
                </div>
            </DefaultLayout>
        );
    }

    const handleEditToggle = () => {
        if (editMode) {
            // Discard changes when canceling edit mode
            setProfileData({
                bio: currentUser.bio || '',
                location: currentUser.location || '',
                interests: currentUser.interests || [],
                experience: currentUser.experience || [],
                available_days: currentUser.available_days || [],
                languages: currentUser.languages || [],
                privacy: currentUser.privacy || false,
            });
        }
        setEditMode(!editMode);
        setUpdateSuccess(false);
    };

    const handleSaveProfile = () => {
        updateProfile(profileData, {
            onSuccess: () => {
                setEditMode(false);
                setUpdateSuccess(true);
                setTimeout(() => setUpdateSuccess(false), 3000);
            }
        });
    };

    const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            addToast({
                description: "File too large. Maximum size is 5MB.",
                color: "danger",
                size: "lg"
            });
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            addToast({
                description: "Only image files are allowed.",
                color: "danger",
                size: "lg"
            });
            return;
        }

        // Show upload starting toast
        addToast({
            description: "Uploading avatar...",
            color: "primary",
            size: "lg"
        });

        // Upload the file
        updateAvatar(file, {
            onSuccess: () => {
                addToast({
                    description: "Avatar updated successfully!",
                    color: "success",
                    size: "lg"
                });
            },
            onError: (error) => {
                console.error("Avatar upload error:", error);
                addToast({
                    description: `Error uploading avatar: ${error.message || "Unknown error"}`,
                    color: "danger",
                    size: "lg"
                });
            }
        });
    };

    const handleResetAvatar = () => {
        resetAvatar();
    };

    const handleDeleteAccount = () => {
        if (deleteConfirmation) {
            deleteAccount();
        } else {
            setDeleteConfirmation(true);
            setTimeout(() => setDeleteConfirmation(false), 5000);
        }
    };

    const handleAddItem = (field: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        if (value.trim()) {
            setProfileData(prev => ({
                ...prev,
                [field]: [...prev[field as keyof typeof prev] as string[], value.trim()]
            }));
            setter('');
        }
    };

    const handleRemoveItem = (field: string, index: number) => {
        setProfileData(prev => ({
            ...prev,
            [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
        }));
    };

    const avatarUrl = currentUser.avatar_url || 'https://via.placeholder.com/150';

    return (
        <DefaultLayout>
            <section className="flex flex-col items-center justify-center py-8 px-4">
                <div className="w-full max-w-4xl">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className={title({ color: "violet" })}>My Profile</h1>
                        <Button
                            color={editMode ? "danger" : "primary"}
                            variant={editMode ? "flat" : "solid"}
                            onPress={handleEditToggle}
                            startContent={editMode ? <DiscordIcon /> : <GithubIcon />}
                        >
                            {editMode ? "Cancel" : "Edit Profile"}
                        </Button>
                    </div>

                    {updateSuccess && (
                        <Alert className="mb-4" color="success">
                            Profile updated successfully!
                        </Alert>
                    )}

                    {updateProfileError && (
                        <Alert className="mb-4" color="danger">
                            Error updating profile: {updateProfileError.message}
                        </Alert>
                    )}

                    <Card className="mb-6">
                        <CardBody>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Avatar Section */}
                                <div className="flex flex-col items-center">
                                    <Avatar
                                        src={avatarUrl}
                                        alt={currentUser.username}
                                        className="w-32 h-32 mb-4"
                                        isBordered
                                        color="primary"
                                    />

                                    {editMode && (
                                        <div className="flex flex-col gap-2 w-full">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={fileInputRef}
                                                onChange={handleAvatarUpload}
                                            />
                                            <Button
                                                variant="bordered"
                                                color="primary"
                                                onPress={() => fileInputRef.current?.click()}
                                                isLoading={isUpdatingAvatar}
                                                fullWidth
                                                startContent={<TwitterIcon />}
                                            >
                                                {isUpdatingAvatar ? 'Uploading...' : 'Change Avatar'}
                                            </Button>
                                            <Button
                                                variant="flat"
                                                color="warning"
                                                onPress={handleResetAvatar}
                                                isLoading={isResettingAvatar}
                                                fullWidth
                                                startContent={<SunFilledIcon />}
                                            >
                                                Reset Avatar
                                            </Button>
                                        </div>
                                    )}

                                    {updateAvatarError && (
                                        <p className="text-danger text-sm mt-2">
                                            Error updating avatar: {updateAvatarError.message}
                                        </p>
                                    )}

                                    <h2 className="text-xl font-semibold mt-4">
                                        {currentUser.username}
                                    </h2>
                                    <p className="text-default-500 text-sm">
                                        {currentUser.email}
                                    </p>
                                </div>

                                {/* Profile Details Section */}
                                <div className="col-span-2">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-2">Bio</h3>
                                        {editMode ? (
                                            <Textarea
                                                fullWidth
                                                rows={4}
                                                value={profileData.bio}
                                                onValueChange={(value) => setProfileData({ ...profileData, bio: value })}
                                                placeholder="Tell us about yourself..."
                                            />
                                        ) : (
                                            <p className="text-default-700">
                                                {currentUser.bio || "No bio provided yet."}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-2">Location</h3>
                                        {editMode ? (
                                            <Input
                                                fullWidth
                                                value={profileData.location}
                                                onValueChange={(value) => setProfileData({ ...profileData, location: value })}
                                                placeholder="Your location"
                                            />
                                        ) : (
                                            <p className="text-default-700">
                                                {currentUser.location || "No location provided."}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-2">Interests</h3>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(editMode ? profileData.interests : currentUser.interests || []).map((interest: string, index: number) => (
                                                <Chip
                                                    key={index}
                                                    onClose={editMode ? () => handleRemoveItem('interests', index) : undefined}
                                                    variant="flat"
                                                    color="primary"
                                                >
                                                    {interest}
                                                </Chip>
                                            ))}
                                            {(!editMode && (!currentUser.interests || currentUser.interests.length === 0)) && (
                                                <p className="text-default-500 text-sm">No interests added yet.</p>
                                            )}
                                        </div>
                                        {editMode && (
                                            <div className="flex gap-2">
                                                <Input
                                                    size="sm"
                                                    value={newInterest}
                                                    onValueChange={setNewInterest}
                                                    placeholder="Add interest"
                                                    className="flex-grow"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => handleAddItem('interests', newInterest, setNewInterest)}
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-2">Experience</h3>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(editMode ? profileData.experience : currentUser.experience || []).map((exp: string, index: number) => (
                                                <Chip
                                                    key={index}
                                                    onClose={editMode ? () => handleRemoveItem('experience', index) : undefined}
                                                    variant="flat"
                                                    color="secondary"
                                                >
                                                    {exp}
                                                </Chip>
                                            ))}
                                            {(!editMode && (!currentUser.experience || currentUser.experience.length === 0)) && (
                                                <p className="text-default-500 text-sm">No experience added yet.</p>
                                            )}
                                        </div>
                                        {editMode && (
                                            <div className="flex gap-2">
                                                <Input
                                                    size="sm"
                                                    value={newExperience}
                                                    onValueChange={setNewExperience}
                                                    placeholder="Add experience"
                                                    className="flex-grow"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => handleAddItem('experience', newExperience, setNewExperience)}
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-2">Languages</h3>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(editMode ? profileData.languages : currentUser.languages || []).map((language: string, index: number) => (
                                                <Chip
                                                    key={index}
                                                    onClose={editMode ? () => handleRemoveItem('languages', index) : undefined}
                                                    variant="flat"
                                                    color="success"
                                                >
                                                    {language}
                                                </Chip>
                                            ))}
                                            {(!editMode && (!currentUser.languages || currentUser.languages.length === 0)) && (
                                                <p className="text-default-500 text-sm">No languages added yet.</p>
                                            )}
                                        </div>
                                        {editMode && (
                                            <div className="flex gap-2">
                                                <Input
                                                    size="sm"
                                                    value={newLanguage}
                                                    onValueChange={setNewLanguage}
                                                    placeholder="Add language"
                                                    className="flex-grow"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => handleAddItem('languages', newLanguage, setNewLanguage)}
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-2">Available Days</h3>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(editMode ? profileData.available_days : currentUser.available_days || []).map((day: string, index: number) => (
                                                <Chip
                                                    key={index}
                                                    onClose={editMode ? () => handleRemoveItem('available_days', index) : undefined}
                                                    variant="flat"
                                                    color="warning"
                                                >
                                                    {day}
                                                </Chip>
                                            ))}
                                            {(!editMode && (!currentUser.available_days || currentUser.available_days.length === 0)) && (
                                                <p className="text-default-500 text-sm">No available days added yet.</p>
                                            )}
                                        </div>
                                        {editMode && (
                                            <div className="flex gap-2">
                                                <Input
                                                    size="sm"
                                                    value={newAvailableDay}
                                                    onValueChange={setNewAvailableDay}
                                                    placeholder="Add available day"
                                                    className="flex-grow"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => handleAddItem('available_days', newAvailableDay, setNewAvailableDay)}
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center">
                                            <Switch
                                                isSelected={editMode ? profileData.privacy : currentUser.privacy}
                                                onValueChange={(value) => editMode && setProfileData({ ...profileData, privacy: value })}
                                                isDisabled={!editMode}
                                            />
                                            <span className="ml-2">Private Profile</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {editMode && (
                                <div className="flex justify-end mt-6">
                                    <Button
                                        color="primary"
                                        startContent={<HeartFilledIcon />}
                                        onPress={handleSaveProfile}
                                        isLoading={isUpdatingProfile}
                                    >
                                        {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="bg-danger-50 dark:bg-danger-900/20">
                        <CardBody>
                            <h3 className="text-danger text-lg font-semibold mb-2">
                                Danger Zone
                            </h3>
                            <Divider className="my-4" />
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium">Delete Account</h4>
                                    <p className="text-default-500 text-sm">
                                        This action cannot be undone. All your data will be permanently removed.
                                    </p>
                                </div>
                                <Button
                                    color="danger"
                                    variant={deleteConfirmation ? "solid" : "flat"}
                                    onPress={handleDeleteAccount}
                                    isLoading={isDeletingAccount}
                                    startContent={<MoonFilledIcon />}
                                >
                                    {deleteConfirmation ? 'Confirm Delete' : 'Delete Account'}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </section>
        </DefaultLayout>
    );
};

export default Profile;
