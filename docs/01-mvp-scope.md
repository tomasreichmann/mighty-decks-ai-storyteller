# 01 – MVP Scope

This document defines **exactly what is in scope and out of scope** for the MVP.
Anything not listed as “in scope” should be assumed **explicitly excluded**, even if it seems small or obvious.

The goal is to **prove fun, flow, and continuity** with the smallest possible surface area.

---

## MVP definition (short)

A **text-only, GM-less AI Storyteller** that allows **1–5 players to join an adventure, vote on an adventure pitch, play through at least one complete scene, and end the session with a summary**.

---

## In scope (MVP)

### 1. Adventure & session

- Create an adventure with a unique `adventureId`
- Join adventure via `adventureId` (no accounts, no auth)
- Role selection:
  - Player
  - Screen (Storyteller display)
- Presence tracking (connected / disconnected)
- End session from any player
- Landing page at `/` with hero copy and `Create Adventure` CTA

---

### 2. Player setup

- Text input only:
  - Character name
  - Character visual description
  - Adventure preference (free text)
- Ready / Not ready toggle
- All connected `player` role clients must be Ready to proceed

---

### 3. Phase-driven flow

The server controls the active phase; clients render based on phase.

Phases in MVP:

- `lobby` – setup + ready gate
- `vote` – adventure pitch voting
- `play` – scene-based play
- `ending` – session summary

No manual navigation between phases on the client.

---

### 4. Adventure pitch & voting

- AI generates **2–3 adventure pitches** based on player inputs
- Players vote (single-choice)
- Winning pitch is locked in
- Voting UI is generic and reusable

---

### 5. Scene-based play

Scenes are narratively self-contained units.

Each scene includes:

- Narrated intro prose (text)
- Optional generated image (async)
- Clear player-facing goal or pressure
- Obvious exits or directions
- Player text actions
- AI reactions with fail-forward logic
- Scene closure with a short summary
- Scene-transition vote (`Next Scene` vs `End Session`)

At least **one complete scene** must be playable.

---

### 6. Storyteller behavior (MVP rules)

- Reacts to player actions in a concise, narrative voice
- Secretly biases outcomes toward success (~75%)
- Failures must introduce new situations, not dead ends
- Maintains internal continuity (names, locations, facts)
- Closes scenes proactively when appropriate
- Responds to “not having fun” feedback by pivoting tone or pacing

---

### 7. UI (MVP-critical)

- Single React PWA with shared components
- Routes:
  - `/`
  - `adventure/:adventureId`
  - `adventure/:adventureId/player`
  - `adventure/:adventureId/screen`
- Player UI:
  - Character setup
  - Voting
  - Scene view (condensed)
  - Action input
  - End session
- Screen UI:
  - Scene presentation (image + narration + orientation)
  - Transcript feed
  - Ready gate and voting visibility
- Debug mode (screen only, optional):
  - Shows hidden scene metadata

---

### 8. AI & models

- All AI access via **OpenRouter**
- Separate agents for:
  - Narrative direction
  - Scene control
  - Continuity tracking
  - Pitch generation
  - Image generation
- Image generation uses **FLUX.2 Klein 4B via OpenRouter**
- Model choice configurable via environment variables

---

### 9. Technical scope

- Local development mode first (laptop-hosted server, LAN clients)
- Node.js + TypeScript backend
- Socket.IO for realtime communication
- In-memory state is sufficient for MVP
- Session transcript saved only at end (optional)
- Vote timeout for all votes is `20000ms` with server-side randomized tie-breaker

---

## Explicitly out of scope (MVP)

### Gameplay & systems

- Mighty Decks rules, cards, decks, stats, inventories
- Dice systems, explicit probability displays
- Combat systems
- XP, progression, or character sheets

### Audio & media

- Audio input (push-to-talk)
- Audio output (TTS)
- Music or ambience
- Sound effects

### Persistence & accounts

- User accounts or authentication
- Character saving or reuse
- Campaign persistence across sessions
- Cloud saves

### Safety & moderation

- Consent / lines & veils UI
- Retcon voting
- Panic buttons
- Content moderation dashboards

### Social & scale

- Spectators
- Matchmaking or public lobbies
- Cross-table play
- Moderation tools

---

## Acceptance criteria (MVP)

The MVP is complete when:

1. An adventure can be created and joined by 1–5 players
2. Players can enter setup text and ready up
3. Adventure pitches are generated and voted on
4. A scene starts with narrated prose and optional image
5. Players can act via text and receive coherent responses
6. A scene can be closed, summarized, and transition-voted
7. The session can be ended by button or transition vote, with a final summary
8. No major continuity breaks occur during play

---

## Non-goals (important clarification)

The MVP is **not** intended to:

- Replace a human GM
- Fully simulate RPG rules
- Be safe for all content out of the box
- Support long-term campaigns

It exists to answer one question:

> **Is this fun enough that players want to keep playing?**

If yes, everything else can be layered on later.
