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

test("AdventureModuleTabNav exposes a header-friendly section menu", () => {
  const source = readFileSync(
    new URL("../components/adventure-module/AdventureModuleTabNav.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /leadingContent\?: ReactNode/);
  assert.match(source, /trailingContent\?: ReactNode/);
  assert.match(source, /showMobileMenu\?: boolean/);
  assert.ok(source.includes("AdventureModuleSectionMenu"));
  assert.ok(source.includes("Dropdown"));
  assert.ok(source.includes('menuOpen ? "Close" : "Open"'));
  assert.ok(source.includes("activeLabel"));
  assert.ok(source.includes("flex flex-wrap items-center gap-2"));
  assert.ok(source.includes("order-2 lg:order-4 lg:hidden"));
  assert.ok(source.includes("order-4 hidden min-w-0 flex-1 lg:order-2 lg:flex"));
  assert.ok(source.includes("order-3 shrink-0 ml-auto lg:ml-0 lg:order-3"));
  assert.ok(source.includes("w-fit min-w-[12rem] max-w-[calc(100vw-1rem)]"));
  assert.ok(source.includes("stack w-fit gap-1.5"));
  assert.ok(source.includes("\\u25b8"));
  assert.equal((source.match(/\\u25b8/g) ?? []).length, 1);
  assert.ok(source.includes("w-full min-h-11 items-center"));
  assert.ok(source.includes("border-kac-iron/60 bg-transparent"));
});

test("Page primary nav includes Campaigns", () => {
  const source = readFileSync(
    new URL("../components/layout/Page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /to: "\/campaign\/list"/);
  assert.match(source, /label: "Campaigns"/);
});
