import { Link } from "@heroui/react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck
} from "lucide-react";

export default function SponsorNav() {
  const location = useLocation();

  // Sponsor navigation items
  const sponsorNavItems = [
    {
      name: "Dashboard",
      path: "/sponsor",
      icon: <LayoutDashboard size={16} />,
    },
    {
      name: "Mentee Requests",
      path: "/sponsor/requests",
      icon: <UserCheck size={16} />,
    },
    {
      name: "My Mentees",
      path: "/sponsor/mentees",
      icon: <Users size={16} />,
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 bg-content1 p-2 rounded-lg">
        {sponsorNavItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center px-3 py-2 rounded-md text-sm ${location.pathname === item.path
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