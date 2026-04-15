---
name: adventure-authoring-cli
description: Use when working in this repo and an agent needs to inspect or edit Adventure Modules or Campaigns from the terminal without using the web UI.
---

# Adventure Authoring CLI

Use the repo-local JSON-first authoring CLI for persisted content changes.

## When To Use

- You need full CRUD for `Adventure Module` or `Campaign` content.
- You need machine-readable discovery before mutating data.
- You want valid built-in card and enum choices without scraping docs.
- You are an external agent translating natural language into structured CLI calls.

## Quick Start

Start with discovery instead of guessing:

```bash
pnpm -C apps/server author:module -- capabilities
pnpm -C apps/server author:module -- schema
pnpm -C apps/server author:module -- catalog

pnpm -C apps/server author:campaign -- capabilities
pnpm -C apps/server author:campaign -- schema
pnpm -C apps/server author:campaign -- catalog
```

All commands print exactly one JSON document to stdout and use nonzero exit codes on failure.
If you are running through `pnpm` or a wrapper that merges stderr and stdout, extract the CLI JSON envelope from the combined transcript instead of assuming the wrapper is silent.

## Input Rules

- Prefer slug selectors.
- Module top-level selectors: `--slug`, fallback `--id`
- Module nested parent selectors: `--module`, fallback `--module-id`
- Campaign top-level selectors: `--slug`, fallback `--id`
- Campaign nested parent selectors: `--campaign`, fallback `--campaign-id`
- Resource selectors: `--actor`, `--counter`, `--asset`, `--location`, `--encounter`, `--quest`, plus `--slug` and sometimes `--fragment-id`
- Mutation payloads accept `--input-json`, `--input-file`, or stdin JSON
- Prefer `--input-file` or stdin for non-trivial payloads, multiline markdown, or Windows/PowerShell shells
- Reserve `--input-json` for short one-line payloads where shell escaping stays obvious

## Creator Tokens

- Module ownership-sensitive commands accept `--creator-token <token>`
- The web authoring UI stores the raw token in browser `localStorage` under `mighty_decks_adventure_module_creator_token`
- The server stores only a hash, so the original token cannot be reconstructed from persisted module or campaign files

## Supported Module Commands

- Top-level: `capabilities`, `schema`, `catalog`, `list`, `get`, `create`, `clone`, `delete`, `update-index`, `update-fragment`, `update-cover-image`, `preview`
- Resources: `actor`, `counter`, `asset`, `location`, `encounter`, `quest`
- Resource actions: `list`, `get`, `create`, `update`, `delete`
- Compatibility alias: `add-actor --module <slug> --prompt <text>`

## Supported Campaign Commands

- Top-level: `capabilities`, `schema`, `catalog`, `list`, `get`, `create`, `delete`, `update-index`, `update-fragment`, `update-cover-image`
- Resources: `actor`, `counter`, `asset`, `location`, `encounter`, `quest`
- Resource actions: `list`, `get`, `create`, `update`, `delete`

## Examples

```bash
pnpm -C apps/server author:module -- create --creator-token author-token --input-file module.create.json

pnpm -C apps/server author:module -- actor create --module exiles-draft --creator-token author-token --input-file actor.create.json

pnpm -C apps/server author:campaign -- create --source-module exiles-draft --input-file campaign.create.json

pnpm -C apps/server import:adventure-module -- --creator-token author-token
```

## Catalog Guidance

Use `catalog` before choosing:

- actor base layers, tactical roles, tactical specials
- counter icons
- asset base items and modifiers
- module enums like status, session scope, launch profile, fragment kinds, and audiences
- built-in outcome, effect, and stunt shortcodes

## Notes

- Campaign session chat, table, and live socket operations are intentionally out of scope here.
- `import:adventure-module` stays separate from generic CRUD, but it follows the same JSON stdout convention.
