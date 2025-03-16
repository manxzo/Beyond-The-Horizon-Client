import { Avatar, Card, CardBody, Chip } from "@heroui/react";
import { useUser } from "../hooks/useUser";

interface MemberCardProps {
    userId: string;
    joinedAt: string;
}

export default function MemberCard({ userId, joinedAt }: MemberCardProps) {
    const { useGetUserById } = useUser();
    const { data: userDataResponse, isLoading } = useGetUserById(userId);
    const userData = userDataResponse;

    // Show a loading state instead of returning null
    if (isLoading) {
        return (
            <Card>
                <CardBody className="flex items-center gap-4">
                    <Avatar
                        name="?"
                        size="lg"
                    />
                    <div>
                        <p className="font-semibold">Loading...</p>
                        <p className="text-small text-default-500">
                            Joined {new Date(joinedAt).toLocaleDateString()}
                        </p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardBody className="flex items-center gap-4">
                <Avatar
                    src={userData.avatar_url}
                    name={(userData.username || "U").charAt(0).toUpperCase()}
                    size="lg"
                />
                <div>
                    <p className="font-semibold">{userData.username}</p>
                    <p className="text-small text-default-500">
                        Joined {new Date(joinedAt).toLocaleDateString()}
                    </p>
                    {userData.role === "sponsor" && (
                        <Chip color="secondary" variant="flat" size="sm">Sponsor</Chip>
                    )}{userData.role === "member" && (
                        <Chip color="primary" variant="flat" size="sm">Member</Chip>
                    )}
                    {userData.role === "admin" && (
                        <Chip color="danger" variant="flat" size="sm">Admin</Chip>
                    )}
                </div>
            </CardBody>
        </Card>
    );
} 