---
description: List past Honcho sessions across all projects — answers "what was I working on yesterday?"
user-invocable: true
---

# Honcho Sessions

List sessions in the current Honcho workspace. Useful for answering "what was I working on yesterday?" or "show me my recent claude-honcho work" — sessions persist across projects, restarts, and context wipes.

## Usage

Run `/honcho:sessions`.

## Implementation

Call the `list_sessions` MCP tool. The tool returns session IDs with `createdAt` timestamps and pagination metadata.

Present the results as a compact table or list, sorted by `createdAt` descending (most recent first). Show:

- Session ID (or a recognizable suffix)
- Created at (relative if recent: "2h ago", "yesterday")

If the user asks "what was I working on in <session>?", use the `search` MCP tool with `scope: "workspace"` to pull representative messages from that session.

Keep it short — no prose unless the user asks for detail.
