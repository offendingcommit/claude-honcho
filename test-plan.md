# Test Plan — claude-honcho

> Status: proposed. Produced by `/fire-tools:consult` on 2026-05-01.
> Tier 1 not yet implemented.

## Goal

Add a deterministic test suite that catches the regression classes
TypeScript cannot: silent data loss, hook-chain crashes on malformed
input, and races on shared on-disk state.

## Scope

In: `plugins/honcho/src/**`. Out: `plugins/honcho-dev/**` (skills only,
no executable code), `dist/**` (bundled output).

## Framework

**Vitest** (`pnpm --filter claude-honcho add -D vitest @vitest/coverage-v8`).
Rationale: ESM-native, TS-native, runs on Node so any contributor can
execute tests without Bun installed. Bun remains the production bundler.

Add to `plugins/honcho/package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

CI: extend the existing `typecheck`/`build` job with `pnpm --filter claude-honcho test`.

## Tier 1 — Build now (~8h, 8 tests)

Two production fixes are gated by Tier 1 and must land first:

- **`config.ts` saveConfig**: replace direct `writeFileSync` with
  `writeFileSync(tmp); renameSync(tmp, target)` + `proper-lockfile` advisory lock.
- **`git.ts`**: every `execSync` call gets `{timeout: 1500}` and a try/catch
  returning a null GitState on timeout.

### 1. Atomic `saveConfig`

- File: `tests/config.atomic.test.ts`
- Asserts: crash injected between tmp-write and rename leaves the file
  either fully old-valid or fully new-valid — never truncated. Two
  parallel `saveConfig` calls preserve both host blocks (no field loss).
- Hint: stub `fs.renameSync` to throw on first call; re-read file and
  `JSON.parse` — must not throw, must contain prior content.

### 2. Malformed config doesn't crash hooks

- File: `tests/hooks.malformed-config.test.ts`
- Fixtures: truncated JSON, null fields, wrong types
  (`hosts: "string"`), missing required keys.
- Asserts: each hook entry point returns exit code 0 and emits exactly
  one structured log line containing `{hook, error}`.

### 3. `session-end` persist-before-upload

- File: `tests/session-end.persistence.test.ts`
- Asserts: when SDK upload hangs past the 12s hard timeout OR rejects,
  queued messages exist on disk at `~/.honcho/pending/<session>.jsonl`.
  Required because `exit 0` masks the failure from Claude Code.
- Hint: mock Honcho client with a never-resolving promise; advance
  fake timers past 12s; read pending file.

### 4. `git.ts` hard timeout

- File: `tests/git.timeout.test.ts`
- Asserts: `captureGitState` returns ≤ 2s when the underlying subprocess
  hangs. Stub `child_process.execSync` to throw `ETIMEDOUT`.
- Today's failure: NFS-stuck `.git` freezes Claude Code startup indefinitely.

### 5. Config resolution precedence (pure)

- File: `tests/config.precedence.test.ts`
- Asserts: `hosts.<detected_host>` > root-flat > env-var, in that
  order, across all 8 corner cases (host present + flat present, host
  empty + flat present, env override for `HONCHO_API_KEY` vs
  `HONCHO_WORKSPACE`, etc.).
- Refactor required: extract `resolveConfig(raw, host, env)` as a pure function.

### 6. Session name derivation (pure)

- File: `tests/config.session-name.test.ts`
- Asserts: each strategy (`per-directory`, `git-branch`, `chat-instance`)
  produces the documented format. Three deterministic cases.
- Refactor required: extract `deriveSessionName(strategy, ctx)` as a pure function.

### 7. Version sync

- Files: `scripts/check-versions.mjs` + `tests/versions.test.ts`
- Asserts: `package.json`, `plugins/honcho/package.json`,
  `plugins/honcho/plugin.json`, `plugins/honcho-dev/plugin.json`,
  `.claude-plugin/marketplace.json` all share the same version.
- Wire into the existing `validate-json` CI job.

### 8. Hook telemetry contract

- File: `tests/hooks.telemetry.test.ts`
- Asserts: every hook's top-level `catch` writes exactly one
  `JSON.stringify({hook, error: err.message, ts})` line to
  `~/.honcho/logs/<date>.log`. Test forces a throw via dependency
  injection and inspects the log file.
- Why: hooks must keep `exit 0` (Claude Code contract), so the
  *only* failure signal is structured log output. This locks the contract.

## Tier 2 — Defer (P1)

- Observation-mode toggle warning when `unified` → `directional` would
  hide existing conclusions.
- MCP schema ↔ switch-case parity test for `server.ts` (every tool in
  `ListToolsRequestSchema` has a matching `CallToolRequestSchema` case
  and vice versa).
- Malformed transcript line skipping in `session-end.ts` parser.
- Cache atomic write for `context-cache.json` / `id-cache.json`. Lower
  stakes than config because cache is rebuildable.

## Tier 3 — Explicitly cut

- Snapshot tests for `pixel.ts` / `styles.ts` / `unicode.ts` /
  `visual.ts` — visual output, human-validated each run, snapshots rot.
- Happy-path tests for the 19 MCP tools — mock hell with low ROI; the
  live Honcho SDK is already the integration test.
- Real OS-level concurrency, real `SIGTERM`, real fake-`git` binary on
  PATH — replaced by invariant fault injection in Tier 1.
- Live Honcho API integration in blocking CI — env-gated nightly only.

## Definition of Done

- `pnpm --filter claude-honcho test` green
- Tier 1 production fixes (atomic saveConfig, git timeout) merged
- CI extended to run tests on PR
- No coverage % gate; Tier 1 deliberately covers failure-mode
  invariants, not lines
