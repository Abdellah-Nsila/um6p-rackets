import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Document title is required.")
    .max(100, "Title cannot exceed 100 characters."),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional()
    .or(z.literal("")),
  path: z
    .string()
    .trim()
    .url("Please enter a valid URL for the document link.")
    .min(1, "File link is required."),
});

export type CreateDocumentValues = z.infer<typeof createDocumentSchema>;