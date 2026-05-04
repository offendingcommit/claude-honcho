import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = join(__dirname, "..", "..", "..");

const versionSources: Array<{ file: string; path: Array<string | number> }> = [
  { file: "package.json", path: ["version"] },
  { file: "plugins/honcho/package.json", path: ["version"] },
  { file: "plugins/honcho/.claude-plugin/plugin.json", path: ["version"] },
  { file: "plugins/honcho-dev/.claude-plugin/plugin.json", path: ["version"] },
  { file: ".claude-plugin/marketplace.json", path: ["metadata", "version"] },
  { file: ".claude-plugin/marketplace.json", path: ["plugins", 0, "version"] },
  { file: ".claude-plugin/marketplace.json", path: ["plugins", 1, "version"] },
];

function readAt(file: string, path: Array<string | number>): string {
  const raw = readFileSync(join(repoRoot, file), "utf-8");
  let cur: unknown = JSON.parse(raw);
  for (const seg of path) {
    cur = (cur as Record<string | number, unknown>)[seg];
  }
  if (typeof cur !== "string") {
    throw new Error(`expected string at ${file}:${path.join(".")}, got ${typeof cur}`);
  }
  return cur;
}

describe("version sync", () => {
  it("all version-bearing fields share the same value", () => {
    const versions = versionSources.map((s) => ({
      where: `${s.file}:${s.path.join(".")}`,
      version: readAt(s.file, s.path),
    }));

    const first = versions[0].version;
    for (const v of versions) {
      expect(v.version, `${v.where} drifted from ${versions[0].where}`).toBe(first);
    }
  });

  it("version matches semver", () => {
    const v = readAt("package.json", ["version"]);
    expect(v).toMatch(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/);
  });
});
