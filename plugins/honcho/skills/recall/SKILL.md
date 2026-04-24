---
description: Semantic search over saved Honcho conclusions about the user — answers "what do you remember about X?"
allowed-tools: query_conclusions
user-invocable: true
---

# Honcho Recall

Semantic recall over conclusions Honcho has saved about the user. Different from `search` (which queries messages) and `list_conclusions` (which is paginated, not ranked) — this ranks saved insights by relevance to a topic.

## When to use

- "What do you remember about my testing preferences?"
- "What have I told you about my deployment workflow?"
- "Find anything you know about how I handle code review."

## Usage

Run `/honcho:recall <topic or question>`.

## Implementation

Call the `query_conclusions` MCP tool with the user's topic as `query`. Default `top_k=10`; use `top_k=20` for broad questions.

Present the results as a tight bulleted list — one bullet per conclusion, content only (no IDs unless the user asks). If nothing comes back, say so plainly.
