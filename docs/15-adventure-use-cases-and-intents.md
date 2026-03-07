# 15 - Adventure Module Use Cases and Intents

This document defines users, intents, and end-to-end workflows for creating and running an **Adventure Module**.

This is a post-MVP documentation milestone and does not change current runtime contracts.

---

## 1. Personas

### Persona A: Time-Constrained Storyteller

- Has a strong idea but limited prep time
- Wants help expanding rough concepts into usable fragments
- Needs confidence that module output can run at the table

### Persona B: Collaborative Curator

- Prefers selecting and refining options over blank-page writing
- Uses assistant outputs, then hand-edits for tone and continuity
- Wants alternatives before committing to a direction

### Persona C: Manual Craft Storyteller

- Writes most content directly
- Uses assistant for polish, linkage checks, and variant generation
- Expects precise control over final text

---

## 2. Target Intent Statements

Users want to:

1. turn a seed idea into a playable module quickly
2. define a clear palette of dos and donts
3. produce both a spoiler-safe player summary and a spoiler-friendly storyteller summary
4. produce a node-based quest structure with reliable hooks
5. map component opportunities without premature runtime lock-in
6. publish reusable artifacts that can launch AI or physical sessions
7. iterate safely through generate, select, and manual revision modes

---

## 3. End-to-End Use Case Catalog

All use cases include:

- Actor
- Trigger
- Preconditions
- Main flow
- Alternative flows
- Output artifacts

### UC-AM-01 Create Module from Seed

- Actor: Storyteller
- Trigger: User starts "new module" and submits initial concept
- Preconditions: none
- Main flow:
1. Storyteller opens `/adventure-module/new`
2. Storyteller enters module name, slug, premise, and Have/Avoid palette
3. System validates slug availability globally
4. System creates module index draft and required fragment skeleton
5. Storyteller is redirected to `/adventure-module/:slug/base`
- Alternative flows:
1. Storyteller starts from blank index and manual edits only
2. Storyteller imports existing notes and maps them to fragments
- Output artifacts:
1. `index` fragment draft
2. required fragment placeholders

### UC-AM-02 Brainstorm and Select Options

- Actor: Storyteller
- Trigger: Storyteller requests ideas for module parts
- Preconditions: module index exists
- Main flow:
1. System proposes multiple options for premise/hooks/tone
2. Storyteller compares options
3. Storyteller accepts, mixes, or rejects options
4. Selected options are written into fragments
- Alternative flows:
1. Storyteller asks for stricter tone or narrower scope
2. Storyteller keeps existing text and asks for only one variant
- Output artifacts:
1. revised palette fragment
2. revised quest hook candidates

### UC-AM-03 Expand into Full Module

- Actor: Storyteller
- Trigger: Storyteller approves top-level concept and requests full expansion
- Preconditions: index, palette, and setting exist
- Main flow:
1. System generates locations, actors, assets, encounters, and quests
2. System creates storyteller summary and player summary fragments
3. System creates initial quest graph structure
4. Storyteller reviews structural completeness
5. Storyteller applies targeted edits
- Alternative flows:
1. Storyteller expands only selected fragment groups
2. Storyteller manually authors missing fragments
- Output artifacts:
1. complete fragment set
2. storyteller and player summaries
3. quest graph draft

### UC-AM-04 Polish Prose and Continuity

- Actor: Storyteller
- Trigger: Storyteller requests coherence pass
- Preconditions: module fragments exist
- Main flow:
1. System checks naming consistency and references
2. System proposes prose and linkage edits
3. Storyteller accepts or modifies edits
4. System updates fragments and index references
- Alternative flows:
1. Storyteller applies only consistency fixes, no prose rewrite
2. Storyteller requests style pass for one fragment only
- Output artifacts:
1. continuity-corrected fragment texts
2. updated summaries and references

### UC-AM-05 Generate and Curate Images

- Actor: Storyteller
- Trigger: Storyteller asks for visual artifacts
- Preconditions: relevant fragment content exists
- Main flow:
1. System creates image prompt artifacts from selected fragments
2. Optional image generation run creates image assets
3. Storyteller curates accepted prompts/assets
4. Manifest records selected outputs
- Alternative flows:
1. Storyteller keeps prompts only (no image generation)
2. Storyteller replaces generated image with manual asset
- Output artifacts:
1. `image_prompt` fragments
2. optional image asset records in manifest

### UC-AM-06 Generate and Adjust Component Opportunities

- Actor: Storyteller
- Trigger: Storyteller requests component mapping
- Preconditions: core fragments and quest graph exist
- Main flow:
1. System maps opportunities per fragment and quest node
2. Storyteller reviews strength and rationale
3. Storyteller edits or removes weak mappings
4. System saves component map
- Alternative flows:
1. Storyteller manually authors component map from scratch
2. Storyteller limits mapping to selected fragment kinds
- Output artifacts:
1. `component_map` fragment
2. structured component opportunity records

