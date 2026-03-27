# Mighty Decks AI Storyteller

Mighty Decks AI Storyteller is a TypeScript monorepo for a local-first tabletop storytelling experience. It combines a React PWA for players and the shared screen, a Fastify and Socket.IO server for authoritative realtime state, and shared contracts in `spec/` that both sides import.

The repo started around a GM-less, text-first AI storyteller MVP and now also includes Adventure Module authoring and workflow tooling. This README is intentionally status-first so the current implementation is clear.

## Overview

- `apps/web` is the single Vite React PWA for the landing page, adventure runtime, Adventure Module authoring, workflow lab, image tooling, and rules reference pages.
- `apps/server` is the Node.js TypeScript orchestrator using Fastify and Socket.IO for adventure state, AI orchestration, image generation, workflow lab routes, and Adventure Module routes.
- `spec/` contains shared TypeScript contracts for adventure state, events, workflow lab, image generation, and Adventure Module data.
- `docs/` contains the product brief, MVP scope, architecture, event/state docs, deployment guides, and Adventure Module design docs.

Current route families:

- `/adventure/:adventureId`, `/adventure/:adventureId/player`, `/adventure/:adventureId/screen`
- `/adventure-module/list`, `/adventure-module/new`, `/adventure-module/:slug/:tab`, `/adventure-module/:slug/:tab/:entityId`
- `/workflow-lab`, `/workflow-lab/:workflowId`
- `/rules`, `/rules/outcomes`, `/rules/effects`, `/rules/stunts`, `/rules/assets`
- `/styleguide`, `/styleguide/location-card` (hidden internal component lab)
- `/image`

## Current Status

| Use case | What it covers | Status | Notes |
| --- | --- | --- | --- |
| AI Storyteller ad hoc sessions | Local multiplayer runtime with lobby, ready gate, pitch vote, narrated scenes, transcripts, async images, and ending flow | Partially implemented | Playable storyteller loop exists, but this is not a complete Mighty Decks runtime and only partial outcome-card related tooling is present |
| Adventure Module authoring | Module list/create flows, base tab, player info, storyteller info, and supporting docs for future authoring flows | Partially implemented | Authoring surface exists, but several entity editors and full publish-to-runtime flows are still incomplete |
| Run an Adventure Module with a human or AI storyteller | Launching or facilitating a session directly from a module | Planned | Use cases and design docs exist, but no end-to-end runtime launch flow is implemented yet |

The repo should not currently be read as a full implementation of Mighty Decks rules, components, or campaign systems.

## Requirements

- Node.js `22.x`
- `pnpm@10` via Corepack (`corepack enable`)
- An `OPENROUTER_API_KEY` for storyteller features and most AI-backed flows
- Optional: `cloudflared` for remote playtests outside your LAN
- Optional: a Render account if you want to deploy the single-service setup
- Optional: `FAL_API_KEY` and `LEONARDO_API_KEY` if you want alternative image generation providers or workflow-lab integrations

## Repository Layout

- `apps/web` - Vite React PWA for player, screen, authoring, rules, and workflow interfaces
- `apps/server` - Fastify and Socket.IO backend with AI orchestration and persistence helpers
- `spec` - shared contracts imported by both web and server
- `docs` - product, architecture, deployment, and design documentation

## Setup

1. Install dependencies.

```bash
corepack enable
pnpm install
```

2. Copy `.env.example` to root `.env.local`.

3. Fill at least the local dev values you need in root `.env.local`.

- Required for storyteller features: `OPENROUTER_API_KEY`
- Required for cross-device local play: `CORS_ORIGINS=http://localhost:5173,http://<LAN-IP>:5173`
- Common local defaults: `PORT=8081`, `MAX_ACTIVE_ADVENTURES=1`, `DEBUG_MODE=false`

The server loads environment files from either the repo root or `apps/server`, checking `.env.local` before `.env`.

4. Optional: create `apps/web/.env.local` only when the web app must call a different origin than its own page origin.

```env
VITE_SERVER_URL=http://<host>:8081
```

Notes:

- In local Vite dev on port `5173`, the browser stays on the Vite origin and the dev server proxies `/api`, `/adventures`, `/health`, and `/socket.io` to the backend `PORT`.
- The Vite proxy reads `PORT` from the repo-root `.env.local` or falls back to `8081`, so local API calls stay aligned even if your backend is pinned to `8080`.
- In the Render single-service deployment, the client uses same-origin API and Socket.IO calls, so `VITE_SERVER_URL` is not needed.
- For split-origin setups such as Cloudflare Tunnel, set `VITE_SERVER_URL` to the public API origin.

5. Start the local services.

```bash
pnpm -C apps/server dev
pnpm -C apps/web dev --host
```

6. Open `http://localhost:5173` on your main machine, or the Vite LAN URL on phones and other local devices.

