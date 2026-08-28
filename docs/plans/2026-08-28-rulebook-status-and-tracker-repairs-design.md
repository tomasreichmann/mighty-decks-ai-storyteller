# Rulebook Status and Tracker Repairs Design

## Scope

Repair four instructional figures on the public `/rules` page without changing
their underlying rules: Distress and Injury thresholds, Physical Asset
composition, Remaining Toughness, and Counter tracking.

## Status thresholds

Replace the repeated-card grid with two full-width milestone lanes. Distress
reads `0–2 OK -> 3 Distress + Panicked -> 4 Distress + Hopeless`; Injury reads
`0–3 OK -> 4 Injury + Taken Out`. Use the existing catalog-backed Effect cards,
stack the lanes vertically, and include backward recovery cues for Distress.
Intermediate ranges stay compact while the threshold card pairs receive the
strongest visual emphasis.

Rename the catalog's existing `Dying` Effect card to `Taken Out` and reuse its
current artwork. This aligns the component catalog with the canonical rulebook,
which treats Taken Out as the normal maximum-Injury state rather than automatic
death.

## Physical Asset composition

Keep the Returning Throwing Knife and plus sign, but replace the unavailable
`Sharpshooter` lookup with the catalog-backed `Marksman` Stunt. The current
Sharpshooter row has a count of zero and is intentionally excluded from the
runtime rules catalog, which causes the illustration to render nothing.

## Dice markers and tracking figures

Render the d4 value or removed X in the marker's existing foreground layer,
above the absolutely positioned die face. A removed marker uses a muted face
and a large red X, while active markers show their numeric value clearly.

Position rulebook d4 markers over the upper-right card corner rather than mostly
outside the card. Remaining Toughness keeps three equal-width states. Counter
tracking uses a dedicated two-column grid with both card compositions aligned to
their top edge; it does not inherit the generic figure's vertical centering.

## Responsive and accessible behavior

Milestone lanes may wrap into labelled rows on narrow screens but must not cause
page-level horizontal overflow. Ordered-list text exposes the complete status
sequences to assistive technology. Dice markers retain descriptive `aria-label`
text, including the removed state.

## Verification

Add focused rendering/source assertions for the renamed Taken Out card, visible
threshold cards, the catalog-backed Marksman card, d4 value/removal layering,
top-aligned tracking layout, and marker overlap. Run the relevant web tests and
the repository agent check, then inspect `/rules` at desktop and phone widths.
