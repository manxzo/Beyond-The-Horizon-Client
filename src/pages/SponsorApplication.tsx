import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Spinner,
  Divider,
  Textarea,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  Award,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash,
  AlertTriangle,
  Shield,
} from "lucide-react";

import DefaultLayout from "../layouts/default";
import { useSponsor } from "../hooks/useSponsor";
import { useUser } from "../hooks/useUser";

export default function SponsorApplication() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [applicationInfo, setApplicationInfo] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Get user hooks
  const { currentUser } = useUser();

  // Get sponsor hooks
  const {
    getSponsorApplicationStatus,
    applyForSponsor,
    isApplyingForSponsor,
    updateSponsorApplication,
    isUpdatingSponsorApplication,
    deleteSponsorApplication,
    isDeletingSponsorApplication,
  } = useSponsor();

  // Fetch sponsor application status
  const {
    data: applicationResponse,
    isLoading: isLoadingApplication,
    error: applicationError,
    refetch: refetchApplication,
  } = useQuery(getSponsorApplicationStatus());

  // Extract application data
  const application = applicationResponse?.data;

  // Set initial application info when data is loaded
  useEffect(() => {
    if (application?.application_info) {
      setApplicationInfo(application.application_info);
    }
  }, [application]);

  // Handle applying for sponsor
  const handleApply = async () => {
    if (!applicationInfo.trim()) return;

    await applyForSponsor(applicationInfo);
    refetchApplication();
    onClose();
  };

  // Handle updating application
  const handleUpdate = async () => {
    if (!applicationInfo.trim()) return;

    await updateSponsorApplication(applicationInfo);
    refetchApplication();
    onClose();
  };

  // Handle deleting application
  const handleDelete = async () => {
    await deleteSponsorApplication();
    refetchApplication();
    setIsConfirmingDelete(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Get status chip color based on application status
  const getStatusChipColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Approved":
        return "success";
      case "Rejected":
        return "danger";
      default:
        return "default";
    }
  };

  // Get status icon based on application status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-5 h-5" />;
      case "Approved":
        return <CheckCircle className="w-5 h-5" />;
      case "Rejected":
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  // Render content based on user role and application status
  const renderContent = () => {
    // If user is already a sponsor
    if (currentUser?.role === "Sponsor") {
      return (
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Award className="text-success w-6 h-6" />
                <p className="text-xl font-semibold">You&apos;re Already a Sponsor</p>
              </div>
              <p className="text-small text-default-500">
                You have already been approved as a sponsor and can access sponsor features.
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <p>
              As a sponsor, you can mentor and support other members in their journey.
              Thank you for your contribution to the community!
            </p>
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Sponsor Responsibilities:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide guidance and support to members</li>
                <li>Participate actively in group discussions</li>
                <li>Help moderate conversations when needed</li>
                <li>Share your experience and knowledge</li>
                <li>Maintain confidentiality and respect privacy</li>
              </ul>
            </div>
          </CardBody>
          <Divider />
          <CardFooter>
            <Button
              color="primary"
              as="a"
              href="/sponsor-dashboard"
            >
              Go to Sponsor Dashboard
            </Button>
          </CardFooter>
        </Card>
      );
    }

    // If user is an admin
    if (currentUser?.role === "Admin") {
      return (
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Shield className="text-danger w-6 h-6" />
                <p className="text-xl font-semibold">Admin Access</p>
              </div>
              <p className="text-small text-default-500">
                As an admin, you can review and manage sponsor applications.
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <p>
              You have admin privileges and can review sponsor applications from the admin dashboard.
            </p>
          </CardBody>
          <Divider />
          <CardFooter>
            <Button
              color="primary"
              as="a"
              href="/admin/sponsors"
            >
              Review Sponsor Applications
            </Button>
          </CardFooter>
        </Card>
      );
    }

    // If no application exists
    if (!application) {
      return (
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-xl font-semibold">Become a Sponsor</p>
              <p className="text-small text-default-500">
                Apply to become a sponsor and help others in their journey
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-4">
              <p>
                Sponsors play a vital role in our community by providing guidance,
                support, and mentorship to members. As a sponsor, you&apos;ll have the
                opportunity to make a positive impact on others&apos; lives.
              </p>

              <h3 className="text-lg font-semibold">Requirements:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>At least 6 months of active membership</li>
                <li>Regular participation in group activities</li>
                <li>Willingness to support and guide others</li>
                <li>Good standing in the community</li>
                <li>Commitment to privacy and confidentiality</li>
              </ul>

              <h3 className="text-lg font-semibold">Benefits:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Make a positive impact on others&apos; lives</li>
                <li>Access to sponsor-only resources and training</li>
                <li>Opportunity to develop leadership skills</li>
                <li>Recognition within the community</li>
                <li>Deeper connection with the community</li>
              </ul>
            </div>
          </CardBody>
          <Divider />
          <CardFooter>
            <Button
              color="primary"
              onPress={onOpen}
            >
              Apply to Become a Sponsor
            </Button>
          </CardFooter>
        </Card>
      );
    }

    // If application exists
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center">
              <p className="text-xl font-semibold">Sponsor Application</p>
              <Chip
                color={getStatusChipColor(application.status)}
                variant="flat"
                startContent={getStatusIcon(application.status)}
              >
                {application.status}
              </Chip>
            </div>
            <p className="text-small text-default-500">
              Submitted on {formatDate(application.created_at)}
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-semibold mb-1">Your Application:</h3>
              <p className="whitespace-pre-wrap p-3 bg-default-100 rounded-md">
                {application.application_info}
              </p>
            </div>

            {application.admin_comments && (
              <div>
                <h3 className="text-md font-semibold mb-1">Admin Feedback:</h3>
                <p className="whitespace-pre-wrap p-3 bg-default-100 rounded-md">
                  {application.admin_comments}
                </p>
              </div>
            )}

            {application.status === "Rejected" && (
              <div className="flex items-start gap-2 p-3 bg-danger-50 text-danger-600 rounded-md">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Application Rejected</p>
                  <p>You can submit a new application after addressing the feedback provided.</p>
                </div>
              </div>
            )}

            {application.status === "Pending" && (
              <div className="flex items-start gap-2 p-3 bg-warning-50 text-warning-600 rounded-md">
                <Clock className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Application Under Review</p>
                  <p>Our admin team is reviewing your application. This process typically takes 3-5 business days.</p>
                </div>
              </div>
            )}

            {application.status === "Approved" && (
              <div className="flex items-start gap-2 p-3 bg-success-50 text-success-600 rounded-md">
                <CheckCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Application Approved</p>
                  <p>Congratulations! Your sponsor role will be activated soon.</p>
                </div>
              </div>
            )}
          </div>
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-between">
          {application.status === "Pending" && (
            <>
              <div>
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<Trash />}
                  onPress={() => setIsConfirmingDelete(true)}
                  isDisabled={isDeletingSponsorApplication}
                >
                  Delete Application
                </Button>
              </div>
              <Button
                color="primary"
                startContent={<Edit />}
                onPress={onOpen}
                isDisabled={isUpdatingSponsorApplication}
              >
                Update Application
              </Button>
            </>
          )}

          {application.status === "Rejected" && (
            <Button
              color="primary"
              onPress={onOpen}
            >
              Submit New Application
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (isLoadingApplication) {
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
          <h1 className="text-3xl font-bold">Sponsor Application</h1>
        </div>

        {renderContent()}

        {/* Application Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              {application ? "Update Your Application" : "Apply to Become a Sponsor"}
            </ModalHeader>
            <ModalBody>
              <p className="mb-2">
                Please explain why you would like to become a sponsor and what qualifies you for this role.
                Include any relevant experience or skills that would make you a good sponsor.
              </p>
              <Textarea
                label="Application"
                placeholder="Share your experience, motivation, and qualifications..."
                value={applicationInfo}
                onChange={(e) => setApplicationInfo(e.target.value)}
                minRows={8}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={application ? handleUpdate : handleApply}
                isLoading={application ? isUpdatingSponsorApplication : isApplyingForSponsor}
                isDisabled={!applicationInfo.trim()}
              >
                {application ? "Update Application" : "Submit Application"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isConfirmingDelete} onClose={() => setIsConfirmingDelete(false)} size="sm">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              Confirm Deletion
            </ModalHeader>
            <ModalBody>
              <p>
                Are you sure you want to delete your sponsor application? This action cannot be undone.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="flat" onPress={() => setIsConfirmingDelete(false)}>
                Cancel
              </Button>
              <Button
                color="danger"
                onPress={handleDelete}
                isLoading={isDeletingSponsorApplication}
              >
                Delete Application
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
} 