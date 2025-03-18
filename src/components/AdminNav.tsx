import { Link } from "@heroui/react";
import { useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Flag, 
  Award, 
  FileText, 
  BarChart3 
} from "lucide-react";

export default function AdminNav() {
  const location = useLocation();

  // Admin navigation items
  const adminNavItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: <LayoutDashboard size={16} />,
    },
    {
      name: "Support Groups",
      path: "/admin/support-groups",
      icon: <Users size={16} />,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: <Flag size={16} />,
    },
    {
      name: "User Management",
      path: "/admin/users",
      icon: <Users size={16} />,
    },
    {
      name: "Sponsor Applications",
      path: "/admin/sponsor-applications",
      icon: <Award size={16} />,
    },
    {
      name: "Resources",
      path: "/admin/resources",
      icon: <FileText size={16} />,
    },
    {
      name: "Statistics",
      path: "/admin/stats",
      icon: <BarChart3 size={16} />,
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 bg-content1 p-2 rounded-lg">
        {adminNavItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center px-3 py-2 rounded-md text-sm ${
              location.pathname === item.path
                ? "bg-primary text-primary-foreground"
                : "hover:bg-content2"
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
} 