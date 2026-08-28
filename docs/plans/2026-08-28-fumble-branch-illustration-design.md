# Fumble Branch Illustration Design

## Scope

Improve the existing `Two valid Fumbles` figure on `/rules` without changing the canonical rule text or introducing replacement card artwork.

## Design

Use the canonical Fumble card as the centered source of a compact Y-fork. A visible stem and two branches lead to equal-width `MISS` and `HIT, BUT...` outcomes so the shared cause and alternative resolutions read immediately.

The miss branch stays intentionally spare: a short statement that the arrow flies wide and causes no useful Effect. The hit branch contains two balanced consequence pairs: Bandit with Injury, and Hunting Bow with Complication. Each pair uses existing full card components at a readable, consistent scale.

On narrow screens the fork becomes a vertical sequence, preserving reading order and avoiding horizontal overflow. The existing screen-reader summary remains the semantic description of the diagram.

## Alternatives Considered

- Tighten the existing two-column grid: smallest change, but the relationship between the Fumble and both outcomes remains visually ambiguous.
- Use a horizontal left-to-right flow: compact on desktop, but implies the outcomes happen sequentially and degrades poorly on mobile.
- Use a centered Y-fork: clearest cause-and-alternatives structure and the selected approach.

## Verification

- Add a source-level regression assertion for the dedicated fork and consequence-group classes.
- Run the focused illustration test, repository typecheck, and build.
- Inspect `/rules` at desktop and mobile widths and capture screenshots.
