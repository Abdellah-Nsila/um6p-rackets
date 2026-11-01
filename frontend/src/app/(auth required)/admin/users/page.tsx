"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminUsers } from "@/hooks/use-admin";
import type { UserRole } from "@/types/contracts/auth";

import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import type { AdminUser } from "@/types/contracts/admin";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import { useMe } from "@/hooks/use-me";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const LIMIT = 20;

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const { data: me } = useMe();
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isError, error, isFetching } = useAdminUsers({
    search: debouncedSearch,
    role: role === "ALL" ? undefined : (role as UserRole),
    page,
    limit: LIMIT,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name or login..."
          value={search}
          maxLength={100}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={role}
          onValueChange={(v) => {
            setRole(v as typeof role);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-destructive">{error?.message || "Failed to load users."}</p>
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
                {data.data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">@{u.login}</div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.department ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>{new Date(u.joined_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={Number(me?.id) === u.id}
                        title={Number(me?.id) === u.id ? "You can't delete yourself" : undefined}
                        onClick={() => setDeleting(u)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              {data.total} users, page {data.page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
      <EditUserDialog user={editing} onClose={() => setEditing(null)} />
      <DeleteUserDialog
        user={deleting}
        onClose={() => setDeleting(null)}
        // deleted the last row of a page > 1: go back one page instead of showing an empty one
        onDeleted={() => {
          if (data && data.data.length === 1 && page > 1) setPage((p) => p - 1);
        }}
      />
    </div>
  );
}
