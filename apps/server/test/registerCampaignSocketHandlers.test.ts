import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { AdventureModuleStore } from "../src/persistence/AdventureModuleStore";
import { CampaignStore } from "../src/persistence/CampaignStore";
import { registerCampaignSocketHandlers } from "../src/campaign/registerCampaignSocketHandlers";

class FakeSocket {
  public readonly rooms = new Set<string>();
  public readonly emitted: Array<{ event: string; payload: unknown }> = [];
  private readonly handlers = new Map<string, (payload?: unknown) => unknown>();

  public constructor(public readonly id: string) {}

  public on(event: string, handler: (payload?: unknown) => unknown): void {
    this.handlers.set(event, handler);
  }

  public emit(event: string, payload: unknown): void {
    this.emitted.push({ event, payload });
  }

  public join(room: string): void {
    this.rooms.add(room);
  }

  public leave(room: string): void {
    this.rooms.delete(room);
  }

  public async trigger(event: string, payload?: unknown): Promise<void> {
    await this.handlers.get(event)?.(payload);
  }

  public async disconnect(): Promise<void> {
    await this.handlers.get("disconnect")?.();
  }
}

class FakeIo {
  public readonly emitted: Array<{ room: string; event: string; payload: unknown }> = [];
  private connectionHandler: ((socket: FakeSocket) => void) | null = null;
  private readonly sockets: FakeSocket[] = [];

  public on(event: string, handler: (socket: FakeSocket) => void): void {
    if (event === "connection") {
      this.connectionHandler = handler;
    }
  }

  public connect(socket: FakeSocket): void {
    this.sockets.push(socket);
    this.connectionHandler?.(socket);
  }

  public to(room: string) {
    return {
      emit: (event: string, payload: unknown) => {
        this.emitted.push({ room, event, payload });
        for (const socket of this.sockets) {
          if (socket.rooms.has(room)) {
            socket.emit(event, payload);
          }
        }
      },
    };
  }
}

const createFixture = async () => {
  const sourceRootDir = mkdtempSync(join(tmpdir(), "mighty-decks-campaign-socket-source-"));
  const campaignRootDir = mkdtempSync(join(tmpdir(), "mighty-decks-campaign-socket-target-"));
  const sourceStore = new AdventureModuleStore({ rootDir: sourceRootDir });
  await sourceStore.initialize();
  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Flooded Bells",
  });
  await sourceStore.updateActor({
    moduleId: source.index.moduleId,
    creatorToken: "source-owner",
    actorSlug: "primary-actor",
    title: "Bell Runner",
    summary: "Fast enough to slip between rising floodgates.",
    baseLayerSlug: "civilian",
    tacticalRoleSlug: "pawn",
    isPlayerCharacter: true,
    content: "# Bell Runner\n\nReady to be claimed by a player.",
  });
  const store = new CampaignStore({
    rootDir: campaignRootDir,
    sourceModuleStore: sourceStore,
  });
  await store.initialize();

  const campaign = await store.createCampaign({
    sourceModuleId: source.index.moduleId,
    title: "Flooded Bells Campaign",
  });
  const session = await store.createSession({
    campaignSlug: campaign.index.slug,
  });

  return { store, campaign, session };
};

const lastRoomEvent = (
  io: FakeIo,
  room: string,
  event: string,
) => io.emitted.filter((entry) => entry.room === room && entry.event === event).at(-1);

