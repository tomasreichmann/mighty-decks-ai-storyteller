# Sampled reference palette

Source: [palette-reference.png](palette-reference.png) (1672 x 941 pixels).

Use the family-section swatches, including their base swatch, consistently. The top overview repeats the base colors with different shading. Values below are the per-channel RGB median of a 37 x 17 pixel patch centered inside each family swatch, excluding outlines, shadows, and labels. Printed hex values are intentionally ignored.

The UI intentionally overrides sampled Iron with `kac-iron #121B23` and `kac-iron-dark #0B141C` to restore the deep ink contrast in [styleguide-polish-reference.png](styleguide-polish-reference.png). Iron Light remains `#354B5F` for secondary text. The table below retains the original sampled values for provenance. Dark button families use Steel Light text instead of Bone or Curse tints.

Tailwind remains the implementation source of truth in `apps/web/tailwind.config.ts`. Preview with `pnpm dev` at `/styleguide/colors`; no new environment variables.

| Token | Sampled color |
| --- | --- |
| `kac-gold` | `#FDCD37` |
| `kac-gold-light` | `#FEF8C4` |
| `kac-gold-dark` | `#FAAE2F` |
| `kac-gold-darker` | `#D98904` |
| `kac-cloth` | `#3C83FC` |
| `kac-cloth-light` | `#8DACC5` |
| `kac-cloth-lightest` | `#E2EBF0` |
| `kac-cloth-dark` | `#415F93` |
| `kac-bone` | `#EFD9BB` |
| `kac-bone-light` | `#EEDEC8` |
| `kac-bone-dark` | `#B59A79` |
| `kac-bone-darker` | `#9A7F63` |
| `kac-fire` | `#F38112` |
| `kac-fire-light` | `#FDB20E` |
| `kac-fire-lightest` | `#FEEB95` |
| `kac-fire-dark` | `#A6110E` |
| `kac-iron` | `#324355` |
| `kac-iron-light` | `#354B5F` |
| `kac-iron-dark` | `#13202A` |
| `kac-steel` | `#C1CEDA` |
| `kac-steel-light` | `#F7F8F9` |
| `kac-steel-dark` | `#7B8EA6` |
| `kac-blood` | `#CE2225` |
| `kac-blood-light` | `#EC2A34` |
| `kac-blood-lighter` | `#FD8286` |
| `kac-blood-lightest` | `#FDA2A8` |
| `kac-blood-dark` | `#7F2D42` |
| `kac-curse` | `#AB58E4` |
| `kac-curse-light` | `#C778FC` |
| `kac-curse-lighter` | `#E8BCFD` |
| `kac-curse-lightest` | `#FBF0FE` |
| `kac-curse-dark` | `#7202AF` |
| `kac-monster` | `#54BD8C` |
| `kac-monster-light` | `#BDF5C1` |
| `kac-monster-lightest` | `#EAFDBD` |
| `kac-monster-dark` | `#32C045` |
| `kac-skin` | `#FEC7DF` |
| `kac-skin-light` | `#FBD8DE` |
| `kac-skin-dark` | `#F4A4AC` |
