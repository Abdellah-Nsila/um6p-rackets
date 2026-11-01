"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu, X, Users, BarChart2, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Logo from "../logo";
import { AuthButton } from "../auth/auth-button";
import { useLogout } from "@/hooks/use-logout";
import { useNotifications } from "@/providers/NotificationProvider";
import { User } from "@/types/contracts/auth";
import { useMe } from "@/hooks/use-me";
import { NotificationComponent } from "@/components/notifications/notification-component";
import { useUserJoinedClubs } from "@/hooks/use-profile"; 
import { useClubStatus } from "@/hooks/use-clubs";
import { MemberRole } from "@/types/contracts/club";

export default function Navbar() {
  const { data: user, isPending } = useMe();

  // Still asking the backend who is logged in: show only the logo, no wrong buttons
  if (isPending) return <PendingNav />;

  return user ? <UserNav user={user} /> : <VisitorNav />;
}

function PendingNav() {
  return (
    <header className="absolute top-0 left-0 w-full max-w-[100vw] z-50 bg-transparent pt-6 px-4 md:px-12 lg:px-16 box-border">
      <div className="max-w-7xl mx-auto flex items-center w-full">
        <Logo />
      </div>
    </header>
  );
}

function VisitorNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 w-full max-w-[100vw] z-50 bg-transparent pt-6 px-4 md:px-12 lg:px-16 box-border">
      <div className="max-w-7xl mx-auto flex justify-between items-center w-full min-w-0">
        <div className="shrink-0 min-w-0">
          <Logo />
        </div>

        <div className="hidden md:flex items-center gap-4 shrink-0">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-1">
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle()}
                  render={<Link href="/#clubs">Clubs</Link>}
                />
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle()}
                  render={<Link href="/about">About</Link>}
                />
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle()}
                  render={<Link href="/contact">Contact</Link>}
                />
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <AuthButton title="Sign up" className="min-w-24 h-10 text-base font-semibold ml-2" />
        </div>

        <div className="md:hidden shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-foreground rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-4 p-5 bg-white dark:bg-zinc-950 shadow-xl rounded-2xl border border-border flex flex-col gap-3">
          <Link
            href="/#clubs"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-base font-semibold rounded-lg hover:bg-muted transition-colors"
          >
            Clubs
          </Link>
          <Link
            href="/about"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-base font-semibold rounded-lg hover:bg-muted transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-base font-semibold rounded-lg hover:bg-muted transition-colors"
          >
            Contact
          </Link>
          <div className="px-2 pt-3 mt-1 border-t border-border">
            <AuthButton title="Sign up" className="w-full h-11 text-base font-semibold" />
          </div>
        </div>
      )}
    </header>
  );
}

