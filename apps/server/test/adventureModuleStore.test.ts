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
        kind: "custom" | "legacy_layered";
        modifier?: string;
        noun?: string;
        nounDescription?: string;
        adjectiveDescription?: string;
        iconUrl?: string;
        overlayUrl?: string;
        content: string;
      }>;
    }>;
    updateAsset: (input: {
      moduleId: string;
      assetSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      modifier: string;
      noun: string;
      nounDescription: string;
      adjectiveDescription: string;
      iconUrl: string;
      overlayUrl: string;
      content: string;
    }) => Promise<{
      assets: Array<{
        assetSlug: string;
        title: string;
        summary?: string;
        kind: "custom" | "legacy_layered";
        modifier?: string;
        noun?: string;
        nounDescription?: string;
        adjectiveDescription?: string;
        iconUrl?: string;
        overlayUrl?: string;
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
  const createdAssetRecord = createdAsset.assets.find(
    (asset) => asset.assetSlug === "signal-lantern",
  );
  assert.ok(createdAssetRecord);
  assert.equal(createdAssetRecord.kind, "custom");
  assert.equal(createdAssetRecord.noun, "");
  assert.equal(createdAssetRecord.iconUrl, "");

  const updatedAssetState = await entityStore.updateAsset({
    moduleId: module.index.moduleId,
    assetSlug: "signal-lantern",
    creatorToken: "token-actor",
    title: "Storm Lantern",
    summary: "Portable ward light with a hidden shutter.",
    modifier: "Hidden",
    noun: "Storm Lantern",
    nounDescription: "Portable ward light that keeps corridors visible in rain and fog.",
    adjectiveDescription: "Keeps its shuttered glow from drawing distant attention.",
    iconUrl: "https://example.com/assets/storm-lantern.png",
    overlayUrl: "https://example.com/assets/storm-lantern-overlay.png",
    content: "# Storm Lantern\n\nKeeps the corridor lit in rain and fog.",
  });
  const updatedAsset = updatedAssetState.assets.find(
    (asset) => asset.assetSlug === "storm-lantern",
  );
  assert.ok(updatedAsset);
  assert.equal(updatedAsset.title, "Storm Lantern");
  assert.equal(updatedAsset.summary, "Portable ward light with a hidden shutter.");
  assert.equal(updatedAsset.kind, "custom");
  assert.equal(updatedAsset.modifier, "Hidden");
  assert.equal(updatedAsset.noun, "Storm Lantern");
  assert.equal(
    updatedAsset.nounDescription,
    "Portable ward light that keeps corridors visible in rain and fog.",
  );
  assert.equal(
    updatedAsset.adjectiveDescription,
    "Keeps its shuttered glow from drawing distant attention.",
  );
  assert.equal(updatedAsset.iconUrl, "https://example.com/assets/storm-lantern.png");
  assert.equal(
    updatedAsset.overlayUrl,
    "https://example.com/assets/storm-lantern-overlay.png",
  );
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
        kind: "custom" | "legacy_layered";
        noun?: string;
        iconUrl?: string;
      }>;
    }>;
    updateAsset?: (input: {
      moduleId: string;
      assetSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      modifier: string;
      noun: string;
      nounDescription: string;
      adjectiveDescription: string;
      iconUrl: string;
      overlayUrl: string;
      content: string;
    }) => Promise<{
      assets: Array<{
        assetSlug: string;
        title: string;
        summary?: string;
        kind: "custom" | "legacy_layered";
        modifier?: string;
        noun?: string;
        nounDescription?: string;
        adjectiveDescription?: string;
        iconUrl?: string;
        overlayUrl?: string;
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
  assert.equal(createdAssetRecord.kind, "custom");
  assert.equal(createdAssetRecord.noun, "");
  assert.equal(createdAssetRecord.iconUrl, "");
  const createdAssetFragment = createdAsset.index.fragments.find(
    (fragment) => fragment.fragmentId === createdAssetRecord.fragmentId,
  );
  assert.ok(createdAssetFragment);
  assert.deepEqual(createdAssetFragment.tags, ["asset"]);

  const updatedAsset = await entityStore.updateAsset({
    moduleId: module.index.moduleId,
    assetSlug: "signal-lantern",
    creatorToken: "token-counter",
    title: "Storm Lantern",
    summary: "Portable ward light with a hidden shutter.",
    modifier: "Hidden",
    noun: "Storm Lantern",
    nounDescription: "Portable ward light that keeps corridors visible in rain and fog.",
    adjectiveDescription: "Keeps its shuttered glow from drawing distant attention.",
    iconUrl: "https://example.com/assets/storm-lantern.png",
    overlayUrl: "https://example.com/assets/storm-lantern-overlay.png",
    content: "# Storm Lantern\n\nKeeps the corridor lit in rain and fog.",
  });
  const updatedAssetRecord = updatedAsset.assets.find(
    (asset) => asset.assetSlug === "storm-lantern",
  );
  assert.ok(updatedAssetRecord);
  assert.equal(updatedAssetRecord.kind, "custom");
  assert.equal(updatedAssetRecord.modifier, "Hidden");
  assert.equal(updatedAssetRecord.noun, "Storm Lantern");
  assert.equal(
    updatedAssetRecord.iconUrl,
    "https://example.com/assets/storm-lantern.png",
  );

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

test("loads legacy layered assets and converts them to custom assets on save", async () => {
  const { store, rootDir } = await createStoreWithRoot();
  const created = await store.createModule({
    creatorToken: "token-legacy-assets",
    title: "Legacy Asset Module",
  });

  const indexPath = join(rootDir, created.index.moduleId, "index.json");
  const legacyIndex = JSON.parse(await readFile(indexPath, "utf8")) as Record<
    string,
    unknown
  >;
  legacyIndex.assetCards = [
    {
      fragmentId: "frag-asset-main",
      kind: "legacy_layered",
      baseAssetSlug: "medieval_lantern",
      modifierSlug: "base_hidden",
    },
  ];
  await writeFile(indexPath, JSON.stringify(legacyIndex, null, 2), "utf8");

  const loaded = await store.getModule(created.index.moduleId, "token-legacy-assets");
  const legacyAsset = loaded?.assets.find((asset) => asset.assetSlug === "primary-asset");
  assert.ok(legacyAsset);
  assert.equal(legacyAsset.kind, "legacy_layered");

  const assetStore = store as unknown as {
    updateAsset: (input: {
      moduleId: string;
      assetSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      modifier: string;
      noun: string;
      nounDescription: string;
      adjectiveDescription: string;
      iconUrl: string;
      overlayUrl: string;
      content: string;
    }) => Promise<{
      assets: Array<{
        assetSlug: string;
        kind: "custom" | "legacy_layered";
        noun?: string;
        iconUrl?: string;
      }>;
    }>;
  };

  const updated = await assetStore.updateAsset({
    moduleId: created.index.moduleId,
    assetSlug: "primary-asset",
    creatorToken: "token-legacy-assets",
    title: "Storm Lantern",
    summary: "Portable ward light with a hidden shutter.",
    modifier: "Hidden",
    noun: "Storm Lantern",
    nounDescription: "Portable ward light that keeps corridors visible in rain and fog.",
    adjectiveDescription: "Keeps its shuttered glow from drawing distant attention.",
    iconUrl: "https://example.com/assets/storm-lantern.png",
    overlayUrl: "https://example.com/assets/storm-lantern-overlay.png",
    content: "# Storm Lantern\n\nKeeps the corridor lit in rain and fog.",
  });

  const updatedAsset = updated.assets.find((asset) => asset.assetSlug === "storm-lantern");
  assert.ok(updatedAsset);
  assert.equal(updatedAsset.kind, "custom");
  assert.equal(updatedAsset.noun, "Storm Lantern");
  assert.equal(updatedAsset.iconUrl, "https://example.com/assets/storm-lantern.png");

  const persistedIndex = JSON.parse(await readFile(indexPath, "utf8")) as {
    assetCards?: Array<{
      kind: "custom" | "legacy_layered";
      noun?: string;
    }>;
  };
  assert.equal(persistedIndex.assetCards?.[0]?.kind, "custom");
  assert.equal(persistedIndex.assetCards?.[0]?.noun, "Storm Lantern");
});

test("creates, updates, renames, and deletes locations while preserving map pin fragment targets", async () => {
  const { store, rootDir } = await createStoreWithRoot();
  const module = await store.createModule({
    creatorToken: "token-location",
    title: "Location Module",
  });

  const locationStore = store as unknown as {
    createLocation: (input: {
      moduleId: string;
      creatorToken?: string;
      title: string;
    }) => Promise<{
      locations: Array<{
        fragmentId: string;
        locationSlug: string;
        title: string;
        introductionMarkdown: string;
        descriptionMarkdown: string;
      }>;
    }>;
    updateLocation: (input: {
      moduleId: string;
      locationSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      titleImageUrl?: string;
      introductionMarkdown: string;
      descriptionMarkdown: string;
      mapImageUrl?: string;
      mapPins: Array<{
        pinId: string;
        x: number;
        y: number;
        targetFragmentId: string;
      }>;
    }) => Promise<{
      locations: Array<{
        fragmentId: string;
        locationSlug: string;
        title: string;
        summary?: string;
        titleImageUrl?: string;
        introductionMarkdown: string;
        descriptionMarkdown: string;
        mapImageUrl?: string;
        mapPins: Array<{
          pinId: string;
          x: number;
          y: number;
          targetFragmentId: string;
        }>;
      }>;
    }>;
    deleteLocation: (input: {
      moduleId: string;
      locationSlug: string;
      creatorToken?: string;
    }) => Promise<{
      locations: Array<{
        locationSlug: string;
      }>;
    }>;
  };

  const created = await locationStore.createLocation({
    moduleId: module.index.moduleId,
    creatorToken: "token-location",
    title: "Sunken Courtyard",
  });
  const createdLocation = created.locations.find(
    (location) => location.locationSlug === "sunken-courtyard",
  );
  assert.ok(createdLocation);
  assert.equal(createdLocation.title, "Sunken Courtyard");

  const updated = await locationStore.updateLocation({
    moduleId: module.index.moduleId,
    locationSlug: "sunken-courtyard",
    creatorToken: "token-location",
    title: "Hidden Courtyard",
    summary: "Flooded negotiation square beneath rusted prayer bells.",
    titleImageUrl: "https://example.com/location-title.png",
    introductionMarkdown:
      "Rain hammers the stones while bells shiver overhead.",
    descriptionMarkdown:
      "Actors: smugglers and debt collectors. Assets: hidden contraband. Exits: archive stair and drain gate. Hazards: slick stone and sight lines from above.",
    mapImageUrl: "https://example.com/location-map.png",
    mapPins: [
      {
        pinId: "pin-location-link",
        x: 25,
        y: 40,
        targetFragmentId: "frag-location-main",
      },
      {
        pinId: "pin-actor-link",
        x: 54,
        y: 28,
        targetFragmentId: "frag-actor-main",
      },
      {
        pinId: "pin-encounter-link",
        x: 68,
        y: 56,
        targetFragmentId: "frag-encounter-main",
      },
      {
        pinId: "pin-quest-link",
        x: 84,
        y: 18,
        targetFragmentId: "frag-quest-main",
      },
    ],
  });

  const updatedLocation = updated.locations.find(
    (location) => location.locationSlug === "hidden-courtyard",
  );
  assert.ok(updatedLocation);
  assert.equal(updatedLocation.title, "Hidden Courtyard");
  assert.equal(updatedLocation.summary, "Flooded negotiation square beneath rusted prayer bells.");
  assert.equal(updatedLocation.titleImageUrl, "https://example.com/location-title.png");
  assert.equal(updatedLocation.mapImageUrl, "https://example.com/location-map.png");
  assert.equal(updatedLocation.mapPins.length, 4);
  assert.equal(updatedLocation.mapPins[1]?.targetFragmentId, "frag-actor-main");

  const storedIndexRaw = await readFile(
    join(rootDir, module.index.moduleId, "index.json"),
    "utf8",
  );
  assert.match(storedIndexRaw, /locations\/hidden-courtyard\.mdx/);
  await assert.rejects(
    () =>
      readFile(
        join(rootDir, module.index.moduleId, "locations", "sunken-courtyard.mdx"),
        "utf8",
      ),
    { code: "ENOENT" },
  );
  const renamedLocationFile = await readFile(
    join(rootDir, module.index.moduleId, "locations", "hidden-courtyard.mdx"),
    "utf8",
  );
  assert.match(renamedLocationFile, /## Introduction/);
  assert.match(renamedLocationFile, /## Description/);
  assert.match(renamedLocationFile, /Rain hammers the stones/);

  const afterDelete = await locationStore.deleteLocation({
    moduleId: module.index.moduleId,
    locationSlug: "hidden-courtyard",
    creatorToken: "token-location",
  });
  assert.equal(
    afterDelete.locations.some((location) => location.locationSlug === "hidden-courtyard"),
    false,
  );
});

test("backfills missing location metadata from legacy fragment content on read and persists it on write", async () => {
  const { store, rootDir } = await createStoreWithRoot();
  const created = await store.createModule({
    creatorToken: "token-legacy-location",
    title: "Legacy Location Module",
  });

  const indexPath = join(rootDir, created.index.moduleId, "index.json");
  const locationPath = join(
    rootDir,
    created.index.moduleId,
    "locations",
    "primary-location.mdx",
  );
  const legacyIndex = JSON.parse(await readFile(indexPath, "utf8")) as Record<
    string,
    unknown
  >;
  delete legacyIndex.locationDetails;
  await writeFile(indexPath, JSON.stringify(legacyIndex, null, 2), "utf8");
  await writeFile(
    locationPath,
    "# Primary Location\n\nLegacy location detail that should be preserved.",
    "utf8",
  );

  const loaded = (await store.getModule(
    created.index.moduleId,
    "token-legacy-location",
  )) as unknown as {
    locations?: Array<{
      locationSlug: string;
      introductionMarkdown: string;
      descriptionMarkdown: string;
    }>;
  } | null;
  assert.ok(loaded);
  assert.equal(loaded?.locations?.[0]?.locationSlug, "primary-location");
  assert.equal(loaded?.locations?.[0]?.introductionMarkdown, "");
  assert.match(
    loaded?.locations?.[0]?.descriptionMarkdown ?? "",
    /Legacy location detail/,
  );

  const locationStore = store as unknown as {
    updateLocation: (input: {
      moduleId: string;
      locationSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      titleImageUrl?: string;
      introductionMarkdown: string;
      descriptionMarkdown: string;
      mapImageUrl?: string;
      mapPins: Array<{
        pinId: string;
        x: number;
        y: number;
        targetFragmentId: string;
      }>;
    }) => Promise<unknown>;
  };

  await locationStore.updateLocation({
    moduleId: created.index.moduleId,
    locationSlug: "primary-location",
    creatorToken: "token-legacy-location",
    title: "Primary Location",
    summary: "Backfilled from legacy markdown.",
    introductionMarkdown: "",
    descriptionMarkdown:
      loaded?.locations?.[0]?.descriptionMarkdown ?? "Legacy location detail.",
    mapPins: [],
  });

  const persistedIndex = JSON.parse(await readFile(indexPath, "utf8")) as {
    locationDetails?: Array<{
      fragmentId: string;
      descriptionMarkdown: string;
    }>;
  };
  assert.equal(Array.isArray(persistedIndex.locationDetails), true);
  assert.equal(persistedIndex.locationDetails?.length, 1);
  assert.match(
    persistedIndex.locationDetails?.[0]?.descriptionMarkdown ?? "",
    /Legacy location detail/,
  );
});

test("creates, updates, renames, and deletes encounters while cleaning structured references", async () => {
  const { store, rootDir } = await createStoreWithRoot();
  const module = await store.createModule({
    creatorToken: "token-encounter",
    title: "Encounter Module",
  });

  const encounterStore = store as unknown as {
    createEncounter: (input: {
      moduleId: string;
      creatorToken?: string;
      title: string;
    }) => Promise<{
      encounters: Array<{
        fragmentId: string;
        encounterSlug: string;
        title: string;
        summary?: string;
        prerequisites: string;
        titleImageUrl?: string;
        content: string;
      }>;
    }>;
    updateEncounter: (input: {
      moduleId: string;
      encounterSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      prerequisites: string;
      titleImageUrl?: string;
      content: string;
    }) => Promise<{
      encounters: Array<{
        fragmentId: string;
        encounterSlug: string;
        title: string;
        summary?: string;
        prerequisites: string;
        titleImageUrl?: string;
        content: string;
      }>;
      index: {
        componentOpportunities: Array<{
          fragmentId?: string;
        }>;
        questGraphs: Array<{
          nodes: Array<{
            encounterFragmentIds: string[];
          }>;
        }>;
        locationDetails: Array<{
          mapPins: Array<{
            targetFragmentId: string;
          }>;
        }>;
      };
    }>;
    deleteEncounter: (input: {
      moduleId: string;
      encounterSlug: string;
      creatorToken?: string;
    }) => Promise<{
      encounters: Array<{
        encounterSlug: string;
      }>;
      index: {
        componentOpportunities: Array<{
          fragmentId?: string;
        }>;
        questGraphs: Array<{
          nodes: Array<{
            encounterFragmentIds: string[];
          }>;
        }>;
        locationDetails: Array<{
          mapPins: Array<{
            targetFragmentId: string;
          }>;
        }>;
      };
    }>;
  };

  const created = await encounterStore.createEncounter({
    moduleId: module.index.moduleId,
    creatorToken: "token-encounter",
    title: "Bridge Ambush",
  });
  const createdEncounter = created.encounters.find(
    (encounter) => encounter.encounterSlug === "bridge-ambush",
  );
  assert.ok(createdEncounter);
  assert.equal(createdEncounter.title, "Bridge Ambush");
  assert.equal(createdEncounter.prerequisites, "");
  assert.equal(typeof createdEncounter.content, "string");

  const updated = await encounterStore.updateEncounter({
    moduleId: module.index.moduleId,
    encounterSlug: "bridge-ambush",
    creatorToken: "token-encounter",
    title: "Bridge Toll Ambush",
    summary: "Pay, bluff, or fight through the armored toll blockade.",
    prerequisites: "Already escaped the prison cells.",
    titleImageUrl: "https://example.com/encounter-title.png",
    content: "# Bridge Toll Ambush\n\nHold the bridge long enough to break through.",
  });
  const updatedEncounter = updated.encounters.find(
    (encounter) => encounter.encounterSlug === "bridge-toll-ambush",
  );
  assert.ok(updatedEncounter);
  assert.equal(updatedEncounter.title, "Bridge Toll Ambush");
  assert.equal(
    updatedEncounter.summary,
    "Pay, bluff, or fight through the armored toll blockade.",
  );
  assert.equal(
    updatedEncounter.prerequisites,
    "Already escaped the prison cells.",
  );
  assert.equal(
    updatedEncounter.titleImageUrl,
    "https://example.com/encounter-title.png",
  );
  assert.equal(
    updatedEncounter.content,
    "# Bridge Toll Ambush\n\nHold the bridge long enough to break through.",
  );

  const indexPath = join(rootDir, module.index.moduleId, "index.json");
  const storedIndex = JSON.parse(await readFile(indexPath, "utf8")) as {
    locationDetails: Array<{
      fragmentId: string;
      mapPins: Array<{
        pinId: string;
        x: number;
        y: number;
        targetFragmentId: string;
      }>;
    }>;
    questGraphs: Array<{
      nodes: Array<{
        nodeId: string;
        encounterFragmentIds: string[];
      }>;
    }>;
    componentOpportunities: Array<{
      opportunityId: string;
      componentType: string;
      strength: string;
      timing: string;
      fragmentId?: string;
      fragmentKind?: string;
      questId?: string;
      nodeId?: string;
      placementLabel: string;
      trigger: string;
      rationale: string;
    }>;
  };
  storedIndex.locationDetails[0]?.mapPins.push({
    pinId: "pin-created-encounter",
    x: 72,
    y: 31,
    targetFragmentId: updatedEncounter.fragmentId,
  });
  storedIndex.questGraphs[0]?.nodes[0]?.encounterFragmentIds.push(
    updatedEncounter.fragmentId,
  );
  storedIndex.componentOpportunities.push({
    opportunityId: "opp-created-encounter",
    componentType: "counter",
    strength: "recommended",
    timing: "during_action",
    fragmentId: updatedEncounter.fragmentId,
    fragmentKind: "encounter",
    questId: "quest-main",
    nodeId: "node-entry",
    placementLabel: "Bridge Pressure",
    trigger: "When the toll guard pushes harder.",
    rationale: "Tracks encounter-specific escalation.",
  });
  await writeFile(indexPath, JSON.stringify(storedIndex, null, 2), "utf8");

  const storedIndexRaw = await readFile(indexPath, "utf8");
  assert.match(storedIndexRaw, /encounters\/bridge-toll-ambush\.mdx/);
  await assert.rejects(
    () =>
      readFile(
        join(rootDir, module.index.moduleId, "encounters", "bridge-ambush.mdx"),
        "utf8",
      ),
    { code: "ENOENT" },
  );
  const renamedEncounterFile = await readFile(
    join(
      rootDir,
      module.index.moduleId,
      "encounters",
      "bridge-toll-ambush.mdx",
    ),
    "utf8",
  );
  assert.match(renamedEncounterFile, /Hold the bridge long enough/);

  const afterDelete = await encounterStore.deleteEncounter({
    moduleId: module.index.moduleId,
    encounterSlug: "bridge-toll-ambush",
    creatorToken: "token-encounter",
  });
  assert.equal(
    afterDelete.encounters.some(
      (encounter) => encounter.encounterSlug === "bridge-toll-ambush",
    ),
    false,
  );
  assert.equal(
    afterDelete.index.locationDetails[0]?.mapPins.some(
      (pin) => pin.targetFragmentId === updatedEncounter.fragmentId,
    ),
    false,
  );
  assert.equal(
    afterDelete.index.questGraphs[0]?.nodes[0]?.encounterFragmentIds.includes(
      updatedEncounter.fragmentId,
    ),
    false,
  );
  assert.equal(
    afterDelete.index.componentOpportunities.some(
      (opportunity) => opportunity.fragmentId === updatedEncounter.fragmentId,
    ),
    false,
  );
  await assert.rejects(
    () =>
      readFile(
        join(
          rootDir,
          module.index.moduleId,
          "encounters",
          "bridge-toll-ambush.mdx",
        ),
        "utf8",
      ),
    { code: "ENOENT" },
  );

  await assert.rejects(
    () =>
      encounterStore.deleteEncounter({
        moduleId: module.index.moduleId,
        encounterSlug: "primary-encounter",
        creatorToken: "token-encounter",
      }),
    AdventureModuleValidationError,
  );
});

test("backfills missing encounter metadata from legacy index on read and persists it on write", async () => {
  const { store, rootDir } = await createStoreWithRoot();
  const created = await store.createModule({
    creatorToken: "token-legacy-encounter",
    title: "Legacy Encounter Module",
  });

  const indexPath = join(rootDir, created.index.moduleId, "index.json");
  const legacyIndex = JSON.parse(await readFile(indexPath, "utf8")) as Record<
    string,
    unknown
  >;
  delete legacyIndex.encounterDetails;
  await writeFile(indexPath, JSON.stringify(legacyIndex, null, 2), "utf8");

  const loaded = (await store.getModule(
    created.index.moduleId,
    "token-legacy-encounter",
  )) as unknown as {
    encounters?: Array<{
      encounterSlug: string;
      prerequisites: string;
      titleImageUrl?: string;
      content: string;
    }>;
  } | null;
  assert.ok(loaded);
  assert.equal(loaded?.encounters?.[0]?.encounterSlug, "primary-encounter");
  assert.equal(loaded?.encounters?.[0]?.prerequisites, "");
  assert.equal(loaded?.encounters?.[0]?.titleImageUrl, undefined);

  const encounterStore = store as unknown as {
    updateEncounter: (input: {
      moduleId: string;
      encounterSlug: string;
      creatorToken?: string;
      title: string;
      summary: string;
      prerequisites: string;
      titleImageUrl?: string;
      content: string;
    }) => Promise<unknown>;
  };

  await encounterStore.updateEncounter({
    moduleId: created.index.moduleId,
    encounterSlug: "primary-encounter",
    creatorToken: "token-legacy-encounter",
    title: "Primary Encounter",
    summary: "Backfilled from legacy encounter metadata.",
    prerequisites: "Level 2+",
    titleImageUrl: "https://example.com/legacy-encounter.png",
    content:
      loaded?.encounters?.[0]?.content ?? "# Primary Encounter\n\nLegacy encounter detail.",
  });

  const persistedIndex = JSON.parse(await readFile(indexPath, "utf8")) as {
    encounterDetails?: Array<{
      fragmentId: string;
      prerequisites: string;
      titleImageUrl?: string;
    }>;
  };
  assert.equal(Array.isArray(persistedIndex.encounterDetails), true);
  assert.equal(persistedIndex.encounterDetails?.length, 1);
  assert.equal(persistedIndex.encounterDetails?.[0]?.prerequisites, "Level 2+");
  assert.equal(
    persistedIndex.encounterDetails?.[0]?.titleImageUrl,
    "https://example.com/legacy-encounter.png",
  );
});
