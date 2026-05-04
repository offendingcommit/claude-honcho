import { describe, expect, it } from "vitest";
import { deriveSessionName } from "../src/config.js";

describe("deriveSessionName", () => {
  describe("per-directory", () => {
    it("uses {peer}-{repo} by default", () => {
      expect(
        deriveSessionName({
          strategy: "per-directory",
          cwd: "/Volumes/dev/claude-honcho",
          peerName: "alice",
          usePrefix: true,
        }),
      ).toBe("alice-claude-honcho");
    });

    it("omits peer prefix when usePrefix=false", () => {
      expect(
        deriveSessionName({
          strategy: "per-directory",
          cwd: "/some/path/my-repo",
          peerName: "alice",
          usePrefix: false,
        }),
      ).toBe("my-repo");
    });

    it("honors override when present", () => {
      expect(
        deriveSessionName({
          strategy: "per-directory",
          cwd: "/x/y/z",
          peerName: "j",
          usePrefix: true,
          override: "custom-session",
        }),
      ).toBe("custom-session");
    });

    it("sanitizes uppercase and special chars in repo basename", () => {
      expect(
        deriveSessionName({
          strategy: "per-directory",
          cwd: "/x/My Cool Project!",
          peerName: "j",
          usePrefix: true,
        }),
      ).toBe("j-my-cool-project-");
    });
  });

  describe("git-branch", () => {
    it("appends sanitized branch", () => {
      expect(
        deriveSessionName({
          strategy: "git-branch",
          cwd: "/x/repo",
          peerName: "j",
          usePrefix: true,
          branch: "feat/Add-Stuff",
        }),
      ).toBe("j-repo-feat-add-stuff");
    });

    it("falls back to base when branch is missing", () => {
      expect(
        deriveSessionName({
          strategy: "git-branch",
          cwd: "/x/repo",
          peerName: "j",
          usePrefix: true,
          branch: null,
        }),
      ).toBe("j-repo");
    });

    it("ignores override (override only applies to per-directory)", () => {
      expect(
        deriveSessionName({
          strategy: "git-branch",
          cwd: "/x/repo",
          peerName: "j",
          usePrefix: true,
          branch: "main",
          override: "should-be-ignored",
        }),
      ).toBe("j-repo-main");
    });
  });

  describe("chat-instance", () => {
    it("uses {peer}-chat-{instanceId} by default", () => {
      expect(
        deriveSessionName({
          strategy: "chat-instance",
          cwd: "/x/repo",
          peerName: "j",
          usePrefix: true,
          instanceId: "abc123",
        }),
      ).toBe("j-chat-abc123");
    });

    it("uses chat-{instanceId} when usePrefix=false", () => {
      expect(
        deriveSessionName({
          strategy: "chat-instance",
          cwd: "/x/repo",
          peerName: "j",
          usePrefix: false,
          instanceId: "abc123",
        }),
      ).toBe("chat-abc123");
    });

    it("falls back to base when instanceId missing", () => {
      expect(
        deriveSessionName({
          strategy: "chat-instance",
          cwd: "/x/repo",
          peerName: "j",
          usePrefix: true,
          instanceId: null,
        }),
      ).toBe("j-repo");
    });
  });

  it("defaults peerName to 'user' when empty string provided", () => {
    expect(
      deriveSessionName({
        strategy: "per-directory",
        cwd: "/x/repo",
        peerName: "",
        usePrefix: true,
      }),
    ).toBe("user-repo");
  });
});
