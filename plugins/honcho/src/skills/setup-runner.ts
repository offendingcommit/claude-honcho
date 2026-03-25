#!/usr/bin/env bun
import { Honcho } from "@honcho-ai/sdk";
import {
  loadConfig,
  loadConfigFromEnv,
  saveConfig,
  getConfigPath,
  getConfigDir,
  getHonchoClientOptions,
  getDetectedHost,
  getDefaultWorkspace,
  getDefaultAiPeer,
  configExists,
  setDetectedHost,
} from "../config.js";
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

  try {
    const honcho = new Honcho(getHonchoClientOptions(config));
    const session = await honcho.session("setup-test");
    const peer = await honcho.peer(config.peerName);
    console.log(s.success("Connected to Honcho API"));
    console.log(`  ${s.label("Workspace")}: ${config.workspace}`);
    console.log(`  ${s.label("Peer")}:      ${config.peerName}`);
    console.log(`  ${s.label("AI Peer")}:   ${config.aiPeer}`);
    console.log("");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(s.warn(`Connection failed: ${msg}`));
    if (msg.includes("401") || msg.includes("auth")) {
      console.log(s.dim("  API key may be invalid. Get a new one at https://app.honcho.dev"));
    }
    process.exit(1);
  }

  // Write config if it doesn't exist
  if (!configExists()) {
    console.log(s.section("Creating config"));
    try {
      // Root-level globals (owned by user/CLI, written only at initial setup)
      const { saveRootField } = await import("../config.js");
      saveRootField("apiKey", config.apiKey);
      saveRootField("peerName", config.peerName);
      // Per-host config goes in hosts.claude_code via saveConfig
      saveConfig({
        apiKey: config.apiKey,
        peerName: config.peerName,
        workspace: config.workspace,
        aiPeer: config.aiPeer,
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
  } else {
    console.log(s.dim(`Config already exists at ${getConfigPath()}`));
    console.log("");
  }

  console.log(s.success("Setup complete -- Honcho memory is ready"));
  console.log("");
}

setup();
