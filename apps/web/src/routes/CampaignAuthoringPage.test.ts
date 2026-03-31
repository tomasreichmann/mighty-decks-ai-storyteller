import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignAuthoringPage uses campaign APIs instead of module APIs", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /export const CampaignAuthoringPage/);
  assert.match(source, /getCampaignBySlug/);
  assert.match(source, /createCampaignSession/);
  assert.match(source, /updateCampaignIndex/);
  assert.match(source, /updateCampaignActor/);
  assert.match(source, /updateCampaignLocation/);
});

test("CampaignAuthoringPage includes Sessions and storyteller Chat tabs", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /"sessions"/);
  assert.match(source, /sessions: "Sessions"/);
  assert.match(source, /"chat"/);
  assert.match(source, /chat: "Chat"/);
  assert.match(source, /Create Session/);
  assert.match(source, /createCampaignSession/);
  assert.match(source, /campaignUpdatedAtIso/);
  assert.match(source, /handleSendStorytellerMessage/);
  assert.match(source, /handleCloseStorytellerSession/);
  assert.match(source, /storytellerSession\?\.transcript/);
  assert.match(source, /CampaignSessionTranscriptFeed/);
  assert.match(
    source,
    /activeTab === "chat"[\s\S]*<DepressedInput[\s\S]*label="Add to Transcript"/,
  );
  assert.match(
    source,
    /activeTab === "chat"[\s\S]*paper-shadow/,
  );
  assert.doesNotMatch(source, /Send to Group Chat/);
  assert.doesNotMatch(source, /<Panel\s+key=\{session\.sessionId\}/);
});

test("CampaignAuthoringPage uses a read-only full-width header in storyteller session mode", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /storytellerSessionMode\s*\?\s*"[^"]*w-full max-w-none px-4 py-8 sm:px-6 lg:px-8[^"]*"/,
  );
  assert.match(source, /storytellerSessionMode \|\| !editable \? \(/);
  assert.match(source, /<Text variant="h3" color="iron">/);
  assert.match(source, /storytellerSessionMode \? null : \(/);
  assert.match(
    source,
    /storytellerSessionMode \? \(\s*<Button[\s\S]*Close Session[\s\S]*\) : null/,
  );
  assert.match(
    source,
    /activeTab === "chat"[\s\S]*<Section className="stack gap-4">\s*\{storytellerRealtimeError \?/,
  );
});

test("CampaignAuthoringPage watches campaign updates outside active sessions", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /watchCampaign/);
  assert.match(source, /unwatchCampaign/);
});
