import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { Server as SocketServer } from "socket.io";
import { io as createSocketClient, type Socket } from "socket.io-client";
import { registerAdventureModuleRoutes } from "../src/adventureModule/registerAdventureModuleRoutes";
import { registerCampaignRoutes } from "../src/campaign/registerCampaignRoutes";
import { registerCampaignSocketHandlers } from "../src/campaign/registerCampaignSocketHandlers";
import { AdventureModuleStore } from "../src/persistence/AdventureModuleStore";
import { CampaignStore } from "../src/persistence/CampaignStore";

type JsonRecord = Record<string, unknown>;

interface SmokeTarget {
  baseUrl: string;
  close: () => Promise<void>;
}

const CREATOR_HEADER = "x-md-module-creator-token";

const trimBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const createSmokeTarget = async (): Promise<SmokeTarget> => {
  const liveBaseUrl = process.env.SMOKE_BASE_URL?.trim();
  if (liveBaseUrl) {
    return {
      baseUrl: trimBaseUrl(liveBaseUrl),
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
  registerCampaignRoutes(app, { store: campaignStore });

  const io = new SocketServer(app.server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
    },
  });
  registerCampaignSocketHandlers(io as never, campaignStore);

  const address = await app.listen({
    host: "127.0.0.1",
    port: 0,
  });

  return {
    baseUrl: trimBaseUrl(address),
    close: async () => {
      io.close();
      await app.close();
    },
  };
};

const apiJson = async <T extends JsonRecord>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${trimBaseUrl(baseUrl)}${path}`, init);
  const text = await response.text();
  const payload =
    text.length > 0 ? (JSON.parse(text) as JsonRecord) : ({}) as JsonRecord;

  if (!response.ok) {
    throw new Error(
      `${init?.method ?? "GET"} ${path} failed with ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return payload as T;
};

const deleteExpectOk = async (
  baseUrl: string,
  path: string,
  headers?: Record<string, string>,
): Promise<void> => {
  const payload = await apiJson<{ deleted: boolean }>(baseUrl, path, {
    method: "DELETE",
    headers,
  });
  assert.equal(payload.deleted, true);
};

const deleteIfPresent = async (
  baseUrl: string,
  path: string,
  headers?: Record<string, string>,
): Promise<void> => {
  const response = await fetch(`${trimBaseUrl(baseUrl)}${path}`, {
    method: "DELETE",
    headers,
  });
  if (response.status === 404) {
    return;
  }
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `DELETE ${path} failed during cleanup with ${response.status}: ${text}`,
    );
  }
};

const connectSocket = async (baseUrl: string): Promise<Socket> =>
  new Promise<Socket>((resolve, reject) => {
    const socket = createSocketClient(trimBaseUrl(baseUrl), {
      reconnection: false,
      timeout: 10_000,
    });

    const onConnect = (): void => {
      socket.off("connect_error", onError);
      resolve(socket);
    };
    const onError = (error: Error): void => {
      socket.off("connect", onConnect);
      socket.close();
      reject(error);
    };

    socket.once("connect", onConnect);
    socket.once("connect_error", onError);
  });

