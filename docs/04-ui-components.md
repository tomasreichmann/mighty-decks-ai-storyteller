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
- Use `Heading` for semantic section and page titles; use `Text` for body copy and supporting text.
- Use `Button` for actions (including icon-only/circle variants) instead of styled `button`s.
- Use `Label` for badge-like headings, tags, and compact status chips.
- Use `Message` for alert/status/informational callouts instead of custom callout wrappers.
- Use `TextField`, `TextArea`, and `DepressedInput` for form controls before creating one-off input styles.
- Use `Button`, `ToggleButton`, `RockerSwitch`, and `ButtonRadioGroup` for button-like controls that need aligned heights or grouped states.

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
- `CTAButton`

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
- `AdventureModuleCard`
- shared `StoryTileCard`
- shared `SearchField` for the compact depressed search shell
- shared `ResponsiveCardGrid` for the 1/2/3 responsive card layout
- shared `ShortcodeField` reused for the header-level `Copy Author Token` button
- `ModuleVisibilityBadge`
- `CreateAdventureModuleButton`

List rules:

- Author-owned modules render first.
- Non-author list view includes published modules only.
- The list header exposes `Create Module` plus `Copy Author Token`.
- Module cards use explicit in-card `Open Module` and `Create Campaign` actions rather than whole-card click targets.
- Module cards surface author, tags, ownership/status pills, and cover art inside the shared story-tile shell.
- The module grid stays compact at one card on mobile, two on tablet, and three on desktop.

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

- `SharedAuthoringHeader`
- `AdventureModuleTabNav`
  - supports optional leading/trailing slot content for session-specific chrome such as a home-link logo and autosave badge
  - collapses to a labeled vertical dropdown on tablet/mobile breakpoints while keeping the full button rail on desktop
- `AutosaveStatusBadge`
- `PublishModuleButton`
- `CommonAuthoringTabContent`
- `AuthoringProvider` plus `AdventureModuleAuthoringScreen` as the thin route shell
- shared authoring helpers in `lib/authoring/sharedAuthoring*`
- shared authoring store modules in `lib/authoring/store/*`

Architecture notes:

- the route should stay thin and only provide params, navigation, and the creator token to `AuthoringProvider`
- shared draft state, dirty tracking, optimistic autosave, and create/delete flows live in the shared authoring reducer/provider layer
- `CommonAuthoringTabContent` reads from authoring context instead of receiving large prop bags from the route
- tab and editor-specific validation clearing, blur-save, and optional session-only selection actions should stay co-located with the shared tab/editor surfaces rather than in the route file

Tabs:

- `base`: `ModuleBaseTabPanel` with `SmartInput` for premise transforms
- `player-info`: `AdventureModulePlayerInfoTabPanel` with dual MDXEditor fields (`Player Summary`, `Player Info Text`) in rich + source modes, inline `GameCard` embeds, block `EncounterCard` and `QuestCard` embeds, and autosave
- `storyteller-info`: `AdventureModuleStorytellerInfoTabPanel` with dual MDXEditor fields (`Storyteller Summary`, `Storyteller Info Text`) in rich + source modes, inline `GameCard` embeds, block `EncounterCard` and `QuestCard` embeds, and autosave
- `actors`: `AdventureModuleActorsTabPanel` showing searchable layered `ActorCard` entries, `Create Actor`, compact shortcode rows, and delete actions
- `counters`: `AdventureModuleCountersTabPanel` showing searchable interactive `CounterCard` entries, `Create Counter`, compact shortcode rows, delete actions, and a neutral `Message` empty state when no counters exist
- `assets`: `AdventureModuleAssetsTabPanel` showing searchable custom `AssetCard` entries, legacy `Reauthor required` states, `Create Asset`, compact shortcode rows, and delete actions
- `locations`: `AdventureModuleLocationsTabPanel` showing searchable location cards, title-image previews, `Create Location`, compact shortcode rows, and delete actions
- `encounters`: `AdventureModuleEncountersTabPanel` showing searchable `EncounterCard` entries, `Create Encounter`, compact shortcode rows, and delete actions
- `quests`: `AdventureModuleQuestsTabPanel` showing searchable `QuestCard` entries, `Create Quest`, compact shortcode rows, and delete actions
- the searchable entity lists reuse the shared compact depressed search shell and the same mobile/tablet/desktop 1/2/3 card grid

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

