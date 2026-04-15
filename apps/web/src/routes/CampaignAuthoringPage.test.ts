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

  assert.match(
    source,
    /const STORYTELLER_SESSION_TABS = \[[\s\S]*"chat"[\s\S]*"outcomes"[\s\S]*"effects"[\s\S]*"stunts"[\s\S]*"actors"[\s\S]*"static-assets"[\s\S]*"assets"[\s\S]*\] as const;/,
  );
  assert.match(source, /"sessions"/);
  assert.match(source, /sessions: "Sessions"/);
  assert.match(source, /"chat"/);
  assert.match(source, /chat: "Chat"/);
  assert.match(source, /outcomes: "Outcomes"/);
  assert.match(source, /effects: "Effects"/);
  assert.match(source, /stunts: "Stunts"/);
  assert.match(source, /"static-assets": "Static Assets"/);
  assert.match(source, /storytellerSessionMode && tabId === "assets"\s*\?\s*"Custom Assets"/);
  assert.match(source, /Create Session/);
  assert.match(source, /createCampaignSession/);
  assert.match(source, /campaignUpdatedAtIso/);
  assert.match(source, /CampaignSessionsTabContent/);
  assert.match(source, /CampaignStorytellerSessionTabContent/);
  assert.match(source, /handleSendStorytellerMessage/);
  assert.match(source, /handleCloseStorytellerSession/);
  assert.match(source, /handleSendSelectionToTarget/);
  assert.match(source, /CampaignSessionSelectionStrip/);
  assert.match(
    source,
    /storytellerSessionMode && tableSelection\.length > 0 \? \(\s*<CampaignSessionSelectionStrip/,
  );
  assert.match(source, /sessionRealtime\.addTableCards/);
  assert.match(source, /sessionRealtime\.removeTableCard/);
  assert.match(source, /MarkdownImageInsertButton/);
  assert.match(source, /messageInputTopRightControl=\{/);
  assert.match(source, /tableSelectionCount=\{tableSelection\.length\}/);
  assert.match(source, /storytellerSessionMode \? \(\s*<AdventureModuleTabNav[\s\S]*leadingContent=\{/);
  assert.match(source, /storytellerSessionMode \? \(\s*<AdventureModuleTabNav[\s\S]*to="\/"[\s\S]*mighty-decks-ai-storyteller-logo\.png/);
  assert.match(source, /storytellerSessionMode \? \(\s*<AdventureModuleTabNav[\s\S]*trailingContent=\{[\s\S]*<AutosaveStatusBadge/);
  assert.match(source, /handleStorytellerMessageKeyDown/);
  assert.match(source, /event\.shiftKey\s*\|\|\s*event\.ctrlKey\s*\|\|\s*event\.metaKey\s*\|\|\s*event\.altKey/);
  assert.doesNotMatch(source, /GeneratedMarkdownImageInsertPanel/);
  assert.doesNotMatch(source, /Send to Group Chat/);
});

test("CampaignAuthoringPage uses AdventureModuleTabNav as the non-session header control and keeps storyteller session nav separate", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /<AdventureModuleSectionMenu/);
  assert.match(
    source,
    /storytellerSessionMode \? null : \([\s\S]*<SharedAuthoringHeader[\s\S]*titleRowTrailingContent=\{[\s\S]*<CTAButton[\s\S]*containerClassName="hidden lg:inline-flex"[\s\S]*Create Session/,
  );
  assert.match(
    source,
    /storytellerSessionMode \? null : \([\s\S]*<SharedAuthoringHeader[\s\S]*navLeadingContent=\{[\s\S]*<CTAButton[\s\S]*containerClassName="lg:hidden"[\s\S]*Create Session/,
  );
  assert.match(
    source,
    /storytellerSessionMode \? null : \([\s\S]*<SharedAuthoringHeader[\s\S]*navTrailingContent=\{[\s\S]*<AutosaveStatusBadge/,
  );
  assert.match(
    source,
    /storytellerSessionMode \? \(\s*<AdventureModuleTabNav[\s\S]*showMobileMenu=\{storytellerSessionMode\}/,
  );
});

test("CampaignAuthoringPage uses a compact full-width shell in storyteller session mode", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /storytellerSessionMode\s*\?\s*"[^"]*min-h-full[^"]*w-full[^"]*max-w-none[^"]*flex-1[^"]*px-4 py-4 sm:px-6 lg:px-8[^"]*"/,
  );
  assert.match(source, /storytellerSessionMode \? null : \(\s*<SharedAuthoringHeader/);
  assert.match(
    source,
    /CampaignStorytellerSessionTabContent/,
  );
  assert.match(
    source,
    /CampaignSessionsTabContent/,
  );
  assert.match(
    source,
    /CampaignStorytellerSessionTabContent[\s\S]*onCloseSession=\{/,
  );
  assert.match(source, /activeTab === "chat" \? \(\s*storytellerSessionTabContent/);
});

test("CampaignAuthoringPage watches campaign updates outside active sessions", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /watchCampaign/);
  assert.match(source, /unwatchCampaign/);
});

test("CampaignAuthoringPage imports shared authoring foundation while keeping session features campaign-local", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /SharedAuthoringHeader/);
  assert.match(source, /CommonAuthoringTabContent/);
  assert.match(source, /\.\.\/lib\/authoring\//);
  assert.match(source, /CampaignSessionsTabContent/);
  assert.match(source, /CampaignStorytellerSessionTabContent/);
});
