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
  assert.match(source, /ConnectionStatusPill/);
  assert.match(source, /formatSessionCreatedAt/);
  assert.match(source, /resolveSessionStatusTone/);
  assert.match(source, /moduleDetail\.sessions \?\? \[\]\)\.length > 0[\s\S]*<Message[\s\S]*label=\{\`Session \$\{session\.sessionId\}\`\}/);
  assert.match(source, /Created: \{formatSessionCreatedAt\(session\.createdAtIso\)\}/);
  assert.match(source, /<ConnectionStatusPill[\s\S]*label="Status"[\s\S]*detail=\{session\.status\}/);
  assert.match(source, /Storytellers: \{session\.storytellerCount\} \| Players: \{session\.playerCount\}/);
  assert.match(source, /session\.transcriptPreview \?\? "No transcript yet\."/);
  assert.match(source, /flex-1/);
  assert.match(source, /<Button[\s\S]*color="gold"[\s\S]*href=\{`\/campaign\/\$\{encodeURIComponent\(moduleDetail\.index\.slug\)\}\/session\/\$\{encodeURIComponent\(session\.sessionId\)\}`\}[\s\S]*Join/);
  assert.doesNotMatch(source, /Open Storyteller View/);
  assert.doesNotMatch(source, /Open Lobby/);
  assert.match(source, /handleSendStorytellerMessage/);
  assert.match(source, /handleCloseStorytellerSession/);
  assert.match(source, /handleSendSelectionToTarget/);
  assert.match(source, /CampaignSessionSelectionStrip/);
  assert.match(
    source,
    /storytellerSessionMode && tableSelection\.length > 0 \? \(\s*<CampaignSessionSelectionStrip/,
  );
  assert.match(source, /CampaignSessionTable/);
  assert.match(source, /CampaignSessionChatLayout/);
  assert.match(source, /sessionRealtime\.addTableCards/);
  assert.match(source, /sessionRealtime\.removeTableCard/);
  assert.match(source, /storytellerSession\?\.transcript/);
  assert.match(source, /CampaignSessionTranscriptFeed/);
  assert.match(source, /MarkdownImageInsertButton/);
  assert.match(source, /storytellerSessionMode[\s\S]*leadingContent=\{/);
  assert.match(source, /storytellerSessionMode[\s\S]*to="\/"[\s\S]*mighty-decks-ai-storyteller-logo\.png/);
  assert.match(source, /storytellerSessionMode[\s\S]*trailingContent=\{[\s\S]*<AutosaveStatusBadge/);
  assert.match(
    source,
    /activeTab === "chat"[\s\S]*<CampaignSessionChatLayout[\s\S]*<DepressedInput[\s\S]*label="Message"[\s\S]*topRightControl=\{/,
  );
  assert.match(
    source,
    /activeTab === "chat"[\s\S]*paper-shadow/,
  );
  assert.match(source, /handleStorytellerMessageKeyDown/);
  assert.match(source, /event\.shiftKey\s*\|\|\s*event\.ctrlKey\s*\|\|\s*event\.metaKey\s*\|\|\s*event\.altKey/);
  assert.match(source, />\s*Send\s*</);
  assert.match(source, /Press Enter to send\. Shift\+Enter for newline\./);
  assert.doesNotMatch(source, /GeneratedMarkdownImageInsertPanel/);
  assert.doesNotMatch(source, /Send to Group Chat/);
  assert.doesNotMatch(source, /<Panel\s+key=\{session\.sessionId\}/);
});

test("CampaignAuthoringPage uses AdventureModuleTabNav as the non-session header control and keeps storyteller session nav separate", () => {
  const source = readFileSync(
    new URL("./CampaignAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /<AdventureModuleSectionMenu/);
  assert.match(
    source,
    /storytellerSessionMode \? null : \([\s\S]*<AdventureModuleTabNav[\s\S]*leadingContent=\{[\s\S]*<Button[\s\S]*Create Session/,
  );
  assert.match(
    source,
    /storytellerSessionMode \? null : \([\s\S]*<AdventureModuleTabNav[\s\S]*trailingContent=\{[\s\S]*<AutosaveStatusBadge/,
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
  assert.match(source, /storytellerSessionMode \? null : \(\s*<header/);
  assert.match(
    source,
    /activeTab === "chat"[\s\S]*<Section className="stack min-h-0 flex-1 gap-4 overflow-hidden">\s*\{storytellerRealtimeError \?/,
  );
  assert.match(
    source,
    /activeTab === "chat"[\s\S]*className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-2 sm:px-3"/,
  );
  assert.match(
    source,
    /activeTab === "chat"[\s\S]*<CampaignSessionChatLayout[\s\S]*End Session[\s\S]*Press Enter to send\. Shift\+Enter for newline\./,
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
