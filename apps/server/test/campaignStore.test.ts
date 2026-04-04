import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AdventureModuleStore } from "../src/persistence/AdventureModuleStore";
import { CampaignStore, CampaignValidationError } from "../src/persistence/CampaignStore";

const createStores = async () => {
  const sourceRootDir = mkdtempSync(join(tmpdir(), "mighty-decks-campaign-source-"));
  const campaignRootDir = mkdtempSync(join(tmpdir(), "mighty-decks-campaign-target-"));
  const sourceStore = new AdventureModuleStore({ rootDir: sourceRootDir });
  await sourceStore.initialize();
  const store = new CampaignStore({
    rootDir: campaignRootDir,
    sourceModuleStore: sourceStore,
  });
  await store.initialize();
  return { sourceStore, store };
};

const flagPrimaryActorAsPlayerCharacter = async (
  sourceStore: AdventureModuleStore,
  moduleId: string,
) => {
  const current = await sourceStore.getModule(moduleId, "source-owner");
  assert.ok(current);
  await sourceStore.updateActor({
    moduleId,
    actorSlug: "primary-actor",
    creatorToken: "source-owner",
    title: "Bell Runner",
    summary: "Fast enough to slip between rising floodgates.",
    baseLayerSlug: "civilian",
    tacticalRoleSlug: "pawn",
    isPlayerCharacter: true,
    content: "# Bell Runner\n\nReady to be claimed by a player.",
  });
};

test("creates and lists campaigns from source adventure modules", async () => {
  const { sourceStore, store } = await createStores();
  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Flooded Bells",
  });
  await flagPrimaryActorAsPlayerCharacter(sourceStore, source.index.moduleId);

  const created = await store.createCampaign({
    sourceModuleId: source.index.moduleId,
    title: "Flooded Bells Campaign",
  });

  assert.equal(created.index.title, "Flooded Bells Campaign");
  assert.equal(created.sourceModuleId, source.index.moduleId);
  assert.equal(created.sourceModuleSlug, source.index.slug);
  assert.equal(created.sourceModuleTitle, source.index.title);
  assert.equal(created.actors.some((actor) => actor.isPlayerCharacter), true);
  assert.equal(created.sessions.length, 0);

  const listed = await store.listCampaigns();
  assert.equal(listed.length, 1);
  assert.equal(listed[0]?.campaignId, created.campaignId);
  assert.equal(listed[0]?.sessionCount, 0);
  assert.equal(listed[0]?.activeSessionCount, 0);

  const loaded = await store.getCampaignBySlug(created.index.slug);
  assert.ok(loaded);
  assert.equal(loaded?.campaignId, created.campaignId);
  assert.equal(loaded?.actors.some((actor) => actor.isPlayerCharacter), true);
});

test("persists session lifecycle, claims, chat, and close semantics", async () => {
  const { sourceStore, store } = await createStores();
  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Clock Market",
  });
  await flagPrimaryActorAsPlayerCharacter(sourceStore, source.index.moduleId);
  const campaign = await store.createCampaign({
    sourceModuleId: source.index.moduleId,
    title: "Clock Market Campaign",
  });

  const session = await store.createSession({
    campaignSlug: campaign.index.slug,
  });
  assert.equal(session.status, "setup");
  assert.equal(session.transcript[0]?.kind, "system");

  const withStoryteller = await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
    displayName: "Morgan",
    role: "storyteller",
  });
  assert.equal(withStoryteller.status, "setup");

  const active = await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player",
    displayName: "Jun",
    role: "player",
  });
  assert.equal(active.status, "active");

  const playerCharacter = campaign.actors.find((actor) => actor.isPlayerCharacter);
  assert.ok(playerCharacter);

  const claimed = await store.claimSessionCharacter({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player",
    actorFragmentId: playerCharacter.fragmentId,
  });
  assert.equal(claimed.claims[0]?.actorFragmentId, playerCharacter.fragmentId);

  const chatted = await store.appendSessionGroupMessage({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player",
    text: "I kick the sluice lever into place.",
  });
  assert.equal(chatted.transcript.at(-1)?.kind, "group_message");

  const closed = await store.closeSession({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
  });
  assert.equal(closed.status, "closed");
  assert.equal(closed.claims.length, 0);
  assert.equal(typeof closed.closedAtIso, "string");

  const reloadedCampaign = await store.getCampaignBySlug(campaign.index.slug);
  assert.ok(reloadedCampaign);
  assert.equal(reloadedCampaign?.sessions[0]?.status, "closed");
  assert.equal(reloadedCampaign?.sessions[0]?.transcriptEntryCount, closed.transcript.length);
});

