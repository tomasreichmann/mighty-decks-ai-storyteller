# 14 - Adventure Module Spec

This document is the normative definition of an **Adventure Module** for the Mighty Decks AI Storyteller project.
It defines structure, terminology, artifact outputs, and quality gates for authored reusable adventures.

---

## 1. Purpose and Post-MVP Boundary

This specification is a **post-MVP extension track** with partial authoring implementation already landed.

It exists to define how prepared adventures are authored, stored, and launched later without changing the current MVP runtime contracts.

Boundary rules for this milestone:

- No change to current live-session state machine (`lobby -> vote -> play -> ending`)
- No change to current Socket.IO event contracts
- No database implementation in this milestone
- Runtime authoring support is currently limited to Adventure Module create/edit flows plus typed actor, counter, and asset authoring
- Deliverable includes shared schema, local file persistence, REST authoring endpoints, and matching web authoring UI

---

## 2. Terminology and Canonical Names

Use these names consistently:

- `Adventure`: live runtime session container (existing MVP meaning)
- `Adventure Module`: authored reusable content unit for one or more sessions
- `Module Fragment`: one authored file inside an adventure module
- `Quest Graph`: node-based quest structure with hooks, nodes, edges, and conclusions
- `Component Opportunity`: where a Mighty Decks component can appear and why
- `Launch Profile`: intended consumption mode (`ai_storyteller`, `physical_storyteller`, `dual`)

`Adventure` and `Adventure Module` are intentionally different concepts:

- `Adventure` is ephemeral runtime state
- `Adventure Module` is authored content that can launch runtime adventures

---

## 3. Adventure Module Core Definition

An **Adventure Module** is a versioned, reusable authored bundle with:

- one index artifact (canonical metadata and references)
- multiple module fragments (MDX by default)
- at least one quest graph
- a component opportunity map
- an artifact manifest (MDX files, image prompts, generated assets, metadata)

Design default:

- session scope: `one_session_arc`
- launch profile: `dual`
- output style: text-first with optional image artifacts

The module is intentionally consumable by:

- AI Storyteller runtime
- physical Storyteller at a real table

---

## 4. Mandatory Module Fragments

Each module must include the following fragment kinds:

1. `index` fragment
2. `storyteller_summary` fragment (spoilers allowed, for facilitator handoff)
3. `player_summary` fragment (no spoilers, for player-facing pitch)
4. `palette` fragment (`dos` and `donts`)
5. `setting` fragment
6. one or more `location` fragments
7. one or more `actor` fragments (layered actors)
8. one or more `asset` fragments (layered assets)
9. zero or more `item` fragments
10. one or more `encounter` fragments
11. one or more `quest` fragments
12. one `component_map` fragment

Optional but recommended:

- `image_prompt` fragments

Fragment requirements:

- stable `fragmentId`
- explicit `kind`
- human-readable title
- path in module tree
- short summary
- tags

Summary-specific requirements:

- `storyteller_summary` should provide spoiler-ready overview of premise, hidden truths, threat agendas, and expected pressure arcs for a Storyteller who did not author the module.
- `player_summary` should provide spoiler-free invitation text emphasizing premise, stakes, and character-facing hooks.
- Authoring metadata includes `storytellerSummaryMarkdown` on module index for extended storyteller-facing markdown body used by `/storyteller-info` editing.
- Authoring metadata includes `playerSummaryMarkdown` on module index for extended player-facing markdown body used by `/player-info` editing.

Actor-specific requirements:

- Actor fragments remain normal markdown-backed `actor` fragments.
- Module index authoring metadata includes an `actorCards` collection keyed by actor `fragmentId`.
- Each actor-card metadata entry stores `baseLayerSlug`, `tacticalRoleSlug`, and optional `tacticalSpecialSlug`.
- Every `actorFragmentId` must have exactly one matching actor-card metadata entry.
- Resolved authoring reads join fragment metadata and actor-card metadata into an `actors` array for the web client.

