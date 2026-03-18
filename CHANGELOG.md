# Changelog

All notable changes to this repository are documented in this file.

This changelog tracks the current repository baseline and ongoing unreleased work.

## [Unreleased]

### Added

- Add configurable AI text provider (`AI_TEXT_PROVIDER` env var) supporting `openrouter` (default, API-based) and `claude_cli` (local CLI). Set `AI_TEXT_PROVIDER=claude_cli` in `.env.local` to use Claude CLI for all text completions without an API key. New env vars: `CLAUDE_CLI_MODEL`, `CLAUDE_CLI_MAX_CONCURRENT`.
- Extract `TextCompletionClient` interface from `OpenRouterClient` to allow pluggable text providers across the storyteller pipeline.

- Add typed Adventure Module actor authoring with create/edit APIs, resolved actor detail payloads, layered actor-card metadata, and legacy-module backfill for missing actor card records.
- Add layered ActorCard rendering, actor list authoring UI, actor editor UI, and actor shortcode copy support in the Adventure Module authoring flow.
- Add typed Adventure Module counter authoring with create/edit APIs, resolved counter detail payloads, vendored counter icon assets, and shared authoring-side counter values.
- Add typed Adventure Module asset authoring with create/edit/delete APIs, resolved asset detail payloads, filtered base/medieval asset catalogs, and vendored asset images for authored AssetCards.
- Add typed Adventure Module location authoring with create/edit/delete APIs, resolved location detail payloads, `locationDetails` metadata, interactive map pins, and legacy-module backfill for missing location metadata.
- Add Adventure Module Locations tab and editor UI with title-image and map-image generation/paste flows, introduction/description markdown authoring, hover previews, and click-through map pins for locations, actors, encounters, and quests.

### Changed

- Switch the zero-config local server default from port `8080` to `8081` and align the web client's split-dev fallback with the same port.
- Build the shared `spec/` workspace to JavaScript plus declaration files, update package exports to built output, and start the server from compiled JS instead of `tsx` in production.
- Narrow Render installs to the deploy-relevant workspaces and remove the accidental root `playwright` dependency from the deploy path.
- Derive web asset card titles from the shared `spec` asset catalog so built-in asset names have one source of truth across shared contracts and the UI.
- Lazy-load top-level web routes and scope the MDX editor stylesheet to the authoring flow to reduce the initial client bundle.
- Render Adventure Module authoring GameCards inline in MDX rich text, normalize legacy shortcode tokens to canonical `<GameCard />` source, and remove the separate markdown preview panel.
- Remove the Adventure Module markdown editor content frame so rich text and source content blend into the page background while the toolbar keeps the only surface treatment.
- Extend Adventure Module markdown normalization, toolbar insert options, and rich-text rendering so module-local actors render as canonical `<GameCard type="ActorCard" />` embeds while `@actor/<slug>` remains supported.
- Extend Adventure Module markdown normalization, toolbar insert options, and rich-text rendering so module-local counters render as canonical `<GameCard type="CounterCard" />` embeds while `@counter/<slug>` remains supported.
- Extend Adventure Module markdown normalization, toolbar insert options, and rich-text rendering so module-local assets render as canonical `<GameCard type="AssetCard" />` embeds while `@asset/<slug>` remains supported.
- Split Adventure Module markdown asset insertion into `Generic Asset` and `Custom Asset`, carry optional `modifierSlug` through canonical `<GameCard type="AssetCard" />` embeds, and convert module-authored assets to custom card metadata instead of layered base/modifier selections.
- Add typed actor and counter delete support in Adventure Module authoring, including list/editor delete actions and invalid-card fallback for stale embeds.
- Move the Adventure Module `Assets` tab after `Counters` and replace the placeholder with searchable AssetCard authoring plus grouped `Asset Base` and `Asset Medieval` pickers.
- Switch the `/rules` reference pages to copy `@type/<slug>` shortcodes instead of raw `<GameCard />` JSX, add `/rules/assets`, accept underscore-based asset shortcodes in rich-text markdown normalization, and let `/rules/assets` apply a selected modifier to every preview and copied shortcode.

### Fixed

- Resolve the built web client path relative to the server module location so Render's plain-Node startup still serves the frontend from the single service root.
- Proxy local Vite `/api`, `/adventures`, `/health`, and `/socket.io` traffic through the web origin so Adventure Module list/create flows still work when the backend `PORT` is overridden in root `.env.local`.
- Regenerate Adventure Module actor and counter slugs from saved titles, keep the authoring route in sync after renames, and allow actor/counter deletes to complete without sending an empty JSON body.
- Tighten Counter editor numeric fields and move CounterCard +/- controls inline before the shared value so authoring cards keep the header on a single line.
- Add a second inline `+` and `-` control pair after the max counter value so authoring cards can adjust both current and max values without leaving the card.

### Docs

- Add the root changelog to track notable product, workflow, deployment, and documentation updates.
- Add AI contributor instructions in `AGENTS.md` requiring documentation and changelog updates when repo behavior, contracts, routes, env vars, or deployment guidance change.
- Add a root `README.md` covering the current repo overview, implementation status, setup, AI configuration, contribution expectations, and deployment paths.
- Update Adventure Module authoring docs to reflect the implemented Actors tab, actor editor route, typed actor APIs, and actor embed behavior.
- Update Adventure Module authoring docs to reflect the implemented Counters tab, typed counter APIs, and typed actor/counter delete routes.
- Update Adventure Module docs to reflect typed asset authoring, AssetCard embeds, and the implemented Assets tab/editor flow.
- Update Adventure Module docs to reflect custom module assets, generic-vs-custom markdown insertion, and legacy asset reauthoring requirements.
- Update Adventure Module docs to reflect typed location authoring, location image metadata, and interactive map-pin authoring while encounters and quests remain placeholders.
- Update the route and UI docs for the new `/rules/assets` reference page, the shortcode-first copy behavior used by the rules reference pages, and the optional modifier-bearing asset shortcode format.

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
