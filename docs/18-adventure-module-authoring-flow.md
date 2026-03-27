# 18 - Adventure Module Authoring Flow

This document is the canonical user flow for authoring Adventure Modules.

It tracks the currently implemented authoring shell plus the remaining planned gaps.

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
- `counters`
- `assets`
- `locations`
- `encounters`
- `quests`

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
- Tabs render `Base`, `Player Info`, `Storyteller Info`, `Actors`, `Counters`, `Assets`, `Locations`, `Encounters`, `Quests`.
- `Base` is editable in this step (`premise` + `Have` + `Avoid`).
- `Player Info` is editable in this step (`player summary` + `player info text`).
- `Storyteller Info` is editable in this step (`storyteller summary` + `storyteller info text`).
- `Actors` is editable in this step.
- `Counters` is editable in this step.
- `Assets` is editable in this step.
- `Locations` is editable in this step.
- `Encounters` is editable in this step.
- `Quests` remains an explicit placeholder in this step.

Tab state behavior:

- Changing tabs preserves module context and current tab route.
- Base, Player Info, Storyteller Info, and typed entity editors persist via debounced autosave plus save-on-blur.

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
- Legacy `@outcome/...`, `@effect/...`, `@stunt/...`, and module-local `@actor/...`, `@counter/...`, `@asset/...`, and `@asset/.../<modifier-slug>` tokens normalize to canonical `<GameCard type="..." slug="..." />` source on load/save and plain-text paste.
- The markdown toolbar splits asset insertion into `Generic Asset` (built-in base asset plus optional modifier) and `Custom Asset` (module-authored asset slug). Generic asset inserts emit canonical `<GameCard type="AssetCard" slug="..." modifierSlug="..." />` source.
- The markdown toolbar also inserts module-authored encounters as canonical `<EncounterCard slug="..." />` blocks.
- Player text must remain spoiler-safe at publish validation.

### 5.3 Storyteller Info Tab (`/storyteller-info`)

Fields:

- Storyteller summary (large markdown field).
- Storyteller info text (large markdown field).

Behavior:

- Edits autosave.
- Both fields use MDXEditor with rich-text and source modes.
- Rich Text renders `GameCard` embeds inline using the same visuals as the rules reference cards.
- Legacy `@outcome/...`, `@effect/...`, `@stunt/...`, and module-local `@actor/...`, `@counter/...`, `@asset/...`, and `@asset/.../<modifier-slug>` tokens normalize to canonical `<GameCard type="..." slug="..." />` source on load/save and plain-text paste.
- The markdown toolbar splits asset insertion into `Generic Asset` (built-in base asset plus optional modifier) and `Custom Asset` (module-authored asset slug). Generic asset inserts emit canonical `<GameCard type="AssetCard" slug="..." modifierSlug="..." />` source.
- The markdown toolbar also inserts module-authored encounters as canonical `<EncounterCard slug="..." />` blocks.
- Storyteller text can include spoilers.

### 5.4 Actors Tab (`/actors`)

List entries represent player/NPC character actors.

Primary action:

- `Create an Actor`

List behavior:

- The tab renders a searchable grid of layered `ActorCard` entries resolved from module actor fragments.
- Each actor card shows title, summary, and stable shortcode text.
- `Copy Shortcode` copies `@actor/<actor-slug>` for manual insertion in markdown source mode.
- `Delete` removes the actor immediately after confirmation and leaves existing markdown embeds untouched so they fall back to invalid-card rendering.
- Clicking a card navigates to `/adventure-module/:slug/actors/:entityId`.

Create/edit navigation:

- Create calls `POST /api/adventure-modules/:moduleId/actors`, then redirects to `/adventure-module/:slug/actors/:entityId` using the generated actor slug.
- Edit redirects to `/adventure-module/:slug/actors/:entityId`.

### 5.5 Counters Tab (`/counters`)

Primary action:

- `Create a Counter`

List behavior:

- The tab renders a searchable grid of interactive `CounterCard` entries resolved from module counter records, including inline controls for shared current and max values.
- Each counter card shows title, description, stable shortcode text, and shared `+` and `-` controls.
- `Copy Shortcode` copies `@counter/<counter-slug>` for manual insertion in markdown source mode.
- `Delete` removes the counter immediately after confirmation and leaves existing markdown embeds untouched so they fall back to invalid-card rendering.
- Clicking a card navigates to `/adventure-module/:slug/counters/:entityId`.

Create/edit navigation:

- Create calls `POST /api/adventure-modules/:moduleId/counters`, then redirects to `/adventure-module/:slug/counters/:entityId` using the generated counter slug.
- Edit redirects to `/adventure-module/:slug/counters/:entityId`.

