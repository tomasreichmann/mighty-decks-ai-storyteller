import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("useCampaignSession exposes stable ensure-joined helpers and clears stale errors on state", () => {
  const source = readFileSync(
    new URL("./useCampaignSession.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /ensureSessionParticipant/);
  assert.match(source, /ensureSessionRole/);
  assert.match(source, /lastJoinedParticipantIdRef/);
  assert.match(source, /lastJoinedRoleKeyRef/);
  assert.match(source, /setError\(null\)/);
  assert.match(source, /addTableCards/);
  assert.match(source, /removeTableCard/);
  assert.match(source, /add_campaign_session_table_cards/);
  assert.match(source, /remove_campaign_session_table_card/);
});
