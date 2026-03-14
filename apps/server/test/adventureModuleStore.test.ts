import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  AdventureModuleForbiddenError,
  AdventureModuleStore,
  AdventureModuleValidationError,
} from "../src/persistence/AdventureModuleStore";

const createStoreWithRoot = async (): Promise<{
  store: AdventureModuleStore;
  rootDir: string;
}> => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-module-store-"));
  const store = new AdventureModuleStore({ rootDir });
  await store.initialize();
  return { store, rootDir };
};

const createStore = async (): Promise<AdventureModuleStore> => {
  const { store } = await createStoreWithRoot();
  return store;
};

test("creates, reads, updates, and previews adventure modules", async () => {
  const store = await createStore();

  const created = await store.createModule({
    creatorToken: "token-a",
    title: "Clock Market Draft",
    seedPrompt: "A flooded market where sirens control district gates.",
  });

  assert.equal(created.ownedByRequester, true);
  assert.equal(created.index.title, "Clock Market Draft");
  assert.equal(created.index.premise.length > 0, true);
  assert.equal(
    created.index.storytellerSummaryMarkdown.includes("Storyteller Summary"),
    true,
  );
  assert.equal(created.index.playerSummaryMarkdown.includes("Player Summary"), true);
  assert.equal(created.fragments.length > 0, true);
  const createdActorState = created as unknown as {
    actors?: Array<{
      actorSlug: string;
      fragmentId: string;
      title: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
      content: string;
    }>;
    index: {
      actorCards?: Array<{
        fragmentId: string;
        baseLayerSlug: string;
        tacticalRoleSlug: string;
      }>;
    };
  };
  assert.equal(Array.isArray(createdActorState.index.actorCards), true);
  assert.equal(createdActorState.index.actorCards?.length, 1);
  assert.equal(Array.isArray(createdActorState.actors), true);
  assert.equal(createdActorState.actors?.length, 1);
  assert.equal(createdActorState.actors?.[0]?.actorSlug, "primary-actor");
  assert.equal(typeof createdActorState.actors?.[0]?.content, "string");

  const fetchedByOwner = await store.getModule(created.index.moduleId, "token-a");
  const fetchedByOther = await store.getModule(created.index.moduleId, "token-b");
  const fetchedBySlug = await store.getModuleBySlug(created.index.slug, "token-a");
  const missingBySlug = await store.getModuleBySlug("missing-module-slug", "token-a");

  assert.ok(fetchedByOwner);
  assert.ok(fetchedByOther);
  assert.ok(fetchedBySlug);
  assert.equal(fetchedByOwner?.ownedByRequester, true);
  assert.equal(fetchedByOther?.ownedByRequester, false);
  assert.equal(fetchedBySlug?.index.moduleId, created.index.moduleId);
  assert.equal(missingBySlug, null);

  const markdownUpdate = "## Player Summary\n\n- Bring daring plans\n- Expect rising flood pressure";
  const storytellerMarkdownUpdate =
    "## Storyteller Summary\n\n- Hidden truth A\n- Escalation vector B";
  const indexUpdated = await store.updateIndex({
    moduleId: created.index.moduleId,
    index: {
      ...created.index,
      storytellerSummaryMarkdown: storytellerMarkdownUpdate,
      playerSummaryMarkdown: markdownUpdate,
    },
    creatorToken: "token-a",
  });
  assert.equal(
    indexUpdated.index.storytellerSummaryMarkdown,
    storytellerMarkdownUpdate,
  );
  assert.equal(indexUpdated.index.playerSummaryMarkdown, markdownUpdate);

  const playerSummaryId = created.index.playerSummaryFragmentId;
  const updated = await store.updateFragment({
    moduleId: created.index.moduleId,
    fragmentId: playerSummaryId,
    content: "# Player Summary\n\nJoin this module and survive the flood sirens.",
    creatorToken: "token-a",
  });

  const updatedPlayerSummary = updated.fragments.find(
    (fragment) => fragment.fragment.fragmentId === playerSummaryId,
  );
  assert.equal(
    updatedPlayerSummary?.content.includes("survive the flood sirens"),
    true,
  );

  await assert.rejects(
    () =>
      store.updateFragment({
        moduleId: created.index.moduleId,
        fragmentId: playerSummaryId,
        content: "blocked",
        creatorToken: "token-b",
      }),
    AdventureModuleForbiddenError,
  );

  const nonOwnerPreview = await store.buildPreview({
    moduleId: created.index.moduleId,
    creatorToken: "token-b",
  });
  assert.equal(nonOwnerPreview.ownedByRequester, false);
  assert.equal(nonOwnerPreview.showSpoilers, false);
  assert.equal(nonOwnerPreview.storytellerSummary?.hidden, true);

  const ownerPreview = await store.buildPreview({
    moduleId: created.index.moduleId,
    creatorToken: "token-a",
  });
  assert.equal(ownerPreview.showSpoilers, true);
  assert.equal(ownerPreview.storytellerSummary?.hidden, false);
});

