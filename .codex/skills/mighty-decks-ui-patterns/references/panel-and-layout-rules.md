# Panel And Layout Rules

## Panel Restraint

- Use `Panel` for route-level frames, main story surfaces, summaries, and grouped guidance.
- Do not wrap every subsection, row, roster item, metadata cluster, or form group in a `Panel`.
- Do not put cards inside cards or panels inside panels unless the inner element is a true repeated card, modal, or framed tool.
- Prefer spacing, hierarchy, `Label`, `Tag`, `Message`, and lighter wrappers before adding another framed surface.
- If a loading or empty state is small, prefer `Message` or unframed centered copy over a heavy panel.

## Layout Wrappers

Raw `div` wrappers are appropriate for:

- Flex/grid layout.
- Spacing stacks.
- Responsive columns.
- Relative/absolute positioning.
- Overlays.
- Truly unique visual compositions such as card fans or image frames.

Avoid raw styled wrappers for:

- Buttons.
- Inputs.
- Badges/chips.
- Callouts.
- Standard framed surfaces.
- Repeated list cards.

## Route Shape

- New views usually start from `main.app-shell`.
- Player-facing surfaces should feel like story tools, not dry dashboards.
- Live session routes should prioritize transcript/table surfaces and keep status/roster/debug chrome subordinate.
- Campaign and module list pages should use shared story-tile/card-grid/search patterns rather than new card systems.

## Abstraction Rule

- If the same styled wrapper appears in 2+ views, promote it to a shared component.
- If it is specific to one component, keep it co-located in that component or CSS module.
- Keep `apps/web/src/styles.css` for global/base styles and cross-app utilities only.
