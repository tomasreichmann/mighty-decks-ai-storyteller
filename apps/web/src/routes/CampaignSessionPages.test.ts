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
  assert.match(source, /ensureSessionParticipant/);
  assert.match(source, /ensureSessionRole/);
  assert.match(source, /selectedRole/);
  assert.match(source, /ConnectionStatusPill/);
  assert.match(source, /CTAButton/);
  assert.match(source, /ButtonRadioGroup/);
  assert.match(source, /<TextField[\s\S]*label="Name"/);
  assert.match(source, /Session/);
  assert.match(source, /♟️/);
  assert.match(source, /🖥️/);
  assert.match(source, /<span>Player<\/span>/);
  assert.match(source, /<span>Storyteller<\/span>/);
  assert.match(source, /Invite players/);
  assert.match(source, /addMock/);
  assert.match(source, /max-w-\[20rem\]/);
  assert.match(source, /max-w-\[18rem\]/);
  assert.match(source, /Dev Mock Seats/);
  assert.match(source, /<Message label="Dev Mock Seats" color="cloth"/);
  assert.doesNotMatch(
    source,
    /Claim or create a character, then enter the session transcript\./,
  );
  assert.doesNotMatch(source, /Session Status/);
  assert.doesNotMatch(source, /Campaign Session Lobby/);
  assert.doesNotMatch(source, /Dev Utility/);
  assert.doesNotMatch(source, /<Panel/);
});

test("CampaignSessionPlayerPage supports claim, create, and a transcript-first flow", () => {
  const source = readFileSync(
    new URL("./CampaignSessionPlayerPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /useCampaignSession/);
  assert.match(source, /ensureSessionRole/);
  assert.match(source, /claimCharacter/);
  assert.match(source, /createCharacter/);
  assert.match(source, /sendMessage/);
  assert.match(source, /ActorCard/);
  assert.match(source, /Claim a Character/);
  assert.match(source, /Create a New Character/);
  assert.match(source, />\s*Create\s*</);
  assert.match(source, /flex justify-end/);
  assert.match(source, /Claim This Character/);
  assert.match(source, /Transcript/);
  assert.match(source, /CampaignSessionTranscriptFeed/);
  assert.match(source, /DepressedInput/);
  assert.match(source, /<DepressedInput[\s\S]*label="Add to Transcript"/);
  assert.match(source, /paper-shadow/);
  assert.doesNotMatch(source, /Group Chat/);
  assert.doesNotMatch(source, /Claim an Existing Character/);
  assert.doesNotMatch(
    source,
    /max-h-\[24rem\] overflow-y-auto rounded-sm border-2 border-kac-iron\/15/,
  );
  assert.doesNotMatch(source, /import\s+\{\s*TextArea\s*\}/);
});
