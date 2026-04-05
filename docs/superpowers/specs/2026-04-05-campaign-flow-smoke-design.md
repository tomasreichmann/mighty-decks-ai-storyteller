# Campaign Flow Smoke Test Design

## Goal

Add a reusable integration smoke test that proves the authored-content campaign flow end to end:

- create an Adventure Module
- create one authored actor, counter, asset, location, encounter, and quest
- create a Campaign from that module
- create a Session from that campaign
- join the session as one player and one storyteller
- verify the session becomes active
- clean up by truly deleting the session, campaign, and module

The same smoke path must run both locally and against a live Render deployment.

## Scope

In scope:

- server-side delete contracts for Adventure Modules, Campaigns, and Campaign Sessions
- a dedicated server smoke test that uses real HTTP plus real Socket.IO
- local execution against an ephemeral in-process Fastify and Socket.IO server
- live execution against a remote base URL via environment variable
- docs and changelog updates for the new smoke-test workflow

Out of scope:

- browser UI automation
- broader session gameplay coverage
- auth or permission model changes for Campaign APIs
- non-smoke refactors to unrelated routes or persistence code

## Recommended Approach

Use one dedicated smoke test with two execution targets:

1. Local mode
   - Boot a minimal Fastify plus Socket.IO harness inside the test.
   - Register the existing Adventure Module routes, Campaign routes, and Campaign socket handlers.
   - Use temporary local persistence roots.

2. Live mode
   - Point the same test logic at `SMOKE_BASE_URL`.
   - Use timestamped titles and slugs so repeated Render runs do not collide.

This keeps the behavior under test identical while avoiding duplicate local-vs-live scripts.

## Contract Changes

Add true delete endpoints:

- `DELETE /api/adventure-modules/:moduleId`
- `DELETE /api/campaigns/:campaignId`
- `DELETE /api/campaigns/:campaignId/sessions/:sessionId`

Deletion behavior:

- Adventure Module delete requires the existing creator-token ownership check.
- Campaign delete removes the campaign content and any stored sessions in one operation.
- Campaign Session delete removes only that session and updates campaign metadata timestamps.
- Missing resources return the existing not-found error shapes.
- Successful deletes return a small explicit success payload.

## Testing Strategy

Follow TDD:

1. Add failing route tests for the new delete endpoints.
2. Add a failing smoke test that uses those endpoints in cleanup.
3. Implement the minimum store and route code to pass.
4. Run targeted route and smoke verification locally.

Smoke assertions:

- module creation succeeds
- each authored component type can be created
- campaign creation succeeds from the module
- session creation succeeds from the campaign
- storyteller and player can both join via Socket.IO
- session state transitions to `active`
- cleanup deletes session, campaign, and module in that order

## Files Expected To Change

- `spec/adventureModuleAuthoring.ts`
- `spec/campaign.ts`
- `apps/server/src/persistence/AdventureModuleStore.ts`
- `apps/server/src/persistence/CampaignStore.ts`
- `apps/server/src/adventureModule/registerAdventureModuleRoutes.ts`
- `apps/server/src/campaign/registerCampaignRoutes.ts`
- `apps/server/test/registerAdventureModuleRoutes.test.ts`
- `apps/server/test/registerCampaignRoutes.test.ts`
- `apps/server/test/campaignFlow.smoke.test.ts`
- `apps/server/package.json`
- `CHANGELOG.md`
- `docs/14-adventure-module-spec.md`
- `docs/20-campaign-and-human-storyteller-sessions.md`

## Risks And Mitigations

- Real Socket.IO smoke tests can be flaky if event waits are loose.
  - Use explicit state-event wait helpers with timeouts and strong payload checks.
- Live Render runs can leave garbage on partial failure.
  - Use `finally` cleanup with best-effort deletes and timestamped names.
- Delete operations can bypass ownership or locking if implemented ad hoc.
  - Reuse the existing store ownership and write-lock patterns.
