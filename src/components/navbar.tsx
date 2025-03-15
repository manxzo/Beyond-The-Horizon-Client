import { Button } from "@heroui/react";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import {
  Link,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

import { siteConfig, NavItem } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { useUser } from "@/hooks/useUser";
import { useState } from "react";


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
            endContent={<ChevronDownIcon className="text-small" />}
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

// Simple icon components
const ChevronDownIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const FeedIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ResourcesIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const AdminIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SponsorIcon = (props: any) => (
  <svg
    aria-hidden="true"
    fill="none"
    focusable="false"
    height="1em"
    role="presentation"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    width="1em"
    {...props}
  >
    <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
  </svg>
);

export const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check user roles - add null checks with optional chaining
  const isAdmin = currentUser?.role === "Admin";
  const isSponsor = currentUser?.role === "Sponsor" || isAdmin; // Admins can access sponsor features
  const isMember = isAuthenticated; // All authenticated users are members

  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      isBordered
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
      </NavbarContent>

      <NavbarContent className="sm:hidden pr-3" justify="center">
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
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="start">
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

        {/* Public navigation items - always visible */}
        {siteConfig.navItems.public.map((item) => (
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

        {/* Member-specific navigation dropdown */}
        {isMember && (
          <NavDropdown
            label="Member"
            items={siteConfig.navItems.member}
            icon={<FeedIcon />}
          />
        )}

        {/* Sponsor-specific navigation dropdown */}
        {isSponsor && (
          <NavDropdown
            label="Sponsor"
            items={siteConfig.navItems.sponsor}
            icon={<SponsorIcon />}
          />
        )}

        {/* Admin-specific navigation dropdown */}
        {isAdmin && (
          <NavDropdown
            label="Admin"
            items={siteConfig.navItems.admin}
            icon={<AdminIcon />}
          />
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitch />
        </NavbarItem>

        <NavbarItem>
          {isAuthenticated ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="primary"
                  name={currentUser?.username || "User"}
                  size="sm"
                  src={currentUser?.avatar_url}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{currentUser?.username}</p>
                </DropdownItem>
                <DropdownItem key="profile_page"><Link href="/profile">My Profile</Link></DropdownItem>
                <DropdownItem key="settings"><Link href="/settings">Settings</Link></DropdownItem>

                {isSponsor ? (
                  <DropdownItem key="sponsor_dashboard"><Link href="/sponsor-dashboard">Sponsor Dashboard</Link></DropdownItem>
                ) : null}

                {isAdmin ? (
                  <DropdownItem key="admin"><Link href="/admin">Admin Dashboard</Link></DropdownItem>
                ) : null}

                <DropdownItem key="help"><Link href="/help">Help & Support</Link></DropdownItem>
                <DropdownItem key="logout" color="danger" onPress={() => logout()}>
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Button
              as={Link}
              href={siteConfig.authLinks.login}
              variant="flat"
              color="default"
            >
              Login/Signup
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu>
        {/* Public navigation items */}
        {siteConfig.navItems.public.map((item) => (
          <NavbarMenuItem key={`mobile-${item.href}`}>
            <Link
              color="foreground"
              className="w-full"
              href={item.href}
              size="lg"
            >
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}

        {/* Member-specific navigation items */}
        {isMember && (
          <>
            <NavbarMenuItem className="mt-5">
              <span className="text-primary font-semibold">Member</span>
            </NavbarMenuItem>
            {siteConfig.navItems.member.map((item) => (
              <NavbarMenuItem key={`mobile-${item.href}`}>
                <Link
                  color="foreground"
                  className="w-full"
                  href={item.href}
                  size="lg"
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          </>
        )}

        {/* Sponsor-specific navigation items */}
        {isSponsor && (
          <>
            <NavbarMenuItem className="mt-5">
              <span className="text-primary font-semibold">Sponsor</span>
            </NavbarMenuItem>
            {siteConfig.navItems.sponsor.map((item) => (
              <NavbarMenuItem key={`mobile-${item.href}`}>
                <Link
                  color="foreground"
                  className="w-full"
                  href={item.href}
                  size="lg"
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          </>
        )}

        {/* Admin-specific navigation items */}
        {isAdmin && (
          <>
            <NavbarMenuItem className="mt-5">
              <span className="text-primary font-semibold">Admin</span>
            </NavbarMenuItem>
            {siteConfig.navItems.admin.map((item) => (
              <NavbarMenuItem key={`mobile-${item.href}`}>
                <Link
                  color="foreground"
                  className="w-full"
                  href={item.href}
                  size="lg"
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          </>
        )}
      </NavbarMenu>
    </HeroUINavbar>
  );
};
