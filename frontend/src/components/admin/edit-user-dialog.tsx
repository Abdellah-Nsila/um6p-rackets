"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateAdminUser } from "@/hooks/use-admin";
import { editUserSchema, type EditUserValues } from "@/lib/schemas/admin";
import type { AdminUpdateUserBody, AdminUser } from "@/types/contracts/admin";
import type { UserRole } from "@/types/contracts/auth"; // adjust path
import { useMe } from "@/hooks/use-me";

const toBody = (v: EditUserValues): AdminUpdateUserBody => ({
  first_name: v.first_name,
  last_name: v.last_name,
  department: v.department || null,
  role: v.role as UserRole,
});

export function EditUserDialog({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {/* key resets the form every time another user is opened */}
        {user && <EditUserForm key={user.id} user={user} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function EditUserForm({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const { data: me } = useMe();
  const isSelf = Number(me?.id) === user.id;
  const update = useUpdateAdminUser();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      department: user.department ?? "",
      role: user.role as EditUserValues["role"],
    },
  });

  const onSubmit = (values: EditUserValues) =>
    update.mutate({ userId: user.id, body: toBody(values) }, { onSuccess: onClose });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit user</DialogTitle>
        <DialogDescription>@{user.login}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" {...register("first_name")} />
          {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" {...register("last_name")} />
          {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Input id="department" placeholder="Leave empty to clear" {...register("department")} />
        {errors.department && <p className="text-sm text-destructive">{errors.department.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isSelf}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {isSelf && <p className="text-xs text-muted-foreground">You can&apos;t change your own role.</p>}
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}