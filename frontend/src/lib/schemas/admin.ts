// schemas/admin.ts
import { UserRole } from "@/types/contracts/auth";
import { z } from "zod";

export const editUserSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required.").max(12, "First name is too long."),
  last_name: z.string().trim().min(1, "Last name is required.").max(12, "Last name is too long."),
  // empty string = no department, converted to null on submit
  department: z.string().trim().max(20, "Department is too long."),
  role: z.enum(UserRole, "Role is required."),
});

export const createClubSchema = z.object({
  name: z.string().trim().min(1, "Club name is required.").max(12, "Club name is too long."),
  description: z.string().trim().max(2000, "Keep the description under 2000 characters."),
  // kept as a string because inputs give strings, converted on submit
  coach_user_id: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, "Enter a valid user id."),
});

export type EditUserValues = z.infer<typeof editUserSchema>;
export type CreateClubValues = z.infer<typeof createClubSchema>;