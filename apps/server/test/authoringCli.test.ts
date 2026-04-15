import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { rulesEffectCards, rulesStuntCards } from "@mighty-decks/spec/rulesCards";
import {
  rulesEffectCards as webRulesEffectCards,
  rulesStuntCards as webRulesStuntCards,
} from "../../web/src/data/rulesComponents";
import { runAuthorModuleCli } from "../src/adventureModule/cli/runAuthorModuleCli";
import { runAuthorCampaignCli } from "../src/campaign/cli/runAuthorCampaignCli";
import { AdventureModuleStore } from "../src/persistence/AdventureModuleStore";
import { CampaignStore } from "../src/persistence/CampaignStore";

const createStores = async (): Promise<{
  moduleStore: AdventureModuleStore;
  campaignStore: CampaignStore;
}> => {
  const moduleRoot = mkdtempSync(join(tmpdir(), "mighty-decks-authoring-cli-modules-"));
  const campaignRoot = mkdtempSync(join(tmpdir(), "mighty-decks-authoring-cli-campaigns-"));
  const moduleStore = new AdventureModuleStore({ rootDir: moduleRoot });
  await moduleStore.initialize();
  const campaignStore = new CampaignStore({
    rootDir: campaignRoot,
    sourceModuleStore: moduleStore,
  });
  await campaignStore.initialize();
  return { moduleStore, campaignStore };
};

const runModuleCliJson = async (
  stores: {
    moduleStore: AdventureModuleStore;
    campaignStore: CampaignStore;
  },
  args: string[],
  options?: {
    stdinText?: string;
  },
) => {
  let stdout = "";
  let stderr = "";
  const exitCode = await runAuthorModuleCli(args, {
    ...stores,
    stdinText: options?.stdinText,
    stdout: {
      write: (chunk: string) => {
        stdout += chunk;
        return true;
      },
    },
    stderr: {
      write: (chunk: string) => {
        stderr += chunk;
        return true;
      },
    },
  });
  return {
    exitCode,
    stdout,
    stderr,
    json: JSON.parse(stdout),
  };
};

const runCampaignCliJson = async (
  stores: {
    moduleStore: AdventureModuleStore;
    campaignStore: CampaignStore;
  },
  args: string[],
) => {
  let stdout = "";
  let stderr = "";
  const exitCode = await runAuthorCampaignCli(args, {
    ...stores,
    stdout: {
      write: (chunk: string) => {
        stdout += chunk;
        return true;
      },
    },
    stderr: {
      write: (chunk: string) => {
        stderr += chunk;
        return true;
      },
    },
  });
  return {
    exitCode,
    stdout,
    stderr,
    json: JSON.parse(stdout),
  };
};

test("shared effect and stunt catalogs stay aligned between spec and web", () => {
  assert.equal(webRulesEffectCards.length, rulesEffectCards.length);
  assert.equal(webRulesStuntCards.length, rulesStuntCards.length);
  assert.deepEqual(
    webRulesEffectCards.map((card) => ({ slug: card.slug, title: card.title })),
    rulesEffectCards.map((card) => ({ slug: card.slug, title: card.title })),
  );
  assert.deepEqual(
    webRulesStuntCards.map((card) => ({ slug: card.slug, title: card.title })),
    rulesStuntCards.map((card) => ({ slug: card.slug, title: card.title })),
  );
});

