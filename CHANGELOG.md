# Changelog

All notable changes to this repository are documented in this file.

This changelog tracks the current repository baseline and ongoing unreleased work.

## [Unreleased]

### Changed

- Repo: keep the `Exiles of the Hungry Void` campaign bundle under `apps/server/output/campaigns/am-mnc41bwp4karwa` trackable in Git by carving it out of the broad `output/` ignore rule.
- Repo: keep the `Exiles of the Hungry Void` adventure module bundle under `apps/server/output/adventure-modules/am-mo18tx38tgy2q1` trackable in Git by carving it out of the broad `output/` ignore rule.

### Added

- Web: add a dedicated `/styleguide/loading` lab that showcases the shared `LoadingIndicator` progress ring and `PendingIndicator` dot state, and surface it from the styleguide overview and section nav.
- Web: add dedicated `/styleguide/labels` and `/styleguide/messages` styleguide labs, and surface both from the shared secondary nav and router so contributors can validate sticker labels and semantic callouts in isolation.

### Changed

- Web: replace the app's plain loading copy with shared `PendingIndicator` dot states for loading panels and action buttons, while keeping the quantified progress ring in the styleguide loading lab.
- Web: tighten the shared scene-card frame so long location, encounter, and quest text gets more padding and clamps earlier with a visible ellipsis instead of crowding the border.
- Web: replace the `/styleguide` overview component grid with a design reference hub covering design principles, the full semantic color-family ledger as swatches with hex values, shared-component rules, and component use cases.
- Web: keep solid iron buttons on steel borders while iron ghost buttons retain iron borders, matching the shared button family split in the styleguide.
- Web: animate the styleguide loading rings from 0 to 100 over 4 seconds on page load, while respecting reduced-motion users by snapping straight to the final state.
- Web: rework the styleguide loading ring so the percentage is smaller, the color label sits below the ring, and the progress arc can use any standard token color with an iron track that falls back to bone for iron.
- Web: render the styleguide loading ring's 100% state as a true full circle so completion no longer looks half filled.
- Web: make the shared Adventure Module image pickers fit previews with `object-contain` so title, location, encounter, quest, and asset art are shown in full instead of cropped.
- Web: remove brittle visual class-name assertions from shared input, layout, and styleguide tests in favor of behavior-focused coverage.
- Web: bottom-align the styleguide `TextArea` buttons with the textarea control so the row reads cleanly.
- Refresh the shared image dialog into explicit `Gallery`, `Generate`, and `Edit` modes with the selected preview below the drop zone, muted prompt/model metadata, smaller labeled model selects, gallery info/remove controls, and fal-only image edit generation from the currently selected image.
- Web: retire the old inset input in favor of shared `TextField` and `TextArea` defaults, then update the styleguide inputs lab and every call site to use the new primitives.
- Web: move the shared `SearchField` width constraint onto the shell so the adventure authoring and list-page search bars no longer stretch a blank row beside the input.
- Web: lighten the shared `Button` circle variant with a smaller shadow, a gentler hover press, and better icon centering so compact actions feel less heavy.
- Web: replace the Adventure Module title, location, encounter, and quest inline image generator blocks with framed image pickers that open the shared generate-or-pick dialog from a top-right trigger button.
- Web: in the shared generate-or-pick image dialog, replace the selected image URL text field with a `TextField` plus inline trash clear button, and add drag-and-drop raw image upload that saves external images on the server.
- Web: add raw-image selection mode to the shared image dialog so image fields can reuse the same modal without inserting markdown.
- Narrow the Adventure Module, Campaign, and authoring entity list search bars into a shared compact `TextField` search field, and normalize their card grids to a mobile 1-column, tablet 2-column, desktop 3-column layout.
- Replace the empty counters panel shell with a neutral `Message` state so the "no counters yet" view feels lighter and less framed.
- Standardize `Label`, `Heading`, `Button`, `TextField`, `TextArea`, `ToggleButton`, `RockerSwitch`, and `ButtonRadioGroup` around shared `size`/`color` naming and aligned heights so adjacent controls line up cleanly.
- Split `/styleguide` into typography, inputs, buttons, cards, tags, controls, and session-chat labs with a shared secondary nav.
- Add a dedicated `/styleguide/panel` lab, collapse the cards entry into a single gallery page, and expand the typography/tag color coverage to include the missing sticker and chip tones.
- Tighten the inputs lab so button rows stay aligned with the shared field height ladder and frame `TextField`/`TextArea` as the shared default input variants.
- Clarify contributor guidance so style-only changes do not need brittle class-name or DOM-structure tests; prefer manual or visual verification unless behavior or contracts change.
- Rework the hidden `/styleguide` playground into an overview plus scoped `Cards`, `Tags`, `Controls`, and `Session Chat` pages with a shared secondary nav.

