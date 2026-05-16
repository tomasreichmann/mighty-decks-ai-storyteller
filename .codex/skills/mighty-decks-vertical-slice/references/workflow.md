# Vertical Slice Workflow

## Source Order

- `AGENTS.md` is the project contract.
- `docs/19-contributor-styleguide.md` is the concise contributor reference.
- `docs/` explains behavior, routes, UX, deployment, and workflow.
- `spec/*.ts` owns public contracts imported by web and server.

## Implementation Order

- Contracts: update `spec/*.ts` first for public state, events, DTOs, route payloads, and schema-like types.
- Server: update authoritative state, persistence stores, Fastify routes, Socket.IO handlers, action queues, model/provider boundaries, and server tests.
- Web: update hooks/API clients/state first, then presentational components and route rendering.
- UI: use `mighty-decks-ui-patterns` for route shells, styleguide, panels, cards, board/table surfaces, or visual refactors.
- Rules/content: use `mighty-decks-rules` for adventure, encounter, cards, effects, counters, scene pacing, and ship combat decisions.
- Image artifacts: when adding files served by `/api/adventure-artifacts/*`, update `apps/server/output/adventure-artifacts/index.json` in the same change so clean checkouts can resolve the image.

## Docs And Changelog

- Update docs in the same change when product behavior, public contracts, routes, env vars, deployment, or contributor workflow changes.
- Update `CHANGELOG.md` under `## [Unreleased]`.
- Use concise bullets under `Added`, `Changed`, `Fixed`, or `Docs`.
- Skip pure internal refactors unless they change behavior, fix a bug, or clarify important contributor context.

## Verification

- Use narrow checks for focused changes.
- If `spec/` changes, run `pnpm -C spec build` or a command that prepares spec automatically.
- If adventure-artifact images changed, confirm each new `/api/adventure-artifacts/*` image path has a matching `apps/server/output/adventure-artifacts/index.json` entry.
- Useful defaults:
  - `pnpm typecheck`
  - `pnpm -C apps/server test`
  - route/component-specific tests when present
- Style-only changes usually do not need brittle class-name or DOM-structure assertions unless behavior changed.
