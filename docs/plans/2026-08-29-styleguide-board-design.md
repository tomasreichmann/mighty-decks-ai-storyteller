# Styleguide Board Route Design

**Date:** 2026-08-29

## Goal

Add a hidden `/styleguide/board` route that explains how to compose reusable,
read-only game-board illustrations from the same primitives and canonical game
components used by `/board`, `/spaceship`, and `/rules`.

The page is a teaching reference, not another board editor. It should help a
contributor choose a layout helper, flatten the result into board items, render
canonical cards and tokens, and place the finished composition inside rules or
other explanatory views.

## Chosen Approach

Render real board primitives in non-interactive examples. Each example uses
local fixture data, pure layout helpers, `BoardProvider`, `BoardFrame`, `Board`,
and a custom `renderItem` where canonical game components are required.

Add the smallest shared capability needed for this use case: a read-only mode
on `BoardFrame` that retains measurement, clipping, texture, and viewport
rendering while disabling pointer pan and wheel zoom. Do not introduce a new
board framework, persisted state, drag state, or server API.

This was selected over page-specific CSS mockups, which would drift from the
real board system, and screenshots, which would demonstrate appearance without
teaching composition.

## Route Structure

`/styleguide/board` uses the normal `app-shell` styleguide page shape with
`StyleguideSectionNav`, `Heading`, `Text`, and restrained `Panel` usage. The
page contains five teaching sections:

1. **Board anatomy** explains `BoardProvider`, `BoardFrame`, `Board`, flat board
   items, route-level controls, and `renderItem`.
2. **Layout recipes** shows static results from `flexLayout`, `stackLayout`,
   `deckLayout`, `pileLayout`, and `fanLayout`, with guidance about appropriate
   use and common mistakes.
3. **Canonical game components** places real Locations, game cards, Actors,
   Counters, and Tokens as board items instead of recreating their faces.
4. **Spaceship-derived composition** reduces `/spaceship` to one Location,
   Device, tucked effect stack, energy/actor tokens, and actor group so the page
   can explain ownership, z-order, header peeks, and spacing.
5. **Rules illustration recipe** demonstrates how the same fixture-plus-layout
   approach becomes a bounded, captioned, responsive figure for `/rules` and
   ends with an authoring checklist.

The page is static. It does not expose buttons that change layouts, board
controls, drag handles, persistence controls, or browser-global connectors.

## Composition Model

Examples follow one visible data flow:

`local fixture data -> pure layout helpers -> flat board items -> BoardProvider / Board -> canonical renderItem components`

Layout helpers may compose nested calculations, but their final placements are
flattened before React rendering. Rows, stacks, hands, rooms, and ships must not
be represented by wrapper DOM groups inside the transformed board.

Fixture construction stays in a route-adjacent pure module so its placement and
z-order rules can be tested without rendering React. The fixture module is an
example, not a new public board contract. Future `/rules` figures should follow
the demonstrated pattern and keep their own content close to the rulebook.

## Canonical Components

Use existing card implementations throughout:

- catalog cards resolve through `resolveGameCard` and render with
  `GameCardView` inside `CardBoundary`;
- authored Assets use `AssetCard`;
- Actors and Counters use `ActorCard` and `CounterCard`;
- Locations use `LocationCard` or the exported spaceship Location surface;
- circular markers use `Token`, `EnergyToken`, or `ActorToken` as appropriate;
- the spaceship example reuses exported spaceship card surfaces rather than
  rebuilding their visual treatment.

Labels, captions, and arrows belong outside canonical card faces. Board item
dimensions and layout placement control scale and position.

## Read-only Board Behavior

`BoardFrame` keeps interactive behavior as its default. A new optional
`interactive={false}` mode:

- skips pointer capture and pan updates;
- does not register the wheel listener, allowing normal page scrolling over a
  styleguide example;
- omits interaction-only touch/cursor semantics;
- exposes a non-application group label suitable for a static illustration;
- continues measuring its frame so `BoardProvider` can fit the fixed virtual
  board responsively.

The examples use tightly bounded virtual board sizes, allowing the provider's
existing focus-on-board behavior to refit after measurement without a new
controller effect.

## Responsive and Accessibility Behavior

Each example has a fixed-height or aspect-ratio frame inside the normal content
column. `BoardProvider` refits its virtual board when the frame changes size, so
the same composition remains visible without page-level horizontal overflow.

The page provides a heading, summary, and caption for every example. Static
frames use group semantics rather than `role="application"`; canonical child
components retain their own accessible names. Explanatory copy does not depend
on color or spatial position alone.

## Error Handling

There is no loading state or API error state because all examples use local,
synchronous fixtures. Catalog examples use known card slugs and retain
`CardBoundary` around `GameCardView`. An unresolved fixture card is omitted
rather than replaced with a hand-built imitation.

## Verification

- Extend the focused `BoardFrame` test to lock read-only interaction behavior
  without asserting decorative class details.
- Test the route-adjacent fixture module for flat placements, containment, and
  representative z-order relationships instead of exact full-coordinate
  snapshots.
- Extend styleguide navigation and route-registration tests for
  `/styleguide/board`.
- Add a focused page test that requires all five teaching sections, generic
  layout helper usage, canonical components, and spaceship component reuse.
- Run web typechecking and the repository agent check.
- Use browser verification at desktop and narrow widths to confirm that every
  figure is readable, non-interactive, and contained within the page.

## Documentation Scope

Update the UI component guide and board prototype documentation to list the new
teaching route and its read-only purpose. Add a concise `CHANGELOG.md` entry
under `## [Unreleased]`. No spec, server, environment, or public gameplay
contract changes are required.