const waitForSessionState = async (
  sockets: readonly Socket[],
  predicate: (state: JsonRecord) => boolean,
  label: string,
): Promise<JsonRecord> =>
  new Promise<JsonRecord>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${label}.`));
    }, 10_000);

    const handleState = (state: unknown): void => {
      if (!state || typeof state !== "object" || Array.isArray(state)) {
        return;
      }
      const candidate = state as JsonRecord;
      if (!predicate(candidate)) {
        return;
      }
      cleanup();
      resolve(candidate);
    };

    const cleanup = (): void => {
      clearTimeout(timeout);
      for (const socket of sockets) {
        socket.off("campaign_session_state", handleState);
      }
    };

    for (const socket of sockets) {
      socket.on("campaign_session_state", handleState);
    }
  });

test("campaign flow smoke covers authored module to active session and cleanup", async (t) => {
  const target = await createSmokeTarget();
  t.after(async () => {
    await target.close();
  });

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const creatorToken = `smoke-${stamp}`;
  const headers = {
    "content-type": "application/json",
    [CREATOR_HEADER]: creatorToken,
  };

  let moduleId: string | undefined;
  let campaignId: string | undefined;
  let campaignSlug: string | undefined;
  let sessionId: string | undefined;
  let storytellerSocket: Socket | undefined;
  let playerSocket: Socket | undefined;

  try {
    const createdModule = await apiJson<{
      index: { moduleId: string };
    }>(target.baseUrl, "/api/adventure-modules", {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "blank",
        title: `Smoke Module ${stamp}`,
      }),
    });
    moduleId = createdModule.index.moduleId;
    assert.equal(typeof moduleId, "string");

    await apiJson(target.baseUrl, `/api/adventure-modules/${moduleId}/actors`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `Smoke Actor ${stamp}`,
        isPlayerCharacter: false,
      }),
    });
    await apiJson(target.baseUrl, `/api/adventure-modules/${moduleId}/counters`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `Smoke Counter ${stamp}`,
      }),
    });
    await apiJson(target.baseUrl, `/api/adventure-modules/${moduleId}/assets`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `Smoke Asset ${stamp}`,
      }),
    });
    await apiJson(target.baseUrl, `/api/adventure-modules/${moduleId}/locations`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `Smoke Location ${stamp}`,
      }),
    });
    await apiJson(target.baseUrl, `/api/adventure-modules/${moduleId}/encounters`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `Smoke Encounter ${stamp}`,
      }),
    });
    await apiJson(target.baseUrl, `/api/adventure-modules/${moduleId}/quests`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `Smoke Quest ${stamp}`,
      }),
    });

    const createdCampaign = await apiJson<{
      campaignId: string;
      index: { slug: string };
    }>(target.baseUrl, "/api/campaigns", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sourceModuleId: moduleId,
        title: `Smoke Campaign ${stamp}`,
      }),
    });
    campaignId = createdCampaign.campaignId;
    campaignSlug = createdCampaign.index.slug;
    assert.equal(typeof campaignId, "string");
    assert.equal(typeof campaignSlug, "string");

    const createdSession = await apiJson<{
      sessionId: string;
      status: string;
    }>(target.baseUrl, `/api/campaigns/${campaignId}/sessions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    sessionId = createdSession.sessionId;
    assert.equal(createdSession.status, "setup");

    storytellerSocket = await connectSocket(target.baseUrl);
    playerSocket = await connectSocket(target.baseUrl);

    const activeStatePromise = waitForSessionState(
      [storytellerSocket, playerSocket],
      (state) => state.status === "active",
      "an active campaign session state",
    );

    storytellerSocket.emit("join_campaign_session_role", {
      campaignSlug,
      sessionId,
      participantId: `storyteller-${stamp}`,
      displayName: "Smoke Storyteller",
      role: "storyteller",
    });
    playerSocket.emit("join_campaign_session_role", {
      campaignSlug,
      sessionId,
      participantId: `player-${stamp}`,
      displayName: "Smoke Player",
      role: "player",
    });

    const activeState = await activeStatePromise;
    assert.equal(activeState.status, "active");

    await deleteExpectOk(
      target.baseUrl,
      `/api/campaigns/${campaignId}/sessions/${sessionId}`,
    );
    sessionId = undefined;

    await deleteExpectOk(target.baseUrl, `/api/campaigns/${campaignId}`);
    campaignId = undefined;
    campaignSlug = undefined;

    await deleteExpectOk(target.baseUrl, `/api/adventure-modules/${moduleId}`, {
      [CREATOR_HEADER]: creatorToken,
    });
    moduleId = undefined;
  } finally {
    storytellerSocket?.disconnect();
    playerSocket?.disconnect();

    if (sessionId && campaignId) {
      await deleteIfPresent(
        target.baseUrl,
        `/api/campaigns/${campaignId}/sessions/${sessionId}`,
      );
    }
    if (campaignId) {
      await deleteIfPresent(target.baseUrl, `/api/campaigns/${campaignId}`);
    }
    if (moduleId) {
      await deleteIfPresent(target.baseUrl, `/api/adventure-modules/${moduleId}`, {
        [CREATOR_HEADER]: creatorToken,
      });
    }
  }
});
