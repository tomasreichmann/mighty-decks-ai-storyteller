# TODO

## Active plans

- [ ] Transition `@mighty-decks/components` from npm to an immutable GitHub Release runtime artifact — the Git tag's source checkout omits `dist/`, so publish the built `mighty-decks-components-0.1.3.tgz` as a release asset (or add a reliable `prepare` build) before switching the Storyteller dependency. Then complete [the Actor/Asset composition plan](./plans/2026-09-17-actor-asset-card-composition.md) with the verified package rulebook headings.

- [ ] [Complete the Mighty Decks components package separation plan](./plans/2026-09-16-mighty-decks-components-package-separation.md) — `@mighty-decks/components@0.1.0` is published and consumer migrations have started, but release artifacts, validation gates, and final consumer acceptance remain outstanding.
