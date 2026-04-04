# 05 – Events and State

This document defines the **authoritative state model** and the **event-driven contract** between clients and server for the MVP.

All concrete schemas live in `/spec/*.ts`.  
This document explains **intent, flow, and guarantees**, not raw type definitions.

---

## Authority model

- The **server is the single source of truth**
- Clients never infer phase, progression, or outcomes
- All progression happens via **server-emitted events**
- Clients render purely from received state

---

## Core concepts

### Adventure

An adventure is the user-facing container for one live session in MVP.

An adventure has:

- a unique `adventureId`
- a set of connected clients (players and screens)
- a single authoritative state
- exactly one active phase

Adventures are **ephemeral** in MVP.

---

### Player

A player is a connected client with:

- a display name
- a role (`player` or `screen`)
- readiness status
- optional setup data (character + adventure text)

No persistent account identity exists. Reconnect uses a client-stored ephemeral `playerId`.

---

## Adventure phases (state machine)

Valid phases in MVP:

- `lobby`
- `vote`
- `play`
- `ending`

### Phase rules

- Only the server may change phase
- Phase transitions are explicit and serialized
- Clients re-render entirely on phase change
- Readiness and vote quorum are based on currently connected `player` role clients only

---

## Authoritative adventure state (conceptual)

The adventure state includes:

- adventure metadata
- player roster and presence
- current phase
- active vote (if phase = `vote`, or in `play` when a scene-transition vote is active)
- current scene (if phase = `play`)
- transcript (append-only)
- session summary (if phase = `ending`)

Exact shape is defined in `/spec/adventureState.ts`.

---

## Public vs debug state

Some state is **never shown to players**.

### Public state

Broadcast to all clients:

- phase
- players (names, readiness, presence)
- active vote options and tallies
- scene public data
- transcript
- session summary

### Debug state (screen-only, optional)

Only sent when `debug=true`:

- scene tension
- hidden secrets
- pacing notes
- continuity warnings
- agent timing metrics
- vote resolution metadata (timeout close, tie-break applied, tied options, selected winner)

Debug state must never affect gameplay logic.

---

## Event categories

Events are grouped by direction and purpose.

### Client → Server

- connection & presence
- setup & readiness
- voting
- player actions
- session control
- runtime config control

### Server → Client

- full state sync
- incremental updates
- phase transitions
- storyteller output

---

## Client → Server events (intent)

### Connection & presence

- `join_adventure`
- `leave_adventure`

Purpose:

- register client in adventure
- assign role
- track presence

---

### Player setup

- `submit_setup`
- `toggle_ready`

Purpose:

- send character and adventure text
- signal readiness for progression

---

### Voting

- `cast_vote`

Purpose:

- submit player choice for active vote

Rules:

- exactly one vote per player
- votes are immutable once cast
- vote timeout is `20000ms`
- vote can close early if all connected `player` clients vote
- on timeout, missing votes are treated as abstain
- ties are resolved by server-side randomized tie-breaker
- when tie-break is used, server emits tie-break metadata to screen debug state
- vote kinds in MVP:
  - `adventure_pitch`
  - `scene_transition` (`Next Scene` vs `End Session`)

---

### Player actions

- `submit_action`
- `submit_metagame_question`

Purpose:

- send narrative action text during play

Rules:

- only allowed in `play` phase
- server enqueues action
- submissions blocked while queue is processing (drafting is allowed)
- metagame questions bypass queue and turn-order locks; they request an out-of-character truthful answer using scene internal context

---

### Session control

- `end_session`

Purpose:

- immediately trigger session closure and summary

---

### Runtime config control

- `update_runtime_config`

Purpose:

- update global AI and vote timeout/retry config during playtest without restart

Rules:

- screen role only
- global scope for current server process in MVP
- validate bounds server-side before applying

---

## Server → Client events (intent)

### State synchronization

- `adventure_state`

Purpose:

- send full authoritative state
- used on join, reconnect, or major transitions

---

### Incremental updates

- `player_update`
- `vote_update`
- `scene_update`
- `transcript_append`
- `runtime_config_updated`
- `latency_metrics_update`

Purpose:

- keep clients in sync without full reload

---

### Phase transitions

- `phase_changed`

Purpose:

- inform clients to switch UI mode

---

### AI processing signals

- `storyteller_thinking`
- `storyteller_response`

