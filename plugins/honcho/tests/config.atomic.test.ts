import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const { renameSyncMock } = vi.hoisted(() => ({ renameSyncMock: vi.fn() }));

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return { ...actual, renameSync: renameSyncMock };
});

// Default behavior: delegate to the real renameSync. Tests that simulate
// a failed rename override via mockImplementationOnce.
beforeEach(async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  renameSyncMock.mockReset();
  renameSyncMock.mockImplementation((from: string, to: string) =>
    actual.renameSync(from, to),
  );
});

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "honcho-atomic-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("atomicWriteFileSync", () => {
  it("writes the new content when rename succeeds", async () => {
    const { atomicWriteFileSync } = await import("../src/config.js");
    const target = join(dir, "config.json");
    atomicWriteFileSync(target, '{"a":1}');
    expect(readFileSync(target, "utf-8")).toBe('{"a":1}');
  });

  it("overwrites existing content atomically", async () => {
    const { atomicWriteFileSync } = await import("../src/config.js");
    const target = join(dir, "config.json");
    writeFileSync(target, '{"old":true}');
    atomicWriteFileSync(target, '{"new":true}');
    expect(JSON.parse(readFileSync(target, "utf-8"))).toEqual({ new: true });
  });

  it("preserves the original file when rename throws", async () => {
    const { atomicWriteFileSync } = await import("../src/config.js");
    const target = join(dir, "config.json");
    const original = '{"keep":"me"}';
    writeFileSync(target, original);

    renameSyncMock.mockImplementationOnce(() => {
      throw new Error("EXDEV: cross-device link not permitted");
    });

    expect(() => atomicWriteFileSync(target, '{"new":"content"}')).toThrow();
    expect(readFileSync(target, "utf-8")).toBe(original);
  });

  it("leaves no orphaned tmp files when rename throws", async () => {
    const { atomicWriteFileSync } = await import("../src/config.js");
    const target = join(dir, "config.json");
    writeFileSync(target, "{}");

    renameSyncMock.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    try { atomicWriteFileSync(target, "{}"); } catch {}

    const orphans = readdirSync(dir).filter((f) => f.includes(".tmp."));
    expect(orphans).toEqual([]);
  });

  it("never produces a truncated/half-written file under failure", async () => {
    const { atomicWriteFileSync } = await import("../src/config.js");
    const target = join(dir, "config.json");
    writeFileSync(target, '{"valid":true}');

    renameSyncMock.mockImplementationOnce(() => {
      throw new Error("disk full");
    });

    try { atomicWriteFileSync(target, '{"replacement":true}'); } catch {}

    expect(existsSync(target)).toBe(true);
    expect(() => JSON.parse(readFileSync(target, "utf-8"))).not.toThrow();
  });
});
