# Campaign Flow Smoke Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable smoke test that validates the authored module to campaign to session join flow locally and against Render, with true delete cleanup for module, campaign, and session resources.

**Architecture:** Extend the existing shared REST contracts with explicit delete responses, add delete methods to the Adventure Module and Campaign stores using current ownership and locking patterns, and expose those methods through the route registrars. Build one dedicated smoke test that can either boot a temporary local Fastify plus Socket.IO server or target a live base URL, while sharing the same HTTP and socket assertions in both modes.

**Tech Stack:** TypeScript, Fastify, Socket.IO, Node test runner via `tsx`, Zod, PNPM

---

### Task 1: Add failing delete contract tests for Adventure Modules

**Files:**
- Modify: `apps/server/test/registerAdventureModuleRoutes.test.ts`
- Modify: `spec/adventureModuleAuthoring.ts`
- Test: `apps/server/test/registerAdventureModuleRoutes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
  const deleteModuleResponse = await app.inject({
    method: "DELETE",
    url: `/api/adventure-modules/${moduleId}`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
  });
  assert.equal(deleteModuleResponse.statusCode, 200);
  assert.equal(deleteModuleResponse.json().deleted, true);

  const getAfterDeleteResponse = await app.inject({
    method: "GET",
    url: `/api/adventure-modules/${moduleId}`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
  });
  assert.equal(getAfterDeleteResponse.statusCode, 404);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C apps/server test -- --test-name-pattern "registerAdventureModuleRoutes supports module CRUD and preview"`

Expected: FAIL because the `DELETE /api/adventure-modules/:moduleId` route does not exist and the delete response is not implemented.

- [ ] **Step 3: Write minimal shared contract**

```ts
export const adventureModuleDeleteResponseSchema = z.object({
  deleted: z.literal(true),
});
export type AdventureModuleDeleteResponse = z.infer<
  typeof adventureModuleDeleteResponseSchema
>;
```

- [ ] **Step 4: Re-run the same test and keep it failing only on missing route behavior**

Run: `pnpm -C apps/server test -- --test-name-pattern "registerAdventureModuleRoutes supports module CRUD and preview"`

Expected: FAIL with a missing-route or wrong-status failure for the delete call, confirming the contract addition alone is not enough.

- [ ] **Step 5: Commit**

```bash
git add apps/server/test/registerAdventureModuleRoutes.test.ts spec/adventureModuleAuthoring.ts
git commit -m "test: cover adventure module delete route"
```

### Task 2: Add failing delete contract tests for Campaigns and Sessions

**Files:**
- Modify: `apps/server/test/registerCampaignRoutes.test.ts`
- Modify: `spec/campaign.ts`
- Test: `apps/server/test/registerCampaignRoutes.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
  const deleteSessionResponse = await app.inject({
    method: "DELETE",
    url: `/api/campaigns/${created.campaignId}/sessions/${createdSession.sessionId}`,
  });
  assert.equal(deleteSessionResponse.statusCode, 200);
  assert.equal(deleteSessionResponse.json().deleted, true);

  const getDeletedSessionResponse = await app.inject({
    method: "GET",
    url: `/api/campaigns/by-slug/${encodeURIComponent(created.index.slug)}/sessions/${createdSession.sessionId}`,
  });
  assert.equal(getDeletedSessionResponse.statusCode, 404);

  const deleteCampaignResponse = await app.inject({
    method: "DELETE",
    url: `/api/campaigns/${created.campaignId}`,
  });
  assert.equal(deleteCampaignResponse.statusCode, 200);
  assert.equal(deleteCampaignResponse.json().deleted, true);

  const getDeletedCampaignResponse = await app.inject({
    method: "GET",
    url: `/api/campaigns/by-slug/${encodeURIComponent(created.index.slug)}`,
  });
  assert.equal(getDeletedCampaignResponse.statusCode, 404);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C apps/server test -- --test-name-pattern "registerCampaignRoutes supports campaign CRUD and session creation"`

Expected: FAIL because the campaign and session delete routes do not exist yet.

- [ ] **Step 3: Write minimal shared contracts**

```ts
export const campaignDeleteResponseSchema = z.object({
  deleted: z.literal(true),
});
export type CampaignDeleteResponse = z.infer<typeof campaignDeleteResponseSchema>;

export const campaignDeleteSessionResponseSchema = z.object({
  deleted: z.literal(true),
});
export type CampaignDeleteSessionResponse = z.infer<
  typeof campaignDeleteSessionResponseSchema
>;
```

- [ ] **Step 4: Re-run the same test and keep it failing only on missing route behavior**

