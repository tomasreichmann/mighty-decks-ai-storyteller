# Adventure Module Authoring - Flow v1 (Penpot Frames)

This document is the implementation checklist for the Penpot page:

- `Adventure Module Authoring - Flow v1`

The frame set is low-fidelity and structure-first.

Generated import pack:

- `docs/ux-design/penpot/adventure-module-authoring-flow-v1/`

---

## 1. Frame Standards

Frame naming:

- Use exact IDs `AM-01` through `AM-11`.
- Use variant suffixes `Desktop` and `Mobile`.

Recommended frame sizes:

- Desktop: `1440x1024`
- Mobile: `390x844`

Right-side description rail:

- Place outside the viewport on the right side.
- Keep fixed width on both desktop and mobile variants.
- Include exactly these headings: `Purpose`, `Primary actions`, `Validation`, `Autosave`, `Visibility/publish rules`.

---

## 2. Frame Matrix (22 Frames)

| Frame | Variant | Route | View |
| --- | --- | --- | --- |
| `AM-01` | Desktop | `/adventure-module/list` | Adventure Modules list |
| `AM-01` | Mobile | `/adventure-module/list` | Adventure Modules list |
| `AM-02` | Desktop | `/adventure-module/new` | New Adventure Module |
| `AM-02` | Mobile | `/adventure-module/new` | New Adventure Module |
| `AM-03` | Desktop | `/adventure-module/:slug/base` | Authoring Base tab |
| `AM-03` | Mobile | `/adventure-module/:slug/base` | Authoring Base tab |
| `AM-04` | Desktop | `/adventure-module/:slug/player-info` | Authoring Player Info tab |
| `AM-04` | Mobile | `/adventure-module/:slug/player-info` | Authoring Player Info tab |
| `AM-05` | Desktop | `/adventure-module/:slug/actors` | Authoring Actors tab |
| `AM-05` | Mobile | `/adventure-module/:slug/actors` | Authoring Actors tab |
| `AM-06` | Desktop | `/adventure-module/:slug/locations` | Authoring Locations tab |
| `AM-06` | Mobile | `/adventure-module/:slug/locations` | Authoring Locations tab |
| `AM-07` | Desktop | `/adventure-module/:slug/encounters` | Authoring Encounters tab |
| `AM-07` | Mobile | `/adventure-module/:slug/encounters` | Authoring Encounters tab |
| `AM-08` | Desktop | `/adventure-module/:slug/quests` | Authoring Quests tab |
| `AM-08` | Mobile | `/adventure-module/:slug/quests` | Authoring Quests tab |
| `AM-09` | Desktop | `/adventure-module/:slug/assets` | Authoring Assets tab |
| `AM-09` | Mobile | `/adventure-module/:slug/assets` | Authoring Assets tab |
| `AM-10` | Desktop | `/adventure-module/:slug/actors/:entityId` | Entity edit template (Actor example) |
| `AM-10` | Mobile | `/adventure-module/:slug/actors/:entityId` | Entity edit template (Actor example) |
| `AM-11` | Desktop | `/adventure-module/:slug/base` | Publish confirmation/result state |
| `AM-11` | Mobile | `/adventure-module/:slug/base` | Publish confirmation/result state |

---

## 3. Description Rail Copy per Frame

Use the following side-rail text blocks for each frame.

### AM-01 Adventure Modules List

- Purpose: Show module library with author-owned modules first and management actions.
- Primary actions: Edit module, archive module, create new module.
- Validation: Archive requires confirmation.
- Autosave: Not applicable on list view.
- Visibility/publish rules: Author sees draft/published/archived; non-author sees published only.

### AM-02 New Adventure Module

- Purpose: Capture top-level module seed information and create a draft.
- Primary actions: Enter name, adjust slug, enter premise, set Have/Avoid tags, create.
- Validation: Name required, premise required, slug required and globally unique.
- Autosave: Not persisted until create action succeeds.
- Visibility/publish rules: Created module starts as draft and is author-only.

### AM-03 Authoring Base Tab

- Purpose: Edit premise and palette constraints used by all downstream content.
- Primary actions: Edit premise, update Have tags, update Avoid tags.
- Validation: Premise required; palette limits enforced.
- Autosave: Debounced autosave and save-on-blur.
- Visibility/publish rules: Draft remains private until publish.

### AM-04 Authoring Player Info Tab

- Purpose: Maintain player-facing overview text and structure shared with storyteller info.
- Primary actions: Edit player summary/info.
- Validation: Publish check enforces spoiler-safe player text.
- Autosave: Debounced autosave and save-on-blur.
- Visibility/publish rules: Player-facing text must be safe for published readers.

### AM-05 Authoring Actors Tab

- Purpose: Manage player/NPC character actors for module scenes.
- Primary actions: Create actor, edit actor, clone actor, delete actor.
- Validation: Actor list requires at least one actor to publish-ready state.
- Autosave: List metadata and ordering autosave when edited.
- Visibility/publish rules: Actor content is private in draft and public when module is published.

### AM-06 Authoring Locations Tab

- Purpose: Manage playable places and route anchors.
- Primary actions: Create location, edit location, clone location, delete location.
- Validation: Location list requires at least one location.
- Autosave: Debounced autosave and save-on-blur.
- Visibility/publish rules: Published module exposes location entries to readers.

### AM-07 Authoring Encounters Tab

- Purpose: Manage structured scene pressure beats.
- Primary actions: Create encounter, edit encounter, clone encounter, delete encounter.
- Validation: Encounter list requires at least one encounter.
- Autosave: Debounced autosave and save-on-blur.
- Visibility/publish rules: Published module exposes encounter entries to readers.

### AM-08 Authoring Quests Tab

- Purpose: Manage quest fragments and progression hooks.
- Primary actions: Create quest, edit quest, clone quest, delete quest.
- Validation: Quest list requires at least one quest.
- Autosave: Debounced autosave and save-on-blur.
- Visibility/publish rules: Published module exposes quest entries to readers.

### AM-09 Authoring Assets Tab

- Purpose: Manage things, structures, vehicles, and other scene resources.
- Primary actions: Create asset, edit asset, clone asset, delete asset.
- Validation: Asset set must satisfy module quality checks.
- Autosave: Debounced autosave and save-on-blur.
- Visibility/publish rules: Published module exposes asset entries to readers.

### AM-10 Entity Edit Template

- Purpose: Edit a single entity using type-specific fields.
- Primary actions: Update entity fields, media references, and notes.
- Validation: Required fields enforced per entity type.
- Autosave: Debounced autosave and save-on-blur with status badge.
- Visibility/publish rules: Edits affect draft/private content until module publish.

### AM-11 Publish Confirmation/Result

- Purpose: Confirm publish action and display result or blocking errors.
- Primary actions: Confirm publish, return to fixes when validation fails.
- Validation: Runs module completeness and spoiler-boundary checks.
- Autosave: Ensure pending saves flush before publish request.
- Visibility/publish rules: Successful publish exposes module to non-authors.

