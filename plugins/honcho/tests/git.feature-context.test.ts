import { describe, expect, it } from "vitest";
import { inferFeatureContext } from "../src/git.js";
import type { GitState } from "../src/cache.js";

function makeState(over: Partial<GitState> = {}): GitState {
  return {
    branch: "main",
    commit: "abc123",
    commitMessage: "",
    isDirty: false,
    dirtyFiles: [],
    timestamp: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("inferFeatureContext", () => {
  it("derives type=feature from a feat/ branch prefix", () => {
    const ctx = inferFeatureContext(makeState({ branch: "feat/add-search" }));
    expect(ctx.type).toBe("feature");
    expect(ctx.description).toMatch(/search/i);
  });

  it("derives type=fix from fix/ prefix", () => {
    expect(inferFeatureContext(makeState({ branch: "fix/null-deref" })).type).toBe("fix");
  });

  it("falls back to commit-message types when branch is unprefixed", () => {
    const ctx = inferFeatureContext(makeState({ branch: "wip" }), [
      "abc123 refactor(api): clean up handler",
      "def456 refactor: split modules",
    ]);
    expect(ctx.type).toBe("refactor");
  });

  it("returns type=unknown when nothing classifies", () => {
    expect(inferFeatureContext(makeState({ branch: "main" })).type).toBe("unknown");
  });

  it("infers areas from dirty file paths", () => {
    const ctx = inferFeatureContext(
      makeState({
        branch: "feat/auth-rework",
        isDirty: true,
        dirtyFiles: ["src/auth/login.ts", "src/api/handler.ts"],
      }),
    );
    expect(ctx.areas).toEqual(expect.arrayContaining(["auth", "api"]));
  });

  it("caps keywords at 10", () => {
    const ctx = inferFeatureContext(
      makeState({ branch: "feat/" + "alpha-beta-gamma-delta-epsilon-zeta-eta-theta-iota-kappa-lambda" }),
    );
    expect(ctx.keywords.length).toBeLessThanOrEqual(10);
  });

  it("upgrades confidence when branch type and keywords are both present", () => {
    const ctx = inferFeatureContext(makeState({ branch: "feat/improve-cache-invalidation-logic" }));
    expect(ctx.confidence).toBe("high");
  });

  it("falls back to the commit message when the branch yields no description", () => {
    // Empty branch is the path where parseBranchName returns {description: ""}
    // and inferFeatureContext drops to the commit-message fallback.
    const ctx = inferFeatureContext(
      makeState({ branch: "", commitMessage: "fix(api): handle 429 response" }),
    );
    expect(ctx.description).toMatch(/handle 429/);
  });
});
