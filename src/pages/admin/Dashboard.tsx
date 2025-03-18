import { Card, CardBody, CardHeader, Divider, Spinner, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/admin/useAdmin";
import {
  Users,
  Award,
  UserCheck,
  FileText,
  Flag,
  BarChart3,
  ArrowRight
} from "lucide-react";
import AdminNav from "@/components/AdminNav";
import DefaultLayout from "@/layouts/default";
import { useNavigate } from "react-router-dom";

// Define types for the stats data
interface RegistrationByMonth {
  month: string;
  count: number;
}

interface AdminStats {
  total_users: number;
  total_sponsors: number;
  pending_sponsor_applications: number;
  pending_support_groups: number;
  pending_resources: number;
  unresolved_reports: number;
  userCounts: {
    adminUsers: number;
    memberUsers: number;
    sponsorUsers: number;
    bannedUsers: number;
    totalUsers: number;
  };
  resourceCounts: {
    total: number;
    videos: number;
    podcasts: number;
    books: number;
    articles: number;
    other: number;
  };
  supportGroupCounts: {
    total: number;
  };
  reportCounts: {
    total: number;
    pending: number;
    resolved: number;
  };
  userRegistrationsByMonth: RegistrationByMonth[];
}

interface ApiResponse {
  data: AdminStats;
  success: boolean;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { getAdminStats } = useAdmin();

  const { data, isLoading, error } = useQuery<ApiResponse>(getAdminStats());

  // Extract stats from the response data structure
  const stats = data?.data;

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
          Error loading admin statistics. Please try again later.
        </div>
      </DefaultLayout>
    );
  }

  // Only show pending items that require admin attention
  const pendingCards = [
    {
      title: "Pending Sponsor Applications",
      value: stats?.pending_sponsor_applications || 0,
      icon: <UserCheck size={24} className="text-warning" />,
      description: "Applications awaiting review",
      link: "/admin/sponsor-applications",
      color: "warning"
    },
    {
      title: "Pending Support Groups",
      value: stats?.pending_support_groups || 0,
      icon: <Users size={24} className="text-warning" />,
      description: "Groups awaiting approval",
      link: "/admin/support-groups",
      color: "warning"
    },
    {
      title: "Pending Resources",
      value: stats?.pending_resources || 0,
      icon: <FileText size={24} className="text-warning" />,
      description: "Resources awaiting review",
      link: "/admin/resources",
      color: "warning"
    },
    {
      title: "Unresolved Reports",
      value: stats?.unresolved_reports || 0,
      icon: <Flag size={24} className="text-danger" />,
      description: "Reports requiring attention",
      link: "/admin/reports",
      color: "danger"
    },
  ];

  // Calculate total pending items
  const totalPendingItems =
    (stats?.pending_sponsor_applications || 0) +
    (stats?.pending_support_groups || 0) +
    (stats?.pending_resources || 0) +
    (stats?.unresolved_reports || 0);

  return (
    <DefaultLayout>
      {/* Admin Navigation */}
      <AdminNav />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-default-500">Overview of pending items requiring attention</p>
          </div>
          <Button
            color="primary"
            variant="flat"
            endContent={<BarChart3 size={16} />}
            onPress={() => navigate("/admin/statistics")}
          >
            View Full Statistics
          </Button>
        </div>

        <Divider />

        {/* Summary Card */}
        <Card className="shadow-sm bg-gradient-to-r from-primary-50 to-primary-100">
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">Platform Status</h2>
                <p className="text-default-600 mt-1">
                  You have {totalPendingItems} pending {totalPendingItems === 1 ? 'item' : 'items'} requiring attention
                </p>
              </div>
              <Button
                color="primary"
                endContent={<ArrowRight size={16} />}
                onPress={() => navigate("/admin/statistics")}
              >
                View Detailed Statistics
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Pending Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pendingCards.map((card, index) => (
            <div
              key={index}
              className="block"
              onClick={() => navigate(card.link)}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(card.link);
                }
              }}
              aria-label={`View ${card.title}`}
            >
              <Card className={`shadow-sm hover:shadow-md transition-shadow ${card.value > 0 ? 'border-' + card.color : ''}`}>
                <CardHeader className="flex justify-between items-center pb-2">
                  <h3 className="text-lg font-medium">{card.title}</h3>
                  {card.icon}
                </CardHeader>
                <CardBody>
                  <div className="flex flex-col">
                    <span className={`text-3xl font-bold ${card.value > 0 ? 'text-' + card.color : ''}`}>
                      {card.value}
                    </span>
                    <span className="text-default-500 text-sm mt-1">{card.description}</span>
                  </div>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>

        {/* Quick Stats Overview */}
        <Card className="shadow-sm mt-6">
          <CardHeader>
            <h3 className="text-lg font-medium">Platform Overview</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                <Users size={24} className="text-primary mb-2" />
                <span className="text-2xl font-bold">{stats?.total_users || 0}</span>
                <span className="text-default-500 text-sm">Total Users</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                <Award size={24} className="text-success mb-2" />
                <span className="text-2xl font-bold">{stats?.total_sponsors || 0}</span>
                <span className="text-default-500 text-sm">Sponsors</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                <FileText size={24} className="text-info mb-2" />
                <span className="text-2xl font-bold">{stats?.resourceCounts?.total || 0}</span>
                <span className="text-default-500 text-sm">Resources</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                <Users size={24} className="text-secondary mb-2" />
                <span className="text-2xl font-bold">{stats?.supportGroupCounts?.total || 0}</span>
                <span className="text-default-500 text-sm">Support Groups</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
} 