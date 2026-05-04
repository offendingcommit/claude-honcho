#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const baseVersion = process.argv[2];
if (!baseVersion) {
  console.error("Usage: bump-versions.mjs <version>");
  process.exit(1);
}
// Fork suffix — keeps file versions aligned with the v${version}-oc tag format
const version = baseVersion.includes("-") ? baseVersion : `${baseVersion}-oc`;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const targets = [
  { path: "package.json", key: "version" },
  { path: ".claude-plugin/marketplace.json", key: "metadata.version", alsoBumpPluginsArray: true },
  { path: "plugins/honcho/.claude-plugin/plugin.json", key: "version" },
  { path: "plugins/honcho/package.json", key: "version" },
  { path: "plugins/honcho-dev/.claude-plugin/plugin.json", key: "version" },
];

const setNested = (obj, dotted, value) => {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
  cur[parts[parts.length - 1]] = value;
};

for (const t of targets) {
  const p = join(root, t.path);
  const json = JSON.parse(readFileSync(p, "utf8"));
  setNested(json, t.key, version);
  if (t.alsoBumpPluginsArray && Array.isArray(json.plugins)) {
    for (const plugin of json.plugins) plugin.version = version;
  }
  writeFileSync(p, JSON.stringify(json, null, 2) + "\n");
  console.log(`bumped ${t.path} -> ${version}`);
}

// README version badge — shields.io URL-encodes the dash in `1.0.1-oc` to `--`
const badgeVersion = version.replace(/-/g, "--");
const readmePath = join(root, "README.md");
const readme = readFileSync(readmePath, "utf8");
const updated = readme.replace(
  /(\[!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-).+?(-blue\))/,
  `$1${badgeVersion}$2`,
);
if (updated !== readme) {
  writeFileSync(readmePath, updated);
  console.log(`bumped README.md badge -> ${version}`);
}

