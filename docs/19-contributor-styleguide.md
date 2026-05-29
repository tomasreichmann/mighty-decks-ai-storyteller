# 19 - Contributor Styleguide

This is the compact repo reference that sits alongside `AGENTS.md`.

## Shared-contract flow

- Read the relevant `docs/` and `spec/` files before changing behavior.
- Use targeted search first; avoid loading unrelated logs, generated output, or assets.
- Implement changes vertically: `spec` -> server -> client state -> UI.
- If you edit `spec/` directly, rerun `pnpm -C spec build`.

## Coding baseline

- Use strict TypeScript and keep modules small.
- Avoid `any` unless the boundary genuinely needs it.
- Prefer pure helpers, clear names, and runtime validation where Zod already exists.
- Keep UI presentational and orchestration/server logic separate.

## Repo habits

- Use `Adventure` terminology; do not add `room` aliases.
- Keep public and debug payloads explicit.
- Update docs and `CHANGELOG.md` when behavior, routes, env vars, or workflow change.
- Keep comments short and intentional.

## Repo-local skills

- `adventure-authoring-cli` for Adventure Modules or Campaigns from the terminal.
- `mighty-decks-vertical-slice` for changes crossing `spec`, server, web, docs, or changelog.
- `mighty-decks-ui-patterns` for web UI, styleguide, shared components, board/table, `/board`, and `/spaceship`.
- `mighty-decks-rules` for gameplay, adventure, encounter, card, effect, counter, scene pacing, and ship-combat decisions.

## Verification

- Prefer `pnpm check:agent`, `pnpm test:agent`, and `pnpm build:agent` first.
- Use narrow checks before full `typecheck`, `test`, or `build`.
- Use `webapp-testing` only when a change needs browser verification of behavior, interactions, or runtime bugs; skip it for cosmetic-only or content-only edits unless you need to confirm a regression in a real browser.
- Summarize results instead of pasting raw logs.
