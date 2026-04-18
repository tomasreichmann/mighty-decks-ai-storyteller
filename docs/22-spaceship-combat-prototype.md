# 22 - Spaceship Combat Prototype

Milestone 1 adds a hidden `/spaceship` route as a low-fidelity in-app mockup for Exiles of the Hungry Void ship combat.

It also expands the normalized Exiles adventure module so the ship cards exist as real location entries that later milestones can reuse in authoring and play surfaces.

---

## 1. Scope

### Milestone 1 goals

- Add a hidden, headerless `/spaceship` route for a two-pane ship combat mockup.
- Add a hidden `/styleguide/actor-token` route for the new circular portrait token with labeled states.
- Seed the mockup with Exiles-inspired player and pirate ships, actors, effects, actor tokens, and energy tokens.
- Keep the implementation frontend-local with no new shared `spec/` contracts, no sockets, and no persistence.
- Expand the Exiles importer so ship locations are authored as normalized adventure-module locations instead of living only inside scene prose.

### Milestone 1 non-goals

- Real drag and drop.
- Scene persistence or multiplayer synchronization.
- Combat rules resolution, energy spending logic, or turn orchestration.
- Mutation from the card library overlay into the scene.
- Fetching the spaceship scene from server state.

---

## 2. Route Shape

- `/spaceship`
  - hidden route
  - full-screen, no-header shell
  - local seeded scene state only
- `/styleguide/actor-token`
  - hidden route
  - fit-content shell
  - showcases token tones, labels, and subtitle states

Both routes are intentionally unlinked from primary navigation.

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
| [Effect stacks below bottom row]     | [Effect stacks below bottom row]          |
| [Actor tokens and energy tokens]     | [Actor tokens and energy tokens]          |
|                                      |                                            |
| Actor cards with Injury/Distress     | Actor cards with Injury/Distress          |
| peeking effect stacks along bottom   | peeking effect stacks along bottom        |
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
  - renders the seeded `SpaceshipScene`
  - places the visible `+` trigger
- `ShipPane`
  - renders one ship side
  - owns row grouping and actor-strip placement

### Card and token primitives

- `ShipLocationCard`
  - renders a single ship location
  - shows title, type, level, summary, status, effect stacks, tokens, and image
  - consumes `moduleLocationSlug` so scene items stay aligned with imported module locations
- `ShipEffectStack`
  - renders stacked effect cards
  - supports row-aware top/bottom placement
- `ActorToken`
  - circular portrait token with label and optional subtitle
  - reused in the scene and in `/styleguide/actor-token`
- `EnergyToken`
  - compact token for current energy assignment
- `SpaceshipActorStrip`
  - renders actor cards anchored to the bottom of a pane
  - shows peeking Injury and Distress stacks
- `CardLibraryOverlay`
  - visual-only overlay shell for staged card selection
  - open/close and selection state work in milestone 1
  - `Insert` is intentionally disabled

### Shared UI primitives reused

- `Page`
- `Panel`
- `Button`
- `Text`
- `ActorCard`
- existing modal shell patterns

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
- Effect stacks stay attached to their owning location or actor card; they do not float independently in milestone 1.
- Top-row locations show effect stacks above the card.
- Bottom-row locations show effect stacks below the card.
- Actor-card Injury and Distress stacks sit under the actor card with only the top edge visible.

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
