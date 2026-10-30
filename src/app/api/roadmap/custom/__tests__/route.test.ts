import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { auth } from "@/lib/auth";
import { saveCustomRoadmap } from "@/lib/recommendations/roadmap";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/recommendations/roadmap", () => ({
  saveCustomRoadmap: vi.fn(),
}));

vi.mock("@/lib/server-utils", () => ({
  safeRevalidatePath: vi.fn(),
}));

describe("POST /api/roadmap/custom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const req = new Request("http://localhost:3000/api/roadmap/custom", {
      method: "POST",
      body: JSON.stringify({ text: "Week 1\nDay 1\nTwo Sum" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when text contains blocking errors", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    const req = new Request("http://localhost:3000/api/roadmap/custom", {
      method: "POST",
      body: JSON.stringify({
        text: "Two Sum before header\nWeek 1\nDay 1\nValid Anagram",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("blocking errors");
  });

  it("saves custom roadmap successfully", async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: "user-1" } } as never);
    vi.mocked(saveCustomRoadmap).mockResolvedValueOnce({
      roadmap: { id: "rm-custom", source: "CUSTOM", title: "Custom Roadmap" },
    } as never);

    const text = `
Week 1: Arrays & Hashing
Day 1
Two Sum
Contains Duplicate
`.trim();

    const req = new Request("http://localhost:3000/api/roadmap/custom", {
      method: "POST",
      body: JSON.stringify({ text }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.roadmap.roadmap.source).toBe("CUSTOM");
    expect(saveCustomRoadmap).toHaveBeenCalledTimes(1);
  });
});
