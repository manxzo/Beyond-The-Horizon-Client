export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export type NavItems = {
  public: NavItem[];
  member: NavItem[];
  sponsor: NavItem[];
  admin: NavItem[];
};

export type AuthLinks = {
  login: string;
  register?: string;
  forgotPassword: string;
};

export type SiteConfig = {
  name: string;
  description: string;
  navItems: NavItems;
  footerLinks?: NavItem[];
  authLinks: AuthLinks;
};

export const siteConfig: SiteConfig = {
  name: "Beyond The Horizon",
  description: "Connect, support, and grow together beyond the horizon.",
  navItems: {
    // Public navigation items (accessible to all users)
    public: [
      {
        label: "Home",
        href: "/",
        description: "Return to the homepage",
      },
      {
        label: "About",
        href: "/about",
        description: "Learn about our mission and values",
      },
      {
        label: "Login",
        href: "/login",
        description: "Sign in to your account",
      },
      {
        label: "Register",
        href: "/register",
        description: "Create a new account",
      },
    ],
    // Member-specific navigation items (only for logged-in users)
    member: [
      {
        label: "Feed",
        href: "/feed",
        description: "View your personalized content feed",
      },
      {
        label: "Messages",
        href: "/messages",
        description: "Access your private messages and group chats",
      },
      {
        label: "Support Groups",
        href: "/support-groups",
        description: "Join and participate in support groups",
      },
      {
        label: "Resources",
        href: "/resources",
        description: "Access helpful resources and materials",
      },
      {
        label: "Profile",
        href: "/profile",
        description: "View and edit your profile",
      },
    ],
    // Sponsor-specific navigation items (only for sponsors)
    sponsor: [
      {
        label: "Dashboard",
        href: "/sponsor",
        description: "View your sponsor dashboard and analytics",
      },
      {
        label: "Mentee Requests",
        href: "/sponsor/requests",
        description: "Review and respond to mentee requests",
      },
      {
        label: "My Mentees",
        href: "/sponsor/mentees",
        description: "Manage your mentee relationships",
      },
    ],
    // Admin-specific navigation items
    admin: [
      {
        label: "Dashboard",
        href: "/admin",
        description: "Access the main admin dashboard",
      },
      {
        label: "User Management",
        href: "/admin/users",
        description: "Manage user accounts and permissions",
      },
      {
        label: "Support Groups",
        href: "/admin/support-groups",
        description: "Manage and moderate support groups",
      },
      {
        label: "Resources",
        href: "/admin/resources",
        description: "Manage platform resources and content",
      },
      {
        label: "Sponsor Applications",
        href: "/admin/sponsor-applications",
        description: "Review and process sponsor applications",
      },
      {
        label: "Reports",
        href: "/admin/reports",
        description: "View and manage system reports",
      },
      {
        label: "Statistics",
        href: "/admin/stats",
        description: "View platform statistics and analytics",
      },
    ],
  },
  // Footer links (accessible to all users)
  footerLinks: [
    {
      label: "Privacy Policy",
      href: "/privacy",
      description: "Read our privacy policy",
    },
    {
      label: "Terms of Service",
      href: "/terms",
      description: "Read our terms of service",
    },
    {
      label: "Contact Us",
      href: "/contact",
      description: "Get in touch with our team",
    },
    {
      label: "Help & Support",
      href: "/help",
      description: "Get help and support",
    },
  ],
  // Authentication related links
  authLinks: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
  },
};
