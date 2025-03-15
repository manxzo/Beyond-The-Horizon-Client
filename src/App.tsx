import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/login";
import Profile from "./pages/profile";
import Messages from "./pages/messages";
import SupportGroups from "./pages/supportGroups";
import SupportGroupDetail from "./pages/supportGroupDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:username" element={<Messages />} />
      <Route path="/support-groups" element={<SupportGroups />} />
      <Route path="/support-groups/:groupId" element={<SupportGroupDetail />} />
    </Routes>
  );
}

export default App;
