# Local Default Port Design

**Date:** 2026-03-16

## Goal

Change the zero-config local development default server port from `8080` to `8081` so a common local conflict does not block startup.

## Decision

Use a repo-wide local default of `8081` anywhere the app assumes the server origin in split web/server development.

## Scope

- Server env parsing fallback
- Web local-dev server URL fallback
- Environment example and contributor docs
- Changelog entry

## Non-Goals

- No change to deployed same-origin behavior
- No auto-port discovery or random fallback selection
- No change to explicit `PORT` or `VITE_SERVER_URL` overrides

## Safety

- Render deployment remains safe because the server already honors the injected `PORT` env var.
- Local behavior stays zero-config because the client and server defaults move together.