### Fixed

- Web: thread resolved locations through Adventure Module authoring, campaign storyteller sessions, and campaign player sessions so shared location cards stay available alongside the other authored content.
- Web: tighten the shared styleguide location-card lab wording to describe it as a hidden internal style reference hub.
- Web: make location, encounter, and quest markdown embeds selectable and inline-flow friendly in the MDX editor, and add canonical `LocationCard` shortcode normalization plus toolbar insertion for location-authored markdown fields.
- Web: add a circular detail-link overlay to location, encounter, quest, actor, counter, and custom asset authoring cards so authors can open the matching detail route in a new tab without losing node-selection delete behavior, while leaving default assets and other static cards link-free.
- Make `Tag` the reusable chip shell for read-only labels, editable tag rows, and connection status pills.
- Tighten the Exiles legacy importer so it promotes curated actor and asset cards, copies imported stills into `AdventureArtifactStore`, and rewrites named markdown references to canonical `GameCard` embeds.
- Refactor Adventure Module and Campaign authoring so the route files are thin shells over a shared context-plus-reducer authoring store with extracted screen/session shells, shared autosave orchestration, and optimistic edit saves.
- Add a `Create Campaign` handoff CTA to the campaign list header, and add shared `Copy Author Token` header actions to both the campaign and adventure module list pages using the generalized `ShortcodeField` clipboard control.
- Switch the repo-local Exiles import and module/campaign authoring CLIs to machine-readable JSON stdout envelopes so external agents can discover context, read schemas, and apply structured edits without scraping human-oriented terminal text.
- Web: made campaign and adventure module list tiles open from the full item surface and removed duplicate in-card action buttons.
- Remove the redundant helper instructions above shared actor, counter, asset, location, encounter, and quest authoring lists so module and campaign authoring open directly into the create action plus searchable grid.

### Docs

- Document the new styleguide labs, shared primitive API conventions, and root class-name naming rule in the UI component and contributor docs.

### Added

- Add JSON-first repo-local authoring CLIs for persisted `Adventure Module` and `Campaign` content, including discovery commands (`capabilities`, `schema`, `catalog`), full CRUD for actors/counters/assets/locations/encounters/quests, and a repo-local `adventure-authoring-cli` skill with `agents/openai.yaml` discovery metadata.
- Add a `pnpm -C apps/server smoke:campaign-flow` integration smoke test that can run locally or against a live Render deployment, covering Adventure Module creation, authored actor/counter/asset/location/encounter/quest creation, campaign creation, session creation, player/storyteller joins, and cleanup.
- Add repo-local Adventure Module automation for Exiles porting: `pnpm -C apps/server import:adventure-module` imports legacy Exiles MDX into the typed Adventure Module store, and `pnpm -C apps/server author:module -- add-actor ...` uses a new `adventure_module_actor_from_prompt` workflow to generate typed actors from prompt text.
- Add shared `ToggleButton` and `ButtonRadioGroup` primitives for straight-edged grouped option controls, with active/inactive states, six material color variants, and `s|m|l` sizing.
- Add a shared `RockerSwitch` primitive for perspective-tilted binary controls with accent-lit active state and an optional tucked-under `Label` tag.
- Add configurable AI text provider (`AI_TEXT_PROVIDER` env var) supporting `openrouter` (default, API-based) and `claude_cli` (local CLI). Set `AI_TEXT_PROVIDER=claude_cli` in `.env.local` to use Claude CLI for all text completions without an API key. New env vars: `CLAUDE_CLI_MODEL`, `CLAUDE_CLI_MAX_CONCURRENT`.
- Extract `TextCompletionClient` interface from `OpenRouterClient` to allow pluggable text providers across the storyteller pipeline.
- Add a persisted `Campaigns` domain backed by shared campaign/session contracts, REST routes, campaign list/detail pages, module-to-campaign creation flows, and campaign detail tabs that mirror Adventure Module authoring plus `Sessions`.
- Add human-storyteller campaign sessions with neutral lobby routes, player claim/create-PC flow, storyteller campaign shell reuse with a `Chat` tab, session transcripts, explicit dev-only mock participants, and route-level live refresh via campaign watch broadcasts.
- Add server-authoritative campaign session table state with typed table card references, storyteller add/remove table socket events, player own-lane remove permissions, and shared session-state rebroadcasts.
- Add live storyteller table selection workflows in session mode, including `+` actions on shortcode/list surfaces, session-mode rules tabs (`Outcomes`, `Effects`, `Stunts`, `Static Assets`), and lane/shared `Send Cards` actions that place staged cards onto the live table.
- Add server-authoritative outcome decks, hands, and discard piles to campaign sessions, with shared `spec` contracts, 12-card per-player seeding, draw/shuffle/play socket events, and inline chat logging for played outcome cards.

