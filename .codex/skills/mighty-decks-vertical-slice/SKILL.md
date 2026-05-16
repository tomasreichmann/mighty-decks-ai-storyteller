---
name: mighty-decks-vertical-slice
description: Use when working in this repo on behavior that may cross shared spec contracts, server routes or Socket.IO handlers, client state, React UI, image/artifact content, docs, or changelog entries.
---

# Mighty Decks Vertical Slice

Use this skill to keep repo changes aligned from contract to UI instead of patching one layer in isolation.

## Workflow

1. Read the relevant files under `docs/` and `spec/` before changing behavior.
2. Start with shared contracts in `spec/*.ts` when public state, DTOs, events, routes, or validation shape changes.
3. Update server authority next: stores, route handlers, Socket.IO handlers, queues, AI/config boundaries, and tests.
4. Update web state and UI after the contract/server shape is clear.
5. Update docs and `CHANGELOG.md` in the same change when behavior, contracts, routes, env vars, deployment, or contributor workflow changes.
6. Verify with the narrowest meaningful commands, then broaden only when the blast radius warrants it.

## Image Artifact Guardrail

- When adding image files served through `/api/adventure-artifacts/*`, register them in `apps/server/output/adventure-artifacts/index.json` in the same change.
- Check this especially when adding generated adventure art, imported module stills, spaceship/device images, actor portraits, title images, or new content bundle images.
- If the image is only a static web asset under `apps/web/public`, use the web asset path instead and do not add an adventure-artifact index entry.

## Project Invariants

- Use `Adventure` naming in routes, events, and state; do not introduce `room` aliases.
- Keep the server authoritative for adventures, phases, scenes, transcript, hidden/debug state, and phase transitions.
- Keep public and debug payloads explicit. Never leak tension, secrets, pacing notes, or hidden tags to player-visible data.
- Prefer idempotent and retry-safe handlers for ready toggles, votes, joins, and async operations.
- Phase quorum uses currently connected `player` clients only.
- Runtime AI/vote timeout and retry config is screen-only and global to the server process in MVP.

## References

- Read `references/workflow.md` for implementation order, docs/changelog rules, and verification guidance.
