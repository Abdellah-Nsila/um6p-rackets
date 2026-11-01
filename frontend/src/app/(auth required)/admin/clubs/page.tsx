"use client";

import { useState } from "react";
import Link from "next/link";

import { CreateClubDialog } from "@/components/admin/create-club-dialog";
import { DeleteClubDialog, type ClubRow } from "@/components/admin/delete-club-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminStats } from "@/hooks/use-admin";

export default function AdminClubsPage() {
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ClubRow | null>(null);
  const { data, isLoading, isError, error } = useAdminStats();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data ? `${data.totals.clubs} clubs` : ""}</p>
        <Button onClick={() => setCreating(true)}>Create club</Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-destructive">{error?.message || "Failed to load clubs."}</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.members_per_club.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No clubs yet.
                  </TableCell>
                </TableRow>
              )}
              {data.members_per_club.map((c) => (
                <TableRow key={c.club_id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                  <TableCell>{c.members_count}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/clubs/${c.slug}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      View
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(c)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateClubDialog open={creating} onClose={() => setCreating(false)} />
      <DeleteClubDialog club={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