test("creates new player characters inside a session and prevents duplicate claims", async () => {
  const { sourceStore, store } = await createStores();
  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Lantern District",
  });
  const campaign = await store.createCampaign({
    sourceModuleId: source.index.moduleId,
    title: "Lantern District Campaign",
  });
  const session = await store.createSession({
    campaignSlug: campaign.index.slug,
  });

  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
    displayName: "Morgan",
    role: "storyteller",
  });
  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player-a",
    displayName: "Jun",
    role: "player",
  });
  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player-b",
    displayName: "Tala",
    role: "player",
  });

  const afterCreate = await store.createSessionPlayerCharacter({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player-a",
    title: "Flood Scout Nera",
  });
  const createdClaim = afterCreate.claims.find(
    (claim) => claim.participantId === "participant-player-a",
  );
  assert.ok(createdClaim);

  await assert.rejects(
    () =>
      store.claimSessionCharacter({
        campaignSlug: campaign.index.slug,
        sessionId: session.sessionId,
        participantId: "participant-player-b",
        actorFragmentId: createdClaim.actorFragmentId,
      }),
    CampaignValidationError,
  );

  const reloadedCampaign = await store.getCampaignBySlug(campaign.index.slug);
  assert.ok(reloadedCampaign);
  const createdActor = reloadedCampaign?.actors.find(
    (actor) => actor.fragmentId === createdClaim.actorFragmentId,
  );
  assert.ok(createdActor);
  assert.equal(createdActor?.isPlayerCharacter, true);
});

test("supports multiple active sessions on the same campaign", async () => {
  const { sourceStore, store } = await createStores();
  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Bridge of Salt",
  });
  await flagPrimaryActorAsPlayerCharacter(sourceStore, source.index.moduleId);
  const campaign = await store.createCampaign({
    sourceModuleId: source.index.moduleId,
    title: "Bridge of Salt Campaign",
  });

  const first = await store.createSession({ campaignSlug: campaign.index.slug });
  const second = await store.createSession({ campaignSlug: campaign.index.slug });

  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: first.sessionId,
    participantId: "gm-a",
    displayName: "Morgan",
    role: "storyteller",
  });
  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: first.sessionId,
    participantId: "player-a",
    displayName: "Jun",
    role: "player",
  });
  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: second.sessionId,
    participantId: "gm-b",
    displayName: "Tala",
    role: "storyteller",
  });
  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: second.sessionId,
    participantId: "player-b",
    displayName: "Ivo",
    role: "player",
  });

  const listed = await store.listCampaigns();
  assert.equal(listed[0]?.activeSessionCount, 2);

  const reloaded = await store.getCampaignBySlug(campaign.index.slug);
  assert.ok(reloaded);
  assert.equal(reloaded?.sessions.length, 2);
  assert.equal(
    reloaded?.sessions.filter((candidate) => candidate.status === "active").length,
    2,
  );
});

