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

Run `pnpm components:build` and `pnpm components:generate` from this repository. `mighty-decks-components copy-static --out <directory>` is reserved for copying packaged resources into a consumer's public directory. Generated resources are derived from the catalog; edit catalog sources rather than output files.

See [the packaged guides](./docs/en/) and [the usage skill](./skills/mighty-decks-components/SKILL.md). Installing the npm package does not automatically install an agent skill.
