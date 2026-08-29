# Selective Rulebook Board Illustrations Design

## Goal

Replace the complex instructional compositions on `/rules` with static board
figures built from the same board and canonical game-piece components taught by
`/styleguide/board`. Use `/backgrounds/board.jpg` as the tabletop surface while
leaving simple card examples and ordinary single-row comparisons unframed.

## Scope

Use static board figures for the seven examples whose meaning depends on
spatial grouping, branching, movement, or layered table state:

| Rulebook example | Why it needs a board | Primary layout treatment |
| --- | --- | --- |
| Complete table setup | Shared scene, deck/hand, and player-owned pieces form one tabletop | Nested layout calculations flattened into rows/stacks |
| Core Action Loop | An Outcome moves through choose, resolve, discard, redraw, and check states | Flex sequence plus a fan or shallow stack for hands |
| Actor initiative | Player order and Actor ownership must read together | Flex slots with stacked owned Actors |
| Zones and range | Locations, occupants, adjacency, and reach are spatial | Flex/column zones with board-positioned overlays |
| Catastrophe flow | A resolved action leads to a replacement hand, trigger, and consequence fork | Flex sequence followed by a flattened branch |
| Distress and Injury thresholds | Two state progressions contain milestones, reversibility, and terminal states | Parallel flex/stack lanes |
| Two valid Fumbles | One source splits into failure or costly-success branches | Flattened source-and-branch composition |

Keep these examples as direct canonical components because a board surface
would add framing without adding meaning:

- the Stunt, Asset, and Consumable floated card examples;
- the Effect equation;
- Physical Asset composition;
- Remaining Toughness;
- Counter tracking.

A fan layout remains appropriate inside a complex board when it communicates an
Outcome hand. It is not a reason to wrap every card row in a board.

## Architecture

Promote the route-local static example wrapper from `StyleguideBoardPage` into
a shared `StaticBoardFigure` component under `components/board`. It will own
`BoardProvider`, a non-interactive `BoardFrame`, and `Board`, while callers own
their fixture data, item renderer, accessible label, and frame sizing.

Add an optional background image to `BoardFrame`. The rulebook passes the
seamlessly tileable `/backgrounds/board.jpg`; other board consumers retain
their current dotted surface by default. The texture fills the complete frame,
including its breathing room around the transformed virtual board.

Create a rulebook-local pure fixture module containing flat `BoardItemInput`
lists for the seven complex figures. Build those lists with the existing
`flexLayout`, `stackLayout`, `deckLayout`, `pileLayout`, and `fanLayout` helpers
where they fit. Compound arrangements may calculate several sub-layouts, but
the final render list stays flat and uses stable semantic ids.

Within each figure, every card item uses one shared width and height, even when
the rendered cards are different canonical component types.

Keep production fixtures independent from `styleguideBoardExamples.ts`. The
styleguide demonstrates the pattern; it is not a production data dependency.
The rulebook renderer will continue using canonical `GameCardView`,
`LocationCard`, `ActorCard`, `CounterCard`, `OutcomeCard`, `Token`, `Label`, and
`DieMarker` components selected by fixture item id.

## Presentation and accessibility

Each board remains a non-interactive `figure`: wheel input scrolls the page,
pointer input does not pan, and the frame fits its bounded virtual board at
desktop, tablet, and phone widths. The wood image is decorative and receives no
separate accessible name.

Captions stay outside the transformed board. Existing ordered-list equivalents
remain screen-reader-only where a diagram communicates sequence or branching.
Visible labels describe rules states rather than layout coordinates. Direct card
examples retain their current float/row behavior and canonical card semantics.

Printing must preserve readable pieces and captions. The implementation should
avoid horizontal page overflow and ensure the board texture prints when browser
background printing is enabled; the rulebook remains understandable when the
decorative texture is omitted.

## Testing

- Test the shared static component for non-interactive framing, item rendering,
  and optional board background without asserting decorative class details.
- Test every rulebook fixture for unique ids, flat placements, board
  containment, and representative order/z-index relationships.
- Test the registry split so exactly the seven approved complex examples use
  the board component and simple rows/floats do not.
- Preserve semantic rules assertions for Catastrophe timing, Fumble branches,
  Distress/Injury thresholds, initiative order, zones/range, and table contents.
- Run the focused web tests and `pnpm check:agent`.
- Verify `/rules` in a browser at desktop, tablet, and phone widths, plus print
  preview, checking scroll behavior, legibility, overflow, broken images, and
  console errors.

## Documentation impact

Update the rules route and board prototype documentation to record selective
static-board usage and the wood surface asset. Add a concise changelog entry.
No `spec`, server, route, environment, or gameplay contract changes are needed.
