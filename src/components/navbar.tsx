import { Button } from "@heroui/react";
import { Kbd } from "@heroui/react";
import { Link } from "@heroui/react";
import { Input } from "@heroui/react";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  SearchIcon,
} from "@/components/icons";
import { Logo } from "@/components/icons";
import{useUser} from "@/hooks/useUser";

export const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useUser();

  // Check if user has admin role
  const isAdmin = currentUser?.role === "Admin";

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/"
          >
            <Logo />
            <p className="font-bold text-inherit">{siteConfig.name}</p>
          </Link>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {/* Public navigation items */}
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium"
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}

          {/* User-specific navigation items (only shown when authenticated) */}
          {isAuthenticated && siteConfig.userNavItems.slice(0, 4).map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium"
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}

          {/* Admin-specific navigation items (only shown for admins) */}
          {isAdmin && (
            <NavbarItem key="admin">
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium"
                )}
                color="foreground"
                href="/admin"
              >
                Admin
              </Link>
            </NavbarItem>
          )}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal href={siteConfig.links.twitter} title="Twitter">
            <TwitterIcon className="text-default-500" />
          </Link>
          <Link isExternal href={siteConfig.links.discord} title="Discord">
            <DiscordIcon className="text-default-500" />
          </Link>
          <Link isExternal href={siteConfig.links.github} title="GitHub">
            <GithubIcon className="text-default-500" />
          </Link>
          <ThemeSwitch />
        </NavbarItem>
        {isAuthenticated && (
          <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>
        )}
        <NavbarItem className="hidden md:flex">
          {isAuthenticated ? (
            <div className="flex gap-3 items-center">
              <Link href="/profile" className="flex items-center gap-2">
                <img
                  src={currentUser?.avatar_url || "https://ui-avatars.com/api/?name=User&background=random"}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
                <span>{currentUser?.username}</span>
              </Link>
              <Button
                color="danger"
                variant="flat"
                size="sm"
                onPress={() => logout()}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                as={Link}
                href={siteConfig.authLinks.login}
                variant="flat"
                color="default"
              >
                Login/Signup
              </Button>
            </div>
          )}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {isAuthenticated && searchInput}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {/* Public navigation items */}
          {siteConfig.navItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <Link
                color="foreground"
                href={item.href}
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}

          {/* User-specific navigation items */}
          {isAuthenticated && (
            <>
              <NavbarMenuItem className="mt-3">
                <span className="text-primary font-medium">User Pages</span>
              </NavbarMenuItem>
              {siteConfig.userNavItems.map((item) => (
                <NavbarMenuItem key={item.href}>
                  <Link
                    color="foreground"
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
              <NavbarMenuItem className="mt-3">
                <span className="text-primary font-medium">Admin Pages</span>
              </NavbarMenuItem>
              {siteConfig.adminNavItems.map((item) => (
                <NavbarMenuItem key={item.href}>
                  <Link
                    color="foreground"
                    href={item.href}
                    size="lg"
                  >
                    {item.label}
                  </Link>
                </NavbarMenuItem>
              ))}
            </>
          )}

          {/* Authentication buttons */}
          <NavbarMenuItem className="mt-3">
            {isAuthenticated ? (
              <Button
                color="danger"
                variant="flat"
                onPress={() => logout()}
                className="w-full"
              >
                Logout
              </Button>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <Button
                  as={Link}
                  href={siteConfig.authLinks.login}
                  variant="flat"
                  color="default"
                  className="w-full"
                >
                  Login/Signup
                </Button>
              </div>
            )}
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
