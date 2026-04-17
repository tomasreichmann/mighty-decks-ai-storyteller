import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignSessionChatLayout provides mobile table/chat switching with ButtonRadioGroup", () => {
  const source = readFileSync(
    new URL("./CampaignSessionChatLayout.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /type MobilePane = "table" \| "chat"/);
  assert.match(source, /defaultMobilePane = "chat"/);
  assert.match(source, /ButtonRadioGroup/);
  assert.match(source, /ariaLabel="Session chat mobile pane"/);
  assert.match(source, /options=\{\[/);
  assert.match(source, /label: "Table"/);
  assert.match(source, /label: "Chat"/);
  assert.match(source, /activeMobilePane === "table"/);
  assert.match(source, /activeMobilePane === "chat"/);
});
