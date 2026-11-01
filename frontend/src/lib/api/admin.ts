// lib/api/admin.ts
import { api, post } from "@/lib/api/api";
import type {
  AdminCreatedClub,
  AdminListUsersQuery,
  AdminStats,
  AdminStatsQuery,
  AdminUpdateUserBody,
  AdminUser,
  AdminUsersPage,
  CreateClubBody,
} from "@/types/contracts/admin";

const ADMIN = "/admin";

// skips undefined and empty values, so the URL only has what was set
const toQuery = (params: object) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  const s = query.toString();
  return s ? `?${s}` : "";
};

// list users
export const getAdminUsers = (params: AdminListUsersQuery = {}) =>
  api<AdminUsersPage>(`${ADMIN}/users${toQuery(params)}`);

// update a user (at least one field)
export const updateAdminUser = (userId: number, body: AdminUpdateUserBody) =>
  api<AdminUser>(`${ADMIN}/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

// delete a user
export const deleteAdminUser = (userId: number) =>
  api<void>(`${ADMIN}/users/${userId}`, { method: "DELETE" });

// create a club (slug is built by the backend)
export const createAdminClub = (body: CreateClubBody) =>
  post<AdminCreatedClub>(`${ADMIN}/clubs`, body);

// stats
export const getAdminStats = (params: AdminStatsQuery = {}) =>
  api<AdminStats>(`${ADMIN}/stats${toQuery(params)}`);

// delete a club
export const deleteAdminClub = (slug: string) =>
  api<void>(`${ADMIN}/clubs/${slug}`, { method: "DELETE" });
