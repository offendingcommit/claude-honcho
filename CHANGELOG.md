## [1.0.1](https://github.com/offendingcommit/claude-honcho/compare/v1.0.0-oc...v1.0.1-oc) (2026-04-17)

### Bug Fixes

* **release:** append -oc suffix to bumped file versions ([2232493](https://github.com/offendingcommit/claude-honcho/commit/2232493df5f575aa47324253da2845e4417b5c9c))

## 1.0.0 (2026-04-17)

### Features

* add `honcho enable`/`honcho disable` ([543d5f6](https://github.com/offendingcommit/claude-honcho/commit/543d5f6ba3a65c0e2064111aa2c8085de00af9a7))
* chunking ([00c9e3a](https://github.com/offendingcommit/claude-honcho/commit/00c9e3a57523a0c8f6d8d84373fced28d2507fea))
* endpoint switching between saas and local honcho instances ([4bc400d](https://github.com/offendingcommit/claude-honcho/commit/4bc400d8a780d3aa92671a2c1a609e8bbe17e786))
* Expand markeplace with dev plugin ([#8](https://github.com/offendingcommit/claude-honcho/issues/8)) ([e940da9](https://github.com/offendingcommit/claude-honcho/commit/e940da9788b10be55e9205c2670dae4819e38e0f))
* git state tracking with inferred feature context ([5ce10e7](https://github.com/offendingcommit/claude-honcho/commit/5ce10e71d8346454d6445b93be6ceede094fe0c7))
* handoff skill, pixel art, session isolation ([8fd3c6a](https://github.com/offendingcommit/claude-honcho/commit/8fd3c6aba237ec30745768ec5e3a5875aaf0b262))
* real-time assistant response capture via Stop hook ([b8383bf](https://github.com/offendingcommit/claude-honcho/commit/b8383bfa9b9aea886ef8c970cc1d5e2b2c78433b))
* self-improvement from AI feedback analysis ([a3af675](https://github.com/offendingcommit/claude-honcho/commit/a3af67515d7b7a1273689a01401434917705dac8))
* tail command for activity logging ([276547c](https://github.com/offendingcommit/claude-honcho/commit/276547cfca5d482269e7ea4481729daf6e292d32))

### Bug Fixes

* add full dependencies for plugin ([#16](https://github.com/offendingcommit/claude-honcho/issues/16)) ([3e0b784](https://github.com/offendingcommit/claude-honcho/commit/3e0b784594092d42c5677464ca0ad0dd13f321ae))
* adding banner ([#12](https://github.com/offendingcommit/claude-honcho/issues/12)) ([38da316](https://github.com/offendingcommit/claude-honcho/commit/38da31641c89c355fb297cf314ef9a4ff6061359))
* adding peers to session with config ([3f01d2a](https://github.com/offendingcommit/claude-honcho/commit/3f01d2a2225fb0cc7e1be87d9133f304975ca5b4))
* bug fixes ([b96ee86](https://github.com/offendingcommit/claude-honcho/commit/b96ee8618b54f33a06896063f8fe3b229b1dee2a))
* chat-instance peer prefix bug ([6939e05](https://github.com/offendingcommit/claude-honcho/commit/6939e05341164db00a5cdc66d86a99cb4acce53b))
* **ci:** add conventional-changelog-conventionalcommits peer dep ([463c003](https://github.com/offendingcommit/claude-honcho/commit/463c00392d57a47a5d7d52cfd1873f1d984405bd))
* correct observer/observed scoping + new MCP (0.2.4) + OSS scaffolding  ([#23](https://github.com/offendingcommit/claude-honcho/issues/23)) ([7f78a2d](https://github.com/offendingcommit/claude-honcho/commit/7f78a2d031e194cb4875b2e70c0f173899fafe76))
* make Honcho SDK timeout configurable (closes [#25](https://github.com/offendingcommit/claude-honcho/issues/25)) ([9c4f46b](https://github.com/offendingcommit/claude-honcho/commit/9c4f46bf5c2492dbe704ede1e3fb13eccde3f2db))
* per-host config ownership, saveRootField, SDK client options ([83b5879](https://github.com/offendingcommit/claude-honcho/commit/83b58790b859f96915aee2ece9cc49a6b7bb2d0e))
* readme ([720fe78](https://github.com/offendingcommit/claude-honcho/commit/720fe78a45db2074002267abb32830bc5f2ca37c))
* rename plugins ([5c80003](https://github.com/offendingcommit/claude-honcho/commit/5c800035f4bf18f6d45daf62166d6e08f6f932c2))
* rename to clawd ([aabe5da](https://github.com/offendingcommit/claude-honcho/commit/aabe5da7838a8fe5bba4494c13da57b2cbaa6f18))
* resilient hook lifecycle -- phased session-end, cache-first user-prompt ([61bc60e](https://github.com/offendingcommit/claude-honcho/commit/61bc60e1789b985a8e1c64cf8b4809c258c9fc1c))
* runtime Unicode generation for pixel art and spinner ([baf2b16](https://github.com/offendingcommit/claude-honcho/commit/baf2b162da348ba389df11a308fadc1abb0c1059))
* syntax fix ([#20](https://github.com/offendingcommit/claude-honcho/issues/20)) ([8d34db2](https://github.com/offendingcommit/claude-honcho/commit/8d34db2a66de9acecf8912d0962c9b6b5757da71))
* Update Skill language to match core repo ([80202bf](https://github.com/offendingcommit/claude-honcho/commit/80202bf88cc00ab3eeb95b83ef7a18a49e3247c8))
* update to honcho-sdk 2.0.0 ([e6a97c8](https://github.com/offendingcommit/claude-honcho/commit/e6a97c8c65722761e14c6fe58dcc26bd361bacbb))
* use runtime Unicode generation to survive bundling ([83e98e9](https://github.com/offendingcommit/claude-honcho/commit/83e98e9cbcc0c5e36f6c8b505dba51a1603a8eb6))
* Windows compatibility for TTY, setup, and install ([54427e8](https://github.com/offendingcommit/claude-honcho/commit/54427e8e6cd204dd87944845c11d211c8de3ae86))

# Changelog

All notable changes to claude-honcho will be documented in this file.

## [0.2.4] - 2026-04-01

### Added

- `observationMode: "unified" | "directional"` config flag — per-host with root fallback, default `"unified"`
  - **unified** (default): all agents contribute to the user's self-observation collection (`observer=user, observed=user`); conclusions are portable across agents
  - **directional** (opt-in): each AI maintains its own view of the user (`observer=aiPeer, observed=user`); useful for isolated multi-agent workspaces
  - Resolves the ambiguity from issue #22 — prior code was implicitly directional with no user control; peer-call routing in all hooks and MCP tools now branches on this flag
- `get_context` MCP tool — retrieves the full context object (representation + peer card), scoped by observation mode
- `get_representation` MCP tool — lightweight representation string fetch, scoped by observation mode
- `list_conclusions` MCP tool — paginated list of saved conclusions with `id`, `content`, and `createdAt`
- `delete_conclusion` MCP tool — remove a conclusion by ID
- `schedule_dream` MCP tool — trigger background memory consolidation; Honcho merges redundant conclusions and derives higher-level insights
- `search` tool `scope` parameter — `"session"` (default) or `"workspace"` to search across all sessions
- `observationMode` settable via `set_config` and visible in `get_config` output and status card

### Fixed

- `aiPeer` peer config: `observeMe` corrected to `false` — agent peers don't need self-representation; eliminates wasted background reasoning compute
- `addPeers` session config: `aiPeer.observeOthers` is now `false` in unified mode and `true` in directional mode (was unconditionally `true`)

### Changed

- Bump `@honcho-ai/sdk` floor to `^2.1.0` (adds pagination, `getMessage`, `createdAt`/`isActive` on peers/sessions, strict validation)
- Bump `@modelcontextprotocol/sdk` floor to `^1.26.0`

## [0.2.3] - 2026-03-25

### Fixed

- Adding peers to session with config
- Windows compatibility for TTY, setup, and install
- Per-host config ownership, `saveRootField`, SDK client options
- Resilient hook lifecycle: phased session-end, cache-first user-prompt

## [0.2.2] - 2026-03-03

### Fixed

- Fix `chat-instance` session strategy ignoring `sessionPeerPrefix` setting — sessions now correctly prefix with peer name when enabled

## [0.2.1] - 2026-03-02

### Added

- Global `~/.honcho/config.json` with per-host config blocks (Claude Code, Cursor, Obsidian)
- Host auto-detection via environment signals (`HONCHO_HOST`, `CURSOR_PROJECT_DIR`)
- Linked workspaces for cross-host context sharing at runtime
- `/honcho:config` skill with `get_config` and `set_config` MCP tools
- `/honcho:setup` skill for first-time API key validation and config creation
- Multiple session strategies: `per-directory`, `git-branch`, `chat-instance`
- `globalOverride` flag to apply flat config fields across all hosts
- `sessionPeerPrefix` option to prefix session names with peer name

### Fixed

- Stale cache fallback with timeout for context fetch
- Clear stale session overrides when prefix/strategy/peerName changes
- Message sync bugs: dedup uploads, scope instance IDs per-cwd, add createdAt
- Chat-instance strategy ignores stale session overrides
- Respect `HONCHO_WORKSPACE` env var during legacy config migration
- Various config menu UX improvements (single-select link/unlink, granular host toggles)

### Changed

- Extracted `initHook()` for shared hook entry points
- Unified aiPeer defaults across hosts
- Renamed host identifier from `claude-code` to `claude_code`
- Skills synced to marketplace directory where plugin loader reads them

## [0.2.0] - 2026-02-10

### Added

- Visual logging with pixel art banner
- Configurable file logging to `~/.honcho/` (on by default, togglable)
- Session name prefixing with `peerName` (configurable, default on)
- Installation instructions for adding to Claude Code

### Changed

- Removed legacy SDK format support — all code uses Honcho SDK v2.0.0 natively
- Pinned `@honcho-ai/sdk` to `~2.0.0`
- Updated terminology: "facts" renamed to "conclusions" throughout

## [0.1.2] - 2026-02-05

### Added

- Message chunking for large payloads
- Interview skill (`/honcho:interview`) for capturing user preferences
- Plugin validation on install
- Bundled `node_modules` for marketplace distribution

### Fixed

- Full dependencies declared in package.json for plugin portability
- Banner display on session start

## [0.1.1] - 2026-01-30

### Added

- `honcho enable` / `honcho disable` commands
- Developer plugin (`honcho-dev`) with SDK integration and migration skills
- Pure plugin structure for Claude Code marketplace

### Changed

- Renamed from `honcho-claudis` to `claude-honcho`
- Updated to `@honcho-ai/sdk` v2.0.0
- Removed old handoff and setup skills
- Removed hard dependency on Bun for broader portability

## [0.1.0] - 2026-01-05

### Added

- Initial release as `honcho-claudis`
- Persistent memory for Claude Code sessions using Honcho
- Session-start hook with wavy loading animation
- User-prompt-submit hook with dialectic reasoning context
- Assistant-response-stop hook for real-time response capture
- Pre-compact hook for session state preservation
- Cost optimization with configurable context refresh thresholds
- Endpoint switching between SaaS and local Honcho instances
- Git state tracking with inferred feature context
- Activity logging with tail command
- Self-improvement from AI feedback analysis
- Pixel art and colorful wave spinner UI
- Session isolation per working directory
