# Shared Components

Prefer these before writing custom styled elements.

| Need | Use |
| --- | --- |
| Standard action | `Button` |
| Highest-emphasis solo CTA | `CTAButton` |
| Major framed route block | `Panel` |
| Semantic content grouping | `Section` |
| Page or section title | `Heading` |
| Body, helper, note, quote, or emphasized text | `Text` |
| Sticker-like badge or compact heading | `Label` |
| Read-only chip or status pill | `Tag` |
| Editable chip row | `Tags` |
| Connection/presence status | `ConnectionStatusPill` |
| Semantic callout, empty state, warning, or info | `Message` |
| Single-line input | `TextField` |
| Multiline input | `TextArea` |
| Grouped stateful option | `ToggleButton` |
| Single-select segmented choice | `ButtonRadioGroup` |
| Toy-like binary control | `RockerSwitch` |
| Circular table marker or actor/energy token | `Token` |
| Destructive confirmation | `ConfirmationDialog` |

## Button Rules

- Use `Button` for all ordinary click actions, including `href` links.
- Use `variant="circle"` for compact icon-only or symbol-only actions; provide `aria-label` and `title`.
- Use `CTAButton` only for the one strongest page-level action.
- Use `ToggleButton`, `ButtonRadioGroup`, or `RockerSwitch` for grouped controls so rows stay aligned.

## Tone Rules

- `gold`: primary action and lead emphasis.
- `cloth`: information and guidance.
- `bone`: muted/secondary surfaces.
- `fire`: warning and attention.
- `blood`: destructive or irreversible action.
- `curse`: error or invalid state.
- `monster`: success or confirmation.
- `steel`: mechanical/system cues.
- `skin`: character-facing warmth.
- `iron`: high-contrast special cases.

## Typography Rules

- Use `Heading` for semantic page and section headings.
- Use `Text` variants for body copy, notes, quotes, and local headings.
- Do not repeatedly restyle raw `h*` or `p` tags inside route components.
- Use `Label` and `Tag` for chips/stickers, not paragraph text in rounded boxes.
