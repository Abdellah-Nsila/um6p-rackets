import { z } from "zod";

// Small reusable pieces: every auth form builds its schema from these
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email address is required.")
  .email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(20, "Password is too long.");

// Login only checks that the fields are filled: password rules belong to register and reset
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(50, "First name is too long"),
    lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name is too long"),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(15, "Username is too long"),
    email: emailSchema.max(50, "Email is too long"),
    phone: z
      .string()
      .regex(
        /^(?:(?:\+|00)212|0)[567]\d{8}$/,
        "Must be a valid Moroccan phone number (e.g., +212612345678 or 0612345678)",
      ),
    gender: z.enum(["Male", "Female"], "Gender is required"),
    department: z.string().min(1, "Department is required"),
    // Optional: the input only exists when the department is "OTHER"
    customDepartment: z.string().trim().max(50, "Department name is too long").optional(),
    password: passwordSchema,
  })
  .refine((data) => data.department !== "OTHER" || (data.customDepartment?.length ?? 0) >= 2, {
    message: "Please specify your department (min 2 characters)",
    path: ["customDepartment"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
