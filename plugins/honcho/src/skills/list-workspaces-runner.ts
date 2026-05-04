#!/usr/bin/env bun
/**
 * Runner that prints the existing Honcho workspaces (visible to the
 * configured API key) as JSON. Consumed by the /honcho:setup skill to
 * present a workspace picker. Output shape matches WorkspacesResult.
 */
import { loadConfig } from "../config.js";
import { listWorkspaces } from "../workspaces.js";

async function main(): Promise<void> {
  const config = loadConfig();
  if (!config) {
    console.log(JSON.stringify({ ok: false, workspaces: [], error: "not configured" }));
    process.exit(1);
  }

  const result = await listWorkspaces(config);
  console.log(JSON.stringify(result));
  if (!result.ok) process.exit(1);
}

main();
