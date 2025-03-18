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
  Shield,
  LogOut,
  Settings,
  User as UserIcon,
  HelpCircle,
  Award,
  FileText,
  Users,
  Home
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { useUser } from "@/hooks/useUser";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";


export const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useUser();

  // Get unread message counts
  const { totalUnreadCount, isLoading: isLoadingUnreadCounts } = useUnreadMessages();

  // Check user roles - add null checks with optional chaining
  const isAdmin = currentUser?.role === "Admin";
  const isSponsor = currentUser?.role === "Sponsor";

  // Group member navigation items by category
  const mainNavItems = siteConfig.navItems.member.filter(item =>
    ["Feed", "Support Groups", "Resources"].includes(item.label)
  );

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
        {!isAuthenticated ? (
          <>
            <NavbarItem>
              <Link
                color="foreground"
                href="/"
                title="Return to the homepage"
              >
                <Home className="w-4 h-4 mr-1" />
                Home
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link
                color="foreground"
                href="/about"
                title="Learn about our mission and values"
              >
                About
              </Link>
            </NavbarItem>
          </>
        ) : null}

        {/* Main navigation items for authenticated users */}
        {isAuthenticated ? (
          <>
            {mainNavItems.map((item) => (
              <NavbarItem key={item.href}>
                <Link
                  color="foreground"
                  href={item.href}
                  title={item.description}
                  className="flex items-center gap-1"
                >
                  {item.label === "Feed" && <Home className="w-4 h-4" />}
                  {item.label === "Support Groups" && <Users className="w-4 h-4" />}
                  {item.label === "Resources" && <FileText className="w-4 h-4" />}
                  {item.label}
                </Link>
              </NavbarItem>
            ))}
          </>
        ) : null}

        {/* Admin Dashboard link */}
        {isAdmin ? (
          <NavbarItem>
            <Link
              color="foreground"
              href="/admin"
              title="Admin Dashboard"
              className="flex items-center gap-1"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          </NavbarItem>
        ) : null}

        {/* Sponsor Dashboard link */}
        {isSponsor && !isAdmin ? (
          <NavbarItem>
            <Link
              color="foreground"
              href="/sponsor"
              title="Sponsor Dashboard"
              className="flex items-center gap-1"
            >
              <Heart className="w-4 h-4" />
              Sponsor
            </Link>
          </NavbarItem>
        ) : null}
      </NavbarContent>

      <NavbarContent justify="end">
        {/* Messages icon with badge for unread messages */}
        {isAuthenticated ? (
          <NavbarItem>
            <Badge
              content={totalUnreadCount > 0 ? totalUnreadCount : null}
              color="danger"
              shape="circle"
              placement="top-right"
              isInvisible={isLoadingUnreadCounts}
            >
              <Link href="/messages" title="Messages and Group Chats">
                <MessageSquare className="w-5 h-5 text-default-500" />
              </Link>
            </Badge>
          </NavbarItem>
        ) : null}

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

                {/* Admin Dashboard in dropdown */}
                {isAdmin ? (
                  <DropdownItem key="admin" startContent={<Shield className="w-4 h-4" />}>
                    <Link href="/admin">Admin Dashboard</Link>
                  </DropdownItem>
                ) : null}

                {/* Sponsor Dashboard in dropdown */}
                {isSponsor && !isAdmin ? (
                  <DropdownItem key="sponsor_dashboard" startContent={<Heart className="w-4 h-4" />}>
                    <Link href="/sponsor">Sponsor Dashboard</Link>
                  </DropdownItem>
                ) : null}

                {/* Sponsor application for regular members */}
                {!isSponsor && !isAdmin ? (
                  <>
                    <DropdownItem key="become_sponsor" startContent={<Award className="w-4 h-4" />}>
                      <Link href="/sponsor-application">Become a Sponsor</Link>
                    </DropdownItem>
                    <DropdownItem key="find_sponsor" startContent={<UserIcon className="w-4 h-4" />}>
                      <Link href="/sponsor-matching">Find a Sponsor</Link>
                    </DropdownItem>
                  </>
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