- Add typed Adventure Module actor authoring with create/edit APIs, resolved actor detail payloads, layered actor-card metadata, and legacy-module backfill for missing actor card records.
- Add layered ActorCard rendering, actor list authoring UI, actor editor UI, and actor shortcode copy support in the Adventure Module authoring flow.
- Add typed Adventure Module counter authoring with create/edit APIs, resolved counter detail payloads, vendored counter icon assets, and shared authoring-side counter values.
- Add typed Adventure Module asset authoring with create/edit/delete APIs, resolved asset detail payloads, filtered base/medieval asset catalogs, and vendored asset images for authored AssetCards.
- Add typed Adventure Module location authoring with create/edit/delete APIs, resolved location detail payloads, `locationDetails` metadata, interactive map pins, and legacy-module backfill for missing location metadata.
- Add typed Adventure Module encounter authoring with create/edit/delete APIs, resolved encounter detail payloads, `encounterDetails` metadata, and legacy-module backfill for missing encounter metadata.
- Add typed Adventure Module quest authoring with create/edit/delete APIs, resolved quest detail payloads, `questDetails` metadata, legacy-module backfill, and automatic starter quest-graph seeding plus delete cleanup.
- Add Adventure Module Locations tab and editor UI with title-image and map-image generation/paste flows, introduction/description markdown authoring, hover previews, and click-through map pins for locations, actors, encounters, and quests.
- Add Adventure Module Encounters tab and editor UI with prerequisites, title-image generation/paste flows, encounter markdown authoring, canonical `<EncounterCard slug="..." />` embeds, and encounter card previews in rich text.
- Add Adventure Module Quests tab and editor UI with title-image generation/paste flows, quest markdown authoring, canonical `<QuestCard slug="..." />` embeds, and a reusable `QuestCard` styleguide direction.
- Add hidden `/styleguide/session-chat-player` and `/styleguide/session-chat-storyteller` labs with responsive session-chat table mocks for reviewing desktop split layouts, collapsed mobile chat state, and role-specific discard affordances before wiring live rules UI.

### Changed