test("module CLI exposes capabilities, schemas, catalogs, and JSON input validation", async () => {
  const stores = await createStores();

  const capabilities = await runModuleCliJson(stores, ["capabilities"]);
  assert.equal(capabilities.exitCode, 0);
  assert.equal(capabilities.json.ok, true);
  assert.equal(capabilities.json.result.topLevel.includes("preview"), true);
  assert.equal(capabilities.json.result.nestedResources.actor.includes("update"), true);

  const schema = await runModuleCliJson(stores, [
    "schema",
    "--resource",
    "actor",
    "--action",
    "update",
  ]);
  assert.equal(schema.exitCode, 0);
  assert.equal(schema.json.result.operations.length, 1);
  const actorUpdate = schema.json.result.operations[0];
  assert.equal(actorUpdate.resource, "actor");
  assert.equal(actorUpdate.action, "update");
  assert.equal(actorUpdate.inputSchema.properties.baseLayerSlug.enum.includes("zealot"), true);

  const catalog = await runModuleCliJson(stores, ["catalog"]);
  assert.equal(catalog.exitCode, 0);
  assert.equal(catalog.json.result.assetBases.length > 0, true);
  assert.equal(catalog.json.result.outcomes.some((card: { slug: string }) => card.slug === "success"), true);
  assert.equal(catalog.json.result.effects.some((card: { slug: string }) => card.slug === "injury"), true);
  assert.equal(catalog.json.result.stunts.some((card: { slug: string }) => card.slug === "dontGiveUp"), true);

  const invalidInlineJson = await runModuleCliJson(stores, [
    "create",
    "--input-json",
    "{not-json",
  ]);
  assert.equal(invalidInlineJson.exitCode, 1);
  assert.equal(invalidInlineJson.json.ok, false);
  assert.equal(invalidInlineJson.json.error.type, "usage");

  const invalidFilePath = join(tmpdir(), "mighty-decks-invalid-authoring-cli.json");
  writeFileSync(invalidFilePath, "{still-not-json", "utf8");
  const invalidFileJson = await runModuleCliJson(stores, [
    "create",
    "--input-file",
    invalidFilePath,
  ]);
  assert.equal(invalidFileJson.exitCode, 1);
  assert.equal(invalidFileJson.json.error.type, "usage");

  const invalidStdinJson = await runModuleCliJson(
    stores,
    ["create"],
    {
      stdinText: "{broken-stdin",
    },
  );
  assert.equal(invalidStdinJson.exitCode, 1);
  assert.equal(invalidStdinJson.json.error.type, "usage");
});