Entity editor route. Actor, counter, asset, location, encounter, and quest fragment editing are implemented in this step.

Components:

- `AdventureModuleActorEditor`
- `AdventureModuleCounterEditor`
- `AdventureModuleAssetEditor`
- `AdventureModuleLocationEditor`
- `AdventureModuleEncounterEditor`
- `AdventureModuleQuestEditor`
- `AdventureModuleLocationMapEditor`

Actor editor baseline fields:

- name
- short summary
- layered actor base
- tactical role
- optional tactical special
- markdown body with inline `GameCard` embeds and actor shortcode support

Counter editor baseline fields:

- name
- icon
- current value
- optional max value
- description
- live `CounterCard` preview with shared `+` and `-` controls for both current and max values when a max exists

Asset editor baseline fields:

- name
- short summary
- modifier
- noun
- noun description
- adjective description
- icon image frame with dialog-backed image picker
- optional overlay URL
- markdown body with inline `GameCard` embeds
- live custom `AssetCard` preview

Location editor baseline fields:

- name
- short summary
- title image frame with dialog-backed image picker
- markdown introduction
- markdown description
- map image frame with dialog-backed image picker
- interactive map pins linking to locations, actors, encounters, and quests

Encounter editor baseline fields:

- name
- summary
- prerequisites
- title image frame with dialog-backed image picker
- markdown script with inline `GameCard` and block `EncounterCard` embeds

Quest editor baseline fields:

- name
- summary
- title image frame with dialog-backed image picker
- markdown brief with inline `GameCard` and block `QuestCard` embeds

Behavior:

- `/adventure-module/:slug/actors/:entityId` renders a live actor editor with autosave, live layered preview, and actor slug display that regenerates from the saved title.
- `/adventure-module/:slug/counters/:entityId` renders a live counter editor with autosave and shared current/max value controls.
- `/adventure-module/:slug/assets/:entityId` renders a live asset editor with autosave, custom asset fields, a framed icon-image picker that opens the shared image dialog with the current image preselected, migration notice support for legacy layered assets, custom preview, and asset slug display that regenerates from the saved title.
- `/adventure-module/:slug/locations/:entityId` renders a live location editor with autosave, title-image and map-image framed pickers that open the shared image dialog with the current image preselected, markdown introduction/description fields, and an interactive map-pin canvas with hover previews and click-through navigation.
- `/adventure-module/:slug/encounters/:entityId` renders a live encounter editor with autosave, prerequisites, a framed title-image picker that opens the shared image dialog with the current image preselected, and markdown script authoring.
- `/adventure-module/:slug/quests/:entityId` renders a live quest editor with autosave, a framed title-image picker that opens the shared image dialog with the current image preselected, markdown brief authoring, and slug-driven route updates after saves.
- actor, counter, asset, location, encounter, and quest editors all show a shared shortcode row with inline shortcode text and a clipboard copy button
- the shared image dialog uses a depressed `Selected Image URL` field with an inline clear button, a raw-image drop zone that uploads external images to the server, and a selected-image preview directly below the drop zone
- when the selected image comes from the generated-image store, the preview shows muted prompt and model metadata under the image so long prompts stay visible without overwhelming the dialog
- the shared image dialog now uses explicit `Gallery | Generate | Edit` modes: `Gallery` flattens stored fal images newest-first with hoverable prompt/model info and per-image removal, `Generate` keeps the text-to-image prompt flow, and `Edit` sends the selected image plus an edit prompt to fal-only image-edit models

---

### `/campaign/list`

Campaign browsing route for opening campaign detail or jumping straight into session management.

Components:

