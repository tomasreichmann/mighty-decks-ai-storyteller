---
name: mighty-decks-components
description: Use when rendering, exporting, or documenting the reusable Mighty Decks React cards and their catalog resources.
---

# Mighty Decks components

For a source checkout, build with `pnpm components:build` and generate resources with `pnpm components:generate`. Do not edit `generated/`; update the catalog source and regenerate.

For a consumer, import `@mighty-decks/components/styles.css` once and cards from `@mighty-decks/components/react`. Choose `layout="full"` or `layout="compact"` explicitly. Use `ActorCard` and `AssetCard` layer slugs for compositions; use the catalog and CSV files for lookup rather than guessing display text.

Copy static PNG/CSV/docs resources into a site's public directory before linking them from Markdown. Provide meaningful image alt text. MDX can import React cards; ordinary Markdown should link copied PNGs. `en` is the only locale. Preserve original artwork and do not claim the PNGs are print-ready.

Read [the package guide index](../../docs/en/README.md), [guide differences](../../docs/en/guide-differences.md), and [the localization roadmap](../../docs/en/localization-roadmap.md) before changing rules text or adding a locale. Package installation does not install this skill: copy/register this folder in the consuming agent environment only when the consumer chooses to do so.
