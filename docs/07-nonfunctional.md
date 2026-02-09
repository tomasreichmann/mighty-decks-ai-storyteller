# 07 – Non-functional Requirements

This document defines the **non-functional requirements (NFRs)** for the MVP.
These are the constraints that shape _how_ the system behaves, not _what_ it does.

For MVP, the goal is **acceptable quality with minimal complexity**, not production-grade guarantees.

---

## Performance & latency

### Latency priorities

Perceived latency is more important than absolute speed.

**Primary KPI (MVP)**

- Time from player submitting an action → first Storyteller response text appears

**Target (initial, to be validated by playtest)**

- Good: ≤ 3–5 seconds
- Acceptable: ≤ 8 seconds
- Degraded: > 8 seconds (must show clear “thinking” state)

### UI requirements

- Always show a **ThinkingIndicator** while AI is processing
- Never freeze the UI
- Never block input silently

### Image generation latency

- Image generation must be **fully asynchronous**
- Scene text must appear immediately
- Image may arrive later or fail gracefully

### Timeout budgets (initial playtest defaults)

- `TEXT_CALL_TIMEOUT_MS=10000`
- `TURN_DEADLINE_MS=18000`
- `IMAGE_TIMEOUT_MS=30000`
- `AI_RETRY_COUNT=1`
- `VOTE_TIMEOUT_MS=20000`
- These defaults are intentionally arbitrary and should be tuned from playtest data

---

## Reliability & robustness

### Realtime connection

- Socket.IO must handle:
  - brief disconnects
  - reconnects
  - state resync
- Client must recover to correct phase after reconnect

### Server robustness

- Server must:
  - validate all incoming events against current phase
  - ignore or reject invalid events safely
  - never partially mutate adventure state

### AI failures

- On AI call failure:
  1. Retry once
  2. Fallback to secondary model
  3. If still failing, return a short neutral narration and continue play
- On timeout:
  1. Apply the same retry and fallback chain
  2. If still failing, return a short neutral fail-forward narration and continue play

The system must **never deadlock an adventure** due to AI failure.

### Voting reliability

- All votes use a `20000ms` timeout
- Vote closes early if all connected `player` clients vote
- Ties are resolved with server-side randomized tie-breaker

---

## Consistency & continuity

### Continuity guarantees

- Names, locations, and resolved outcomes must not change once stated
- Scenes must not contradict earlier summaries
- Transcript is the ultimate source of truth

### Action serialization

- Only one player action processed at a time per adventure
- FIFO ordering guaranteed
- No overlapping AI runs for the same adventure

---

## Cost control

### Text generation

- Cap max tokens per agent call
- Prefer cheaper models for:
  - continuity
  - summarization
- Use higher-quality models only where narrative quality matters

### Image generation

- Limit to **one image per scene start**
- No regeneration loops
- Images are optional; failure is acceptable

### Monitoring (lightweight)

- Log:
  - tokens per response
  - image calls per session
  - per-action latency
  - rolling `average` and `p90` storyteller response latency
  - timeout count and fallback count
  - vote timeout count and tie-break count
- No billing dashboards required for MVP

### Runtime tuning (playtest)

- Timeout/retry values must be adjustable without server restart
- Runtime config updates are **screen-only**
- Runtime config updates apply globally to the server process in MVP
- Vote timeout (`VOTE_TIMEOUT_MS`) is runtime-adjustable by screen clients only

---

## Security & access control

### Adventure access

- Adventure ID is the only access mechanism
- No authentication
- No role enforcement beyond UI and event validation

### Data handling

- No personal data beyond:
  - display names
  - free-text descriptions
- No long-term storage required

---

## Privacy (MVP stance)

- No audio recording
- No user accounts
- No tracking across sessions
- Transcripts exist only in memory or optional local export

---

## Usability & UX constraints

### Cognitive load

- Players should never wonder:
  - “What can I do now?”
  - “Why can’t I act?”
- Phase changes must be obvious

### Feedback

- Every player action must result in:
  - either an immediate response
  - or a visible processing indicator

---

## Maintainability

### Codebase

- Clear separation:
  - UI
  - orchestration
  - AI agents
- Strong typing across boundaries
- Minimal shared mutable state

### Extensibility (without implementing)

The architecture must not block:

- audio streaming
- Mighty Decks rules/components
- persistence
- cloud deployment

---

## Scalability (explicitly limited)

### In scope

- 1–5 players per adventure
- Multiple concurrent adventures are supported by design
- Local/dev can intentionally cap to one active adventure via config (for example `MAX_ACTIVE_ADVENTURES=1`)

### Out of scope

- Horizontal scaling
- Load balancing
- Rate limiting

---

## Testing expectations (MVP)

### Manual testing

- Local table playtest with phones + laptop
- Network disconnect/reconnect simulation
- Slow AI response simulation

### Automated testing

- Not required for MVP
- Type checking is mandatory

---

## Failure tolerance (MVP reality check)

The MVP **may fail**, as long as it:

- fails clearly
- fails without corrupting state
- allows restarting quickly

---

## Summary

For MVP, the system must be:

- **responsive enough to feel alive**
- **stable enough to keep continuity**
- **cheap enough to experiment**
- **simple enough to evolve**

Anything beyond that belongs to post-MVP phases.
