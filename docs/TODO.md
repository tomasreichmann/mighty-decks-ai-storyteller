# TODO

## Active follow-ups

- [ ] Add medieval Actor cards to `/rules/actors` once `@mighty-decks/components` publishes a canonical medieval Actor catalog with explicit grouping metadata.

- [ ] [Rebaseline and implement Git-file distribution](./plans/2026-09-17-components-git-files-distribution.md) from the current Git-pinned component dependency. Generate locally, commit source and selected outputs together, and sync them into consumers at a pinned Git commit. This supersedes npm publication, release archives, and GitHub-side component builds.

## Historical plans

- [Components package separation](./plans/2026-09-16-mighty-decks-components-package-separation.md) is superseded by Git-file distribution; its npm, release-archive, and GitHub workflow gates are retired.

- [Actor/Asset card composition](./plans/2026-09-17-actor-asset-card-composition.md) is partially implemented. Its local rulebook-mirror workflow was retired when `/rules` began importing the package rulebook directly; track any remaining upstream rulebook-copy work in the components repository instead.
