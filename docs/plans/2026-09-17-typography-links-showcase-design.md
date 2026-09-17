# Typography Links Showcase Design

## Goal

Make the typography styleguide the single visual reference for text links as
well as headings, labels, and copy.

## Decision

Add one restrained `Links` section to `/styleguide/typography`. It will show an
inline prose link and the shared `Button` ghost-link treatment in representative
semantic tones. The showcase uses internal styleguide destinations so it remains
safe and useful as a local visual reference.

## Rationale

Keeping the examples on the typography page makes link hierarchy easy to check
beside the text scale. Reusing `Button variant="ghost"` preserves the shared
semantic link behavior and current hover/focus marker treatment instead of
introducing a new link primitive or page-specific styling.

## Scope

- Modify the typography styleguide route and its focused component test.
- Keep all typography samples unframed and use the darker Steel token for the
  base Steel heading highlight.
- Update the typography styleguide documentation and unreleased changelog.
- No public route, component API, or runtime behavior changes.
