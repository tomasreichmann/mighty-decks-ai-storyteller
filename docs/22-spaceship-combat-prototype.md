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
- Keep the implementation frontend-local with no new shared `spec/` contracts,
  no sockets, and no persistence.

### Existing hidden lab goals

- Keep a hidden, headerless `/spaceship` route for a two-pane ship combat mockup.
- Add a hidden `/styleguide/actor-token` route for the new circular portrait token with labeled states.
- Seed the mockup with Exiles-inspired player and pirate ships, actors, effects, actor tokens, and energy tokens.
- Expand the Exiles importer so ship locations are authored as normalized adventure-module locations instead of living only inside scene prose.

### Non-goals

- Real drag and drop.
- Scene persistence or multiplayer synchronization.
- Combat rules resolution, energy spending logic, or turn orchestration.
- Mutation from the card library overlay into the scene.
- Fetching the spaceship scene from server state.

---

## 2. Route Shape

- `/spaceship`
  - hidden route
  - full-screen, no-header shell with a shared pan/zoom board frame
  - page chrome and card-library overlay stay outside the board; scene content is board-positioned
  - has `Show All`, `Focus Ally Ship`, and `Focus Enemy Ship` controls that fit the viewport to current board items
  - local seeded scene state only
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
| [Effect stacks above top row]        | [Effect stacks above top row]             |
| [Effect headers above Locations]     | [Effect headers above Locations]          |
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
  - builds flat board entries for ship headers, Devices, Location cards, individual effect cards, token rows, and actor cards
  - applies pure spaceship board layout helpers on mount, then fits all items into the board frame
  - keeps route-level controls outside the board transform while the board frame handles pan/zoom and fit actions
- Spaceship board layout helpers
  - compose existing `flexLayout` and `stackLayout` helpers into ship-level board placements
  - place ship, crew, ship, and crew blocks in the scene-level flex column using each block's actual layout bounds, with locations in flex rows, Devices above Locations, effect headers peeking above Locations, and token rows centered over Location cards
  - place actor effect cards and actor cards as separate board items inside each actor row, with each effect card tucked behind the card top using the shared header offset
  - keep ship title items compact so focus bounds follow visible content instead of invisible pane width

### Card and token primitives

- `ShipLocationCard`
  - still offers the old composed local preview, but also exports split board surfaces for the shared board
  - `ShipLocationCardSurface` renders the shared `LocationCard` and adjustable `Tag`-based level pill
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

### Why `zBands` exists before drag/drop

- future drag/drop needs stable ordering separate from visual content
- tokens must always render above cards
- last-touched order still matters within the token layer and within the card layer

The current seeded data already includes `lastTouchedOrder` and `moduleLocationSlug` so later reducer work can attach real interaction without changing the scene shape again.

---

## 6. Layering And Z-Order Rules

- Cards and tokens are separate visual bands.
- Tokens always render above cards.
- Within a band, the most recently dragged item wins z-order.
- Effect stacks render as independent board items, but their positions are derived from their owning location.
- Location effect cards sit behind the Location card and peek above it using a header offset.
- Actor tokens render in Location token rows, and each actor-card Injury or Distress card sits as its own board item centered behind the actor card with the top header offset visible.
- Current card positions are prototype layout behavior, not a public contract; tests should cover helper/API behavior instead of exact coordinates.

This mirrors the intended combat board rules without implementing interaction yet.

---

## 7. Planned Drag/Drop Model

Milestone 2 should follow the pointer-event style already used by `apps/web/src/components/adventure-module/AdventureModuleLocationMapEditor.tsx`.

### Planned approach

- pointer-down captures the dragged entity id and origin
- pointer-move updates local transient position
- pointer-up commits the new position and updates the matching `zBands` order
- cards and tokens use the same interaction model but write into different z-bands
- row-aware effect stacks stay anchored to their parent card instead of becoming freely draggable

### Explicitly deferred

- snapping
- collision rules
- combat validation
- persistence
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
- Add scene-level selection and focus rules for keyboard accessibility.
- Decide whether actor cards and actor tokens are linked views of the same entity or separate draggable pieces.
