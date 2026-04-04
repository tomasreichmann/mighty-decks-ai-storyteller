# Changelog

All notable changes to this repository are documented in this file.

This changelog tracks the current repository baseline and ongoing unreleased work.

## [Unreleased]

### Added

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
- Remove the player session page-shell header/title chrome for more transcript room, and restyle storyteller live-session navigation so the home-link logo sits before the tab rail, the autosave badge follows it, and tablet/mobile collapse the tab buttons into a burger menu.
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
- Render per-player outcome deck/hand/discard lanes inside the shared campaign session table, with face-up current-player hands, back-face remote hands/decks, fixed discard rotations, and a `Play Character` action that moves selected cards to discard.
- Refine storyteller session card staging UX by hiding the `Selection` strip when empty, replacing staged-count copy with an inline `(i)` hover/click hint, and reordering session tab navigation so `Outcomes/Effects/Stunts` appear before `Actors` and `Static Assets` appears before `Custom Assets`.
- Rebuild shared `LocationCard`, `EncounterCard`, and `QuestCard` scene visuals as horizontal SVG cards (`332x204` viewBox, matching portrait card dimensions swapped to landscape) so styleguide, authoring lists, markdown embeds, transcript renders, and table previews all share the same vector frame treatment.

### Fixed

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
- Remove circular `X` button shadows on table/selection card controls so the remove affordance no longer visually overlaps nearby card title text.

### Docs

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
