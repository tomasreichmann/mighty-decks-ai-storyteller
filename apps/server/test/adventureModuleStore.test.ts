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

test("updates actor, counter, and asset slugs when titles change", async () => {
  const { store, rootDir } = await createStoreWithRoot();
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
    title: "River Queen Nyra",
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

  const updatedActor = updated.actors?.find((actor) => actor.actorSlug === "river-queen-nyra");
  assert.ok(updatedActor);
  assert.equal(updatedActor.title, "River Queen Nyra");
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

  const moduleDirEntries = await readFile(
    join(rootDir, module.index.moduleId, "index.json"),
    "utf8",
  );
  assert.match(moduleDirEntries, /actors\/river-queen-nyra\.mdx/);
  await assert.rejects(
    () => readFile(join(rootDir, module.index.moduleId, "actors", "river-smuggler-nyra.mdx"), "utf8"),
    { code: "ENOENT" },
  );
  const renamedActorFile = await readFile(
    join(rootDir, module.index.moduleId, "actors", "river-queen-nyra.mdx"),
    "utf8",
  );
  assert.match(renamedActorFile, /Controls the hidden canal routes/);

  const entityStore = store as unknown as {
    createCounter: (input: {
      moduleId: string;
      creatorToken?: string;
      title: string;
    }) => Promise<{
      counters: Array<{
        slug: string;
        title: string;
        iconSlug: string;
        currentValue: number;
        maxValue?: number;
        description?: string;
      }>;
    }>;
    updateCounter: (input: {
      moduleId: string;
      counterSlug: string;
      creatorToken?: string;
      title: string;
      iconSlug: string;
      currentValue: number;
      maxValue?: number;
      description: string;
    }) => Promise<{
      counters: Array<{
        slug: string;
        title: string;
        iconSlug: string;
        currentValue: number;
        maxValue?: number;
        description?: string;
      }>;
    }>;
    createAsset: (input: {
      moduleId: string;
      creatorToken?: string;
      title: string;
    }) => Promise<{
      assets: Array<{
        assetSlug: string;
        title: string;
        summary?: string;
        baseAssetSlug: string;
        modifierSlug?: string;
        content: string;
      }>;
    }>;
    updateAsset: (input: {
      moduleId: string;
      assetSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      baseAssetSlug: string;
      modifierSlug?: string;
      content: string;
    }) => Promise<{
      assets: Array<{
        assetSlug: string;
        title: string;
        summary?: string;
        baseAssetSlug: string;
        modifierSlug?: string;
        content: string;
      }>;
    }>;
  };

  const createdCounter = await entityStore.createCounter({
    moduleId: module.index.moduleId,
    creatorToken: "token-actor",
    title: "Threat Clock",
  });
  assert.equal(
    createdCounter.counters.some((counter) => counter.slug === "threat-clock"),
    true,
  );

  const updatedCounterState = await entityStore.updateCounter({
    moduleId: module.index.moduleId,
    counterSlug: "threat-clock",
    creatorToken: "token-actor",
    title: "Danger Clock",
    iconSlug: "danger",
    currentValue: 2,
    maxValue: 4,
    description: "Escalates the scene threat.",
  });
  const updatedCounter = updatedCounterState.counters.find(
    (counter) => counter.slug === "danger-clock",
  );
  assert.ok(updatedCounter);
  assert.equal(updatedCounter.title, "Danger Clock");
  assert.equal(updatedCounter.currentValue, 2);
  assert.equal(updatedCounter.maxValue, 4);

  const createdAsset = await entityStore.createAsset({
    moduleId: module.index.moduleId,
    creatorToken: "token-actor",
    title: "Signal Lantern",
  });
  assert.equal(
    createdAsset.assets.some((asset) => asset.assetSlug === "signal-lantern"),
    true,
  );

  const updatedAssetState = await entityStore.updateAsset({
    moduleId: module.index.moduleId,
    assetSlug: "signal-lantern",
    creatorToken: "token-actor",
    title: "Storm Lantern",
    summary: "Portable ward light with a hidden shutter.",
    baseAssetSlug: "medieval_lantern",
    modifierSlug: "base_hidden",
    content: "# Storm Lantern\n\nKeeps the corridor lit in rain and fog.",
  });
  const updatedAsset = updatedAssetState.assets.find(
    (asset) => asset.assetSlug === "storm-lantern",
  );
  assert.ok(updatedAsset);
  assert.equal(updatedAsset.title, "Storm Lantern");
  assert.equal(updatedAsset.summary, "Portable ward light with a hidden shutter.");
  assert.equal(updatedAsset.baseAssetSlug, "medieval_lantern");
  assert.equal(updatedAsset.modifierSlug, "base_hidden");
  assert.equal(
    updatedAsset.content,
    "# Storm Lantern\n\nKeeps the corridor lit in rain and fog.",
  );

  const storedIndexRaw = await readFile(
    join(rootDir, module.index.moduleId, "index.json"),
    "utf8",
  );
  assert.match(storedIndexRaw, /assets\/storm-lantern\.mdx/);
  await assert.rejects(
    () =>
      readFile(
        join(rootDir, module.index.moduleId, "assets", "signal-lantern.mdx"),
        "utf8",
      ),
    { code: "ENOENT" },
  );
  const renamedAssetFile = await readFile(
    join(rootDir, module.index.moduleId, "assets", "storm-lantern.mdx"),
    "utf8",
  );
  assert.match(renamedAssetFile, /Keeps the corridor lit in rain and fog/);
});