### 5.6 Locations Tab (`/locations`)

Primary action:

- `Create a Location`

List behavior:

- The tab renders a searchable grid of location entries resolved from module location fragments plus `locationDetails` metadata.
- Each location card shows title, summary, title-image preview when present, and stable shortcode text.
- `Copy Shortcode` copies `@location/<location-slug>` for manual insertion in markdown source mode.
- `Delete` removes the location immediately after confirmation.
- Clicking a card navigates to `/adventure-module/:slug/locations/:entityId`.

Create/edit navigation:

- Create calls `POST /api/adventure-modules/:moduleId/locations`, then redirects to `/adventure-module/:slug/locations/:entityId` using the generated location slug.
- Edit redirects to `/adventure-module/:slug/locations/:entityId`.

### 5.7 Encounters Tab (`/encounters`)

Primary action:

- `Create an Encounter`

List behavior:

- The tab renders a searchable grid of encounter entries resolved from module encounter fragments plus `encounterDetails` metadata.
- Each encounter card shows title, short description, the shared 3:2 encounter-card frame, and canonical embed source.
- `Copy Embed` copies `<EncounterCard slug="<encounter-slug>" />` for markdown source mode.
- `Delete` removes the encounter immediately after confirmation and leaves existing markdown embeds untouched so they fall back to invalid-embed rendering.
- Clicking a card navigates to `/adventure-module/:slug/encounters/:entityId`.

Create/edit navigation:

- Create calls `POST /api/adventure-modules/:moduleId/encounters`, then redirects to `/adventure-module/:slug/encounters/:entityId` using the generated encounter slug.
- Edit redirects to `/adventure-module/:slug/encounters/:entityId`.

### 5.8 Quests Tab (`/quests`)

Status in this step: placeholder only.

Per-row actions:

- `Edit`
- `Clone`
- `Delete`

Primary action:

- `Create a Quest`

### 5.9 Assets Tab (`/assets`)

Primary action:

- `Create an Asset`

List behavior:

- The tab renders a searchable grid of module asset entries resolved from module asset fragments.
- Each asset card shows title, summary, and stable shortcode text.
- Legacy layered module assets are marked `Reauthor required` until they are rewritten as custom assets.
- `Copy Shortcode` copies `@asset/<asset-slug>` for manual insertion in markdown source mode.
- `Delete` removes the asset immediately after confirmation and leaves existing markdown embeds untouched so they fall back to invalid-card rendering.
- Clicking a card navigates to `/adventure-module/:slug/assets/:entityId`.

Create/edit navigation:

- Create calls `POST /api/adventure-modules/:moduleId/assets`, then redirects to `/adventure-module/:slug/assets/:entityId` using the generated asset slug.
- Edit redirects to `/adventure-module/:slug/assets/:entityId`.

---

## 6. Entity Edit View Pattern

Route pattern: `/adventure-module/:slug/:tab/:entityId`

Status in this step:

- `actors` entity routes are implemented
- `locations` entity routes are implemented
- `counters` entity routes are implemented
- `assets` entity routes are implemented
- `encounters` entity routes are implemented
- `quests` entity routes remain placeholders

Future target semantics for entity editors:

- Debounced autosave window: 800-1200ms.
- Save on blur even if debounce window has not elapsed.
- Autosave badge states: `Queued`, `Saving`, `Saved`, `Error`.

Actor edit example fields:

- Actor name.
- Short summary.
- Base layer.
- Tactical role.
- Optional tactical special.
- Markdown body with inline actor `GameCard` rendering.

Actor editor behavior:

- Updates persist through `PUT /api/adventure-modules/:moduleId/actors/:actorSlug`.
- Deletes persist through `DELETE /api/adventure-modules/:moduleId/actors/:actorSlug`.
- Actor slug is generated from the saved title and updates when the actor name changes.
- The editor shows a live layered preview assembled from base art, tactical role metadata, and optional tactical special overlay.

Counter edit example fields:

- Counter name.
- Counter icon.
- Current value.
- Optional max value.
- Description.

Counter editor behavior:

- Updates persist through `PUT /api/adventure-modules/:moduleId/counters/:counterSlug`.
- Deletes persist through `DELETE /api/adventure-modules/:moduleId/counters/:counterSlug`.
- Counter slug is generated from the saved title and updates when the counter name changes.
- The editor shows a live `CounterCard` preview with shared `+` and `-` controls for current and max values.

Asset edit example fields:

- Asset name.
- Short summary.
- Modifier.
- Noun.
- Noun description.
- Adjective description.
- Icon URL.
- Optional overlay URL.
- Markdown body with inline asset `GameCard` rendering.

Asset editor behavior:

