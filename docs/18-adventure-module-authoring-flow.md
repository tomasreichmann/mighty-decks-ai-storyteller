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

- author-owned modules first, each rendered as a shared cover-led story tile with visible author, tags, ownership/status pills, and explicit `Open Module` plus `Create Campaign` actions.
- non-owned published modules after author-owned entries.
- header actions: `Create Module` and `Copy Author Token`.

From this page:

- Module cards are not whole-card links; explicit `Open Module` and `Create Campaign` buttons carry the primary actions.
- `Open Module` redirects to `/adventure-module/:slug/player-info`.
- `Create Campaign` creates a campaign fork from that module and redirects to `/campaign/:slug/base`.
- `Create Module` redirects to `/adventure-module/new`.
- `Copy Author Token` copies the locally stored author token so CLI and API authoring flows can target the same owned content.

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

- Top area shows the module name and autosave status, with read-only ownership messaging rendered as a separate inline notice when needed.
- Header also exposes `Create Campaign` so authors can fork the current module into a campaign without leaving the page.
- On desktop, `Create Campaign` sits on the right side of the title row while the full tab rail stays on its own row below.
- On tablet-sized layouts and narrower, the tab rail collapses into a section dropdown in the same header row, immediately after `Create Campaign`.
- Framed image pickers reopen with the current saved image already selected, so cover art and entity art can be reused or regenerated in place.
- The shared dialog inside those pickers uses a depressed `Selected Image URL` field, an inline trash clear button, and a drag-and-drop upload area that stores external images on the server before reusing the saved URL.
- The route now delegates its shared title-row and common tab rendering through extracted `SharedAuthoringHeader` and `CommonAuthoringTabContent` components so module and campaign authoring stay aligned.
- Tabs render `Base`, `Player Info`, `Storyteller Info`, `Actors`, `Counters`, `Assets`, `Locations`, `Encounters`, `Quests`.
- `Base` is editable in this step (`premise` + `Have` + `Avoid`).
- `Player Info` is editable in this step (`player summary` + `player info text`).
- `Storyteller Info` is editable in this step (`storyteller summary` + `storyteller info text`).
- `Actors` is editable in this step.
- `Counters` is editable in this step.
- `Assets` is editable in this step.
- `Locations` is editable in this step.
- `Encounters` is editable in this step.
- `Quests` is editable in this step for fragment authoring.

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
- Cover image frame with dialog-backed image picker.

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
- Cover image selection persists through autosave and module-detail reloads because the saved `coverImageUrl` is returned in the authoring detail payload.
- The shared image dialog opens with `Gallery`, `Generate`, and `Edit` tabs so module authors can browse stored images, generate new ones, or paste/upload raw image URLs without switching dialogs.
- `Lookup Existing` works with or without a typed prompt.
- With a prompt, the current model remains the primary match and same-prompt images from other models appear in a separate gallery.
- Without a prompt, the image picker dialog can restore the saved image by file name and browse every stored image group for the provider.
- The same dialog also accepts dropped external image files, saves them through the server artifact store, and keeps the uploaded artifact selected in the field.

### 5.2 Player Info Tab (`/player-info`)

Fields:

- Player summary (large markdown field).
- Player info text (large markdown field).

Behavior:

- Edits autosave.
- Both fields use MDXEditor with rich-text and source modes.
- The editor exposes standard markdown image support through the built-in image toolbar plus a compact image button that opens a reusable generate-or-pick modal and inserts canonical `![alt](url)` snippets.
- Rich Text renders `GameCard` embeds inline using the same visuals as the rules reference cards.
- Legacy `@outcome/...`, `@effect/...`, `@stunt/...`, and module-local `@actor/...`, `@counter/...`, `@asset/...`, and `@asset/.../<modifier-slug>` tokens normalize to canonical `<GameCard type="..." slug="..." />` source on load/save and plain-text paste.
- The markdown toolbar splits asset insertion into `Generic Asset` (built-in base asset plus optional modifier) and `Custom Asset` (module-authored asset slug). Generic asset inserts emit canonical `<GameCard type="AssetCard" slug="..." modifierSlug="..." />` source.
- The markdown toolbar also inserts module-authored encounters and quests as canonical `<EncounterCard slug="..." />` and `<QuestCard slug="..." />` blocks.
- The custom item picker for authored cards, custom assets, encounters, and quests uses the native browser select so the editor shell cannot clip the menu; the selected item and each option carry the bare slug in their `title` tooltip, and the insert-control row wraps on narrow screens instead of overflowing horizontally.
- Legacy `@quest/<quest-slug>` shortcodes normalize to canonical `<QuestCard slug="..." />` source on load/save and plain-text paste.
- Player text must remain spoiler-safe at publish validation.

