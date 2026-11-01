// app/admin/layout.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/use-me";
import { UserRole } from "@/types/contracts/auth";

const TABS = [
  { href: "/admin", label: "Stats" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/clubs", label: "Clubs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending } = useMe();

  const isAdmin = user?.role === UserRole.ADMIN; // adjust: compare with your UserRole

  useEffect(() => {
    if (!isPending && !isAdmin) router.replace("/");
  }, [isPending, isAdmin, router]);

  // render nothing until we know the user is an admin
  if (isPending || !isAdmin) return null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6 mt-25">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">Manage users, clubs and platform stats.</p>
      </header>

      <nav className="inline-flex h-9 items-center rounded-lg bg-muted p-1">
        {TABS.map(({ href, label }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <main>{children}</main>
    </div>
  );
}
