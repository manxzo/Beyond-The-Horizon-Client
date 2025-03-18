import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Spinner,
  Button,
  User,
  Badge
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Calendar, MapPin, Languages, Briefcase } from "lucide-react";
import SponsorNav from "@/components/SponsorNav";
import DefaultLayout from "@/layouts/default";
import { useSponsorDashboard } from "@/hooks/useSponsorDashboard";
import { useNavigate } from "react-router-dom";

export default function SponsorMentees() {
  const { getMyMentees } = useSponsorDashboard();
  const navigate = useNavigate();

  // Get my mentees
  const { 
    data: myMentees, 
    isLoading, 
    error 
  } = useQuery(getMyMentees());

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const handleMessage = (menteeUsername: string) => {
    navigate(`/messages/conversation/${menteeUsername}`);
  };

  if (isLoading) {
    return (
      <DefaultLayout>
        <SponsorNav />
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" color="primary" />
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <SponsorNav />
        <div className="bg-danger-50 text-danger p-4 rounded-lg">
          Error loading mentees. Please try again later.
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <SponsorNav />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Mentees</h1>
          <p className="text-default-500">View and interact with your current mentees</p>
        </div>

        <Divider />

        {myMentees && myMentees.length === 0 ? (
          <div className="text-center p-8 bg-content1 rounded-lg">
            <p className="text-xl">No active mentees</p>
            <p className="text-default-500 mt-2">When you accept mentee requests, they will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myMentees?.map((mentee: any) => (
              <Card key={mentee.matching_request_id} className="shadow-sm">
                <CardHeader className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <User
                      name={mentee.username}
                      avatarProps={{
                        src: mentee.avatar_url,
                        size: "md"
                      }}
                    />
                    <div>
                      <h3 className="text-xl font-medium">{mentee.username}</h3>
                      <Badge color="success" variant="flat">Active Mentee</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-default-500" size={16} />
                      <span>Location: {mentee.location || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-default-500" size={16} />
                      <span>Available: {mentee.available_days?.join(", ") || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Languages className="text-default-500" size={16} />
                      <span>Languages: {mentee.languages?.join(", ") || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="text-default-500" size={16} />
                      <span>Experience: {mentee.experience?.join(", ") || "Not specified"}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-default-500">
                    <p>Mentoring since: {formatDate(mentee.created_at)}</p>
                  </div>
                </CardBody>
                <Divider />
                <CardFooter className="flex justify-end">
                  <Button
                    color="primary"
                    startContent={<MessageSquare size={16} />}
                    onPress={() => handleMessage(mentee.username)}
                  >
                    Message
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DefaultLayout>
  );
} 