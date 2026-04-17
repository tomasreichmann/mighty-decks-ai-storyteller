import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the campaign list, detail, and session routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /CampaignListPage/);
  assert.match(source, /CampaignAuthoringPage/);
  assert.match(source, /CampaignSessionLobbyPage/);
  assert.match(source, /CampaignSessionPlayerPage/);
  assert.match(source, /RouteShellBoundary/);
  assert.match(source, /CampaignPlayerSessionLayout/);
  assert.match(source, /CampaignStorytellerSessionLayout/);
  assert.match(source, /hideHeader/);
  assert.match(source, /NoHeaderFitScreenLayout/);
  assert.match(source, /useLocation/);
  assert.match(source, /pathname\.endsWith\("\/chat"\)/);
  assert.match(
    source,
    /CampaignStorytellerSessionLayout[\s\S]*mode=\{inChatRoute \? "fit-screen" : "fit-content"\}/,
  );
  assert.match(
    source,
    /path="\/campaign\/list"[\s\S]*<RouteShellBoundary>[\s\S]*<CampaignListPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /path="\/campaign\/:slug\/:tab"[\s\S]*<RouteShellBoundary>[\s\S]*<CampaignAuthoringPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /path="\/campaign\/:slug\/:tab\/:entityId"[\s\S]*<RouteShellBoundary>[\s\S]*<CampaignAuthoringPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /path="\/campaign\/:campaignSlug\/session\/:sessionId"[\s\S]*<RouteShellBoundary>[\s\S]*<CampaignSessionLobbyPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /<Route element={<CampaignPlayerSessionLayout \/>}>[\s\S]*path="\/campaign\/:campaignSlug\/session\/:sessionId\/player\/\*"[\s\S]*<RouteShellBoundary>[\s\S]*<CampaignSessionPlayerPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /<Route element={<CampaignStorytellerSessionLayout \/>}>[\s\S]*path="\/campaign\/:campaignSlug\/session\/:sessionId\/storyteller\/:tab"[\s\S]*<RouteShellBoundary>[\s\S]*<CampaignAuthoringPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.match(
    source,
    /<Route element={<CampaignStorytellerSessionLayout \/>}>[\s\S]*path="\/campaign\/:campaignSlug\/session\/:sessionId\/storyteller\/:tab\/:entityId"[\s\S]*<RouteShellBoundary>[\s\S]*<CampaignAuthoringPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
  assert.doesNotMatch(
    source,
    /path="\/campaign\/:campaignSlug\/session\/:sessionId\/player"\s+element={<CampaignSessionPlayerPage \/>}/,
  );
  assert.doesNotMatch(
    source,
    /path="\/campaign\/:campaignSlug\/session\/:sessionId\/player\/chat"\s+element={<CampaignSessionPlayerPage \/>}/,
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
