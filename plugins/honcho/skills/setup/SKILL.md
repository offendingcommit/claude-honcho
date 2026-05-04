---
description: First-time Honcho configuration -- set API key, validate connection, create config
disable-model-invocation: true
user-invocable: true
---

# Honcho Setup

Walk the user through first-time Honcho configuration so persistent memory works in Claude Code.

## Steps

### 1. Check for bun

Honcho's hooks and runners are TypeScript executed by `bun`. Verify it's installed before any other step:

```bash
command -v bun >/dev/null 2>&1 && echo ok || echo missing
```

If the output is `missing`, stop and tell the user to install bun. Do not proceed to any other step until they have bun on `PATH`.

**macOS / Linux:**

> Install bun:
> ```
> curl -fsSL https://bun.sh/install | bash
> ```
> Then restart your shell and run `/honcho:setup` again.

**Windows** (you can confirm the platform with `node -e "console.log(process.platform)"`):

> Install bun in PowerShell:
> ```
> powershell -c "irm bun.sh/install.ps1 | iex"
> ```
> Then restart Claude Code and run `/honcho:setup` again.

### 2. Ask whether Honcho is self-hosted

Before checking for an API key, ask the user where Honcho runs:

> Where is your Honcho instance?
> 1. **SaaS** — the hosted service at https://api.honcho.dev (default)
> 2. **Self-hosted, localhost** — `honcho-server` running on `http://localhost:8000`
> 3. **Self-hosted, custom URL** — `honcho-server` at a different URL

If the user picks **(1) SaaS**, continue with step 3. No config needs to be written yet — the runner will create it after validation.

If the user picks **(2)** or **(3)**, ask two follow-ups:

- **For (3) only:** ask for the full URL (e.g. `https://honcho.mycompany.com`).
- **Auth:** "Does your Honcho server require an API key? (yes/no)"
- **Scope:** "Should this endpoint apply globally to all integrations (Cursor, Obsidian, Claude Code), or only to Claude Code on this machine? (global/host) [default: global]"

Then write the user's choice to `~/.honcho/config.json`. The canonical config lives there (see `getConfigPath()` in `src/config.ts`), and the runner reads it via `loadConfig()` — no env-var hand-off needed.

Pick the one snippet that matches the user's answers. Substitute the bracketed values literally, then run it:

```bash
# Self-hosted, localhost, scope=global
bun -e "
const fs=require('fs'),path=require('path'),os=require('os');
const file=path.join(os.homedir(),'.honcho','config.json');
fs.mkdirSync(path.dirname(file),{recursive:true});
let cfg={};try{cfg=JSON.parse(fs.readFileSync(file,'utf-8'));}catch{}
cfg.endpoint={environment:'local'};
if(!cfg.peerName)cfg.peerName=process.env.USER||'user';
// AUTH=no only: also set placeholder apiKey
// if(!cfg.apiKey)cfg.apiKey='self-hosted';
fs.writeFileSync(file,JSON.stringify(cfg,null,2));
console.log('wrote',file);
"
```

Variations:

- **Custom URL** (replace the `cfg.endpoint=` line): `cfg.endpoint={baseUrl:'https://honcho.mycompany.com'};`
- **Scope=host** (replace the `cfg.endpoint=` line): `cfg.hosts=cfg.hosts||{};cfg.hosts.claude_code=cfg.hosts.claude_code||{};cfg.hosts.claude_code.endpoint={environment:'local'};` (or with the `baseUrl` form for custom URL)
- **No auth**: uncomment the `if(!cfg.apiKey)cfg.apiKey='self-hosted';` line so step 3 finds a key and skips the env-var nag.

After the write succeeds, continue with step 3.

### 3. Check current API key state

Check if `HONCHO_API_KEY` is set as an environment variable OR if `~/.honcho/config.json` already has an `apiKey`:

```bash
bun -e "
const fs = require('fs');
const path = require('path');
const configPath = path.join(require('os').homedir(), '.honcho', 'config.json');
const envKey = process.env.HONCHO_API_KEY;
let configKey = '';
try { configKey = JSON.parse(fs.readFileSync(configPath, 'utf-8')).apiKey || ''; } catch {}
console.log(envKey || configKey ? 'set' : 'not set');
"
```

If the output is `set`, skip to step 5 (peer + workspace selection). Otherwise continue with step 4.

### 4. Direct user to set their API key

Tell the user to get a free API key at https://app.honcho.dev (SaaS) or from their self-hosted admin, then set it as an environment variable.

**If Windows:**

> Set your API key in PowerShell:
> ```powershell
> setx HONCHO_API_KEY "your-key-here"
> ```
> Then restart Claude Code and run `/honcho:setup` again.

**If macOS / Linux:**

> Add to your shell config (`~/.zshrc` or `~/.bashrc`):
> ```
> export HONCHO_API_KEY="your-key-here"
> ```
> Then restart your shell and run `/honcho:setup` again.

IMPORTANT: Do NOT ask the user to paste their API key into the chat. Keys must be set via environment variable outside of Claude Code.

Stop here and wait for the user to come back after restarting. Do not proceed to validation until the user runs `/honcho:setup` again.

### 5. Choose workspace and peer name

Honcho organizes memory by **workspace** (the project/scope) and **peer** (your identity within that workspace). Pick workspace first because the peer list is workspace-scoped. Persist both to `~/.honcho/config.json` so the runner picks them up via `loadConfig()`.

