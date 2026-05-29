# 22 - Ship Combat Rules Prototype

The ship combat prototype now has a text-first Rules-facing route at
`/rules/ship-combat` and keeps the hidden `/spaceship` route as the fullscreen
visual lab.

The prototype illustrates ship-to-ship combat with physical table components:
Location cards for ship rooms, custom Asset cards for Devices, circular Power
tokens, actor/minis tokens, and status/effect cards.

---

## 1. Scope

### Current goals

- Add `/rules/ship-combat` as a visible Rules tab for the ship-combat prototype.
- Explain the table layout in text instead of embedding the hidden spaceship board.
- Describe ship rooms as `LocationCard` components and Devices as custom `AssetCard` components.
- Describe circular Power tokens with active and spent states.
- Render Special Location reference panels as `LocationCard` previews using tracked adventure-artifact images, including the Morgue.
- Document the selected round-power model and alternatives.
- Keep the interaction model local to the hidden lab with no sockets or
  multiplayer synchronization; named lab board states are saved through a small
  backend file store so useful defaults can be committed.

### Existing hidden lab goals

- Keep a hidden, headerless `/spaceship` route for a two-pane ship combat mockup.
- Add a hidden `/styleguide/actor-token` route for the new circular portrait token with labeled states.
- Seed the mockup with Exiles-inspired player and pirate ships, actors, effects, actor tokens, and energy tokens.
- Support first-slice token drag/drop for energy and actor tokens on the local `/spaceship` board.
- Support first-slice free card drag/drop for Location, Device, effect, Actor, and Actor effect cards on the local `/spaceship` board.
- Support live local snapping and layout reflow while dragging cards across compatible ship rows, Device columns, actor rows, and effect stacks.
- Render the Exiles Corvette and Xithrax Raider artifact images as low-z board backgrounds behind their ship areas.
- Add an unlimited draggable dispenser panel that creates Energy tokens and Injury, Distress, Complication, Freezing, and Burning effect cards when dragged from their sources.
- Expose a typed browser-global connector for Codex/devtools automation to add local ship content without reloading the page or discarding manual board edits.
- Expand the Exiles importer so ship locations are authored as normalized adventure-module locations instead of living only inside scene prose.

### Non-goals

- Ghost/silhouette insertion previews and fine-grained effect-stack insertion positions.
- Multiplayer synchronization.
- Combat rules resolution, energy spending logic, or turn orchestration.
- Mutation from the card library overlay into the scene.
- Fetching the spaceship scene from server state.

---

## 2. Route Shape

- `/spaceship`
  - hidden route
  - full-screen, no-header shell with a shared pan/zoom board frame
  - page chrome overlays the board in one header action row; scene content is board-positioned
  - the board frame is square, unrounded, and flush to the viewport edges
  - has `Show All`, `Focus Ally Ship`, and `Focus Enemy Ship` controls that fit the viewport to current board items
  - loads its default scene, drag layout, and viewport from a named board-state JSON file
  - can Save, Save As, Restore, and Set Default for named board states through `/api/spaceship-board-states/*`
  - exposes `window.mightyDecksSpaceship` while mounted so Codex or devtools can apply typed operations such as adding a Location card and Energy tokens to the live local board
  - local lab state persisted to commit-friendly JSON files, not multiplayer session state
- `/rules/ship-combat`
  - Rules tab
  - fit-content route inside the Rules layout
  - text-only rules reference with no embedded ship diagram
  - explains component layout, round flow, damage, power-token alternatives, detailed Device reference panels, and Special Location reference panels
- `/styleguide/actor-token`
  - hidden route
  - fit-content shell
  - showcases token tones, labels, and subtitle states

`/spaceship` and `/styleguide/actor-token` remain hidden. `/rules/ship-combat`
is reachable through the Rules tab navigation.

---

## 3. Low-Fi Wireframes

### `/spaceship`

```text
+-----------------------------------------------------------------------------------+
| Exiles of the Hungry Void                                  [ + Add Cards ]        |
| Corvette vs Raider prototype                                                       |
+--------------------------------------+--------------------------------------------+
| LEFT SHIP PANE                       | RIGHT SHIP PANE                            |
| Exiles Corvette                      | Xithrax Raider                             |
|                                      |                                            |
| [Docking][Reactor][Engines][Spin]    | [Docking][Cargo][Quarters]                |
| [Weapon ][Missile]                   | [Spin   ][Engine][Reactor]                |
|                                      | [Shield ][Weapon][Cockpit]                |
| [Effect stacks bottom-aligned]       | [Effect stacks bottom-aligned]            |
| [Effect cards behind Locations]      | [Effect cards behind Locations]           |
| [Actor tokens and energy tokens]     | [Actor tokens and energy tokens]          |
|                                      |                                            |
| Actor cards with Injury/Distress     | Actor cards with Injury/Distress          |
| peeking effect headers along top     | peeking effect headers along top          |
+--------------------------------------+--------------------------------------------+
```

