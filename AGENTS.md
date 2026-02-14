# AGENTS.md — Mighty Decks AI Storyteller (MVP)

This repo builds a **GM-less, text-first** multiplayer “AI Storyteller” for 1–5 players.
It is a **single React PWA** with **two roles** (Player + Screen) connected to a **Node.js (TypeScript) Socket.IO** orchestrator.
Models are accessed via **OpenRouter** including image generation.

Codex: follow this file as the highest-priority project contract.

---

## North star (MVP)

Deliver a session where **1–5 players can create/join an adventure, vote on an adventure pitch, play at least one fun scene**, and end the session — **text-only** (no audio, no TTS, no music, no cards, no stat tracking).

### Explicitly out of scope (MVP)

- Audio streaming, push-to-talk, transcription, TTS
- Mighty Decks rules/cards/components UI
- Player stats/inventory systems
- Multi-session campaigns, accounts/profiles
- Consent tooling, retcon voting UI (phase 2+)
- Spectators

---

## Product behavior (high level)

### Terminology

- `Adventure` is the user-facing container.
- A single playable run is a `session` within an adventure.
- MVP supports one session per adventure (future versions can add “Start New Session” on an existing adventure).
- Use `Adventure` naming only in routes, events, and state (`room` aliases are not supported).

### Routes

- `/` — landing page with hero section and `Create Adventure` CTA
- `adventure/:adventureId` — role selection (Player vs Screen) → redirect
- `adventure/:adventureId/player` — player UI (dynamic by server phase)
- `adventure/:adventureId/screen` — storyteller screen UI (scene + transcript; debug optional)

### Phase-driven UI (no client-side redirects by orchestrator)

Server publishes `adventure.phase` and clients render accordingly:

- `lobby` → character/adventure text + ready gate
- `vote` → generic vote panel (adventure pitches)
- `play` → narrated scene + action composer
- `ending` → session summary + adventure closed

### Scene presentation (player-visible)

- Image (async, may arrive after text)
- Intro prose (narrated)
- 2–4 orientation bullets (goal/pressure, exits, who’s here)

### Debug mode (screen-only)

Hidden internal tags (tension, secrets, pacing notes) display only when `debug=true`.

---

## Tech stack (safe defaults)

### Frontend

- Vite + React + TypeScript + Tailwind
- Single app, shared components
- PWA (installable)

### Backend (local dev first)

- Node.js + TypeScript
- Fastify (preferred) or Express (acceptable)
- Socket.IO for realtime adventures, presence, reconnection

### AI

- OpenRouter for text models + routing/fallbacks
- Image generation: `black-forest-labs/flux.2-klein-4b`

---

## Model assignments (defaults)

Use env-configured model IDs so we can swap freely in playtests.

- Narrative Director (main storyteller): `deepseek/deepseek-v3.2` (fallback: `google/gemini-2.5-flash`)
- Scene Controller (structure/transitions): `google/gemini-2.5-flash-lite` (fallback: `google/gemini-2.5-flash`)
- Continuity Keeper (rolling summary/facts): `google/gemini-2.5-flash-lite` (fallback: `deepseek/deepseek-v3.2`)
- Pitch Generator (2–3 adventure options): `deepseek/deepseek-v3.2` (fallback: `google/gemini-2.5-flash`)
- Image Generator: `black-forest-labs/flux.2-klein-4b`

---

## Repository structure (expected)

- `apps/web` # Vite React PWA (player + screen)
- `apps/server` # Node TS orchestrator + agents + Socket.IO
- `docs/` # requirements & architecture
- `spec/` # TS schemas: events, adventure state, agents

### Rules for schemas

- **All contracts live in `/spec/*.ts`** (events/state/DTOs). UI and server must import from there.
- Prefer TypeScript types + runtime validation (e.g., zod) at boundaries **if already present**.
- Keep public vs debug payloads explicit (e.g., `scene.public` vs `scene.debug`).

---

## Coding standards

- TypeScript everywhere; strict typing (no `any` unless justified)
- Prefer pure functions + small modules
- Avoid adding dependencies unless necessary; explain why in PR notes
- Keep UI components presentational; keep orchestration/state in hooks/stores
- Never bake secrets/tension into player-visible payloads (debug-only)

### UI conventions

- One `Button` component with variants (`primary|secondary|ghost|danger`) and sizes.
- Keep “dry dashboards” out of player view: narration-first.

### Server conventions

- **Authoritative state on server** (adventures, phase, scene, transcript).
- **FIFO action queue per adventure** to prevent concurrency/continuity bugs.
- Idempotent/retry-safe events where possible (e.g., ready toggles, votes).
- Phase quorum uses currently connected `player` clients only.
- Vote timeout is `20000ms`; votes close early if all connected `player` clients have voted.
- Tied votes are resolved by server-side randomized tie-breaker.
- Enforce timeouts + fallbacks on model calls; never block an adventure forever.
- Runtime AI/vote timeout and retry config is screen-only and adjustable without restart.
- Runtime timeout/retry config is global for the server process in MVP.
- Track latency metrics (`average` + `p90`) for storyteller response times.

---

## Local development workflow (start here)

> Cloud deployment comes later. MVP must run locally with multiple devices on LAN.

### Environment

Create `.env.local` (not committed):

- `PORT=...`
- `CORS_ORIGINS=http://localhost:5173,http://<LAN-IP>:5173`
- `OPENROUTER_API_KEY=...`
- `OR_TEXT_NARRATIVE_MODEL=...`
- `OR_TEXT_SCENE_MODEL=...`
- `OR_TEXT_CONTINUITY_MODEL=...`
- `OR_TEXT_PITCH_MODEL=...`
- `OR_IMAGE_MODEL=black-forest-labs/flux.2-klein-4b`
- `TEXT_CALL_TIMEOUT_MS=30000`
- `TURN_DEADLINE_MS=18000`
- `IMAGE_TIMEOUT_MS=30000`
- `AI_RETRY_COUNT=1`
- `VOTE_TIMEOUT_MS=60000`
- `MAX_ACTIVE_ADVENTURES=1` # local/dev default
- `DEBUG_MODE=false`

### Commands (update if package manager differs)

- `pnpm install`
- `pnpm -C apps/server dev`
- `pnpm -C apps/web dev --host` (LAN access for phones)

---

## How to work in this repo (Codex operating procedure)

1. **Read `/docs/` and `/spec/` before coding.**
2. When implementing a feature, do it as a **vertical slice**:
   - spec types/events → server handler → client state → UI component
3. Keep MVP scope tight. If a requested change expands scope, propose a smaller MVP alternative.
4. When modifying contracts in `/spec`, update both server + web compilation.
5. Always add a short note in commit/PR describing:
   - what changed
   - how to run it
   - any new env vars

---

## Deliverables for MVP (definition of done)

- Adventure create/join; presence roster; ready gate
- Adventure pitch vote (generic vote panel) → chosen pitch locked
- Scene 1 starts with narrated intro + async image
- Players send text actions → storyteller responds coherently
- Scene can close with summary and transition
- End session button triggers final summary + adventure closed

---

## Non-functional priorities (MVP)

- Latency perception matters: show “thinking” and stream partial output if available.
- Continuity > fancy prose: names/facts should not randomly change.
- Cost guardrails: cap tokens per response; limit images to 1 per scene start.
