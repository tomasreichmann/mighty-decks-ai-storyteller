# Rulebook Card Clarifications Design

## Scope

Improve the public `/rules` page and its canonical Markdown source with card-led
instructional details and resolved rules wording. The work covers Distress, Stunts,
Assets, Consumables, Defense, Taken Out, Counters, Actor Toughness, Locations, and
heading highlights.

## Source of truth

`docs/mighty-decks-rulebook.md` remains the sole source of public rules prose.
The React rulebook renderer may add component-based illustrations, but must not
duplicate or replace the Markdown rules.

## Presentation

- Reuse existing game-card components for compact rule illustrations; do not add
  raster card art or parallel card shells.
- On desktop, specific-card illustrations float on the right of the relevant
  prose. On narrow screens, they return to normal document flow above the text.
- The shared `Heading` component supplies default highlight colors by semantic
  level: H1 gold, H2 fire, H3 cloth, matching `/styleguide/typography`.
- Remove excess vertical padding from the outer Rules panel while preserving the
  document's internal reading rhythm.

## Rules clarifications

- Rename remaining Dying card references to Taken Out.
- State that a player normally plays one Outcome card on their turn, but may play
  any number of legal Outcome cards when defending during a round.
- Add a Defense example establishing that a defense cannot become an attack unless
  a Stunt explicitly permits it.
- Replace the impossible d4 value of zero in the Toughness figure with a removed
  die marked by a red X.

## Existing visual corrections

- Render matching-width Counter and Actor cards in the Counter comparison.
- Put distinct player and enemy token symbols at the centers of the Location cards
  in the Zones and Range illustration.

## Verification

Add focused source/component tests for heading defaults and the new rulebook
illustrations, run the relevant web tests and `pnpm check:agent`, then inspect
`/rules` and `/styleguide/typography` at desktop and phone widths.
