#!/usr/bin/env bun
// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __require = import.meta.require;

// src/config.ts
import { homedir as homedir2 } from "os";
import { join as join3, basename } from "path";
import { existsSync as existsSync3, mkdirSync as mkdirSync2, readFileSync as readFileSync2, renameSync, unlinkSync, writeFileSync as writeFileSync2 } from "fs";

// src/git.ts
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
function isGitRepo(cwd) {
  return existsSync(join(cwd, ".git"));
}
var GIT_TIMEOUT_MS = 1500;
function gitCommand(cwd, args) {
  try {
    return execSync(`git ${args}`, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: GIT_TIMEOUT_MS
    }).trim();
  } catch {
    return null;
  }
}
function captureGitState(cwd) {
  if (!isGitRepo(cwd)) {
    return null;
  }
  const branch = gitCommand(cwd, "rev-parse --abbrev-ref HEAD") || "unknown";
  const commit = gitCommand(cwd, "rev-parse --short HEAD") || "unknown";
  const commitMessage = gitCommand(cwd, "log -1 --format=%s") || "";
  const statusOutput = gitCommand(cwd, "status --porcelain") || "";
  const isDirty = statusOutput.length > 0;
  const dirtyFiles = isDirty ? statusOutput.split(`
`).filter((line) => line.trim()).map((line) => line.slice(3).trim()).slice(0, 20) : [];
  return {
    branch,
    commit,
    commitMessage,
    isDirty,
    dirtyFiles,
    timestamp: new Date().toISOString()
  };
}
function getRecentCommits(cwd, count = 5) {
  if (!isGitRepo(cwd)) {
    return [];
  }
  const output = gitCommand(cwd, `log -${count} --oneline`);
  if (!output)
    return [];
  return output.split(`
`).filter((line) => line.trim());
}
var BRANCH_TYPE_PATTERNS = [
  { pattern: /^(feat|feature)[/-]/i, type: "feature" },
  { pattern: /^(fix|bugfix|hotfix)[/-]/i, type: "fix" },
  { pattern: /^(refactor|refactoring)[/-]/i, type: "refactor" },
  { pattern: /^(docs|documentation)[/-]/i, type: "docs" },
  { pattern: /^(test|tests|testing)[/-]/i, type: "test" },
  { pattern: /^(chore|build|ci)[/-]/i, type: "chore" }
];
var COMMIT_TYPE_PATTERNS = [
  { pattern: /^feat(\(.+\))?:/i, type: "feature" },
  { pattern: /^fix(\(.+\))?:/i, type: "fix" },
  { pattern: /^refactor(\(.+\))?:/i, type: "refactor" },
  { pattern: /^docs(\(.+\))?:/i, type: "docs" },
  { pattern: /^test(\(.+\))?:/i, type: "test" },
  { pattern: /^chore(\(.+\))?:/i, type: "chore" },
  { pattern: /^(build|ci)(\(.+\))?:/i, type: "chore" }
];
var PATH_AREA_PATTERNS = [
  { pattern: /\/(api|routes|endpoints)\//i, area: "api" },
  { pattern: /\/(auth|authentication|login)\//i, area: "auth" },
  { pattern: /\/(ui|components|views|pages)\//i, area: "ui" },
  { pattern: /\/(hooks)\//i, area: "hooks" },
  { pattern: /\/(config|settings)\//i, area: "config" },
  { pattern: /\/(test|tests|__tests__|spec)\//i, area: "testing" },
  { pattern: /\/(docs|documentation)\//i, area: "docs" },
  { pattern: /\/(utils|helpers|lib)\//i, area: "utils" },
  { pattern: /\/(cache|storage)\//i, area: "cache" },
  { pattern: /\/(cli|commands)\//i, area: "cli" },
  { pattern: /\/(skills)\//i, area: "skills" },
  { pattern: /\.(md|mdx)$/i, area: "docs" },
  { pattern: /\.(test|spec)\.(ts|js|tsx|jsx)$/i, area: "testing" }
];
function extractKeywords(text) {
  const cleaned = text.replace(/^(feat|fix|refactor|docs|test|chore|feature|bugfix|hotfix)[/:-]/i, "").replace(/(\(.+\))?:/g, " ");
  const words = cleaned.split(/[-_/\s]+/).map((w) => w.toLowerCase().trim()).filter((w) => w.length > 2 && w.length < 20).filter((w) => !["the", "and", "for", "with", "add", "update", "fix"].includes(w));
  return [...new Set(words)].slice(0, 10);
}
function parseBranchName(branch) {
  for (const { pattern, type } of BRANCH_TYPE_PATTERNS) {
    if (pattern.test(branch)) {
      const description2 = branch.replace(pattern, "").replace(/[-_]/g, " ").trim();
      return { type, description: description2 };
    }
  }
  const description = branch.replace(/^(main|master|develop|dev)$/i, "").replace(/[-_]/g, " ").trim();
  return { type: "unknown", description: description || branch };
}
function inferTypeFromCommits(commits) {
  const typeCounts = {
    feature: 0,
    fix: 0,
    refactor: 0,
    docs: 0,
    test: 0,
    chore: 0,
    unknown: 0
  };
  for (const commit of commits) {
    const message = commit.replace(/^[a-f0-9]+\s+/i, "");
    for (const { pattern, type } of COMMIT_TYPE_PATTERNS) {
      if (pattern.test(message)) {
        typeCounts[type]++;
        break;
      }
    }
  }
  let maxType = null;
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (type !== "unknown" && count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  }
  return maxCount > 0 ? maxType : null;
}
function inferAreasFromFiles(files) {
  const areas = new Set;
  for (const file of files) {
    for (const { pattern, area } of PATH_AREA_PATTERNS) {
      if (pattern.test(file)) {
        areas.add(area);
      }
    }
  }
  return [...areas].slice(0, 5);
}
function inferFeatureContext(gitState, recentCommits = []) {
  const { type: branchType, description: branchDesc } = parseBranchName(gitState.branch);
  const commitType = inferTypeFromCommits(recentCommits);
  const inferredType = branchType !== "unknown" ? branchType : commitType || "unknown";
  const branchKeywords = extractKeywords(gitState.branch);
  const commitKeywords = recentCommits.flatMap((c) => extractKeywords(c));
  const allKeywords = [...new Set([...branchKeywords, ...commitKeywords])].slice(0, 10);
  const allFiles = [...gitState.dirtyFiles];
  for (const commit of recentCommits) {
    const fileMatch = commit.match(/\b[\w/-]+\.(ts|js|tsx|jsx|json|md)\b/g);
    if (fileMatch) {
      allFiles.push(...fileMatch);
    }
  }
  const areas = inferAreasFromFiles(allFiles);
  let description = branchDesc;
  if (!description && gitState.commitMessage) {
    description = gitState.commitMessage.replace(/^(feat|fix|refactor|docs|test|chore)(\(.+\))?:\s*/i, "").slice(0, 100);
  }
  let confidence = "low";
  if (branchType !== "unknown" && allKeywords.length > 2) {
    confidence = "high";
  } else if (commitType || allKeywords.length > 0) {
    confidence = "medium";
  }
  return {
    type: inferredType,
    description: description || "general development",
    keywords: allKeywords,
    areas,
    confidence
  };
}

// src/cache.ts
import { homedir } from "os";
import { join as join2 } from "path";
import { existsSync as existsSync2, readFileSync, writeFileSync, appendFileSync, mkdirSync } from "fs";
var CACHE_DIR = join2(homedir(), ".honcho");
var ID_CACHE_FILE = join2(CACHE_DIR, "cache.json");
var CONTEXT_CACHE_FILE = join2(CACHE_DIR, "context-cache.json");
var MESSAGE_QUEUE_FILE = join2(CACHE_DIR, "message-queue.jsonl");
var CLAUDE_CONTEXT_FILE = join2(CACHE_DIR, "claude-context.md");
function ensureCacheDir() {
  if (!existsSync2(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}
function loadIdCache() {
  ensureCacheDir();
  if (!existsSync2(ID_CACHE_FILE)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(ID_CACHE_FILE, "utf-8"));
  } catch {
    return {};
  }
}
function saveIdCache(cache) {
  ensureCacheDir();
  writeFileSync(ID_CACHE_FILE, JSON.stringify(cache, null, 2));
}
function setCachedSessionId(cwd, name, id, instanceId) {
  const cache = loadIdCache();
  if (!cache.sessions)
    cache.sessions = {};
  cache.sessions[cwd] = { name, id, updatedAt: new Date().toISOString(), instanceId };
  saveIdCache(cache);
}
function getLastActiveCwd() {
  const cache = loadIdCache();
  if (!cache.sessions)
    return null;
  let latest = null;
  for (const [cwd, entry] of Object.entries(cache.sessions)) {
    if (!latest || entry.updatedAt > latest.updatedAt) {
      latest = { cwd, updatedAt: entry.updatedAt };
    }
  }
  return latest?.cwd || null;
}
function getClaudeInstanceId() {
  const cache = loadIdCache();
  return cache.claudeInstanceId || null;
}
function setClaudeInstanceId(instanceId) {
  const cache = loadIdCache();
  cache.claudeInstanceId = instanceId;
  saveIdCache(cache);
}
function getInstanceIdForCwd(cwd) {
  const cache = loadIdCache();
  return cache.sessions?.[cwd]?.instanceId ?? null;
}
function getContextTTL() {
  const config = getContextRefreshConfig();
  return (config.ttlSeconds ?? 300) * 1000;
}
function getMessageRefreshThreshold() {
  const config = getContextRefreshConfig();
  return config.messageThreshold ?? 50;
}
var CONTEXT_CACHE_KNOWN_KEYS = new Set([
  "userContext",
  "claudeContext",
  "summaries",
  "messageCount",
  "lastRefreshMessageCount"
]);
function loadContextCache() {
  ensureCacheDir();
  if (!existsSync2(CONTEXT_CACHE_FILE)) {
    return {};
  }
  try {
    const raw = JSON.parse(readFileSync(CONTEXT_CACHE_FILE, "utf-8"));
    let cleaned = false;
    for (const key of Object.keys(raw)) {
      if (!CONTEXT_CACHE_KNOWN_KEYS.has(key)) {
        delete raw[key];
        cleaned = true;
      }
    }
    if (cleaned) {
      writeFileSync(CONTEXT_CACHE_FILE, JSON.stringify(raw, null, 2));
    }
    return raw;
  } catch {
    return {};
  }
}
function saveContextCache(cache) {
  ensureCacheDir();
  writeFileSync(CONTEXT_CACHE_FILE, JSON.stringify(cache, null, 2));
}
function getCachedUserContext() {
  const cache = loadContextCache();
  if (cache.userContext && Date.now() - cache.userContext.fetchedAt < getContextTTL()) {
    return cache.userContext.data;
  }
  return null;
}
function getStaleCachedUserContext() {
  const cache = loadContextCache();
  return cache.userContext?.data ?? null;
}
function setCachedUserContext(data) {
  const cache = loadContextCache();
  cache.userContext = { data, fetchedAt: Date.now() };
  saveContextCache(cache);
}
function getCachedClaudeContext() {
  const cache = loadContextCache();
  if (cache.claudeContext && Date.now() - cache.claudeContext.fetchedAt < getContextTTL()) {
    return cache.claudeContext.data;
  }
  return null;
}
function setCachedClaudeContext(data) {
  const cache = loadContextCache();
  cache.claudeContext = { data, fetchedAt: Date.now() };
  saveContextCache(cache);
}
function isContextCacheStale() {
  const cache = loadContextCache();
  if (!cache.userContext)
    return true;
  return Date.now() - cache.userContext.fetchedAt >= getContextTTL();
}
function incrementMessageCount() {
  const cache = loadContextCache();
  cache.messageCount = (cache.messageCount || 0) + 1;
  saveContextCache(cache);
  return cache.messageCount;
}
function getMessageCount() {
  const cache = loadContextCache();
  return cache.messageCount || 0;
}
function shouldRefreshKnowledgeGraph() {
  const cache = loadContextCache();
  const currentCount = cache.messageCount || 0;
  const lastRefresh = cache.lastRefreshMessageCount || 0;
  return currentCount - lastRefresh >= getMessageRefreshThreshold();
}
function markKnowledgeGraphRefreshed() {
  const cache = loadContextCache();
  cache.lastRefreshMessageCount = cache.messageCount || 0;
  saveContextCache(cache);
}
function resetMessageCount() {
  const cache = loadContextCache();
  cache.messageCount = 0;
  cache.lastRefreshMessageCount = 0;
  saveContextCache(cache);
}
function queueMessage(content, peerId, cwd, instanceId) {
  ensureCacheDir();
  const message = {
    content,
    peerId,
    cwd,
    timestamp: new Date().toISOString(),
    uploaded: false,
    instanceId: instanceId || getClaudeInstanceId() || undefined
  };
  appendFileSync(MESSAGE_QUEUE_FILE, JSON.stringify(message) + `
`);
}
function getQueuedMessages(forCwd) {
  ensureCacheDir();
  if (!existsSync2(MESSAGE_QUEUE_FILE)) {
    return [];
  }
  try {
    const content = readFileSync(MESSAGE_QUEUE_FILE, "utf-8");
    const lines = content.split(`
`).filter((line) => line.trim());
    const messages = lines.map((line) => JSON.parse(line)).filter((msg) => !msg.uploaded);
    if (forCwd) {
      return messages.filter((msg) => msg.cwd === forCwd);
    }
    return messages;
  } catch {
    return [];
  }
}
function clearMessageQueue() {
  ensureCacheDir();
  writeFileSync(MESSAGE_QUEUE_FILE, "");
}
function markMessagesUploaded(forCwd) {
  if (!forCwd) {
    clearMessageQueue();
    return;
  }
  ensureCacheDir();
  if (!existsSync2(MESSAGE_QUEUE_FILE))
    return;
  try {
    const content = readFileSync(MESSAGE_QUEUE_FILE, "utf-8");
    const lines = content.split(`
`).filter((line) => line.trim());
    const remaining = lines.filter((line) => {
      try {
        const msg = JSON.parse(line);
        return msg.cwd !== forCwd;
      } catch {
        return false;
      }
    });
    writeFileSync(MESSAGE_QUEUE_FILE, remaining.join(`
`) + (remaining.length ? `
` : ""));
  } catch {}
}
function loadClaudeLocalContext() {
  ensureCacheDir();
  if (!existsSync2(CLAUDE_CONTEXT_FILE)) {
    return "";
  }
  try {
    return readFileSync(CLAUDE_CONTEXT_FILE, "utf-8");
  } catch {
    return "";
  }
}
function saveClaudeLocalContext(content) {
  ensureCacheDir();
  writeFileSync(CLAUDE_CONTEXT_FILE, content);
}
function appendClaudeWork(workDescription) {
  ensureCacheDir();
  const timestamp = new Date().toISOString();
  const entry = `
- [${timestamp}] ${workDescription}`;
  let existing = loadClaudeLocalContext();
  if (!existing) {
    existing = `# CLAUDE Work Context

Auto-generated log of CLAUDE's recent work.

## Recent Activity
`;
  }
  let maxEntries = getLocalContextConfig().maxEntries;
  if (!maxEntries) {
    maxEntries = 10;
  }
  const lines = existing.split(`
`);
  const activityStart = lines.findIndex((l) => l.includes("## Recent Activity"));
  if (activityStart !== -1) {
    const header = lines.slice(0, activityStart + 1);
    const activities = lines.slice(activityStart + 1).filter((l) => l.trim());
    const recentActivities = activities.slice(-(maxEntries - 1));
    existing = [...header, ...recentActivities].join(`
`);
  }
  saveClaudeLocalContext(existing + entry);
}
function generateClaudeSummary(sessionName, workItems, assistantMessages) {
  const timestamp = new Date().toISOString();
  const actions = [];
  for (const msg of assistantMessages.slice(-10)) {
    if (msg.includes("Created") || msg.includes("Updated") || msg.includes("Fixed")) {
      const firstSentence = msg.split(/[.!?\n]/)[0];
      if (firstSentence.length < 200) {
        actions.push(firstSentence);
      }
    }
  }
  let summary = `# CLAUDE Work Context

Last updated: ${timestamp}
Session: ${sessionName}

## What CLAUDE Was Working On

`;
  if (workItems.length > 0) {
    summary += workItems.map((w) => `- ${w}`).join(`
`);
    summary += `

`;
  }
  if (actions.length > 0) {
    summary += `## Recent Actions

`;
    summary += actions.slice(-10).map((a) => `- ${a}`).join(`
`);
    summary += `

`;
  }
  summary += `## Recent Activity
`;
  return summary;
}
var GIT_STATE_FILE = join2(CACHE_DIR, "git-state.json");
function loadGitStateCache() {
  ensureCacheDir();
  if (!existsSync2(GIT_STATE_FILE)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(GIT_STATE_FILE, "utf-8"));
  } catch {
    return {};
  }
}
function saveGitStateCache(cache) {
  ensureCacheDir();
  writeFileSync(GIT_STATE_FILE, JSON.stringify(cache, null, 2));
}
function getCachedGitState(cwd) {
  const cache = loadGitStateCache();
  return cache[cwd] || null;
}
function setCachedGitState(cwd, state) {
  const cache = loadGitStateCache();
  cache[cwd] = state;
  saveGitStateCache(cache);
}
function detectGitChanges(previous, current) {
  const changes = [];
  if (!previous) {
    changes.push({
      type: "initial",
      description: `Session started on branch '${current.branch}' at ${current.commit}`
    });
    return changes;
  }
  if (previous.branch !== current.branch) {
    changes.push({
      type: "branch_switch",
      description: `Branch switched from '${previous.branch}' to '${current.branch}'`,
      from: previous.branch,
      to: current.branch
    });
  }
  if (previous.commit !== current.commit) {
    changes.push({
      type: "new_commits",
      description: `New commit: ${current.commit} - ${current.commitMessage}`,
      from: previous.commit,
      to: current.commit
    });
  }
  if (!previous.isDirty && current.isDirty) {
    changes.push({
      type: "files_changed",
      description: `Uncommitted changes detected: ${current.dirtyFiles.slice(0, 5).join(", ")}${current.dirtyFiles.length > 5 ? "..." : ""}`
    });
  }
  return changes;
}
var MAX_MESSAGE_SIZE = 24000;
function chunkContent(content, maxSize = MAX_MESSAGE_SIZE) {
  if (content.length <= maxSize) {
    return [content];
  }
  const chunks = [];
  let remaining = content;
  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining);
      break;
    }
    let splitIndex = remaining.lastIndexOf(`
`, maxSize);
    if (splitIndex <= 0 || splitIndex < maxSize * 0.25) {
      splitIndex = remaining.lastIndexOf(" ", maxSize);
    }
    if (splitIndex <= 0 || splitIndex < maxSize * 0.25) {
      splitIndex = maxSize;
    }
    chunks.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex).trimStart();
  }
  if (chunks.length > 1) {
    return chunks.map((chunk, i) => `[Part ${i + 1}/${chunks.length}] ${chunk}`);
  }
  return chunks;
}
function clearIdCache() {
  ensureCacheDir();
  writeFileSync(ID_CACHE_FILE, "{}");
}
function clearPeerCache() {
  const cache = loadIdCache();
  delete cache.peers;
  saveIdCache(cache);
}
function clearUserContextOnly() {
  const cache = loadContextCache();
  delete cache.userContext;
  saveContextCache(cache);
}
function clearClaudeContextOnly() {
  const cache = loadContextCache();
  delete cache.claudeContext;
  saveContextCache(cache);
}

// src/config.ts
function sanitizeForSessionName(s) {
  return s.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
}
var HONCHO_BASE_URLS = {
  production: "https://api.honcho.dev/v3",
  local: "http://localhost:8000/v3"
};
var _detectedHost = null;
function setDetectedHost(host) {
  _detectedHost = host;
}
function getDetectedHost() {
  return _detectedHost ?? "claude_code";
}
function detectHost(stdinInput) {
  const envHost = process.env.HONCHO_HOST;
  if (envHost === "cursor" || envHost === "claude_code" || envHost === "obsidian")
    return envHost;
  if (stdinInput?.cursor_version)
    return "cursor";
  if (process.env.CURSOR_PROJECT_DIR)
    return "cursor";
  return "claude_code";
}
var DEFAULT_WORKSPACE = {
  cursor: "cursor",
  claude_code: "claude_code",
  obsidian: "obsidian"
};
var DEFAULT_AI_PEER = {
  cursor: "cursor",
  claude_code: "claude",
  obsidian: "honcho"
};
var _stdinText = null;
function cacheStdin(text) {
  _stdinText = text;
}
function getCachedStdin() {
  return _stdinText;
}
async function initHook() {
  const stdinText = await Bun.stdin.text();
  cacheStdin(stdinText);
  let input = {};
  try {
    input = JSON.parse(stdinText || "{}");
  } catch {
    process.exit(0);
  }
  if (input.cursor_version)
    process.exit(0);
  setDetectedHost(detectHost(input));
}
function parseTimeoutEnv() {
  return parseTimeoutEnvFrom(process.env);
}
function parseTimeoutEnvFrom(env) {
  const raw = env.HONCHO_TIMEOUT;
  if (!raw)
    return;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
function atomicWriteFileSync(path, content) {
  const tmp = `${path}.tmp.${process.pid}.${Date.now()}`;
  writeFileSync2(tmp, content);
  try {
    renameSync(tmp, path);
  } catch (err) {
    try {
      unlinkSync(tmp);
    } catch {}
    throw err;
  }
}
function deepEqual(a, b) {
  if (a === b)
    return true;
  if (a == null || b == null)
    return a === b;
  if (typeof a !== typeof b)
    return false;
  if (typeof a !== "object")
    return false;
  const aObj = a;
  const bObj = b;
  const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
  for (const key of keys) {
    if (!deepEqual(aObj[key], bObj[key]))
      return false;
  }
  return true;
}
var CONFIG_DIR = join3(homedir2(), ".honcho");
var CONFIG_FILE = join3(CONFIG_DIR, "config.json");
function getConfigPath() {
  return CONFIG_FILE;
}
function configExists() {
  return existsSync3(CONFIG_FILE);
}
function loadConfig(host) {
  const resolvedHost = host ?? getDetectedHost();
  if (configExists()) {
    try {
      const content = readFileSync2(CONFIG_FILE, "utf-8");
      const raw = JSON.parse(content);
      return resolveConfig(raw, resolvedHost);
    } catch {}
  }
  return loadConfigFromEnv(resolvedHost);
}
function resolveConfig(raw, host, env = process.env) {
  const apiKey = env.HONCHO_API_KEY || raw.apiKey;
  if (!apiKey)
    return null;
  const peerName = raw.peerName || env.HONCHO_PEER_NAME || env.USER || env.USERNAME || "user";
  let workspace;
  let aiPeer;
  const hostBlock = raw.hosts?.[host] ?? raw.hosts?.[host.replace(/_/g, "-")] ?? raw.hosts?.[host.replace(/-/g, "_")];
  if (raw.globalOverride === true) {
    workspace = raw.workspace ?? DEFAULT_WORKSPACE[host];
    aiPeer = raw.aiPeer ?? hostBlock?.aiPeer ?? DEFAULT_AI_PEER[host];
  } else if (hostBlock) {
    workspace = hostBlock.workspace ?? DEFAULT_WORKSPACE[host];
    aiPeer = hostBlock.aiPeer ?? DEFAULT_AI_PEER[host];
  } else {
    workspace = env.HONCHO_WORKSPACE ?? raw.workspace ?? DEFAULT_WORKSPACE[host];
    if (host === "cursor") {
      aiPeer = raw.cursorPeer ?? DEFAULT_AI_PEER["cursor"];
    } else {
      aiPeer = raw.claudePeer ?? DEFAULT_AI_PEER["claude_code"];
    }
  }
  const config = {
    apiKey,
    peerName,
    workspace,
    aiPeer,
    sessionStrategy: hostBlock?.sessionStrategy ?? raw.sessionStrategy,
    sessionPeerPrefix: hostBlock?.sessionPeerPrefix ?? raw.sessionPeerPrefix,
    sessions: raw.sessions,
    saveMessages: hostBlock?.saveMessages ?? raw.saveMessages,
    reasoningLevel: hostBlock?.reasoningLevel ?? raw.reasoningLevel,
    observationMode: hostBlock?.observationMode ?? raw.observationMode,
    messageUpload: hostBlock?.messageUpload ?? raw.messageUpload,
    contextRefresh: hostBlock?.contextRefresh ?? raw.contextRefresh,
    endpoint: hostBlock?.endpoint ?? raw.endpoint,
    localContext: hostBlock?.localContext ?? raw.localContext,
    enabled: hostBlock?.enabled ?? raw.enabled,
    logging: hostBlock?.logging ?? raw.logging,
    sdkTimeout: parseTimeoutEnvFrom(env) ?? raw.sdkTimeout,
    globalOverride: raw.globalOverride
  };
  return mergeWithEnvVars(config, env);
}
function loadConfigFromEnv(host) {
  const apiKey = process.env.HONCHO_API_KEY;
  if (!apiKey) {
    return null;
  }
  const resolvedHost = host ?? getDetectedHost();
  const peerName = process.env.HONCHO_PEER_NAME || process.env.USER || process.env.USERNAME || "user";
  const workspace = process.env.HONCHO_WORKSPACE || DEFAULT_WORKSPACE[resolvedHost];
  const hostPeerEnv = resolvedHost === "cursor" ? process.env.HONCHO_CURSOR_PEER : process.env.HONCHO_CLAUDE_PEER;
  const aiPeer = process.env.HONCHO_AI_PEER || hostPeerEnv || DEFAULT_AI_PEER[resolvedHost];
  const endpoint = process.env.HONCHO_ENDPOINT;
  const config = {
    apiKey,
    peerName,
    workspace,
    aiPeer,
    saveMessages: process.env.HONCHO_SAVE_MESSAGES !== "false",
    enabled: process.env.HONCHO_ENABLED !== "false",
    logging: process.env.HONCHO_LOGGING !== "false",
    sdkTimeout: parseTimeoutEnv()
  };
  if (endpoint) {
    if (endpoint === "local") {
      config.endpoint = { environment: "local" };
    } else if (endpoint.startsWith("http")) {
      config.endpoint = { baseUrl: endpoint };
    }
  }
  return config;
}
function mergeWithEnvVars(config, env = process.env) {
  if (env.HONCHO_API_KEY) {
    config.apiKey = env.HONCHO_API_KEY;
  }
  if (env.HONCHO_PEER_NAME) {
    config.peerName = env.HONCHO_PEER_NAME;
  }
  if (env.HONCHO_ENABLED === "false") {
    config.enabled = false;
  }
  if (env.HONCHO_LOGGING === "false") {
    config.logging = false;
  }
  return config;
}
function saveConfig(config) {
  if (!existsSync3(CONFIG_DIR)) {
    mkdirSync2(CONFIG_DIR, { recursive: true });
  }
  let existing = {};
  if (existsSync3(CONFIG_FILE)) {
    try {
      existing = JSON.parse(readFileSync2(CONFIG_FILE, "utf-8"));
    } catch {}
  }
  if (config.sessions !== undefined) {
    existing.sessions = config.sessions;
  }
  const host = getDetectedHost();
  if (!existing.hosts)
    existing.hosts = {};
  const existingHost = existing.hosts[host] ?? {};
  const hostEntry = {};
  const setHostIfExplicit = (key, value, rootValue) => {
    if (value === undefined)
      return;
    const hasHostOverride = Object.prototype.hasOwnProperty.call(existingHost, key);
    if (hasHostOverride || !deepEqual(value, rootValue)) {
      hostEntry[key] = value;
    }
  };
  setHostIfExplicit("workspace", config.workspace, existing.workspace ?? DEFAULT_WORKSPACE[host]);
  setHostIfExplicit("aiPeer", config.aiPeer, existing.aiPeer ?? DEFAULT_AI_PEER[host]);
  const enabledForSave = process.env.HONCHO_ENABLED === "false" && config.enabled === false ? existingHost.enabled : config.enabled;
  const loggingForSave = process.env.HONCHO_LOGGING === "false" && config.logging === false ? existingHost.logging : config.logging;
  setHostIfExplicit("enabled", enabledForSave, existing.enabled);
  setHostIfExplicit("logging", loggingForSave, existing.logging);
  setHostIfExplicit("saveMessages", config.saveMessages, existing.saveMessages);
  setHostIfExplicit("sessionStrategy", config.sessionStrategy, existing.sessionStrategy);
  setHostIfExplicit("sessionPeerPrefix", config.sessionPeerPrefix, existing.sessionPeerPrefix);
  setHostIfExplicit("reasoningLevel", config.reasoningLevel, existing.reasoningLevel);
  setHostIfExplicit("observationMode", config.observationMode, existing.observationMode);
  setHostIfExplicit("messageUpload", config.messageUpload, existing.messageUpload);
  setHostIfExplicit("contextRefresh", config.contextRefresh, existing.contextRefresh);
  setHostIfExplicit("localContext", config.localContext, existing.localContext);
  setHostIfExplicit("endpoint", config.endpoint, existing.endpoint);
  existing.hosts[host] = hostEntry;
  atomicWriteFileSync(CONFIG_FILE, JSON.stringify(existing, null, 2));
}
function saveRootField(field, value) {
  if (!existsSync3(CONFIG_DIR)) {
    mkdirSync2(CONFIG_DIR, { recursive: true });
  }
  let existing = {};
  if (existsSync3(CONFIG_FILE)) {
    try {
      existing = JSON.parse(readFileSync2(CONFIG_FILE, "utf-8"));
    } catch {}
  }
  existing[field] = value;
  atomicWriteFileSync(CONFIG_FILE, JSON.stringify(existing, null, 2));
}
function getSessionForPath(cwd) {
  const config = loadConfig();
  if (!config?.sessions)
    return null;
  return config.sessions[cwd] || null;
}
function deriveSessionName(i) {
  if (i.strategy === "per-directory" && i.override) {
    return i.override;
  }
  const peerPart = i.peerName ? sanitizeForSessionName(i.peerName) : "user";
  const repoPart = sanitizeForSessionName(basename(i.cwd));
  const base = i.usePrefix ? `${peerPart}-${repoPart}` : repoPart;
  switch (i.strategy) {
    case "git-branch":
      if (i.branch)
        return `${base}-${sanitizeForSessionName(i.branch)}`;
      return base;
    case "chat-instance":
      if (i.instanceId) {
        return i.usePrefix ? `${peerPart}-chat-${i.instanceId}` : `chat-${i.instanceId}`;
      }
      return base;
    case "per-directory":
    default:
      return base;
  }
}
function getSessionName(cwd, instanceId) {
  const config = loadConfig();
  const strategy = config?.sessionStrategy ?? "per-directory";
  let branch = null;
  if (strategy === "git-branch") {
    const gitState = captureGitState(cwd);
    branch = gitState?.branch ?? null;
  }
  let resolvedInstance = null;
  if (strategy === "chat-instance") {
    resolvedInstance = instanceId || getInstanceIdForCwd(cwd) || getClaudeInstanceId() || null;
  }
  return deriveSessionName({
    strategy,
    cwd,
    peerName: config?.peerName ?? "user",
    usePrefix: config?.sessionPeerPrefix !== false,
    branch,
    instanceId: resolvedInstance,
    override: strategy === "per-directory" ? getSessionForPath(cwd) : null
  });
}
function setSessionForPath(cwd, sessionName) {
  const config = loadConfig();
  if (!config)
    return;
  if (!config.sessions) {
    config.sessions = {};
  }
  config.sessions[cwd] = sessionName;
  saveConfig(config);
}
function getContextRefreshConfig() {
  const config = loadConfig();
  return {
    messageThreshold: config?.contextRefresh?.messageThreshold ?? 30,
    ttlSeconds: config?.contextRefresh?.ttlSeconds ?? 300,
    skipDialectic: config?.contextRefresh?.skipDialectic ?? false
  };
}
function getLocalContextConfig() {
  const config = loadConfig();
  return {
    maxEntries: config?.localContext?.maxEntries ?? 50
  };
}
function isLoggingEnabled() {
  const config = loadConfig();
  return config?.logging !== false;
}
function isPluginEnabled() {
  const config = loadConfig();
  return config?.enabled !== false;
}
function getKnownHosts() {
  const cfgPath = getConfigPath();
  if (!existsSync3(cfgPath))
    return [];
  try {
    const raw = JSON.parse(readFileSync2(cfgPath, "utf-8"));
    return raw.hosts ? Object.keys(raw.hosts) : [];
  } catch {
    return [];
  }
}
function getHonchoBaseUrlForEndpoint(endpoint) {
  if (endpoint?.baseUrl) {
    const url = endpoint.baseUrl;
    return url.endsWith("/v3") ? url : `${url}/v3`;
  }
  if (endpoint?.environment === "local") {
    return HONCHO_BASE_URLS.local;
  }
  return HONCHO_BASE_URLS.production;
}
function getHonchoBaseUrl(config) {
  return getHonchoBaseUrlForEndpoint(config.endpoint);
}
var DEFAULT_SDK_TIMEOUT_MS = 30000;
function getHonchoClientOptions(config) {
  return {
    apiKey: config.apiKey,
    baseURL: getHonchoBaseUrl(config),
    workspaceId: config.workspace,
    timeout: config.sdkTimeout ?? DEFAULT_SDK_TIMEOUT_MS,
    maxRetries: 1
  };
}
function getEndpointInfo(config) {
  if (config.endpoint?.baseUrl) {
    return { type: "custom", url: config.endpoint.baseUrl };
  }
  if (config.endpoint?.environment === "local") {
    return { type: "local", url: HONCHO_BASE_URLS.local };
  }
  return { type: "production", url: HONCHO_BASE_URLS.production };
}
var VALID_ENVIRONMENTS = new Set(["production", "local"]);
function getObservationMode(config) {
  return config.observationMode ?? "unified";
}

// src/workspaces.ts
async function listWorkspaces(config, timeoutMs = 5000) {
  const url = `${getHonchoBaseUrl(config)}/workspaces/list`;
  const controller = new AbortController;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({})
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, workspaces: [], error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const workspaces = (data.items ?? []).map((w) => w.id ?? w.name).filter((w) => typeof w === "string" && w.length > 0);
    return { ok: true, workspaces, total: data.total };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      workspaces: [],
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
async function listPeers(config, workspaceId, timeoutMs = 5000) {
  const url = `${getHonchoBaseUrl(config)}/workspaces/${encodeURIComponent(workspaceId)}/peers/list`;
  const controller = new AbortController;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({})
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, peers: [], error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const peers = (data.items ?? []).map((p) => p.id ?? p.name).filter((p) => typeof p === "string" && p.length > 0);
    return { ok: true, peers, total: data.total };
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      peers: [],
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// src/skills/list-workspaces-runner.ts
async function main() {
  const config = loadConfig();
  if (!config) {
    console.log(JSON.stringify({ ok: false, workspaces: [], error: "not configured" }));
    process.exit(1);
  }
  const result = await listWorkspaces(config);
  console.log(JSON.stringify(result));
  if (!result.ok)
    process.exit(1);
}
main();
