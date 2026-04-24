---
description: Audit Honcho conclusions for staleness, duplicates, and low-signal entries. Use when memory surfaced via UserPromptSubmit feels noisy, contradictory, or outdated, or on a quarterly cadence to keep signal-to-noise high.
allowed-tools: get_config, chat, query_conclusions, list_conclusions, delete_conclusion, create_conclusion
disable-model-invocation: true
user-invocable: true
---

# Honcho Audit

Periodic review of conclusions stored in Honcho to prune drift, duplicates, and stale entries. Counter-balances `/honcho:interview`, which only ever adds.

## When to run

- **Quarterly** — prevents slow accumulation of contradictory preferences as the user's habits evolve.
- **On demand** — when `UserPromptSubmit`-injected conclusions start feeling noisy, generic, or wrong.
- **After major workflow changes** — new job, new project domain, new tooling stack.

## Procedure

### 1. Fetch the current conclusion set

Use `mcp__plugin_honcho_honcho__search` with a broad query (or `get_config` to confirm the active workspace/peer first), or call `chat` to have Honcho summarize what it "knows" about the peer.

Example chat prompt:

> List every conclusion you currently hold about peer `jonathan` on workspace `airstrip`, grouped by topic. Flag any that contradict each other or that reference specific projects/tools that may have rotated out.

### 2. Classify each conclusion

For each entry, assign one of:

| Category | Action |
|---|---|
| **Stable preference** (e.g. "prefers concise responses") | Keep |
| **Project-specific** that's no longer active | Delete |
| **Contradicts** a newer conclusion | Delete the older |
| **Duplicate / near-duplicate** | Merge into the strongest phrasing |
| **Too generic to steer behavior** (e.g. "likes good code") | Delete |
| **Stale fact** (tool version, team member, schedule) | Delete or refresh |

### 3. Apply changes

Conclusions cannot be edited in place — delete + recreate. Use the Honcho MCP tools:
- Delete via the SDK's `peer.conclusions.delete(id)` (exposed through the plugin's MCP surface)
- Recreate merged/updated entries via `mcp__plugin_honcho_honcho__create_conclusion`

Batch deletions; verify the remaining set with one final `chat` query.

### 4. Record the audit

Append a one-liner to `~/.claude/projects/-Volumes-dev--claude/memory/reference_honcho_audits.md` (create if missing):

```markdown
- YYYY-MM-DD — audited N conclusions, deleted M, merged K. Signal: <short observation about the drift you saw>
```

This lets future audits spot pattern drift (e.g. "always deleting project-X entries — scoping problem").

## Decision heuristics

- **When in doubt, keep.** Honcho's dialectic layer tolerates some redundancy; aggressive pruning can strip context the model uses for dimensional retrieval.
- **Delete aggressively on project-specific noise.** A conclusion like "uses Drizzle on fiftheye-watchtower-v3" is too narrow to live on the global peer.
- **Flag scoping problems.** If >20% of conclusions are project-specific, that's a signal the plugin's `per-directory` session strategy isn't isolating enough — consider proposing per-workspace peers instead of a single global peer.

## Related

- `/honcho:interview` — captures new stable preferences (additive counterpart).
- `/honcho:status` — quick health check; read conclusion count before and after an audit to confirm pruning landed.
- `~/.honcho/config.json` — workspace, peer, and session-naming source of truth.
