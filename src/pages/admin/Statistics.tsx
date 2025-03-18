import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/admin/useAdmin";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Spinner,
  Chip,
  Button,
} from "@heroui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import AdminNav from "@/components/AdminNav";
import DefaultLayout from "@/layouts/default";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Award,
  UserCheck,
  FileText,
  Flag,
  UserCog,
  Ban,
  User,
  Video,
  Headphones,
  BookOpen,
  FileQuestion,
  ArrowLeft
} from "lucide-react";

// Colors for charts
const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
];

export default function AdminStatistics() {
  const navigate = useNavigate();
  const { getAdminStats } = useAdmin();
  const { data, isLoading, error } = useQuery(getAdminStats());

  // Extract stats from the response data structure
  const stats = data?.data;

  // Prepare data for charts
  const userRegistrationData = stats?.userRegistrationsByMonth?.map((item: any) => ({
    name: item.month,
    users: item.count,
  })) || [];

  const userDistributionData = [
    { name: "Members", value: stats?.userCounts?.memberUsers || 0 },
    { name: "Sponsors", value: stats?.userCounts?.sponsorUsers || 0 },
    { name: "Admins", value: stats?.userCounts?.adminUsers || 0 },
    { name: "Banned Users", value: stats?.userCounts?.bannedUsers || 0 },
  ];

  const resourcesData = [
    { name: "Articles", count: stats?.resourceCounts?.articles || 0 },
    { name: "Videos", count: stats?.resourceCounts?.videos || 0 },
    { name: "Podcasts", count: stats?.resourceCounts?.podcasts || 0 },
    { name: "Books", count: stats?.resourceCounts?.books || 0 },
    { name: "Other", count: stats?.resourceCounts?.other || 0 },
  ];

  const supportGroupCategoriesData = stats?.supportGroupCategories?.map((item: any) => ({
    name: item.category,
    count: item.count,
  })) || [];

  const reportsData = [
    { name: "Resolved", value: stats?.reportCounts?.resolved || 0 },
    { name: "Pending", value: stats?.reportCounts?.pending || 0 },
  ];

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
          Error loading statistics. Please try again later.
        </div>
      </DefaultLayout>
    );
  }

  // Create stat cards for key metrics
  const statCards = [
    {
      title: "Total Users",
      value: stats?.total_users || 0,
      icon: <Users size={24} className="text-primary" />,
      description: "Registered users on the platform",
    },
    {
      title: "Admin Users",
      value: stats?.userCounts?.adminUsers || 0,
      icon: <UserCog size={24} className="text-primary-600" />,
      description: "Users with admin privileges",
    },
    {
      title: "Member Users",
      value: stats?.userCounts?.memberUsers || 0,
      icon: <User size={24} className="text-primary-400" />,
      description: "Standard user accounts",
    },
    {
      title: "Sponsor Users",
      value: stats?.userCounts?.sponsorUsers || 0,
      icon: <Award size={24} className="text-success-400" />,
      description: "Users with sponsor status",
    },
    {
      title: "Banned Users",
      value: stats?.userCounts?.bannedUsers || 0,
      icon: <Ban size={24} className="text-danger" />,
      description: "Users who have been banned",
    },
    {
      title: "Total Sponsors",
      value: stats?.total_sponsors || 0,
      icon: <Award size={24} className="text-success" />,
      description: "Active sponsors on the platform",
    },
    {
      title: "Pending Sponsor Applications",
      value: stats?.pending_sponsor_applications || 0,
      icon: <UserCheck size={24} className="text-warning" />,
      description: "Applications awaiting review",
      highlight: stats?.pending_sponsor_applications > 0,
    },
    {
      title: "Support Groups",
      value: stats?.supportGroupCounts?.total || 0,
      icon: <Users size={24} className="text-secondary" />,
      description: "Total support groups",
    },
    {
      title: "Pending Support Groups",
      value: stats?.pending_support_groups || 0,
      icon: <Users size={24} className="text-warning" />,
      description: "Groups awaiting approval",
      highlight: stats?.pending_support_groups > 0,
    },
    {
      title: "Total Resources",
      value: stats?.resourceCounts?.total || 0,
      icon: <FileText size={24} className="text-info" />,
      description: "All resources on the platform",
    },
    {
      title: "Pending Resources",
      value: stats?.pending_resources || 0,
      icon: <FileText size={24} className="text-warning" />,
      description: "Resources awaiting review",
      highlight: stats?.pending_resources > 0,
    },
    {
      title: "Total Reports",
      value: stats?.reportCounts?.total || 0,
      icon: <Flag size={24} className="text-danger-400" />,
      description: "All reports submitted",
    },
    {
      title: "Unresolved Reports",
      value: stats?.unresolved_reports || 0,
      icon: <Flag size={24} className="text-danger" />,
      description: "Reports requiring attention",
      highlight: stats?.unresolved_reports > 0,
    },
    {
      title: "Resolved Reports",
      value: stats?.reportCounts?.resolved || 0,
      icon: <Flag size={24} className="text-success" />,
      description: "Reports that have been resolved",
    },
  ];

  return (
    <DefaultLayout>
      <AdminNav />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Platform Statistics</h1>
            <p className="text-default-500">Comprehensive overview of platform usage and metrics</p>
          </div>
          <Button
            color="primary"
            variant="flat"
            startContent={<ArrowLeft size={16} />}
            onPress={() => navigate("/admin")}
          >
            Back to Dashboard
          </Button>
        </div>

        <Divider />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center p-6">
              <div className="text-4xl font-bold text-primary">
                {stats?.userCounts?.totalUsers || 0}
              </div>
              <div className="text-default-500 mt-2">Total Users</div>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center p-6">
              <div className="text-4xl font-bold text-success">
                {stats?.resourceCounts?.total || 0}
              </div>
              <div className="text-default-500 mt-2">Total Resources</div>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center p-6">
              <div className="text-4xl font-bold text-warning">
                {stats?.supportGroupCounts?.total || 0}
              </div>
              <div className="text-default-500 mt-2">Support Groups</div>
            </CardBody>
          </Card>
          <Card className="shadow-sm">
            <CardBody className="flex flex-col items-center justify-center p-6">
              <div className="text-4xl font-bold text-danger">
                {stats?.reportCounts?.total || 0}
              </div>
              <div className="text-default-500 mt-2">Total Reports</div>
            </CardBody>
          </Card>
        </div>

        {/* Pending Items Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <h3 className="text-xl font-medium">Pending Items</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                <UserCheck size={24} className="text-warning mb-2" />
                <span className="text-2xl font-bold text-warning">{stats?.pending_sponsor_applications || 0}</span>
                <span className="text-default-500 text-sm">Pending Sponsor Applications</span>
                {stats?.pending_sponsor_applications > 0 && (
                  <Chip color="warning" size="sm" className="mt-2">Requires Attention</Chip>
                )}
              </div>
              <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                <Users size={24} className="text-warning mb-2" />
                <span className="text-2xl font-bold text-warning">{stats?.pending_support_groups || 0}</span>
                <span className="text-default-500 text-sm">Pending Support Groups</span>
                {stats?.pending_support_groups > 0 && (
                  <Chip color="warning" size="sm" className="mt-2">Requires Attention</Chip>
                )}
              </div>
              <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                <FileText size={24} className="text-warning mb-2" />
                <span className="text-2xl font-bold text-warning">{stats?.pending_resources || 0}</span>
                <span className="text-default-500 text-sm">Pending Resources</span>
                {stats?.pending_resources > 0 && (
                  <Chip color="warning" size="sm" className="mt-2">Requires Attention</Chip>
                )}
              </div>
              <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                <Flag size={24} className="text-danger mb-2" />
                <span className="text-2xl font-bold text-danger">{stats?.unresolved_reports || 0}</span>
                <span className="text-default-500 text-sm">Unresolved Reports</span>
                {stats?.unresolved_reports > 0 && (
                  <Chip color="danger" size="sm" className="mt-2">Requires Attention</Chip>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Registration Trend */}
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-xl font-medium">User Registration Trend</h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={userRegistrationData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* User Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-xl font-medium">User Distribution</h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userDistributionData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Resources by Type */}
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-xl font-medium">Resources by Type</h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={resourcesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Support Group Categories */}
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-xl font-medium">Support Group Categories</h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supportGroupCategoriesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {supportGroupCategoriesData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Reports Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-xl font-medium">Reports Status</h3>
            </CardHeader>
            <CardBody>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#82ca9d" />
                      <Cell fill="#ff8042" />
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Resource Types Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <h3 className="text-xl font-medium">Resource Types</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                  <FileText size={24} className="text-info-700 mb-2" />
                  <span className="text-2xl font-bold">{stats?.resourceCounts?.articles || 0}</span>
                  <span className="text-default-500 text-sm">Articles</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                  <Video size={24} className="text-info-400 mb-2" />
                  <span className="text-2xl font-bold">{stats?.resourceCounts?.videos || 0}</span>
                  <span className="text-default-500 text-sm">Videos</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                  <Headphones size={24} className="text-info-500 mb-2" />
                  <span className="text-2xl font-bold">{stats?.resourceCounts?.podcasts || 0}</span>
                  <span className="text-default-500 text-sm">Podcasts</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                  <BookOpen size={24} className="text-info-600 mb-2" />
                  <span className="text-2xl font-bold">{stats?.resourceCounts?.books || 0}</span>
                  <span className="text-default-500 text-sm">Books</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-default-50 rounded-lg">
                  <FileQuestion size={24} className="text-info-300 mb-2" />
                  <span className="text-2xl font-bold">{stats?.resourceCounts?.other || 0}</span>
                  <span className="text-default-500 text-sm">Other</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Detailed Stats Cards */}
        <Card className="shadow-sm">
          <CardHeader>
            <h3 className="text-xl font-medium">Detailed Statistics</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {statCards.map((card, index) => (
                <div key={index} className={`flex items-center p-4 rounded-lg ${card.highlight ? 'bg-warning-50' : 'bg-default-50'}`}>
                  <div className="mr-4">{card.icon}</div>
                  <div>
                    <div className={`text-xl font-bold ${card.highlight ? 'text-warning' : ''}`}>{card.value}</div>
                    <div className="text-sm text-default-500">{card.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
} 