Counter-specific requirements:

- Counters are typed module records, not fragments.
- Module index authoring metadata includes a `counters` collection keyed by module-scoped counter `slug`.
- Each counter stores `iconSlug`, `title`, `currentValue`, optional `maxValue`, and `description`.
- Resolved authoring reads surface these records directly in a `counters` array for the web client.

Asset-specific requirements:

- Asset fragments remain normal markdown-backed `asset` fragments.
- Module index authoring metadata includes an `assetCards` collection keyed by asset `fragmentId`.
- Each asset-card metadata entry stores `baseAssetSlug` and optional `modifierSlug`.
- Base asset selection is limited to the filtered `base` and `medieval` catalogs.
- Every `assetFragmentId` must have exactly one matching asset-card metadata entry.
- Resolved authoring reads join fragment metadata and asset-card metadata into an `assets` array for the web client.

---

## 5. Quest Graph Model (Node-Based)

Quest structure is node-based, not linear.

Core entities:

- **Hooks**: entry vectors players can discover
- **Nodes**: playable beats (scene, challenge, social beat, hazard, discovery)
- **Edges**: transitions between nodes with conditions and clue/cost hints
- **Conclusions**: possible end states with sample outcomes and forward hooks

Required quest graph invariants:

1. At least one hook
2. At least one node
3. At least one entry node
4. At least one conclusion node
5. Every edge references existing nodes
6. Every hook references at least one existing entry node
7. Every entry/conclusion node id exists in node list

Quality guidance:

- Avoid single-path dependency chains
- Include clue redundancy to prevent dead ends
- Keep fail-forward exits available at bottlenecks

---

## 6. Mighty Decks Component Opportunity Matrix

A module maps opportunities for the full component set:

- Outcomes
- Effects
- Counters
- Stunts
- Layered Assets
- Layered Actors
- Dice and counter values
- Minis and maps (phase-2 tags only)

Per-part opportunity expectations:

| Module part | Typical component opportunities | Why |
| --- | --- | --- |
| Storyteller summary | Layered actors/assets, counters (reference) | Gives facilitator a spoiler-aware map of pressures and hidden structure |
| Player summary | Outcomes and stunts (framing only) | Sets expectations and motivation without revealing hidden facts |
| Palette | Outcomes, stunts | Defines tone boundaries for action resolution and stunt fit |
| Setting | Counters, layered assets, layered actors | Establishes pressure vectors and key world actors/assets |
| Location | Counters, effects, layered assets, map tag | Tracks environmental pressure and place-based hazards |
| Actor | Outcomes, stunts, effects, layered actors | Frames agendas, social pressure, and consequence vectors |
| Asset | Layered assets, counters, outcomes | Turns objects/resources into actionable scene leverage |
| Item | Outcomes, effects, stunts | Defines action boosts, costs, and edge cases |
| Encounter | Outcomes, effects, counters, dice values, minis/map tags | Provides concrete resolution and escalation points |
| Quest node | Outcomes, counters, layered actors/assets | Maintains momentum and continuity across node transitions |
| Conclusion | Effects, counters | Captures lasting consequences and unresolved pressure |

Rules:

- `mini` and `map` opportunities are metadata tags only in this milestone
- component opportunities are declarative authoring metadata
- runtime enforcement is out of scope for this milestone

Authoring embed rules:

- Canonical actor embeds use `<GameCard type="ActorCard" slug="<actor-slug>" />`.
- Canonical counter embeds use `<GameCard type="CounterCard" slug="<counter-slug>" />`.
- Canonical asset embeds use `<GameCard type="AssetCard" slug="<asset-slug>" />`.
- Legacy `@actor/<actor-slug>`, `@counter/<counter-slug>`, and `@asset/<asset-slug>` shortcodes remain accepted and normalize to canonical `GameCard` source outside inline and fenced code spans.

---

## 7. Produced Artifacts

Each module produces a structured artifact set.