test("creates, updates, clamps, and deletes counters and assets while allowing actor deletion", async () => {
  const store = await createStore();
  const module = await store.createModule({
    creatorToken: "token-counter",
    title: "Counter Module",
  });

  const moduleState = module as unknown as {
    index: {
      counters?: Array<{
        slug: string;
      }>;
    };
    counters?: Array<{
      slug: string;
    }>;
  };

  assert.equal(Array.isArray(moduleState.index.counters), true);
  assert.deepEqual(moduleState.index.counters, []);
  assert.equal(Array.isArray(moduleState.counters), true);
  assert.deepEqual(moduleState.counters, []);

  const entityStore = store as unknown as {
    createCounter?: (input: {
      moduleId: string;
      creatorToken?: string;
      title: string;
    }) => Promise<{
      counters: Array<{
        slug: string;
        title: string;
        iconSlug: string;
        currentValue: number;
        maxValue?: number;
        description?: string;
      }>;
    }>;
    updateCounter?: (input: {
      moduleId: string;
      counterSlug: string;
      creatorToken?: string;
      title: string;
      iconSlug: string;
      currentValue: number;
      maxValue?: number;
      description: string;
    }) => Promise<{
      counters: Array<{
        slug: string;
        title: string;
        iconSlug: string;
        currentValue: number;
        maxValue?: number;
        description?: string;
      }>;
    }>;
    deleteCounter?: (input: {
      moduleId: string;
      counterSlug: string;
      creatorToken?: string;
    }) => Promise<{
      counters: Array<{
        slug: string;
      }>;
    }>;
    deleteActor?: (input: {
      moduleId: string;
      actorSlug: string;
      creatorToken?: string;
    }) => Promise<{
      actors: Array<{
        actorSlug: string;
      }>;
    }>;
    createAsset?: (input: {
      moduleId: string;
      creatorToken?: string;
      title: string;
    }) => Promise<{
      assets: Array<{
        assetSlug: string;
        title: string;
        baseAssetSlug: string;
        modifierSlug?: string;
      }>;
    }>;
    updateAsset?: (input: {
      moduleId: string;
      assetSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      baseAssetSlug: string;
      modifierSlug?: string;
      content: string;
    }) => Promise<{
      assets: Array<{
        assetSlug: string;
        title: string;
        summary?: string;
        baseAssetSlug: string;
        modifierSlug?: string;
        content: string;
      }>;
    }>;
    deleteAsset?: (input: {
      moduleId: string;
      assetSlug: string;
      creatorToken?: string;
    }) => Promise<{
      assets: Array<{
        assetSlug: string;
      }>;
    }>;
  };

  assert.equal(typeof entityStore.createCounter, "function");
  assert.equal(typeof entityStore.updateCounter, "function");
  assert.equal(typeof entityStore.deleteCounter, "function");
  assert.equal(typeof entityStore.deleteActor, "function");
  assert.equal(typeof entityStore.createAsset, "function");
  assert.equal(typeof entityStore.updateAsset, "function");
  assert.equal(typeof entityStore.deleteAsset, "function");

  if (
    typeof entityStore.createCounter !== "function" ||
    typeof entityStore.updateCounter !== "function" ||
    typeof entityStore.deleteCounter !== "function" ||
    typeof entityStore.deleteActor !== "function" ||
    typeof entityStore.createAsset !== "function" ||
    typeof entityStore.updateAsset !== "function" ||
    typeof entityStore.deleteAsset !== "function"
  ) {
    return;
  }

  const created = await entityStore.createCounter({
    moduleId: module.index.moduleId,
    creatorToken: "token-counter",
    title: "Threat Clock",
  });
  const createdCounter = created.counters.find(
    (counter) => counter.slug === "threat-clock",
  );
  assert.ok(createdCounter);
  assert.equal(createdCounter.title, "Threat Clock");
  assert.equal(createdCounter.currentValue, 0);

  const updated = await entityStore.updateCounter({
    moduleId: module.index.moduleId,
    counterSlug: "threat-clock",
    creatorToken: "token-counter",
    title: "Threat Clock",
    iconSlug: "danger",
    currentValue: 9,
    maxValue: 5,
    description: "Escalates the heat across every scene.",
  });
  const updatedCounter = updated.counters.find(
    (counter) => counter.slug === "threat-clock",
  );
  assert.ok(updatedCounter);
  assert.equal(updatedCounter.iconSlug, "danger");
  assert.equal(updatedCounter.currentValue, 5);
  assert.equal(updatedCounter.maxValue, 5);
  assert.equal(
    updatedCounter.description,
    "Escalates the heat across every scene.",
  );

  const createdAsset = await entityStore.createAsset({
    moduleId: module.index.moduleId,
    creatorToken: "token-counter",
    title: "Signal Lantern",
  });
  const createdAssetRecord = createdAsset.assets.find(
    (asset) => asset.assetSlug === "signal-lantern",
  );
  assert.ok(createdAssetRecord);

  const updatedAsset = await entityStore.updateAsset({
    moduleId: module.index.moduleId,
    assetSlug: "signal-lantern",
    creatorToken: "token-counter",
    title: "Storm Lantern",
    summary: "Portable ward light with a hidden shutter.",
    baseAssetSlug: "medieval_lantern",
    modifierSlug: "base_hidden",
    content: "# Storm Lantern\n\nKeeps the corridor lit in rain and fog.",
  });
  const updatedAssetRecord = updatedAsset.assets.find(
    (asset) => asset.assetSlug === "storm-lantern",
  );
  assert.ok(updatedAssetRecord);
  assert.equal(updatedAssetRecord.baseAssetSlug, "medieval_lantern");
  assert.equal(updatedAssetRecord.modifierSlug, "base_hidden");

  const withReferencedMarkdown = await store.updateIndex({
    moduleId: module.index.moduleId,
    creatorToken: "token-counter",
    index: {
      ...updated.index,
      playerSummaryMarkdown:
        '<GameCard type="ActorCard" slug="primary-actor" /> <GameCard type="CounterCard" slug="threat-clock" /> <GameCard type="AssetCard" slug="storm-lantern" />',
    },
  });

  const afterDeleteCounter = await entityStore.deleteCounter({
    moduleId: module.index.moduleId,
    counterSlug: "threat-clock",
    creatorToken: "token-counter",
  });
  assert.equal(
    afterDeleteCounter.counters.some((counter) => counter.slug === "threat-clock"),
    false,
  );

  const afterDeleteAsset = await entityStore.deleteAsset({
    moduleId: module.index.moduleId,
    assetSlug: "storm-lantern",
    creatorToken: "token-counter",
  });
  assert.equal(
    afterDeleteAsset.assets.some((asset) => asset.assetSlug === "storm-lantern"),
    false,
  );

  const afterDeleteActor = await entityStore.deleteActor({
    moduleId: module.index.moduleId,
    actorSlug: "primary-actor",
    creatorToken: "token-counter",
  });
  assert.equal(
    afterDeleteActor.actors.some((actor) => actor.actorSlug === "primary-actor"),
    false,
  );
  assert.equal(
    afterDeleteActor.index.playerSummaryMarkdown,
    withReferencedMarkdown.index.playerSummaryMarkdown,
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
