# Planning handoff: separate the Mighty Decks components package

## Purpose

Prepare an implementation plan to move the reusable `@mighty-decks/components`
package out of this application repository into its own public GitHub
repository and publish it as a public npm package. This handoff is for the
planner only; do not implement the migration as part of writing that plan.

Polish and resolve the migration design through read-only inspection. Record
unresolved external decisions with an owner and the implementation step they
block; do not invent repository ownership, publication rights, or registry state.

## Desired consumer experience

`D:/projects/exiles-of-the-hungry-void` must consume a released version using
normal npm/pnpm dependency resolution:

```json
{
  "dependencies": {
    "@mighty-decks/components": "^0.1.0"
  }
}
```

The initial public version is `0.1.0`, selected by the maintainer. Recheck its
availability before publication; resolve any conflict rather than changing it silently.

On a new device, `pnpm install` in Exiles must fetch the package without a
local sibling checkout, a Git commit URL, manual tarball copying, or an
package-source build step. A documented static-resource copy command is
acceptable; installing the runtime must not download or generate the full PNG
catalogue. The normal host application build still applies.

## Current state and inspection starting points

The source paths below are confirmed in the working copy. Recheck them when
planning implementation; the artifact measurements and commit history are
recorded handoff evidence, not fresh verification.

- Source package: `packages/components/` in this repository.
- Current package name/version: `@mighty-decks/components@0.1.0`.
- Public runtime entry points: `.`, `./react`, `./styles.css`, `./export`,
  generated CSV and PNG paths, plus the `mighty-decks-components` CLI.
- The package currently contains React/CSS, local Kalam and Shantell Sans
  fonts, card art, English CSV catalogues, guides, an agent skill, and a full
  generated PNG catalogue.
- The previously packed local artifact was reported as approximately 565 MB because it
  includes 795 generated PNGs. It was independently installed and imported
  successfully in a clean fixture. Remeasure compressed and unpacked sizes;
  this result does not establish that the extracted package is portable.
- Package source currently draws normalized content from this repository's
  `spec/` modules. Its published build has no unresolved app or private-spec
  imports, but the source repository separation must make that independence
  explicit and durable.
- The application currently depends on the workspace package from
  `apps/web/package.json` and imports `@mighty-decks/components/styles.css`.
- The working components implementation and visual export were pushed to
  `mighty-decks-ai-storyteller` `master` in commits `a9d709a` and `eeb90ed`.