function UserNav({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);

  const pathname = usePathname();
  // markAllAsRead: () => markAll.mutate(),
  //   markingAllAsRead: markAll.isPending,
  const { notifications , markAllAsRead , markingAllAsRead   } = useNotifications();
  
  const pathParts = pathname?.split("/").filter(Boolean) || [];
  const clubsIndex = pathParts.indexOf("clubs");
  const currentClubSlug =
    clubsIndex !== -1 && pathParts.length > clubsIndex + 1 ? pathParts[clubsIndex + 1] : "";

  const isAppView =
    pathname?.startsWith("/clubs") ||
    pathname?.startsWith("/leaderboard") ||
    pathname?.startsWith("/profile");

  const performLogout = useLogout();

  const fallbackInitial =
    user?.first_name?.charAt(0)?.toUpperCase() || user?.login?.charAt(0)?.toUpperCase() || "U";

  // Dynamically fetch the user's joined clubs
  const { data: myJoinedClubs = [] } = useUserJoinedClubs(user.id);

  // Fetch current club status to verify member roles (0, 1, 2)
  const { data: clubStatus } = useClubStatus(currentClubSlug);
  const isClubMemberOrStaff =
    clubStatus?.role !== undefined &&
    (clubStatus.role === MemberRole.MEMBER ||
    clubStatus.role === MemberRole.LEADER ||
    clubStatus.role === MemberRole.COACH);

  return (
    <header className="absolute top-0 left-0 w-full max-w-[100vw] z-50 bg-transparent pt-6 px-4 md:px-12 lg:px-16 box-border">
      <div className="max-w-7xl mx-auto flex justify-between items-center w-full min-w-0">
        <div className="shrink-0 min-w-0">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 shrink-0">
          {!isAppView && (
            <NavigationMenu className="mr-2">
              <NavigationMenuList className="flex gap-1">
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    render={<Link href="/#clubs">Clubs</Link>}
                  />
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    render={<Link href="/about">About</Link>}
                  />
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    render={<Link href="/contact">Contact</Link>}
                  />
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}

          {/* Members Icon - Visible only if user has role 0, 1, or 2 */}
          {isAppView && currentClubSlug && isClubMemberOrStaff && (
            <Link
              title="Club Members"
              href={`/clubs/${currentClubSlug}/members`}
              className={`flex items-center justify-center transition-colors hover:text-brand-orange ${pathname?.includes("/members") ? "text-brand-orange" : "text-foreground"}`}
            >
              <Users className="w-5 h-5" />
            </Link>
          )}

          {/* My Clubs Icon Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              title="My Clubs"
              className="flex items-center justify-center transition-colors hover:text-brand-orange text-foreground outline-none cursor-pointer"
            >
              <Shield className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="center">
              <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                My Clubs
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {myJoinedClubs.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    No clubs joined
                  </div>
                ) : (
                  myJoinedClubs.map((joined) => (
                    <DropdownMenuItem key={joined.club.slug}>
                      <Link href={`/clubs/${joined.club.slug}`} className="w-full cursor-pointer font-medium">
                        {joined.club.name}
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Leaderboard Icon */}
          {isAppView && currentClubSlug && (
            <Link
              title="Leaderboard"
              href={`/clubs/${currentClubSlug}/leaderboard?target_user_id=${user.id}`}
              className={`flex items-center justify-center transition-colors hover:text-brand-orange ${pathname?.includes("/leaderboard") ? "text-brand-orange" : "text-foreground"}`}
            >
              <BarChart2 className="w-5 h-5" />
            </Link>
          )}

          <NotificationComponent
            notifications={notifications}
            onMarkAllAsRead={markAllAsRead}
            markingAllAsRead={markingAllAsRead}
            triggerMode="icon"
          />

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`flex items-center justify-center rounded-full outline-none transition-transform hover:scale-105 cursor-pointer bg-transparent p-0 ml-2 ${pathname?.startsWith("/profile") ? "ring-2 ring-brand-orange ring-offset-2" : ""}`}
            >
              <Avatar className="w-10 h-10 border border-border shadow-sm">
                <AvatarImage
                  src={user?.avatar || undefined}
                  alt={user?.first_name || "User"}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-brand-cream text-brand-orange font-bold">
                  {fallbackInitial}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Link href="/profile" className="w-full cursor-pointer">
                    Profile
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {/* LInk to /admin */}
              {user.role === "ADMIN" && (
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Link href="/admin" className="w-full cursor-pointer">
                      Admin
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={performLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/30"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-foreground rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              <X className="w-7 h-7" />
            ) : (
              <Menu className="w-7 h-7" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-4 p-5 bg-white dark:bg-zinc-950 shadow-xl rounded-2xl border border-border flex flex-col gap-3 max-h-[85vh] overflow-y-auto">
            {!isAppView && (
              <>
                <Link
                  href="/#clubs"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-base font-semibold rounded-lg hover:bg-muted transition-colors"
                >
                  Clubs
                </Link>
                <Link
                  href="/about"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-base font-semibold rounded-lg hover:bg-muted transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-base font-semibold rounded-lg hover:bg-muted transition-colors"
                >
                  Contact
                </Link>
              </>
            )}

            {/* Members Link - Mobile (Visible only if user has role 0, 1, or 2) */}
            {isAppView && currentClubSlug && isClubMemberOrStaff && (
              <Link
                href={`/clubs/${currentClubSlug}/members`}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-2 flex items-center gap-3 text-base font-semibold rounded-lg transition-colors ${pathname?.includes("/members") ? "bg-orange-50 text-brand-orange dark:bg-orange-950/40" : "hover:bg-muted text-foreground"}`}
              >
                <Users className="w-5 h-5" /> Members
              </Link>
            )}

            {/* My Clubs List - Mobile */}
            <div className="px-4 py-2 flex flex-col gap-2 border-t border-border mt-1 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                My Clubs
              </p>
              {myJoinedClubs.length === 0 ? (
                <p className="text-sm font-medium text-muted-foreground">No clubs joined</p>
              ) : (
                myJoinedClubs.map((joined) => (
                  <Link
                    key={joined.club.slug}
                    href={`/clubs/${joined.club.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 text-base font-semibold rounded-lg hover:bg-muted text-foreground transition-colors py-1.5"
                  >
                    <Shield className="w-5 h-5 text-muted-foreground" /> {joined.club.name}
                  </Link>
                ))
              )}
            </div>

            {/* Mobile Menu Version - Uses "menu" trigger style */}
            <NotificationComponent
              notifications={notifications}
              onMarkAllAsRead={markAllAsRead}
              markingAllAsRead={markingAllAsRead}
              triggerMode="menu" 
            />

            {/* Leaderboard Link - Mobile */}
            {isAppView && currentClubSlug && (
              <Link
                href={`/clubs/${currentClubSlug}/leaderboard?target_user_id=${user.id}`}
                onClick={() => setIsOpen(false)}
                className={`px-4 py-2 flex items-center gap-3 text-base font-semibold rounded-lg transition-colors ${pathname?.includes("/leaderboard") ? "bg-orange-50 text-brand-orange dark:bg-orange-950/40" : "hover:bg-muted text-foreground"}`}
              >
                <BarChart2 className="w-5 h-5" /> Leaderboard
              </Link>
            )}

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className={`px-4 py-2 flex items-center gap-3 text-base font-semibold rounded-lg transition-colors mt-2 border-t border-border pt-4 ${pathname?.startsWith("/profile") ? "text-brand-orange" : "hover:bg-muted text-foreground"}`}
            >
              <Avatar
                className={`w-8 h-8 border shadow-sm shrink-0 ${pathname?.startsWith("/profile") ? "border-brand-orange" : "border-background"}`}
              >
                <AvatarImage
                  src={user?.avatar || undefined}
                  alt={user?.first_name || "User"}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-accent text-accent-foreground font-bold text-xs">
                  {fallbackInitial}
                </AvatarFallback>
              </Avatar>
              <span>Profile</span>
            </Link>

            <div className="px-2 pt-2">
              <Button
                onClick={performLogout}
                variant="destructive"
                className="w-full h-11 text-base font-semibold"
              >
                Log out
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
