import { describe, expect, it } from "vitest";
import { resolveConfig } from "../src/config.js";

const baseEnv = { HONCHO_API_KEY: "k" } as NodeJS.ProcessEnv;

describe("resolveConfig precedence", () => {
  it("returns null when no apiKey anywhere", () => {
    expect(resolveConfig({}, "claude_code", {})).toBeNull();
  });

  it("uses raw.apiKey when env has none", () => {
    expect(resolveConfig({ apiKey: "raw" }, "claude_code", {})?.apiKey).toBe("raw");
  });

  it("env HONCHO_API_KEY overrides raw.apiKey", () => {
    expect(
      resolveConfig({ apiKey: "raw" }, "claude_code", { HONCHO_API_KEY: "env" })?.apiKey,
    ).toBe("env");
  });

  it("hosts.<host>.workspace beats root workspace", () => {
    const cfg = resolveConfig(
      { workspace: "root-ws", hosts: { claude_code: { workspace: "host-ws" } } },
      "claude_code",
      baseEnv,
    );
    expect(cfg?.workspace).toBe("host-ws");
  });

  it("falls back to root workspace when no host block exists", () => {
    const cfg = resolveConfig({ workspace: "root-ws" }, "claude_code", baseEnv);
    expect(cfg?.workspace).toBe("root-ws");
  });

  it("HONCHO_WORKSPACE env applies only when no host block", () => {
    const noHost = resolveConfig({}, "claude_code", { ...baseEnv, HONCHO_WORKSPACE: "from-env" });
    expect(noHost?.workspace).toBe("from-env");

    const withHost = resolveConfig(
      { hosts: { claude_code: { workspace: "host-ws" } } },
      "claude_code",
      { ...baseEnv, HONCHO_WORKSPACE: "from-env" },
    );
    expect(withHost?.workspace).toBe("host-ws");
  });

  it("globalOverride=true makes flat fields apply across hosts", () => {
    const cfg = resolveConfig(
      {
        workspace: "shared",
        globalOverride: true,
        hosts: { claude_code: { workspace: "should-be-ignored" } },
      },
      "claude_code",
      baseEnv,
    );
    expect(cfg?.workspace).toBe("shared");
  });

  it("defaults workspace per host when nothing else set", () => {
    const cc = resolveConfig({}, "claude_code", baseEnv);
    expect(cc?.workspace).toBe("claude_code");
    const cur = resolveConfig({}, "cursor", baseEnv);
    expect(cur?.workspace).toBe("cursor");
  });

  it("aiPeer falls through host > legacy claudePeer/cursorPeer > default", () => {
    const hostBlock = resolveConfig(
      { hosts: { claude_code: { aiPeer: "host-ai" } } },
      "claude_code",
      baseEnv,
    );
    expect(hostBlock?.aiPeer).toBe("host-ai");

    const legacy = resolveConfig({ claudePeer: "legacy-ai" }, "claude_code", baseEnv);
    expect(legacy?.aiPeer).toBe("legacy-ai");

    const dflt = resolveConfig({}, "claude_code", baseEnv);
    expect(dflt?.aiPeer).toBe("claude");
  });

  // Discovered behavior: HONCHO_PEER_NAME unconditionally overrides raw.peerName
  // because mergeWithEnvVars() runs after the initial assignment. This contradicts
  // the apparent `raw.peerName || env.HONCHO_PEER_NAME` precedence in resolveConfig.
  // Locking the actual behavior here; reconcile in a follow-up.
  it("peerName: HONCHO_PEER_NAME overrides raw, USER is final fallback", () => {
    expect(
      resolveConfig({ peerName: "raw" }, "claude_code", { ...baseEnv, HONCHO_PEER_NAME: "env" })
        ?.peerName,
    ).toBe("env");
    expect(
      resolveConfig({ peerName: "raw" }, "claude_code", baseEnv)?.peerName,
    ).toBe("raw");
    expect(
      resolveConfig({}, "claude_code", { ...baseEnv, USER: "alice" })?.peerName,
    ).toBe("alice");
  });

  it("HONCHO_ENABLED=false forces enabled=false at runtime", () => {
    const cfg = resolveConfig({ enabled: true }, "claude_code", {
      ...baseEnv,
      HONCHO_ENABLED: "false",
    });
    expect(cfg?.enabled).toBe(false);
  });

  it("matches host with - or _ separator interchangeably", () => {
    const cfg = resolveConfig(
      { hosts: { "claude-code": { workspace: "dashed" } } },
      "claude_code",
      baseEnv,
    );
    expect(cfg?.workspace).toBe("dashed");
  });
});