test("storytellers can add shared and player-targeted table cards while preserving duplicates", async () => {
  const { sourceStore, store } = await createStores();
  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Flooded Bells",
  });
  await flagPrimaryActorAsPlayerCharacter(sourceStore, source.index.moduleId);
  const campaign = await store.createCampaign({
    sourceModuleId: source.index.moduleId,
    title: "Flooded Bells Campaign",
  });
  const session = await store.createSession({
    campaignSlug: campaign.index.slug,
  });

  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
    displayName: "Morgan",
    role: "storyteller",
  });
  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player",
    displayName: "Jun",
    role: "player",
  });

  const withSharedCards = await store.addSessionTableCards({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
    target: { scope: "shared" },
    cards: [
      { type: "EffectCard", slug: "burning" },
      { type: "EffectCard", slug: "burning" },
    ],
  });
  const withPlayerCards = await store.addSessionTableCards({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
    target: {
      scope: "participant",
      participantId: "participant-player",
    },
    cards: [
      { type: "AssetCard", slug: "medieval_lantern" },
    ],
  });

  assert.equal(withSharedCards.table.length, 2);
  assert.equal(withSharedCards.table[0]?.target.scope, "shared");
  assert.equal(withSharedCards.table[1]?.card.slug, "burning");
  assert.equal(withPlayerCards.table.length, 3);
  assert.equal(withPlayerCards.table[2]?.target.scope, "participant");
});

test("table card removal follows storyteller and player ownership permissions", async () => {
  const { sourceStore, store } = await createStores();
  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Flooded Bells",
  });
  await flagPrimaryActorAsPlayerCharacter(sourceStore, source.index.moduleId);
  const campaign = await store.createCampaign({
    sourceModuleId: source.index.moduleId,
    title: "Flooded Bells Campaign",
  });
  const session = await store.createSession({
    campaignSlug: campaign.index.slug,
  });

  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
    displayName: "Morgan",
    role: "storyteller",
  });
  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player-a",
    displayName: "Jun",
    role: "player",
  });
  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player-b",
    displayName: "Ivo",
    role: "player",
  });

  const seeded = await store.addSessionTableCards({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
    target: {
      scope: "participant",
      participantId: "participant-player-a",
    },
    cards: [
      { type: "StuntCard", slug: "power-attack" },
    ],
  });
  const playerOwnedEntryId = seeded.table[0]?.tableEntryId;
  assert.ok(playerOwnedEntryId);

  await assert.rejects(
    () =>
      store.removeSessionTableCard({
        campaignSlug: campaign.index.slug,
        sessionId: session.sessionId,
        participantId: "participant-player-b",
        tableEntryId: playerOwnedEntryId,
      }),
    CampaignValidationError,
  );

  const afterPlayerRemoval = await store.removeSessionTableCard({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player-a",
    tableEntryId: playerOwnedEntryId,
  });
  assert.equal(afterPlayerRemoval.table.length, 0);

  const withSharedEntry = await store.addSessionTableCards({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
    target: { scope: "shared" },
    cards: [{ type: "CounterCard", slug: "threat-clock" }],
  });
  const sharedEntryId = withSharedEntry.table[0]?.tableEntryId;
  assert.ok(sharedEntryId);

  await assert.rejects(
    () =>
      store.removeSessionTableCard({
        campaignSlug: campaign.index.slug,
        sessionId: session.sessionId,
        participantId: "participant-player-a",
        tableEntryId: sharedEntryId,
      }),
    CampaignValidationError,
  );

  const afterStorytellerRemoval = await store.removeSessionTableCard({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
    tableEntryId: sharedEntryId,
  });
  assert.equal(afterStorytellerRemoval.table.length, 0);
});

test("closed sessions reject table mutations", async () => {
  const { sourceStore, store } = await createStores();
  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Flooded Bells",
  });
  await flagPrimaryActorAsPlayerCharacter(sourceStore, source.index.moduleId);
  const campaign = await store.createCampaign({
    sourceModuleId: source.index.moduleId,
    title: "Flooded Bells Campaign",
  });
  const session = await store.createSession({
    campaignSlug: campaign.index.slug,
  });

  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
    displayName: "Morgan",
    role: "storyteller",
  });
  await store.upsertSessionParticipant({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-player",
    displayName: "Jun",
    role: "player",
  });

  const closed = await store.closeSession({
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "participant-storyteller",
  });
  assert.equal(closed.status, "closed");

  await assert.rejects(
    () =>
      store.addSessionTableCards({
        campaignSlug: campaign.index.slug,
        sessionId: session.sessionId,
        participantId: "participant-storyteller",
        target: { scope: "shared" },
        cards: [{ type: "EffectCard", slug: "burning" }],
      }),
    CampaignValidationError,
  );
});
