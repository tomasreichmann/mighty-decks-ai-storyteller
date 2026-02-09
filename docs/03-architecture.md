# 03 – Architecture

This document describes the **system architecture** for the MVP:
how the frontend, backend, and AI agents are connected, and how data flows between them.

The architecture is designed to be:

- simple enough for fast iteration
- robust enough to avoid continuity bugs
- extensible toward audio, rules, and cloud deployment later

---

## High-level architecture

The system consists of three main parts:

1. **Client (PWA)** – player and screen UIs
2. **Server (Orchestrator)** – authoritative game state + AI coordination
3. **AI Providers (via OpenRouter)** – text and image generation

Phones (PWA) ─┐
├─ Socket.IO ──► Node Orchestrator ──► OpenRouter (text + image)
Screen (PWA) ─┘ │
└─ Adventure state, action queue, transcripts

---

## Client architecture (apps/web)

### Single app, multiple roles

- One React PWA
- Routes:
  - `/` – landing page
  - `adventure/:adventureId` – role selection
  - `adventure/:adventureId/player` – player UI
  - `adventure/:adventureId/screen` – screen UI

Role-specific behavior is driven by:

- the active route
- the server-published `adventure.phase`

### Client responsibilities

- Render UI based on server state
- Collect user input (text, votes, ready toggles)
- Display storyteller output
- Handle reconnection and state resync

### What clients do **not** do

- Decide game progression
- Store authoritative state
- Run AI logic
- Infer hidden information (secrets, tension)

---

## Server architecture (apps/server)

The server is the **single source of truth**.

### Core responsibilities

- Adventure lifecycle management
- Player presence and readiness
- Phase transitions
- Action queueing
- AI agent orchestration
- Broadcasting authoritative state to clients

---

## Key server modules

### AdventureManager

- Creates and destroys adventures
- Supports multiple concurrent adventures with a configurable adventure cap
- Tracks connected clients and roles
- Handles join / leave / reconnect

### AdventureState

Authoritative state per adventure, including:

- players and readiness
- current phase
- active vote (if any)
- current scene (public + debug)
- transcript
- session metadata

AdventureState is never mutated directly by clients.

---

### ActionQueue

- FIFO queue per adventure
- Ensures only one player action is processed at a time
- Prevents race conditions and continuity drift

Rules:

- Enqueue on player submit
- Dequeue only after AI response is committed
- While queue is non-empty, new submissions are blocked
- Drafting in the input box may continue while submit remains disabled

---

## Phase control

Phase transitions are **server-driven only**.

Valid phases (MVP):

- `lobby`
- `vote`
- `play`
- `ending`

Phase changes occur when:

- all connected `player` clients are ready
- all connected `player` clients cast the active vote
- active vote hits `20000ms` timeout
- AI closes a scene and the transition vote resolves to `Next Scene`
- a player ends the session
- the transition vote resolves to `End Session`

Clients listen for phase updates and re-render accordingly.

---

## AI orchestration

### Agent-based pipeline

AI logic is decomposed into agents with narrow responsibilities:

- **Pitch Generator** – creates adventure options
- **Narrative Director** – main storyteller voice
- **Scene Controller** – scene framing and closure decisions
- **Continuity Keeper** – rolling summary + facts
- **Image Generator** – scene images

Agents are orchestrated sequentially, not in parallel, for MVP simplicity.

---

### OpenRouter integration

All AI calls go through **OpenRouter**:

- Text models for narrative agents
- Image model for scene images

Including:

- **FLUX.2 Klein 4B** accessed via OpenRouter for image generation

Benefits:

- Single API surface
- Easy model swapping
- Built-in fallback routing
- Consistent vote timeout and tie-break handling from one orchestration layer

---

## Image generation flow

1. Scene text is generated and broadcast immediately
2. Image generation is triggered asynchronously
3. When image is ready:
   - Server updates scene state
   - Clients update image slot

Image generation must never block scene start.

---

## Data flow: player action → response

1. Player submits action text
2. Server enqueues action
3. Server updates clients: “Storyteller is thinking…”
4. AI agents process:
   - Continuity update
   - Narrative response
   - Scene continuation or closure
5. Server commits results to AdventureState
6. Server broadcasts updates to all clients
7. ActionQueue advances

---

## State synchronization & reconnection

- Clients connect via Socket.IO
- On reconnect:
  - Client sends its ephemeral `playerId`
  - Server sends full current AdventureState
  - Server restores ready/vote state if `playerId` matches
  - Client renders immediately
- No client-side assumptions about progression

---

## Persistence (MVP)

- Adventure state is kept in memory
- Optional transcript dump at end of session
- No cross-session persistence
- No database required for MVP

(Pluggable persistence layer may be added later.)

---

## Local development mode (initial target)

### Characteristics

- Server runs on a local machine (Windows laptop)
- Clients connect over LAN
- AI calls go to OpenRouter over internet
- Local/dev default can cap active adventures with `MAX_ACTIVE_ADVENTURES=1`

### Why local-first

- Fast iteration
- Easy debugging
- Matches in-person table setup

Cloud deployment is a packaging concern and intentionally deferred.

Multi-adventure support remains part of the server architecture for cloud deployment.

---

## Failure handling (MVP)

- Timeout budgets are enforced per call and per turn
- Vote timeout is `20000ms` with randomized tie-breaker for ties
- Model errors → retry once, then fallback model
- If retries and fallback fail, emit short neutral fail-forward narration
- Temporary latency → UI shows thinking indicator
- Client disconnect → reconnection allowed
- Server crash → session lost (acceptable for MVP)

---

## Architectural non-goals (MVP)

- Horizontal scaling
- Multi-region support
- High availability guarantees
- Offline play
- Deterministic replay

---

## Summary

The MVP architecture prioritizes:

- **clarity of authority**
- **predictable flow**
- **continuity safety**
- **low cognitive load**

This foundation is intentionally minimal but leaves clear extension points for:
audio, rules, persistence, and cloud scaling in later phases.
