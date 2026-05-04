#!/usr/bin/env bun
/**
 * Runner script for the status skill.
 * Wraps server + auth checks, then layers on workspace / queue / conclusions.
 */
import { loadConfig, getEndpointInfo, getSessionName } from "../config.js";
import {
  checkHonchoServer,
  checkHonchoAuth,
  gatherSummary,
  getServerProbeUrl,
} from "../health.js";
import * as s from "../styles.js";

async function status(): Promise<void> {
  console.log("");
  console.log(s.header("honcho status"));
  console.log("");

  const config = loadConfig();
  if (!config) {
    console.log(s.warn("Not configured"));
    console.log(s.dim("Set HONCHO_API_KEY environment variable"));
    return;
  }

  const endpointInfo = getEndpointInfo(config);
  console.log(`  ${s.label("Endpoint")}:    ${endpointInfo.url} ${s.dim(`(${endpointInfo.type})`)}`);

  // Server reachability
  const server = await checkHonchoServer(config);
  if (server.ok) {
    const versionTag = server.serverVersion ? `Honcho ${server.serverVersion}` : "ok";
    console.log(`  ${s.label("Server")}:      ${s.success(versionTag)} ${s.dim(`(${server.durationMs}ms)`)}`);
  } else {
    const detail = server.httpStatus ? `HTTP ${server.httpStatus}` : server.error ?? "unknown";
    console.log(`  ${s.label("Server")}:      ${s.error("unreachable")} ${s.dim(`(${detail} @ ${getServerProbeUrl(config)})`)}`);
  }

  // Auth -- gates the rest of the report.
  const auth = await checkHonchoAuth(config);
  if (auth.ok) {
    console.log(`  ${s.label("Auth")}:        ${s.success("ok")} ${s.dim(`(${auth.durationMs}ms)`)}`);
  } else {
    const label = auth.reason === "no-key"
      ? "missing API key"
      : auth.reason === "unauthorized"
      ? "unauthorized"
      : auth.reason === "network"
      ? "network failure"
      : "failed";
    console.log(`  ${s.label("Auth")}:        ${s.error(label)}${auth.message ? ` ${s.dim(auth.message.slice(0, 60))}` : ""}`);
    console.log("");
    return;
  }

  console.log(`  ${s.label("Workspace")}:   ${config.workspace}`);
  console.log(`  ${s.label("Session")}:     ${getSessionName(process.cwd())}`);
  console.log(`  ${s.label("Peers")}:       ${config.peerName} / ${config.aiPeer}`);

  const summary = await gatherSummary(config);
  if (summary.ok) {
    if (summary.queue) {
      const q = summary.queue;
      if (q.total > 0) {
        const pct = Math.round((q.completed / q.total) * 100);
        let detail = `${q.completed}/${q.total} messages observed (${pct}%)`;
        if (q.inProgress > 0) detail += `, ${q.inProgress} active`;
        if (q.sessions > 0) detail += ` across ${q.sessions} sessions`;
        console.log(`  ${s.label("Observing")}:   ${detail}`);
      } else {
        console.log(`  ${s.label("Observing")}:   ${s.dim("idle")}`);
      }
    }

    if (summary.conclusionsCount !== undefined) {
      console.log(`  ${s.label("Conclusions")}: ${summary.conclusionsCount} ${s.dim(`(${config.peerName})`)}`);
    }
  } else if (summary.error) {
    console.log(`  ${s.label("Detail")}:      ${s.dim(summary.error.slice(0, 60))}`);
  }

  console.log("");
}

status();