## AI Setup

### Required for the storyteller runtime

- `OPENROUTER_API_KEY` enables the main storyteller, pitch generation, continuity, and default image generation flows.
- The storyteller runtime reads model IDs from env so you can swap providers without code changes.

Storyteller runtime defaults:

| Role | Env var | Default |
| --- | --- | --- |
| Narrative Director | `OR_TEXT_NARRATIVE_MODEL` | `deepseek/deepseek-v3.2` |
| Scene Controller | `OR_TEXT_SCENE_MODEL` | `google/gemini-2.5-flash-lite` |
| Outcome Decider | `OR_TEXT_OUTCOME_MODEL` | `google/gemini-2.5-flash-lite` |
| Continuity Keeper | `OR_TEXT_CONTINUITY_MODEL` | `google/gemini-2.5-flash-lite` |
| Pitch Generator | `OR_TEXT_PITCH_MODEL` | `deepseek/deepseek-v3.2` |
| Image Generator | `OR_IMAGE_MODEL` | `black-forest-labs/flux.2-klein-4b` |
| Optional image fallback | `OR_IMAGE_MODEL_FALLBACK` | unset |

Runtime tuning env vars already exist in `.env.example`, including:

- `TEXT_CALL_TIMEOUT_MS`
- `TURN_DEADLINE_MS`
- `IMAGE_TIMEOUT_MS`
- `AI_RETRY_COUNT`
- `VOTE_TIMEOUT_MS`

### Optional providers and advanced workflow settings

- `FAL_API_KEY` enables FAL-backed image and workflow adapters.
- `LEONARDO_API_KEY` enables Leonardo-backed image generation.
- `WF_*` environment variables configure workflow-lab model defaults and timeouts. They are not required for the core storyteller MVP loop.

If you only want the core AI storyteller runtime, start with `OPENROUTER_API_KEY` and the default model env vars.

## Deployment

### Local and LAN playtests

This repo is local-first. The usual dev setup is:

- server on `http://<host>:8081`
- web on `http://<host>:5173`
- Vite proxies local API and Socket.IO traffic to the backend `PORT`
- phones connect to the Vite LAN URL
- `CORS_ORIGINS` includes both localhost and your LAN origin

This is the best path for table playtests on the same network.

### Cloudflare Tunnel

Use Cloudflare Tunnel when you want HTTPS URLs outside your LAN without router port forwarding.

- Tunnel the web app to the Vite origin and the API to the server origin
- Set `apps/web/.env.local` with `VITE_SERVER_URL=https://<public-api-origin>`
- Add the public web origin to `CORS_ORIGINS`

See [docs/09-cloudflare-tunnel.md](docs/09-cloudflare-tunnel.md) for the full runbook.

### Render single-service deployment

The repo includes `render.yaml` for a single Render web service that:

- builds the web client in production mode
- starts the Node server with `node apps/server/dist/index.js`
- serves the built web client and API from the same origin
- exposes `/health` for health checks

Important constraints:

- keep the service at one instance for MVP because adventure state is in memory
- set `OPENROUTER_API_KEY` and `CORS_ORIGINS` in Render
- `NODE_VERSION` is pinned to `22.22.0` in `render.yaml`

See [docs/10-render-single-service.md](docs/10-render-single-service.md) for the full deployment guide.

## Contributing

Read [AGENTS.md](AGENTS.md) before making changes. The working contract for this repo is:

- read `docs/` and `spec/` before changing behavior
- implement changes as vertical slices: shared contract -> server -> client state -> UI
- keep the server authoritative for adventure state and phase changes
- do not expose debug-only data in player-visible payloads
- when changing `spec/`, make sure both server and web still compile against it
- update relevant docs and `CHANGELOG.md` in the same change when behavior, routes, env vars, deployment, or workflow expectations change

Useful verification commands before handing off a change:

```bash
pnpm typecheck
pnpm -C apps/server test
```

If you add or change environment variables, include a short note explaining what changed, how to run it, and any new env requirements.

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm -C apps/server test
pnpm -C apps/server dev
pnpm -C apps/web dev --host
```

## Further Reading

- [docs/00-product-brief.md](docs/00-product-brief.md)
- [docs/01-mvp-scope.md](docs/01-mvp-scope.md)
- [docs/03-architecture.md](docs/03-architecture.md)
- [docs/05-events-and-state.md](docs/05-events-and-state.md)
- [docs/09-cloudflare-tunnel.md](docs/09-cloudflare-tunnel.md)
- [docs/10-render-single-service.md](docs/10-render-single-service.md)
- [docs/15-adventure-use-cases-and-intents.md](docs/15-adventure-use-cases-and-intents.md)
- [docs/18-adventure-module-authoring-flow.md](docs/18-adventure-module-authoring-flow.md)
