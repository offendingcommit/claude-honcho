#!/usr/bin/env bun
import { rm, chmod } from "node:fs/promises";
import { join } from "node:path";

const root = import.meta.dir;
const distDir = join(root, "dist");

await rm(distDir, { recursive: true, force: true });

const entrypoints = [
  "mcp-server.ts",
  "hooks/session-start.ts",
  "hooks/session-end.ts",
  "hooks/post-tool-use.ts",
  "hooks/user-prompt.ts",
  "hooks/pre-compact.ts",
  "hooks/stop.ts",
  "src/skills/setup-runner.ts",
  "src/skills/status-runner.ts",
];

const result = await Bun.build({
  entrypoints: entrypoints.map((p) => join(root, p)),
  outdir: distDir,
  root,
  target: "bun",
  format: "esm",
  splitting: false,
  sourcemap: "none",
  minify: false,
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

for (const out of result.outputs) {
  if (out.path.endsWith(".js")) await chmod(out.path, 0o755);
}

console.log(`bundled ${result.outputs.length} files to ${distDir}`);