test("registerCampaignSocketHandlers broadcasts session state for role join, chat, and close", async () => {
  const { store, campaign, session } = await createFixture();
  const io = new FakeIo();
  registerCampaignSocketHandlers(io as never, store);

  const storytellerSocket = new FakeSocket("socket-storyteller");
  io.connect(storytellerSocket);
  await storytellerSocket.trigger("join_campaign_session_role", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "storyteller-1",
    displayName: "Morgan",
    role: "storyteller",
  });

  const playerSocket = new FakeSocket("socket-player");
  io.connect(playerSocket);
  await playerSocket.trigger("join_campaign_session_role", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    displayName: "Jun",
    role: "player",
  });

  const room = `campaign-session:${campaign.index.slug}:${session.sessionId}`;
  const activeState = lastRoomEvent(io, room, "campaign_session_state");
  assert.ok(activeState);
  assert.equal((activeState?.payload as { status: string }).status, "active");

  await playerSocket.trigger("send_campaign_session_message", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    text: "I throw the gate lever.",
  });
  const chatState = lastRoomEvent(io, room, "campaign_session_state");
  assert.equal(
    (chatState?.payload as { transcript: Array<{ kind: string }> }).transcript.at(-1)?.kind,
    "group_message",
  );

  await storytellerSocket.trigger("close_campaign_session", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "storyteller-1",
  });
  const closedState = lastRoomEvent(io, room, "campaign_session_state");
  assert.equal((closedState?.payload as { status: string }).status, "closed");
});

test("registerCampaignSocketHandlers supports outcome deck draws, plays, and shuffles", async () => {
  const { store, campaign, session } = await createFixture();
  const io = new FakeIo();
  registerCampaignSocketHandlers(io as never, store);

  const storytellerSocket = new FakeSocket("socket-storyteller");
  io.connect(storytellerSocket);
  await storytellerSocket.trigger("join_campaign_session_role", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "storyteller-1",
    displayName: "Morgan",
    role: "storyteller",
  });

  const playerSocket = new FakeSocket("socket-player");
  io.connect(playerSocket);
  await playerSocket.trigger("join_campaign_session_role", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    displayName: "Jun",
    role: "player",
  });

  const room = `campaign-session:${campaign.index.slug}:${session.sessionId}`;
  const initialState = lastRoomEvent(io, room, "campaign_session_state");
  assert.ok(initialState);
  assert.equal(
    (initialState?.payload as { outcomePilesByParticipantId: Record<string, { hand: Array<unknown>; deck: Array<unknown> }> }).outcomePilesByParticipantId["player-1"]?.hand.length,
    3,
  );

  await playerSocket.trigger("claim_campaign_session_character", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    actorFragmentId:
      campaign.actors.find((actor) => actor.isPlayerCharacter)?.fragmentId ??
      "missing-actor",
  });

  await playerSocket.trigger("draw_campaign_session_outcome_card", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
  });
  const afterDraw = lastRoomEvent(io, room, "campaign_session_state");
  const drawnPile = (
    afterDraw?.payload as {
      outcomePilesByParticipantId: Record<string, { hand: Array<{ cardId: string }> ; deck: Array<unknown>; discard: Array<unknown> }>;
    }
  ).outcomePilesByParticipantId["player-1"];
  assert.equal(drawnPile?.hand.length, 4);
  assert.equal(drawnPile?.deck.length, 8);

  const selectedCardIds = drawnPile?.hand.slice(0, 2).map((card) => card.cardId) ?? [];
  await playerSocket.trigger("play_campaign_session_outcome_cards", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    cardIds: selectedCardIds,
  });
  const afterPlay = lastRoomEvent(io, room, "campaign_session_state");
  const playedPile = (
    afterPlay?.payload as {
      outcomePilesByParticipantId: Record<string, { hand: Array<unknown>; deck: Array<unknown>; discard: Array<unknown> }>;
      transcript: Array<{ text: string }>;
    }
  ).outcomePilesByParticipantId["player-1"];
  assert.equal(playedPile?.hand.length, 2);
  assert.equal(playedPile?.discard.length, 2);
  assert.match(
    afterPlay?.payload && typeof afterPlay.payload === "object"
      ? String((afterPlay.payload as { transcript: Array<{ text: string }> }).transcript.at(-1)?.text ?? "")
      : "",
    /^Bell Runner played: @outcome\//,
  );

  for (let index = 0; index < 8; index += 1) {
    await playerSocket.trigger("draw_campaign_session_outcome_card", {
      campaignSlug: campaign.index.slug,
      sessionId: session.sessionId,
      participantId: "player-1",
    });
  }
  const beforeShuffle = lastRoomEvent(io, room, "campaign_session_state");
  const emptyDeckPile = (
    beforeShuffle?.payload as {
      outcomePilesByParticipantId: Record<string, { hand: Array<unknown>; deck: Array<unknown>; discard: Array<unknown> }>;
    }
  ).outcomePilesByParticipantId["player-1"];
  assert.equal(emptyDeckPile?.deck.length, 0);
  assert.equal(emptyDeckPile?.discard.length, 2);

  await playerSocket.trigger("shuffle_campaign_session_outcome_deck", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
  });
  const afterShuffle = lastRoomEvent(io, room, "campaign_session_state");
  const shuffledPile = (
    afterShuffle?.payload as {
      outcomePilesByParticipantId: Record<string, { hand: Array<unknown>; deck: Array<unknown>; discard: Array<unknown> }>;
    }
  ).outcomePilesByParticipantId["player-1"];
  assert.equal(shuffledPile?.deck.length, 2);
  assert.equal(shuffledPile?.discard.length, 0);
});

