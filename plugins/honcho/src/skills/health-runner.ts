#!/usr/bin/env bun
/**
 * Runner for the /honcho:health skill.
 * Runs server-reachability + auth checks and prints a concise card.
 * Optional --summary flag adds the warm-fuzzy memory/queue panel.
 */
import { loadConfig, getEndpointInfo } from "../config.js";
import { checkHonchoServer, checkHonchoAuth, gatherSummary, getServerProbeUrl } from "../health.js";
import * as s from "../styles.js";

async function main(): Promise<void> {
  console.log("");
  console.log(s.header("honcho health"));
  console.log("");

  const config = loadConfig();
  if (!config) {
    console.log(s.warn("Not configured -- run /honcho:setup first"));
    console.log("");
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
    const detail = server.httpStatus
      ? `HTTP ${server.httpStatus}`
      : server.error ?? "unknown error";
    console.log(`  ${s.label("Server")}:      ${s.error("unreachable")} ${s.dim(`(${detail} @ ${getServerProbeUrl(config)})`)}`);
  }

  // Auth
  const auth = await checkHonchoAuth(config);
  if (auth.ok) {
    console.log(`  ${s.label("Auth")}:        ${s.success("ok")} ${s.dim(`(${auth.durationMs}ms)`)}`);
  } else {
    const label = auth.reason === "no-key"
      ? "missing API key"
      : auth.reason === "unauthorized"
      ? "unauthorized (check API key)"
      : auth.reason === "network"
      ? "network failure"
      : "failed";
    console.log(`  ${s.label("Auth")}:        ${s.error(label)}${auth.message ? ` ${s.dim(auth.message.slice(0, 80))}` : ""}`);
  }

  // Optional summary
  if (auth.ok) {
    const summary = await gatherSummary(config);
    if (summary.ok) {
      if (summary.conclusionsCount !== undefined) {
        const memoryDetail = summary.conclusionsCount > 0
          ? `${summary.conclusionsCount} conclusions stored`
          : `empty`;
        console.log(`  ${s.label("Memory")}:      ${memoryDetail} ${s.dim(`(${config.peerName})`)}`);
      }
      if (summary.queue) {
        const q = summary.queue;
        const queueDetail = q.total > 0
          ? `${q.completed}/${q.total} observed${q.inProgress > 0 ? `, ${q.inProgress} active` : ""}`
          : "idle";
        console.log(`  ${s.label("Deriver")}:     ${queueDetail}`);
      }
    }
  }

  console.log("");

  if (!server.ok || !auth.ok) {
    process.exit(1);
  }
}

main();