### `CardLibraryOverlay`

```text
+---------------------------------------------------------------+
| Add Cards                                              [x]    |
| Select cards to stage for insertion in a later milestone.     |
|                                                               |
| [ Location ] [ Effect ] [ Token ] [ Actor ]                  |
|                                                               |
| [ ] Reactor        [ ] Distress       [ ] Energy             |
| [ ] Shield Gen     [ ] Freezing       [ ] Boarding Token     |
| [ ] Actor Card     [ ] Injury         [ ] Missile            |
|                                                               |
| Selected: 3                                                  |
|                                           [Later] [Insert]   |
+---------------------------------------------------------------+
```

The overlay now uses the shared dialog shell and previews locations with the
shared `LocationCard` component while rendering effects with the shared
`EffectCard` preview used elsewhere in the app.

### `/styleguide/actor-token`

```text
[ circular portrait ]
      Pilot
   Evasion ready

[ circular portrait ]
    Void-seer
    Surveying
```

---

## 4. Reusable Component Architecture

### Shared page-level pieces

- `SpaceshipPage`
  - owns local overlay state
  - renders the seeded `SpaceshipScene` through `SpaceshipBoard`
  - places the visible `+` trigger
- `RulesShipCombatPage`
  - renders text rules sections for physical components, ship layout, round flow, damage, power token alternatives, detailed Device reference panels, and Special Location reference panels
  - renders generated custom `AssetCard` previews for Flight Controls, Weapon Turret, Sensors, Shields, Engines, Spin Drive, Life Support, Workbench, Missile Bay, and Reactor
  - labels custom Device cards with the `sci-fi` deck instead of the generic `custom` deck
  - renders Special Location reference panels with the shared `LocationCard` component and tracked `/api/adventure-artifacts/*` images
- `SpaceshipBoard`
  - wraps the seeded scene in `BoardProvider`, `BoardFrame`, and custom-rendered `Board` items
  - builds flat board entries for ship headers, Devices, Location cards, individual effect cards, individual tokens, the dispenser panel, and actor cards
  - applies pure spaceship board layout helpers on mount, then fits all items into the board frame
  - keeps route-level controls outside the board transform while the board frame handles pan/zoom and fit actions
- Spaceship board layout helpers
  - compose existing `flexLayout` and `stackLayout` helpers into ship-level board placements
  - place ship, crew, ship, and crew blocks in the scene-level flex column using each block's actual layout bounds, with bottom-aligned locations in flex rows, Devices above Locations, Location effect cards bottom-aligned behind their Location cards, and token rows centered over Location cards
  - rebuild board positions from local layout membership so card drag/drop can remove, insert, and reflow rows and columns without mutating seeded scene content
  - render room groups as Device columns above Location cards, with tucked effect stacks behind Locations, Devices, and Actor cards
  - place actor effect cards and actor cards as separate board items inside each actor row, with each effect card tucked behind the card top using the shared header offset
  - keep ship title items compact so focus bounds follow visible content instead of invisible pane width

### Card and token primitives

- `ShipLocationCard`
  - still offers the old composed local preview, but also exports split board surfaces for the shared board
  - `ShipLocationCardSurface` renders the shared `LocationCard` and adjustable `Tag`-based level pill beside the top-right Location symbol
  - `ShipLocationDeviceCard` renders the attached custom `AssetCard` Device as an independent board item using the same generated sci-fi Device cards as `/rules/ship-combat`
  - `ShipLocationTokenRow` renders energy and actor tokens as an independent board item centered over the Location card
  - consumes `moduleLocationSlug` so scene items stay aligned with imported module locations
- `ShipEffectStack`
  - renders full-size stacked effect cards
  - always stacks upward, regardless of location row
- `ActorToken`
  - spaceship wrapper around the shared `Token` primitive
  - renders a circular portrait token with a centered label below the portrait
  - reused in the scene and in `/styleguide/tokens`
- `EnergyToken`
  - circular Power token for current energy assignment
  - supports `active` and `spent` visual states
- `SpaceshipDispenserPanel`
  - draggable vertical source panel with a handle, placed to the left of the main ship-content column
  - dragging from Energy creates a new board Power token without reducing a count
  - dragging from Injury, Distress, Complication, Freezing, or Burning creates a full-size shared `EffectCard`
  - dropping an energy token back on the panel removes it without tracking finite availability