- Replace the Adventure Module and campaign authoring list copy buttons with a shared compact `ShortcodeField` row, and switch the copy glyph from `C` to `📋`.
- Restyle the campaign list cards into a cover-art-led story tile with live-status badges, compact metadata tags, and a fluid auto-fit grid so single campaigns no longer feel stranded on the page.
- Move the campaign card pills into the hero corners, add a dedicated `Campaign` badge, and swap the card's `Open Campaign` action back to a plain primary solid button.
- Split the shared button language into neutral solid buttons and highlighted CTA buttons, then move the standalone module actions onto the CTA treatment.
- Collapse Adventure Module tab navigation into a single header dropdown on tablet/mobile so the authoring page no longer renders a standalone duplicate section control beside the tab rail.
- Lower the Adventure Module tab rail collapse breakpoint so the full tabs show sooner, and keep the small-screen control as a labeled dropdown with a larger rotating caret and ghost-style menu items.
- Move the Adventure Module `Create Campaign` CTA onto the desktop title row while keeping the tablet/mobile version beside the collapsed section dropdown.
- Move the campaign-detail `Create Session` action onto the desktop title row with the same highlighted CTA treatment as `Create Campaign`, while keeping the tablet/mobile version beside the collapsed section dropdown.
- Tighten the Adventure Module and Campaign authoring headers so the editable title field shrinks to a five-character minimum, the URI is removed, and the overall title treatment reads smaller and more compact.
- Keep the Adventure Module and Campaign autosave badge pinned below the editable title in all header states instead of moving it between the title row and the section nav.
- Remove slug IDs from the Adventure Module markdown insert dropdown labels so the toolbar stays more compact.
- Unify Adventure Module and Campaign list pages around a shared cover-led story tile shell with explicit in-card buttons, visible module author/tag metadata, and visible campaign source-module context.
- Keep the Adventure Module markdown item picker for custom cards, encounters, quests, and custom assets on the native browser `<select>` so it is not clipped by the editor shell, expose the selected/item slug through the native `title` tooltip, and let the insert controls wrap cleanly on narrow screens instead of forcing horizontal clipping.
- Extract the shared module/campaign authoring shell into reusable authoring helpers, a shared header, a shared common-tab renderer, and campaign-only session tab components so the route files stay smaller without changing autosave or entity workflows.
- Add true delete endpoints for Adventure Modules, Campaigns, and Campaign Sessions so smoke tests and live-environment cleanup can remove created records.
- Keep the campaign-session outcome action icon-only, but update its accessible label and title to `Play an Outcome card`.
- Center the global route loading fallback, restyle `Loading...` as a `Label`, and place the existing pending indicator above it.
- Center the campaign session table outcome hand on a width that scales with card count, and double the horizontal spacing between the hand and the deck/discard piles while keeping the gentler vertical arc.
- Raise hovered outcome hand cards above neighboring fan cards so every card in the player hand stays readable in the chat session view.
- Apply the same hovered stacking fix to the campaign session player table hand, widen the fan spacing, and make the hand responsive so the live route fits without internal scrollbars or clipping.

- Rebuild the shared `OutcomeCard` back face as a minimal inline SVG that uses the repo's `card-backface` texture plus the outcome type icon, and move the label below the ornament in the very-light green monster-lightest tone to better match the original backface treatment.
- Adjust campaign-session outcome piles so live hands use a stronger overlapping fan, pile captions are removed, and played-card transcript entries render their cards on a dedicated line below the `played:` text.
- Split campaign player session routes so `/campaign/.../player` stays on the usual page shell for claim/create while `/campaign/.../player/chat` becomes the headerless live transcript surface.
- Reused the compact shortcode copy component across the Rules asset, effect, stunt, and outcome reference pages so shortcode copying matches Adventure Module and storyteller detail views.

