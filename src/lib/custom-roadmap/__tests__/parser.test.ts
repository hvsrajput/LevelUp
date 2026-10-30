import { describe, it, expect } from "vitest";
import {
  parseQuestionLine,
  parseRoadmapText,
  serializeDraft,
} from "../parser";
import type { RoadmapDraft } from "../types";

describe("Custom Roadmap Parser", () => {
  describe("parseQuestionLine", () => {
    it("parses simple problem title", () => {
      const res = parseQuestionLine("Two Sum");
      expect(res.entry.title).toBe("Two Sum");
      expect(res.issues).toHaveLength(0);
    });

    it("strips leading bullets and numbers", () => {
      expect(parseQuestionLine("- Two Sum").entry.title).toBe("Two Sum");
      expect(parseQuestionLine("* Two Sum").entry.title).toBe("Two Sum");
      expect(parseQuestionLine("• Two Sum").entry.title).toBe("Two Sum");
      expect(parseQuestionLine("1. Two Sum").entry.title).toBe("Two Sum");
      expect(parseQuestionLine("1) Two Sum").entry.title).toBe("Two Sum");
    });

    it("parses '#49 Group Anagrams' as LeetCode ID and title", () => {
      const res = parseQuestionLine("#49 Group Anagrams");
      expect(res.entry.leetcodeId).toBe(49);
      expect(res.entry.title).toBe("Group Anagrams");
    });

    it("parses 'LC 49' and 'LeetCode 49'", () => {
      const res1 = parseQuestionLine("LC 49 - Group Anagrams");
      expect(res1.entry.leetcodeId).toBe(49);
      expect(res1.entry.title).toBe("Group Anagrams");

      const res2 = parseQuestionLine("LeetCode 49");
      expect(res2.entry.leetcodeId).toBe(49);
      expect(res2.entry.title).toBe("Problem 49");
    });

    it("parses a digits-only line as LeetCode ID", () => {
      const res = parseQuestionLine("49");
      expect(res.entry.leetcodeId).toBe(49);
      expect(res.entry.title).toBe("Problem 49");
    });

    it("parses leetcode.com URL line for slug only", () => {
      const res = parseQuestionLine(
        "https://leetcode.com/problems/valid-palindrome/"
      );
      expect(res.entry.slug).toBe("valid-palindrome");
      expect(res.entry.title).toBe("Valid Palindrome");
      expect(res.issues).toHaveLength(0);
    });

    it("rejects non-LeetCode URLs with a blocking error", () => {
      const res = parseQuestionLine(
        "https://hackerrank.com/challenges/solve-me-first"
      );
      expect(res.issues).toHaveLength(1);
      expect(res.issues[0].type).toBe("error");
      expect(res.issues[0].message).toContain("Non-LeetCode URL");
    });

    it("parses optional trailing difficulty tags", () => {
      expect(parseQuestionLine("Two Sum (Easy)").entry.difficultyTag).toBe("Easy");
      expect(parseQuestionLine("Group Anagrams [Medium]").entry.difficultyTag).toBe("Medium");
      expect(parseQuestionLine("Trapping Rain Water - Hard").entry.difficultyTag).toBe("Hard");
      expect(parseQuestionLine("Reverse Linked List - easy").entry.difficultyTag).toBe("Easy");
    });

    it("enforces title 200 characters limit", () => {
      const longTitle = "a".repeat(205);
      const res = parseQuestionLine(longTitle);
      expect(res.issues.some((i) => i.type === "error" && i.message.includes("200"))).toBe(true);
    });

    it("sanitizes smart quotes and non-breaking spaces", () => {
      const raw = "“Two\u00A0Sum”";
      const res = parseQuestionLine(raw);
      expect(res.entry.title).toBe('"Two Sum"');
    });
  });

  describe("parseRoadmapText", () => {
    it("parses the specification example accurately", () => {
      const input = `
Week 1: Arrays & Hashing
Day 1
Two Sum
Contains Duplicate
Day 2
Valid Anagram
#49 Group Anagrams
Week 2
Day 1
https://leetcode.com/problems/valid-palindrome/
`.trim();

      const { draft, issues } = parseRoadmapText(input);
      expect(issues.some((i) => i.type === "error")).toBe(false);
      expect(draft.weeks).toHaveLength(2);
      expect(draft.weeks[0].weekNumber).toBe(1);
      expect(draft.weeks[0].title).toBe("Arrays & Hashing");
      expect(draft.weeks[0].days).toHaveLength(2);
      expect(draft.weeks[0].days[0].questions).toHaveLength(2);
      expect(draft.weeks[0].days[0].questions[0].title).toBe("Two Sum");
      expect(draft.weeks[0].days[0].questions[1].title).toBe("Contains Duplicate");
      expect(draft.weeks[0].days[1].questions[1].leetcodeId).toBe(49);
      expect(draft.weeks[1].days[0].questions[0].slug).toBe("valid-palindrome");
    });

    it("parses 'week1/day1' without spaces and mixed case headers", () => {
      const input = `
wEeK1/dAy1: Intro
Two Sum
wK 2
DAY 3 - Graph Traversal
Number of Islands
`.trim();

      const { draft, issues } = parseRoadmapText(input);
      expect(issues.some((i) => i.type === "error")).toBe(false);
      expect(draft.weeks).toHaveLength(2);
      expect(draft.weeks[0].weekNumber).toBe(1);
      expect(draft.weeks[0].days[0].dayNumber).toBe(1);
      expect(draft.weeks[0].days[0].questions[0].title).toBe("Two Sum");
      expect(draft.weeks[1].weekNumber).toBe(2);
      expect(draft.weeks[1].days[0].dayNumber).toBe(3);
      expect(draft.weeks[1].days[0].title).toBe("Graph Traversal");
    });

    it("flags question before any header as blocking error", () => {
      const input = `Two Sum\nWeek 1\nDay 1\nContains Duplicate`;
      const { issues } = parseRoadmapText(input);
      expect(issues.some((i) => i.type === "error" && i.message.includes("appears before any Week or Day"))).toBe(true);
    });

    it("flags Day outside 1..7 as error", () => {
      const input = `Week 1\nDay 8\nTwo Sum`;
      const { issues } = parseRoadmapText(input);
      expect(issues.some((i) => i.type === "error" && i.message.includes("Day 8 is outside"))).toBe(true);
    });

    it("flags Week outside 1..26 as error", () => {
      const input = `Week 27\nDay 1\nTwo Sum`;
      const { issues } = parseRoadmapText(input);
      expect(issues.some((i) => i.type === "error" && i.message.includes("Week 27 is outside"))).toBe(true);
    });

    it("merges duplicate (week, day) with a warning", () => {
      const input = `
Week 1
Day 1
Two Sum
Day 1
Contains Duplicate
`.trim();

      const { draft, issues } = parseRoadmapText(input);
      expect(issues.some((i) => i.type === "warning" && i.message.includes("merging"))).toBe(true);
      expect(draft.weeks[0].days).toHaveLength(1);
      expect(draft.weeks[0].days[0].questions).toHaveLength(2);
    });

    it("deduplicates problems across roadmap, keeping first occurrence", () => {
      const input = `
Week 1
Day 1
Two Sum
Day 2
Two Sum
`.trim();

      const { draft, issues } = parseRoadmapText(input);
      expect(issues.some((i) => i.type === "warning" && i.message.includes("Duplicate problem"))).toBe(true);
      expect(draft.weeks[0].days[0].questions).toHaveLength(1);
      expect(draft.weeks[0].days[1].questions).toHaveLength(0);
    });

    it("emits warning for empty days or skipped weeks", () => {
      const input = `
Week 1
Day 1
Two Sum
Week 3
Day 1
3Sum
`.trim();

      const { issues } = parseRoadmapText(input);
      expect(issues.some((i) => i.type === "warning" && i.message.includes("Skipped week"))).toBe(true);
      expect(issues.some((i) => i.type === "warning" && i.message.includes("no questions"))).toBe(true);
    });

    it("handles CRLF line endings", () => {
      const input = "Week 1\r\nDay 1\r\nTwo Sum\r\nDay 2\r\nContains Duplicate\r\n";
      const { draft, issues } = parseRoadmapText(input);
      expect(issues.some((i) => i.type === "error")).toBe(false);
      expect(draft.weeks[0].days).toHaveLength(2);
    });

    it("enforces 2000-line limit", () => {
      const lines = ["Week 1", "Day 1"];
      for (let i = 0; i < 2005; i++) {
        lines.push(`Problem ${i}`);
      }
      const { issues } = parseRoadmapText(lines.join("\n"));
      expect(issues.some((i) => i.type === "error" && i.message.includes("2000 lines"))).toBe(true);
    });
  });

  describe("serializeDraft and Round Trip", () => {
    it("round trip holds: parse(serialize(draft)).draft equals draft", () => {
      const initial: RoadmapDraft = {
        title: "Custom Roadmap",
        weeks: [
          {
            weekNumber: 1,
            title: "Arrays & Hashing",
            days: [
              {
                dayNumber: 1,
                title: "Basics",
                questions: [
                  { raw: "Two Sum", title: "Two Sum" },
                  { raw: "Contains Duplicate", title: "Contains Duplicate" },
                ],
              },
              {
                dayNumber: 2,
                questions: [
                  { raw: "Valid Anagram", title: "Valid Anagram" },
                  { raw: "#49 Group Anagrams", title: "Group Anagrams", leetcodeId: 49 },
                ],
              },
            ],
          },
          {
            weekNumber: 2,
            days: [
              {
                dayNumber: 1,
                questions: [
                  {
                    raw: "https://leetcode.com/problems/valid-palindrome/",
                    title: "Valid Palindrome",
                    slug: "valid-palindrome",
                  },
                ],
              },
            ],
          },
        ],
      };

      const text = serializeDraft(initial);
      const parsed = parseRoadmapText(text).draft;
      expect(parsed).toEqual(initial);
    });

    it("form input and equivalent pasted text produce identical drafts", () => {
      // 1. Produced via form input assembly
      const formDraft: RoadmapDraft = {
        title: "Custom Roadmap",
        weeks: [
          {
            weekNumber: 1,
            title: "Arrays & Hashing",
            days: [
              {
                dayNumber: 1,
                questions: [
                  parseQuestionLine("Two Sum").entry,
                  parseQuestionLine("Contains Duplicate").entry,
                ],
              },
              {
                dayNumber: 2,
                questions: [
                  parseQuestionLine("Valid Anagram").entry,
                  parseQuestionLine("#49 Group Anagrams").entry,
                ],
              },
            ],
          },
          {
            weekNumber: 2,
            days: [
              {
                dayNumber: 1,
                questions: [
                  parseQuestionLine("https://leetcode.com/problems/valid-palindrome/").entry,
                ],
              },
            ],
          },
        ],
      };

      // 2. Produced via text pasting
      const pasteText = `
Week 1: Arrays & Hashing
Day 1
Two Sum
Contains Duplicate
Day 2
Valid Anagram
#49 Group Anagrams
Week 2
Day 1
https://leetcode.com/problems/valid-palindrome/
`.trim();

      const pastedDraft = parseRoadmapText(pasteText).draft;
      expect(pastedDraft).toEqual(formDraft);
    });
  });
});
