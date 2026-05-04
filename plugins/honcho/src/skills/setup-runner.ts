#!/usr/bin/env bun
import {
  loadConfig,
  loadConfigFromEnv,
  saveConfig,
  getConfigPath,
  configExists,
  setDetectedHost,
  getEndpointInfo,
  saveRootField,
} from "../config.js";
import {
  checkHonchoServer,
  checkHonchoAuth,
  gatherSummary,
  getServerProbeUrl,
} from "../health.js";
import * as s from "../styles.js";

async function setup(): Promise<void> {
  // Default to claude_code for this runner
  setDetectedHost("claude_code");

  console.log("");
  console.log(s.header("honcho setup"));
  console.log("");

  // Check for API key — env var takes precedence, then config file
  let apiKey = process.env.HONCHO_API_KEY;
  let keySource = "environment";

  if (!apiKey) {
    // Try reading from config file
    try {
      const { readFileSync } = await import("fs");
      const configRaw = readFileSync(getConfigPath(), "utf-8");
      const configData = JSON.parse(configRaw);
      apiKey = configData.apiKey;
      keySource = "config";
    } catch {
      // No config file or no apiKey in it
    }
  }

  if (!apiKey) {
    console.log(s.warn("No API key found (checked env and config)"));
    console.log("");
    console.log("  1. Get a free key at https://app.honcho.dev");
    if (process.platform === "win32") {
      console.log("  2. Set it in PowerShell:");
      console.log(s.dim('     setx HONCHO_API_KEY "your-key-here"'));
    } else {
      console.log("  2. Add to ~/.zshrc or ~/.bashrc:");
      console.log(s.dim('     export HONCHO_API_KEY="your-key-here"'));
    }
    console.log("  3. Restart Claude Code and run /honcho:setup");
    process.exit(1);
  }

  console.log(s.success(`API key found (${keySource})`));
  console.log("");

  // Validate connection
  console.log(s.section("Validating connection"));
  const config = loadConfig() || loadConfigFromEnv();
  if (!config) {
    console.log(s.warn("Failed to build config from environment"));
    process.exit(1);
  }

  const endpointInfo = getEndpointInfo(config);
  console.log(`  ${s.label("Endpoint")}:    ${endpointInfo.url} ${s.dim(`(${endpointInfo.type})`)}`);

  // Liveness probe -- soft warn. Hits /openapi.json (FastAPI default) since
  // real Honcho deployments don't expose /health on the API server.
  const server = await checkHonchoServer(config);
  if (server.ok) {
    const versionTag = server.serverVersion ? `Honcho ${server.serverVersion}` : "ok";
    console.log(`  ${s.label("Server")}:      ${s.success(versionTag)} ${s.dim(`(${server.durationMs}ms)`)}`);
  } else {
    const detail = server.httpStatus ? `HTTP ${server.httpStatus}` : server.error ?? "unknown";
    console.log(`  ${s.label("Server")}:      ${s.warn("unreachable")} ${s.dim(`(${detail} @ ${getServerProbeUrl(config)})`)}`);
    console.log(s.dim("    Continuing to auth check -- some deployments hide /openapi.json."));
  }

  // Auth check
  const auth = await checkHonchoAuth(config);
  if (!auth.ok) {
    const label = auth.reason === "no-key"
      ? "missing API key"
      : auth.reason === "unauthorized"
      ? "unauthorized"
      : auth.reason === "network"
      ? "network failure"
      : "failed";
    console.log(`  ${s.label("Auth")}:        ${s.error(label)}${auth.message ? ` ${s.dim(auth.message.slice(0, 60))}` : ""}`);
    if (auth.reason === "unauthorized") {
      console.log(s.dim("    API key may be invalid. Get a new one at https://app.honcho.dev"));
    }
    process.exit(1);
  }
  console.log(`  ${s.label("Auth")}:        ${s.success("ok")} ${s.dim(`(${auth.durationMs}ms)`)}`);
  console.log(`  ${s.label("Workspace")}:   ${config.workspace}`);
  console.log(`  ${s.label("Peers")}:       ${config.peerName} / ${config.aiPeer}`);

  // Warm fuzzies: gather queue + conclusions in parallel post-auth so the
  // user sees concrete proof that memory is wired up end-to-end.
  const summary = await gatherSummary(config);
  if (summary.ok) {
    if (summary.conclusionsCount !== undefined) {
      const memoryDetail = summary.conclusionsCount > 0
        ? `${summary.conclusionsCount} conclusions stored`
        : `empty -- will build as you chat`;
      console.log(`  ${s.label("Memory")}:      ${s.success(memoryDetail)}`);
    }
    if (summary.queue) {
      const q = summary.queue;
      const queueDetail = q.total > 0
        ? `${q.completed}/${q.total} observed${q.inProgress > 0 ? `, ${q.inProgress} active` : ""}`
        : "idle";
      console.log(`  ${s.label("Deriver")}:     ${s.success(queueDetail)}`);
    }
  }
  console.log("");

  // Persist config. Root-level globals (apiKey, peerName) are owned by the
  // user/CLI and only written on first install — so a pre-written self-hosted
  // config (e.g. from the setup skill) keeps its root scope. saveConfig is
  // idempotent: it merges with existing values and only writes host overrides
  // when they differ from root, so calling it on every run is safe.
  const isFirstInstall = !configExists();
  console.log(s.section(isFirstInstall ? "Creating config" : "Updating config"));
  try {
    if (isFirstInstall) {
      saveRootField("apiKey", config.apiKey);
      saveRootField("peerName", config.peerName);
    }
    saveConfig({
      apiKey: config.apiKey,
      peerName: config.peerName,
      workspace: config.workspace,
      aiPeer: config.aiPeer,
      endpoint: config.endpoint,
      saveMessages: true,
      enabled: true,
      logging: true,
    });
    console.log(s.success(`Written to ${getConfigPath()}`));
  } catch (err) {
    console.log(s.warn(`Failed to write config: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
  console.log("");

  console.log(s.success("Setup complete -- Honcho memory is ready"));
  console.log("");
}

setup();
