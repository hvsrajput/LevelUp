import { z } from "zod";

export const linkLeetCodeSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, { message: "LeetCode username is required" })
    .max(64, { message: "LeetCode username cannot exceed 64 characters" })
    .regex(/^[a-zA-Z0-9_\-]+$/, {
      message: "Username can only contain alphanumeric characters, underscores, and hyphens",
    }),
  sessionCookie: z.string().trim().optional(),
});

export type LinkLeetCodeInput = z.infer<typeof linkLeetCodeSchema>;

export const importNumberSchema = z.object({
  questionNumber: z.coerce
    .number({ message: "Question number must be a valid number" })
    .int({ message: "Question number must be an integer" })
    .positive({ message: "Question number must be a positive integer" }),
});

export type ImportNumberInput = z.infer<typeof importNumberSchema>;

export const sync24hSchema = z.object({
  username: z.string().trim().optional(),
});

export type Sync24hInput = z.infer<typeof sync24hSchema>;

export const syncBulkSchema = z.object({
  username: z.string().trim().optional(),
});

export type SyncBulkInput = z.infer<typeof syncBulkSchema>;