### UC-AM-07 Publish Module to Library

- Actor: Storyteller
- Trigger: Storyteller marks module as publishable
- Preconditions: quality gate checks pass
- Main flow:
1. System validates module schema and references
2. Status changes from `draft` to `published`
3. Module metadata indexed for discovery
4. System validates summary boundaries (player summary is spoiler-safe)
5. Published timestamp recorded
- Alternative flows:
1. Validation fails and system returns actionable errors
2. Storyteller archives module instead of publishing
- Output artifacts:
1. published module index metadata
2. validated artifact manifest

### UC-AM-08 Launch AI Session from Module

- Actor: Storyteller (or host)
- Trigger: User starts a new runtime adventure from selected module
- Preconditions: published or selected draft module exists
- Main flow:
1. User selects module and launch profile
2. Runtime receives module context bundle
3. Session starts using module hooks and fragment references
4. Players enter normal runtime flow
- Alternative flows:
1. User excludes selected fragments before launch
2. User overrides launch profile for AI-first behavior
- Output artifacts:
1. launch configuration snapshot
2. runtime adventure seeded from module

### UC-AM-09 Run Physical Storyteller Session from Module

- Actor: Physical Storyteller
- Trigger: Storyteller opens module for table facilitation
- Preconditions: module available in readable format
- Main flow:
1. Storyteller reviews index, quest graph, and component map
2. Storyteller runs scenes and encounters from module fragments
3. Storyteller tracks pressures and consequences using module guidance
4. Storyteller closes session with module conclusions/forward hooks
- Alternative flows:
1. Storyteller ignores optional fragments and improvises
2. Storyteller marks module edits for later revision
- Output artifacts:
1. consumed module at table
2. optional post-session edit notes

### UC-AM-10 Fork and Remix Existing Module

- Actor: Storyteller
- Trigger: Storyteller selects an existing module and starts remix
- Preconditions: source module exists
- Main flow:
1. System clones index and fragment structure with new module id
2. Storyteller modifies palette/setting/quests
3. System re-validates references and graph integrity
4. Storyteller publishes remixed version
- Alternative flows:
1. Storyteller forks only one quest into a new module
2. Storyteller creates private draft fork and never publishes
- Output artifacts:
1. new module index
2. remixed fragment set
3. updated artifact manifest

---

## 4. Concrete Route-Driven Authoring UX (v1)

Canonical client route namespace for this flow:

- `/adventure-module/list`
- `/adventure-module/new`
- `/adventure-module/:slug/:tab`
- `/adventure-module/:slug/:tab/:entityId`

Tab set:

- `base`
- `player-info`
- `storyteller-info`
- `actors`
- `locations`
- `encounters`
- `quests`
- `assets`

Key UX behavior:

- Author-owned modules render first on `/adventure-module/list`.
- Non-authors see published modules only.
- Delete action is archive soft-delete.
- Slug uniqueness is global and checked before create.
- Content edits use debounced autosave with save-on-blur.
- Publish makes the module visible to non-authors.

---

## 5. Workflow States (`create -> refine -> publish -> run`)

### Create

- Initialize module metadata
- Build required fragment skeleton
- Capture initial premise and constraints

### Refine

- Expand fragments
- polish prose and continuity
- build quest graph and component map
- curate image prompts/assets

### Publish

- Validate schema and references
- set status and publish metadata
- index for discovery

### Run

- Start AI runtime adventure from module, or
- facilitate physical session with module artifacts

---

## 6. Control Ladder Behavior at Every Step

Each workflow state supports:

1. `auto_generate`
- System drafts complete output for the current step

2. `curate_select`
- System proposes options and storyteller chooses

3. `manual_edit`
- Storyteller authors directly; assistant helps only on request

Control mode can change between steps without rebuilding the module.

---

## 7. Session Launch and Consumption Flows

### AI Storyteller Consumption Flow

1. Select module
2. Apply include/exclude fragment selections
3. Build launch context bundle
4. Start runtime `Adventure` session
5. Runtime continues with existing MVP orchestration

### Physical Storyteller Consumption Flow

1. Open module index and quest graph
2. Choose hooks and entry path at table
3. Use component map opportunities as facilitation guide
4. Resolve to selected conclusions and forward hooks

Unified abstraction expectation:

- Same module can support both flows
- No separate authored branch required for each mode

---

## 8. Acceptance Criteria for Usability

This milestone's use-case spec is usable when:

1. A storyteller can understand module lifecycle end to end.
2. All 10 required use cases are fully specified.
3. Each use case defines actor, trigger, preconditions, main flow, alternatives, and outputs.
4. Control ladder usage is explicit across workflow states.
5. Launch and consumption for AI and physical play are both documented.
6. The document clearly preserves current MVP runtime boundary.
7. Concrete route map and tabbed authoring UX are explicit and consistent with `docs/18-adventure-module-authoring-flow.md`.

