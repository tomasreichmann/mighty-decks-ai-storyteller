import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { AdventureModuleStore } from "../src/persistence/AdventureModuleStore";
import { CampaignStore } from "../src/persistence/CampaignStore";
import { registerCampaignRoutes } from "../src/campaign/registerCampaignRoutes";

const createApp = async () => {
  const sourceRootDir = mkdtempSync(join(tmpdir(), "mighty-decks-campaign-routes-source-"));
  const campaignRootDir = mkdtempSync(join(tmpdir(), "mighty-decks-campaign-routes-target-"));
  const sourceStore = new AdventureModuleStore({ rootDir: sourceRootDir });
  await sourceStore.initialize();
  const campaignStore = new CampaignStore({
    rootDir: campaignRootDir,
    sourceModuleStore: sourceStore,
  });
  await campaignStore.initialize();
  const app = Fastify();
  registerCampaignRoutes(app, { store: campaignStore });
  return { app, sourceStore };
};

test("registerCampaignRoutes supports campaign CRUD and session creation", async (t) => {
  const { app, sourceStore } = await createApp();

  t.after(async () => {
    await app.close();
  });

  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Flooded Bells",
  });
  await sourceStore.updateActor({
    moduleId: source.index.moduleId,
    actorSlug: "primary-actor",
    creatorToken: "source-owner",
    title: "Bell Runner",
    summary: "Fast enough to slip through rising gates.",
    baseLayerSlug: "civilian",
    tacticalRoleSlug: "pawn",
    isPlayerCharacter: true,
    content: "# Bell Runner\n\nReady for play.",
  });

  const createResponse = await app.inject({
    method: "POST",
    url: "/api/campaigns",
    payload: {
      sourceModuleId: source.index.moduleId,
      title: "Flooded Bells Campaign",
    },
  });
  assert.equal(createResponse.statusCode, 201);
  const created = createResponse.json() as {
    campaignId: string;
    index: { slug: string; title: string };
    actors: Array<{ isPlayerCharacter: boolean }>;
  };
  assert.equal(created.index.title, "Flooded Bells Campaign");
  assert.equal(created.actors.some((actor) => actor.isPlayerCharacter), true);

  const listResponse = await app.inject({
    method: "GET",
    url: "/api/campaigns",
  });
  assert.equal(listResponse.statusCode, 200);
  const listed = listResponse.json() as {
    campaigns: Array<{ campaignId: string; sessionCount: number }>;
  };
  assert.equal(listed.campaigns.length, 1);
  assert.equal(listed.campaigns[0]?.campaignId, created.campaignId);

  const getBySlugResponse = await app.inject({
    method: "GET",
    url: `/api/campaigns/by-slug/${encodeURIComponent(created.index.slug)}`,
  });
  assert.equal(getBySlugResponse.statusCode, 200);

  const updateIndexResponse = await app.inject({
    method: "PUT",
    url: `/api/campaigns/${created.campaignId}/index`,
    payload: {
      index: {
        ...(getBySlugResponse.json() as { index: Record<string, unknown> }).index,
        title: "Flooded Bells Campaign Revised",
      },
    },
  });
  assert.equal(updateIndexResponse.statusCode, 200);
  assert.equal(
    (updateIndexResponse.json() as { index: { title: string } }).index.title,
    "Flooded Bells Campaign Revised",
  );

  const createSessionResponse = await app.inject({
    method: "POST",
    url: `/api/campaigns/${created.campaignId}/sessions`,
    payload: {},
  });
  assert.equal(createSessionResponse.statusCode, 201);
  const createdSession = createSessionResponse.json() as {
    sessionId: string;
    status: string;
  };
  assert.equal(createdSession.status, "setup");

  const listSessionsResponse = await app.inject({
    method: "GET",
    url: `/api/campaigns/by-slug/${encodeURIComponent(created.index.slug)}/sessions`,
  });
  assert.equal(listSessionsResponse.statusCode, 200);
  assert.equal(
    (listSessionsResponse.json() as { sessions: Array<{ sessionId: string }> }).sessions[0]
      ?.sessionId,
    createdSession.sessionId,
  );

  const getSessionResponse = await app.inject({
    method: "GET",
    url: `/api/campaigns/by-slug/${encodeURIComponent(created.index.slug)}/sessions/${createdSession.sessionId}`,
  });
  assert.equal(getSessionResponse.statusCode, 200);
  assert.equal(
    (getSessionResponse.json() as { sessionId: string }).sessionId,
    createdSession.sessionId,
  );

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
});

test("registerCampaignRoutes keeps campaign metadata when updating actors", async (t) => {
  const { app, sourceStore } = await createApp();

  t.after(async () => {
    await app.close();
  });

  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Flooded Bells",
  });
  await sourceStore.updateActor({
    moduleId: source.index.moduleId,
    actorSlug: "primary-actor",
    creatorToken: "source-owner",
    title: "Bell Runner",
    summary: "Fast enough to slip through rising gates.",
    baseLayerSlug: "civilian",
    tacticalRoleSlug: "pawn",
    isPlayerCharacter: true,
    content: "# Bell Runner\n\nReady for play.",
  });

  const createResponse = await app.inject({
    method: "POST",
    url: "/api/campaigns",
    payload: {
      sourceModuleId: source.index.moduleId,
      title: "Flooded Bells Campaign",
    },
  });
  assert.equal(createResponse.statusCode, 201);
  const created = createResponse.json() as {
    campaignId: string;
    actors: Array<{ actorSlug: string }>;
  };
  const actorSlug = created.actors[0]?.actorSlug;
  assert.equal(typeof actorSlug, "string");

  const updateActorResponse = await app.inject({
    method: "PUT",
    url: `/api/campaigns/${created.campaignId}/actors/${actorSlug}`,
    payload: {
      title: "Bell Runner Revised",
      summary: "Faster still through flooded gates.",
      baseLayerSlug: "civilian",
      tacticalRoleSlug: "pawn",
      tacticalSpecialSlug: null,
      isPlayerCharacter: true,
      content: "# Bell Runner Revised\n\nStill ready for play.",
    },
  });
  assert.equal(updateActorResponse.statusCode, 200);
  const updated = updateActorResponse.json() as {
    campaignId?: string;
    sourceModuleId?: string;
    sourceModuleSlug?: string;
    sourceModuleTitle?: string;
    actors: Array<{ actorSlug: string; title: string }>;
  };
  assert.equal(updated.campaignId, created.campaignId);
  assert.equal(updated.sourceModuleId, source.index.moduleId);
  assert.equal(updated.sourceModuleSlug, source.index.slug);
  assert.equal(updated.sourceModuleTitle, source.index.title);
  assert.equal(updated.actors.some((actor) => actor.title === "Bell Runner Revised"), true);
});
