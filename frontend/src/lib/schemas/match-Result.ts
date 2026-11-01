import { z } from "zod";

export const matchResultSchema = z.object({
    team1_score: z
        .number()
        .int("Score must be a whole number.")
        .min(0, "Score cannot be negative."),
    team2_score: z
        .number()
        .int("Score must be a whole number.")
        .min(0, "Score cannot be negative."),
    }).refine((data) => data.team1_score !== data.team2_score, {
    message: "A draw is not allowed. One team must win.",
    path: ["team2_score"],
});

export type MatchResultValues = z.infer<typeof matchResultSchema>;