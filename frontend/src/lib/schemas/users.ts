import { z } from "zod";

export const editProfileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(255, "First name is too long.")
    .optional(),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(255, "Last name is too long.")
    .optional(),
  department: z
    .string()
    .trim()
    .min(1, "Please select or specify your department.")
    .max(255, "Department is too long.")
    .optional(),
  phone_number: z
      .string()
      .regex(
        /^(?:(?:\+|00)212|0)[567]\d{8}$/,
        "Must be a valid Moroccan phone number (e.g., +212612345678 or 0612345678)",
      ).optional(),
  gender: z.boolean().optional(),
  login: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(255, "Username is too long.")
    .optional(),
  avatar: z.string().url("Invalid avatar URL.").optional().or(z.literal("")),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;