- page shell via shared layout
- campaign summary cards as primary surfaces
- shared `CTAButton` for the header-level `Create Campaign` handoff back to Adventure Module selection
- shared `SearchField` for the compact depressed search shell
- shared `ResponsiveCardGrid` for the 1/2/3 responsive card layout
- shared `ShortcodeField` reused for the header-level `Copy Author Token` button
- shared `Button`, `Text`, and input primitives for search/actions

Behavior:

- keep one major surface per campaign card
- keep `Create Campaign` in the page header for now, redirecting to `/adventure-module/list` until a direct in-list creation flow replaces it
- reuse the same shared `StoryTileCard` shell as the module list, with visible source-module context and explicit `Open Campaign` plus `View Sessions` actions
- avoid nesting additional framed panels inside campaign cards for metadata rows or action groups
- rely on spacing, hierarchy, and button grouping before adding extra framed chrome
- the campaign grid follows the same one-on-mobile, two-on-tablet, three-on-desktop layout as the module list

---

### `/campaign/:campaignSlug/session/:sessionId`

Campaign session lobby route for role entry.

Components:

- one primary role-entry surface
- shared status/presence block
- `ShareLinkOverlay`
- dev-only mock controls

Behavior:

- treat role choice as one clear moment rather than two competing heavyweight forms
- use one role toggle, one shared name field, and one shared join CTA before branching into player vs storyteller routes
- use lighter layout wrappers inside the main surface instead of framing each sub-block
- express session status in compact pills near the title instead of a separate framed status block
- keep mock controls visually subordinate to the real player/storyteller entry flow

---

### `/campaign/:campaignSlug/session/:sessionId/player`

Player session claim route for campaign-backed human play.

Components:

- pre-play character claim/create surface

Behavior:

- player flow is two-step: claim/create first on this route, transcript second on `/campaign/:campaignSlug/session/:sessionId/player/chat`
- keep the usual page header visible here so claim/create still feels like part of the broader session detail flow
- keep claim/create out of the live transcript surface once the player has entered play
- auto-redirect to `/player/chat` after the local player has successfully claimed or created a character

---

### `/campaign/:campaignSlug/session/:sessionId/player/chat`

Player live-transcript route for campaign-backed human play.

Components:

- transcript surface once a character is claimed
- composer for adding to the transcript

Behavior:

- use `Transcript` as the primary mental model instead of splitting the experience into transcript vs chat
- once a player has claimed a character, let the existing `Claimed ...` transcript message expand into an inline actor card with art, name, and summary rather than duplicating that state in a separate transcript header banner
- avoid adding a second framed panel or redundant `Transcript` title above the player live feed; let the feed and composer sit directly in the page flow
- make this route headerless and footerless so the live transcript can use the full viewport height once play starts
- when the player is in the live transcript state, the route should fill the viewport and give the transcript scroll area the remaining height above the composer instead of capping it to a small fixed panel
- the transcript composer may expose a compact image trigger that opens the shared generate-or-pick modal, appends standard markdown image snippets, and relies on the transcript renderer to display those images inline

---

### `/campaign/:campaignSlug/session/:sessionId/storyteller/:tab`

Storyteller campaign-session route.

Components:

- `CampaignStorytellerSessionShell` as the thin session-mode shell
- campaign shell for shared authoring tabs via `AuthoringProvider`, `SharedAuthoringHeader`, and `CommonAuthoringTabContent`
- dedicated live transcript tab for `chat`
- lighter roster rail/sidebar for live play
- `CampaignSessionsTabContent`
- `CampaignStorytellerSessionTabContent`

Behavior:

- keep storyteller inside the campaign shell overall
- keep realtime session concerns (`useCampaignSession`, chat draft, staged table selection, live selection send/remove actions) inside `CampaignStorytellerSessionShell`, outside the shared authoring reducer
- make the `chat` tab feel like a purpose-built live session surface, not another generic stacked panel page
- reserve heavy framed panels for the primary transcript surface and avoid framing every inner subsection
- keep player and storyteller transcript composers aligned on the same compact image-trigger-plus-modal flow so both roles can share generated images through the same raw-text transcript model
- reuse the same entity editor components as Adventure Module authoring so compact shortcode rows appear in storyteller detail tabs too

