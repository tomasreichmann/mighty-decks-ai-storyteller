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
- Human sessions currently support group chat only. Private messages and card-transfer flows are still out of scope.

---

## 2. Route Map

Campaign routes:

- `/campaign/list`
- `/campaign/:slug/:tab`
- `/campaign/:slug/:tab/:entityId`
- `/campaign/:campaignSlug/session/:sessionId`
- `/campaign/:campaignSlug/session/:sessionId/player`
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

- all campaign authoring tabs above
- `chat`

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

Route: `/campaign/:campaignSlug/session/:sessionId/player`

Player entry flow:

1. Join the session as `player`.
2. Claim an existing unclaimed player character, or create a new one.
3. Enter group chat.

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
- see known session events such as joins, leaves, and claims rendered with participant labels and Adventure-aligned role colors
- use a headerless, footerless player session shell so claim/chat screens keep more vertical room for the live transcript and composer

Not yet included:

- private messages
- outcome/deck/discard HUD
- stunt, asset, or effect hand management

---

## 8. Storyteller Flow

Route: `/campaign/:campaignSlug/session/:sessionId/storyteller/:tab`

Storyteller flow:

1. Join the lobby as `storyteller`.
2. Enter the campaign shell reused for live play.
3. Switch between campaign tabs and the `Chat` tab.

The `Chat` tab currently includes:

- participant roster
- persistent live transcript
- storyteller transcript composer
- a compact image button on the transcript composer that opens the same reusable generate-or-pick modal used by markdown authoring
- inline rendering for supported component shortcodes pasted into transcript messages
- inline rendering for markdown images embedded in transcript text
- the same shared session transcript presenter used by the player view, so wrapper styling and participant/system message treatment stay in sync
- close-session action
- a compact session-nav row where the Mighty Decks logo links home, `Chat` stays first in the tab order, the autosave indicator sits immediately after the tab rail, and tablet/mobile use a burger menu instead of the full button group

The storyteller stays inside the same campaign-backed entity editors while the session is live.

Those shared entity editors now surface the same shortcode copy row used in Adventure Module detail pages, so storytellers can copy `@actor/...`, `@counter/...`, `@asset/...`, `@location/...`, `@encounter/...`, and `@quest/...` directly from the live session detail tabs.

Current UX direction:

- session-facing screens borrow Adventure-mode patterns where players feel them most
- `Transcript` is the primary conversation model across player and storyteller screens
- the storyteller `Chat` tab is a dedicated live-session split view inside the broader campaign shell, not a fully separate storyteller app
- player flow is intentionally two-step: character claim/create first, live transcript second
- storyteller session routes widen beyond the standard authoring shell so the live roster and transcript can use the full viewport width

---

## 9. Realtime Contract

REST handles:

- campaign list/read/create
- campaign updates mirroring module authoring
- session create/list/read

Socket.IO handles:

- campaign watch/unwatch for route-level refresh
- join/leave session
- join session role
- add mock participant
- claim/create player character
- group chat messages
- close session
- broadcast session state updates

Transcript persistence includes:

- session created
- participant joined/left
- mock added
- player character claimed/created
- group messages stored as raw transcript text, including plain prose, supported shortcodes, and standard markdown image syntax
- session closed

Transcript presentation includes:

- shared web-side parsing of known session system events into labeled messages such as `Joined`, `Left`, `Claimed ...`, and `Created ...`
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
- No card send/take flows
- No AI-runtime coupling to the campaign session flow yet
