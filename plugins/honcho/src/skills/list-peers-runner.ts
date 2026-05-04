#!/usr/bin/env bun
/**
 * Runner that prints peers in a workspace as JSON. The workspace ID comes
 * from `HONCHO_LIST_WORKSPACE` (overridden) or the configured workspace,
 * letting the setup skill list peers in the just-chosen workspace before
 * the user picks their identity.
 */
import { loadConfig } from "../config.js";
import { listPeers } from "../workspaces.js";

async function main(): Promise<void> {
  const config = loadConfig();
  if (!config) {
    console.log(JSON.stringify({ ok: false, peers: [], error: "not configured" }));
    process.exit(1);
  }

  const workspaceId = process.env.HONCHO_LIST_WORKSPACE || config.workspace;
  if (!workspaceId) {
    console.log(JSON.stringify({ ok: false, peers: [], error: "no workspace configured" }));
    process.exit(1);
  }

  const result = await listPeers(config, workspaceId);
  // Surface the configured aiPeer so the skill can label/filter it in the
  // picker -- otherwise users see "claude" alongside their own identity and
  // have to know not to pick it.
  console.log(JSON.stringify({ ...result, aiPeer: config.aiPeer, workspace: workspaceId }));
  if (!result.ok) process.exit(1);
}

main();