test("creates and updates actors with stable actor slugs", async () => {
  const store = await createStore();
  const module = await store.createModule({
    creatorToken: "token-actor",
    title: "Actor Module",
  });

  const actorStore = store as unknown as {
    createActor: (input: {
      moduleId: string;
      creatorToken?: string;
      title: string;
    }) => Promise<unknown>;
    updateActor: (input: {
      moduleId: string;
      actorSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
      tacticalSpecialSlug?: string;
      content: string;
    }) => Promise<unknown>;
  };

  const created = (await actorStore.createActor({
    moduleId: module.index.moduleId,
    creatorToken: "token-actor",
    title: "River Smuggler Nyra",
  })) as {
    actors?: Array<{
      actorSlug: string;
      title: string;
      summary?: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
      tacticalSpecialSlug?: string;
      content: string;
    }>;
  };

  const createdActor = created.actors?.find(
    (actor) => actor.actorSlug === "river-smuggler-nyra",
  );
  assert.ok(createdActor);
  assert.equal(createdActor.title, "River Smuggler Nyra");
  assert.equal(typeof createdActor.content, "string");

  const updated = (await actorStore.updateActor({
    moduleId: module.index.moduleId,
    actorSlug: "river-smuggler-nyra",
    creatorToken: "token-actor",
    title: "River Smuggler Nyra, River Queen",
    summary: "Smuggler captain with flood-tunnel leverage.",
    baseLayerSlug: "merchant",
    tacticalRoleSlug: "ranger",
    tacticalSpecialSlug: "fast",
    content: "# River Smuggler Nyra\n\nControls the hidden canal routes.",
  })) as {
    actors?: Array<{
      actorSlug: string;
      title: string;
      summary?: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
      tacticalSpecialSlug?: string;
      content: string;
    }>;
  };

  const updatedActor = updated.actors?.find(
    (actor) => actor.actorSlug === "river-smuggler-nyra",
  );
  assert.ok(updatedActor);
  assert.equal(updatedActor.title, "River Smuggler Nyra, River Queen");
  assert.equal(
    updatedActor.summary,
    "Smuggler captain with flood-tunnel leverage.",
  );
  assert.equal(updatedActor.baseLayerSlug, "merchant");
  assert.equal(updatedActor.tacticalRoleSlug, "ranger");
  assert.equal(updatedActor.tacticalSpecialSlug, "fast");
  assert.equal(
    updatedActor.content,
    "# River Smuggler Nyra\n\nControls the hidden canal routes.",
  );
});

