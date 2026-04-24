---
description: Trigger Honcho's background memory consolidation (a "dream") to merge redundant conclusions and derive higher-level insights
allowed-tools: schedule_dream
user-invocable: true
---

# Honcho Dream

Schedule a Honcho dream — a background memory-consolidation pass. Honcho will merge redundant conclusions about you and derive higher-level insights, improving the quality of future recall.

## When to use

- After a long, insight-rich session
- When `/honcho:status` shows many conclusions and you want them consolidated
- Before ending a multi-day work block to lock in what was learned

## Usage

Run `/honcho:dream` (consolidates the current session) or `/honcho:dream workspace` (consolidates across all sessions).

## Implementation

Call the `schedule_dream` MCP tool with the requested scope.

- Default scope is `session`.
- If the user said "workspace", "all", or "everything", use `scope: "workspace"`.

Report the result in one line. The dream runs asynchronously on Honcho's side — there is nothing to wait for.
