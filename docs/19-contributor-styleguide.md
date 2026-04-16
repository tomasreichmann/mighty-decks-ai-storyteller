# 19 - Contributor Styleguide

This is the short reference for repo conventions already used across the codebase.

Use it alongside `AGENTS.md` and `README.md`. If instructions conflict, `AGENTS.md` wins.

---

## 1. Work from shared contracts outward

- Read `docs/` and `spec/` before changing behavior.
- Shared contracts live in `spec/*.ts` and are imported by both web and server.
- Implement behavior changes as vertical slices: `spec` -> server -> client state -> UI.
- If you edit `spec/` directly while using split commands, rerun `pnpm -C spec build`.

---

## 2. Keep TypeScript explicit and modules small

- Use TypeScript everywhere and keep strict typing intact.
- Avoid `any` unless the boundary genuinely requires it and the reason is clear.
- Prefer pure helpers, focused modules, and names that explain intent.
- Keep runtime validation at boundaries when Zod schemas already exist.
- Avoid new dependencies unless they clearly reduce MVP complexity.

---

## 3. Follow the established UI and server split

- Keep UI components presentational; move orchestration, persistence, and async coordination into hooks or server-side modules.
- Reuse shared UI primitives such as `Button`, and keep player-facing surfaces narration-first instead of dashboard-heavy.
- Treat the server as authoritative for adventure state, phase changes, scenes, transcripts, and hidden/debug data.
- Prefer retry-safe and idempotent handlers where practical, especially for toggles, votes, and async lookups.

---

## 4. Use repo-native naming and documentation habits

- Use `Adventure` terminology in routes, events, and state; do not introduce `room` aliases.
- Keep public and debug payloads explicit instead of relying on implicit filtering.
- Update relevant docs in the same change when behavior, routes, env vars, deployment, or contributor workflow changes.
- Update `CHANGELOG.md` under `## [Unreleased]` with concise `Added`, `Changed`, `Fixed`, or `Docs` bullets when the change matters to players, operators, or future contributors.

---

## 5. Keep comments and JSDoc intentional

- Prefer self-explanatory code first.
- Use short inline comments for invariants, recovery paths, tricky effects, or non-obvious control flow.
- Use JSDoc for helpers with contract-like behavior worth documenting, such as inputs, outputs, fallback behavior, or subtle constraints.
- Do not leave tool- or agent-branded notes in checked-in code.
- When a component renders a root element with a `className`, start the class list with a component-name token in kebab-case so the root is easy to search and visually identify in code review. Apply this to new shared components and to updated shared components when you touch them.

---

## 6. Default verification commands

- `pnpm typecheck`
- `pnpm -C apps/server test`
- `pnpm dev`
- `pnpm -C apps/server dev`
- `pnpm -C apps/web dev --host`
- Style-only changes usually do not need new automated tests; avoid brittle class-name or DOM-structure assertions unless the change also affects behavior or a public contract.