- Extend the hidden `/styleguide` index with a grouped-control lab covering the new toggle and radio-button primitives across active state, palette, and size comparisons.
- Fold the approved grouped-button direction into the shared component set and keep the final example only in the root `/styleguide`.
- Extend the hidden `/styleguide` grouped-controls lab to include the new `RockerSwitch` direction alongside the existing flat toggle controls.
- Collapse the primary nav into a burger menu on mobile breakpoints while keeping the full comic-button row on wider screens.
- Promote the approved A1 grouped-control direction into the shared `ButtonRadioGroup`/tab rail styling, and replace module, campaign, rules, and campaign-session seat switchers with the new capped radio-group treatment.
- Rename the standalone image tooling route from `/image` to `/image-lab`, flatten the Image Lab surface headings, convert select captions to shared `Label` stickers, replace the cache checkbox with a toggle button, and tighten the form widths so the generator controls stay on fewer lines at larger breakpoints.
- Switch the zero-config local server default from port `8080` to `8081` and align the web client's split-dev fallback with the same port.
- Build the shared `spec/` workspace to JavaScript plus declaration files, update package exports to built output, and start the server from compiled JS instead of `tsx` in production.
- Narrow Render installs to the deploy-relevant workspaces and remove the accidental root `playwright` dependency from the deploy path.
- Replace the primary nav's hue-rotated shared button background with explicit comic panel background assets per route, covering the new grey, curse, cloth, gold, and monster button variants.
- Retune the primary nav art assignment so Home uses `monster`, Modules `gold`, Campaigns `fire`, Rules `cloth`, Image Lab `curse`, and Workflow `grey`.
- Extend Adventure Module actor authoring with a `Player Character` flag so authored actors can seed campaign-time claimable PCs.
- Derive web asset card titles from the shared `spec` asset catalog so built-in asset names have one source of truth across shared contracts and the UI.
- Lazy-load top-level web routes and scope the MDX editor stylesheet to the authoring flow to reduce the initial client bundle.
- Render Adventure Module authoring GameCards inline in MDX rich text, normalize legacy shortcode tokens to canonical `<GameCard />` source, and remove the separate markdown preview panel.
- Remove the Adventure Module markdown editor content frame so rich text and source content blend into the page background while the toolbar keeps the only surface treatment.
- Extend Adventure Module markdown normalization, toolbar insert options, and rich-text rendering so module-local actors render as canonical `<GameCard type="ActorCard" />` embeds while `@actor/<slug>` remains supported.
- Extend Adventure Module markdown normalization, toolbar insert options, and rich-text rendering so module-local counters render as canonical `<GameCard type="CounterCard" />` embeds while `@counter/<slug>` remains supported.
- Extend Adventure Module markdown normalization, toolbar insert options, and rich-text rendering so module-local assets render as canonical `<GameCard type="AssetCard" />` embeds while `@asset/<slug>` remains supported.
- Extend Adventure Module markdown authoring so module-local encounters insert as canonical `<EncounterCard slug="..." />` embeds and render as encounter cards in Rich Text mode.
- Extend Adventure Module markdown authoring so module-local quests insert as canonical `<QuestCard slug="..." />` embeds, `@quest/<slug>` shortcodes normalize automatically, and quest embeds render across module authoring surfaces.
- Extend Adventure Module markdown normalization so manual `@encounter/<slug>` shortcodes resolve to canonical `EncounterCard` source, and switch the encounters list to shortcode-first copy text for consistency with the other entity tabs.
- Split Adventure Module markdown asset insertion into `Generic Asset` and `Custom Asset`, carry optional `modifierSlug` through canonical `<GameCard type="AssetCard" />` embeds, and convert module-authored assets to custom card metadata instead of layered base/modifier selections.
- Add typed actor and counter delete support in Adventure Module authoring, including list/editor delete actions and invalid-card fallback for stale embeds.
- Move the Adventure Module `Assets` tab after `Counters` and replace the placeholder with searchable AssetCard authoring plus grouped `Asset Base` and `Asset Medieval` pickers.
- Switch the `/rules` reference pages to copy `@type/<slug>` shortcodes instead of raw `<GameCard />` JSX, add `/rules/assets`, accept underscore-based asset shortcodes in rich-text markdown normalization, and let `/rules/assets` apply a selected modifier to every preview and copied shortcode.
- Extend Base-tab generated-image lookup so the authoring UI can restore persisted title images by file name, show same-prompt matches from other models, and browse all stored provider images when no prompt is present.
- Refresh the styleguide `LocationCard` to include a visible `Location` badge and full-width summary strip, align the new `EncounterCard` to the same shared frame with a distinct `Encounter` badge, and add `/styleguide/encounter-card`.
- Standardize the location and encounter authoring lists around wrapped horizontal scene cards, use the location summary as the card footer text, stop repeating card summaries below the frame, and rename the encounter editor field from `Short Description` to `Summary`.
- Refresh campaign-session UX toward the polished Adventure flow: lighter role-entry lobby, transcript-first player/storyteller session copy, a focused player claim step before live play, and a cleaner storyteller live transcript tab inside the campaign shell.
- Merge the campaign-session lobby join flow into one role-toggle form, extract reusable `CTAButton` and `ConnectionStatusPill` primitives from the Adventure-inspired UI language, and surface session/presence state as compact pills instead of separate framed status blocks.
- Render supported shortcode cards inline inside campaign session transcripts so players and storytellers can paste multiple component shortcodes into one shared message.
- Tighten storyteller session chrome so the header uses a smaller read-only campaign title, keeps `Close Session` on the same row, hides the slug subtitle, and lets the live session surface span the full viewport width.
- Move the storyteller-session `Chat` tab to the first position in the live Session navigation so the transcript view is the default leading action.
- Reuse the Adventure transcript wrapper and a shared session-entry presenter across player and storyteller session chat so Session transcript styling, fade masking, and known participant event labels/colors stay consistent.
- Restyle the player and storyteller Session transcript composers to use the same depressed message-input treatment as the Adventure action composer, while keeping the Session-specific send actions intact.
- Extend Adventure Module markdown editors and human-session transcript composers with a reusable image button plus modal backed by the existing generated-image UI, and render `![alt](url)` images inline inside shared session transcript messages.
- Align Session chat composers more closely with the Adventure action field by renaming the draft label to `Message`, switching the action button to `Send`, supporting Enter-to-send with Shift+Enter for newlines, and moving storyteller `End Session` into the lower-left composer row.
- Remove the player session page-shell header/title chrome for more transcript room, and restyle storyteller live-session navigation so the home-link logo sits before the tab rail, the autosave badge follows it, and tablet/mobile collapse the tab buttons into a labeled dropdown.
- Reduce the vertical shell padding on player and storyteller live-session chat routes so more of the viewport is available to the transcript and composer.
- Restyle the campaign authoring `Sessions` list items to use the shared `Message` framing so archived/live session rows match the broader campaign shell language.
- Extend the shared `Button` component with `href` support and switch the campaign `Sessions` list actions to real links so lobby and storyteller views can be opened in separate browser tabs.
- Refine the campaign `Sessions` list rows with a created-date line, a shared `Status` pill, a single right-aligned primary `Join` action, and the removal of the separate storyteller-view link.
- Add a shared detail-page shortcode copy row across Adventure Module entity editors and the reused campaign storyteller detail tabs, so shortcode copy is available outside the list views too.
- Simplify the shared detail-page shortcode copy row down to the shortcode plus an icon button, with click feedback that swaps from copy to checkmark for two seconds before resetting.
- Reposition the shared detail-page shortcode row under the left-side preview area and tighten its styling so the shortcode and copy icon sit centered together with darker, bolder shortcode text.
- Remove the extra player-session transcript panel chrome so the existing `Claimed ...` session entry now renders the actor card inline inside the transcript feed and the live view no longer repeats a `Transcript` title.
- Let the player session route use the full viewport in live play so the transcript feed expands into the available height and the message composer stays visible beneath it.
- Replace live session chat-only surfaces with a responsive `Table + Chat` layout for storyteller and player chat routes, including mobile `Table / Chat` switching and compact stacked duplicate-card presentation on the table lanes.
- Tune the live storyteller `Chat` tab shell so `/storyteller/chat` uses fit-screen sizing with independently scrollable `Table` and `Chat` panes, and keep table-card removals visually staged with a short fade-out before removal.
- Render per-player outcome deck/hand/discard lanes inside the shared campaign session table, with face-up current-player hands, back-face remote hands/decks, fixed discard rotations, and a `Play an Outcome card` action that moves selected cards to discard.
- Refine storyteller session card staging UX by hiding the `Selection` strip when empty, replacing staged-count copy with an inline `(i)` hover/click hint, and reordering session tab navigation so `Outcomes/Effects/Stunts` appear before `Actors` and `Static Assets` appears before `Custom Assets`.
- Rebuild shared `LocationCard`, `EncounterCard`, and `QuestCard` scene visuals as horizontal SVG cards (`332x204` viewBox, matching portrait card dimensions swapped to landscape) so styleguide, authoring lists, markdown embeds, transcript renders, and table previews all share the same vector frame treatment.

