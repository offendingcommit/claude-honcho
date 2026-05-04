---
description: Show current Honcho memory status and configuration
when_to_use: Use when the user asks "is honcho working?", "how many conclusions do I have?", "check my memory system", "is my memory connected?", or wants to verify the plugin is active.
user-invocable: true
---

# Honcho Status

Display the current Honcho memory system status: connection health, workspace, peers, observation queue, and conclusion count.

## What It Shows

1. **Endpoint** - Resolved Honcho URL and type (production / local / custom)
2. **Server** - Unauthenticated `/openapi.json` probe; reports running Honcho version
3. **Auth** - Authenticated SDK call (API key valid against the workspace)
4. **Workspace / Session / Peers** - Current names for this directory
5. **Observing** - Queue processing status (messages observed, active, sessions)
6. **Conclusions** - Total conclusion/memory count for the user peer

If `Auth` fails, the status report stops there — no point asking the SDK for queue/conclusions when the key is rejected. For pure connectivity debugging without the rest of the report, use `/honcho:health`.

## Usage

Run `/honcho:status` to see the current state of the Honcho memory system.

## Presentation

After running the script, present a concise status card echoing the runner output. Do NOT add prose commentary — the output speaks for itself. Only add a one-line note if something looks wrong (e.g. auth failed, unreachable, 0 conclusions).

## Implementation

```bash
bun run ${CLAUDE_PLUGIN_ROOT}/dist/src/skills/status-runner.js
```
