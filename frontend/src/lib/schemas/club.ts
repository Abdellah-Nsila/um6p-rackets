import { z } from "zod";

export const updateClubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Club name must be at least 2 characters.")
    .max(12, "Club name cannot exceed 12 characters."),
  description: z.string().trim().min(1, "Description is required."),
});

export type UpdateClubValues = z.infer<typeof updateClubSchema>;