# Spec Build And Plain-Node Runtime Design

## Goal

Build the shared `spec` workspace to JavaScript plus declaration files, update package exports to consume built output, run the server in production with plain `node`, and narrow Render installs to deploy-relevant workspaces.

## Current State

- `spec` exports TypeScript source files directly.
- The server imports runtime values from `@mighty-decks/spec/*`, so built server output still depends on `spec` at runtime.
- Render currently starts the server through `tsx`, which keeps TypeScript in the production runtime path.
- Render installs the whole workspace with `--prod=false`, which includes the root `playwright` dev dependency even though it is unrelated to deploy.

## Chosen Approach

1. Make `spec` a buildable workspace that emits `dist/*.js` and `dist/*.d.ts`.
2. Update `@mighty-decks/spec` package exports to point at built output.
3. Keep `tsx` for local development and tests, but remove it from the production start path.
4. Update local scripts so `spec` is built before commands that need its emitted output.
5. Remove root `playwright` and change Render installs to filtered workspace installs for `web`, `server`, and `spec`.

## Why This Approach

- It fixes the real runtime boundary instead of hiding it behind `tsx`.
- It preserves `spec` as a shared contract package for both web and server.
- It removes the accidental root dependency from deploys without introducing a prune step.
- It keeps the deploy path understandable: install selected workspaces, build selected workspaces, start plain Node.

## Tradeoffs

- Local commands need an emitted `spec/dist` available before server runtime and some typecheck/build flows.
- Without a prune step, selected workspaces still keep build-time dev dependencies on the Render filesystem after build.
- Root and per-app scripts need small adjustments to avoid missing-build failures after a clean install.

## Verification Plan

- Add a failing integration smoke test that proves the built `spec` package exposes runnable JS.
- Add a failing integration smoke test that proves built server output can be imported by plain Node without `tsx`.
- Run targeted server tests, workspace builds, and a plain-Node runtime smoke check after implementation.