Purpose:

- manage latency perception
- stream or batch storyteller output

---

## Transcript model

The transcript is an **append-only ordered list**.

Entry types:

- system
- storyteller
- player

Rules:

- transcript order defines narrative order
- no edits or deletions in MVP
- transcript is the primary continuity reference
- transcript entries remain raw text at rest; the web client may enrich that text at render time with supported shortcodes and standard markdown image tokens such as `![alt](url)`

---

## Action queue guarantees

- One action processed at a time per adventure
- FIFO order
- No overlapping AI runs for the same adventure
- Queue state is invisible to clients except via “thinking” indicators
- Players may draft while queued; submit remains disabled

This prevents:

- race conditions
- contradictory narration
- duplicated outcomes

---

## Error handling (MVP)

### Client-side

- Render latest known state
- Display connection status
- Disable inputs when out of phase

### Server-side

- Validate all incoming events against phase
- Reject invalid events silently or with generic error
- Enforce timeout budgets on AI calls and per-turn processing
- Enforce vote timeout (`20000ms`) with randomized tie-breaker
- Retry AI calls once on failure, then fallback model
- If retry + fallback fail, commit short neutral fail-forward narration

Errors must **never partially mutate state**.

---

## Reconnection behavior

On reconnect:

1. Client re-joins adventure with ephemeral `playerId`
2. Server sends full `adventure_state`
3. Server restores ready/vote state when `playerId` matches an existing participant
4. Client discards local assumptions
5. UI re-renders current phase

Ready/vote restoration is best-effort and session-scoped only.

---

## Ordering guarantees

- Events are processed sequentially per adventure
- Phase transitions are atomic
- Scene updates always precede transcript entries they reference

---

## Explicit non-goals (MVP)

- Event versioning
- Event replay or deterministic re-simulation
- Partial state hydration
- Optimistic UI updates
- Backward-compatibility aliases for legacy `room` event/state names

---

## Summary

The event and state model is designed to be:

- **simple**
- **predictable**
- **hard to misuse**

By centralizing authority and strictly gating events by phase, the MVP minimizes the two biggest risks:
**continuity breakage** and **flow confusion**.

---

## Post-MVP Extension: Campaigns and Human Sessions

The repo now also includes a separate campaign/session contract alongside the original adventure runtime.

### Additional conceptual state

- `Campaign` - a persisted deep-copy fork of an Adventure Module
- `CampaignSession` - a live or archived play instance of a Campaign
- `CampaignSessionParticipant` - a player or storyteller, optionally marked `isMock`
- `CampaignCharacterClaim` - maps a participant to a player-character actor for one session
- `CampaignSessionOutcomePile` - a server-seeded per-player outcome deck, hand, and discard pile keyed by `participantId`

Exact shapes live in:

- `/spec/campaign.ts`
- `/spec/campaignEvents.ts`

### Campaign transport split

Campaigns use a split transport model:

- REST for campaign CRUD, campaign detail reads, and session create/list/read
- Socket.IO for session presence, role join, mock participants, claim/create PC, group chat, outcome deck actions, close-session actions, and live refresh broadcasts

Campaign session state payloads are full `CampaignSessionDetail` objects. In practice that means the authoritative state broadcast includes:

- participants
- claims
- `outcomePilesByParticipantId`
- table cards
- transcript entries

Clients never invent outcome pile state locally. They only send intent events for drawing, shuffling, and playing outcome cards.

### Additional client -> server campaign events

- `watch_campaign`
- `unwatch_campaign`
- `join_campaign_session`
- `leave_campaign_session`
- `join_campaign_session_role`
- `add_campaign_session_mock`
- `claim_campaign_session_character`
- `create_campaign_session_character`
- `send_campaign_session_message`
- `draw_campaign_session_outcome_card`
- `shuffle_campaign_session_outcome_deck`
- `play_campaign_session_outcome_cards`
- `close_campaign_session`

### Additional server -> client campaign events

- `campaign_updated`
- `campaign_session_state`
- `campaign_session_error`

### Campaign refresh guarantee

- campaign detail and storyteller session routes may be open in parallel on different clients
- when one client saves campaign data, the server emits `campaign_updated`
- subscribed clients refetch the latest campaign detail at route level

This keeps the current implementation simple and avoids pretending the editor is fully collaborative in real time.
