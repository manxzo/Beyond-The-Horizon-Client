import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Spinner,
  Divider,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  Users,
  Calendar,
  MessageSquare,
  BookOpen,
  Clock,
  UserPlus,
} from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useSupportGroup } from "../hooks/useSupportGroup";
import { useMeeting } from "../hooks/useMeeting";
import { useUser } from "../hooks/useUser";

export default function Feed() {
  const navigate = useNavigate();
  
  // Get support group hooks
  const { getMyGroups } = useSupportGroup();

  // Get user hooks
  const { currentUser } = useUser();

  // Fetch my support groups
  const {
    data: myGroupsResponse,
    isLoading: isLoadingMyGroups,
    error: myGroupsError,
  } = useQuery(getMyGroups());

  // Extract the actual data from the response
  const myGroups = myGroupsResponse?.data || [];

  // Handle navigating to a support group's dashboard
  const handleViewGroup = (groupId: string) => {
    navigate(`/support-groups/${groupId}`);
  };

  // Handle navigating to the support groups page
  const handleViewAllGroups = () => {
    navigate('/support-groups');
  };

  if (isLoadingMyGroups) {
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
          <h1 className="text-3xl font-bold">Your Feed</h1>
          <div className="flex gap-2">
            <Button 
              color="primary" 
              variant="flat"
              startContent={<Users size={18} />}
              onPress={handleViewAllGroups}
            >
              View All Support Groups
            </Button>
          </div>
        </div>

        <Tabs aria-label="Feed Tabs">
          <Tab key="overview" title={
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span>Overview</span>
            </div>
          }>
            <div className="mt-6">
              <h2 className="text-2xl font-semibold mb-4">Welcome, {currentUser?.username || 'User'}!</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="bg-primary/5">
                  <CardBody className="flex flex-col items-center text-center p-6">
                    <Users size={48} className="mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">Support Groups</h3>
                    <p className="text-default-500 mb-4">
                      Connect with others in support groups to share experiences and find community.
                    </p>
                    <Button 
                      color="primary" 
                      onPress={handleViewAllGroups}
                      className="mt-auto"
                    >
                      Browse Groups
                    </Button>
                  </CardBody>
                </Card>

                <Card className="bg-success/5">
                  <CardBody className="flex flex-col items-center text-center p-6">
                    <Calendar size={48} className="mb-4 text-success" />
                    <h3 className="text-xl font-semibold mb-2">Meetings</h3>
                    <p className="text-default-500 mb-4">
                      Participate in scheduled meetings with group members and sponsors.
                    </p>
                    <Button 
                      color="success" 
                      onPress={handleViewAllGroups}
                      className="mt-auto"
                    >
                      View Meetings
                    </Button>
                  </CardBody>
                </Card>

                <Card className="bg-secondary/5">
                  <CardBody className="flex flex-col items-center text-center p-6">
                    <MessageSquare size={48} className="mb-4 text-secondary" />
                    <h3 className="text-xl font-semibold mb-2">Group Chats</h3>
                    <p className="text-default-500 mb-4">
                      Communicate with other members through group chats and meeting discussions.
                    </p>
                    <Button 
                      color="secondary" 
                      onPress={handleViewAllGroups}
                      className="mt-auto"
                    >
                      Join Conversations
                    </Button>
                  </CardBody>
                </Card>
              </div>

              {myGroups && myGroups.length > 0 ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Users size={20} />
                    Your Support Groups
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myGroups.slice(0, 3).map((group: any) => (
                      <Card 
                        key={group.support_group_id} 
                        isPressable
                        onPress={() => handleViewGroup(group.support_group_id)}
                        className="border border-default-200 hover:border-primary transition-all"
                      >
                        <CardHeader className="flex gap-3">
                          <div className="flex flex-col">
                            <p className="text-lg font-semibold">{group.title}</p>
                            <p className="text-small text-default-500">
                              Joined on {new Date(group.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                          <p className="line-clamp-2">{group.description}</p>
                        </CardBody>
                        <Divider />
                        <CardFooter>
                          <Button 
                            color="primary" 
                            variant="flat"
                            fullWidth
                            onPress={() => handleViewGroup(group.support_group_id)}
                          >
                            View Group
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                    {myGroups.length > 3 && (
                      <Card className="flex items-center justify-center p-6 border border-dashed border-default-300">
                        <Button 
                          variant="light" 
                          onPress={handleViewAllGroups}
                          startContent={<Users size={18} />}
                        >
                          View All {myGroups.length} Groups
                        </Button>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <CardBody className="flex flex-col items-center">
                    <Users size={48} className="text-default-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">You haven&apos;t joined any support groups yet</h3>
                    <p className="text-default-500 mb-6">Join a group to connect with others and participate in discussions</p>
                    <Button color="primary" onPress={handleViewAllGroups}>
                      Browse Available Groups
                    </Button>
                  </CardBody>
                </Card>
              )}
            </div>
          </Tab>

          <Tab key="upcoming" title={
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>Upcoming</span>
            </div>
          }>
            <div className="mt-6 flex flex-col items-center justify-center py-12">
              <Calendar size={48} className="text-default-400 mb-4" />
              <p className="text-xl font-medium mb-2">Coming Soon</p>
              <p className="text-default-500 mb-6">
                This feature is under development. Check back later for upcoming events and meetings.
              </p>
              <Button color="primary" onPress={handleViewAllGroups}>
                Browse Support Groups
              </Button>
            </div>
          </Tab>

          <Tab key="resources" title={
            <div className="flex items-center gap-2">
              <BookOpen size={18} />
              <span>Resources</span>
            </div>
          }>
            <div className="mt-6 flex flex-col items-center justify-center py-12">
              <BookOpen size={48} className="text-default-400 mb-4" />
              <p className="text-xl font-medium mb-2">Resources Coming Soon</p>
              <p className="text-default-500 mb-6">
                This feature is under development. Check back later for helpful resources.
              </p>
              <Button color="primary" onPress={handleViewAllGroups}>
                Browse Support Groups
              </Button>
            </div>
          </Tab>
        </Tabs>
      </div>
    </DefaultLayout>
  );
} 