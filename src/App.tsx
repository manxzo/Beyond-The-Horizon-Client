import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import SupportGroups from "./pages/SupportGroups";
import SupportGroupDashboard from "./pages/SupportGroupDashboard";
import Meeting from "./pages/Meeting";
import GroupChat from "./pages/GroupChat";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import SponsorApplication from "./pages/SponsorApplication";
import SponsorMatching from "./pages/SponsorMatching";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import Resources from "./pages/Resources";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSupportGroups from "./pages/admin/SupportGroups";
import AdminReports from "./pages/admin/Reports";
import AdminUsers from "./pages/admin/Users";
import AdminSponsors from "./pages/admin/Sponsors";
import AdminResources from "./pages/admin/Resources";
import AdminStatistics from "./pages/admin/Statistics";

// Sponsor pages
import SponsorDashboard from "./pages/sponsor/Dashboard";
import SponsorRequests from "./pages/sponsor/Requests";
import SponsorMentees from "./pages/sponsor/Mentees";

import { useUser } from "./hooks/useUser";
import { useUnreadMessages } from "./hooks/useUnreadMessages";
import { Spinner } from "@heroui/react";
import { useEffect } from "react";


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isLoadingUser, isAuthenticated } = useUser();
  const { initializeUnreadCounts } = useUnreadMessages();
  useEffect(() => {
    if (isAuthenticated) {
      initializeUnreadCounts();
    }
  }, [isAuthenticated, initializeUnreadCounts]);

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isLoadingUser, isAuthenticated, currentUser } = useUser();

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser?.role !== 'Admin') {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}

function SponsorRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isLoadingUser, isAuthenticated, currentUser } = useUser();

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (currentUser?.role !== 'Sponsor') {
    return <Navigate to="/sponsor-application" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected routes */}
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:username"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sponsor-application"
        element={
          <ProtectedRoute>
            <SponsorApplication />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sponsor-matching"
        element={
          <ProtectedRoute>
            <SponsorMatching />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support-groups"
        element={
          <ProtectedRoute>
            <SupportGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support-groups/:groupId"
        element={
          <ProtectedRoute>
            <SupportGroupDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meetings/:meetingId"
        element={
          <ProtectedRoute>
            <Meeting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/group-chats/:chatId"
        element={
          <ProtectedRoute>
            <GroupChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/conversation/:username"
        element={
          <ProtectedRoute>
            <Conversation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <Resources />
          </ProtectedRoute>
        }
      />

      {/* Sponsor routes */}
      <Route
        path="/sponsor"
        element={
          <SponsorRoute>
            <SponsorDashboard />
          </SponsorRoute>
        }
      />
      <Route
        path="/sponsor/requests"
        element={
          <SponsorRoute>
            <SponsorRequests />
          </SponsorRoute>
        }
      />
      <Route
        path="/sponsor/mentees"
        element={
          <SponsorRoute>
            <SponsorMentees />
          </SponsorRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/support-groups"
        element={
          <AdminRoute>
            <AdminSupportGroups />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminRoute>
            <AdminReports />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/sponsor-applications"
        element={
          <AdminRoute>
            <AdminSponsors />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/resources"
        element={
          <AdminRoute>
            <AdminResources />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/stats"
        element={
          <AdminRoute>
            <AdminStatistics />
          </AdminRoute>
        }
      />

      {/* Redirect any unmatched routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
