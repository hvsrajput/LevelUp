/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { POST } from "../route";

const authMock = vi.mocked(auth);

describe("Problems Suggest API: /api/problems/suggest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    authMock.mockResolvedValueOnce(null as any);
    const req = new Request("http://localhost:3000/api/problems/suggest", {
      method: "POST",
      body: JSON.stringify({ title: "Two Sum", description: "Array problem" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid input", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as any);

    const req = new Request("http://localhost:3000/api/problems/suggest", {
      method: "POST",
      body: JSON.stringify({ title: "", description: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns grounded suggestions with citations", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
    } as any);

    const req = new Request("http://localhost:3000/api/problems/suggest", {
      method: "POST",
      body: JSON.stringify({
        title: "Longest Substring Without Repeating Characters",
        description: "Given a string s, find the length of the longest substring without duplicate characters.",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.suggestedTopics).toBeDefined();
    expect(json.candidateApproaches.length).toBeGreaterThan(0);
    expect(json.progressiveHints.length).toBeGreaterThan(0);
    expect(json.citedPatterns.length).toBeGreaterThan(0);
  });
});