test("module CLI supports top-level CRUD plus nested resource CRUD for every entity type", async () => {
  const stores = await createStores();

  const create = await runModuleCliJson(stores, [
    "create",
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({
      title: "Exiles Draft",
      slug: "exiles-draft",
      seedPrompt: "Shipwrecked exiles rebuild a war corvette.",
      sessionScope: "mini_campaign",
      launchProfile: "dual",
    }),
  ]);
  assert.equal(create.exitCode, 0);
  const createdDetail = create.json.result as {
    index: {
      moduleId: string;
      slug: string;
      playerSummaryFragmentId: string;
      summary: string;
    };
  };
  assert.equal(createdDetail.index.slug, "exiles-draft");

  const list = await runModuleCliJson(stores, ["list", "--creator-token", "author-token"]);
  assert.equal(list.exitCode, 0);
  assert.equal(list.json.result.modules.length, 1);

  const get = await runModuleCliJson(stores, [
    "get",
    "--slug",
    "exiles-draft",
    "--creator-token",
    "author-token",
  ]);
  assert.equal(get.exitCode, 0);

  const updateFragment = await runModuleCliJson(stores, [
    "update-fragment",
    "--slug",
    "exiles-draft",
    "--fragment-id",
    createdDetail.index.playerSummaryFragmentId,
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({
      content: "# Player Summary\n\nYou are the condemned crew of a stolen corvette.",
    }),
  ]);
  assert.equal(updateFragment.exitCode, 0);

  const updateIndex = await runModuleCliJson(stores, [
    "update-index",
    "--slug",
    "exiles-draft",
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({
      index: {
        ...updateFragment.json.result.index,
        summary: "A survival mini-campaign aboard a broken ship.",
      },
    }),
  ]);
  assert.equal(updateIndex.exitCode, 0);
  assert.equal(updateIndex.json.result.index.summary, "A survival mini-campaign aboard a broken ship.");

  const preview = await runModuleCliJson(stores, [
    "preview",
    "--slug",
    "exiles-draft",
    "--creator-token",
    "author-token",
    "--show-spoilers",
    "true",
  ]);
  assert.equal(preview.exitCode, 0);
  assert.equal(Array.isArray(preview.json.result.groups), true);

  const actorCreate = await runModuleCliJson(stores, [
    "actor",
    "create",
    "--module",
    "exiles-draft",
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({ title: "Brother Calyx", isPlayerCharacter: false }),
  ]);
  const actorSlug = actorCreate.json.result.item.actorSlug as string;
  assert.equal(actorCreate.exitCode, 0);

  const actorUpdate = await runModuleCliJson(stores, [
    "actor",
    "update",
    "--module",
    "exiles-draft",
    "--actor",
    actorSlug,
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({
      title: "Brother Calyx",
      summary: "A persuasive death cult philosopher.",
      baseLayerSlug: "zealot",
      tacticalRoleSlug: "champion",
      tacticalSpecialSlug: "dangerous",
      isPlayerCharacter: false,
      content: "# Brother Calyx\n\nHe preaches revelation through endings.",
    }),
  ]);
  assert.equal(actorUpdate.exitCode, 0);

  const counterCreate = await runModuleCliJson(stores, [
    "counter",
    "create",
    "--module",
    "exiles-draft",
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({ title: "Hull Integrity" }),
  ]);
  const counterSlug = counterCreate.json.result.item.slug as string;
  const counterUpdate = await runModuleCliJson(stores, [
    "counter",
    "update",
    "--module",
    "exiles-draft",
    "--counter",
    counterSlug,
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({
      title: "Hull Integrity",
      iconSlug: "danger",
      currentValue: 4,
      maxValue: 6,
      description: "Tracks how much punishment the ship can still absorb.",
    }),
  ]);
  assert.equal(counterUpdate.exitCode, 0);

  const assetCreate = await runModuleCliJson(stores, [
    "asset",
    "create",
    "--module",
    "exiles-draft",
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({ title: "Saint-Eater Relic" }),
  ]);
  const assetSlug = assetCreate.json.result.item.assetSlug as string;
  const assetUpdate = await runModuleCliJson(stores, [
    "asset",
    "update",
    "--module",
    "exiles-draft",
    "--asset",
    assetSlug,
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({
      title: "Saint-Eater Relic",
      summary: "A devotional blade with a hungry reputation.",
      modifier: "Hungry",
      noun: "Relic Blade",
      nounDescription: "A ritual weapon passed between condemned priests.",
      adjectiveDescription: "It whispers when blood is near.",
      iconUrl: "https://example.com/relic.png",
      overlayUrl: "",
      content: "# Saint-Eater Relic\n\nA sacrament turned weapon.",
    }),
  ]);
  assert.equal(assetUpdate.exitCode, 0);

  const locationCreate = await runModuleCliJson(stores, [
    "location",
    "create",
    "--module",
    "exiles-draft",
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({ title: "The Ossuary Hold" }),
  ]);
  const locationSlug = locationCreate.json.result.item.locationSlug as string;
  const locationUpdate = await runModuleCliJson(stores, [
    "location",
    "update",
    "--module",
    "exiles-draft",
    "--location",
    locationSlug,
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({
      title: "The Ossuary Hold",
      summary: "A storage bay lined with reliquary cages.",
      titleImageUrl: null,
      introductionMarkdown: "The air tastes like rust and incense.",
      descriptionMarkdown: "The condemned keep their contraband hidden here.",
      mapImageUrl: null,
      mapPins: [],
    }),
  ]);
  assert.equal(locationUpdate.exitCode, 0);

  const encounterCreate = await runModuleCliJson(stores, [
    "encounter",
    "create",
    "--module",
    "exiles-draft",
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({ title: "Wake the Grave-Engines" }),
  ]);
  const encounterSlug = encounterCreate.json.result.item.encounterSlug as string;
  const encounterUpdate = await runModuleCliJson(stores, [
    "encounter",
    "update",
    "--module",
    "exiles-draft",
    "--encounter",
    encounterSlug,
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({
      title: "Wake the Grave-Engines",
      summary: "The ship must be coaxed back to life before the cult arrives.",
      prerequisites: "The crew has reached engineering.",
      titleImageUrl: null,
      content: "# Wake the Grave-Engines\n\nThe engines answer to fear and prayer.",
    }),
  ]);
  assert.equal(encounterUpdate.exitCode, 0);

  const questCreate = await runModuleCliJson(stores, [
    "quest",
    "create",
    "--module",
    "exiles-draft",
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({ title: "Escape the Empire's Edge" }),
  ]);
  const questSlug = questCreate.json.result.item.questSlug as string;
  const questUpdate = await runModuleCliJson(stores, [
    "quest",
    "update",
    "--module",
    "exiles-draft",
    "--quest",
    questSlug,
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({
      title: "Escape the Empire's Edge",
      summary: "Get the corvette running and survive the first jump.",
      titleImageUrl: null,
      content: "# Escape the Empire's Edge\n\nFind fuel, seal the breach, and choose who to save.",
    }),
  ]);
  assert.equal(questUpdate.exitCode, 0);

  for (const [resource, slugFlag, slug] of [
    ["actor", "--actor", actorSlug],
    ["counter", "--counter", counterSlug],
    ["asset", "--asset", assetSlug],
    ["location", "--location", locationSlug],
    ["encounter", "--encounter", encounterSlug],
    ["quest", "--quest", questSlug],
  ] as const) {
    const getResource = await runModuleCliJson(stores, [
      resource,
      "get",
      "--module",
      "exiles-draft",
      slugFlag,
      slug,
      "--creator-token",
      "author-token",
    ]);
    assert.equal(getResource.exitCode, 0);

    const deleteResource = await runModuleCliJson(stores, [
      resource,
      "delete",
      "--module",
      "exiles-draft",
      slugFlag,
      slug,
      "--creator-token",
      "author-token",
    ]);
    assert.equal(deleteResource.exitCode, 0);
  }

  const clone = await runModuleCliJson(stores, [
    "clone",
    "--slug",
    "exiles-draft",
    "--creator-token",
    "author-token",
    "--input-json",
    JSON.stringify({
      title: "Exiles Clone",
      slug: "exiles-clone",
    }),
  ]);
  assert.equal(clone.exitCode, 0);
  assert.equal(clone.json.result.index.slug, "exiles-clone");

  const forbidden = await runModuleCliJson(stores, [
    "update-fragment",
    "--slug",
    "exiles-draft",
    "--fragment-id",
    createdDetail.index.playerSummaryFragmentId,
    "--creator-token",
    "wrong-author",
    "--input-json",
    JSON.stringify({
      content: "blocked",
    }),
  ]);
  assert.equal(forbidden.exitCode, 1);
  assert.equal(forbidden.json.error.type, "forbidden");

  const deleteClone = await runModuleCliJson(stores, [
    "delete",
    "--slug",
    "exiles-clone",
    "--creator-token",
    "author-token",
  ]);
  assert.equal(deleteClone.exitCode, 0);
  assert.equal(deleteClone.json.result.deleted, true);
});

