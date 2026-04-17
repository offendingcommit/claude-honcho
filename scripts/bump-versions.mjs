#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const version = process.argv[2];
if (!version) {
  console.error("Usage: bump-versions.mjs <version>");
  process.exit(1);
}

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
