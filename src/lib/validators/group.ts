// =============================================================================
// Group Validation Schemas (Zod)
// =============================================================================

import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Group name must be at least 2 characters")
    .max(50, "Group name must not exceed 50 characters"),
});

export const joinGroupSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(4, "Join code is too short")
    .max(20, "Join code is too long")
    .transform((code) => code.toUpperCase()),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
