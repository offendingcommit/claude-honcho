import { describe, expect, it } from "vitest";
import { chunkContent } from "../src/cache.js";

describe("chunkContent", () => {
  it("returns the input unchanged when within maxSize", () => {
    expect(chunkContent("hello", 100)).toEqual(["hello"]);
  });

  it("never produces a chunk larger than maxSize for the chunked path", () => {
    const max = 10;
    const input = "a".repeat(35);
    const chunks = chunkContent(input, max);
    expect(chunks.length).toBeGreaterThan(1);
    // Chunks are prefixed with `[Part i/N] ` — strip that, original payload
    // is bounded by maxSize.
    for (const c of chunks) {
      const payload = c.replace(/^\[Part \d+\/\d+\] /, "");
      expect(payload.length).toBeLessThanOrEqual(max);
    }
  });

  it("preserves the full payload across chunks (modulo boundary trimming)", () => {
    const input = "abcdefghij".repeat(10); // 100 chars, no spaces/newlines
    const chunks = chunkContent(input, 30);
    const recovered = chunks
      .map((c) => c.replace(/^\[Part \d+\/\d+\] /, ""))
      .join("");
    expect(recovered).toBe(input);
  });

  it("prefers newline boundaries when one is in the trailing 75% of the window", () => {
    const left = "x".repeat(20);
    const right = "y".repeat(20);
    const input = `${left}\n${right}`;
    const chunks = chunkContent(input, 25);
    // First chunk should end at the newline, not mid-x.
    expect(chunks[0]).toMatch(/^\[Part 1\/\d+\] x+$/);
  });

  it("hard-splits when there is no usable boundary in the window", () => {
    const input = "x".repeat(50); // no spaces/newlines anywhere
    const chunks = chunkContent(input, 10);
    expect(chunks.length).toBeGreaterThanOrEqual(5);
    for (const c of chunks) {
      const payload = c.replace(/^\[Part \d+\/\d+\] /, "");
      expect(payload.length).toBeLessThanOrEqual(10);
    }
  });

  it("does not prefix when only a single chunk results", () => {
    expect(chunkContent("under the cap")[0]).not.toMatch(/^\[Part /);
  });

  it("handles empty input", () => {
    expect(chunkContent("")).toEqual([""]);
  });
});
