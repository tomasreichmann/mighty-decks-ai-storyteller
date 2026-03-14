# 18 - Adventure Module Authoring Flow

This document is the canonical user flow for authoring Adventure Modules.

This is a docs/design milestone only. It does not implement runtime API or UI code in this step.

---

## 1. Locked Defaults

This flow is locked to the following defaults:

- Route namespace uses singular paths (`/adventure-module/...`).
- Delete behavior is archive soft-delete.
- Slug uniqueness is global across all modules.
- Draft modules are visible only to the author.
- Published modules are visible to non-authors.
- Tab terminology uses `Actors` (schema kind remains `actor`).
- Save behavior is debounced autosave with blur-save and status feedback.

---

## 2. Roles and Visibility

Two viewer roles are assumed:

- `author`: module owner with create/edit/publish/archive permissions.
- `reader`: non-owner browsing published modules.

List visibility rules:

- Author sees own modules in all statuses: `draft`, `published`, `archived`.
- Reader sees published modules only.
- If the author is on the list page, author-owned modules render first.
- Within each visibility bucket, list sort uses latest update timestamp descending.

---

## 3. Canonical Route Map

Client routes:

- `/adventure-module/list`
- `/adventure-module/new`
- `/adventure-module/:slug/:tab`
- `/adventure-module/:slug/:tab/:entityId`

Authoring tabs:

- `base`
- `player-info`
- `storyteller-info`
- `actors`
- `locations`
- `encounters`
- `quests`
- `assets`

Entity edit routes:

- `/adventure-module/:slug/actors/:entityId`
- `/adventure-module/:slug/locations/:entityId`
- `/adventure-module/:slug/encounters/:entityId`
- `/adventure-module/:slug/quests/:entityId`
- `/adventure-module/:slug/assets/:entityId`

---

## 4. End-to-End Journey

### 4.1 Adventure Modules List

Route: `/adventure-module/list`

User sees a list with:

- author-owned modules first, each with `Edit` and `Delete` (archive) actions.
- non-owned published modules after author-owned entries.
- primary action: `Create a new Adventure Module`.

From this page:

- Module cards are clickable and open `/adventure-module/:slug/player-info`.
- `Edit` actions redirect to `/adventure-module/:slug/player-info`.
- `Delete` opens archive confirmation and transitions status to `archived`.
- `Create a new Adventure Module` redirects to `/adventure-module/new`.

### 4.2 New Adventure Module

Route: `/adventure-module/new`

Form fields:

- `Adventure Module Name` (required).
- `Slug` (auto-generated from name, editable).

Slug behavior:

- Slug is generated as lowercase kebab-case from name while slug is in auto mode.
- If user manually edits slug, auto mode is disabled for that field instance.
- Slug uniqueness is checked globally with debounced validation.
- Create action remains disabled while slug check is pending or invalid.

Create action:

- `Create!` validates required fields and slug uniqueness.
- On success, redirects to `/adventure-module/:slug/base`.
- Premise/Have/Avoid authoring is handled on the Base tab after create.

### 4.3 Adventure Module Authoring Shell

Route: `/adventure-module/:slug/:tab`

Shell behavior:

- Top area shows module name, slug, ownership state, and autosave status.
- Tabs render `Base`, `Player Info`, `Storyteller Info`, `Actors`, `Locations`, `Encounters`, `Quests`, `Assets`.
- `Base` is editable in this step (`premise` + `Have` + `Avoid`).
- `Player Info` is editable in this step (`player summary` + `player info text`).
- `Storyteller Info` is editable in this step (`storyteller summary` + `storyteller info text`).
- `Actors`, `Locations`, `Encounters`, `Quests`, and `Assets` are explicit placeholders in this step.

Tab state behavior:

- Changing tabs preserves module context and current tab route.
- Base, Player Info, and Storyteller Info tab edits persist via debounced autosave.

---

## 5. Tab-Level UX Contract

### 5.1 Base Tab (`/base`)

Fields:

- Premise.
- Have tags.
- Avoid tags.

Behavior:

- Edits autosave.
- Premise uses `SmartInput` with workflow actions:
  - make changes with free-text instruction
  - convert to prose
  - convert to bullets
  - expand by percent
  - compact by percent
- While a smart action is running, premise input is disabled.
- Running controls include `Stop` and `Discard`.
- Successful smart actions auto-apply and expose one-click rollback for the latest applied change.

### 5.2 Player Info Tab (`/player-info`)

Fields:

- Player summary (large markdown field).
- Player info text (large markdown field).

Behavior:

- Edits autosave.
- Both fields use MDXEditor with rich-text and source modes.
- Rich Text renders `GameCard` embeds inline using the same visuals as the rules reference cards.
- Legacy `@outcome/...`, `@effect/...`, and `@stunt/...` tokens normalize to canonical `<GameCard type="..." slug="..." />` source on load/save and plain-text paste.
- Player text must remain spoiler-safe at publish validation.

### 5.3 Storyteller Info Tab (`/storyteller-info`)

Fields:

- Storyteller summary (large markdown field).
- Storyteller info text (large markdown field).

Behavior:

- Edits autosave.
- Both fields use MDXEditor with rich-text and source modes.
- Rich Text renders `GameCard` embeds inline using the same visuals as the rules reference cards.
- Legacy `@outcome/...`, `@effect/...`, and `@stunt/...` tokens normalize to canonical `<GameCard type="..." slug="..." />` source on load/save and plain-text paste.
- Storyteller text can include spoilers.

