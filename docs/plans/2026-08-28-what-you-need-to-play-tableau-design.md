# What You Need to Play Tableau Design

**Date:** 2026-08-28

## Goal

Replace the current `/rules` “What You Need to Play” illustration with a clean
tabletop arrangement matching the supplied mockup. The figure should teach the
component categories through recognizable, canonical cards rather than labels
or explanatory arrows.

## Composition

The tableau uses three visual rows:

1. Shared scene components: Castle Gate Location, Reinforcements Coming Counter
   with a d4 showing 2, and a Guard Actor with the Brute role and a d4 showing 3.
2. Outcome components: a face-down Outcome deck beside a three-card hand showing
   Success, Fumble, and Chaos.
3. Player components: Injury Effect, Marksman Stunt, and a Returning Throwing
   Knife Asset.

The mockup's handwritten labels and arrows are construction notes and must not
appear in the final illustration. Player names, location occupants, and the old
three-player lanes are also omitted.

## Implementation Approach

Use the existing canonical card components and catalog resolution helpers:

- `LocationCard` for Castle Gate.
- `CounterCard` and `DieMarker` for Reinforcements Coming.
- `ActorCard` and `DieMarker` for Guard / Brute.
- `OutcomeCard` for the face-down deck and `ResolvedCard` / `GameCardView` for
  the face-up hand.
- `ResolvedCard` for Injury and Marksman.
- `AssetCard` for the custom Returning Throwing Knife already used elsewhere in
  the rulebook illustrations.

Keep the layout local to the rulebook illustration. Do not introduce a board
controller or duplicate card faces.

## Responsive Behavior

Place the tableau inside a dedicated horizontal-scroll viewport and give the
inner canvas a fixed minimum width of roughly 44–48rem. Cards receive explicit
widths and must not shrink when the rulebook content column is narrow.

The three semantic rows remain intact at small viewport widths. Horizontal
scrolling is preferred over CSS transforms because scaled card text would be
harder to read and transformed dimensions interact poorly with overflow. The
scroll container must not create page-level horizontal overflow.

Print styles should fit the complete tableau within the printable figure rather
than clipping the overflow.

## Accessibility

Provide concise accessible group labels for the shared scene, Outcome deck and
hand, and player components. The visible figure remains free of added labels.
Existing card-level accessible names provide the details within each group.

## Verification

Update the focused source-level illustration test to require the exact cards,
actor role, marker values, and Outcome back. Assert that the removed player
lanes and their old example cards no longer appear in `CompleteTableSetup`.

Run the focused rules illustration test and the web TypeScript check. Browser
verification should confirm that the desktop arrangement matches the mockup and
that a narrow viewport scrolls the tableau without squashing cards or widening
the page.
