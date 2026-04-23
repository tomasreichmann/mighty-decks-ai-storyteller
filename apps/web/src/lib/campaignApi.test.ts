import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("campaignApi exposes campaign CRUD and session helpers", () => {
  const source = readFileSync(new URL("./campaignApi.ts", import.meta.url), "utf8");

  assert.match(source, /listCampaigns/);
  assert.match(source, /createCampaign/);
  assert.match(source, /getCampaignBySlug/);
  assert.match(source, /createCampaignSession/);
  assert.match(source, /listCampaignSessions/);
  assert.match(source, /getCampaignSession/);
  assert.match(source, /updateCampaignIndex/);
  assert.match(source, /updateCampaignActor/);
  assert.match(source, /\/api\/campaigns/);
  assert.match(source, /\/sessions/);
});

test("campaignApi exposes top-level campaign deletion", () => {
  const source = readFileSync(new URL("./campaignApi.ts", import.meta.url), "utf8");

  assert.match(source, /deleteCampaign/);
  assert.match(source, /campaignDeleteResponseSchema/);
  assert.match(source, /method: "DELETE"/);
  assert.match(source, /\/api\/campaigns\/\$\{encodeURIComponent\(campaignId\)\}/);
});

test("campaignApi uses campaign socket event payload types for session flows", () => {
  const source = readFileSync(new URL("./socket.ts", import.meta.url), "utf8");

  assert.match(source, /CampaignClientToServerEvents/);
  assert.match(source, /CampaignServerToClientEvents/);
});