- `SpaceshipTrashFrameTarget`
  - semi-transparent frame overlay in the lower-left corner with a compact trash icon and radial red fade
  - highlights when a draggable card or token enters the corner drop area
  - dropping a draggable card or token in the highlighted corner removes that local board item; card removal also removes visually attached bundle pieces
- Device icon PNGs
  - stored under `apps/web/public/assets/spaceship/devices/`
  - generated on solid chroma backgrounds, then processed into real alpha PNGs with transparent corners
  - source chroma-key generations are archived under `apps/server/output/adventure-artifacts/device-icon-sources/`
- `SpaceshipActorStrip`
  - renders actor cards in the legacy composed preview and exports split actor effect/card surfaces for board-positioned actor items
  - renders the Exiles Corvette crew from the authored custom Exiles actor card metadata, reusing those profile portraits for the crew tokens while leaving enemy crew on generic actor layers
  - shows full-size Injury and Distress stacks using shared `EffectCard` piles
    and the same upward overlap logic as the session-table card stacks
  - centers the effect piles behind the actor column so the visible peeks stay
    tucked under the card instead of drifting to the pane edge
- `CardLibraryOverlay`
  - shared overlay shell for staged card selection and library previews
  - open/close and selection state work in milestone 1
  - `Insert` is intentionally disabled
  - location entries use the shared `LocationCard` preview and effect entries
    use the shared `EffectCard` preview

### Shared UI primitives reused

- `Page`
- `Panel`
- `Button`
- `Text`
- `Overlay`
- `ActorCard`
- existing modal shell patterns
- `Tag`

No new UI dependency was added for this milestone.

---

## 5. Local State Architecture

Milestone 1 keeps all state local to the route and mirrors the later reducer shape in lightweight local types.

### State slices

- `scene`
  - top-level title/subtitle
  - left and right `ShipPaneModel`
  - current card library entries
- `dragState`
  - individual energy and actor token placement
  - board-level absolute coordinates or card-relative offsets
  - local card layout membership for Location rows, room Device columns, actor rows, and owner effect stacks
  - manual card placement fallback when a card is dragged away from compatible layouts
  - dispenser panel board position
  - next card/token z-order plus generated energy token and effect card counters
- named board state persistence
  - files live under `apps/server/output/spaceship-board-states/` by default
  - `index.json` stores the `defaultStateId` and state summaries
  - each state file stores `scene`, `dragState`, and `viewport`
  - `SPACESHIP_BOARD_STATE_DIR` can point the backend at another local folder
- `window.mightyDecksSpaceship`
  - exposes `getSnapshot`, `applyOperations`, `focusPane`, and `focusItem`
  - accepts deterministic typed operations, not arbitrary HTML or natural-language prompts
  - syncs current board item positions into local drag state before applying operations so manual edits survive live Codex-driven changes
- `overlay`
  - whether the overlay is open
- `selection`
  - selected overlay card ids
- `zBands`
  - separate order arrays for cards and tokens

### Current local types

- `SpaceshipScene`
- `ShipPaneModel`
- `ShipLocationInstance`
- `ShipEffectInstance`
- `ShipActorInstance`
- `ActorTokenModel`
- `EnergyTokenModel`
- `CardLibraryEntry`
- `SpaceshipLayoutMembershipState`
- `SpaceshipCardSnapTarget`
- `SpaceshipCardPlacement`

### Why `zBands` still exists

- later card drag/drop needs stable ordering separate from visual content
- tokens must always render above cards
- last-touched order still matters within the token layer and within the card layer

The current seeded data already includes `lastTouchedOrder` and `moduleLocationSlug`. Token z-order now lives in local `dragState`, while future card z-order can reuse the existing scene shape.

---

## 6. Layering And Z-Order Rules

- Cards and tokens are separate visual bands.
- Tokens always render above cards.
- Within a band, the most recently dragged item wins z-order.
- Dragged cards can snap into compatible local layouts, which reflow live while dragging.
- Dragged cards can still be left at arbitrary board positions when no compatible snap target is active.
- Location drags move the visual room bundle; Device drags move the Device plus its tucked effects; Actor drags move the Actor plus its tucked effects; effect drags move only that effect card.
- Dragged tokens can be left at arbitrary board positions.
- Tokens dropped over any card surface attach to that card with a card-relative offset, so future card dragging can move attached tokens with the card.
- Effect stacks render as independent board items, but their positions are derived from their current local owner.
- Location, Device, and Actor effect cards sit behind their owning card and keep each subsequent card offset upward by the shared header offset.
- Actor and energy tokens render as independent board items, and each actor-card Injury or Distress card sits as its own board item centered behind the actor card with the top header offset visible.
- Current card positions are prototype layout behavior, not a public contract; tests should cover helper/API behavior instead of exact coordinates.