test("actor create and update leave module state unchanged when fragment writes fail", async () => {
  const { store, rootDir } = await createStoreWithRoot();
  const module = await store.createModule({
    creatorToken: "token-actor-write-fail",
    title: "Actor Failure Module",
  });

  const actorStore = store as unknown as {
    createActor: (input: {
      moduleId: string;
      creatorToken?: string;
      title: string;
    }) => Promise<unknown>;
    updateActor: (input: {
      moduleId: string;
      actorSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
      tacticalSpecialSlug?: string;
      content: string;
    }) => Promise<unknown>;
  };

  const createCollisionPath = join(
    rootDir,
    module.index.moduleId,
    "actors",
    "blocked-actor.mdx",
  );
  await mkdir(createCollisionPath, { recursive: true });

  await assert.rejects(
    () =>
      actorStore.createActor({
        moduleId: module.index.moduleId,
        creatorToken: "token-actor-write-fail",
        title: "Blocked Actor",
      }),
  );

  const afterFailedCreate = await store.getModule(
    module.index.moduleId,
    "token-actor-write-fail",
  );
  assert.equal(
    afterFailedCreate?.actors.some((actor) => actor.actorSlug === "blocked-actor"),
    false,
  );

  const primaryActorPath = join(
    rootDir,
    module.index.moduleId,
    "actors",
    "primary-actor.mdx",
  );
  const originalPrimaryActorContent = await readFile(primaryActorPath, "utf8");
  await rm(primaryActorPath, { force: true });
  await mkdir(primaryActorPath, { recursive: true });

  await assert.rejects(
    () =>
      actorStore.updateActor({
        moduleId: module.index.moduleId,
        actorSlug: "primary-actor",
        creatorToken: "token-actor-write-fail",
        title: "Broken Update",
        summary: "This write should fail before state changes persist.",
        baseLayerSlug: "merchant",
        tacticalRoleSlug: "ranger",
        tacticalSpecialSlug: "fast",
        content: "# Broken Update\n\nThis should not persist.",
      }),
  );

  await rm(primaryActorPath, { recursive: true, force: true });
  await writeFile(primaryActorPath, originalPrimaryActorContent, "utf8");

  const afterFailedUpdate = await store.getModule(
    module.index.moduleId,
    "token-actor-write-fail",
  );
  const primaryActor = afterFailedUpdate?.actors.find(
    (actor) => actor.actorSlug === "primary-actor",
  );
  assert.ok(primaryActor);
  assert.equal(primaryActor.title, "Primary Actor");
  assert.equal(primaryActor.baseLayerSlug, "civilian");
  assert.equal(primaryActor.tacticalRoleSlug, "pawn");
  assert.equal(primaryActor.tacticalSpecialSlug, undefined);
  assert.equal(primaryActor.content, originalPrimaryActorContent);

  await rm(createCollisionPath, { recursive: true, force: true });
});

test("clones module under new ownership", async () => {
  const store = await createStore();

  const source = await store.createModule({
    creatorToken: "token-source",
    title: "Source Module",
  });

  const clone = await store.cloneModule({
    sourceModuleId: source.index.moduleId,
    creatorToken: "token-clone",
    title: "Clone Module",
  });

  assert.notEqual(clone.index.moduleId, source.index.moduleId);
  assert.equal(clone.index.title, "Clone Module");
  assert.equal(clone.index.premise.length > 0, true);
  assert.equal(clone.ownedByRequester, true);

  const cloneViewedBySourceOwner = await store.getModule(
    clone.index.moduleId,
    "token-source",
  );
  assert.equal(cloneViewedBySourceOwner?.ownedByRequester, false);
});

test("serializes concurrent writes with module lock", async () => {
  const store = await createStore();
  const module = await store.createModule({
    creatorToken: "token-lock",
    title: "Lock Module",
  });

  const fragmentId = module.index.playerSummaryFragmentId;

  await Promise.all([
    store.updateFragment({
      moduleId: module.index.moduleId,
      fragmentId,
      content: "one",
      creatorToken: "token-lock",
    }),
    store.updateFragment({
      moduleId: module.index.moduleId,
      fragmentId,
      content: "two",
      creatorToken: "token-lock",
    }),
  ]);

  const reloaded = await store.getModule(module.index.moduleId, "token-lock");
  const value = reloaded?.fragments.find(
    (fragment) => fragment.fragment.fragmentId === fragmentId,
  )?.content;

  assert.equal(value === "one" || value === "two", true);
});

