// =============================================================================
// Roadmap Validation Schema (Zod)
// =============================================================================

import { z } from "zod";

export const generateRoadmapSchema = z.object({
  goal: z
    .string()
    .trim()
    .min(2, "Goal must be at least 2 characters")
    .max(100, "Goal must not exceed 100 characters"),
  level: z.enum(["beginner", "intermediate", "advanced"], {
    message: "Level must be beginner, intermediate, or advanced",
  }),
  timeline: z.enum(["4 weeks", "8 weeks", "12 weeks"], {
    message: "Timeline must be 4 weeks, 8 weeks, or 12 weeks",
  }),
});

export type GenerateRoadmapInput = z.infer<typeof generateRoadmapSchema>;
