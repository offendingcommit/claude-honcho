---
description: Probe Honcho server connectivity and auth -- two-stage check for diagnosis
when_to_use: Use when the user asks "is honcho up?", "can you reach my honcho server?", "is my API key working?", "honcho seems broken", or wants to debug self-hosted connectivity without opening a full status report.
user-invocable: true
---

# Honcho Health

Run a multi-stage probe against the configured Honcho instance:

1. **Server** — unauthenticated `GET <root>/openapi.json`. Confirms the server process is up and serving FastAPI's OpenAPI doc, and reports the running Honcho version (`info.version`). We probe `/openapi.json` rather than `/health` because real-world Honcho deployments (3.0.x) don't expose `/health` on the API server binary.
2. **Auth** — authenticated SDK call (`queueStatus`) to verify the API key works against the configured workspace.
3. **Memory + Deriver** (post-auth only) — fetches conclusion count and queue status to confirm the full memory pipeline is alive.

Surface results separately so the user can tell whether a problem is "server is down" vs "key is wrong" vs "network is broken between this machine and the host."

## Usage

```bash
bun run "${CLAUDE_PLUGIN_ROOT}/dist/src/skills/health-runner.js"
```

If `CLAUDE_PLUGIN_ROOT` is not set, resolve the plugin path:

```bash
bun -e "const h=require('os').homedir();const p=require('path');console.log(p.join(h,'.claude','plugins','cache','honcho','honcho'))"
```

Then find the version directory inside that path and run the health runner from there.

## Presentation

Echo the runner output verbatim — it already produces a concise card. Add a single suggestion line ONLY if a check failed:

- **Server unreachable** — suggest verifying `endpoint` in `~/.honcho/config.json`, that the server is running, and (for self-hosted) the port/URL is correct. Note: some hardened deployments disable `/openapi.json`; if auth still passes, the server is fine.
- **Auth unauthorized** — suggest re-running `/honcho:setup` or rotating the key at https://app.honcho.dev (SaaS) or with their self-hosted admin.
- **Auth missing API key** — point to `/honcho:setup`.
- **Auth network failure** — usually means the URL is wrong even though `/health` passed; rare, but suggest checking `endpoint.baseUrl` for a typo in the path component.

Do not editorialize. The runner output speaks for itself.
