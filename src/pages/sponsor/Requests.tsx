import { useState } from "react";
import {
  Card,
  CardFooter,
  CardHeader,
  Divider,
  Spinner,
  Button,
  Textarea,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  User,
  Chip
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, MessageSquare, Calendar, MapPin, Languages, Briefcase } from "lucide-react";
import SponsorNav from "@/components/SponsorNav";
import DefaultLayout from "@/layouts/default";
import { useSponsorDashboard } from "@/hooks/useSponsorDashboard";
import { useMessage } from "@/hooks/useMessage";

export default function SponsorRequests() {
  const { getMenteeRequests, respondToMenteeRequest, isRespondingToMenteeRequest } = useSponsorDashboard();
  const { useSendMessage } = useMessage();
  const { mutate: sendMessage } = useSendMessage();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [message, setMessage] = useState("");

  // Get mentee requests
  const {
    data: menteeRequests,
    isLoading,
    error,
    refetch
  } = useQuery(getMenteeRequests());

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    onOpen();
  };

  const handleAccept = async (matchingRequestId: string) => {
    try {
      await respondToMenteeRequest({
        matchingRequestId,
        accept: true
      });

      // If there's a message, start a conversation with the mentee
      if (message.trim()) {
        sendMessage({
          receiverUsername: selectedRequest.username,
          content: message
        });
      }

      setMessage("");
      onClose();
      refetch();
    } catch (error) {
      console.error("Error accepting mentee request:", error);
    }
  };

  const handleDecline = async (matchingRequestId: string) => {
    try {
      await respondToMenteeRequest({
        matchingRequestId,
        accept: false
      });

      // If there's a message, start a conversation with the mentee
      if (message.trim()) {
        sendMessage({
          receiverUsername: selectedRequest.username,
          content: message
        });
      }

      setMessage("");
      onClose();
      refetch();
    } catch (error) {
      console.error("Error declining mentee request:", error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
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
          Error loading mentee requests. Please try again later.
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <SponsorNav />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mentee Requests</h1>
          <p className="text-default-500">Review and respond to mentee requests</p>
        </div>

        <Divider />

        {menteeRequests && menteeRequests.length === 0 ? (
          <div className="text-center p-8 bg-content1 rounded-lg">
            <p className="text-xl">No pending mentee requests</p>
            <p className="text-default-500 mt-2">When members request you as a sponsor, they will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {menteeRequests?.map((request: any) => (
              <Card key={request.matching_request_id} className="shadow-sm">
                <CardHeader className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <User
                      name={request.username}
                      avatarProps={{
                        src: request.avatar_url || "https://i.pravatar.cc/150?u=a042581f4e29026024d",
                        size: "md"
                      }}
                    />
                    <div>
                      <h3 className="text-xl font-medium">{request.username}</h3>
                      <Badge color="warning" variant="flat">Pending</Badge>
                    </div>
                  </div>
                  <div className="text-default-500 text-sm">
                    Requested on {formatDate(request.created_at)}
                  </div>
                </CardHeader>
                <Divider />
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => handleViewDetails(request)}
                    startContent={<MessageSquare size={16} />}
                  >
                    View Details
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    startContent={<X size={16} />}
                    onPress={() => {
                      setSelectedRequest(request);
                      handleDecline(request.matching_request_id);
                    }}
                    isDisabled={isRespondingToMenteeRequest}
                  >
                    Decline
                  </Button>
                  <Button
                    color="success"
                    startContent={<Check size={16} />}
                    onPress={() => {
                      setSelectedRequest(request);
                      handleAccept(request.matching_request_id);
                    }}
                    isDisabled={isRespondingToMenteeRequest}
                  >
                    Accept
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                <h3 className="text-xl font-bold">
                  Mentee Request: {selectedRequest?.username}
                </h3>
              </ModalHeader>
              <ModalBody>
                {selectedRequest && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <User
                        name={selectedRequest.username}
                        avatarProps={{
                          src: selectedRequest.avatar_url ,
                          size: "lg"
                        }}
                      />
                      <div>
                        <h4 className="text-lg font-semibold">{selectedRequest.username}</h4>
                        <p className="text-default-500">Requested on {formatDate(selectedRequest.created_at)}</p>
                      </div>
                    </div>

                    <Divider />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="text-default-500" size={18} />
                        <span>Location: {selectedRequest.location || "Not specified"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="text-default-500" size={18} />
                        <span>Available: {selectedRequest.available_days?.join(", ") || "Not specified"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Languages className="text-default-500" size={18} />
                        <span>Languages: {selectedRequest.languages?.join(", ") || "Not specified"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="text-default-500" size={18} />
                        <span>Experience: {selectedRequest.experience?.join(", ") || "Not specified"}</span>
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <h4 className="font-semibold mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.interests?.map((interest: string, index: number) => (
                          <Chip key={index} color="primary" variant="flat">
                            {interest}
                          </Chip>
                        )) || "No interests specified"}
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <h4 className="font-semibold mb-2">Send a message with your response (optional)</h4>
                      <Textarea
                        placeholder="Write a message to the mentee..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        minRows={3}
                      />
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    handleDecline(selectedRequest.matching_request_id);
                  }}
                  isDisabled={isRespondingToMenteeRequest}
                  startContent={<X size={16} />}
                >
                  Decline
                </Button>
                <Button
                  color="success"
                  onPress={() => {
                    handleAccept(selectedRequest.matching_request_id);
                  }}
                  isDisabled={isRespondingToMenteeRequest}
                  startContent={<Check size={16} />}
                >
                  Accept
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
} 