Run: `pnpm -C apps/server test -- --test-name-pattern "registerCampaignRoutes supports campaign CRUD and session creation"`

Expected: FAIL on the delete route calls rather than schema import errors.

- [ ] **Step 5: Commit**

```bash
git add apps/server/test/registerCampaignRoutes.test.ts spec/campaign.ts
git commit -m "test: cover campaign and session delete routes"
```

### Task 3: Add the failing authored-flow smoke test

**Files:**
- Create: `apps/server/test/campaignFlow.smoke.test.ts`
- Modify: `apps/server/package.json`
- Test: `apps/server/test/campaignFlow.smoke.test.ts`

- [ ] **Step 1: Write the failing smoke test**

```ts
test("campaign flow smoke covers authored module to active session and cleanup", async (t) => {
  const target = await createSmokeTarget();
  t.after(async () => {
    await target.close();
  });

  const stamp = Date.now();
  const creatorToken = `smoke-${stamp}`;
  const moduleTitle = `Smoke Module ${stamp}`;

  const createdModule = await apiJson(target.baseUrl, "/api/adventure-modules", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-md-module-creator-token": creatorToken,
    },
    body: JSON.stringify({
      source: "blank",
      title: moduleTitle,
    }),
  });

  // create actor, counter, asset, location, encounter, quest
  // create campaign
  // create session
  // join storyteller and player over socket.io-client
  // wait for campaign_session_state with status active
  // cleanup session, campaign, and module in finally
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C apps/server exec tsx --test test/campaignFlow.smoke.test.ts`

Expected: FAIL because the helper imports, delete routes, or live/local target support are not fully implemented yet.

- [ ] **Step 3: Add the dedicated smoke script**

```json
"smoke:campaign-flow": "tsx --test test/campaignFlow.smoke.test.ts"
```

- [ ] **Step 4: Re-run the smoke test and keep it failing on runtime behavior**

Run: `pnpm -C apps/server smoke:campaign-flow`

Expected: FAIL during setup or cleanup, proving the smoke path is executing and reaching unimplemented deletion behavior.

- [ ] **Step 5: Commit**

```bash
git add apps/server/test/campaignFlow.smoke.test.ts apps/server/package.json
git commit -m "test: add campaign flow smoke coverage"
```

### Task 4: Implement Adventure Module deletion

**Files:**
- Modify: `apps/server/src/persistence/AdventureModuleStore.ts`
- Modify: `apps/server/src/adventureModule/registerAdventureModuleRoutes.ts`
- Modify: `spec/adventureModuleAuthoring.ts`
- Test: `apps/server/test/registerAdventureModuleRoutes.test.ts`

- [ ] **Step 1: Implement the store delete method**

```ts
  public async deleteModule(options: {
    moduleId: string;
    creatorToken?: string;
  }): Promise<void> {
    await this.withModuleWriteLock(options.moduleId, async () => {
      const loaded = await this.requireStoredModule(options.moduleId);
      this.assertOwnership(loaded.system, options.creatorToken);
      await rm(loaded.moduleDir, { recursive: true, force: true });
    });
  }
```

- [ ] **Step 2: Expose the delete route**

```ts
  app.delete("/api/adventure-modules/:moduleId", async (request, reply) => {
    const creatorToken = parseCreatorToken(request);
    const { moduleId = "" } = request.params as { moduleId?: string };
    try {
      await options.store.deleteModule({
        moduleId,
        creatorToken,
      });
      return reply.send(adventureModuleDeleteResponseSchema.parse({ deleted: true }));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });
```

- [ ] **Step 3: Run the focused route test**

Run: `pnpm -C apps/server test -- --test-name-pattern "registerAdventureModuleRoutes supports module CRUD and preview"`

Expected: PASS

- [ ] **Step 4: Run the full Adventure Module route test file**

Run: `pnpm -C apps/server exec tsx --test test/registerAdventureModuleRoutes.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/persistence/AdventureModuleStore.ts apps/server/src/adventureModule/registerAdventureModuleRoutes.ts spec/adventureModuleAuthoring.ts apps/server/test/registerAdventureModuleRoutes.test.ts
git commit -m "feat: support adventure module deletion"
```

### Task 5: Implement Campaign and Session deletion

**Files:**
- Modify: `apps/server/src/persistence/CampaignStore.ts`
- Modify: `apps/server/src/campaign/registerCampaignRoutes.ts`
- Modify: `spec/campaign.ts`
- Test: `apps/server/test/registerCampaignRoutes.test.ts`

- [ ] **Step 1: Implement session deletion in the store**