test("registerCampaignSocketHandlers supports explicit mocks and emits campaign refresh on character creation", async () => {
  const { store, campaign, session } = await createFixture();
  const io = new FakeIo();
  registerCampaignSocketHandlers(io as never, store);

  const storytellerSocket = new FakeSocket("socket-storyteller");
  io.connect(storytellerSocket);
  await storytellerSocket.trigger("join_campaign_session_role", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "storyteller-1",
    displayName: "Morgan",
    role: "storyteller",
  });

  const playerSocket = new FakeSocket("socket-player");
  io.connect(playerSocket);
  await playerSocket.trigger("join_campaign_session_role", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    displayName: "Jun",
    role: "player",
  });

  await storytellerSocket.trigger("add_campaign_session_mock", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    displayName: "Mock Guide",
    role: "storyteller",
  });
  const room = `campaign-session:${campaign.index.slug}:${session.sessionId}`;
  const stateWithMock = lastRoomEvent(io, room, "campaign_session_state");
  assert.equal(
    (stateWithMock?.payload as { participants: Array<{ isMock: boolean }> }).participants.some(
      (participant) => participant.isMock,
    ),
    true,
  );

  await playerSocket.trigger("create_campaign_session_character", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    title: "Flood Scout Nera",
  });

  const campaignRefresh = lastRoomEvent(
    io,
    `campaign:${campaign.index.slug}`,
    "campaign_updated",
  );
  assert.ok(campaignRefresh);
  assert.equal(
    typeof (campaignRefresh?.payload as { updatedAtIso: string }).updatedAtIso,
    "string",
  );
});

test("registerCampaignSocketHandlers lets campaign detail clients watch and unwatch campaign updates", async () => {
  const { store, campaign, session } = await createFixture();
  const io = new FakeIo();
  registerCampaignSocketHandlers(io as never, store);

  const watcherSocket = new FakeSocket("socket-watcher");
  io.connect(watcherSocket);

  await watcherSocket.trigger("watch_campaign", {
    campaignSlug: campaign.index.slug,
  });
  assert.equal(watcherSocket.rooms.has(`campaign:${campaign.index.slug}`), true);

  const playerSocket = new FakeSocket("socket-player");
  io.connect(playerSocket);
  await playerSocket.trigger("join_campaign_session_role", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    displayName: "Jun",
    role: "player",
  });

  await playerSocket.trigger("create_campaign_session_character", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    title: "Flood Scout Nera",
  });

  const campaignRefresh = lastRoomEvent(
    io,
    `campaign:${campaign.index.slug}`,
    "campaign_updated",
  );
  assert.ok(campaignRefresh);

  await watcherSocket.trigger("unwatch_campaign", {
    campaignSlug: campaign.index.slug,
  });
  assert.equal(watcherSocket.rooms.has(`campaign:${campaign.index.slug}`), false);
});

