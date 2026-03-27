@AGENTS.md
@docs/19-contributor-styleguide.md

# Claude Code

- Treat the imported files as the canonical shared project instructions.
- Prefer `pnpm` workspace commands from the repo root.
- Run `pnpm typecheck` before wrapping up changes.
- Run `pnpm -C apps/server test` when server behavior changes.
- If you edit `spec/` directly while using split commands, rerun `pnpm -C spec build`.
- Keep Claude-specific additions here short. Put shared rules in `AGENTS.md` or the contributor style guide instead of duplicating them here.