### Fixed

- Web: retune the pending-dot palette so steel reads as steel, skin no longer borrows bone, and the blood, cloth, and fire dots stay bright enough to read at small sizes.
- Web: fix overflowing Adventure Module theme pills so long labels truncate with an ellipsis instead of clipping mid-word.
- Web: fix the shared generated-image picker so the trash clear button renders correctly, preview and gallery images fit instead of crop, model labels stay compact, action buttons align to the right, and gallery overlays can sit above the card boundary.
- Web: add route-shell, section, and card error boundaries so broken routes, panels, and `GameCard` / `GameCardView` surfaces fail locally instead of blanking the whole app.
- Web: prepopulate the shared generate-or-pick image dialog with the current image URL when it opens from an Adventure Module image picker, so saved title, map, encounter, quest, and asset images stay selected instead of reopening on a blank draft.
- Web: add the framed generated-image picker to Adventure Module custom asset icon editing so the old plain `Icon URL` text field now opens the same dialog-backed image flow as the other entity image fields.
- Raise the editable tag dropdown above the next panel frame on the styleguide tags page.
- Normalize shared rules-card text decoding so the `/rules/outcomes`, `/rules/effects`, and `/rules/stunts` pages no longer render mojibake or replacement characters in card copy.
- Keep Adventure Module location, encounter, and quest scene-card list panels at a consistent authored width so long prerequisites, summaries, and shortcodes wrap inside the panel instead of stretching it wider.
- Wrap long authored `LocationCard` footer summaries earlier so the handwritten location text stays inside the horizontal scene-card frame.
- Lower the Adventure Module markdown-field label, tag row, and description-hint stacking so they no longer sit above the generated-image modal when it opens over an editor.
- Raise the Adventure Module mobile section dropdown above markdown editor context tags so the open menu is no longer covered by tag chips on narrow layouts.
- Remove the duplicate standalone section menu from non-session campaign detail routes so desktop shows only the full tab rail, while tablet/mobile use the shared header dropdown collapse.
- Split the `EntityList` authoring surface into its own lazy-loaded chunk so the campaign and adventure-module authoring pages stop pulling it into the main route bundle.
- Move storyteller live-session routes onto the same headerless shell as the player session route so the global site header no longer steals vertical space above session chat.
- Align Session chat keyboard submission with the shared Adventure action composer so only plain Enter sends, while Shift+Enter and other modifier-enter combinations stay available for multiline editing.
- Resolve the built web client path relative to the server module location so Render's plain-Node startup still serves the frontend from the single service root.
- Proxy local Vite `/api`, `/adventures`, `/health`, and `/socket.io` traffic through the web origin so Adventure Module list/create flows still work when the backend `PORT` is overridden in root `.env.local`.
- Regenerate Adventure Module actor and counter slugs from saved titles, keep the authoring route in sync after renames, and allow actor/counter deletes to complete without sending an empty JSON body.
- Tighten Counter editor numeric fields and move CounterCard +/- controls inline before the shared value so authoring cards keep the header on a single line.
- Add a second inline `+` and `-` control pair after the max counter value so authoring cards can adjust both current and max values without leaving the card.
- Return `coverImageUrl` in Adventure Module detail payloads so Base-tab title image selection survives tab switches and remounts.
- Stabilize campaign session realtime joins so storyteller live-session routes stop re-emitting join events on rerender, stale session errors clear after fresh session state, and player character claim/create waits for confirmed session membership.
- Return full `CampaignDetail` payloads from campaign edit routes so session-side actor and other campaign entity saves no longer fail client-side validation after successful server updates.
- Give the desktop Workflow Lab nav button extra width so its longer label fits cleanly at the shell's widest breakpoint.
- Keep the reusable markdown-image modal header/footer fixed while a padded inner body scrolls, so tall generate-or-pick content stays reachable without label clipping or horizontal overflow.
- Fix storyteller session mobile tab navigation so it stays collapsed by default instead of rendering permanently open, and size landscape table cards (`Location`, `Encounter`, `Quest`) with a wider half-scale slot instead of forcing the same portrait width as other card types.
- Polish landscape scene-card framing by moving the top-right icon deeper into the corner overlay, making title chips and bottom description strips hug their text more tightly, and replacing the box-shadow artifact with a shifted rounded shadow rectangle behind the card.
- Refine landscape scene-card title styling by removing the title-chip border and using lighter hue-matched label text colors over the dark translucent title gradient.
- Apply the title gradient as a true top-left corner overlay of the full landscape card surface (instead of a text-frame fill), while keeping the title text layered above it.
- Move the selection chip remove button into the flex flow so long labels no longer overlap the click target.
- Hide the Asset Cards heading and asset shortcode guidance in the storyteller session static-assets tab while keeping the standalone rules page copy intact.

