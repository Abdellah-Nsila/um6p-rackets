import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters.")
    .max(1000, "Keep the message under 1000 characters."),
});

export type ContactValues = z.infer<typeof contactSchema>;