- Updates persist through `PUT /api/adventure-modules/:moduleId/assets/:assetSlug`.
- Deletes persist through `DELETE /api/adventure-modules/:moduleId/assets/:assetSlug`.
- Asset slug is generated from the saved title and updates when the asset name changes.
- The editor shows a live custom `AssetCard` preview with `custom` in the top-right heading and no modifier-side heading.
- Legacy layered module assets open with blank custom fields plus a migration notice.
- Legacy layered module assets remain unsupported in normal markdown rendering until the custom fields are saved successfully.

Location edit example fields:

- Location name.
- Short summary.
- Title image URL with generated-image picker.
- Introduction markdown body.
- Description markdown body.
- Map image URL with generated-image picker.
- Interactive map pin list and canvas.

Location editor behavior:

- Updates persist through `PUT /api/adventure-modules/:moduleId/locations/:locationSlug`.
- Deletes persist through `DELETE /api/adventure-modules/:moduleId/locations/:locationSlug`.
- Location slug is generated from the saved title and updates when the location name changes.
- The editor supports manual image URLs plus generated-image selection for both title image and map image.
- Map pins are stored by target `fragmentId`, can be added/removed/moved, exclude the current location from the picker, preview their linked content on hover, and navigate to the linked authoring route on click.

Encounter edit example fields:

- Encounter name.
- Short description.
- Prerequisites.
- Title image URL with generated-image picker.
- Encounter markdown script with inline `GameCard` rendering and block `EncounterCard` embeds.

Encounter editor behavior:

- Updates persist through `PUT /api/adventure-modules/:moduleId/encounters/:encounterSlug`.
- Deletes persist through `DELETE /api/adventure-modules/:moduleId/encounters/:encounterSlug`.
- Encounter slug is generated from the saved title and updates when the encounter name changes.
- The editor supports title-image generation/paste flows and markdown script authoring.

Equivalent typed editor for quest remains future work.

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

These are the current contracts for actor, counter, asset, location, and encounter authoring plus proposed contracts for the remaining entity types:

- Slug availability: `GET /api/adventure-modules/slug-availability?slug=:slug`, response `{ slug: string; available: boolean; reason?: string }`.
- Module read by slug: `GET /api/adventure-modules/by-slug/:slug`, response mirrors module detail read shape.
- Publish module: `POST /api/adventure-modules/:moduleId/publish`.
- Archive module: `POST /api/adventure-modules/:moduleId/archive`.
- Actor create: `POST /api/adventure-modules/:moduleId/actors`.
- Actor update: `PUT /api/adventure-modules/:moduleId/actors/:entityId`.
- Actor delete: `DELETE /api/adventure-modules/:moduleId/actors/:entityId`.
- Counter create: `POST /api/adventure-modules/:moduleId/counters`.
- Counter update: `PUT /api/adventure-modules/:moduleId/counters/:entityId`.
- Counter delete: `DELETE /api/adventure-modules/:moduleId/counters/:entityId`.
- Asset create: `POST /api/adventure-modules/:moduleId/assets`.
- Asset update: `PUT /api/adventure-modules/:moduleId/assets/:entityId`.
- Asset delete: `DELETE /api/adventure-modules/:moduleId/assets/:entityId`.
- Location create: `POST /api/adventure-modules/:moduleId/locations`.
- Location update: `PUT /api/adventure-modules/:moduleId/locations/:entityId`.
- Location delete: `DELETE /api/adventure-modules/:moduleId/locations/:entityId`.
- Encounter create: `POST /api/adventure-modules/:moduleId/encounters`.
- Encounter update: `PUT /api/adventure-modules/:moduleId/encounters/:entityId`.
- Encounter delete: `DELETE /api/adventure-modules/:moduleId/encounters/:entityId`.
- Remaining entity create: `POST /api/adventure-modules/:moduleId/:entityType`.
- Remaining entity update: `PUT /api/adventure-modules/:moduleId/:entityType/:entityId`.
- Entity clone: `POST /api/adventure-modules/:moduleId/:entityType/:entityId/clone`.

Supported `entityType` values in this flow:

- `actors`
- `counters`
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
- Actor cards open the actor editor, location cards open the location editor, encounter cards open the encounter editor, counter cards open the counter editor, asset cards open the asset editor, and actor/counter/asset shortcodes normalize to canonical `<GameCard />` source without mutating inline or fenced code blocks.
- Location editor persists introduction/description markdown, title and map image fields, and interactive map pins without breaking route navigation after slug changes.
- Encounter editor persists prerequisites, title image, and markdown script without breaking route navigation after slug changes.
- Actor, counter, asset, location, and encounter deletes do not rewrite stored markdown; stale references rely on invalid-card fallback rendering.
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


