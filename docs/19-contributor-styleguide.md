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
- New TS/TSX source and tests must stay at or below 350 physical lines. `pnpm check:file-lengths` warns above 300 and fails above 350, including existing violations. Exceptions require an exact path and reason in `scripts/file-length-exceptions.json`; ordinary legacy debt is not excepted.

## Campaign AI foundation

- Follow the [MIG-21 architecture and dependency map](plans/2026-10-05-mig-21-ai-orchestration-architecture.md) for new Campaign Session AI work. Existing Adventure AI and Workflow Lab remain separate, operational legacy paths.
- Keep canonical runtime contracts in responsibility-focused `spec/ai*.ts` files. New Campaign runtime modules depend on typed Campaign ports and shared contracts, not source Adventure stores, route modules, Workflow Lab execution, UI, or direct filesystem access. `pnpm check:architecture` enforces the initial import boundary.
- A running or directed-waiting Session exclusively owns Campaign mutation authority. Other Sessions can remain open read-only; authoring edits resume between runs. Implement authority and rollback through the later transaction capability, not a model prompt.

## Repo habits

- Use `Adventure` terminology; do not add `room` aliases.
- Keep public and debug payloads explicit.
- Update docs and `CHANGELOG.md` when behavior, routes, env vars, or workflow change.
- Keep comments short and intentional.
- Keep reusable card rendering and catalog projection in the `@mighty-decks/components` Git dependency, which tracks its `main` branch; keep Adventure/session callbacks in the app adapter layer. Refresh it with `pnpm update --recursive --prod @mighty-decks/components`, then install and run the relevant checks.
- The package owns English rules documents. Import them from the package; do not restore local rulebook or fast-session-prompt mirrors.

## Repo-local skills

- `adventure-authoring-cli` for Adventure Modules or Campaigns from the terminal.
- `mighty-decks-vertical-slice` for changes crossing `spec`, server, web, docs, or changelog.
- `mighty-decks-ui-patterns` for web UI, styleguide, shared components, board/table, `/board`, and `/spaceship`.
- `mighty-decks-rules` for gameplay, adventure, encounter, card, effect, counter, scene pacing, and ship-combat decisions.

## Verification

- Prefer `pnpm check:agent`, `pnpm test:agent`, and `pnpm build:agent` first. `check:agent` includes strict file lengths, import boundaries, and typecheck; file-length failures from existing debt are expected until cleaned up. Run the typecheck wrapper separately when diagnosing that known guard failure.
- Use narrow checks before full `typecheck`, `test`, or `build`.
- Use `webapp-testing` only when a change needs browser verification of behavior, interactions, or runtime bugs; skip it for cosmetic-only or content-only edits unless you need to confirm a regression in a real browser.
- Summarize results instead of pasting raw logs.
