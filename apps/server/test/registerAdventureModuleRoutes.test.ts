import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { adventureModulePreviewResponseSchema } from "@mighty-decks/spec/adventureModuleAuthoring";
import { registerAdventureModuleRoutes } from "../src/adventureModule/registerAdventureModuleRoutes";
import { AdventureModuleStore } from "../src/persistence/AdventureModuleStore";

const createApp = async () => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-module-routes-"));
  const store = new AdventureModuleStore({ rootDir });
  await store.initialize();
  const app = Fastify();
  registerAdventureModuleRoutes(app, { store });
  return { app, store };
};

const CREATOR_HEADER = "x-md-module-creator-token";

test("registerAdventureModuleRoutes supports module CRUD and preview", async (t) => {
  const { app } = await createApp();

  t.after(async () => {
    await app.close();
  });

  const createdResponse = await app.inject({
    method: "POST",
    url: "/api/adventure-modules",
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
    payload: {
      source: "blank",
      title: "Route Created Module",
      seedPrompt: "A market city under flood warning.",
    },
  });

  assert.equal(createdResponse.statusCode, 201);
  const createdPayload = createdResponse.json() as {
    index: {
      moduleId: string;
      playerSummaryFragmentId: string;
      storytellerSummaryMarkdown: string;
      playerSummaryMarkdown: string;
      slug: string;
      premise: string;
    };
  };
  const moduleId = createdPayload.index.moduleId;
  const playerSummaryId = createdPayload.index.playerSummaryFragmentId;
  const createdSlug = createdPayload.index.slug;
  assert.equal(Boolean(moduleId), true);
  assert.equal(Boolean(createdSlug), true);
  assert.equal(createdPayload.index.premise.length > 0, true);
  assert.equal(
    createdPayload.index.storytellerSummaryMarkdown.includes("Storyteller Summary"),
    true,
  );
  assert.equal(createdPayload.index.playerSummaryMarkdown.includes("Player Summary"), true);
  const createdActorState = createdPayload as unknown as {
    index: {
      actorCards?: Array<{
        fragmentId: string;
        baseLayerSlug: string;
        tacticalRoleSlug: string;
      }>;
    };
    actors?: Array<{
      actorSlug: string;
      title: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
    }>;
  };
  assert.equal(Array.isArray(createdActorState.index.actorCards), true);
  assert.equal(createdActorState.index.actorCards?.length, 1);
  assert.equal(Array.isArray(createdActorState.actors), true);
  assert.equal(createdActorState.actors?.[0]?.actorSlug, "primary-actor");

  const availableSlugResponse = await app.inject({
    method: "GET",
    url: "/api/adventure-modules/slug-availability?slug=brand-new-module",
  });
  assert.equal(availableSlugResponse.statusCode, 200);
  assert.equal(availableSlugResponse.json().available, true);

  const unavailableSlugResponse = await app.inject({
    method: "GET",
    url: `/api/adventure-modules/slug-availability?slug=${encodeURIComponent(createdSlug)}`,
  });
  assert.equal(unavailableSlugResponse.statusCode, 200);
  assert.equal(unavailableSlugResponse.json().available, false);

  const duplicateCreateResponse = await app.inject({
    method: "POST",
    url: "/api/adventure-modules",
    headers: {
      [CREATOR_HEADER]: "creator-b",
    },
    payload: {
      source: "blank",
      title: "Duplicate Slug",
      slug: createdSlug,
    },
  });
  assert.equal(duplicateCreateResponse.statusCode, 400);
  assert.match(
    duplicateCreateResponse.json().message as string,
    /slug is already in use/i,
  );

  const listResponse = await app.inject({
    method: "GET",
    url: "/api/adventure-modules",
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
  });
  assert.equal(listResponse.statusCode, 200);
  const listPayload = listResponse.json() as {
    modules: Array<{
      moduleId: string;
      ownedByRequester: boolean;
      createdAtIso: string;
      authorLabel: string;
      tags: string[];
      coverImageUrl?: string;
    }>;
  };
  assert.equal(
    listPayload.modules.some((module) => module.moduleId === moduleId),
    true,
  );
  const listedModule = listPayload.modules.find(
    (module) => module.moduleId === moduleId,
  );
  assert.equal(Boolean(listedModule), true);
  assert.equal(typeof listedModule?.createdAtIso, "string");
  assert.equal(listedModule?.authorLabel, "You");
  assert.equal(Array.isArray(listedModule?.tags), true);
  assert.equal(listedModule?.coverImageUrl, undefined);

  const getResponse = await app.inject({
    method: "GET",
    url: `/api/adventure-modules/${moduleId}`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
  });
  assert.equal(getResponse.statusCode, 200);

  const getBySlugResponse = await app.inject({
    method: "GET",
    url: `/api/adventure-modules/by-slug/${encodeURIComponent(createdSlug)}`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
  });
  assert.equal(getBySlugResponse.statusCode, 200);
  assert.equal(
    (getBySlugResponse.json() as { index: { moduleId: string } }).index.moduleId,
    moduleId,
  );

  const getByMissingSlugResponse = await app.inject({
    method: "GET",
    url: "/api/adventure-modules/by-slug/definitely-missing-slug",
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
  });
  assert.equal(getByMissingSlugResponse.statusCode, 404);

  const updateFragmentResponse = await app.inject({
    method: "PUT",
    url: `/api/adventure-modules/${moduleId}/fragments/${playerSummaryId}`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
    payload: {
      content: "# Player Summary\n\nUpdated by route test.",
    },
  });
  assert.equal(updateFragmentResponse.statusCode, 200);

  const forbiddenUpdateResponse = await app.inject({
    method: "PUT",
    url: `/api/adventure-modules/${moduleId}/fragments/${playerSummaryId}`,
    headers: {
      [CREATOR_HEADER]: "creator-b",
    },
    payload: {
      content: "forbidden",
    },
  });
  assert.equal(forbiddenUpdateResponse.statusCode, 403);

  const createActorResponse = await app.inject({
    method: "POST",
    url: `/api/adventure-modules/${moduleId}/actors`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
    payload: {
      title: "River Smuggler Nyra",
    },
  });
  assert.equal(createActorResponse.statusCode, 201);
  const createActorPayload = createActorResponse.json() as {
    actors?: Array<{
      actorSlug: string;
      title: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
    }>;
  };
  assert.equal(
    createActorPayload.actors?.some(
      (actor) => actor.actorSlug === "river-smuggler-nyra",
    ),
    true,
  );

  const updateActorResponse = await app.inject({
    method: "PUT",
    url: `/api/adventure-modules/${moduleId}/actors/river-smuggler-nyra`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
    payload: {
      title: "River Queen Nyra",
      summary: "Smuggler captain with flood-tunnel leverage.",
      baseLayerSlug: "merchant",
      tacticalRoleSlug: "ranger",
      tacticalSpecialSlug: "fast",
      content: "# River Smuggler Nyra\n\nControls the hidden canal routes.",
    },
  });
  assert.equal(updateActorResponse.statusCode, 200);
  const updatedActorPayload = updateActorResponse.json() as {
    actors?: Array<{
      actorSlug: string;
      title: string;
      tacticalSpecialSlug?: string;
    }>;
  };
  const updatedActor = updatedActorPayload.actors?.find((actor) => actor.actorSlug === "river-queen-nyra");
  assert.ok(updatedActor);
  assert.equal(updatedActor.title, "River Queen Nyra");
  assert.equal(updatedActor.tacticalSpecialSlug, "fast");

  const createCounterResponse = await app.inject({
    method: "POST",
    url: `/api/adventure-modules/${moduleId}/counters`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
    payload: {
      title: "Threat Clock",
    },
  });
  assert.equal(createCounterResponse.statusCode, 201);
  const createCounterPayload = createCounterResponse.json() as {
    counters?: Array<{
      slug: string;
      title: string;
      currentValue: number;
    }>;
  };
  assert.equal(
    createCounterPayload.counters?.some(
      (counter) => counter.slug === "threat-clock" && counter.currentValue === 0,
    ),
    true,
  );

  const updateCounterResponse = await app.inject({
    method: "PUT",
    url: `/api/adventure-modules/${moduleId}/counters/threat-clock`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
    payload: {
      title: "Danger Clock",
      iconSlug: "danger",
      currentValue: 9,
      maxValue: 5,
      description: "Escalates the pressure across scenes.",
    },
  });
  assert.equal(updateCounterResponse.statusCode, 200);
  const updatedCounterPayload = updateCounterResponse.json() as {
    counters?: Array<{
      slug: string;
      iconSlug: string;
      currentValue: number;
      maxValue?: number;
    }>;
  };
  const updatedCounter = updatedCounterPayload.counters?.find((counter) => counter.slug === "danger-clock");
  assert.ok(updatedCounter);
  assert.equal(updatedCounter.iconSlug, "danger");
  assert.equal(updatedCounter.currentValue, 5);
  assert.equal(updatedCounter.maxValue, 5);

  const deleteCounterResponse = await app.inject({
    method: "DELETE",
    url: `/api/adventure-modules/${moduleId}/counters/danger-clock`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
  });
  assert.equal(deleteCounterResponse.statusCode, 200);

  const forbiddenActorUpdateResponse = await app.inject({
    method: "PUT",
    url: `/api/adventure-modules/${moduleId}/actors/river-smuggler-nyra`,
    headers: {
      [CREATOR_HEADER]: "creator-b",
    },
    payload: {
      title: "Blocked Update",
      summary: "forbidden",
      baseLayerSlug: "merchant",
      tacticalRoleSlug: "ranger",
      content: "forbidden",
    },
  });
  assert.equal(forbiddenActorUpdateResponse.statusCode, 403);

  const deleteActorResponse = await app.inject({
    method: "DELETE",
    url: `/api/adventure-modules/${moduleId}/actors/river-queen-nyra`,
    headers: {
      [CREATOR_HEADER]: "creator-a",
    },
  });
  assert.equal(deleteActorResponse.statusCode, 200);

  const previewResponse = await app.inject({
    method: "GET",
    url: `/api/adventure-modules/${moduleId}/preview`,
    headers: {
      [CREATOR_HEADER]: "creator-b",
    },
  });
  assert.equal(previewResponse.statusCode, 200);
  const previewPayload = adventureModulePreviewResponseSchema.parse(
    previewResponse.json() as unknown,
  );
  assert.equal(previewPayload.ownedByRequester, false);
  assert.equal(previewPayload.storytellerSummary?.hidden, true);

  const previewRevealResponse = await app.inject({
    method: "GET",
    url: `/api/adventure-modules/${moduleId}/preview?showSpoilers=true`,
    headers: {
      [CREATOR_HEADER]: "creator-b",
    },
  });
  assert.equal(previewRevealResponse.statusCode, 200);
  const revealPayload = adventureModulePreviewResponseSchema.parse(
    previewRevealResponse.json() as unknown,
  );
  assert.equal(revealPayload.showSpoilers, true);
  assert.equal(revealPayload.storytellerSummary?.hidden, false);

  const cloneResponse = await app.inject({
    method: "POST",
    url: `/api/adventure-modules/${moduleId}/clone`,
    headers: {
      [CREATOR_HEADER]: "creator-c",
    },
    payload: {
      title: "Route Clone",
    },
  });
  assert.equal(cloneResponse.statusCode, 201);
  const clonePayload = cloneResponse.json() as {
    index: { moduleId: string; title: string };
  };
  assert.equal(clonePayload.index.title, "Route Clone");
  assert.notEqual(clonePayload.index.moduleId, moduleId);
});