### 5.3 Storyteller Info Tab (`/storyteller-info`)

Fields:

- Storyteller summary (large markdown field).
- Storyteller info text (large markdown field).

Behavior:

- Edits autosave.
- Both fields use MDXEditor with rich-text and source modes.
- The editor exposes standard markdown image support through the built-in image toolbar plus a compact image button that opens a reusable generate-or-pick modal and inserts canonical `![alt](url)` snippets.
- Rich Text renders `GameCard` embeds inline using the same visuals as the rules reference cards.
- Legacy `@outcome/...`, `@effect/...`, `@stunt/...`, and module-local `@actor/...`, `@counter/...`, `@asset/...`, and `@asset/.../<modifier-slug>` tokens normalize to canonical `<GameCard type="..." slug="..." />` source on load/save and plain-text paste.
- The markdown toolbar splits asset insertion into `Generic Asset` (built-in base asset plus optional modifier) and `Custom Asset` (module-authored asset slug). Generic asset inserts emit canonical `<GameCard type="AssetCard" slug="..." modifierSlug="..." />` source.
- The markdown toolbar also inserts module-authored encounters and quests as canonical `<EncounterCard slug="..." />` and `<QuestCard slug="..." />` blocks.
- The custom item picker for authored cards, custom assets, encounters, and quests uses the same native-select-plus-slug-tooltip treatment as `Player Info`, keeping the toolbar compact without reintroducing clipped custom menus or horizontal overflow on narrow screens.
- Legacy `@quest/<quest-slug>` shortcodes normalize to canonical `<QuestCard slug="..." />` source on load/save and plain-text paste.
- Storyteller text can include spoilers.

### 5.4 Actors Tab (`/actors`)

List entries represent player/NPC character actors.

Primary action:

- `Create an Actor`

List behavior:

- The tab renders a searchable grid of layered `ActorCard` entries resolved from module actor fragments.
- Each actor card shows title, summary, and stable shortcode text.
- The compact `ShortcodeField` row copies `@actor/<actor-slug>` for manual insertion in markdown source mode.
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
- The compact `ShortcodeField` row copies `@counter/<counter-slug>` for manual insertion in markdown source mode.
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
- Each location card uses the shared horizontal `LocationCard` frame, with the location summary shown once in the card footer and a stable shortcode shown below the card.
- The compact `ShortcodeField` row copies `@location/<location-slug>` for manual insertion in markdown source mode.
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
- Each encounter card uses the shared horizontal `EncounterCard` frame, with the encounter summary shown once in the card footer, a shortcode shown below the card, and prerequisites shown as supporting metadata.
- The compact `ShortcodeField` row copies `@encounter/<encounter-slug>` for manual insertion in markdown source mode.
- `Delete` removes the encounter immediately after confirmation and leaves existing markdown embeds untouched so they fall back to invalid-embed rendering.
- Clicking a card navigates to `/adventure-module/:slug/encounters/:entityId`.

Create/edit navigation:

- Create calls `POST /api/adventure-modules/:moduleId/encounters`, then redirects to `/adventure-module/:slug/encounters/:entityId` using the generated encounter slug.
- Edit redirects to `/adventure-module/:slug/encounters/:entityId`.

### 5.8 Quests Tab (`/quests`)

Primary action:

- `Create a Quest`

List behavior:

- The tab renders a searchable grid of quest entries resolved from module quest fragments plus `questDetails` metadata.
- Each quest card uses the shared horizontal `QuestCard` frame with a gold title chip, scroll icon medallion, summary footer, and shortcode shown below the card.
- The compact `ShortcodeField` row copies `@quest/<quest-slug>` for manual insertion in markdown source mode.
- `Delete` removes the quest immediately after confirmation, rejects deleting the last quest, and leaves existing markdown embeds untouched so they fall back to invalid-embed rendering.
- Clicking a card navigates to `/adventure-module/:slug/quests/:entityId`.

