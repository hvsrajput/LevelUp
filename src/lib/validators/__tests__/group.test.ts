import { describe, it, expect } from "vitest";
import { createGroupSchema, joinGroupSchema } from "../group";

describe("Group Validator Schemas", () => {
  describe("createGroupSchema", () => {
    it("accepts valid group name", () => {
      const result = createGroupSchema.safeParse({ name: "Algorithm Aces" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Algorithm Aces");
      }
    });

    it("trims whitespace from name", () => {
      const result = createGroupSchema.safeParse({ name: "   FAANG Prep   " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("FAANG Prep");
      }
    });

    it("rejects too short names", () => {
      const result = createGroupSchema.safeParse({ name: "A" });
      expect(result.success).toBe(false);
    });

    it("rejects excessively long names", () => {
      const result = createGroupSchema.safeParse({ name: "A".repeat(55) });
      expect(result.success).toBe(false);
    });
  });

  describe("joinGroupSchema", () => {
    it("accepts valid join codes and normalizes to uppercase", () => {
      const result = joinGroupSchema.safeParse({ joinCode: "9xy4m7kr" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.joinCode).toBe("9XY4M7KR");
      }
    });

    it("rejects invalid length join codes", () => {
      const result = joinGroupSchema.safeParse({ joinCode: "ab" });
      expect(result.success).toBe(false);
    });
  });
});
