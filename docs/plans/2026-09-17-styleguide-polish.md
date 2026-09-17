# Implementation plan: Mighty Decks UI styleguide polish

The goal of this pass should be to make the **generated reference sheet the new visual direction**, while preserving the component APIs where practical. The strongest rule to apply across the refactor is:

> **Paper + ink + stickers + restrained comic depth. Content first; chrome second.**

This is primarily a **shared-component and styleguide refactor**, not a route-by-route reskin. Once the reusable primitives are fixed, existing screens should inherit much of the improvement automatically.

The current code is already structured well for this: the problems are concentrated in shared `Panel`, `Button`, `ButtonRadioGroup`, `FieldShell`, `ImageCard` / `StoryTileCard`, and `Page` chrome.

## Proposed styleguide structure

I would make `/styleguide` a **component directory**, not another visual demo page.

| Page | Purpose |
|:---|:---|
| `/styleguide` | Complete index: every component/page + concise **Use when** description |
| `/styleguide/typography` | Heading, Text, Highlight |
| `/styleguide/colors` | Compact palette/token reference |
| `/styleguide/labels` | Labels |
| `/styleguide/tags` | Tags/status pills |
| `/styleguide/buttons` | Solid, circle, ghost/text-highlight actions |
| `/styleguide/inputs` | TextField, TextArea, form composition |
| `/styleguide/controls` | ToggleButton + segmented controls; existing rocker unchanged |
| `/styleguide/step-navigation` | New StepNavigation |
| `/styleguide/loading` | Loading rings + pending indicators |
| `/styleguide/messages` | Semantic callouts |
| `/styleguide/panel` | Paper surfaces and hierarchy |
| `/styleguide/cards` | Game/card index |
| `/styleguide/media` | ImageCard / StoryTileCard / narrative media surfaces |
| `/styleguide/tokens` | Game tokens |
| `/styleguide/session-chat` | Composite session patterns |

The current overview embeds the entire color ledger and several broad component-rule sections directly in `StyleguideIndexPage`; that is exactly the material I would move out or reduce.

## Implementation sequence

1. **Create one source of truth for the styleguide catalog.**
   - Add something like `components/styleguide/styleguideCatalog.ts`.
   - Each entry contains `title`, `path`, `category`, `useWhen`, optionally `activePaths`, `componentNames`, and `parent`.
   - Categories: Foundations, Actions & Inputs, Feedback, Surfaces & Content, Game Components, Composite Patterns.
   - Make both `StyleguideSectionNav` and `/styleguide` consume this registry instead of maintaining separate hardcoded inventories.
   - Keep secondary/detail pages out of the top styleguide navigation if it becomes too crowded, but include **every styleguide page in the overview** nested under its parent.
   - The current `StyleguideSectionNav` hardcodes its page inventory, so centralizing this also prevents future overview/nav drift.
   - Restyle this internal styleguide navigation with the same lightweight text-highlight treatment described below rather than the current bordered mini-buttons.
2. **Turn** **`/styleguide`** **into the go-to component lookup.**
   - Keep only a short intro and 3–4 compact design principles at the top.
   - Below it, render grouped component links from `styleguideCatalog`.
   - Each entry should show:
     - component/page name,
     - `Use when: ...`,
     - relevant exported primitives, e.g. `TextField · TextArea`,
     - click target to its detailed page.
   - No large component demos here.
   - No full palette ledger.
   - No giant framed blocks around every category.
   - Add a short instruction such as: **“Before adding a new UI pattern, check this index for an existing primitive.”**
   - This makes `/styleguide` useful to both humans and coding agents instead of mainly serving as another style showcase.
3. **Move colors to** **`/styleguide/colors`** **and make the reference compact.**
   - Move the existing `colorFamilies` data out of `StyleguideIndexPage`.
   - Prefer a compact grid where each family occupies a single row/card:
     - `GOLD — Primary`
     - one larger base swatch,
     - small variant swatches alongside it,
     - token name + hex in compact text,
     - one sentence of semantic usage.
   - Display all ten families without requiring a very long page.
   - Keep the current semantic meanings unless intentionally revised.
   - Extract the palette metadata into a styleguide data module so Labels, Buttons, Loading and Colors can all use the same display names rather than maintaining separate arrays.
   - Do **not** duplicate token definitions themselves; Tailwind remains implementation truth.
4. **Build the shared plain-text highlight interaction used by navigation and Ghost buttons.**
   - Create a reusable CSS recipe/component, e.g. `HighlightAction` or `TextHighlight`.
   - Visual behavior:
     - no outer border,
     - no rectangular button background,
     - no box shadow,
     - Iron text,
     - small comfortable hit padding,
     - irregular highlight behind the lower \~50–65% of the text,
     - highlight animates left → right on hover/focus,
     - active navigation keeps its highlight visible.
   - Use a pseudo-element with `background`, `clip-path: polygon(...)`, `transform: scaleX()`, `transform-origin: left`, and a short transition rather than image assets.
   - Support semantic highlight tones: gold default, plus cloth/fire/etc where useful.
   - Keep keyboard focus clearly visible; do not rely on hover color alone.
   - The existing `Highlight` already defines the color mapping and visual language for marker strokes, so share its color resolver or extract the shared mapping rather than creating another independent palette.
