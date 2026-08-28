# Rulebook Comprehension Visuals Design

## Scope

Improve the public `/rules` page only where the current implementation can hide canonical rules or where the highest-value instructional diagrams materially improve comprehension. This slice covers canonical example preservation, the Core Action Loop, the two valid Fumble outcomes, Actor initiative, Actor Toughness and Counter dice, and medieval Zones and Range.

The following review items remain out of scope: global typography changes, heading hierarchy changes, denser treatment for every example, table-of-contents numbering or scroll tracking, public rulebook renumbering, status ladders, Hidden Actor art, section-margin decoration, and optional opening artwork.

## Source-of-truth decision

`docs/mighty-decks-rulebook.md` remains the sole source of public rules prose. React components may illustrate a section or subsection, but they must never replace its Markdown block.

The current `ruleExampleById` substitution is removed. It duplicates shortened versions of canonical examples and lets `RulesRulebookContent` skip the complete Markdown subsection. The renderer will always emit `RulebookMarkdown` for every block and may then append a registered visual enhancement keyed by the parsed section or subsection ID.

This additive approach is preferred over:

1. Keeping Markdown and TypeScript examples in parity with tests, because two authored copies can drift again.
2. Converting the full rulebook to structured TypeScript, because it is a large migration unrelated to this focused comprehension pass.

## Component design

- Keep `RulesIllustrations.tsx` as the catalog of static, accessible rulebook figures.
- Add a subsection-level registry for the Fumble diagram while retaining the existing section-level registry for larger diagrams.
- Add a rulebook-local `DieMarker` component. It is a visual marker, not a randomizer or interactive control, and supports the d4 values needed by the Toughness and Counter figures.
- Reuse `OutcomeCard`, `ActorCard`, `AssetCard`, `CounterCard`, `LocationCard`, `Token`, `GameCardView`, and `CardBoundary` rather than drawing parallel card shells.
- Use unframed `<figure>` compositions with concise captions. Do not add nested `Panel` surfaces.

## Figure behavior

### Core Action Loop

Show a three-card hand followed by choose card, resolve Effect, discard, draw replacement, and Catastrophe check. It lays out horizontally when space permits and becomes a vertical sequence on narrow screens. The sequence uses an actual Outcome card for the played-card step.

### Two Valid Fumbles

Place one Fumble card above two explicit branches:

- `MISS`: the arrow flies wide and produces no useful Effect.
- `HIT, BUT...`: the arrow causes 1 Injury, while the bow gains a `Broken String` Complication and requires an Action to repair.

The complete canonical example remains immediately adjacent as Markdown, so the diagram summarizes rather than re-authors the rule.

### Actor initiative

Use a responsive top-down/table-ring composition whose readable sequence is `Mira -> Guard -> Wolf -> Aldren -> Bandit -> Tomas`. Guard and Wolf share Mira's initiative slot, making the multiple-Actor rule visible. Actor cards sit physically after/in front of the player whose turn they follow, and decorative arrows are hidden from assistive technology.

### Toughness and Counters

Overlay a d4 marker directly on each Actor card. Show the same Bandit at remaining Toughness `3 -> 1 -> 0 / Taken Out`, with Injury and Distress annotations explaining the changes. The Counter comparison shows an Ice Storm Counter with d4 `3` and target `4` beside a Bandit at remaining Toughness `1`. Its caption states that dice track values and are not rolled.

### Zones and Range

Replace the sci-fi Docking Bay, Cargo Hold, and Crew Quarters with one medieval mini-adventure: Castle Gate, Courtyard, and Tower. Generate three muted, text-free illustrations in a consistent parchment-and-ink style and store them as static web assets under `apps/web/public/rules/locations/`; they therefore do not belong in the adventure-artifact index.

The composition places Mira at the Gate and a Bandit at the Tower, then presents the range legend below the locations: sword in the same zone, throw at +1 zone, bow at +2 zones, and sniper anywhere in sight.

## Accessibility and responsive behavior

- Every figure has a semantic `<figure>` and `<figcaption>`.
- Visual dice expose meaningful labels such as `d4 marker showing 3`; decorative pips and arrows are hidden.
- The textual rule remains available even if a card or image hits its existing error boundary.
- Horizontal flows wrap or stack rather than shrinking card text below legibility.
- Static location art has descriptive alt text and contains no baked-in labels.

## Testing and verification

- Add regression tests proving the canonical Fumble alternatives remain in the parsed public document and that the renderer no longer substitutes a TypeScript example for a Markdown subsection.
- Add focused source/component tests for the new figure registry, DieMarker overlays, exact initiative sequence, medieval locations, and range annotations.
- Run the focused web tests, `pnpm check:agent`, and `pnpm build:agent`.
- Use the local browser workflow to inspect `/rules` at desktop and phone widths, confirm the figures remain readable, check that no text disappears, and verify there are no missing assets or console errors.

## Documentation impact

Update `docs/11-mighty-decks-rules.md` to state the canonical-prose/additive-illustration invariant and add a concise `CHANGELOG.md` entry under `Unreleased`. No `spec` or server contract changes are needed.