```ts
  public async deleteSession(options: {
    campaignId: string;
    sessionId: string;
  }): Promise<void> {
    await this.withSessionWriteLock(options.campaignId, async () => {
      const sessions = await this.readCampaignSessions(options.campaignId);
      const existing = sessions.find((session) => session.sessionId === options.sessionId);
      if (!existing) {
        throw new CampaignSessionNotFoundError("Campaign session not found.");
      }
      await this.writeCampaignSessions(
        options.campaignId,
        sessions.filter((session) => session.sessionId !== options.sessionId),
      );
      await this.touchCampaignMetadata(options.campaignId, new Date().toISOString());
    });
  }
```

- [ ] **Step 2: Implement campaign deletion in the store**

```ts
  public async deleteCampaign(options: { campaignId: string }): Promise<void> {
    await this.withSessionWriteLock(options.campaignId, async () => {
      await this.requireCampaign(options.campaignId);
      await this.contentStore.deleteModule({
        moduleId: options.campaignId,
        creatorToken: sharedCreatorToken,
      });
    });
  }
```

- [ ] **Step 3: Expose the delete routes**

```ts
  app.delete("/api/campaigns/:campaignId", async (request, reply) => {
    try {
      const params = campaignIdParamsSchema.parse(request.params ?? {});
      await options.store.deleteCampaign({ campaignId: params.campaignId });
      return reply.send(campaignDeleteResponseSchema.parse({ deleted: true }));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });

  app.delete("/api/campaigns/:campaignId/sessions/:sessionId", async (request, reply) => {
    try {
      const params = z.object({
        campaignId: z.string().min(1).max(120),
        sessionId: z.string().min(1).max(120),
      }).parse(request.params ?? {});
      await options.store.deleteSession({
        campaignId: params.campaignId,
        sessionId: params.sessionId,
      });
      return reply.send(campaignDeleteSessionResponseSchema.parse({ deleted: true }));
    } catch (error) {
      return sendKnownError(reply, error);
    }
  });
```

- [ ] **Step 4: Run the focused campaign route test**

Run: `pnpm -C apps/server test -- --test-name-pattern "registerCampaignRoutes supports campaign CRUD and session creation"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/persistence/CampaignStore.ts apps/server/src/campaign/registerCampaignRoutes.ts spec/campaign.ts apps/server/test/registerCampaignRoutes.test.ts
git commit -m "feat: support campaign and session deletion"
```

### Task 6: Make the smoke test pass locally and against Render

**Files:**
- Create: `apps/server/test/campaignFlow.smoke.test.ts`
- Modify: `apps/server/package.json`
- Test: `apps/server/test/campaignFlow.smoke.test.ts`

- [ ] **Step 1: Implement the local-or-live smoke target helper inside the test**

```ts
const createSmokeTarget = async () => {
  const liveBaseUrl = process.env.SMOKE_BASE_URL?.trim();
  if (liveBaseUrl) {
    return {
      baseUrl: liveBaseUrl.replace(/\/+$/, ""),
      close: async () => undefined,
    };
  }

  const sourceRootDir = mkdtempSync(join(tmpdir(), "mighty-decks-smoke-source-"));
  const campaignRootDir = mkdtempSync(join(tmpdir(), "mighty-decks-smoke-campaign-"));
  const sourceStore = new AdventureModuleStore({ rootDir: sourceRootDir });
  await sourceStore.initialize();
  const campaignStore = new CampaignStore({
    rootDir: campaignRootDir,
    sourceModuleStore: sourceStore,
  });
  await campaignStore.initialize();
  const app = Fastify();
  registerAdventureModuleRoutes(app, { store: sourceStore });
  const io = new SocketServer(app.server, {
    cors: { origin: true, methods: ["GET", "POST"] },
  });
  registerCampaignSocketHandlers(io as never, campaignStore);
  registerCampaignRoutes(app, { store: campaignStore });
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: async () => {
      io.close();
      await app.close();
    },
  };
};
```

- [ ] **Step 2: Implement the real HTTP and socket smoke flow**

```ts
const storyteller = ioClient(target.baseUrl, { transports: ["websocket"] });
const player = ioClient(target.baseUrl, { transports: ["websocket"] });

storyteller.emit("join_campaign_session_role", {
  campaignSlug,
  sessionId,
  participantId: `storyteller-${stamp}`,
  displayName: "Smoke Storyteller",
  role: "storyteller",
});

player.emit("join_campaign_session_role", {
  campaignSlug,
  sessionId,
  participantId: `player-${stamp}`,
  displayName: "Smoke Player",
  role: "player",
});

const activeState = await waitForSessionState([storyteller, player], (state) => state.status === "active");
assert.equal(activeState.status, "active");
```

- [ ] **Step 3: Implement best-effort cleanup in `finally`**