| Area | Inspect | Extraction concern |
| --- | --- | --- |
| Package surface | `packages/components/package.json`, `README.md`, `src/cli.ts` | Broad `files` allowlist, `./png/*` export, and `copy-static` currently include generated resources. |
| Catalogues | `packages/components/src/catalog.ts` | Direct imports from `spec/cardComponents.ts`, `actorCards.ts`, `assetCards.ts`, `counterCards.ts`, `rulesCards.ts`, and `cardPresentation.ts`. Trace transitive dependencies too. |
| Generation | `packages/components/scripts/generate.ts`, `scripts/export.ts` | Generation copies artwork from `apps/web/public`; PNG export uses Playwright and Vite. |
| Build and types | `packages/components/vite.config.ts`, `tsconfig.json`, `scripts/write-types.ts` | Vite aliases the private spec, TypeScript extends the monorepo root config, and declarations are written by a script. |
| Storyteller integration | `apps/web/package.json`, `apps/web/src/main.tsx`, `apps/web/src/components/adventure-module/GameCardView.tsx` | Workspace dependency, global stylesheet import, and app adapter. |
| Workspace and guidance | `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `docs/19-contributor-styleguide.md` | Root package commands and guidance must change when the local package is retired. |

Inspect Exiles separately before naming its entry point, package manager,
framework, styles, or validation commands. Do not assume they match Storyteller.

## Direction already chosen

Use a dedicated public GitHub source repository plus public npm publishing.
Use npmjs.com as the default registry so consumers need no registry-specific
configuration. Confirm the GitHub owner/repository and npm scope before fixing
metadata or workflow identities.
Do not make the long-term Exiles dependency a Git URL to this monorepo:
`packages/components` is not the repository root, Git pins are awkward to
manage as releases, and normal semver upgrades are the desired integration.

Use Git tags for releases and GitHub Actions npm trusted publishing/OIDC rather
than storing a long-lived npm publish token. The package should have an exact
public `repository` field and public npm access configuration. Public trusted
publishing can produce npm provenance when the source repository is public.
The planner must verify current GitHub/npm requirements against official
documentation, including first-publication setup, supported tooling, workflow
identity, permissions, and provenance verification. Do not assume configuring a
trusted publisher alone establishes ownership or bootstraps a new package.

## Key design decisions for the plan

1. Split the distributable surface.

   - Publish a small runtime npm package containing JavaScript, declarations,
     CSS, fonts, runtime-needed artwork, CSVs, docs, and skill.
   - Do **not** make the 795-PNG, ~565 MB reference catalogue a mandatory
     runtime dependency.
   - Choose and document one release channel for the full generated PNG set:
     a GitHub Release asset is the preferred initial choice. Evaluate a
     separate `@mighty-decks/components-assets` package only if it materially
     improves consumer ergonomics.
   - Preserve an explicit way to obtain/copy static PNGs for Markdown users.
   - Specify what replaces `./png/*` and how `copy-static` behaves without the
     archive. Keep existing runtime imports, CSV paths, and asset URLs stable
     where possible; document intentional breaks and their versioning impact.
   - Define the archive filename, directory layout, download/copy instructions,
     and manifest linking package version, content version, and checksums.

2. Establish data ownership.

   - The new repository must not import `mighty-decks-ai-storyteller/spec` or
     any application source at build or runtime.
   - Move or duplicate only the pure card contracts/presentation records that
     the package needs; leave Adventure, server, Socket.IO, campaign, and app
     state in their existing repositories.
   - Remove all parent-repository dependencies, including shared build config,
     aliases, artwork copying, scripts, and test fixtures. Prove the new source
     builds in a clean checkout without either consumer repository present.
   - Name the canonical owner of each shared dataset. If duplication is needed
     during migration, define the synchronization check and exit condition;
     avoid leaving two independently edited sources of truth.
   - Plan the compatibility order so this application and Exiles can migrate
     one at a time without broken builds.

3. Protect publication rights and supply chain.

   - Add a repository `LICENSE` and set package metadata (`license`,
     `repository`, `homepage`, `bugs`, `publishConfig`).
   - Verify that all copied card artwork may be redistributed publicly. The
     existing font notices cover SIL OFL fonts, but the artwork notice does not
     establish a public redistribution license.
   - Include third-party notices in the published package.
   - Record rights evidence for code, catalogue text, and each artwork source.
     A code license or font notice does not license unrelated artwork. Keep
     material with unresolved rights out of the public repository, its history,
     npm tarball, and release assets; decide whether omission blocks rendering
     or requires an explicitly scoped replacement.
   - Set up npm trusted publishing from a protected tag/release workflow;
     include provenance and avoid publish credentials in repository secrets.

4. Keep release behavior reproducible.

   - A tag-driven CI workflow must build, typecheck, test, pack, install the
     packed tarball into an isolated fixture, and publish only after those
     checks pass.
   - Publish the exact tarball that passed validation. Pin the package manager,
     supported Node version, lockfile, and PNG-rendering browser/toolchain;
     ensure the tag matches the package version and release commit.
   - Versioning must follow semver. Define whether prereleases use npm tags
     such as `next` and how release notes/changelogs are created.
   - The package's generated static resources must be content-addressed or
     versioned with the release; consumers must not silently get altered card
     content under an existing version.
   - Define release order and recovery for partial publication: archive upload
     failure, npm publish failure, and interrupted reruns. Never overwrite an
     existing version's artifacts; use a corrected version for changed content.

5. Plan both consumer migrations.

   - Replace this repository's workspace dependency with the published package
     after the external release is verified.
   - Update lockfiles, root scripts, documentation, and any resource-copy steps.
     Retire `packages/components/` only after checking all remaining references
     and confirming the consumer build resolves the registry package.
   - Add the dependency and stylesheet import to Exiles, then validate cards
     under its own Vite/Tailwind or other host styles.
   - Include rollback instructions: consumers must be able to pin the prior
     package version if a release regresses rendering.
     For the first migration, retain a known-good consumer commit and lockfile:
     rollback restores its workspace integration in Storyteller or reverts the
     new integration in Exiles. Do not assume an earlier npm release exists.

## Target ownership and migration order

| Location | Owns after migration | Must not require |
| --- | --- | --- |
| New public source repository (owner/name to confirm) | Reusable components, approved catalogue data/artwork, standalone build, tests, docs, skill, release workflow | Either application's source or private spec package |
| `@mighty-decks/components` on npmjs.com | Runtime JS/types/CSS, fonts, required artwork, CSVs, docs, skill, notices, CLI | Full reference PNG archive or browser-based generation at install time |
| Versioned GitHub Release assets | Full reference PNG archive and version/checksum manifest | A sibling checkout to download or copy images |
| Mighty Decks AI Storyteller | Adventure/session/server state, app adapters, dependency and host integration | Local components workspace after migration |
| Exiles of the Hungry Void | Its application behavior, dependency and host integration | Storyteller checkout or private registry credentials |

Sequence the implementation plan as follows:

1. Inventory dependencies and public interfaces; resolve ownership, licensing,
   publication identity, and artifact-size criteria.
2. Prepare the standalone source and runtime/archive split; validate locally
   before introducing any public artifacts.
3. Configure the public repository and release workflow once the rights gate
   passes; validate release checks and first-publication prerequisites.
4. Publish and verify the chosen release and matching archive.
5. Migrate each consumer independently, with its own validation and rollback.
6. Retire the Storyteller workspace package and stale guidance after migration
   checks pass. Preserve app-owned spec modules still used elsewhere.

## Required plan output

The resulting implementation plan must:

- Be saved as `docs/plans/YYYY-MM-DD-mighty-decks-components-package-separation.md`
  in this repository. Keep this handoff separate; the destination repository
  need not exist to complete planning.
- Name exact current and future files/repositories to modify.
- Be divided into small tasks with dependencies, exact files, expected results,
  verification, and suggested commits. Use a failing regression or contract
  test before behavior changes; use direct inspection for metadata/docs-only
  tasks rather than artificial tests.
- Include a migration diagram or table showing source ownership, npm runtime
  package contents, GitHub Release assets, and both consumer repositories.
- Include an explicit artifact-size measurement and a decision gate before any
  public npm publish. No explicit size budget is imposed: report compressed
  and unpacked sizes, enforce applicable registry/host limits, and preserve
  required content.
- Include a licensing/redistribution gate before moving public artwork.
- Include exact verification commands for package build, tarball installation,
  style isolation, static-resource copying, Exiles installation, and release
  provenance.
- Never publish, create a repository, change npm ownership, or alter a
  consumer dependency while merely planning.

For every gate, state the evidence required, responsible owner, and what stops
if it fails. A complete handoff may contain explicit blockers; it must not label
the implementation ready while publication identity or redistribution rights
remain unresolved.

## Verification the implementation plan must specify

Provide exact commands, working directories, prerequisites, and expected results
for each check. Distinguish existing commands from scripts the plan will create.

- **Standalone source:** clean checkout, frozen-lockfile install, build,
  typecheck, tests, and resource generation without parent configs or app files.
- **Packed artifact:** inventory and compressed/unpacked size checks; install
  the tarball outside the workspace; validate public imports, declaration
  resolution, peer dependencies, CSV access, and CLI behavior. Confirm runtime
  installation does not run PNG generation or fetch the archive.
- **Rendering and static files:** verify full/compact cards and composed actors,
  fonts/artwork loading, default and custom asset base URLs, and isolation from
  host styles. Exercise `copy-static` without the PNG archive, then the explicit
  Markdown archive download/copy path and checksum verification.
- **Consumers:** install from the public registry in a clean environment, update
  lockfiles, run each host's checks, and verify representative cards in-browser.
  In Storyteller, prefer `pnpm check:agent` and `pnpm build:agent`; inspect Exiles
  before choosing its commands. Prove neither install relies on a sibling repo.
- **Release:** verify tag/version/commit agreement, public unauthenticated
  download, package metadata, provenance identity, and archive/package manifest
  agreement. Include rerun and rollback checks without republishing a version.

## Maintainer decisions (2026-09-16)

1. Use the suggested public scope/name, `@mighty-decks/components`.
2. Artwork is owned by Tomáš Reichmann (`tomasreichmann@gmail.com`), as confirmed
   by the owner. Public redistribution license terms still need selection.
3. Provide PNGs for all standard Outcomes, Effects, Assets (composable bases,
   modifiers, and medieval packs), Actors (bases, roles, specials, and medieval
   content), Counters, and Stunts (base and medieval). Inventory any missing
   entries before claiming full coverage. Static PNG coverage is separate from
   selecting source artwork needed by the React runtime.
4. Prefer `core` and `medieval` groups when convenient, with complete coverage
   across both and a documented way to obtain them together.
5. Tomáš Reichmann owns the new package/repository. Initial public version:
   `0.1.0`. Registry: npmjs.com. No explicit artifact-size budget.
6. The new package is the source of truth for components and their reusable
   presentation data. Applications retain their own behavior and state.
7. Support PNG images in Markdown and React components in MDX, with documented
   stylesheet and asset-copy setup.

Remaining setup details: exact GitHub account/repository identity, npm scope
permissions and first-publication setup, and code/text/artwork license terms.
Ownership is confirmed; a downstream redistribution license has not yet been
selected. Recheck version availability immediately before publishing.

## Non-goals

- Do not publish the current package during planning.
- Do not automatically install/register the packaged agent skill.
- Do not promise print-ready PDFs, translation packs, a CDN, or a card-image
  generation service.
- Do not move application-specific Adventure/session/server behavior into the
  public package.
