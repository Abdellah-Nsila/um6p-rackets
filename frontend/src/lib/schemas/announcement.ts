import { z } from "zod";

export const createAnnouncementSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Announcement content is required."),
});

export type CreateAnnouncementValues = z.infer<typeof createAnnouncementSchema>;