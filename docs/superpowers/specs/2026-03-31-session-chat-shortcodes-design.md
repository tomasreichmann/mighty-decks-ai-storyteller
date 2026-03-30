# Session Chat Shortcodes Design

Date: 2026-03-31

## Goal

Allow campaign session chat messages to render shared game components inline when a player or storyteller includes supported shortcodes inside normal chat text.

This must support:

- any number of shortcodes in a single message
- mixed prose and shortcodes in one message
- preserved message order so cards appear where the shortcode was typed
- graceful fallback so unknown or unresolved shortcodes remain visible as plain text

## Scope

In scope:

- Campaign session transcript rendering in the player session view
- Campaign session transcript rendering in the storyteller chat view
- Web-only parsing and rendering of supported shortcodes inside session chat text
- Reuse of the existing shortcode catalog and card resolution logic where possible
- Tests covering repeated and mixed shortcode rendering

Out of scope:

- Adventure runtime transcript rendering
- New server-side transcript entry shapes
- Rewriting stored transcript text into canonical JSX
- Changes to Socket.IO event contracts unless a validation gap is discovered during implementation

## Product Behavior

### Supported shortcode families

Session chat should recognize the same user-facing shortcode families already supported elsewhere in the project:

- `@outcome/<slug>`
- `@effect/<slug>`
- `@stunt/<slug>`
- `@actor/<slug>`
- `@counter/<slug>`
- `@asset/<slug>`
- `@asset/<slug>/<modifier-slug>`
- `@encounter/<slug>`
- `@quest/<slug>`

### Mixed prose and card rendering

Messages are rendered as an ordered sequence of inline parts:

- plain text before a shortcode
- rendered card for the shortcode
- plain text after the shortcode

Example:

`Push @counter/threat-clock forward, then inspect @quest/recover-the-shard before the bell tolls.`

renders as:

- text: `Push `
- inline counter card
- text: ` forward, then inspect `
- inline quest card
- text: ` before the bell tolls.`

### Repeated shortcodes

If a message contains repeated shortcodes, each occurrence renders in place. There is no deduping within a message.

### Unknown or unresolved shortcodes

If a token looks like a shortcode but cannot be resolved against built-in data or the active campaign catalog, leave the original token visible as plain text.

Reason:

- players should never lose content they typed
- unresolved references should remain debuggable in the transcript

### Message storage

Stored transcript text remains the raw trimmed message text the user submitted.

Reason:

- transcript previews stay readable
- persistence and shared contracts stay simple
- chat remains editable and inspectable as text rather than embed markup

## Design Direction

This feature should be implemented as a lightweight render-time enhancement, not as a new chat content model.

Reason:

- the existing campaign session transcript contract is intentionally simple
- shortcodes already have mature resolver logic in the web app
- render-time parsing can support multiple cards per message without changing persistence or socket behavior
- preserving raw text avoids coupling campaign chat to the richer markdown authoring pipeline

## Architecture

### Rendering pipeline

Add a small web utility that parses a session chat message into ordered render segments.

Suggested segment shape:

- `text`
- `game_card`
- `encounter_card`
- `quest_card`

The parser should scan left-to-right through the message and emit alternating text and card segments.

### Resolution sources

Use existing resolver utilities for known card types:

- built-in outcome, effect, stunt, and built-in asset resolution from existing game card helpers
- campaign actor, counter, and custom asset resolution from campaign catalog data
- campaign encounter resolution from encounter helpers
- campaign quest resolution from quest helpers

### Rendering surface

Create a shared transcript message renderer for campaign session chat so both routes use the same behavior:

- `apps/web/src/routes/CampaignSessionPlayerPage.tsx`
- `apps/web/src/routes/CampaignAuthoringPage.tsx`

The renderer should output normal prose plus embedded card views within the same transcript bubble rather than replacing the bubble with a card grid.

### Context wiring

Wrap the campaign session transcript renderer in `GameCardCatalogContext.Provider` so campaign-specific entities resolve correctly:

- actors
- counters
- assets
- encounters
- quests

This keeps card rendering aligned with the active campaign without introducing route-specific resolver forks.

## Parsing Rules

### Token matching

The parser should use the existing shortcode syntax and support tokens separated by spaces or punctuation inside ordinary prose.

It should preserve all non-token text exactly as entered except for React rendering normalization already present in the transcript UI.

### Ordering

Parsing is strictly left-to-right. Render order must match source order.

### Empty text fragments

Empty text fragments between adjacent tokens should be omitted from the rendered output to avoid unnecessary wrappers.

### New lines

Line breaks in message text should continue to render naturally in the transcript bubble. Cards should still appear in sequence across wrapped or multiline content.

## UI Behavior

### Card presentation

Shortcode cards should render inline as part of the chat message content, but practical layout should prioritize readability over literal text-baseline alignment.

Implementation expectation:

- prose remains readable as message text
- cards can appear as inline-block or wrapped blocks inside the same message flow
- repeated cards should wrap cleanly on narrow screens

### Message styling

Existing transcript bubble styling should remain the primary container. The new renderer only changes how `entry.text` content is composed inside the bubble.

### Responsive behavior

Inline cards must wrap safely on mobile instead of forcing horizontal overflow in the message area.

## Error Handling

- Unknown shortcode: render raw token as text
- Known shortcode with missing campaign entity: render raw token as text
- Malformed shortcode: treat as ordinary text
- Empty message after trim: existing send-button guards remain unchanged

No parser failure should break the transcript row or hide surrounding prose.

## Testing

Add focused tests for:

1. parsing mixed prose and shortcodes into ordered segments
2. rendering multiple shortcodes from one message in order
3. leaving unresolved shortcodes as visible plain text
4. wiring the campaign session views through the shared rich transcript renderer

Prefer focused unit tests for parsing plus lightweight route/source coverage tests that confirm the new renderer is used in both campaign session transcript surfaces.

## Documentation Impact

If implementation changes contributor-facing behavior enough to matter, update:

- `docs/04-ui-components.md`
- `CHANGELOG.md`

At minimum, add a changelog entry because this affects visible session chat behavior.

## Recommended Implementation Order

1. Add a campaign session chat segment parser in the web app
2. Add a shared campaign session transcript content renderer that can render text plus card views in order
3. Wire `GameCardCatalogContext.Provider` around the campaign session transcript surfaces
4. Replace plain text transcript rendering in the player and storyteller session views with the shared renderer
5. Add parsing and route-level tests
6. Update changelog and any relevant docs