test("registerCampaignSocketHandlers broadcasts table updates and enforces removal permissions", async () => {
  const { store, campaign, session } = await createFixture();
  const io = new FakeIo();
  registerCampaignSocketHandlers(io as never, store);

  const storytellerSocket = new FakeSocket("socket-storyteller");
  io.connect(storytellerSocket);
  await storytellerSocket.trigger("join_campaign_session_role", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "storyteller-1",
    displayName: "Morgan",
    role: "storyteller",
  });

  const playerSocket = new FakeSocket("socket-player");
  io.connect(playerSocket);
  await playerSocket.trigger("join_campaign_session_role", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    displayName: "Jun",
    role: "player",
  });

  const room = `campaign-session:${campaign.index.slug}:${session.sessionId}`;

  await storytellerSocket.trigger("add_campaign_session_table_cards", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "storyteller-1",
    target: {
      scope: "participant",
      participantId: "player-1",
    },
    cards: [
      { type: "EffectCard", slug: "burning" },
      { type: "EffectCard", slug: "burning" },
    ],
  });

  const addedState = lastRoomEvent(io, room, "campaign_session_state");
  const table = (addedState?.payload as { table: Array<{ tableEntryId: string }> }).table;
  assert.equal(table.length, 2);

  await playerSocket.trigger("remove_campaign_session_table_card", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    tableEntryId: table[0]?.tableEntryId,
  });
  const removedState = lastRoomEvent(io, room, "campaign_session_state");
  assert.equal(
    (removedState?.payload as { table: Array<unknown> }).table.length,
    1,
  );

  await storytellerSocket.trigger("add_campaign_session_table_cards", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "storyteller-1",
    target: { scope: "shared" },
    cards: [{ type: "CounterCard", slug: "threat-clock" }],
  });
  const withSharedState = lastRoomEvent(io, room, "campaign_session_state");
  const sharedEntryId = (
    withSharedState?.payload as { table: Array<{ target: { scope: string }; tableEntryId: string }> }
  ).table.find((entry) => entry.target.scope === "shared")?.tableEntryId;
  assert.ok(sharedEntryId);

  await playerSocket.trigger("remove_campaign_session_table_card", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    tableEntryId: sharedEntryId,
  });
  assert.equal(
    playerSocket.emitted.at(-1)?.event,
    "campaign_session_error",
  );
});

test("registerCampaignSocketHandlers does not overwrite a joined role with a stale session snapshot", async () => {
  const { store, campaign, session } = await createFixture();
  const io = new FakeIo();
  registerCampaignSocketHandlers(io as never, store);

  const originalGetSession = store.getSession.bind(store);
  let releaseInitialSessionRead: (() => void) | null = null;
  const initialSessionReadHeld = new Promise<void>((resolve) => {
    releaseInitialSessionRead = resolve;
  });
  let holdNextSessionRead = true;

  store.getSession = async (...args) => {
    const result = await originalGetSession(...args);
    if (holdNextSessionRead) {
      holdNextSessionRead = false;
      await initialSessionReadHeld;
    }
    return result;
  };

  const playerSocket = new FakeSocket("socket-player");
  io.connect(playerSocket);

  const joinSessionPromise = playerSocket.trigger("join_campaign_session", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
  });

  await playerSocket.trigger("join_campaign_session_role", {
    campaignSlug: campaign.index.slug,
    sessionId: session.sessionId,
    participantId: "player-1",
    displayName: "Jun",
    role: "player",
  });

  releaseInitialSessionRead?.();
  await joinSessionPromise;

  const playerStates = playerSocket.emitted
    .filter((entry) => entry.event === "campaign_session_state")
    .map((entry) => entry.payload as { participants: Array<{ participantId: string }> });
  assert.ok(playerStates.length >= 2);
  assert.equal(
    playerStates.at(-1)?.participants.some(
      (participant) => participant.participantId === "player-1",
    ),
    true,
  );
});
