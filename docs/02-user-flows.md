# 02 – User Flows

This document describes the **end-to-end user flows** for the MVP.
Flows are written from the user’s perspective and map directly to server phases and UI states.

The goal is clarity and predictability: at any moment, it should be obvious **what the user can do** and **why**.

---

## Overview of primary flows

1. Landing, create & join adventure
2. Role selection (Player vs Screen)
3. Player setup & ready gate
4. Adventure pitch generation & voting
5. Scene play loop
6. End session & summary

All flows are **phase-driven by the server**.  
Clients never decide progression on their own.

---

## Flow 1: Landing, create & join adventure

### Actors

- Host (any user)
- Other players

### Steps

1. User opens `/` landing page
2. User sees hero section explaining the game and a `Create Adventure` CTA
3. User creates a new adventure
4. Server generates an `adventureId`
5. User shares `adventureId` verbally or via link
6. Other users open the app and enter the same `adventureId`
7. All users are connected to the same adventure

### Notes

- No authentication
- No persistence
- Rejoining the same `adventureId` reconnects the user

---

## Flow 2: Role selection

### Route

`adventure/:adventureId`

### Steps

1. User enters the adventure
2. UI presents role choice:
   - **Player**
   - **Screen**
3. User selects a role
4. Client redirects to:
   - `adventure/:adventureId/player` or
   - `adventure/:adventureId/screen`

### Notes

- Role choice is per device
- The Screen role is a read-only display client with enhanced UI (not a spectator mode)
- Role can be changed by leaving and re-entering the adventure

---

## Flow 3: Player setup & ready gate

### Phase

`lobby`

### Player view

1. Player sees:
   - Character setup form:
     - Character name
     - Visual description
     - Adventure preference
2. Player fills in text fields
3. Player presses **Ready**
4. Player is marked as ready and inputs are locked
5. Player can toggle **Not ready** to edit again

### Screen view

- Sees:
  - Roster list
  - Ready / not ready status for each player
  - “Waiting for players…” message

### Transition condition

- When **all connected `player` role clients are Ready**
- Server advances phase to `vote`

---

## Flow 4: Adventure pitch generation & voting

### Phase

`vote`

### Steps

1. Server aggregates all players’ adventure preferences
2. AI generates **2–3 adventure pitches**
3. Server broadcasts pitch options to all clients
4. Player clients render a **generic voting panel**
5. Each player votes for one option
6. Server tracks votes in real time
7. The vote closes when either condition is met:
   - all connected `player` role clients have voted, or
   - timeout reaches `20000ms`
8. On close:
   - Server selects winning pitch
   - Ties are resolved with server-side randomized tie-breaker
   - Screen debug mode shows whether tie-break was used and which options were tied
   - Pitch is locked into adventure state
   - Server advances phase to `play`

### Notes

- Voting is single-choice only in MVP
- Voting UI is generic and reusable
- Screen shows pitches and vote progress, but does not vote

---

## Flow 5: Scene play loop

### Phase

`play`

This is the core gameplay loop and may repeat multiple times.

---

### Scene start

1. Server instructs AI to generate a new scene
2. Scene includes:
   - Narrated intro prose
   - Orientation bullets (goal, exits, who’s here)
3. Server immediately broadcasts scene text
4. Server triggers image generation **asynchronously**
5. When image is ready, server updates the scene

### Player view

- Sees:
  - Scene narration
  - Scene image (when available)
  - Action input field

### Screen view

- Sees:
  - Scene image + narration
  - Transcript feed
  - (Optional) debug metadata if enabled

---

### Player action → Storyteller reaction

1. Player writes a text action and submits
2. Server enqueues the action (FIFO per adventure)
3. AI processes the action:
   - Applies secret success bias
   - Maintains continuity
   - Produces a narrative response
4. Server broadcasts Storyteller response
5. Transcript updates for all clients

### Constraints

- Only one action is processed at a time
- Other players may type locally but cannot submit until the queue is free
- Server signals “Storyteller is thinking” during processing

---

### Scene continuation or closure

After each action, the AI decides:

- **Continue the scene**, or
- **Close the scene**

If closing:

1. AI produces a brief scene summary
2. Server broadcasts summary
3. Server starts a transition vote with options:
   - `Next Scene`
   - `End Session`
4. Connected `player` role clients vote once via the generic voting panel
5. The transition vote closes when either condition is met:
   - all connected `player` role clients have voted, or
   - timeout reaches `20000ms`
6. Ties are resolved with server-side randomized tie-breaker
7. Screen debug mode shows whether tie-break was used and which options were tied
8. If `Next Scene` wins, server starts the next scene and loop repeats
9. If `End Session` wins, server transitions to `ending`

---

## Flow 6: End session

### Trigger

- Any player presses **End Session**
- Or scene-transition vote result is **End Session**

### Steps

1. Server stops accepting new actions
2. AI generates a final session summary
3. Summary is broadcast to all clients
4. Adventure phase transitions to `ending`
5. Adventure is marked as closed

### Player & screen view

- See final summary
- UI indicates session is over
- Further input is disabled

---

## Error & edge flows (MVP)

### Player disconnects

- Server marks player as disconnected
- Player may reconnect to the same adventure
- Ready and vote state are restored when reconnect identity matches
- Reconnect identity uses a client-stored ephemeral `playerId`

### Page reload

- Client reconnects via Socket.IO
- Server re-sends current adventure state
- Client renders current phase

### Model delay

- UI shows “Storyteller is thinking…”
- Server enforces configurable timeout budgets:
  - `TEXT_CALL_TIMEOUT_MS` (default `10000`)
  - `TURN_DEADLINE_MS` (default `18000`)
  - `IMAGE_TIMEOUT_MS` (default `30000`)
- Timeout behavior: retry once, fallback model, then short neutral fail-forward narration

---

## Key guarantees (MVP)

- Server is the single source of truth
- Clients never infer phase or progression
- All users see the same story state
- Scene flow is deterministic from the server’s perspective

---

## Out of scope for this document

- Audio flows
- Safety/consent flows
- Multi-session campaign flows
- Admin/moderation flows

Those are addressed in later-phase documents.
