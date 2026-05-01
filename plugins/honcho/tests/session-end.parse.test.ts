import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  parseTranscript,
  isMeaningfulAssistantContent,
  extractWorkItems,
} from "../src/hooks/session-end.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "honcho-parse-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeTranscript(lines: string[]): string {
  const path = join(dir, "transcript.jsonl");
  writeFileSync(path, lines.join("\n") + "\n");
  return path;
}

describe("parseTranscript", () => {
  it("returns [] when path does not exist", () => {
    expect(parseTranscript(join(dir, "nope.jsonl"))).toEqual([]);
  });

  it("returns [] for an empty path string", () => {
    expect(parseTranscript("")).toEqual([]);
  });

  it("skips malformed JSONL lines and continues with valid ones", () => {
    const path = writeTranscript([
      "{not-json",
      JSON.stringify({ type: "user", message: { content: "hi" } }),
      "another bad line",
      JSON.stringify({ type: "assistant", message: { content: "x".repeat(250) } }),
    ]);
    const msgs = parseTranscript(path);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("user");
    expect(msgs[1].role).toBe("assistant");
  });

  it("ignores empty/whitespace-only content", () => {
    const path = writeTranscript([
      JSON.stringify({ type: "user", message: { content: "" } }),
      JSON.stringify({ type: "user", message: { content: "   " } }),
      JSON.stringify({ type: "user", message: { content: "real" } }),
    ]);
    const msgs = parseTranscript(path);
    expect(msgs.map((m) => m.content)).toEqual(["real"]);
  });

  it("flattens text-content arrays into a single string", () => {
    const path = writeTranscript([
      JSON.stringify({
        type: "user",
        message: {
          content: [
            { type: "text", text: "line1" },
            { type: "image", source: "x" },
            { type: "text", text: "line2" },
          ],
        },
      }),
    ]);
    expect(parseTranscript(path)[0].content).toBe("line1\nline2");
  });

  it("annotates assistant messages with isMeaningful and caps meaningful at 3000 chars", () => {
    const meaningful = "I implemented the fix because the bug was in the loop. " + "x".repeat(5000);
    const briefAnnouncement = "I'll run the tests";
    const path = writeTranscript([
      JSON.stringify({ type: "assistant", message: { content: meaningful } }),
      JSON.stringify({ type: "assistant", message: { content: briefAnnouncement } }),
    ]);
    const msgs = parseTranscript(path);
    expect(msgs[0].isMeaningful).toBe(true);
    expect(msgs[0].content.length).toBeLessThanOrEqual(3000);
    expect(msgs[1].isMeaningful).toBe(false);
    expect(msgs[1].content.length).toBeLessThanOrEqual(1500);
  });

  it("appends [Used tools: ...] when assistant text is short and there are tool_uses", () => {
    const path = writeTranscript([
      JSON.stringify({
        type: "assistant",
        message: {
          content: [
            { type: "text", text: "ok" },
            { type: "tool_use", name: "Read", input: {} },
            { type: "tool_use", name: "Edit", input: {} },
          ],
        },
      }),
    ]);
    const msgs = parseTranscript(path);
    expect(msgs[0].content).toContain("[Used tools: Read, Edit]");
  });
});

describe("isMeaningfulAssistantContent", () => {
  it("rejects content under 50 chars", () => {
    expect(isMeaningfulAssistantContent("short")).toBe(false);
  });

  it("rejects short tool announcements", () => {
    expect(
      isMeaningfulAssistantContent("I'll run the tests now to see what happens here"),
    ).toBe(false);
  });

  it("accepts content with reasoning markers", () => {
    expect(
      isMeaningfulAssistantContent(
        "I refactored the handler because the old code had a race condition that surfaced under load.",
      ),
    ).toBe(true);
  });

  it("accepts long content past the length floor regardless of markers", () => {
    expect(isMeaningfulAssistantContent("a".repeat(250))).toBe(true);
  });
});

describe("extractWorkItems", () => {
  it("extracts a deduplicated, capped list of action items", () => {
    const items = extractWorkItems([
      "I created file foo.ts and added tests.",
      "Then I edited foo.ts again.",
      "Implemented the cache layer.",
      "Implemented the cache layer.", // duplicate phrase → should not duplicate
    ]);
    expect(items.length).toBeLessThanOrEqual(10);
    expect(items.length).toBeGreaterThan(0);
    // Items are deduplicated (set semantics)
    expect(new Set(items).size).toBe(items.length);
  });

  it("returns [] when nothing matches the action patterns", () => {
    expect(extractWorkItems(["hello world"])).toEqual([]);
  });
});
