import { useState } from "react";
import {
  Card,
  CardBody,
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
  useDisclosure
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/admin/useAdmin";
import { Check, X, Eye } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import DefaultLayout from "@/layouts/default";
import { ApplicationStatus } from "../../interfaces/enums";

// Define the application interface based on the new data structure
interface SponsorApplication {
  admin_comments: string | null;
  application_id: string;
  application_info: Record<string, any>;
  created_at: string;
  email: string;
  reviewed_by: string | null;
  status: string;
  user_id: string;
  username: string;
}

export default function AdminSponsors() {
  const { getPendingSponsorApplications, reviewSponsorApplication } = useAdmin();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedApplication, setSelectedApplication] = useState<SponsorApplication | null>(null);
  const [adminComments, setAdminComments] = useState("");

  // Use the API to fetch sponsor applications
  const { data: applicationsResponse, isLoading, error, refetch } = useQuery(getPendingSponsorApplications());
  const applications = applicationsResponse;

  const handleViewDetails = (application: SponsorApplication) => {
    setSelectedApplication(application);
    onOpen();
  };

  const handleApprove = async (applicationId: string) => {
    await reviewSponsorApplication({
      applicationId,
      status: ApplicationStatus.Approved,
      adminComments
    });
    setAdminComments("");
    refetch();
  };

  const handleReject = async (applicationId: string) => {
    await reviewSponsorApplication({
      applicationId,
      status: ApplicationStatus.Rejected,
      adminComments
    });
    setAdminComments("");
    refetch();
  };

  if (isLoading) {
    return (
      <DefaultLayout>
        <AdminNav />
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" color="primary" />
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <AdminNav />
        <div className="bg-danger-50 text-danger p-4 rounded-lg">
          Error loading sponsor applications. Please try again later.
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <AdminNav />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Sponsor Application Management</h1>
          <p className="text-default-500">Review and approve sponsor applications</p>
        </div>

        <Divider />

        {applications && applications.length === 0 ? (
          <div className="text-center p-8 bg-content1 rounded-lg">
            <p className="text-xl">No pending sponsor applications</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {applications?.map((application: SponsorApplication) => (
              <Card key={application.application_id} className="shadow-sm">
                <CardHeader className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-medium">
                      Application from {application.username}
                    </h3>
                    <Badge color="warning" variant="flat">{application.status}</Badge>
                  </div>
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => handleViewDetails(application)}
                    aria-label="View details"
                  >
                    <Eye size={20} />
                  </Button>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold">Application Info:</span>
                      <p className="text-default-500">
                        {Object.keys(application.application_info).length > 0
                          ? JSON.stringify(application.application_info).substring(0, 150) + "..."
                          : "No detailed application information provided."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold">Email:</span>
                        <p className="text-default-500">{application.email}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Applied At:</span>
                        <p className="text-default-500">{new Date(application.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
                <Divider />
                <CardFooter className="flex flex-col space-y-4">
                  <Textarea
                    label="Admin Comments"
                    placeholder="Add comments about this application (optional)"
                    value={adminComments}
                    onChange={(e) => setAdminComments(e.target.value)}
                  />
                  <div className="flex justify-between w-full">
                    <Button
                      color="danger"
                      variant="flat"
                      startContent={<X size={16} />}
                      onPress={() => handleReject(application.application_id)}
                    >
                      Reject
                    </Button>
                    <Button
                      color="success"
                      startContent={<Check size={16} />}
                      onPress={() => handleApprove(application.application_id)}
                    >
                      Approve
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h3 className="text-xl font-bold">
                  Sponsor Application: {selectedApplication?.username}
                </h3>
              </ModalHeader>
              <ModalBody>
                {selectedApplication && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Application Information</h4>
                      <p className="text-default-600">
                        {Object.keys(selectedApplication.application_info).length > 0
                          ? JSON.stringify(selectedApplication.application_info, null, 2)
                          : "No detailed application information provided."}
                      </p>
                    </div>
                    <Divider />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold">User</h4>
                        <p>{selectedApplication.username}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Email</h4>
                        <p>{selectedApplication.email}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Applied At</h4>
                        <p>{new Date(selectedApplication.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Status</h4>
                        <Badge color="warning" variant="flat">{selectedApplication.status}</Badge>
                      </div>
                    </div>
                    {selectedApplication.admin_comments && (
                      <>
                        <Divider />
                        <div>
                          <h4 className="font-semibold">Admin Comments</h4>
                          <p className="text-default-600">{selectedApplication.admin_comments}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </DefaultLayout>
  );
}