5. **Replace the main navigation with the reference-sheet design.**
   - Update `Page.tsx` / `Page.module.css`.
   - Remove desktop use of `button-background-monster.png`, `button-background-gold.png`, etc.
   - Remove skewed tab geometry, text stroke and the illustrated-background layers.
   - Desktop:
     - reduce logo/header footprint,
     - neutral light/paper header,
     - HOME / MODULES / CAMPAIGNS / RULES as `HighlightAction` links,
     - Gold persistent highlight on active route,
     - animated marker highlight on hover/focus,
     - thin structural separator only if needed.
   - Mobile:
     - retain the hamburger behavior,
     - use simple vertically stacked text-highlight links when open,
     - hamburger itself can remain a compact tactile control.
   - Keep routing and responsive behavior unchanged.
   - The current nav explicitly assigns raster assets to every route and uses skew, heavy text stroke and multiple overlay layers, so this should be an actual simplification rather than a re-skin of the current CSS.
   - Once no other references exist, delete the unused `button-background-*.png` files.
6. **Change** **`Button variant="ghost"`** **into the same visual family as navigation.**
   - Preserve `<button>` / `<a>` semantics and existing `href`, disabled, size and color APIs.
   - Replace current outlined rectangle + hard shadow with:
     - transparent background,
     - no border,
     - plain text,
     - animated highlight underneath/on hover,
     - persistent muted highlight for selected/pressed cases if needed.
   - `color` should control the marker highlight rather than turn the whole control into a colored box.
   - Preserve Solid and Circle button variants substantially as they are; those already fit the design.
   - This creates a useful hierarchy:
     - **Solid** = action.
     - **CTA** = exceptional primary action.
     - **Ghost** = lightweight secondary/text action.
7. **Restyle inputs and update form composition.**
   - Keep the good parts of `FieldShell`:
     - parchment/Bone field,
     - 2px Iron edge,
     - overlapping Label,
     - same `sm/md/lg` sizing.
   - Flatten the field slightly:
     - reduce the current inset-bevel effect,
     - use one subtle inset light/shadow rather than making the input look recessed,
     - keep corners small,
     - keep placeholder quieter than real input.
   - Simplify focus:
     - retain the marker/highlight idea,
     - reduce the current very broad focus treatment so it feels like a marker accent rather than an additional frame.
   - Most importantly, change composition rules in `/styleguide/inputs`:
     - field,
     - 8–12px vertical gap,
     - separate `flex` action row below.
   - The current styleguide intentionally uses `gap-0` and attaches Save/Preview/Submit directly to the field edge; reverse that guidance.
   - Show realistic compositions rather than size-matching exercises:
     - Title + Save / Preview,
     - Description + Preview / Submit,
     - validation/helper text,
     - disabled/read-only example.
