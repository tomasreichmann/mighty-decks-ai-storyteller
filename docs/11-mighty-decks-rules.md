# Mighty Decks rules

The package-owned English rulebook is imported directly by the public `/rules` route from the pinned `@mighty-decks/components` Git dependency. The package is the source of truth for core gameplay; this repository keeps no checked-in copy.

When intentionally updating the package SHA, review the canonical rulebook in the installed package. The fast-session prompt remains package reference material and is not injected into server prompts.

The public `/rules` route renders its reader-facing canonical Markdown as one anchored, printable rulebook page. The Markdown contains reader-facing copy only; Quick Reference is section 28. The parser also strips a contiguous production illustration brief as defense in depth should one be introduced accidentally.

The generated canonical Markdown remains authoritative for all reader-facing prose and examples in this consumer. Component-composed diagrams are additive enhancements keyed to public section or subsection anchors; they must not replace or shorten the matching Markdown block. Compact diagram cards are used where full card rules would be unreadable; shared full cards remain the source for physical card-composition examples. The visual set covers the Core Action Loop, two valid Fumbles, Actor initiative, Toughness and Counter markers, status thresholds, complete table setup, physical Asset composition, Catastrophe consequences, and overlaid range reach. Long-form typography and halftone adjustments are scoped to `/rules`.

Concise summaries may link to or index the rulebook, but they must not become competing rules sources. When a repository document, skill, example, or shared card conflicts with the rulebook, follow the rulebook and update the stale source. Product-scope documents may describe features that are not implemented yet; that implementation scope does not redefine the tabletop rules.

The `/rules/outcomes`, `/rules/effects`, `/rules/stunts`, and `/rules/assets` tabs remain component-reference pages. `/rules/ship-combat` is a separate prototype reference; it is not part of the canonical core rulebook unless the product owner explicitly makes that rules change.

The standalone [card-component catalog](mighty-decks-card-components.md) is generated from the shared `spec/` exports with `pnpm docs:cards`. Regenerate and commit it whenever card copy or a composable Actor, Asset, or Counter catalog changes; do not edit the generated Markdown directly.