### Docs

- Document the new panel lab, cards gallery shape, expanded typography/tag palette, and input/button alignment guidance in the UI component and style-system docs.
- Update the UI component docs to describe the thin authoring-route shells, shared `AuthoringProvider` store, and extracted storyteller session shell used by module and campaign authoring.
- Tighten the CLI authoring docs and repo-local authoring skill guidance to prefer `--input-file` or stdin for non-trivial payloads, explain creator-token recovery from browser localStorage, and clarify how to parse the JSON envelope when shell wrappers add extra text.
- Add CLI authoring docs for external agents, and update the Adventure Module, Campaign, and README docs to point to the new JSON-first module/campaign authoring commands and repo-local discovery skill.
- Update the UI component docs to describe compact shortcode rows instead of text-based copy buttons in Adventure Module and campaign authoring lists.
- Update the Adventure Module spec and authoring-flow docs to document repo-local Exiles imports, prompt-driven actor authoring, text-first legacy normalization, and `AdventureArtifactStore` image handling for imported stills.
- Update the Adventure Module authoring-flow and CLI docs to describe the curated Exiles import path, imported stills, and canonical `GameCard` rewrites for named actors and assets.
- Update the campaign-session route and UI docs to document the headered player claim route plus the headerless `/player/chat` live transcript route.
- Update the campaign-session and event/state docs to describe per-player outcome piles, draw/shuffle/play session events, and the new chat logging format for played outcome cards.
- Update the shared UI and style-system docs to document the new grouped toggle/radio button primitives and their non-tilted alignment rules.
- Add the root changelog to track notable product, workflow, deployment, and documentation updates.
- Add AI contributor instructions in `AGENTS.md` requiring documentation and changelog updates when repo behavior, contracts, routes, env vars, or deployment guidance change.
- Add a root `README.md` covering the current repo overview, implementation status, setup, AI configuration, contribution expectations, and deployment paths.
- Add a concise contributor style guide, add a root `CLAUDE.md`, and link shared conventions from `AGENTS.md`.
- Update Adventure Module authoring docs to reflect the implemented Actors tab, actor editor route, typed actor APIs, and actor embed behavior.
- Update Adventure Module authoring docs to reflect the implemented Counters tab, typed counter APIs, and typed actor/counter delete routes.
- Update Adventure Module docs to reflect typed asset authoring, AssetCard embeds, and the implemented Assets tab/editor flow.
- Update Adventure Module docs to reflect custom module assets, generic-vs-custom markdown insertion, and legacy asset reauthoring requirements.
- Update Adventure Module docs to reflect the full current authoring entity catalog, typed encounter authoring, encounter embeds, refreshed location-vs-encounter card direction, and the new `/styleguide/encounter-card` route.
- Update Adventure Module docs to reflect typed quest authoring, `QuestCard` embeds, the real Quests tab/editor flow, and the new `/styleguide/quest-card` route.
- Update the route and UI docs for the new `/rules/assets` reference page, the shortcode-first copy behavior used by the rules reference pages, and the optional modifier-bearing asset shortcode format.
- Update Adventure Module authoring docs to reflect Base-tab cover-image persistence and the expanded generated-image lookup behavior added on March 27, 2026.
- Add campaign and human-storyteller session docs, update route/architecture/event docs for the new `/campaign/...` surface, and document the module-side `Create Campaign` handoff plus mock-participant testing flow.
- Update UI/style and campaign-session docs to formalize Adventure-derived transcript-first campaign/session guidance and explicitly discourage overusing framed panels on live session surfaces.
- Update the component/style docs and hidden styleguide to document the shared CTA highlight button and reusable connection-status pill patterns.
- Update campaign session docs to note that supported component shortcodes now render inline inside shared transcript messages.
- Update the authoring, UI, event-model, and campaign-session docs to describe the reusable image button-plus-modal flow in MDX editors and session composers, plus inline markdown image rendering inside session transcripts.
- Update Adventure Module authoring docs to describe the responsive header dropdown that now replaces the standalone collapsed section menu on tablet/mobile widths.
- Update the Adventure Module, Campaign, and shared UI docs to describe the unified story-tile cards, the two-line markdown item picker, and the extracted shared authoring foundation.