8. **Restyle segmented controls without touching binary switches.**
   - Refactor `ButtonRadioGroup`, but keep its behavioral API and ARIA semantics.
   - Shared rail:
     - neutral Bone/Steel,
     - one 2px Iron outer edge,
     - one 2–3px hard shadow,
     - no colored end caps.
   - Inactive segments:
     - same neutral surface,
     - simple 1px dividers,
     - no independent shadows,
     - quiet hover highlight.
   - Active segment:
     - semantic colored fill,
     - 2px outline or tiny raised/pressed offset,
     - visually distinct from the shared rail.
   - Disabled state can use reduced opacity/contrast rather than the current hatch unless the hatch proves useful.
   - The current implementation already has one rail, but inactive segments are color-tinted by the group's accent and the rail uses colored end caps; simplify those pieces rather than rewriting its behavior.
   - **Do not create a new BinarySwitch and do not redesign** **`RockerSwitch`** **/** **`Toggle`** **in this pass.**
9. **Replace the heavy** **`Panel`** **frame with the Paper Card treatment.**
   - Keep `Panel` as the shared component for meaningful framed surfaces.
   - Replace:
     - 4px skewed pseudo-frame,
     - broad strong tinted gradients,
     - frame-within-frame feel.
   - With:
     - neutral Bone/paper surface,
     - 1–2px Iron border,
     - 3px hard offset shadow,
     - small radius,
     - optional subtly clipped corner using `clip-path`,
     - minimal/no rotation.
   - Treat `tone` as a restrained accent rather than tinting the whole component strongly. Possible implementation:
     - default surface remains Bone,
     - tone controls a small edge/accent or CSS variable,
     - full semantic color surfaces remain the job of `Message`.
   - Keep `Panel` reserved for major grouped content. Ordinary sections should use spacing and `Section`.
   - The current component creates its character primarily through a separate 4px clipped pseudo-border, so `Panel.module.css` is the main place to simplify.
   - Rewrite `/styleguide/panel` to show:
     - Open Section — explicitly **not** a Panel,
     - Paper Panel,
     - Panel + Label,
     - semantic Message beside it to explain the distinction.
10. **Restyle media cards and add** **`/styleguide/media`.**
    - `ImageCard`:
      - remove the fixed visual feeling of a floating label stuck to the lower-right,
      - use simple Iron edge + hard shadow,
      - allow responsive width/aspect ratio,
      - label can overlap the bottom-left/top-left edge by only a few pixels.
    - `StoryTileCard`:
      - stop relying on a dark full-image gradient and large white title laid over the artwork,
      - let artwork remain clean,
      - move title/summary into a warm caption/content area below,
      - keep metadata as small Labels/Tags,
      - reduce hover movement to something subtle.
    - `StoryTileCard` currently wraps itself in `Panel` and places title over a dark image gradient, while `ImageCard` uses a fixed 300×200 frame with a bottom-right floating Label. Both should converge on the simpler media-card language.
    - Add `/styleguide/media` with:
      - compact image card,
      - narrative/story card,
      - image + caption,
      - metadata/actions example.
    - Keep actual game card components separate under `/styleguide/cards`.
11. **Add reusable** **`StepNavigation`** **and** **`/styleguide/step-navigation`.**
    - Add `components/common/StepNavigation.tsx`.
    - Suggested API:
      - `steps: { id, label, href?, disabled? }[]`
      - `currentStep`
      - optional `onStepChange`
      - `color="gold"` or other accent.
    - Visual:
      - small numbered circles/nodes,
      - 1–2px Iron connector line,
      - tiny label beneath,
      - completed steps muted or Cloth,
      - current step Gold/Monster,
      - future steps Bone/Steel.
    - Semantics:
      - `<nav aria-label="Progress">`,
      - current item gets `aria-current="step"`,
      - links stay links where navigation is possible,
      - noninteractive versions render as status, not fake buttons.
    - Styleguide examples:
      - `START → INVITE → CHOOSE → PLAY`,
      - current first/middle/final step,
      - clickable and display-only variants,
      - mobile wrapping/compact handling.
    - Do not add illustrations to this component.
12. **Update documentation and prevent visual regression.**
    - Update `docs/17-ui-style-system-penpot-mcp.md`; it currently canonizes the heavy Panel and per-route image navigation, so leaving it unchanged would teach future agents to reintroduce the old treatment.
    - Update `docs/04-ui-components.md`.
    - Update `.codex/skills/mighty-decks-ui-patterns/references/styleguide-map.md` and `shared-components.md`.
    - Record the revised principles explicitly:
      - no raster navigation chrome,
      - neutral surfaces first,
      - semantic colors concentrated in accents,
      - ghost action = highlighted text,
      - Panel ≠ default wrapper,
      - form actions below fields,
      - segmented control has one rail,
      - media content dominates its frame.
    - Add the new `Colors`, `Media`, and `StepNavigation` pages to the styleguide map.

## Component-level target state

| Primitive | Change |
|:---|:---|
| `Heading`, `Text`, `Label`, `Tag` | Keep |
| `Highlight` | Keep; share color logic with new text highlight |
| `Button solid` | Keep |
| `Button circle` | Keep |
| `Button ghost` | **Major restyle** → plain text + animated marker |
| `CTAButton` | Keep |
| `TextField`, `TextArea`, `FieldShell` | Flatten and simplify |
| `ButtonRadioGroup` | **Major restyle** → neutral shared rail |
| `ToggleButton` | Keep standalone version mostly intact; simplify when inside radio group |
| `RockerSwitch`, `Toggle` | **No change this pass** |
| `Panel` | **Major restyle** → lightweight paper card |
| `Message` | Keep as semantic callout reference |
| `ImageCard` | Restyle |
| `StoryTileCard` | Restyle |
| `StepNavigation` | **New** |
| `Page` navigation | **Major replacement** |
| `StyleguideSectionNav` | Reuse highlight-link treatment |

## Validation

Treat `/styleguide` as the visual acceptance harness. Test desktop, narrow desktop/tablet and mobile, plus hover, keyboard focus, active and disabled states. Avoid brittle tests that assert Tailwind class strings or exact styling; component tests should cover semantics and behavior—`aria-current`, radio selection, disabled state, link/button behavior—and visual review should happen through the styleguide.

The pass is done when a new contributor can start at `/styleguide`, answer **“which existing component should I use?”** quickly, and the major UI primitives visually match the reference sheet without requiring raster decoration or new one-off CSS.