```ts
  } finally {
    storyteller.disconnect();
    player.disconnect();

    if (campaignId && sessionId) {
      await deleteIfPresent(target.baseUrl, `/api/campaigns/${campaignId}/sessions/${sessionId}`);
    }
    if (campaignId) {
      await deleteIfPresent(target.baseUrl, `/api/campaigns/${campaignId}`);
    }
    if (moduleId) {
      await deleteIfPresent(target.baseUrl, `/api/adventure-modules/${moduleId}`, {
        "x-md-module-creator-token": creatorToken,
      });
    }
  }
```

- [ ] **Step 4: Run the smoke test locally**

Run: `pnpm -C apps/server smoke:campaign-flow`

Expected: PASS

- [ ] **Step 5: Run the smoke test against Render**

Run: `SMOKE_BASE_URL=https://<your-service>.onrender.com pnpm -C apps/server smoke:campaign-flow`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/server/test/campaignFlow.smoke.test.ts apps/server/package.json
git commit -m "test: support local and live campaign smoke flow"
```

### Task 7: Update docs and changelog

**Files:**
- Modify: `docs/14-adventure-module-spec.md`
- Modify: `docs/20-campaign-and-human-storyteller-sessions.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Document Adventure Module deletion**

```md
- `DELETE /api/adventure-modules/:moduleId`
```

- [ ] **Step 2: Document Campaign and Session deletion plus smoke workflow**

```md
- `DELETE /api/campaigns/:campaignId`
- `DELETE /api/campaigns/:campaignId/sessions/:sessionId`
- Live smoke runs can target Render by setting `SMOKE_BASE_URL=https://<service>.onrender.com` and running `pnpm -C apps/server smoke:campaign-flow`.
```

- [ ] **Step 3: Update `CHANGELOG.md`**

```md
## [Unreleased]

### Added
- Add a campaign-flow smoke test that can run locally or against a live Render deployment, covering authored content creation, campaign creation, session activation, and cleanup.

### Changed
- Add true delete endpoints for Adventure Modules, Campaigns, and Campaign Sessions so smoke tests and operators can clean up created records.
```

- [ ] **Step 4: Run targeted doc-adjacent verification**

Run: `pnpm -C apps/server smoke:campaign-flow`

Expected: PASS, confirming the documented command matches reality.

- [ ] **Step 5: Commit**

```bash
git add docs/14-adventure-module-spec.md docs/20-campaign-and-human-storyteller-sessions.md CHANGELOG.md
git commit -m "docs: note campaign flow smoke coverage"
```

### Task 8: Final verification

**Files:**
- Modify: `apps/server/test/registerAdventureModuleRoutes.test.ts`
- Modify: `apps/server/test/registerCampaignRoutes.test.ts`
- Create: `apps/server/test/campaignFlow.smoke.test.ts`
- Modify: `apps/server/src/persistence/AdventureModuleStore.ts`
- Modify: `apps/server/src/persistence/CampaignStore.ts`
- Modify: `apps/server/src/adventureModule/registerAdventureModuleRoutes.ts`
- Modify: `apps/server/src/campaign/registerCampaignRoutes.ts`
- Modify: `spec/adventureModuleAuthoring.ts`
- Modify: `spec/campaign.ts`
- Modify: `apps/server/package.json`
- Modify: `docs/14-adventure-module-spec.md`
- Modify: `docs/20-campaign-and-human-storyteller-sessions.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Run the focused server route tests**

Run: `pnpm -C apps/server exec tsx --test test/registerAdventureModuleRoutes.test.ts test/registerCampaignRoutes.test.ts`

Expected: PASS

- [ ] **Step 2: Run the dedicated smoke test**

Run: `pnpm -C apps/server smoke:campaign-flow`

Expected: PASS

- [ ] **Step 3: Run the package typecheck**

Run: `pnpm -C apps/server typecheck`

Expected: PASS

- [ ] **Step 4: Run the full server test suite if time allows**

Run: `pnpm -C apps/server test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add spec/adventureModuleAuthoring.ts spec/campaign.ts apps/server/src/persistence/AdventureModuleStore.ts apps/server/src/persistence/CampaignStore.ts apps/server/src/adventureModule/registerAdventureModuleRoutes.ts apps/server/src/campaign/registerCampaignRoutes.ts apps/server/test/registerAdventureModuleRoutes.test.ts apps/server/test/registerCampaignRoutes.test.ts apps/server/test/campaignFlow.smoke.test.ts apps/server/package.json docs/14-adventure-module-spec.md docs/20-campaign-and-human-storyteller-sessions.md CHANGELOG.md
git commit -m "feat: add campaign flow smoke test"
```
