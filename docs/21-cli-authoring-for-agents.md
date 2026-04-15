# 21 - CLI Authoring for Agents

This document is the canonical machine-facing authoring surface for persisted `Adventure Module` and `Campaign` content.

It is designed for external agents that want discovery-first, JSON-first CRUD without going through the web UI.

---

## 1. Core Contract

- All commands emit exactly one JSON document to stdout on both success and failure.
- Success payloads use `{ ok: true, scope, command, result }`.
- Failure payloads use `{ ok: false, scope?, command, error }`.
- Nonzero exit codes indicate failure.
- Mutation payloads accept `--input-json`, `--input-file`, or stdin JSON.
- Prefer `--input-file` or stdin for multi-field or multiline payloads. Reserve `--input-json` for short one-line bodies, especially on Windows or PowerShell.

The CLI itself emits one JSON document to stdout. If you invoke it through `pnpm` or an agent shell that also prints wrapper text, extract the CLI JSON envelope from the combined transcript instead of assuming the outer runner is silent.

This CLI covers persisted authoring only.

Out of scope:

- live session chat
- Socket.IO session controls
- outcome deck actions
- shared session table operations

---

## 2. Discovery First

Agents should begin with:

- `pnpm -C apps/server author:module -- capabilities`
- `pnpm -C apps/server author:module -- schema`
- `pnpm -C apps/server author:module -- catalog`
- `pnpm -C apps/server author:campaign -- capabilities`
- `pnpm -C apps/server author:campaign -- schema`
- `pnpm -C apps/server author:campaign -- catalog`

Discovery payloads provide:

- supported commands
- supported resources
- selector flags
- per-operation input/output schemas derived from server Zod contracts
- valid static catalog choices for enum-backed and card-backed fields

---

## 3. Module CLI

Entry point:

- `pnpm -C apps/server author:module -- <command>`

Top-level commands:

- `capabilities`
- `schema`
- `catalog`
- `list`
- `get`
- `create`
- `clone`
- `delete`
- `update-index`
- `update-fragment`
- `update-cover-image`
- `preview`

Nested resources:

- `actor`
- `counter`
- `asset`
- `location`
- `encounter`
- `quest`

Nested actions:

- `list`
- `get`
- `create`
- `update`
- `delete`

Compatibility alias:

- `pnpm -C apps/server author:module -- add-actor --module <module-slug> --prompt "<text>" [--creator-token <token>]`

---

## 4. Campaign CLI

Entry point:

- `pnpm -C apps/server author:campaign -- <command>`

Top-level commands:

- `capabilities`
- `schema`
- `catalog`
- `list`
- `get`
- `create`
- `delete`
- `update-index`
- `update-fragment`
- `update-cover-image`

Nested resources and nested actions match the Module CLI:

- `actor|counter|asset|location|encounter|quest`
- `list|get|create|update|delete`

Campaign creation prefers source-module slug selectors:

- `--source-module <module-slug>`
- fallback `--source-module-id <module-id>`

---

## 5. Selector Rules

Slug-first selectors:

- module top-level: `--slug`, fallback `--id`
- module nested parent: `--module`, fallback `--module-id`
- campaign top-level: `--slug`, fallback `--id`
- campaign nested parent: `--campaign`, fallback `--campaign-id`

Resource selectors:

- actors: `--actor`, fallback `--slug`, or `--fragment-id`
- counters: `--counter`, fallback `--slug`
- assets: `--asset`, fallback `--slug`, or `--fragment-id`
- locations: `--location`, fallback `--slug`, or `--fragment-id`
- encounters: `--encounter`, fallback `--slug`, or `--fragment-id`
- quests: `--quest`, fallback `--slug`, or `--fragment-id`

Module ownership-sensitive commands also accept:

- `--creator-token <token>`

Creator-token recovery:

- the web authoring UI stores the raw token in browser `localStorage` under `mighty_decks_adventure_module_creator_token`
- the server persists only a hash, so the original token cannot be recovered from stored module or campaign files later

---

## 6. Shared Catalogs

`catalog` exposes static valid choices from shared code, not ad hoc docs.

Current categories:

- actor base layers
- actor tactical roles
- actor tactical specials
- counter icons
- asset base items
- asset modifiers
- module enums:
  - status
  - session scope
  - launch profile
  - fragment kinds
  - fragment audiences
- built-in outcome shortcodes
- built-in effect shortcodes
- built-in stunt shortcodes

The effect and stunt catalogs now live in `spec/` so the server CLI and web authoring surfaces share one source of truth.

---

## 7. Examples

These examples prefer `--input-file` because it avoids brittle shell escaping for JSON payloads.

Create a module:

```bash
pnpm -C apps/server author:module -- create --creator-token author-token --input-file module.create.json
```

Create an actor:

```bash
pnpm -C apps/server author:module -- actor create --module exiles-draft --creator-token author-token --input-file actor.create.json
```

Create a campaign from a module slug:

```bash
pnpm -C apps/server author:campaign -- create --source-module exiles-draft --input-file campaign.create.json
```

Inspect update schemas before mutating:

```bash
pnpm -C apps/server author:module -- schema --resource actor --action update
```

Import Exiles from the legacy folder:

```bash
pnpm -C apps/server import:adventure-module -- --creator-token author-token
```

---

## 8. Repo-Local Agent Discovery

The repo now includes a local Codex skill for this surface:

- `.codex/skills/adventure-authoring-cli/SKILL.md`
- `.codex/skills/adventure-authoring-cli/agents/openai.yaml`

Agents should use that skill when they need to discover, inspect, or mutate Modules and Campaigns from the terminal.
