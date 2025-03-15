import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import ForgotPassword from "./pages/forgotPassword";
import Profile from "./pages/profile";
import Messages from "./pages/messages";
import SupportGroups from "./pages/supportGroups";
import SupportGroupDetail from "./pages/supportGroupDetail";
import About from "./pages/about";
import PublicResources from "./pages/publicResources";
import Feed from "./pages/feed";
import GroupChats from "./pages/groupChats";
import Resources from "./pages/resources";
import Mentees from "./pages/mentees";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:username" element={<Messages />} />
      <Route path="/support-groups" element={<SupportGroups />} />
      <Route path="/support-groups/:groupId" element={<SupportGroupDetail />} />
      <Route path="/about" element={<About />} />
      <Route path="/public-resources" element={<PublicResources />} />
      <Route path="/feed" element={<Feed />} />
      <Route path="/group-chats" element={<GroupChats />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/mentees" element={<Mentees />} />
    </Routes>
  );
}

export default App;
