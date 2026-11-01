import type { Paginated, Club } from "@/types/contracts/club";
import type { User, UserRole } from "@/types/contracts/auth";

// ---------- Requests ----------
export const ADMIN_USER_SORT_FIELDS = [
  "joined_at",
  "first_name",
  "last_name",
  "login",
] as const;
export type AdminUserSortField = (typeof ADMIN_USER_SORT_FIELDS)[number];

// GET /admin/users
export type AdminListUsersQuery = {
  search?: string; // max 100
  role?: UserRole;
  sort?: AdminUserSortField; // default "joined_at"
  order?: "asc" | "desc"; // default "desc"
  page?: number; // default 1
  limit?: number; // 1..100, default 20
};

// PATCH /admin/users/:user_id (at least one field)
export type AdminUpdateUserBody = {
  first_name?: string; // 1..255
  last_name?: string; // 1..255
  department?: string | null; // max 255, null clears it
  role?: UserRole;
};

// POST /admin/clubs (slug is built by the backend from the name)
export type CreateClubBody = {
  name: string; // 1..255
  description?: string | null; // max 2000
  coach_user_id: number; // auth user id, >= 1
};

// GET /admin/stats
export type AdminStatsQuery = {
  weeks?: number; // 1..26, default 8
};

// ---------- Responses like that for easy future edits ----------

export type AdminUser = User;
export type AdminUsersPage = Paginated<AdminUser>;
export type AdminCreatedClub = Club;

// ---------- Stats ----------

export type AdminStats = {
  totals: { users: number; clubs: number; members: number };
  members_per_club: {
    club_id: number;
    name: string;
    slug: string;
    members_count: number;
  }[];
  weekly: {
    week_start: string;
    signups: number;
    matches: number;
    bookings: number;
  }[];
};