Primary artifacts:

- MDX source files for module fragments
- module index metadata (schema-compatible)
- quest graph metadata
- component opportunity map metadata
- artifact manifest metadata

Optional generated artifacts:

- image prompt files
- generated image assets
- assistant-generated variant drafts

Artifacts must be traceable by:

- `artifactId`
- `kind`
- `path`
- `sourceFragmentId` (when applicable)

---

## 8. Launch Profiles

Each module declares launch intent:

- `ai_storyteller`: optimized for structured machine consumption
- `physical_storyteller`: optimized for table-facing human facilitation
- `dual`: one module supports both with unified abstraction

This milestone defaults to `dual`.

---

## 9. Authoring Control Ladder

Every authoring step supports three control modes:

1. `auto_generate`
2. `curate_select`
3. `manual_edit`

Behavior expectations:

- `auto_generate`: assistant proposes full draft content
- `curate_select`: assistant proposes alternatives, storyteller chooses and edits
- `manual_edit`: storyteller authors directly, assistant supports on request only

The control mode can differ by step and fragment.

---

## 10. Quality Gate Checklist

A module is "authoring complete" when all checks pass:

1. Terminology check
- Uses `Adventure Module` as authored unit term
- Does not conflate module with runtime `Adventure`

2. Structural check
- Required fragment kinds exist
- Fragment references are valid and stable
- Quest graph invariants pass

3. Content check
- Module has clear premise, pressure, and exits
- Hooks are discoverable through multiple vectors
- At least one conclusion is reachable from entry path

4. Component check
- Opportunities documented per major part
- Full required component set represented where relevant
- Minis/maps only tagged as phase-2 opportunities

5. Artifact check
- Manifest entries align to actual files
- Image prompts are optional but referenced consistently if present

6. Boundary check
- Post-MVP extension statement is explicit
- No claim that runtime contracts were changed in this milestone

### Validation Example (Schema Parse Snippet)

```ts
import { adventureModuleIndexSchema } from "@mighty-decks/spec/adventureModule";

const result = adventureModuleIndexSchema.safeParse(candidateIndexPayload);
if (!result.success) {
  console.error(result.error.format());
}
```

---

## 11. Current Implemented Authoring Contracts

The current implementation adds typed actor, counter, and asset authoring APIs on top of the shared spec:

- `POST /api/adventure-modules/:moduleId/actors`
- `PUT /api/adventure-modules/:moduleId/actors/:actorSlug`
- `DELETE /api/adventure-modules/:moduleId/actors/:actorSlug`
- `POST /api/adventure-modules/:moduleId/counters`
- `PUT /api/adventure-modules/:moduleId/counters/:counterSlug`
- `DELETE /api/adventure-modules/:moduleId/counters/:counterSlug`
- `POST /api/adventure-modules/:moduleId/assets`
- `PUT /api/adventure-modules/:moduleId/assets/:assetSlug`
- `DELETE /api/adventure-modules/:moduleId/assets/:assetSlug`

These endpoints:

- create actor fragments with module-scoped slugs derived from the saved actor title
- persist typed layered-card metadata alongside fragment references
- persist typed counter records directly on the module index with slugs derived from the saved counter title
- create asset fragments with module-scoped slugs derived from the saved asset title
- persist typed asset-card metadata alongside asset fragment references
- return resolved `AdventureModuleDetail` payloads including joined `actors`, `counters`, and `assets`

Legacy module compatibility:

- Modules missing `actorCards` metadata are backfilled with safe defaults on read.
- Modules missing `assetCards` metadata are backfilled with safe defaults on read.
- The normalized shape is persisted on the next successful write.

## 12. Explicit Out-of-Scope for This Milestone

- Runtime rules engine for component enforcement
- Full module database implementation
- Session orchestration changes
- Cloud publishing pipeline
- Minis/map rendering features
- Non-actor, non-counter, non-asset typed entity editors (locations, encounters, quests)
