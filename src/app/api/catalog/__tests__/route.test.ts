import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("Catalog Route Handler", () => {
  it("returns catalog problems with total count", async () => {
    const req = new Request("http://localhost:3000/api/catalog?limit=10");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.problems).toBeDefined();
    expect(json.problems.length).toBeLessThanOrEqual(10);
    expect(json.total).toBeGreaterThan(0);
  });

  it("filters catalog problems by topic", async () => {
    const req = new Request("http://localhost:3000/api/catalog?topic=Array");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.problems.length).toBeGreaterThan(0);
    for (const p of json.problems) {
      expect(p.topicTags.some((t: string) => t.toLowerCase().includes("array"))).toBe(true);
    }
  });
});