---

### `/rules/*`

Reference route family for markdown-authoring-safe Mighty Decks component snippets.

Components:

- `Tabs`
- `GameCardView`
- `AssetCard`
- `CodeCopyRow`

Routes:

- `/rules/outcomes`
- `/rules/effects`
- `/rules/stunts`
- `/rules/assets`

Behavior:

- copy rows use legacy `@type/<slug>` shortcodes because rich-text Adventure Module editors normalize pasted tokens into canonical stored `<GameCard />` embeds
- the assets view is grouped into `Asset Base` and `Asset Medieval` sections
- `/rules/assets` includes a `Modifier` checkbox that reveals modifier selector cards showing only the modifier and applies the selected modifier across every displayed asset preview
- when a modifier is selected on `/rules/assets`, copy rows emit `@asset/<slug>/<modifier-slug>` so pasted shortcodes normalize into canonical asset embeds with `modifierSlug`

---

### `/styleguide`

Hidden internal route for component iteration and design comparison work.

Components:

- `StyleguideIndexPage`
- `StyleguideSectionNav`
- `StyleguideTypographyPage`
- `StyleguideInputsPage`
- `StyleguideButtonsPage`
- `StyleguidePanelPage`
- `StyleguideCardsPage`
- `StyleguideTagsPage`
- `StyleguideControlsPage`
- `StyleguideSessionChatPage`
- `GameCard` (location, encounter, and quest variants, internal)
- `LocationCard` (styleguide-local image treatment)
- `EncounterCard` (styleguide-local image treatment)
- `QuestCard` (styleguide-local image treatment)
- `Tag`
- `Tags`
- `ConnectionStatusPill`
- `ToggleButton`
- `ButtonRadioGroup`
- `RockerSwitch`

Behavior:

- direct-route accessible but intentionally unlinked from the public app flows
- `/styleguide` is now the overview and secondary-nav hub for the styleguide labs
- the overview links to `/styleguide/typography`, `/styleguide/inputs`, `/styleguide/buttons`, `/styleguide/panel`, `/styleguide/cards`, `/styleguide/tags`, `/styleguide/controls`, and `/styleguide/session-chat`
- the cards page is the primary gallery entry point; the detail routes remain direct drill-down pages for internal inspection but are not surfaced in the main styleguide nav

---

### `/styleguide/typography`

Hidden internal overview for typography and sticker-style labels.

Components:

- `StyleguideTypographyPage`
- `Heading`
- `Text`
- `Label`

Behavior:

- showcases the shared `Heading`, `Text`, and `Label` APIs together so contributors can validate hierarchy, colors, and the shared size ladder in one place
- keeps semantic heading usage and sticker/tag usage scoped to a dedicated page
- includes the full `Label` palette and the `Small` / `Medium` / `Large` size ladder so chips can be checked across the same surface
- uses different heading highlight tones so the heading accent can be validated as a variable treatment rather than a single fixed color

---

### `/styleguide/inputs`

Hidden internal overview for input primitives and their aligned action rows.

Components:

- `StyleguideInputsPage`
- `TextField`
- `TextArea`
- `DepressedInput`
- `Button`

Behavior:

- groups the shared input primitives beside matching buttons so contributors can confirm height alignment before they reuse a control in a feature surface
- keeps the standard input shells and depressed input shells in one page for API validation
- treats `DepressedInput` as the inset input style variant and validates button/input rows side by side so adjacent controls can share a height baseline

---

### `/styleguide/buttons`

Hidden internal overview for the shared button family.

Components:

- `StyleguideButtonsPage`
- `Button`
- `CTAButton`

Behavior:

- isolates the standard and high-emphasis button APIs so contributors can compare size and color behavior without the rest of the styleguide chrome
- keeps the button family scoped to one page before it is reused in routes or labs

---

### `/styleguide/panel`

Hidden internal overview for the heavy framed surface.

Components:

- `StyleguidePanelPage`
- `Panel`

