# 20 - Campaigns and Human Storyteller Sessions

This document describes the current post-MVP campaign flow that sits on top of Adventure Module authoring.

It covers the implemented `Campaigns` domain, human-storyteller session routes, and the dev-focused mock participant flow used for testing without a full table.

---

## 1. Core Concepts

- `Adventure Module` remains the reusable authored source.
- `Campaign` is a persisted deep-copy fork of an Adventure Module.
- `Session` is a live or archived play instance of a Campaign.
- Sessions use live campaign data. A campaign is not snapshotted per session in this slice.

Current defaults:

- Campaigns are shared inside the current app instance. No account ownership is enforced.
- Campaign editing is autosave-based and last-write-wins.
- Multiple sessions may exist on the same campaign at the same time.
- Human sessions now support group chat plus a shared session table surface with storyteller-managed card placement.

---

## 2. Route Map

Campaign routes:

- `/campaign/list`
- `/campaign/:slug/:tab`
- `/campaign/:slug/:tab/:entityId`
- `/campaign/:campaignSlug/session/:sessionId`
- `/campaign/:campaignSlug/session/:sessionId/player`
- `/campaign/:campaignSlug/session/:sessionId/player/chat`
- `/campaign/:campaignSlug/session/:sessionId/storyteller/:tab`
- `/campaign/:campaignSlug/session/:sessionId/storyteller/:tab/:entityId`

Campaign detail tabs:

- `base`
- `player-info`
- `storyteller-info`
- `actors`
- `counters`
- `assets`
- `locations`
- `encounters`
- `quests`
- `sessions`

Storyteller session tabs:

- `chat`
- `outcomes`
- `effects`
- `stunts`
- `actors`
- `counters`
- `locations`
- `encounters`
- `quests`
- `static-assets`
- `assets` (labeled `Custom Assets` in session mode)
- `base`
- `player-info`
- `storyteller-info`

---

## 3. Campaign Creation

Campaigns are created from Adventure Modules only.

Current entry points:

- Adventure Module list card action: `Create Campaign`
- Adventure Module authoring header action: `Create Campaign`

Creation behavior:

1. User chooses an Adventure Module.
2. Server deep-copies the module into a new Campaign record.
3. User is redirected to `/campaign/:slug/base`.

During the copy:

- authored fragments and entity records are copied into campaign persistence
- any actor marked `isPlayerCharacter: true` is seeded into the campaign as an available player character

---

## 4. Campaign Detail

Campaign detail intentionally reuses the Adventure Module authoring shell with campaign-backed APIs.

Current behaviors:

- autosave for campaign fields and entity editors
- `Sessions` tab with historical and active session summaries
- header `Create Session` action
- route-preserving entity editing like the module authoring flow

Live refresh:

- open campaign detail views subscribe to campaign updates over Socket.IO
- when another client changes the same campaign, the route refetches the latest campaign detail
- storyteller session routes also refetch after campaign updates

This slice is refresh-based, not CRDT/live-typing collaboration.

---

## 5. Session Lifecycle

Session statuses:

- `setup`
- `active`
- `closed`

Activation rule:

- a session becomes `active` when it has at least one storyteller participant and one player participant
- in dev/debug mode, explicit mock participants may satisfy either seat

Closing behavior:

- transcript is frozen
- status changes to `closed`
- active character claims for that session are released

---

## 6. Session Lobby Flow

Route: `/campaign/:campaignSlug/session/:sessionId`

The lobby is intentionally neutral before role choice.

Users can:

- join as storyteller
- join as player
- copy/share an invite URL
- open a QR/share overlay

In dev/debug mode, the lobby also exposes explicit mock controls:

- add mock player
- add mock storyteller

This allows one person to test activation, chat, and session closure without needing a second real device.

---

## 7. Player Flow

Claim route: `/campaign/:campaignSlug/session/:sessionId/player`

Live transcript route: `/campaign/:campaignSlug/session/:sessionId/player/chat`

Player entry flow:

1. Join the session as `player`.
2. Land on the headered claim/create route.
3. Claim an existing unclaimed player character, or create a new one.
4. Enter the headerless live transcript route automatically after claim/create succeeds.

Player characters are campaign actors with `isPlayerCharacter: true`.

They may come from:

- the original Adventure Module authoring flow
- campaign-time creation during a session

Current player session scope:

- claim/create PC
- enter the live transcript after claim/create succeeds
- add messages to the shared transcript
- use a compact image button on the transcript composer to open a reusable modal for generating or reusing an image, then insert it into the draft as standard markdown `![alt](url)` syntax
- paste supported component shortcodes into transcript messages and see them render inline in place
- see markdown images render inline inside transcript messages without changing the stored session message shape
- reuse the Adventure-style transcript wrapper treatment, including the softer unframed scroll area and fade mask
- render the existing `Claimed ...` transcript event as an inline actor card with art, name, and summary inside the live transcript scroll area instead of a separate header callout
- see known session events such as joins, leaves, and claims rendered with participant labels and Adventure-aligned role colors
- keep `/player` on the usual page shell while claim/create is still in progress
- switch the live transcript to a headerless, footerless `/player/chat` shell so only in-play screens reclaim that vertical room
- let the live transcript scroll area grow to the remaining viewport height once play starts, so the composer stays on-screen while the transcript absorbs the extra space
- see the same shared table lanes as the storyteller in a responsive `Table / Chat` split view
- own a private outcome deck/hand/discard lane under the shared table, with the current player seeing face-up hand cards and other viewers seeing back-face hands and decks
- draw from the deck, select hand cards, and play them to the discard pile; the play action writes an inline transcript message like `Character played: @outcome/success, @outcome/fumble`
- remove table cards only from the player's own lane (server-enforced)