test("enforces globally unique slugs", async () => {
  const store = await createStore();
  const created = await store.createModule({
    creatorToken: "token-unique-a",
    title: "The Last Signal",
    slug: "the-last-signal",
  });

  const availability = await store.checkSlugAvailability({ slug: "the-last-signal" });
  assert.equal(availability.available, false);

  await assert.rejects(
    () =>
      store.createModule({
        creatorToken: "token-unique-b",
        title: "Another Module",
        slug: "the-last-signal",
      }),
    AdventureModuleValidationError,
  );

  await assert.rejects(
    () =>
      store.cloneModule({
        sourceModuleId: created.index.moduleId,
        creatorToken: "token-unique-c",
        slug: "the-last-signal",
      }),
    AdventureModuleValidationError,
  );
});

test("loads legacy index without premise and backfills on write", async () => {
  const { store, rootDir } = await createStoreWithRoot();
  const created = await store.createModule({
    creatorToken: "token-legacy",
    title: "Legacy Premise Module",
  });

  const indexPath = join(rootDir, created.index.moduleId, "index.json");
  const legacyIndex = JSON.parse(await readFile(indexPath, "utf8")) as Record<
    string,
    unknown
  >;
  delete legacyIndex.premise;
  await writeFile(indexPath, JSON.stringify(legacyIndex, null, 2), "utf8");

  const loaded = await store.getModule(created.index.moduleId, "token-legacy");
  assert.ok(loaded);
  assert.equal(loaded?.index.premise, loaded?.index.intent);

  await store.updateFragment({
    moduleId: created.index.moduleId,
    fragmentId: created.index.playerSummaryFragmentId,
    content: "# Player Summary\n\nLegacy module updated.",
    creatorToken: "token-legacy",
  });

  const backfilledIndex = JSON.parse(await readFile(indexPath, "utf8")) as Record<
    string,
    unknown
  >;
  assert.equal(typeof backfilledIndex.premise, "string");
  assert.equal(backfilledIndex.premise, backfilledIndex.intent);
});

test("backfills missing actor card metadata for legacy modules", async () => {
  const { store, rootDir } = await createStoreWithRoot();
  const created = await store.createModule({
    creatorToken: "token-legacy-actors",
    title: "Legacy Actor Module",
  });

  const indexPath = join(rootDir, created.index.moduleId, "index.json");
  const legacyIndex = JSON.parse(await readFile(indexPath, "utf8")) as Record<
    string,
    unknown
  >;
  delete legacyIndex.actorCards;
  await writeFile(indexPath, JSON.stringify(legacyIndex, null, 2), "utf8");

  const loaded = (await store.getModule(
    created.index.moduleId,
    "token-legacy-actors",
  )) as unknown as {
    actors?: Array<{
      actorSlug: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
    }>;
  } | null;
  assert.ok(loaded);
  assert.equal(loaded?.actors?.length, 1);
  assert.equal(typeof loaded?.actors?.[0]?.baseLayerSlug, "string");
  assert.equal(typeof loaded?.actors?.[0]?.tacticalRoleSlug, "string");

  const actorStore = store as unknown as {
    updateActor: (input: {
      moduleId: string;
      actorSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
      tacticalSpecialSlug?: string;
      content: string;
    }) => Promise<unknown>;
  };

  await actorStore.updateActor({
    moduleId: created.index.moduleId,
    actorSlug: "primary-actor",
    creatorToken: "token-legacy-actors",
    title: "Primary Actor",
    summary: "Backfilled actor metadata should persist on write.",
    baseLayerSlug: "civilian",
    tacticalRoleSlug: "pawn",
    content: "# Primary Actor\n\nLegacy actor updated.",
  });

  const persistedIndex = JSON.parse(await readFile(indexPath, "utf8")) as {
    actorCards?: Array<{
      fragmentId: string;
      baseLayerSlug: string;
      tacticalRoleSlug: string;
    }>;
  };
  assert.equal(Array.isArray(persistedIndex.actorCards), true);
  assert.equal(persistedIndex.actorCards?.length, 1);
});