Create/edit navigation:

- Create calls `POST /api/adventure-modules/:moduleId/quests`, then redirects to `/adventure-module/:slug/quests/:entityId` using the generated quest slug.
- Edit redirects to `/adventure-module/:slug/quests/:entityId`.

### 5.9 Assets Tab (`/assets`)

Primary action:

- `Create an Asset`

List behavior:

- The tab renders a searchable grid of module asset entries resolved from module asset fragments.
- Each asset card shows title, summary, and stable shortcode text.
- Legacy layered module assets are marked `Reauthor required` until they are rewritten as custom assets.
- The compact `ShortcodeField` row copies `@asset/<asset-slug>` for manual insertion in markdown source mode.
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
- `quests` entity routes are implemented for fragment authoring

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
- `Player Character` toggle.
- Markdown body with inline actor `GameCard` rendering.

Actor editor behavior:

- Updates persist through `PUT /api/adventure-modules/:moduleId/actors/:actorSlug`.
- Deletes persist through `DELETE /api/adventure-modules/:moduleId/actors/:actorSlug`.
- Actor slug is generated from the saved title and updates when the actor name changes.
- Actors marked `Player Character` seed the campaign's claimable character pool when a campaign is created from the module.
- The editor shows a live layered preview assembled from base art, tactical role metadata, and optional tactical special overlay.
- The detail surface shows a reusable shortcode row that displays `@actor/<actor-slug>` and copies it directly to the clipboard.

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
- The detail surface shows a reusable shortcode row that displays `@counter/<counter-slug>` and copies it directly to the clipboard.

Asset edit example fields:

- Asset name.
- Short summary.
- Modifier.
- Noun.
- Noun description.
- Adjective description.
- Icon image frame with dialog-backed image picker.
- Optional overlay URL.
- Markdown body with inline asset `GameCard` rendering.

Asset editor behavior:

- Updates persist through `PUT /api/adventure-modules/:moduleId/assets/:assetSlug`.
- Deletes persist through `DELETE /api/adventure-modules/:moduleId/assets/:assetSlug`.
- Asset slug is generated from the saved title and updates when the asset name changes.
- The editor supports icon-image selection and generation through the framed dialog picker, plus optional overlay URL entry and markdown body authoring.
- The editor shows a live custom `AssetCard` preview with `custom` in the top-right heading and no modifier-side heading.
- Legacy layered module assets open with blank custom fields plus a migration notice.
- Legacy layered module assets remain unsupported in normal markdown rendering until the custom fields are saved successfully.
- The detail surface shows a reusable shortcode row that displays `@asset/<asset-slug>` and copies it directly to the clipboard.

Location edit example fields:

- Location name.
- Short summary.
- Title image frame with dialog-backed image picker.
- Introduction markdown body.
- Description markdown body.
- Map image frame with dialog-backed image picker.
- Interactive map pin list and canvas.

Location editor behavior:

- Updates persist through `PUT /api/adventure-modules/:moduleId/locations/:locationSlug`.
- Deletes persist through `DELETE /api/adventure-modules/:moduleId/locations/:locationSlug`.
- Location slug is generated from the saved title and updates when the location name changes.
- The editor supports image selection and generation through the framed dialog picker for both title image and map image.
- Map pins are stored by target `fragmentId`, can be added/removed/moved, exclude the current location from the picker, preview their linked content on hover, and navigate to the linked authoring route on click.
- The detail surface shows a reusable shortcode row that displays `@location/<location-slug>` and copies it directly to the clipboard.

Encounter edit example fields:

- Encounter name.
- Summary.
- Prerequisites.
- Title image frame with dialog-backed image picker.
- Encounter markdown script with inline `GameCard` rendering and block `EncounterCard` embeds.

Encounter editor behavior:

- Updates persist through `PUT /api/adventure-modules/:moduleId/encounters/:encounterSlug`.
- Deletes persist through `DELETE /api/adventure-modules/:moduleId/encounters/:encounterSlug`.
- Encounter slug is generated from the saved title and updates when the encounter name changes.
- The editor supports title-image selection and generation through the framed dialog picker plus markdown script authoring.
- The detail surface shows a reusable shortcode row that displays `@encounter/<encounter-slug>` and copies it directly to the clipboard.

