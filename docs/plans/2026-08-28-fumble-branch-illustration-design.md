# Fumble Branch Illustration Design

## Scope

Improve the existing `Two valid Fumbles` figure on `/rules` without changing the canonical rule text or introducing replacement card artwork.

## Design

Use the canonical Fumble card as the centered source of a compact Y-fork. A visible stem and two branches lead to equal-width `MISS` and `HIT, BUT...` outcomes so the shared cause and alternative resolutions read immediately.

The miss branch stays intentionally spare and narrow: a short statement that the arrow flies wide and causes no useful Effect, without an extra arrow or failure symbol. The wider hit branch contains two balanced consequence pairs: Bandit with Injury, and Hunting Bow with Complication. Every card in the figure uses one larger fixed width so the source and consequences have a consistent visual scale.

The horizontal connector follows the asymmetric branch centers. Its endpoints meet both vertical branch stems without visible gaps, and the branch labels have clear breathing room below it.

On narrow screens the fork becomes a vertical sequence and the consequence pairs stack, preserving reading order and avoiding horizontal overflow without resizing cards. The existing screen-reader summary remains the semantic description of the diagram.

## Alternatives Considered

- Tighten the existing two-column grid: smallest change, but the relationship between the Fumble and both outcomes remains visually ambiguous.
- Use a horizontal left-to-right flow: compact on desktop, but implies the outcomes happen sequentially and degrades poorly on mobile.
- Use a centered Y-fork: clearest cause-and-alternatives structure and the selected approach.

## Verification

- Add a source-level regression assertion for the dedicated fork and consequence-group classes.
- Run the focused illustration test, repository typecheck, and build.
- Inspect `/rules` at desktop and mobile widths and capture screenshots.
