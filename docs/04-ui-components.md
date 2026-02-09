# 04 – UI Components

This document defines the **UI component inventory for the MVP**, their responsibilities, and how they are composed per route and phase.

The goal is to:

- keep the UI surface minimal
- avoid premature specialization
- ensure components map cleanly to server-driven phases and state

This is **not** a visual design spec. It is a **structural contract** for implementation.

---

## Design principles (MVP)

1. **Narration over dashboards**  
   Player-facing UI should feel like a story being told, not a control panel.

2. **Phase-driven rendering**  
   Components appear based on `adventure.phase`, not navigation.

3. **Single-responsibility components**  
   Each component does one thing; orchestration lives outside.

4. **Shared components first**  
   Player and Screen UIs share as much as possible.

---

## Route-level composition

### `/`

**Purpose:** explain the product and start a new adventure

Components:

- `LandingHero`
- `CreateAdventureCTA`

No server phase dependency.

---

### `adventure/:adventureId`

**Purpose:** role selection only

Components:

- `RoleSelectCard`
- `AdventureHeader`

No server phase dependency.

---

### `adventure/:adventureId/player`

**Purpose:** player interaction, driven by phase

Phase → Components:

#### `lobby`

- `AdventureHeader`
- `CharacterSetupForm`
- `ReadyGatePanel`
- (optional) `RosterList`

#### `vote`

- `AdventureHeader`
- `GenericVotePanel`

#### `play`

- `AdventureHeader`
- `NarratedSceneCard` (condensed)
- `ActionComposer`
- `GenericVotePanel` (only when a scene-transition vote is active)
- (optional) `TranscriptMiniFeed`
- `EndSessionButton`

#### `ending`

- `AdventureHeader`
- `SessionSummaryCard`

---

### `adventure/:adventureId/screen`

**Purpose:** shared table display

Phase → Components:

#### `lobby`

- `AdventureHeader`
- `RosterList`
- `ReadyGatePanel`

#### `vote`

- `AdventureHeader`
- `GenericVotePanel`
- `RosterList` (vote progress)

#### `play`

- `AdventureHeader`
- `NarratedSceneCard` (full)
- `GenericVotePanel` (only when a scene-transition vote is active)
- `TranscriptFeed`
- (optional) `DebugPanel` (if debug enabled)

#### `ending`

- `AdventureHeader`
- `SessionSummaryCard`

---

## Core components (MVP-critical)

### `RoleSelectCard`

**Responsibility**

- Allow user to choose Player or Screen role

**Notes**

- Pure client-side
- Redirects to appropriate route

---

### `LandingHero`

**Responsibility**

- Explain what the game is in plain language for first-time users

---

### `CreateAdventureCTA`

**Responsibility**

- Trigger adventure creation from landing page
- Navigate users to `adventure/:adventureId` after creation

---

### `AdventureHeader`

**Responsibility**

- Display adventure ID
- Connection status
- Leave/back action

---

### `CharacterSetupForm`

**Responsibility**

- Collect initial player input

**Fields**

- Character name (required)
- Visual description (required)
- Adventure preference (optional)

**Actions**

- `Ready`
- `Not ready`

**Rules**

- No Save / Update
- Ready locks input
- Not ready unlocks input

---

### `ReadyGatePanel`

**Responsibility**

- Show readiness status of all connected `player` role clients
- Block progression feedback (“waiting for players…”)

---

### `GenericVotePanel`

**Responsibility**

- Render any single-choice vote initiated by server

**Inputs**

- Vote title
- Prompt/description
- List of options
- Current vote state

**Rules**

- Single vote per player
- Vote locks after submission
- Shows 20-second countdown for active vote timeout
- On tie, communicates that server applies randomized tie-breaker

---

### `NarratedSceneCard`

**Responsibility**

- Present the current scene in a narrated, player-friendly way

**Public layout**

1. Scene image (if available)
2. Intro prose (narrative text)
3. Orientation bullets:
   - current goal / pressure
   - obvious exits or options
   - notable characters present (optional)

**Rules**

- No internal mechanics shown
- No tension, secrets, or hidden tags
- Image may arrive after text

---

### `ActionComposer`

**Responsibility**

- Allow player to submit a narrative action

**Rules**

- Text-only input
- Entire control is disabled when:
  - not in `play` phase
  - player not ready
- While server is processing another action:
  - text entry remains enabled for drafting
  - submit/send is disabled

---

### `TranscriptFeed`

**Responsibility**

- Display chronological story feed

**Message types**

- System
- Storyteller
- Player

**Rules**

- Auto-scroll to latest
- Read-only

---

### `ThinkingIndicator`

**Responsibility**

- Communicate AI processing latency

**Examples**

- “Storyteller is thinking…”
- “Framing next scene…”

---

### `EndSessionButton`

**Responsibility**

- Allow any player to end the session

**Rules**

- Requires confirmation
- Immediately triggers session closure

---

### `SessionSummaryCard`

**Responsibility**

- Display final session summary

---

## Optional / phase-2 components (not required for MVP)

### `TranscriptMiniFeed`

- Compact transcript for players

### `DebugPanel`

**Screen-only**

- Tension level
- Hidden secrets
- Continuity warnings
- Agent timing metrics
- Vote resolution diagnostics (including randomized tie-break details when used)

### `RosterList`

- Player presence, readiness, vote status

---

## Common UI primitives

Located in `ui/common/`:

- `Button` (variants: primary, secondary, ghost, danger)
- `Card`
- `Section`
- `Divider`
- `TextField`
- `TextArea`
- `Skeleton`
- `InlineError`
- `Toast` (optional)

---

## Explicit non-components

The following are intentionally **not** UI components in MVP:

- Dice rollers
- Stat panels
- Card hands
- Inventories
- Audio controls
- Moderation tools

---

## Summary

The MVP UI is intentionally small:

- One route per role
- One scene presentation pattern
- One action input pattern
- One voting pattern

This keeps cognitive load low and makes it easier to judge whether the **storytelling itself is compelling**, which is the core risk this MVP is meant to test.