## [0.1.0] - 2026-03-13

### Added

- A single React PWA in `apps/web` with routes for adventure runtime, adventure-module authoring, workflow lab, image tooling, and rules reference pages.
- A Fastify and Socket.IO server in `apps/server` with authoritative adventure state, AI orchestration, realtime presence, image routes, workflow lab routes, and adventure-module routes.
- Shared TypeScript contracts in `spec/` for events, adventure state, image generation, workflow lab, and adventure-module data.
- An AI storyteller runtime with server-driven phases (`lobby`, `vote`, `play`, `ending`), pitch voting, transcripts, thinking indicators, async scene images, runtime config controls, and latency metrics.
- Adventure Module authoring docs and UI covering module list, module creation, base/player/storyteller info authoring, and placeholder entity tabs.
- Local-first project documentation for MVP scope, architecture, events/state, deployment, UX system guidance, and module-authoring flows.

### Changed

- Render deployment is configured as a single-service setup that builds the web client and serves it from the Node process.
- AI model selection and timeout/retry settings are environment-driven so playtest tuning can happen without code changes.
- Image generation support includes OpenRouter defaults plus optional FAL and Leonardo integrations for asset generation and workflow tooling.

### Notes

- Mighty Decks runtime rules and components are not fully implemented. The current runtime is centered on AI storyteller play loops and partial outcome-card related tooling.
- Running an Adventure Module as a guided session with a human or AI storyteller is planned but not implemented end-to-end.
