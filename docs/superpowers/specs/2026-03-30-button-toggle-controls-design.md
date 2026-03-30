# Button Toggle Controls Design

Date: 2026-03-30

## Goal

Add two shared button-based controls for the web app:

- `ToggleButton` with explicit pressed and unpressed visual states
- `ButtonRadioGroup` with one active option rendered as pressed and accented

Both controls should be reusable shared primitives and also be presented on `/styleguide` for internal review.

## Scope

In scope:

- Shared React components under `apps/web/src/components/common/`
- Support for color variants: `gold`, `fire`, `monster`, `cloth`, `bone`, `curse`
- Support for sizes: `s`, `m`, `l`
- A styleguide presentation section showing states, colors, and sizes

Out of scope:

- Replacing existing `Button` usage across the app
- Changing app behavior outside the styleguide
- New server or `spec/` contracts

## Design Direction

These controls should inherit the project's tactile comic-book material palette, but they must not reuse the existing tilted `Button` primary silhouette.

Reason:

- The current tilted, skewed primary treatment works for standalone CTAs.
- Adjacent or segmented controls look visually noisy when each button is tilted independently.
- Grouped selection controls need cleaner edges and more consistent alignment.

The new controls will therefore use a straight-edged, compact, tactile treatment built from the existing color language, shadows, borders, and typography, while intentionally avoiding rotation and skew.

## Components

### `ToggleButton`

Purpose:

- Represent a binary selected/unselected state with button semantics.

Behavior:

- Accepts an `active` boolean prop.
- Supports standard button interaction props such as `onClick`, `disabled`, and `type`.
- Applies `aria-pressed` based on `active`.

Visual behavior:

- Inactive state is quieter and flatter, while still clearly interactive.
- Active state appears latched or sunk with stronger active contrast.
- No tilt, skew, or irregular silhouette.
- Color family is selected from the six supported materials.

API shape:

- `color: "gold" | "fire" | "monster" | "cloth" | "bone" | "curse"`
- `size: "s" | "m" | "l"`
- `active?: boolean`

### `ButtonRadioGroup`

Purpose:

- Present a small set of mutually exclusive options using button controls.

Behavior:

- Accepts an array of options with `value`, `label`, and optional `disabled`.
- Accepts `value` and `onValueChange`.
- Only one option is active at a time.
- Active option renders with the active treatment and visually accented fill.

Accessibility:

- Container uses `role="radiogroup"`.
- Each option uses `role="radio"` and `aria-checked`.
- Keyboard interaction should remain button-friendly and accessible through normal tab order in MVP.

Layout:

- Default layout is horizontal with wrap support.
- Adjacent options should appear visually related without requiring perfect edge fusion.
- Spacing should allow groups to work both as a segmented cluster and as a wrapped option row in the styleguide.

## Styling Rules

### Shape and structure

- Straight edges with `rounded-sm`
- No `rotate-*` classes
- No `skew-*` classes
- Hard borders and tactile shadows consistent with the existing system

### Active vs inactive

Inactive:

- Slightly lighter or quieter fill
- Full outer shadow
- Hover can brighten subtly

Active:

- Stronger inner depth or reduced outer shadow
- Slight downward translation is acceptable
- Fill should emphasize the chosen accent color more strongly than the unpressed state

### Group compatibility

- Joined or near-joined buttons must line up cleanly
- Side-by-side controls should feel orderly rather than chaotic
- Visual emphasis must come from color and depth, not from misalignment

## Relationship to existing `Button`

The new controls should build on shared button conventions where useful:

- existing font family
- uppercase treatment
- tactile shadows and borders
- existing palette tokens

But they should not directly reuse the current `solid` tilted variant class map for grouped controls.

Implementation strategy:

- keep the existing `Button` unchanged for current app surfaces
- create separate shared primitives for toggle-style usage
- optionally extract shared non-tilted utility classes if that reduces duplication without destabilizing current buttons

## `/styleguide` presentation

Add a new styleguide section on the existing `/styleguide` page that shows:

- `ToggleButton` inactive and active examples
- a `ButtonRadioGroup` example with one active option
- a color matrix for the six supported materials
- a size matrix for `s`, `m`, and `l`

The styleguide section should be internal-facing and descriptive, matching the existing hidden component playground role of `/styleguide`.

## Error Handling and Edge Cases

- Disabled options must render clearly disabled in both controls.
- Long labels should remain readable and wrap safely without breaking layout.
- If a radio option is already selected, clicking it should keep it selected and avoid toggling the group into an invalid empty state.
- If all options are disabled, the group remains visually present but non-interactive.

## Testing

Add focused web tests for:

- `ToggleButton` active/inactive accessibility attributes
- `ButtonRadioGroup` active option state
- `ButtonRadioGroup` callback behavior when selecting another option
- styleguide rendering coverage only if there is already route-level test coverage for new examples

## Documentation Impact

Update the following if implementation changes the shared primitive inventory or styleguide behavior in a way contributors should know about:

- `docs/04-ui-components.md`
- `docs/17-ui-style-system-penpot-mcp.md`
- `CHANGELOG.md`

## Recommended Implementation Order

1. Add the shared toggle-specific color and size mappings
2. Implement `ToggleButton`
3. Implement `ButtonRadioGroup`
4. Add `/styleguide` examples
5. Add or update tests
6. Update docs and changelog if needed
