# 08 – Milestones

This document defines the **implementation milestones for the MVP**, organized as
**vertical slices** that each produce a usable, testable result.

The intent is to:

- validate assumptions early
- keep scope tight
- avoid building infrastructure without gameplay value

Milestones are ordered by **player-visible impact**, not by technical layers.

---

## Milestone 0 — Project skeleton & contracts

**Goal:** establish a stable foundation Codex can build on safely.

### Deliverables

- Repo structure in place:
  - `apps/web`
  - `apps/server`
  - `/docs`
  - `/spec`
- `AGENTS.md` finalized and committed
- TypeScript config with strict mode
- Shared `/spec` files created (empty or stubbed):
  - `adventureState.ts`
  - `events.ts`
  - `agents.ts`
  - `prompts.ts`

### Exit criteria

- Web app builds
- Server starts
- No gameplay yet

---

## Milestone 1 — Adventure lifecycle & presence

**Goal:** multiple devices can join the same adventure and see each other.

### Deliverables

- Landing page hero + `Create Adventure` CTA
- Create adventure → receive `adventureId`
- Join adventure via `adventureId`
- Role selection (`Player` / `Screen`)
- Socket.IO connection + reconnection
- Roster list with presence indicators

### UI

- `RoleSelectCard`
- `AdventureHeader`
- `RosterList`

### Exit criteria

- Phones + screen join same adventure on LAN
- Disconnect/reconnect works
- No crashes on reload

---

## Milestone 2 — Player setup & ready gate

**Goal:** gate progression on explicit player readiness.

### Deliverables

- `CharacterSetupForm`
- Ready / Not ready toggle
- Server-side ready tracking
- Ready gate logic (“waiting for players…”)

### UI

- `CharacterSetupForm`
- `ReadyGatePanel`

### Exit criteria

- All connected `player` role clients must be ready to proceed
- Toggling Not ready unlocks inputs
- Server enforces phase = `lobby`

---

## Milestone 3 — Adventure pitch generation & voting

**Goal:** first AI-driven interaction that affects the session.

### Deliverables

- Aggregate player adventure preferences
- Pitch Generator agent (2–3 options)
- Generic vote state + events
- Voting UI (single choice)
- Vote timeout of `20000ms`
- Randomized tie-breaker on tied result

### UI

- `GenericVotePanel`

### Exit criteria

- Pitches appear for all players
- All connected `player` role clients can vote once
- Winning pitch is locked
- Phase advances to `play`

---

## Milestone 4 — Scene start (text-first)

**Goal:** see a narrated scene appear on the screen.

### Deliverables

- Scene Controller agent (scene framing)
- Narrative Director intro prose
- Scene public state broadcast
- Phase = `play`

### UI

- `NarratedSceneCard` (text only)
- `ThinkingIndicator`

### Exit criteria

- Scene intro appears on screen and players
- Scene has clear orientation
- No image yet

---

## Milestone 5 — Player action → storyteller response

**Goal:** core play loop works.

### Deliverables

- `ActionComposer`
- ActionQueue (FIFO per adventure)
- Narrative Director reacts to actions
- Transcript append
- Thinking indicator during processing

### UI

- `ActionComposer`
- `TranscriptFeed`
- `ThinkingIndicator`

### Exit criteria

- Players can submit actions
- Responses are coherent
- Only one action processed at a time
- Continuity holds across multiple actions

---

## Milestone 6 — Scene closure & transition

**Goal:** complete a full scene lifecycle.

### Deliverables

- Scene Controller decides when to close
- Scene summary generation
- Scene-transition vote (`Next Scene` vs `End Session`)
- Vote timeout of `20000ms` with randomized tie-breaker

### UI

- `NarratedSceneCard` (includes inline scene summary state)
- `GenericVotePanel` (for transition vote)

### Exit criteria

- At least one scene can close cleanly
- Summary is shown
- Transition vote resolves and applies correctly

---

## Milestone 7 — Image generation (async)

**Goal:** add atmosphere without blocking play.

### Deliverables

- Image Generator agent
- FLUX.2 Klein 4B via OpenRouter
- Async image attachment to scene

### UI

- `NarratedSceneCard` image slot with loading and fallback

### Exit criteria

- Scene text appears immediately
- Image appears later (or fails gracefully)
- No impact on action latency

---

## Milestone 8 — End session & summary

**Goal:** cleanly finish a session.

### Deliverables

- `EndSessionButton`
- Final session summary generation
- Phase transition to `ending`
- Adventure closure

### UI

- `SessionSummaryCard`

### Exit criteria

- Any player can end session
- Summary is shown to all
- Inputs are disabled
- Adventure cannot resume play in MVP

---

## Milestone 9 — Polish & playtest hardening

**Goal:** make the MVP usable for real table tests.

### Deliverables

- Latency logging (`average` + `p90`)
- Screen-only runtime timeout/retry tuning (global config)
- Basic error handling & retries
- Debug mode (screen-only, optional)
- Visual polish (spacing, readability)

### Exit criteria

- Full playtest with 3–5 players
- No continuity-breaking bugs observed
- Latency feels acceptable
- Team agrees “this is fun enough to continue”

---

## Explicit non-milestones (not MVP)

- Audio
- Rules/components
- Persistence
- Accounts
- Cloud hosting

These only start **after Milestone 9** is validated.

---

## Summary

MVP success is not measured by feature count, but by this question:

> **Do players want to play another scene?**

These milestones are ordered to answer that question as early as possible.
