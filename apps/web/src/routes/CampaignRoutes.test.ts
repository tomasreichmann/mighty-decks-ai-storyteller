import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the campaign list, detail, and session routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /CampaignListPage/);
  assert.match(source, /CampaignAuthoringPage/);
  assert.match(source, /CampaignSessionLobbyPage/);
  assert.match(source, /CampaignSessionPlayerPage/);
  assert.match(
    source,
    /path="\/campaign\/list"\s+element={<CampaignListPage \/>}/,
  );
  assert.match(
    source,
    /path="\/campaign\/:slug\/:tab"\s+element={<CampaignAuthoringPage \/>}/,
  );
  assert.match(
    source,
    /path="\/campaign\/:slug\/:tab\/:entityId"\s+element={<CampaignAuthoringPage \/>}/,
  );
  assert.match(
    source,
    /path="\/campaign\/:campaignSlug\/session\/:sessionId"\s+element={<CampaignSessionLobbyPage \/>}/,
  );
  assert.match(
    source,
    /path="\/campaign\/:campaignSlug\/session\/:sessionId\/player"\s+element={<CampaignSessionPlayerPage \/>}/,
  );
  assert.match(
    source,
    /path="\/campaign\/:campaignSlug\/session\/:sessionId\/storyteller\/:tab"\s+element={<CampaignAuthoringPage \/>}/,
  );
  assert.match(
    source,
    /path="\/campaign\/:campaignSlug\/session\/:sessionId\/storyteller\/:tab\/:entityId"\s+element={<CampaignAuthoringPage \/>}/,
  );
});

test("Page primary nav includes Campaigns", () => {
  const source = readFileSync(
    new URL("../components/layout/Page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /to: "\/campaign\/list"/);
  assert.match(source, /label: "Campaigns"/);
});
