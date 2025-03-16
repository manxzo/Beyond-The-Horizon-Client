import { Button } from "@heroui/react";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import {
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge,
  User,
} from "@heroui/react";
import {
  MessageSquare,
  Heart,
  ChevronDown,
  Shield,
  LogOut,
  Settings,
  User as UserIcon,
  HelpCircle
} from "lucide-react";

import { siteConfig, NavItem } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { useUser } from "@/hooks/useUser";
import { useState, useEffect } from "react";

// Helper component for dropdown navigation
const NavDropdown = ({
  label,
  items,
  icon
}: {
  label: string;
  items: NavItem[];
  icon?: React.ReactNode;
}) => {
  return (
    <Dropdown>
      <NavbarItem>
        <DropdownTrigger>
          <Button
            disableRipple
            className="p-0 bg-transparent data-[hover=true]:bg-transparent"
            endContent={<ChevronDown className="w-4 h-4" />}
            radius="sm"
            variant="light"
          >
            {icon && <span className="mr-1">{icon}</span>}
            {label}
          </Button>
        </DropdownTrigger>
      </NavbarItem>
      <DropdownMenu aria-label={`${label} navigation`}>
        {items.map((item) => (
          <DropdownItem key={item.href} textValue={item.label}>
            <Link
              className="w-full"
              color="foreground"
              href={item.href}
              title={item.description}
            >
              {item.label}
            </Link>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useUser();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Check user roles - add null checks with optional chaining
  const isAdmin = currentUser?.role === "Admin";
  const isSponsor = currentUser?.role === "Sponsor";

  // Effect to simulate unread message count (replace with actual implementation)
  useEffect(() => {
    // In a real implementation, this would come from a WebSocket or API call
    // For example, using the useWebSocketListener hook from the README
    if (isAuthenticated) {
      // Simulate some unread messages for demonstration
      setUnreadMessages(3);
    } else {
      setUnreadMessages(0);
    }
  }, [isAuthenticated]);

  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      isBordered
    >
      <NavbarContent className="gap-4" justify="start">
        <NavbarBrand>
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/"
          >
            <Logo />
            <p className="font-bold text-inherit">{siteConfig.name}</p>
          </Link>
        </NavbarBrand>

        {/* Public navigation items - only shown when not authenticated */}
        {!isAuthenticated && siteConfig.navItems.public.map((item) => (
          item.label === "Register" || item.label === "Login" ? null :
          <NavbarItem key={item.href}>
            <Link
              color="foreground"
              href={item.href}
              title={item.description}
            >
              {item.label}
            </Link>
          </NavbarItem>
        ))}

        {/* Member-specific navigation items - shown when authenticated */}
        {isAuthenticated && siteConfig.navItems.member
          .filter(item => !['Messages', 'Group Chats'].includes(item.label))
          .map((item) => (
            <NavbarItem key={item.href}>
              <Link
                color="foreground"
                href={item.href}
                title={item.description}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}

        {/* Messages icon with badge for unread messages */}
        {isAuthenticated && (
          <NavbarItem>
            <Badge
              content={unreadMessages > 0 ? unreadMessages : null}
              color="danger"
              shape="circle"
              placement="top-right"
            >
              <Link href="/messages" title="Messages and Group Chats">
                <MessageSquare className="w-5 h-5 text-default-500" />
              </Link>
            </Badge>
          </NavbarItem>
        )}

        {/* Admin-specific navigation dropdown */}
        {isAdmin && (
          <NavDropdown
            label="Admin"
            items={siteConfig.navItems.admin}
            icon={<Shield className="w-4 h-4" />}
          />
        )}

        {/* Sponsor-specific navigation dropdown */}
        {isSponsor && !isAdmin && (
          <NavDropdown
            label="Sponsor"
            items={siteConfig.navItems.sponsor}
            icon={<Heart className="w-4 h-4" />}
          />
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitch className="scale-90" />
        </NavbarItem>

        <NavbarItem>
          {isAuthenticated ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <User
                  as="button"
                  avatarProps={{
                    isBordered: true,
                    src: currentUser?.avatar_url,
                    color: "primary",
                    size: "sm",
                  }}
                  className="transition-transform"
                  description={currentUser?.role || "Member"}
                  name={currentUser?.username || "User"}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{currentUser?.username}</p>
                </DropdownItem>
                <DropdownItem key="profile_page" startContent={<UserIcon className="w-4 h-4" />}>
                  <Link href="/profile">My Profile</Link>
                </DropdownItem>
                <DropdownItem key="settings" startContent={<Settings className="w-4 h-4" />}>
                  <Link href="/settings">Settings</Link>
                </DropdownItem>

                {isSponsor && !isAdmin ? (
                  <DropdownItem key="sponsor_dashboard" startContent={<Heart className="w-4 h-4" />}>
                    <Link href="/sponsor-dashboard">Sponsor Dashboard</Link>
                  </DropdownItem>
                ) : null}

                {isAdmin ? (
                  <DropdownItem key="admin" startContent={<Shield className="w-4 h-4" />}>
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownItem>
                ) : null}

                <DropdownItem key="help" startContent={<HelpCircle className="w-4 h-4" />}>
                  <Link href="/help">Help & Support</Link>
                </DropdownItem>
                <DropdownItem key="logout" color="danger" startContent={<LogOut className="w-4 h-4" />} onPress={() => logout()}>
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="flex gap-2">
              <Button
                as={Link}
                href={siteConfig.authLinks.login}
                variant="flat"
                color="default"
                size="sm"
              >
                Login
              </Button>
              <Button
                as={Link}
                href={siteConfig.authLinks.register || "/register"}
                variant="solid"
                color="primary"
                size="sm"
              >
                Sign Up
              </Button>
            </div>
          )}
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
