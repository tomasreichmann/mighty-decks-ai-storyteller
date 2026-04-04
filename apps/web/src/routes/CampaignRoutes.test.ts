import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the campaign list, detail, and session routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /CampaignListPage/);
  assert.match(source, /CampaignAuthoringPage/);
  assert.match(source, /CampaignSessionLobbyPage/);
  assert.match(source, /CampaignSessionPlayerPage/);
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
    /<Route element={<CampaignPlayerSessionLayout \/>}>[\s\S]*path="\/campaign\/:campaignSlug\/session\/:sessionId\/player\/\*"\s+element={<CampaignSessionPlayerPage \/>}/,
  );
  assert.match(
    source,
    /<Route element={<CampaignStorytellerSessionLayout \/>}>[\s\S]*path="\/campaign\/:campaignSlug\/session\/:sessionId\/storyteller\/:tab"\s+element={<CampaignAuthoringPage \/>}/,
  );
  assert.match(
    source,
    /<Route element={<CampaignStorytellerSessionLayout \/>}>[\s\S]*path="\/campaign\/:campaignSlug\/session\/:sessionId\/storyteller\/:tab\/:entityId"\s+element={<CampaignAuthoringPage \/>}/,
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

test("AdventureModuleTabNav supports responsive session chrome slots", () => {
  const source = readFileSync(
    new URL("../components/adventure-module/AdventureModuleTabNav.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /leadingContent\?: ReactNode/);
  assert.match(source, /trailingContent\?: ReactNode/);
  assert.match(source, /useLocation/);
  assert.match(source, /aria-expanded=\{menuOpen\}/);
  assert.match(source, /xl:hidden/);
  assert.match(source, /hidden min-w-0 flex-1 xl:flex/);
  assert.match(source, /menuOpen \? "flex flex-col" : "hidden"/);
});

test("Page primary nav includes Campaigns", () => {
  const source = readFileSync(
    new URL("../components/layout/Page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /to: "\/campaign\/list"/);
  assert.match(source, /label: "Campaigns"/);
});