For both pickers below, prefer the `AskUserQuestion` tool over a freeform chat prompt — it renders a structured, descriptioned multi-choice picker which is the right UX for "pick from this list or create new." Reach for `AskUserQuestion` whenever the choices are concrete and bounded (typically ≤4 options plus a "create new" / "other" escape hatch). Fall back to a numbered list in chat only if `AskUserQuestion` is unavailable.

#### Workspace

List existing workspaces on the server:

```bash
bun run "${CLAUDE_PLUGIN_ROOT}/dist/src/skills/list-workspaces-runner.js"
```

This prints JSON like `{"ok":true,"workspaces":["claude_code","cursor","alice"],"total":3}`. If `ok` is `false`, surface the `error` field and stop — the user needs to fix auth/connectivity before continuing.

Branch on the count:

- **0 workspaces**: tell the user "No workspaces exist on this server yet. One will be created." Default the new workspace name to `claude_code`. Ask if they want a different name.
- **1 workspace**: ask "Found one workspace: `<name>`. Use it, or create a different one?"
- **>1 workspaces**: present a picker via `AskUserQuestion` listing each workspace plus a `Create new` option. If there are more than 4 existing workspaces, show the most-recently-relevant ones plus a `Pick a different one` escape that prompts for free text.

If the user picks `Create new`, ask for the workspace name. Default suggestion: `claude_code`.

Persist the chosen workspace immediately so the next step's runner can read it:

```bash
HONCHO_NEW_WORKSPACE='<chosen workspace>' bun -e "
const fs=require('fs'),path=require('path'),os=require('os');
const file=path.join(os.homedir(),'.honcho','config.json');
let cfg={};try{cfg=JSON.parse(fs.readFileSync(file,'utf-8'));}catch{}
cfg.workspace=process.env.HONCHO_NEW_WORKSPACE;
fs.writeFileSync(file,JSON.stringify(cfg,null,2));
console.log('workspace=' + cfg.workspace);
"
```

#### Peer name

Now that the workspace is chosen, list existing peers in it so the user can either reclaim a known identity or pick a fresh one:

```bash
bun run "${CLAUDE_PLUGIN_ROOT}/dist/src/skills/list-peers-runner.js"
```

This prints JSON like `{"ok":true,"peers":["alice","claude","main"],"total":3,"aiPeer":"claude","workspace":"claude_code"}`. If the workspace was just created, `peers` will be empty. The `aiPeer` field tells you which entry in `peers` is the AI's identity for this host — exclude it from the user-facing picker (the user shouldn't claim Claude's peer name as their own), but feel free to surface it as informational context.

Read the OS username as a default for new peers:

```bash
bun -e "console.log(require('os').userInfo().username)"
```

Also read the existing `peerName` from config, if any, so re-runs surface the previous value as the default:

```bash
bun -e "
const fs=require('fs'),path=require('path'),os=require('os');
const file=path.join(os.homedir(),'.honcho','config.json');
let cfg={};try{cfg=JSON.parse(fs.readFileSync(file,'utf-8'));}catch{}
console.log(cfg.peerName||'');
"
```

Branch on the peer list:

- **0 peers** (fresh workspace): ask "What peer name should Honcho use for your identity? Default: `<existing peerName or OS username>`."
- **>0 peers**: present a picker via `AskUserQuestion` showing each existing peer (so the user can reclaim their identity if they're rejoining) plus a `Create new identity` option. The aiPeer (e.g. `claude`) may show up in this list — that's expected; the user shouldn't pick it as their own identity. Add a short description to disambiguate if needed.

Persist the chosen peer name:

```bash
HONCHO_NEW_PEER='<chosen peer>' bun -e "
const fs=require('fs'),path=require('path'),os=require('os');
const file=path.join(os.homedir(),'.honcho','config.json');
let cfg={};try{cfg=JSON.parse(fs.readFileSync(file,'utf-8'));}catch{}
cfg.peerName=process.env.HONCHO_NEW_PEER;
fs.writeFileSync(file,JSON.stringify(cfg,null,2));
console.log('peerName=' + cfg.peerName);
"
```

Then continue with step 6.

### 6. Validate the connection

Run the setup runner. It reads endpoint, apiKey, peerName, and workspace from `~/.honcho/config.json` and the environment, so the choices from steps 2 and 5 are already in effect:

```bash
bun run "${CLAUDE_PLUGIN_ROOT}/dist/src/skills/setup-runner.js"
```

If `CLAUDE_PLUGIN_ROOT` is not set, resolve the path:

```bash
bun -e "const h=require('os').homedir();const p=require('path');console.log(p.join(h,'.claude','plugins','cache','honcho','honcho'))"
```

Then find the version directory inside that path and run the setup runner from there.

The runner prints the resolved `Endpoint:` line on success — confirm with the user that it points where they expect (especially for self-hosted).

If it fails, help the user troubleshoot:
- Authentication error: key may be invalid; for SaaS, get a new one at https://app.honcho.dev; for self-hosted, check with the admin
- Network error (self-hosted): confirm the URL is reachable from this machine and `honcho-server` is running
- Network error (SaaS): check internet connection

### 7. Confirm setup

Tell the user that Honcho is configured and memory will be active on their next session. Suggest they restart Claude Code to see the memory context load.