test("campaign CLI supports top-level CRUD plus nested resource CRUD for every entity type", async () => {
  const stores = await createStores();
  await stores.moduleStore.createModule({
    creatorToken: "source-owner",
    title: "Source Module",
    slug: "source-module",
    sessionScope: "mini_campaign",
    launchProfile: "dual",
  });

  const create = await runCampaignCliJson(stores, [
    "create",
    "--source-module",
    "source-module",
    "--input-json",
    JSON.stringify({
      title: "Campaign Fork",
      slug: "campaign-fork",
    }),
  ]);
  assert.equal(create.exitCode, 0);
  assert.equal(create.json.result.index.slug, "campaign-fork");

  const get = await runCampaignCliJson(stores, [
    "get",
    "--slug",
    "campaign-fork",
  ]);
  assert.equal(get.exitCode, 0);

  const updateIndex = await runCampaignCliJson(stores, [
    "update-index",
    "--slug",
    "campaign-fork",
    "--input-json",
    JSON.stringify({
      index: {
        ...get.json.result.index,
        summary: "A live campaign fork for human storytelling.",
      },
    }),
  ]);
  assert.equal(updateIndex.exitCode, 0);

  const updateFragment = await runCampaignCliJson(stores, [
    "update-fragment",
    "--slug",
    "campaign-fork",
    "--fragment-id",
    get.json.result.index.playerSummaryFragmentId,
    "--input-json",
    JSON.stringify({
      content: "# Player Summary\n\nCampaign players inherit the exiles' doomed mission.",
    }),
  ]);
  assert.equal(updateFragment.exitCode, 0);

  const updateCover = await runCampaignCliJson(stores, [
    "update-cover-image",
    "--slug",
    "campaign-fork",
    "--input-json",
    JSON.stringify({
      coverImageUrl: "https://example.com/campaign-cover.png",
    }),
  ]);
  assert.equal(updateCover.exitCode, 0);
  assert.equal(updateCover.json.result.coverImageUrl, "https://example.com/campaign-cover.png");

  const actorCreate = await runCampaignCliJson(stores, [
    "actor",
    "create",
    "--campaign",
    "campaign-fork",
    "--input-json",
    JSON.stringify({ title: "Captain Vey", isPlayerCharacter: false }),
  ]);
  const actorSlug = actorCreate.json.result.item.actorSlug as string;
  const actorUpdate = await runCampaignCliJson(stores, [
    "actor",
    "update",
    "--campaign",
    "campaign-fork",
    "--actor",
    actorSlug,
    "--input-json",
    JSON.stringify({
      title: "Captain Vey",
      summary: "The campaign's hard-eyed survivor captain.",
      baseLayerSlug: "commander",
      tacticalRoleSlug: "champion",
      tacticalSpecialSlug: "tough",
      isPlayerCharacter: false,
      content: "# Captain Vey\n\nShe refuses to leave anyone behind twice.",
    }),
  ]);
  assert.equal(actorUpdate.exitCode, 0);

  const counterCreate = await runCampaignCliJson(stores, [
    "counter",
    "create",
    "--campaign",
    "campaign-fork",
    "--input-json",
    JSON.stringify({ title: "Void Pressure" }),
  ]);
  const counterSlug = counterCreate.json.result.item.slug as string;
  const counterUpdate = await runCampaignCliJson(stores, [
    "counter",
    "update",
    "--campaign",
    "campaign-fork",
    "--counter",
    counterSlug,
    "--input-json",
    JSON.stringify({
      title: "Void Pressure",
      iconSlug: "time",
      currentValue: 2,
      maxValue: 5,
      description: "How close the Hungry Void is to swallowing the ship.",
    }),
  ]);
  assert.equal(counterUpdate.exitCode, 0);

  const assetCreate = await runCampaignCliJson(stores, [
    "asset",
    "create",
    "--campaign",
    "campaign-fork",
    "--input-json",
    JSON.stringify({ title: "Black-Briar Dose" }),
  ]);
  const assetSlug = assetCreate.json.result.item.assetSlug as string;
  const assetUpdate = await runCampaignCliJson(stores, [
    "asset",
    "update",
    "--campaign",
    "campaign-fork",
    "--asset",
    assetSlug,
    "--input-json",
    JSON.stringify({
      title: "Black-Briar Dose",
      summary: "A narcotic sacrament brewed for the condemned.",
      modifier: "Numbing",
      noun: "Dose",
      nounDescription: "A vial of dark anesthetic resin.",
      adjectiveDescription: "It dulls fear before it dulls pain.",
      iconUrl: "https://example.com/dose.png",
      overlayUrl: "",
      content: "# Black-Briar Dose\n\nIt buys courage at a cost.",
    }),
  ]);
  assert.equal(assetUpdate.exitCode, 0);

  const locationCreate = await runCampaignCliJson(stores, [
    "location",
    "create",
    "--campaign",
    "campaign-fork",
    "--input-json",
    JSON.stringify({ title: "Prayer Engine" }),
  ]);
  const locationSlug = locationCreate.json.result.item.locationSlug as string;
  const locationUpdate = await runCampaignCliJson(stores, [
    "location",
    "update",
    "--campaign",
    "campaign-fork",
    "--location",
    locationSlug,
    "--input-json",
    JSON.stringify({
      title: "Prayer Engine",
      summary: "An engine room fed by ritual and scrap.",
      titleImageUrl: null,
      introductionMarkdown: "The pistons answer louder to prayer than to tools.",
      descriptionMarkdown: "This chamber runs on vows, blood, and improvised repairs.",
      mapImageUrl: null,
      mapPins: [],
    }),
  ]);
  assert.equal(locationUpdate.exitCode, 0);

  const encounterCreate = await runCampaignCliJson(stores, [
    "encounter",
    "create",
    "--campaign",
    "campaign-fork",
    "--input-json",
    JSON.stringify({ title: "Boarding Hymn" }),
  ]);
  const encounterSlug = encounterCreate.json.result.item.encounterSlug as string;
  const encounterUpdate = await runCampaignCliJson(stores, [
    "encounter",
    "update",
    "--campaign",
    "campaign-fork",
    "--encounter",
    encounterSlug,
    "--input-json",
    JSON.stringify({
      title: "Boarding Hymn",
      summary: "Cult raiders dock and start singing through the hull.",
      prerequisites: "The corvette has reached open space.",
      titleImageUrl: null,
      content: "# Boarding Hymn\n\nThe raiders chant in perfect harmony with the engine pulse.",
    }),
  ]);
  assert.equal(encounterUpdate.exitCode, 0);

  const questCreate = await runCampaignCliJson(stores, [
    "quest",
    "create",
    "--campaign",
    "campaign-fork",
    "--input-json",
    JSON.stringify({ title: "Keep the Condemned Alive" }),
  ]);
  const questSlug = questCreate.json.result.item.questSlug as string;
  const questUpdate = await runCampaignCliJson(stores, [
    "quest",
    "update",
    "--campaign",
    "campaign-fork",
    "--quest",
    questSlug,
    "--input-json",
    JSON.stringify({
      title: "Keep the Condemned Alive",
      summary: "Protect the crew until the first stable jump.",
      titleImageUrl: null,
      content: "# Keep the Condemned Alive\n\nEvery scene asks who gets to stay human.",
    }),
  ]);
  assert.equal(questUpdate.exitCode, 0);

  for (const [resource, slugFlag, slug] of [
    ["actor", "--actor", actorSlug],
    ["counter", "--counter", counterSlug],
    ["asset", "--asset", assetSlug],
    ["location", "--location", locationSlug],
    ["encounter", "--encounter", encounterSlug],
    ["quest", "--quest", questSlug],
  ] as const) {
    const getResource = await runCampaignCliJson(stores, [
      resource,
      "get",
      "--campaign",
      "campaign-fork",
      slugFlag,
      slug,
    ]);
    assert.equal(getResource.exitCode, 0);

    const deleteResource = await runCampaignCliJson(stores, [
      resource,
      "delete",
      "--campaign",
      "campaign-fork",
      slugFlag,
      slug,
    ]);
    assert.equal(deleteResource.exitCode, 0);
  }

  const list = await runCampaignCliJson(stores, ["list"]);
  assert.equal(list.exitCode, 0);
  assert.equal(list.json.result.campaigns.length, 1);

  const deleteCampaign = await runCampaignCliJson(stores, [
    "delete",
    "--slug",
    "campaign-fork",
  ]);
  assert.equal(deleteCampaign.exitCode, 0);
  assert.equal(deleteCampaign.json.result.deleted, true);
});
