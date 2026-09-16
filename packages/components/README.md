# Mighty Decks components

English-first React card components, catalog data, CSV exports, original card resources, and static export tooling for Mighty Decks.

```tsx
import "@mighty-decks/components/styles.css";
import { GameCard, ActorCard } from "@mighty-decks/components/react";

<GameCard type="outcome" slug="success" layout="full" />
<GameCard type="outcome" slug="success" layout="compact" />
<ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="thug" />
```

`en` is currently the only accepted locale. IDs are language-neutral; callers must handle an unsupported locale rather than assuming translation. Compact and full layout are independent from output density. Phase-one PNGs are web assets, not print-ready files.

Run `pnpm components:build` and `pnpm components:generate` from this repository. Run `mighty-decks-components copy-static --out ./public` in a consumer; the default component asset base is then `/mighty-decks/assets`. Pass `assetBaseUrl` only when the consumer serves the copied resources elsewhere. Generated resources are derived from the catalog; edit catalog sources rather than output files.

See [the packaged guides](./docs/en/) and [the usage skill](./skills/mighty-decks-components/SKILL.md). Installing the npm package does not automatically install an agent skill.

## Fonts and artwork

The package bundles the original card artwork and local Kalam and Shantell Sans
font files so card faces do not inherit a consumer application's typography.
See [third-party notices](./assets/THIRD-PARTY-NOTICES.md) for the bundled font
licenses.
