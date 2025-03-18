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
    useDisclosure,
    Select,
    SelectItem,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/admin/useAdmin";
import { Check, X, AlertTriangle, Eye } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import DefaultLayout from "@/layouts/default";

export default function AdminReports() {
    const { getUnresolvedReports, handleReport, banUser } = useAdmin();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [adminComments, setAdminComments] = useState("");
    const [banReason, setBanReason] = useState("");
    const [banDuration, setBanDuration] = useState<string | null>(null);
    const [showBanForm, setShowBanForm] = useState(false);
    const [viewingReport, setViewingReport] = useState<any>(null);

    const { data: reportsResponse, isLoading, error, refetch } = useQuery(getUnresolvedReports());
    const reports = reportsResponse?.data;

    const handleViewDetails = (report: any) => {
        setViewingReport(report);
        onOpen();
    };

    const handleResolve = async (reportId: string) => {
        await handleReport({
            reportId,
            actionTaken: adminComments || "Report resolved by admin",
            resolved: true
        });
        setAdminComments("");
        refetch();
    };

    const handleDismiss = async (reportId: string) => {
        await handleReport({
            reportId,
            actionTaken: adminComments || "Report dismissed by admin",
            resolved: true
        });
        setAdminComments("");
        refetch();
    };

    const handleBanUser = async () => {
        if (selectedReport && banReason && banDuration) {
            const duration = banDuration === "permanent" ? undefined : parseInt(banDuration);

            await banUser({
                userId: selectedReport.reported_user_id,
                reason: banReason,
                banDurationDays: duration
            });

            await handleReport({
                reportId: selectedReport.id,
                actionTaken: `Banned user for ${banDuration === "permanent" ? 'permanently' : banDuration + ' days'}: ${banReason}`,
                resolved: true
            });

            setBanReason("");
            setBanDuration(null);
            setShowBanForm(false);
            onClose();
            refetch();
        }
    };

    const getBadgeColor = (reportType: string) => {
        const type = reportType.replace(/"/g, '').trim();

        switch (type) {
            case 'User':
                return 'danger';
            case 'Post':
                return 'warning';
            case 'Comment':
                return 'secondary';
            case 'Message':
                return 'primary';
            case 'GroupChatMessage':
                return 'primary';
            case 'GroupChat':
                return 'success';
            default:
                return 'default';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        // Convert the formatted enum string back to our enum type
        const statusType = status.replace(/"/g, '').trim();

        switch (statusType) {
            case 'Pending':
                return 'warning';
            case 'Resolved':
                return 'success';
            case 'Reviewed':
                return 'primary';
            default:
                return 'default';
        }
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
                    Error loading reports. Please try again later.
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <AdminNav />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Report Management</h1>
                    <p className="text-default-500">Review and handle user reports</p>
                </div>

                <Divider />

                {reports && reports.length === 0 ? (
                    <div className="text-center p-8 bg-content1 rounded-lg">
                        <p className="text-xl">No unresolved reports</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {reports?.map((report: any) => (
                            <Card key={report.id} className="shadow-sm">
                                <CardHeader className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-medium">
                                            Report #{report.id.substring(0, 8)}
                                        </h3>
                                        <div className="flex gap-2 mt-1">
                                            <Badge color={getBadgeColor(report.report_type)} variant="flat">
                                                {report.report_type}
                                            </Badge>
                                            <Badge color={getStatusBadgeColor(report.status)} variant="flat">
                                                {report.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        onPress={() => handleViewDetails(report)}
                                        aria-label="View details"
                                    >
                                        <Eye size={20} />
                                    </Button>
                                </CardHeader>
                                <CardBody>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="font-semibold">Reason:</span>
                                            <p className="text-default-500">{report.reason}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="font-semibold">Reporter ID:</span>
                                                <p className="text-default-500">{report.reporter_id}</p>
                                            </div>
                                            {report.reported_user_id && (
                                                <div>
                                                    <span className="font-semibold">Reported User ID:</span>
                                                    <p className="text-default-500">{report.reported_user_id}</p>
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-semibold">Reported At:</span>
                                                <p className="text-default-500">{new Date(report.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                                <Divider />
                                <CardFooter className="flex justify-between">
                                    <Button
                                        color="success"
                                        variant="flat"
                                        startContent={<Check size={16} />}
                                        onPress={() => handleDismiss(report.id)}
                                    >
                                        Dismiss
                                    </Button>
                                    <Button
                                        color="warning"
                                        variant="flat"
                                        startContent={<AlertTriangle size={16} />}
                                        onPress={() => handleResolve(report.id)}
                                    >
                                        Resolve
                                    </Button>
                                    {report.reported_user_id && (
                                        <Button
                                            color="danger"
                                            startContent={<X size={16} />}
                                            onPress={() => {
                                                setSelectedReport({
                                                    ...report,
                                                    id: report.id
                                                });
                                                setShowBanForm(true);
                                                onOpen();
                                            }}
                                        >
                                            Ban User
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Report Details Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="3xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-warning" size={20} />
                                    <h3 className="text-xl font-bold">
                                        {showBanForm ? "Ban Reported User" : `${viewingReport?.report_type || ''} Report`}
                                    </h3>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                {showBanForm && selectedReport ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold">Ban User</h4>
                                            <p className="text-default-600 mt-2">
                                                You are about to ban user ID: <span className="font-medium">{selectedReport.reported_user_id}</span>
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <Select
                                                label="Ban Duration"
                                                placeholder="Select ban duration"
                                                selectedKeys={banDuration ? [banDuration] : []}
                                                onSelectionChange={(keys) => {
                                                    const selected = Array.from(keys)[0] as string;
                                                    setBanDuration(selected);
                                                }}
                                            >
                                                <SelectItem key="1">1 Day</SelectItem>
                                                <SelectItem key="3">3 Days</SelectItem>
                                                <SelectItem key="7">7 Days</SelectItem>
                                                <SelectItem key="14">14 Days</SelectItem>
                                                <SelectItem key="30">30 Days</SelectItem>
                                                <SelectItem key="permanent">Permanent</SelectItem>
                                            </Select>
                                            <Textarea
                                                label="Ban Reason"
                                                placeholder="Explain why this user is being banned"
                                                value={banReason}
                                                onChange={(e) => setBanReason(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ) : viewingReport && (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold">Reason</h4>
                                            <p className="text-default-600">{viewingReport.reason}</p>
                                        </div>
                                        <Divider />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-semibold">Report Type</h4>
                                                <p>{viewingReport.report_type}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Reported Item ID</h4>
                                                <p>{viewingReport.reported_item_id}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Reporter ID</h4>
                                                <p>{viewingReport.reporter_id}</p>
                                            </div>
                                            {viewingReport.reported_user_id && (
                                                <div>
                                                    <h4 className="font-semibold">Reported User ID</h4>
                                                    <p>{viewingReport.reported_user_id}</p>
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-semibold">Status</h4>
                                                <p>{viewingReport.status}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Created At</h4>
                                                <p>{new Date(viewingReport.created_at).toLocaleString()}</p>
                                            </div>
                                            {viewingReport.resolved_at && (
                                                <div>
                                                    <h4 className="font-semibold">Resolved At</h4>
                                                    <p>{new Date(viewingReport.resolved_at).toLocaleString()}</p>
                                                </div>
                                            )}
                                            {viewingReport.reviewed_by && (
                                                <div>
                                                    <h4 className="font-semibold">Reviewed By</h4>
                                                    <p>{viewingReport.reviewed_by}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" onPress={() => {
                                    setShowBanForm(false);
                                    setBanReason("");
                                    setBanDuration(null);
                                    onClose();
                                }}>
                                    Cancel
                                </Button>
                                {showBanForm && (
                                    <Button
                                        color="danger"
                                        startContent={<X size={16} />}
                                        onPress={handleBanUser}
                                        isDisabled={!banReason || !banDuration}
                                    >
                                        Ban User
                                    </Button>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </DefaultLayout>
    );
} 