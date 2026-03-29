import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignSessionLobbyPage offers role join and invite flows", () => {
  const source = readFileSync(
    new URL("./CampaignSessionLobbyPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /ShareLinkOverlay/);
  assert.match(source, /useCampaignSession/);
  assert.match(source, /joinSession/);
  assert.match(source, /joinRole/);
  assert.match(source, /Join as Player/);
  assert.match(source, /Join as Storyteller/);
  assert.match(source, /Invite players/);
  assert.match(source, /addMock/);
});

test("CampaignSessionPlayerPage supports claim, create, and group chat", () => {
  const source = readFileSync(
    new URL("./CampaignSessionPlayerPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /useCampaignSession/);
  assert.match(source, /claimCharacter/);
  assert.match(source, /createCharacter/);
  assert.match(source, /sendMessage/);
  assert.match(source, /Create a New Character/);
  assert.match(source, /Claim This Character/);
  assert.match(source, /Group Chat/);
});
