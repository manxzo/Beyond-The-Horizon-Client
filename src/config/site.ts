export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Beyond The Horizon",
  description: "Connect, support, and grow together beyond the horizon.",
  // Public navigation items (accessible to all users)
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "About",
      href: "/about",
    },
    {
      label: "Contact",
      href: "/contact",
    },
  ],
  // User-specific navigation items (only for logged-in users)
  userNavItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Feed",
      href: "/feed",
    },
    {
      label: "Messages",
      href: "/messages",
    },
    {
      label: "Resources",
      href: "/resources",
    },
    {
      label: "Support Groups",
      href: "/support-groups",
    },
    {
      label: "My Groups",
      href: "/my-groups",
    },
    {
      label: "Meetings",
      href: "/meetings",
    },
    {
      label: "Become a Sponsor",
      href: "/become-sponsor",
    },
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Settings",
      href: "/settings",
    },
  ],
  // Admin-specific navigation items
  adminNavItems: [
    {
      label: "Admin Dashboard",
      href: "/admin",
    },
    {
      label: "Sponsor Applications",
      href: "/admin/sponsor-applications",
    },
    {
      label: "Support Group Requests",
      href: "/admin/support-groups",
    },
    {
      label: "Resource Management",
      href: "/admin/resources",
    },
    {
      label: "Reports",
      href: "/admin/reports",
    },
    {
      label: "User Management",
      href: "/admin/users",
    },
    {
      label: "Statistics",
      href: "/admin/stats",
    },
  ],
  // Authentication related links
  authLinks: {
    login: "/login",
    forgotPassword: "/forgot-password",
  },
  // External links and social media
  links: {
    github: "https://github.com/your-organization/beyond-the-horizon",
    twitter: "https://twitter.com/beyondhorizon",
    website: "https://beyondthehorizon.com",
    discord: "https://discord.gg/beyondhorizon",
  },
};