This mirrors the intended combat board rules for the first local interaction slices.

---

## 7. Local Drag/Drop Model

The first interaction slice follows the pointer-event style already used by `apps/web/src/components/adventure-module/AdventureModuleLocationMapEditor.tsx`.

### Implemented approach

- pointer-down captures the dragged token id and origin
- touching a token brings it to the top of the token layer
- touching a card brings it to the top of the card layer while keeping it below tokens
- pointer-move updates local transient position and resolves compatible card snap targets
- compatible card snap targets mutate local layout membership immediately so source and target layouts reflow live
- snapped layout reflows use a fast position transition so neighboring cards settle instead of jumping
- layout-owned cards require a 10px pointer tear-off before they move freely, newly snapped cards stay docked for 400ms, and torn-off cards wait 400ms before they can snap into a new layout again
- pointer-up commits either a board-level position or a card-relative attachment
- pointer-up on a card keeps the latest snapped layout membership or commits a board-level manual position when no target is active
- dragging a card also moves any tokens attached to that card by recomputing their saved card-relative offsets
- Location cards snap into Location rows, Device cards snap into room Device columns, Actor cards snap into actor rows, and effect cards snap behind Location, Device, or Actor cards
- dropping an energy token over the dispenser panel removes it without restoring a count
- dragging from the dispenser panel creates unlimited Energy tokens or effect cards
- dragging a card or token into the lower-left frame trash area highlights the corner
- dropping a draggable token in the lower-left frame trash area removes it; energy tokens do not track finite stack availability
- dropping a draggable card in the lower-left frame trash area removes that card and bundled local pieces: Location bundles remove Devices, effects, and attached tokens; Device and Actor cards remove their owned effects; Actor cards also remove their matching actor token
- ship titles and Location `lvl` controls are not draggable; the dispenser panel moves only from its handle

### Explicitly deferred

- ghost/silhouette previews
- finer per-index insertion for effect stacks
- collision rules
- combat validation
- multiplayer sync

---

## 8. Overlay Insertion Workflow

Milestone 1 behavior:

- user opens overlay with the `+` button
- user can toggle cards in and out of a staged selection
- user can close the overlay
- `Insert` is visible but disabled to signal deferred behavior

Planned later workflow:

1. Open overlay.
2. Filter/select card entries.
3. Press `Insert`.
4. Add selected entries into the active pane or shared scene staging area.
5. Place inserted items with the same z-band rules as dragged items.

The current component shape keeps this workflow additive instead of requiring a rewrite.

---

## 9. Imported Exiles Location Mapping

The frontend mockup uses local seeded scene data, but each seeded ship location already carries `moduleLocationSlug` so it stays aligned with the normalized Exiles module entries created by the importer.

| Prototype item | Imported location slug |
| --- | --- |
| Player Docking Bay | `docking-bay` |
| Player Cargo Hold | `cargo-hold` |
| Player Reactor | `reactor` |
| Player Engines | `engines` |
| Player Spin Drive | `spin-drive` |
| Player Weapon Station | `weapon-station` |
| Player Missile Bay | `missile-bay` |
| Player Sealed Corridor | `sealed-corridor` |
| Player Crew Quarters | `crew-quarters` |
| Player Life Support | `life-support` |
| Player Cockpit | `cockpit` |
| Player Sensor Array | `sensor-array` |
| Pirate Docking Bay | `pirate-docking-bay` |
| Pirate Cargo Hold | `pirate-cargo-hold` |
| Pirate Crew Quarters | `pirate-crew-quarters` |
| Pirate Spin Drive | `pirate-spin-drive` |
| Pirate Engine Room | `pirate-engine-room` |
| Pirate Reactor | `pirate-reactor` |
| Pirate Shield Generator | `pirate-shield-generator` |
| Pirate Weapons Station | `pirate-weapons-station` |
| Pirate Cockpit | `pirate-cockpit` |

The legacy compatibility location `the-ship` remains in the module as the broad overview page.

---

## 10. Notes For Next Milestone

- Hydrate the seeded scene from imported module locations instead of duplicating summary copy in frontend data.
- Turn `SpaceshipPage` state into a reducer once drag/drop and insertion start mutating multiple slices together.
- Expand the browser-global connector only after the typed operation surface proves useful; natural-language interpretation should stay outside the app until there is a real non-Codex user need.
- Add scene-level selection and focus rules for keyboard accessibility.
- Decide whether actor cards and actor tokens are linked views of the same entity or separate draggable pieces.