Quest edit example fields:

- Quest name.
- Summary.
- Title image frame with dialog-backed image picker.
- Quest markdown brief with inline `GameCard` rendering and block `QuestCard` embeds.

Quest editor behavior:

- Updates persist through `PUT /api/adventure-modules/:moduleId/quests/:questSlug`.
- Deletes persist through `DELETE /api/adventure-modules/:moduleId/quests/:questSlug`.
- Quest slug is generated from the saved title and updates when the quest name changes.
- The editor supports title-image selection and generation through the framed dialog picker plus markdown brief authoring.
- Quest graph editing remains out of scope for this step; create/delete operations still maintain valid underlying quest graph records automatically.
- The detail surface shows a reusable shortcode row that displays `@quest/<quest-slug>` and copies it directly to the clipboard.

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
- Quest create: `POST /api/adventure-modules/:moduleId/quests`.
- Quest update: `PUT /api/adventure-modules/:moduleId/quests/:entityId`.
- Quest delete: `DELETE /api/adventure-modules/:moduleId/quests/:entityId`.
- Entity clone: `POST /api/adventure-modules/:moduleId/:entityType/:entityId/clone`.

Supported `entityType` values in this flow:

- `actors`
- `counters`
- `locations`
- `encounters`
- `quests`
- `assets`

Repo-local automation:

- Legacy imports currently use a repo-local CLI instead of a public REST endpoint: `pnpm -C apps/server import:adventure-module -- [--source-dir <path>] [--public-dir <path>] [--creator-token <token>]`.
- The Exiles import defaults to `C:\\Projects\\mighty-decks\\src\\data\\encounters\\exiles-of-the-hungry-void` when `--source-dir` is omitted, then normalizes legacy MDX into the current Adventure Module schema.
- Imported still images are copied into `AdventureArtifactStore` and rewritten to `/api/adventure-artifacts/...` URLs; the Exiles importer also promotes curated actor and asset cards and rewrites named prose references to canonical `GameCard` embeds while keeping the imported module body markdown-first and free of legacy widget components.
- Adventure Module authoring now also has a JSON-first repo-local CLI: `pnpm -C apps/server author:module -- <command>`.
- Discovery-first commands are `capabilities`, `schema`, and `catalog`; they return one JSON document on stdout for agents that need to inspect the current contract before mutating content.
- Top-level module commands are `capabilities`, `schema`, `catalog`, `list`, `get`, `create`, `clone`, `delete`, `update-index`, `update-fragment`, `update-cover-image`, and `preview`.
- Nested module resources are `actor`, `counter`, `asset`, `location`, `encounter`, and `quest`, each with `list|get|create|update|delete`.
- Prompt-based actor authoring remains available as a compatibility alias instead of a REST endpoint: `pnpm -C apps/server author:module -- add-actor --module <module-slug> --prompt <text> [--creator-token <token>]`.
- The actor alias loads the module, runs the `adventure_module_actor_from_prompt` workflow with current module context plus existing actor titles, creates the actor, and then immediately applies the generated typed fields.
- The CLI exposes shared static catalogs for actor layers, roles, specials, counter icons, asset bases, asset modifiers, module enums, and built-in outcome/effect/stunt shortcodes so external agents know which values to pick.

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
- Tablet and narrower widths collapse the section tabs into the header dropdown without rendering a second standalone section control.
- Create entity redirects to entity edit route.
- Debounced autosave saves field updates and reports status.
- Actor cards open the actor editor, location cards open the location editor, encounter cards open the encounter editor, counter cards open the counter editor, asset cards open the asset editor, and actor/counter/asset shortcodes normalize to canonical `<GameCard />` source without mutating inline or fenced code blocks.
- Location editor persists introduction/description markdown, title and map image fields, and interactive map pins without breaking route navigation after slug changes.
- Encounter editor persists prerequisites, title image, and markdown script without breaking route navigation after slug changes.
- Quest editor persists summary, title image, and markdown brief without breaking route navigation after slug changes.
- Actor, counter, asset, location, and encounter deletes do not rewrite stored markdown; stale references rely on invalid-card fallback rendering.
- Quest deletes do not rewrite stored markdown; stale quest references rely on invalid-card fallback rendering.
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