Behavior:

- showcases `Panel` as the heavyweight framed surface for major route blocks and summary panels
- keeps framed surfaces separate from the lighter body, field, and chip labs so contributors can judge when a frame is actually warranted

---

### `/styleguide/cards`

Hidden internal overview for the card lab family.

Components:

- `StyleguideCardsPage`
- `StyleguideSectionNav`
- `GameCard` gallery directions for location, encounter, and quest

Behavior:

- groups the supported card directions into one gallery page for scoped contributor work
- keeps the detailed card routes as hidden drill-downs rather than first-class styleguide sections

---

### `/styleguide/tags`

Hidden internal overview for the shared chip family.

Components:

- `StyleguideTagsPage`
- `Tag`
- `Tags`
- `ConnectionStatusPill`

Behavior:

- showcases the shared chip primitive, the editable tag field, and the connection status pill together
- keeps tag-like surfaces together so styling stays consistent across read-only and editable cases
- covers the full sticker/chip palette used in the repo, including `gold`, `fire`, `blood`, `bone`, `steel`, `skin`, `cloth`, `curse`, and `monster`

---

### `/styleguide/controls`

Hidden internal overview for grouped controls and rocker switches.

Components:

- `StyleguideControlsPage`
- `ToggleButton`
- `ButtonRadioGroup`
- `RockerSwitch`

Behavior:

- groups the control lab onto one page so grouped state can be reviewed without unrelated styleguide surfaces
- keeps the toggle, radio, and rocker variants scoped to the same controls page

---

### `/styleguide/session-chat`

Hidden internal overview for the session chat lab family.

Components:

- `StyleguideSessionChatPage`

Behavior:

- groups the full-screen session chat labs behind one landing page
- links to `/styleguide/session-chat-player` and `/styleguide/session-chat-storyteller`

---

### `/styleguide/location-card`

Hidden internal gallery for location-focused `GameCard` exploration.

Components:

- `GameCard` with `type="location"`
- one image-first location card direction rendered from sample data
- local `LocationCard` composition for the framed image plus label overlays

Behavior:

- single-card design preview
- reachable from `/styleguide/cards` and shown with the shared styleguide secondary navigation
- title, `Location` badge, and full-width scene-description strip are owned by `LocationCard`, not `ImageCard`
- the shared scene frame is rendered as horizontal SVG (`viewBox 332x204`) so the same vector card treatment carries into authoring lists, transcript embeds, and session table previews
- no markdown `GameCard` pipeline integration in this slice
- intended for visual iteration before authoring/runtime adoption

---

### `/styleguide/encounter-card`

Hidden internal gallery for encounter-focused card exploration.

Components:

- `GameCard` with `type="encounter"`
- one image-first encounter card direction rendered from sample data
- local `EncounterCard` composition sharing the scene frame with `LocationCard`

Behavior:

- single-card design preview
- reachable from `/styleguide/cards` and shown with the shared styleguide secondary navigation
- title, `Encounter` badge, and full-width scene-description strip are owned by `EncounterCard`
- the shared scene frame is rendered as horizontal SVG (`viewBox 332x204`) so the same vector card treatment carries into authoring lists, transcript embeds, and session table previews
- prerequisites remain in the editor/detail surface rather than on the compact card
- intended for visual iteration before wider authoring/runtime adoption

---

### `/styleguide/quest-card`

Hidden internal gallery for quest-focused card exploration.

Components:

- `GameCard` with `type="quest"`
- one image-first quest card direction rendered from sample data
- local `QuestCard` composition sharing the scene frame with `LocationCard` and `EncounterCard`

Behavior:

- single-card design preview
- reachable from `/styleguide/cards` and shown with the shared styleguide secondary navigation
- title, `Quest` framing, and full-width summary strip are owned by `QuestCard`
- the shared scene frame is rendered as horizontal SVG (`viewBox 332x204`) so the same vector card treatment carries into authoring lists, transcript embeds, and session table previews
- quest graph details remain in authoring/detail surfaces rather than on the compact card
- intended for visual iteration before wider authoring/runtime adoption

