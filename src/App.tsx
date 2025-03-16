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
import { useUser } from "./hooks/useUser";
import { Spinner } from "@heroui/react";

// Protected route wrapper component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isLoadingUser, isAuthenticated } = useUser();

  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
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

      {/* Redirect any unmatched routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