### 5.4 Actors Tab (`/actors`)

Status in this step: placeholder only.

List entries represent player/NPC character actors.

Per-row actions:

- `Edit`
- `Clone`
- `Delete` (archive/tombstone behavior based on entity policy)

Primary action:

- `Create an Actor`

Create/edit navigation:

- Create redirects to `/adventure-module/:slug/actors/:entityId`.
- Edit redirects to `/adventure-module/:slug/actors/:entityId`.

### 5.5 Locations Tab (`/locations`)

Status in this step: placeholder only.

Per-row actions:

- `Edit`
- `Clone`
- `Delete`

Primary action:

- `Create a Location`

### 5.6 Encounters Tab (`/encounters`)

Status in this step: placeholder only.

Per-row actions:

- `Edit`
- `Clone`
- `Delete`

Primary action:

- `Create an Encounter`

### 5.7 Quests Tab (`/quests`)

Status in this step: placeholder only.

Per-row actions:

- `Edit`
- `Clone`
- `Delete`

Primary action:

- `Create a Quest`

### 5.8 Assets Tab (`/assets`)

Status in this step: placeholder only.

Per-row actions:

- `Edit`
- `Clone`
- `Delete`

Primary action:

- `Create an Asset`

---

## 6. Entity Edit View Pattern

Route pattern: `/adventure-module/:slug/:tab/:entityId`

Status in this step: placeholder route only.

Future target semantics for entity editors:

- Debounced autosave window: 800-1200ms.
- Save on blur even if debounce window has not elapsed.
- Autosave badge states: `Queued`, `Saving`, `Saved`, `Error`.

Actor edit example fields:

- Actor name.
- Visual description.
- Personality.
- Profile image.
- Mini (full-body image).
- Notes.

Equivalent typed editors exist for location, encounter, quest, and asset with their own field sets.

---

## 7. Publish and Archive

Publish action:

- Triggered from authoring shell.
- Validates required module sections and spoiler boundary checks.
- Changes module status `draft -> published`.
- Sets `publishedAtIso`.
- Published module becomes visible to non-authors.

Archive action:

- Triggered by `Delete` on module list.
- Changes status to `archived` (no hard delete).
- Archived modules are hidden from non-author list results.
- Author can still view archived modules in author scope.

---

## 8. Proposed API and Interface Additions (Docs-Level)

These are proposed contracts for implementation planning only:

- Slug availability: `GET /api/adventure-modules/slug-availability?slug=:slug`, response `{ slug: string; available: boolean; reason?: string }`.
- Module read by slug: `GET /api/adventure-modules/by-slug/:slug`, response mirrors module detail read shape.
- Publish module: `POST /api/adventure-modules/:moduleId/publish`.
- Archive module: `POST /api/adventure-modules/:moduleId/archive`.
- Entity create: `POST /api/adventure-modules/:moduleId/:entityType`.
- Entity update: `PUT /api/adventure-modules/:moduleId/:entityType/:entityId`.
- Entity clone: `POST /api/adventure-modules/:moduleId/:entityType/:entityId/clone`.
- Entity delete: `DELETE /api/adventure-modules/:moduleId/:entityType/:entityId`.

Supported `entityType` values in this flow:

- `actors`
- `locations`
- `encounters`
- `quests`
- `assets`

---

## 9. Validation and QA Scenarios

Flow clarity checks:

- User can complete `list -> create -> author -> publish` without undocumented steps.
- Each step defines route, action, validation, and redirect.

UX behavior checks:

- Author-owned modules render before other visible modules on list page.
- Clicking a module card opens `/adventure-module/:slug/player-info`.
- Name creates slug and slug uniqueness is enforced globally.
- Create redirects to module authoring base tab.
- Tab navigation keeps module context.
- Create entity redirects to entity edit route.
- Debounced autosave saves field updates and reports status.
- Publish exposes module to non-author list views.
- Archive hides module from non-author list while preserving author access.

Design handoff checks:

- Desktop and mobile wireframe pairs exist for all planned views.
- Each wireframe includes a right-side description rail.
- Description rail includes purpose, actions, validation, autosave, and visibility/publish rules.

---

## 10. Penpot Frame Mapping

Penpot page name:

- `Adventure Module Authoring - Flow v1`

Frame inventory:

- `AM-01` Adventure Modules List (Desktop, Mobile)
- `AM-02` New Adventure Module (Desktop, Mobile)
- `AM-03` Authoring Base Tab (Desktop, Mobile)
- `AM-04` Authoring Player Info Tab (Desktop, Mobile)
- `AM-05` Authoring Actors Tab (Desktop, Mobile)
- `AM-06` Authoring Locations Tab (Desktop, Mobile)
- `AM-07` Authoring Encounters Tab (Desktop, Mobile)
- `AM-08` Authoring Quests Tab (Desktop, Mobile)
- `AM-09` Authoring Assets Tab (Desktop, Mobile)
- `AM-10` Entity Edit View Template (Desktop, Mobile)
- `AM-11` Publish Confirmation/Result State (Desktop, Mobile)

Detailed frame-by-frame annotation content is defined in:

- `docs/ux-design/adventure-module-authoring-flow-v1-frames.md`
- `docs/ux-design/penpot/adventure-module-authoring-flow-v1/` (SVG import pack + manifest)