---

### `/styleguide/session-chat-player`

Hidden full-screen player-facing session chat mock for testing the new Mighty Decks table layout.

Components:

- shared styleguide `SessionChat` mock shell
- responsive `ButtonRadioGroup` mobile pane switch
- static transcript rail and composer
- player table lanes plus shared center-table section

Behavior:

- desktop renders `Table` left at roughly two-thirds width and `Chat` right at roughly one-third width
- mobile collapses to a single-pane `Chat` state with a visible `Table` / `Chat` switch that stays non-interactive in the styleguide
- reachable from `/styleguide/session-chat`
- player route highlights the current player's lane and shows discard affordances only on that player's own table cards
- milestone 1 focuses on visible table cards only: stunts, effects, assets, and counters

---

### `/styleguide/session-chat-storyteller`

Hidden full-screen storyteller-facing session chat mock for reviewing the same table shell with moderator visibility.

Components:

- shared styleguide `SessionChat` mock shell
- responsive `ButtonRadioGroup` mobile pane switch
- static transcript rail and composer
- player table lanes plus shared center-table section

Behavior:

- desktop renders the same `Table` / `Chat` split as the player mock
- mobile collapses to the same single-pane `Chat` state with a visible non-interactive switch
- reachable from `/styleguide/session-chat`
- storyteller route keeps all lanes equally visible and shows discard affordances on every player and shared table card
- discarded cards render in a faded state so visual cleanup can be reviewed without adding interactivity

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

- `Button` (project variants/sizes; neutral default for standard and grouped actions with the shared `sm`/`md`/`lg` height ladder)
- `ToggleButton` (straight-edged active/inactive option button for grouped controls using the shared `sm`/`md`/`lg` height ladder)
- `RockerSwitch` (tilting active/inactive rocker control with optional tucked-under `Label` and the shared `sm`/`md`/`lg` height ladder)
- `ButtonRadioGroup` (single-select grouped button control built from `ToggleButton` and the shared `sm`/`md`/`lg` height ladder)
- `CTAButton` (shared high-emphasis solo CTA with hover highlight underlay)
- `Section`
- `Panel`
- `Text`
- `Heading` (semantic page/section heading wrapper around `Text`)
- `Label` (sticker/chip shell for badge-like headings, tags, and compact status pills)
- `Message`
- `Tag`
- `ConnectionStatusPill`
- `TextField` (standard single-line field with the shared `sm`/`md`/`lg` size ladder)
- `TextArea` (multiline field with the shared `sm`/`md`/`lg` size ladder)
- `DepressedInput` (depressed shell input with the shared `sm`/`md`/`lg` size ladder)
- `Toggle`
- `Highlight` (decorative text accent; use via `Heading` where possible)
- `ImageBackground` (for image-backed UI blocks)

### Current usage pattern observed in views

Recent routes/components already follow this in many places:

- `WorkflowLabPage` uses `Panel` + `Button` for nearly all surfaced UI blocks/actions
- `ImageGenerator` uses `Section`/`Panel` + `Heading`/`Text` + `Button`
- `AdventureHeader`, `NarratedSceneCard`, `GenericVotePanel`, `ReadyGatePanel`, `TranscriptFeed` rely on shared primitives instead of one-off shells
- `/styleguide` now includes focused typography, inputs, buttons, cards, tags, controls, and session-chat labs so contributors can validate one API family at a time
- the shared `Button`, `TextField`, `TextArea`, `DepressedInput`, `ToggleButton`, `RockerSwitch`, and `ButtonRadioGroup` shells all use the common `sm`/`md`/`lg` size ladder so adjacent controls can match height

New views should follow these patterns by default rather than introducing custom framed boxes or custom typography wrappers.

---

## Summary

The MVP UI is intentionally small:

- One route per role
- One scene presentation pattern
- One action input pattern
- One voting pattern

This keeps cognitive load low and makes it easier to judge whether the **storytelling itself is compelling**, which is the core risk this MVP is meant to test.

