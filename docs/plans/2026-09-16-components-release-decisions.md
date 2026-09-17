# Mighty Decks components release decisions

Recorded 2026-09-16 as preparation for extracting `@mighty-decks/components`.
This record contains no credentials or private rights evidence.

## Repository baseline

| Repository | Commit | Working-tree status when recorded |
| --- | --- | --- |
| Storyteller | `eeb90ed3ec18fd1f136583a239d7ac16835c8d35` | Existing changes in `CHANGELOG.md` and untracked planning documents; preserve them. |
| Exiles | `ac1c8ad3570563204c9fa27f8a798b42326253b3` | Existing changes throughout editor/documentation scaffolding; preserve them. |

## Proposed public identity

- Package: `@mighty-decks/components`
- Initial stable version: `0.1.0`
- Proposed repository basename: `mighty-decks-components`
- npm registry lookup at planning time returned E404. This does not establish scope ownership or permission to publish.
- The exact GitHub owner/repository, npm scope permission, and trusted-publisher identity remain maintainer decisions.

## Inventory and redistribution summary

- Existing local tarball: `mighty-decks-components-0.1.0.tgz`.
- Compressed size: 565,279,683 bytes; unpacked regular files: 569,937,294 bytes.
- Generated PNG catalogue: 795 PNGs / 270,298,042 bytes.
- Existing `assets`: 323 files / 297,148,358 bytes. It includes application-only material, so it is not a release allowlist.
- Runtime redistribution must retain the bundled Kalam and Shantell Sans SIL Open Font License 1.1 texts and their attribution notices.
- Artwork ownership is reported by Tomáš Reichmann (`tomasreichmann@gmail.com`), but the public code, text, and artwork license terms remain unselected. No license is inferred from the assets being present in the application repository.

## Gates and owners

| Gate | Owner | Status | Blocks |
| --- | --- | --- | --- |
| G1 identity | npm scope administrator / Tomáš Reichmann | Open: confirm package availability, scope permissions, GitHub identity, and first version. | Remote setup and publishing. |
| G2 rights | Tomáš Reichmann | Open: select public code/text/artwork license terms and approve the release inventory. | Any public source, archive, or tarball containing uncleared material. |
| G3 size and visuals | Package maintainer | Pending implementation: report real archive sizes, required content, and visual review. | Release candidate. |
| G4 standalone/API | Implementer | Pending implementation: clean checkout, packed-consumer, CLI, and browser checks. | Release candidate. |
| G5 publishing | Release maintainer | Blocked by G1 and first-publication setup. | Consumer migrations. |
| G6 consumers | Consumer maintainers | Blocked by a verified stable package publication. | Retirement of the local workspace package. |

## Publication constraints

The first public publication must use an approved maintainer procedure. An absent public npm package does not prove that tokenless trusted-publisher bootstrap is possible. Do not publish a placeholder, use credentials in repository files, or configure a remote until G1 and G2 have explicit maintainer approval.

Local extraction work may continue while these gates remain open. The release workflow and consumer migrations must remain gated on a verified publication and provenance evidence.
