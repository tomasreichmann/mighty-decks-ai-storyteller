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

  public on(event: string, handler: (socket: FakeSocket) => void): void {
    if (event === "connection") {
      this.connectionHandler = handler;
    }
  }

  public connect(socket: FakeSocket): void {
    this.connectionHandler?.(socket);
  }

  public to(room: string) {
    return {
      emit: (event: string, payload: unknown) => {
        this.emitted.push({ room, event, payload });
      },
    };
  }
}

const createFixture = async () => {
  const sourceRootDir = mkdtempSync(join(tmpdir(), "mighty-decks-campaign-socket-source-"));
  const campaignRootDir = mkdtempSync(join(tmpdir(), "mighty-decks-campaign-socket-target-"));
  const sourceStore = new AdventureModuleStore({ rootDir: sourceRootDir });
  await sourceStore.initialize();
  const store = new CampaignStore({
    rootDir: campaignRootDir,
    sourceModuleStore: sourceStore,
  });
  await store.initialize();

  const source = await sourceStore.createModule({
    creatorToken: "source-owner",
    title: "Flooded Bells",
  });
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
