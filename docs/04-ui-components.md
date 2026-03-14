# 04 – UI Components

This document defines the **UI component inventory for the MVP**, their responsibilities, and how they are composed per route and phase.

The goal is to:

- keep the UI surface minimal
- avoid premature specialization
- ensure components map cleanly to server-driven phases and state

This is **not** a visual design spec. It is a **structural contract** for implementation.

For visual tokens, style patterns, and Penpot MCP handoff, see `docs/17-ui-style-system-penpot-mcp.md`.

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

5. **Primitive-first view composition**  
   New views should be composed from shared UI primitives (`Panel`, `Section`, `Text`, `Heading`, `Button`, `Label`, etc.) before introducing custom-styled `div` containers.

---

## View authoring rules (required)

When creating a new route/view (or a major new panel in an existing view), prefer the existing shared components over ad-hoc styling.

### Use shared primitives first

- Use `Section` for semantic grouped content blocks.
- Use `Panel` for framed/surface containers instead of custom bordered `div`s.
- Use `Text` / `Heading` for typography instead of styling raw `h*` / `p` tags repeatedly.
- Use `Button` for actions (including icon-only/circle variants) instead of styled `button`s.
- Use `Label` for badge-like headings/tags.
- Use `Message` for alert/status/informational callouts instead of custom callout wrappers.
- Use `DepressedInput`, `TextField`, `TextArea`, and `Toggle` for form controls before creating one-off input styles.

### `div` is still allowed, but only for these roles

- Layout wrappers (`flex`, `grid`, spacing, responsive columns)
- Structural wrappers required for positioning (`relative`, `absolute`, overlays)
- Visual compositions that are truly unique (e.g. card fan layout, image framing effects)
- Small internal wrappers inside a shared component when no reusable primitive exists yet

### Escalation rule for new UI abstractions

- If the same styled `div` pattern appears in 2+ views, promote it to a shared component.
- If the style is specific to one component, keep it co-located in a CSS module for that component.
- Keep `apps/web/src/styles.css` for global/base styles and cross-app utility classes only.

### Practical checklist for new views

- Start with page shell: `main.app-shell`
- Compose main blocks with `Panel` and/or `Section`
- Use `Heading`/`Text` for all user-facing copy
- Use `Button` for every clickable action
- Use shared form controls before raw inputs
- Only add custom wrappers for layout or truly unique visuals

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

### `/adventure-module/list`

Post-MVP authoring extension route for browsing and managing Adventure Modules.

Components:

- `AdventureModuleListHeader`
- `AdventureModuleListPanel`
- `AdventureModuleListItemCard`
- `ModuleVisibilityBadge`
- `ArchiveModuleDialog`
- `CreateAdventureModuleButton`

List rules:

- Author-owned modules render first.
- Non-author list view includes published modules only.
- Row actions for author-owned modules: `Edit`, `Delete` (archive).
- Module cards are clickable and open `/adventure-module/:slug/player-info`.

---

### `/adventure-module/new`

Post-MVP authoring extension route for creating a draft module.

Components:

- `AdventureModuleCreateForm`
- `SlugField` (auto-generate + manual override)
- `SlugAvailabilityStatus`
- `CreateModuleButton`

Behavior:

- Slug is generated from name and can be overridden.
- Create is blocked until slug availability check returns available.
- Create success redirects to `/adventure-module/:slug/base`.
- Content authoring starts on `/adventure-module/:slug/base`.

---

### `/adventure-module/:slug/:tab`

Post-MVP authoring shell route for tabbed editing.

Shared shell components:

- `AdventureModuleAuthoringHeader`
- `AdventureModuleTabNav`
- `AutosaveStatusBadge`
- `PublishModuleButton`
- `AuthoringTabContentHost`

Tabs:

- `base`: `ModuleBaseTabPanel` with `SmartInput` for premise transforms
- `player-info`: `AdventureModulePlayerInfoTabPanel` with dual MDXEditor fields (`Player Summary`, `Player Info Text`) in rich + source modes, inline `GameCard` embeds, and autosave
- `storyteller-info`: `AdventureModuleStorytellerInfoTabPanel` with dual MDXEditor fields (`Storyteller Summary`, `Storyteller Info Text`) in rich + source modes, inline `GameCard` embeds, and autosave
- `actors`: `AdventureModuleActorsTabPanel` showing searchable layered `ActorCard` entries, `Create Actor`, and shortcode copy actions
- `locations`: placeholder
- `encounters`: placeholder
- `quests`: placeholder
- `assets`: placeholder

List-tab row actions:

- `Edit`
- `Clone`
- `Delete`

List-tab primary actions:

- `Create an Actor`
- `Create a Location`
- `Create an Encounter`
- `Create a Quest`
- `Create an Asset`

---

### `/adventure-module/:slug/:tab/:entityId`

Entity editor route. Actor editing is implemented in this step; other entity editors remain placeholders.

Components:

- `AdventureModuleActorEditor`
- `AdventureModuleTabPlaceholder` for non-actor entities

Actor editor baseline fields:

- name
- short summary
- layered actor base
- tactical role
- optional tactical special
- markdown body with inline `GameCard` embeds and actor shortcode support

Behavior:

- `/adventure-module/:slug/actors/:entityId` renders a live actor editor with autosave, live layered preview, and stable actor slug display.
- Other entity routes remain active placeholders while their typed editors are pending.

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

Located in `apps/web/src/components/common/`:

- `Button` (project variants/sizes; use for all actions)
- `Section`
- `Panel`
- `Text`
- `Heading`
- `Label`
- `Message`
- `TextField`
- `TextArea`
- `DepressedInput`
- `Toggle`
- `Highlight` (decorative text accent; use via `Heading` where possible)
- `ImageBackground` (for image-backed UI blocks)

### Current usage pattern observed in views

Recent routes/components already follow this in many places:

- `WorkflowLabPage` uses `Panel` + `Button` for nearly all surfaced UI blocks/actions
- `ImageGenerator` uses `Section`/`Panel` + `Heading`/`Text` + `Button`
- `AdventureHeader`, `NarratedSceneCard`, `GenericVotePanel`, `ReadyGatePanel`, `TranscriptFeed` rely on shared primitives instead of one-off shells

New views should follow these patterns by default rather than introducing custom framed boxes or custom typography wrappers.

---

## Summary

The MVP UI is intentionally small:

- One route per role
- One scene presentation pattern
- One action input pattern
- One voting pattern

This keeps cognitive load low and makes it easier to judge whether the **storytelling itself is compelling**, which is the core risk this MVP is meant to test.

