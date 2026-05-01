import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { detectHost } from "../src/config.js";

const savedEnv: Record<string, string | undefined> = {};
const envKeys = ["HONCHO_HOST", "CURSOR_PROJECT_DIR"];

beforeEach(() => {
  for (const k of envKeys) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of envKeys) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("detectHost", () => {
  it("defaults to claude_code with no signals", () => {
    expect(detectHost()).toBe("claude_code");
  });

  it("HONCHO_HOST=cursor wins over everything", () => {
    process.env.HONCHO_HOST = "cursor";
    process.env.CURSOR_PROJECT_DIR = "/x";
    expect(detectHost({ cursor_version: "1.0" })).toBe("cursor");
  });

  it("rejects an invalid HONCHO_HOST value and falls through", () => {
    process.env.HONCHO_HOST = "garbage";
    expect(detectHost()).toBe("claude_code");
  });

  it("stdin cursor_version triggers cursor host", () => {
    expect(detectHost({ cursor_version: "1.2.3" })).toBe("cursor");
  });

  it("CURSOR_PROJECT_DIR triggers cursor host (Claude Code spawned inside Cursor)", () => {
    process.env.CURSOR_PROJECT_DIR = "/some/project";
    expect(detectHost()).toBe("cursor");
  });

  it("accepts obsidian when set explicitly", () => {
    process.env.HONCHO_HOST = "obsidian";
    expect(detectHost()).toBe("obsidian");
  });
});
