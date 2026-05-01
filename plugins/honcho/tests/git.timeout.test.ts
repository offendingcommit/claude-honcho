import { describe, expect, it, vi, beforeEach } from "vitest";
import * as childProcess from "child_process";
import * as fs from "fs";

vi.mock("child_process", async () => {
  const actual = await vi.importActual<typeof import("child_process")>("child_process");
  return { ...actual, execSync: vi.fn() };
});

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  return { ...actual, existsSync: vi.fn(() => true) };
});

const execSync = vi.mocked(childProcess.execSync);
const existsSync = vi.mocked(fs.existsSync);

beforeEach(() => {
  execSync.mockReset();
  existsSync.mockReset();
  existsSync.mockReturnValue(true);
});

describe("gitCommand timeout contract", () => {
  it("passes a hard timeout to execSync", async () => {
    execSync.mockReturnValue("main\n");
    const { gitCommand } = await import("../src/git.js");

    gitCommand("/x/repo", "rev-parse --abbrev-ref HEAD");

    expect(execSync).toHaveBeenCalledTimes(1);
    const opts = execSync.mock.calls[0][1] as { timeout?: number };
    expect(opts.timeout).toBeGreaterThan(0);
    expect(opts.timeout).toBeLessThanOrEqual(2000);
  });

  it("returns null on subprocess timeout (does not throw)", async () => {
    execSync.mockImplementation(() => {
      const err = new Error("ETIMEDOUT") as NodeJS.ErrnoException;
      err.code = "ETIMEDOUT";
      throw err;
    });
    const { gitCommand } = await import("../src/git.js");

    expect(gitCommand("/x/repo", "status")).toBeNull();
  });

  it("captureGitState returns ≤2s when every git call times out", async () => {
    execSync.mockImplementation(() => {
      const err = new Error("ETIMEDOUT") as NodeJS.ErrnoException;
      err.code = "ETIMEDOUT";
      throw err;
    });
    const { captureGitState } = await import("../src/git.js");

    const start = Date.now();
    const result = captureGitState("/x/repo");
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(result).not.toBeNull();
    expect(result?.branch).toBe("unknown");
  });
});