Not yet included:

- private messages
- hand-limit enforcement or broader outcome automation
- stunt, asset, or effect hand management

---

## 8. Storyteller Flow

Route: `/campaign/:campaignSlug/session/:sessionId/storyteller/:tab`

Storyteller flow:

1. Join the lobby as `storyteller`.
2. Enter the campaign shell reused for live play.
3. Switch between campaign tabs and the `Chat` tab.

The `Chat` tab currently includes:

- responsive table/chat split (`2/3` table, `1/3` chat on desktop; `Table / Chat` switcher on mobile)
- fit-screen chat mode for `/storyteller/chat` with independent scrolling in both the `Table` pane and the `Chat` pane
- persistent live transcript
- storyteller transcript composer
- storyteller table controls to remove any visible table card
- table card removals animate with a short fade-out when `X` is clicked before the server-authoritative removal lands
- lane-level and shared `Send Cards` actions that appear when local selection has staged cards
- per-player outcome decks, hands, and discard piles below the shared table lanes, with the active player seeing front faces and everyone else seeing back faces on the deck and hand
- discard piles stay face-up for every viewer, including the storyteller
- a compact `▶` play button below the current player's hand when cards are selected, plus deck-click draw and empty-deck shuffle actions
- a compact image button on the transcript composer that opens the same reusable generate-or-pick modal used by markdown authoring
- inline rendering for supported component shortcodes pasted into transcript messages
- inline rendering for markdown images embedded in transcript text
- the same shared session transcript presenter used by the player view, so wrapper styling and participant/system message treatment stay in sync
- close-session action
- a compact session-nav row where the Mighty Decks logo links home, `Chat` stays first in the tab order, the autosave indicator sits immediately after the tab rail, and tablet/mobile use a burger menu instead of the full button group

The storyteller stays inside the same campaign-backed entity editors while the session is live.

Those shared entity editors now surface the same shortcode copy row used in Adventure Module detail pages, and in session mode they also expose a `+` add action next to shortcode controls and list-row copy actions. This stages cards in a local storyteller selection strip (below the tab rail) that persists while moving between storyteller session tabs and clears after `Send Cards`.
When no cards are staged, the selection strip is hidden.

Session storyteller tabs also include direct rules references (`Outcomes`, `Effects`, `Stunts`, `Static Assets`) so the storyteller can stage rules cards without leaving the live session shell.

Current UX direction:

- session-facing screens borrow Adventure-mode patterns where players feel them most
- `Transcript` is the primary conversation model across player and storyteller screens
- the storyteller `Chat` tab is a dedicated live-session split view inside the broader campaign shell, not a fully separate storyteller app
- player flow is intentionally two-step: character claim/create first on `/player`, live transcript second on `/player/chat`
- storyteller session routes widen beyond the standard authoring shell so the live roster and transcript can use the full viewport width

---

## 9. Realtime Contract

REST handles:

- campaign list/read/create
- campaign updates mirroring module authoring
- session create/list/read
- campaign delete
- session delete

Socket.IO handles:

- campaign watch/unwatch for route-level refresh
- join/leave session
- join session role
- add mock participant
- claim/create player character
- group chat messages
- draw outcome card from a player deck
- shuffle a player discard pile back into the deck when the deck is empty
- play selected outcome cards from a player's hand to the discard pile
- close session
- add cards to the shared session table or a specific player lane
- remove a card entry from the session table (storyteller any lane; player own lane only)
- broadcast session state updates

Cleanup endpoints:

- `DELETE /api/campaigns/:campaignId`
- `DELETE /api/campaigns/:campaignId/sessions/:sessionId`

Smoke-test workflow:

- `pnpm -C apps/server smoke:campaign-flow` boots a temporary local Fastify plus Socket.IO harness and exercises module authoring, campaign creation, session creation, session joins, and cleanup.
- `SMOKE_BASE_URL=https://<your-service>.onrender.com pnpm -C apps/server smoke:campaign-flow` runs the same smoke path against a live Render deployment.
- The smoke path uses timestamped names so retries do not collide, then deletes the created session, campaign, and Adventure Module during cleanup.

Campaign session state now includes `outcomePilesByParticipantId`, keyed by `participantId`.
Each player pile has a server-seeded 12-card deck, a 3-card opening hand, and an empty discard pile.

Transcript persistence includes:

- session created
- participant joined/left
- mock added
- player character claimed/created
- group messages stored as raw transcript text, including plain prose, supported shortcodes, and standard markdown image syntax
- played outcome cards stored as raw transcript text using the same supported shortcode format
- session closed

Transcript presentation includes:

- shared web-side parsing of known session system events into labeled messages such as `Joined`, `Left`, `Claimed ...`, and `Created ...`
- known claim events can resolve against campaign actors so the transcript entry itself renders the claimed character card inline
- shared web-side parsing of standard markdown image tokens so transcript messages can display inline images while preserving raw text storage
- role-aware message colors for storyteller vs player entries, with current-participant session messages visually separated from other players
- Adventure-style transcript scrolling treatment with the same soft fade mask instead of a framed transcript box

Realtime stability note:

- client joins must be treated as idempotent session membership assertions rather than rerender-driven repeated emits
- stale session errors should clear on the next authoritative `campaign_session_state`
- player claim/create should stay gated on confirmed session membership so claim attempts do not race ahead of join state

---

## 10. Known Limits In This Slice

- No account-backed ownership or permissions
- No campaign-level dedicated storyteller assignment outside sessions
- No private messaging
- No separate GM workspace
- No hand-limit enforcement or broader outcome automation yet
- No AI-runtime coupling to the campaign session flow yet
